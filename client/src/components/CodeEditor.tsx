"use client";

import { useEffect, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type * as Y from "yjs";
import type { MonacoBinding } from "y-monaco";

type CodeEditorProps = {
  language: string;
  ytext: Y.Text;
};

export default function CodeEditor({ language, ytext }: CodeEditorProps) {
  const bindingRef = useRef<MonacoBinding | null>(null);

  const handleEditorMount: OnMount = async (editor) => {
    const model = editor.getModel();

    if (!model) {
      return;
    }

    const { MonacoBinding } = await import("y-monaco");

    bindingRef.current = new MonacoBinding(
      ytext,
      model,
      new Set([editor]),
    );
  };

  useEffect(() => {
    return () => {
      bindingRef.current?.destroy();
      bindingRef.current = null;
    };
  }, [ytext]);

  return (
    <Editor
      height="100%"
      width="100%"
      language={language}
      theme="vs-dark"
      onMount={handleEditorMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineHeight: 22,
        fontFamily:
          "var(--font-geist-mono), 'Fira Code', Consolas, monospace",
        automaticLayout: true,
        padding: {
          top: 16,
          bottom: 16,
        },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        renderWhitespace: "selection",
        tabSize: 2,
        wordWrap: "on",
      }}
    />
  );
}