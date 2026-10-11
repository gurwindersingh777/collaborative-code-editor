"use client";

import ReactMarkdown from "react-markdown";
import type * as Y from "yjs";
import { useEffect, useState } from "react";
import { applyTextDiff } from "@/lib/yjsText";

type ProblemStatementProps = {
  problem: Y.Text;
  isReadOnly: boolean;
};

export default function ProblemStatement({ problem, isReadOnly }: ProblemStatementProps) {
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
    applyTextDiff(problem, event.target.value);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h2 className="mb-2 text-lg font-semibold">Problem Statement</h2>

        <textarea
          value={value}
          readOnly={isReadOnly}
          onChange={handleChange}
          placeholder="Write the interview problem in Markdown..."
          className={`min-h-75 w-full rounded border p-3 font-mono text-sm ${isReadOnly ? "cursor-not-allowed bg-gray-100 text-gray-600" : ""
            }`}
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