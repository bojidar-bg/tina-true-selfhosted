# A cooler media store for TinaCMS

So.. we've all been there. You read that TinaCMS offers you [Repo-based Media storage](https://tina.io/docs/reference/media/repo-based)... however, when you look at [the issue list](https://github.com/tinacms/tinacms/issues/4486), you find out that, mysteriously, "repo-stored media isn't currently supported when self-hosting". What a pity!

Well, `SimpleMediaStore` comes to the rescue, by implementing a TinaCMS-compatible MediaStore on top of a local folder, somewhere, anywhere you want, with optional integration for [`@bojidar-bg/tina-simple-git-provider`](https://www.npmjs.com/package/@bojidar-bg/tina-simple-git-provider)!

(The need for this package would go away the moment Tina's built-in `MediaStore` starts supporting a custom URL for the media API and Tina's built-in media store backend is decoupled from the CLI.)

## Usage

To use this media store in your [TinaCMS application](https://tina.io/docs/reference/), you need to do two things:
1. Include the client-side part of the media store in your config.
2. Import and configure the server-side part of the media store in your handlers.

### Client-side part

Modify your TinaCMS `config.ts` like so:

```ts
import { defineConfig } from "tinacms";
// import type { SimpleMediaStoreConfig } from "@bojidar-bg/tina-simple-media-store";

export default defineConfig({
  // ... Other config options
  media: {
    loadCustomStore: async () => (await import("@bojidar-bg/tina-simple-media-store")).SimpleMediaStore,    
  },
  mediaStoreOptions: {
    /// The URL to the media API backend.
    mediaApiUrl: "/api/media",
    // mediaApiUrl: "https://my-tina-api.my-site.example/api/media",
    /// The path from the root of your website to where media files can be found
    mediaRoot: "/"
  },
});
```

### Server-side part / backend API

The server-side handler, `SimpleMediaRouter`, expects to be registered under `/api/media` using Express.js, before TinaCMS's `TinaNodeBackend` gets registered.
If you have a setup similar to the [tina-true-selfhosted-example](https://github.com/bojidar-bg/tina-true-selfhosted-example), you can modify your `tina/handler.ts` to include the `SimpleMediaRouter` like so:

```ts
import { TinaNodeBackend } from '@tinacms/datalayer'
import { SimpleMediaRouter } from '@bojidar-bg/tina-simple-media-store/express'

import { config } from './config'
// import { gitProvider } from './database' // For the SimpleGitProvider integration
import databaseClient from './__generated__/databaseClient'

let authProvider = ... // Your Tina AuthProvider

const tinaHandler = TinaNodeBackend({
  authProvider,
  databaseClient,
  options: {
    basePath: '/tina/',
    // ...
  }
})

const mediaHandler = SimpleMediaRouter({
  authProvider, // An AuthProvider for authenticating media API usage
  paths: {
    // Paths to control where media files should be stored
    rootPath: "/path-to-a-repository-checkout-for-git-backed-media",
    // rootPath: gitProvider.options.repoDir // For the SimpleGitProvider integration
    publicFolder: config.build.publicFolder,
    mediaRoot: config.mediaStoreOptions?.mediaRoot ?? '',
    // Media will be stored in ${rootPath}/${publicFolder}/${mediaRoot}
    // You should ensure it's accessible over HTTP at /${mediaRoot} on your website
  },
  // onModifyFile: gitProvider.makeCommit // For the SimpleGitProvider integration
  onModifyFile: (path) => {console.log(`Media file modified: ${path}`)},
})

// ...elsewhere, to link it all in express

import express from "express"
import cookieParser from "cookie-parser"

export default function createApp() {
  let app = express()
  app.use(cookieParser())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  
  // Important: Include the SimpleMediaRouter before Tina's NodeBackend
  app.use('/api/media/', mediaHandler)
  app.use('/api/', tinaHandler)
  
  return app
};
```

Currently, there is no Next.js implementation of the `SimpleMediaRouter`--you might be able to integrate the Express.js code with your Next.js application, but the author of this package has not used Next.js enough to know exactly how. Contributions and examples welcome!

## Credits

This package was initially created as part of [tina-true-selfhosted-example](https://github.com/bojidar-bg/tina-true-selfhosted-example).
