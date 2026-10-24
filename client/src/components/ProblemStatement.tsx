import { useEffect, useState } from "react";
import type * as Y from "yjs";
import { applyTextDiff } from "@/lib/yjsText";

const SAMPLE = `Paste or type the problem here.

Example:

Two Sum (Easy)
Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. Each input has exactly one solution, and you may not use the same element twice.

nums = [2, 7, 11, 15], target = 9
output: [0, 1]`;

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
      placeholder={isReadOnly ? "The host hasn't added a problem yet." : SAMPLE}
      spellCheck={false}
      className="h-full w-full resize-none bg-transparent p-3 text-[13px] leading-5 outline-none placeholder:text-vs-muted read-only:cursor-default"
    />
  );
}