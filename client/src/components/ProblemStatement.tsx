import { useEffect, useState } from "react";
import type * as Y from "yjs";
import { applyTextDiff } from "@/lib/yjsText";

type ProblemStatementProps = { problem: Y.Text; isReadOnly: boolean };

export default function ProblemStatement({ problem, isReadOnly }: ProblemStatementProps) {
  const [value, setValue] = useState(() => problem.toString());

  useEffect(() => {
    const sync = () => setValue(problem.toString());
    problem.observe(sync);
    sync();
    return () => problem.unobserve(sync);
  }, [problem]);

  return (
    <textarea
      value={value}
      readOnly={isReadOnly}
      onChange={(event) => applyTextDiff(problem, event.target.value)}
      placeholder="Paste or type the problem here..."
      spellCheck={false}
      className="h-full min-h-0 w-full resize-none overflow-auto bg-transparent p-4 text-[13px] leading-6 outline-none placeholder:text-vs-muted read-only:cursor-default"
    />
  );
}
