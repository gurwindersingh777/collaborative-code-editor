export const LANGUAGES = [
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
] as const;

export type Language = (typeof LANGUAGES)[number]["id"];