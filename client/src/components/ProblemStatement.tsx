"use client";

import ReactMarkdown from "react-markdown";
import type * as Y from "yjs";
import { useEffect, useState } from "react";

type ProblemStatementProps = {
  problem: Y.Text;
};

export default function ProblemStatement({ problem }: ProblemStatementProps) {
  const [value, setValue] = useState(problem.toString());

  useEffect(() => {
    const observer = () => {
      setValue(problem.toString());
    };

    problem.observe(observer);

    return () => {
      problem.unobserve(observer);
    };
  }, [problem]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;

    problem.doc?.transact(() => {
      problem.delete(0, problem.length);
      problem.insert(0, nextValue);
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h2 className="mb-2 text-lg font-semibold">Problem Statement</h2>

        <textarea
          value={value}
          onChange={handleChange}
          placeholder="Write the interview problem in Markdown..."
          className="min-h-75 w-full rounded border p-3 font-mono text-sm"
        />
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Preview</h2>

        <div className="min-h-75 rounded border p-4">
          <ReactMarkdown>{value}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}