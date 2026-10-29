"use client";

import { useEffect, useState } from "react";
import type { editor as MonacoEditor } from "monaco-editor";
import { Check, Copy, Maximize2, Minimize2, Trash2, TextAlignStart } from "lucide-react";

type EditorActionsProps = {
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  container: HTMLDivElement | null;
  isReadOnly: boolean;
};

export default function EditorActions({ editor, container, isReadOnly }: EditorActionsProps) {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === container);
      editor?.layout();
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [container, editor]);

  async function handleCopy() {
    const code = editor?.getValue();
    if (code === undefined) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.alert("Could not copy code. Check clipboard permissions.");
    }
  }

  async function handleFormat() {
    if (!editor || isReadOnly) return;

    try {
      const action = editor.getAction("editor.action.formatDocument");

      if (!action) {
        window.alert("Formatting is unavailable for this language.");
        return;
      }

      await action.run();
    } catch {
      window.alert("Could not format the code. Check formatter support.");
    }
  }

  async function handleFullscreen() {
    if (!container) return;

    try {
      if (document.fullscreenElement === container) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }

      editor?.layout();
    } catch {
      window.alert("Could not change fullscreen mode.");
    }
  }

  function handleClear() {
    if (!editor || isReadOnly) return;

    const model = editor.getModel();
    if (!model) return;

    const confirmed = window.confirm("Clear all code for everyone in this room?");

    if (!confirmed) return;

    editor.pushUndoStop();
    editor.executeEdits("clear-code", [{ range: model.getFullModelRange(), text: "" }]);
    editor.pushUndoStop();
    editor.focus();
  }

  const buttonClass = "btn gap-1 bg-vs-side hover:text-vs-fg";

  return (
    <div className="flex shrink-0 items-center  ">
      <button
        type="button"
        onClick={handleCopy}
        disabled={!editor}
        className={buttonClass}
        title="Copy code"
        aria-label={copied ? "Code copied" : "Copy code"}
      >
        {copied ? (
          <Check data-icon="inline-start" />
        ) : (
          <Copy data-icon="inline-start" />
        )}
      </button>

      <button
        type="button"
        onClick={handleFormat}
        disabled={!editor || isReadOnly}
        className={buttonClass}
        title="Format code"
        aria-label="Format code"
      >
        <TextAlignStart data-icon="inline-start" />
      </button>

      <button
        type="button"
        onClick={handleFullscreen}
        disabled={!editor || !container}
        className={buttonClass}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen editor"}
        aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? (
          <Minimize2 data-icon="inline-start" />
        ) : (
          <Maximize2 data-icon="inline-start" />
        )}
      </button>

      <button
        type="button"
        onClick={handleClear}
        disabled={!editor || isReadOnly}
        className={`${buttonClass}`}
        title="Clear shared code"
        aria-label="Clear shared code"
      >
        <Trash2 data-icon="inline-start" />
      </button>
    </div>
  );
}
