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

The `MDXEditorField` comes with a default set of MDXEditor plugins and toolbar elements configured. You should be able to customize those as follows:

```ts
import { MDXEditorField, MDXEditorFieldProps } from "@bojidar-bg/tina-mdx-editor";

let CustomMDXEditorField = (props: MDXEditorFieldProps) => {
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
        allowSetImageDimensions: true
      }),
      diffSourcePlugin({
        diffMarkdown: meta.initial
      })
    ]}
  />
}

// then, use CustomMDXEditorField instead of MDXEditorField in the example from before
```

## Credits

This package was initially created as part of [tina-true-selfhosted-example](https://github.com/bojidar-bg/tina-true-selfhosted-example).
