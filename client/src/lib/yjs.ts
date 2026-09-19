import * as Y from "yjs";

export function createYjsDocument() {
  const ydoc = new Y.Doc();
  const ytext = ydoc.getText("code");

  ytext.observe(() => {
    console.log("Y.Text changed:", ytext.toString());
  });

  return {
    ydoc,
    ytext,
  };
}