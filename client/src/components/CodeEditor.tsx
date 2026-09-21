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

type RemoteUserWidget = {
  widget: MonacoEditor.IContentWidget;
  element: HTMLElement;
  position: {
    lineNumber: number;
    column: number;
  };
};

export default function CodeEditor({
  language,
  ytext,
  awareness,
}: CodeEditorProps) {
  const bindingRef = useRef<MonacoBinding | null>(null);

  const cursorListenerRef =
    useRef<{ dispose: () => void } | null>(null);

  const decorationsRef =
    useRef<MonacoEditor.IEditorDecorationsCollection | null>(null);

  const widgetsRef =
    useRef<Map<number, RemoteUserWidget>>(new Map());

  const handleEditorMount: OnMount = async (editor) => {
    const model = editor.getModel();

    if (!model) return;

    const editorModel = model;

    const { MonacoBinding } = await import("y-monaco");

    bindingRef.current = new MonacoBinding(
      ytext,
      editorModel,
      new Set([editor]),
    );

    decorationsRef.current =
      editor.createDecorationsCollection();

    cursorListenerRef.current =
      editor.onDidChangeCursorPosition((event) => {
        awareness.setLocalStateField("cursor", {
          lineNumber: event.position.lineNumber,
          column: event.position.column,
        });
      });

    function createUserWidget(
      clientId: number,
      name: string,
      color: string,
      lineNumber: number,
      column: number,
    ): RemoteUserWidget {
      const element = document.createElement("div");

      element.className = "remote-user-label";
      element.textContent = name;
      element.style.backgroundColor = color;

      const position = {
        lineNumber,
        column,
      };

      const widget: MonacoEditor.IContentWidget = {
        getId: () => `remote-user-${clientId}`,

        getDomNode: () => element,

        getPosition: () => ({
          position,
          preference: [2, 1],
        }),
      };

      editor.addContentWidget(widget);

      return {
        widget,
        element,
        position,
      };
    }

    function updateRemotePresence() {
      const decorations: MonacoEditor.IModelDeltaDecoration[] = [];

      const activeClientIds = new Set<number>();

      awareness.getStates().forEach((state, clientId) => {
        // Don't render our own cursor.
        if (clientId === awareness.clientID) {
          return;
        }

        const user = state.user;
        const cursor = state.cursor;

        if (!user || !cursor) {
          return;
        }

        const lineNumber = cursor.lineNumber;
        const column = cursor.column;

        if (
          lineNumber < 1 ||
          lineNumber > editorModel.getLineCount()
        ) {
          return;
        }

        const maxColumn =
          editorModel.getLineMaxColumn(lineNumber);

        if (
          column < 1 ||
          column > maxColumn
        ) {
          return;
        }

        activeClientIds.add(clientId);

        /*
         * Remote cursor decoration.
         */
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

        /*
         * Username widget.
         */
        const existingWidget =
          widgetsRef.current.get(clientId);

        if (existingWidget) {
          existingWidget.position.lineNumber = lineNumber;
          existingWidget.position.column = column;

          existingWidget.element.textContent =
            user.name;

          existingWidget.element.style.backgroundColor =
            user.color;

          editor.layoutContentWidget(
            existingWidget.widget,
          );
        } else {
          const widget = createUserWidget(
            clientId,
            user.name,
            user.color,
            lineNumber,
            column,
          );

          widgetsRef.current.set(
            clientId,
            widget,
          );
        }
      });

      /*
       * Remove widgets for users
       * who are no longer present.
       */
      widgetsRef.current.forEach(
        (widget, clientId) => {
          if (!activeClientIds.has(clientId)) {
            editor.removeContentWidget(
              widget.widget,
            );

            widgetsRef.current.delete(clientId);
          }
        },
      );

      decorationsRef.current?.set(
        decorations,
      );
    }

    awareness.on(
      "change",
      updateRemotePresence,
    );

    updateRemotePresence();

    /*
     * Add styles for remote cursors
     * and username labels.
     */
    const styleElement =
      document.createElement("style");

    styleElement.id =
      "remote-cursor-styles";

    styleElement.textContent = `
      .remote-user-label {
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        margin-left: 4px;
        font-size: 11px;
        font-family: sans-serif;
        white-space: nowrap;
        pointer-events: none;
        z-index: 10;
      }

      ${Array.from(
      awareness.getStates().keys(),
    )
        .filter(
          (clientId) =>
            clientId !== awareness.clientID,
        )
        .map(
          (clientId) => `
            .remote-cursor-${clientId} {
              border-left: 2px solid currentColor;
              margin-left: -1px;
            }
          `,
        )
        .join("\n")}
    `;

    document.head.appendChild(
      styleElement,
    );

    editor.onDidDispose(() => {
      awareness.off(
        "change",
        updateRemotePresence,
      );

      decorationsRef.current?.clear();

      widgetsRef.current.forEach(
        (widget) => {
          editor.removeContentWidget(
            widget.widget,
          );
        },
      );

      widgetsRef.current.clear();

      styleElement.remove();
    });
  };

  useEffect(() => {
    return () => {
      bindingRef.current?.destroy();
      bindingRef.current = null;

      cursorListenerRef.current?.dispose();
      cursorListenerRef.current = null;

      decorationsRef.current?.clear();
      decorationsRef.current = null;

      widgetsRef.current.clear();
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
        minimap: {
          enabled: false,
        },

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