import type * as Y from "yjs";

export function applyTextDiff(ytext: Y.Text, next: string) {
  const prev = ytext.toString();

  // Skip the identical beginning
  let start = 0;
  while (start < prev.length && start < next.length && prev[start] === next[start]) {
    start++;
  }

  // Skip the identical ending
  let endPrev = prev.length;
  let endNext = next.length;
  while (endPrev > start && endNext > start && prev[endPrev - 1] === next[endNext - 1]) {
    endPrev--;
    endNext--;
  }

  // Only the middle differs, so delete and insert just that
  const run = () => {
    if (endPrev > start) ytext.delete(start, endPrev - start);
    if (endNext > start) ytext.insert(start, next.slice(start, endNext));
  };

  if (ytext.doc) ytext.doc.transact(run);
  else run();
}