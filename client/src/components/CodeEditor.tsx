"use client";

import { useEffect, useRef, useState } from "react";
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
  theme: "dark" | "light";
  onEditorReady: (
    editor: MonacoEditor.IStandaloneCodeEditor,
    container: HTMLDivElement
  ) => void;
};

export default function CodeEditor({
  language,
  ytext,
  awareness,
  isReadOnly,
  theme,
  onEditorReady,
}: CodeEditorProps) {
  const [editor, setEditor] =
    useState<MonacoEditor.IStandaloneCodeEditor | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

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

  function handleEditorMount(mountedEditor: MonacoEditor.IStandaloneCodeEditor) {
    setEditor(mountedEditor);

    if (containerRef.current) {
      onEditorReady(mountedEditor, containerRef.current);
    }
  }

  return (
    <div ref={containerRef} className="h-full w-full bg-vs-editor">
      <Editor
        height="100%"
        width="100%"
        language={language}
        theme={theme === "dark" ? "vs-dark" : "light"}
        onMount={handleEditorMount}
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
    </div>
  );
}