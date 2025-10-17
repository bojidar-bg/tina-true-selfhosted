import { ReactNode, useRef } from 'react';
import { BlockTypeSelect, BoldItalicUnderlineToggles, Button, CreateLink, DiffSourceToggleWrapper, InsertThematicBreak, ListsToggle, MDXEditor, RealmPlugin, UndoRedo, diffSourcePlugin, headingsPlugin, iconComponentFor$, imagePlugin, insertImage$, linkDialogPlugin, linkPlugin, listsPlugin, quotePlugin, thematicBreakPlugin, toolbarPlugin, useCellValues, usePublisher } from '@mdxeditor/editor';

import '@mdxeditor/editor/style.css';
import '@bojidar-bg/tina-mdx-editor/style.css';

import { useCMS } from 'tinacms';

type MDXEditorFieldProps = {
  /// Input values, as passed by TinaCMS
  input: {
    value: string,
    onChange?: () => void,
  },
  /// Meta values, as passed by TinaCMS
  meta: {
    initial?: string
  },
  /// List of plugins for the MDXEditor
  /// Defaults to toolbarPlugin, headingsPlugin, quotePlugin, listsPlugin, thematicBreakPlugin, linkPlugin, linkDialogPlugin, imagePlugin (with resize on), and diffSourcePlugin.
  plugins?: (opts: {meta: {initial?: string}}) => RealmPlugin[],
  /// Contents for the toolbarPlugin
  /// Defaults to UndoRedo and a DiffSourceToggleWrapper holding BlockTypeSelect, BoldItalicUnderlineToggles, CreateLink, [InsertTinaImage], ListsToggle (without checkbox lists), and InsertThematicBreak.
  toolbarContents?: () => ReactNode
}
  
export function MDXEditorField({input, meta, plugins, toolbarContents}: MDXEditorFieldProps) {
  const overlay = useRef(null);
  return <>
    {overlay.current && <MDXEditor
      overlayContainer={overlay.current}
      markdown={input.value}
      plugins={plugins ? plugins({meta}) : [
        headingsPlugin(),
        quotePlugin(),
        listsPlugin(),
        thematicBreakPlugin(),
        toolbarPlugin({
          toolbarContents: toolbarContents || (() => (
            <>
              <UndoRedo />
              <DiffSourceToggleWrapper>
                <BlockTypeSelect />
                <BoldItalicUnderlineToggles />
                <CreateLink />
                <InsertTinaImage />
                <ListsToggle options={['bullet', 'number']} />
                <InsertThematicBreak />
              </DiffSourceToggleWrapper>
            </>
          ))
        }),
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
      onChange={input.onChange}
    />}
    <div ref={overlay}></div>
  </>;
};

export function InsertTinaImage() {
  const cms = useCMS();
  const [iconComponentFor] = useCellValues(iconComponentFor$);
  const insertImage = usePublisher(insertImage$);
  return (<Button
      onClick={() => {
        cms.media.open({
          allowDelete: true,
          directory: '',
          onSelect: (media) => {
            insertImage({src: media.src!});
          },
        });
      }}>
      {iconComponentFor("add_photo")}
    </Button>);
}


export default MDXEditorField;
