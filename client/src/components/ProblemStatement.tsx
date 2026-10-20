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
      className="h-full w-full resize-none bg-transparent p-3 text-[13px] leading-5 outline-none placeholder:text-vs-muted read-only:cursor-default"
    />
  );
}