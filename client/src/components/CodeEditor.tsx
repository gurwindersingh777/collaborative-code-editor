import { ytext } from "@/lib/yjs"
import { Editor, type OnMount } from "@monaco-editor/react"
import { useEffect, useRef } from "react"
import { MonacoBinding } from "y-monaco"

type CodeEditorProps = {
  language: string
}

export default function CodeEditor({ language }: CodeEditorProps) {
  const bindingRef = useRef<MonacoBinding | null>(null);

  const handleEditorMount: OnMount = (editor) => {
    const model = editor.getModel();
    if (!model) return;
    bindingRef.current = new MonacoBinding(ytext, model, new Set([editor]))
  }

  useEffect(() => {
    return () => {
      bindingRef.current?.destroy();
      bindingRef.current = null;
    }
  }, [])

  return (
    <Editor
      height="100%"
      width="100%"
      language={language}
      onMount={handleEditorMount}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineHeight: 22,
        fontFamily: "var(--font-geist-mono), 'Fira Code', Consolas, monospace",
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
  )
}
