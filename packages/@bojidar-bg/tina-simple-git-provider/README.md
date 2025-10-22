# `simple-git` for TinaCMS

Do you hate it when a cool open-source static CMS has no integration for self-hostable Git solutions.. even though they claim to be fully self-hostable?

Hate no more! `SimpleGitProvider` implements a TinaCMS-compatible GitProvider using spit, duct-tape, and a local git repository checkout.

P.S. If you like this package, you would probably also like [`@bojidar-bg/tina-simple-media-store`](https://www.npmjs.com/package/@bojidar-bg/tina-simple-media-store), which implements

## Usage

To use Git Provider in your [TinaCMS database config](https://tina.io/docs/reference/self-hosted/git-provider/overview), you can import it in your `tina/database.ts` file and use it like so:

```ts
import { defineConfig, wrapFieldsWithMeta } from "tinacms";
import { SimpleGitProvider } from "@bojidar-bg/tina-simple-git-provider";

export const gitProvider = new SimpleGitProvider({
  // Required: path to the repository that we will be creating commits in
  repoDir: process.env.GIT_REPO_DIR || '.',
  
  // If set, configures how to clone the repository
  // cloneRepo: { remote: "my-host.example/my-repo.git" }
  
  // Controls if we should do a git pull upon starting the backend
  pullRepo: true, // Default value
  
  // Controls if we should do a git push upon making a new commit
  pushRepo: true, // Default value
  /// commit message for the created commits.
  commitMessage: "Edited with TinaCMS", // Default value
  // commitMessage: (path) => `Update ${path}`, // Can also pass a function
  
  // Encoding to use for files
  encoding: "utf8"
  
  // Options to pass to simple-git
  // simpleGit: { ... }
})

export default createDatabase({
  gitProvider,
  // databaseAdapter: <your database of choice, perhaps RaveLevel>
})

// Now, edits from Tina will be committed whenever you save an article.
// To commit a file modified through other means, say via SimpleMediaStore, you can use:
// gitProvider.makeCommit(pathToModifiedFile)
```

## Credits

This package was initially created as part of [tina-true-selfhosted-example](https://github.com/bojidar-bg/tina-true-selfhosted-example).

[`simple-git`](https://www.npmjs.com/package/simple-git) is awesome!
