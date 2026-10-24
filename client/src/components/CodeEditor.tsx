import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import type * as Y from "yjs";
import type { MonacoBinding } from "y-monaco";
import type { Awareness } from "y-protocols/awareness.js";
import type { editor as MonacoEditor } from "monaco-editor";
import { useRemoteCursors } from "@/hooks/useRemoteCursors";

type CodeEditorProps = {
  language: string;
  ytext: Y.Text;
  awareness: Awareness;
  isReadOnly: boolean;
};

export default function CodeEditor({ language, ytext, awareness, isReadOnly }: CodeEditorProps) {
  const [editor, setEditor] = useState<MonacoEditor.IStandaloneCodeEditor | null>(null);
  
  useEffect(() => {
    const model = editor?.getModel();
    if (!editor || !model) return;

    let cancelled = false;
    let binding: MonacoBinding | undefined;

    import("y-monaco").then(({ MonacoBinding }) => {
      if (cancelled) return;
      binding = new MonacoBinding(ytext, model, new Set([editor]));
    });

    return () => {
      cancelled = true;
      binding?.destroy();
    };
  }, [editor, ytext]);

  useRemoteCursors(editor, awareness);

  return (
    <Editor
      height="100%"
      width="100%"
      language={language}
      theme="vs-dark"
      onMount={(mountedEditor) => setEditor(mountedEditor)}
      options={{
        readOnly: isReadOnly,
        minimap: { enabled: false },
        fontSize: 14,
        lineHeight: 22,
        fontFamily: "Consolas, 'Cascadia Code', 'Courier New', monospace",
        automaticLayout: true,
        padding: { top: 16, bottom: 16 },
        scrollBeyondLastLine: false,
        renderWhitespace: "selection",
        renderLineHighlight: "line",
        lineNumbersMinChars: 3,
        tabSize: 2,
        wordWrap: "on",
      }}
    />
  );
}