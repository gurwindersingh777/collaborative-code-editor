import { useEffect } from "react";
import type { editor as MonacoEditor } from "monaco-editor";
import type { Awareness } from "y-protocols/awareness.js";
import type { AwarenessState } from "@/types/presence";

const SAFE_COLOR = /^#[0-9a-fA-F]{6}$/;

export function useRemoteCursors(editor: MonacoEditor.IStandaloneCodeEditor | null, awareness: Awareness) {
  useEffect(() => {
    const model = editor?.getModel();
    if (!editor || !model) return;

    const cursorListener = editor.onDidChangeCursorPosition(({ position }) => {
      awareness.setLocalStateField("cursor", {
        lineNumber: position.lineNumber,
        column: position.column,
      });
    });

    const selectionListener = editor.onDidChangeCursorSelection(({ selection }) => {
      awareness.setLocalStateField("selection", {
        startLineNumber: selection.startLineNumber,
        startColumn: selection.startColumn,
        endLineNumber: selection.endLineNumber,
        endColumn: selection.endColumn,
      });
    });

    const decorations = editor.createDecorationsCollection();
    const styleElement = document.createElement("style");
    document.head.appendChild(styleElement);

    function redraw() {
      const css: string[] = [];
      const next: MonacoEditor.IModelDeltaDecoration[] = [];

      awareness.getStates().forEach((raw, clientId) => {
        if (clientId === awareness.clientID) return;

        const { user, cursor, selection } = raw as Partial<AwarenessState>;

        if (!user || !cursor || !SAFE_COLOR.test(user.color)) return;
        if (cursor.lineNumber < 1 || cursor.lineNumber > model!.getLineCount()) return;
        if (cursor.column < 1 || cursor.column > model!.getLineMaxColumn(cursor.lineNumber)) return;

        css.push(`
          .remote-cursor-${clientId} { border-left: 2px solid ${user.color}; margin-left: -1px; }
          .remote-selection-${clientId} { background-color: ${user.color}; opacity: 0.25; }
        `);

        next.push({
          range: {
            startLineNumber: cursor.lineNumber,
            startColumn: cursor.column,
            endLineNumber: cursor.lineNumber,
            endColumn: cursor.column,
          },
          options: { className: `remote-cursor-${clientId}` },
        });

        if (selection) {
          next.push({ range: { ...selection }, options: { className: `remote-selection-${clientId}` } });
        }
      });

      styleElement.textContent = css.join("\n");
      decorations.set(next);
    }

    awareness.on("change", redraw);
    redraw();

    return () => {
      awareness.off("change", redraw);
      cursorListener.dispose();
      selectionListener.dispose();
      decorations.clear();
      styleElement.remove();
    };
  }, [editor, awareness]);
}