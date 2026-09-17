import * as Y from "yjs"

export const ydoc = new Y.Doc();

export const ytext = ydoc.getText("code")

ydoc.on("update", (update) => {
  console.log("Yjs update generated:", update);
})

ytext.observe(() => {
  console.log("Y.Text changed:", ytext.toString());
});

if (ytext.length === 0) {
  ytext.insert(0,
    `function solve() {
  console.log("Hello from Yjs!");
}

solve();
`,
  );
}