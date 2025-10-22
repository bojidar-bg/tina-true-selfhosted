# MDXEditor for TinaCMS

Do you want a better Markdown editor for your TinaCMS-powered site? Perhaps one which allows for resizing images? And looking at differences from the previous version of the article? And harnesses all the other amazing features of [MDXEditor](https://mdxeditor.dev/)?

Well, you are in the right place!

## Usage

To use this editor in your [TinaCMS schema](https://tina.io/docs/reference/fields), you can import it in your `tina/config.ts` file and use it like so:

```ts
import { defineConfig, wrapFieldsWithMeta } from "tinacms";
import { MDXEditorField, MDXEditorFieldProps } from "@bojidar-bg/tina-mdx-editor";

export default defineConfig({
  // ... Other config options
  schema: {
    collections: [
      // ... Other collections
      {
        // ... Collection config
        fields: [
          // ... Other fields
          {
            type: "string",
            name: "body",
            label: "Body",
            isBody: true,
            ui: {
              component: wrapFieldsWithMeta(MDXEditorField)
            }
          },
        ],
      },
    ],
  },
});
```

### Customizing

The `MDXEditorField` comes with a default set of MDXEditor plugins and toolbar elements configured. You should be able to customize those as follows:

```tsx
// custom.tsx
import { BlockTypeSelect, BoldItalicUnderlineToggles, CreateLink, DiffSourceToggleWrapper, InsertThematicBreak, ListsToggle, UndoRedo, diffSourcePlugin, headingsPlugin, imagePlugin, linkDialogPlugin, linkPlugin, listsPlugin, quotePlugin, thematicBreakPlugin, toolbarPlugin } from '@mdxeditor/editor';
import { MDXEditorField, MDXEditorFieldProps, InsertTinaImage } from "@bojidar-bg/tina-mdx-editor";

export const CustomMDXEditorField = (props: MDXEditorFieldProps) => {
  return <MDXEditorField 
    {...props}
    // You can override just the toolbar contents...
    toolbarContents={() => <>
      <UndoRedo />
      <DiffSourceToggleWrapper>
        <BlockTypeSelect />
        <BoldItalicUnderlineToggles />
        <CreateLink />
        <InsertTinaImage />
        <ListsToggle options={['bullet', 'number']} />
        <InsertThematicBreak />
      </DiffSourceToggleWrapper>
    </>}
    // ...or the whole plugins array
    plugins={({meta, toolbarContents}) => [
      headingsPlugin(),
      quotePlugin(),
      listsPlugin(),
      thematicBreakPlugin(),
      toolbarPlugin({toolbarContents}),
      linkPlugin(),
      linkDialogPlugin(),
      imagePlugin({
        imageUploadHandler: null,
        allowSetImageDimensions: true,
      }),
      diffSourcePlugin({
        diffMarkdown: meta.initial
      })
    ]}
  />;
};

// then, use CustomMDXEditorField instead of MDXEditorField in the example from before
```

If you get a "top-level await is not available in the configured target environment" error related to importing `@mdxeditor/editor` from your Tina `config.ts`, you can work around it by:

1. Creating a new folder
2. Moving the `custom.tsx` file into that folders—this is the file that will be loaded by the browser.
3. Creating an extra `dummy.tsx` file which will be loaded by Tina's esbuild. It can contain something like:
```tsx
import { MDXEditorField } from "@bojidar-bg/tina-mdx-editor";
export const CustomMDXEditorField = MDXEditorField;
```
4. Creating a `package.json` file in the new folder, with the following content:
```json
{
  "main": "dummy.tsx",
  "browser": "custom.tsx"
}
```
5. Finally, adjust your own `config.ts` to import the whole folder.

## Credits

This package was initially created as part of [tina-true-selfhosted-example](https://github.com/bojidar-bg/tina-true-selfhosted-example).

[`@mdxeditor/editor`](https://www.npmjs.com/package/@mdxeditor/editor) is awesome!
