import fs from 'fs-extra';
import path from 'node:path';
import express, {Express} from 'express';
import busboy from 'busboy';
import { WriteStream } from 'node:fs';
import type { BackendAuthProvider } from '@tinacms/datalayer';

// Copied wholesale from @tinacms/cli/src/next/commands/dev-command/server/media.ts
// then modified to use express, authProvider, and onModifyFile / uploadMediaStream for synchronising changes with git

/// Configuration for SimpleMediaHandler
export interface SimpleMediaHandlerOptions {
  /// Provider used for authenticating requests to the Media API
  authProvider: BackendAuthProvider,
  /// Paths used by the PathConfig
  paths: PathConfig,
  /// Callback called whenever the SimpleMediaHandler modifies a file
  onModifyFile?: (path: string) => Promise<void>
}

/// Configuration for SimpleMediaHandler's paths
export interface PathConfig {
  /// Path to the root of the repository
  rootPath: string;
  /// Path from the root of the repository to the public folder of static files, should match config.build.publicFolder
  publicFolder: string;
  /// Path from the public folder to the media folder, should match config.mediaStoreOptions.mediaRoot
  mediaRoot: string;
}

/// SimpleMediaHandler is a express-based backend compatible with SimpleMediaStore
/// and designed for use with SimpleGitProvider.
/// It should be mounted at config.mediaStoreOptions.mediaApiUrl, which defaults to "/api/media"
/// with e.g. rootExpressApp.use("/api/media", SimpleMediaHandler(...))
/// Make sure to register it before TinaCMS's TinaNodeBackend on "/api"
export const SimpleMediaHandler = ({authProvider, paths, onModifyFile}: SimpleMediaHandlerOptions): Express => {
  const mediaRouter = express()
  
  mediaRouter.use(async (req, res, next) => {
    let result = await authProvider.isAuthorized(req, res);
    if (result.isAuthorized) {
      next();
    } else {
      res.status(403);
      res.send(result);
    }
  });
  
  const mediaModel = new MediaModel(paths, onModifyFile);

  mediaRouter.use('/list/', async (req, res, next) => {
    if (req.method != 'GET') return next()
    const folder = decodeURIComponent(req.path);
    const limit = req.query.limit as string | undefined;
    const cursor = req.query.cursor as string | undefined;
    const media = await mediaModel.listMedia({
      searchPath: folder,
      cursor,
      limit,
    });
    res.json(media);
  });
  
  mediaRouter.use('/', async (req, res, next) => {
    if (req.method != 'DELETE') return next()
    const file = decodeURIComponent(req.path);
    const didDelete = await mediaModel.deleteMedia({ searchPath: file });
    res.json(didDelete);
  });

  mediaRouter.use('/upload/', async (req, res, next) => {
    if (req.method != 'POST') return next()
    const bb = busboy({ headers: req.headers });

    bb.on('file', async (_name, file, _info) => {
      const filePath = decodeURIComponent(req.path);
      file.pipe(await mediaModel.uploadMediaStream({ searchPath: filePath }));
    });
    bb.on('error', (error) => {
      res.statusCode = 500;
      if (error instanceof Error) {
        res.json({ message: error });
      } else {
        res.json({ message: 'Unknown error while uploading' });
      }
    });
    bb.on('close', () => {
      res.statusCode = 200;
      res.json({ success: true });
    });
    req.pipe(bb);
  });

  return mediaRouter;
};

const parseMediaFolder = (str: string): string => {
  let returnString = str;
  if (returnString.startsWith('/')) returnString = returnString.substring(1);

  if (returnString.endsWith('/'))
    returnString = returnString.substring(0, returnString.length - 1);

  return returnString;
};

interface MediaArgs {
  searchPath: string;
  cursor?: string;
  limit?: string;
}

interface File {
  src: string;
  filename: string;
  size: number;
}

interface FileRes {
  src: string;
  filename: string;
  size: number;
  isFile: boolean;
}
interface ListMediaRes {
  directories: string[];
  files: File[];
  cursor?: string;
  error?: string;
}

type SuccessRecord = { ok: true } | { ok: false; message: string };

export class MediaModel {
  public readonly rootPath: string;
  public readonly publicFolder: string;
  public readonly mediaRoot: string;
  public readonly onModifyFile?: (path: string) => Promise<void>;
  
  constructor({ rootPath, publicFolder, mediaRoot }: PathConfig, onModifyFile?: (path: string) => Promise<void>) {
    this.rootPath = rootPath;
    this.mediaRoot = mediaRoot;
    this.publicFolder = publicFolder;
    this.onModifyFile = onModifyFile;
  }
  
  async listMedia(args: MediaArgs): Promise<ListMediaRes> {
    try {
      const folderPath = path.join(
        this.rootPath,
        this.publicFolder,
        this.mediaRoot,
        args.searchPath
      );
      const searchPath = parseMediaFolder(args.searchPath);
      // if the path does not exist, return an empty array
      if (!(await fs.pathExists(folderPath))) {
        return {
          files: [],
          directories: [],
        };
      }
      const filesStr = await fs.readdir(folderPath);
      const filesProm: Promise<FileRes>[] = filesStr.map(async (file) => {
        const filePath = path.join(folderPath, file);
        const stat = await fs.stat(filePath);

        let src = `/${file}`;

        const isFile = stat.isFile();

        // It seems like our media manager wants relative paths for dirs.
        if (!isFile) {
          return {
            isFile,
            size: stat.size,
            src,
            filename: file,
          };
        }

        if (searchPath) {
          src = `/${searchPath}${src}`;
        }
        if (this.mediaRoot) {
          src = `/${this.mediaRoot}${src}`;
        }

        return {
          isFile,
          size: stat.size,
          src: src,
          filename: file,
        };
      });

      const offset = Number(args.cursor) || 0;
      const limit = Number(args.limit) || 20;

      const rawItems = await Promise.all(filesProm);
      const sortedItems = rawItems.sort((a, b) => {
        if (a.isFile && !b.isFile) {
          return 1;
        }
        if (!a.isFile && b.isFile) {
          return -1;
        }
        return 0;
      });
      const limitItems = sortedItems.slice(offset, offset + limit);
      const files = limitItems.filter((x) => x.isFile);
      const directories = limitItems.filter((x) => !x.isFile).map((x) => x.src);

      const cursor =
        rawItems.length > offset + limit ? String(offset + limit) : undefined;

      return {
        files,
        directories,
        cursor,
      };
    } catch (error) {
      console.error(error);
      return {
        files: [],
        directories: [],
        error: error?.toString(),
      };
    }
  }
  async deleteMedia(args: MediaArgs): Promise<SuccessRecord> {
    try {
      const fileInRepo = path.join(
        this.publicFolder,
        this.mediaRoot,
        args.searchPath
      );
      const file = path.join(
        this.rootPath,
        fileInRepo
      );
      // ensure the file exists because fs.remove does not throw an error if the file does not exist
      await fs.stat(file);
      await fs.remove(file);
      await this.onModifyFile?.(fileInRepo)
      return { ok: true };
    } catch (error) {
      console.error(error);
      return { ok: false, message: error?.toString() };
    }
  }
  async uploadMediaStream(args: MediaArgs): Promise<WriteStream> {
    const fileInRepo = path.join(
      this.publicFolder,
      this.mediaRoot,
      args.searchPath
    );
    const file = path.join(
      this.rootPath,
      fileInRepo
    );
    // make sure the directory exists before writing the file. This is needed for creating new folders
    await fs.ensureDir(path.dirname(file));
    const result = fs.createWriteStream(file)
    
    result.on('close', async () => {
      try {
        await this.onModifyFile?.(file)
      } catch (e) {
        console.error(e)
      }
    })
    
    return result
  }
}

export default SimpleMediaHandler;
