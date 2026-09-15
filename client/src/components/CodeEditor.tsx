import { Editor } from "@monaco-editor/react"

type CodeEditorProps = {
  language: string
  value: string
  onChange: (value: string) => void
}

export default function CodeEditor({ language, value, onChange }: CodeEditorProps) {
  return (
    <Editor
      height="100%"
      width="100%"
      language={language}
      value={value}
      onChange={(value) => onChange(value ?? "")}
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
