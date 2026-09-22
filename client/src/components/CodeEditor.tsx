"use client";

import { useEffect, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type * as Y from "yjs";
import type { MonacoBinding } from "y-monaco";
import type { Awareness } from "y-protocols/awareness.js";
import type { editor as MonacoEditor } from "monaco-editor";

type CodeEditorProps = {
  language: string;
  ytext: Y.Text;
  awareness: Awareness;
};

export default function CodeEditor({ language, ytext, awareness }: CodeEditorProps) {
  const bindingRef = useRef<MonacoBinding | null>(null);
  const cursorListenerRef = useRef<{ dispose: () => void } | null>(null);
  const selectionListenerRef = useRef<{ dispose: () => void } | null>(null);
  const decorationsRef = useRef<MonacoEditor.IEditorDecorationsCollection | null>(null);

  const handleEditorMount: OnMount = async (editor) => {
    const model = editor.getModel();

    if (!model) return;

    const editorModel = model;

    const { MonacoBinding } = await import("y-monaco");

    // Connect Monaco to Yjs
    bindingRef.current = new MonacoBinding(ytext, editorModel, new Set([editor]));

    decorationsRef.current = editor.createDecorationsCollection();

    // Track local cursor
    cursorListenerRef.current =
      editor.onDidChangeCursorPosition((event) => {
        awareness.setLocalStateField("cursor", {
          lineNumber: event.position.lineNumber,
          column: event.position.column,
        });
      });

    // Track local selection
    selectionListenerRef.current =
      editor.onDidChangeCursorSelection((event) => {
        const selection = event.selection;

        awareness.setLocalStateField("selection", {
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn,
        });
      });

    function updateRemotePresence() {
      const decorations: MonacoEditor.IModelDeltaDecoration[] = [];

      awareness.getStates().forEach((state, clientId) => {
        // Don't render our own cursor
        if (clientId === awareness.clientID) return;

        const user = state.user;
        const cursor = state.cursor;
        const selection = state.selection;

        if (!user || !cursor) return;

        const lineNumber = cursor.lineNumber;
        const column = cursor.column;

        // Make sure cursor is inside the current model
        if (lineNumber < 1 || lineNumber > editorModel.getLineCount()) return;

        const maxColumn = editorModel.getLineMaxColumn(lineNumber);

        if (column < 1 || column > maxColumn) return;

        // Remote cursor
        decorations.push({
          range: {
            startLineNumber: lineNumber,
            startColumn: column,
            endLineNumber: lineNumber,
            endColumn: column,
          },
          options: {
            className: `remote-cursor-${clientId}`,
          },
        });

        // Remote selection
        if (selection) {
          decorations.push({
            range: {
              startLineNumber: selection.startLineNumber,
              startColumn: selection.startColumn,
              endLineNumber: selection.endLineNumber,
              endColumn: selection.endColumn,
            },
            options: {
              className: `remote-selection-${clientId}`,
            },
          });
        }
      });

      decorationsRef.current?.set(decorations);
    }

    awareness.on("change", updateRemotePresence);
    updateRemotePresence();

    // Create styles for remote cursors
    const styleElement = document.createElement("style");
    styleElement.id = "remote-cursor-styles";
    styleElement.textContent = `
      ${Array
        .from(awareness.getStates().entries())
        .filter(([clientId, state]) => clientId !== awareness.clientID && state.user)
        .map(([clientId, state]) => `
            .remote-cursor-${clientId} {
              border-left: 2px solid ${state.user.color};
              margin-left: -1px;
            }

            .remote-selection-${clientId} {
              background-color: ${state.user.color};
              opacity: 0.25;
            }
          `,)
        .join("\n")}
    `;

    document.head.appendChild(styleElement);

    editor.onDidDispose(() => {
      awareness.off("change", updateRemotePresence);
      decorationsRef.current?.clear();
      styleElement.remove();
    });
  };

  useEffect(() => {
    return () => {
      bindingRef.current?.destroy();
      bindingRef.current = null;

      cursorListenerRef.current?.dispose();
      cursorListenerRef.current = null;

      selectionListenerRef.current?.dispose();
      selectionListenerRef.current = null;

      decorationsRef.current?.clear();
      decorationsRef.current = null;
    };
  }, [ytext, awareness]);

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
  );
}