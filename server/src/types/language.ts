export const LANGUAGE_CONFIG = {
  javascript: { piston: "javascript", file: "main.js" },
  typescript: { piston: "typescript", file: "main.ts" },
  python:     { piston: "python",     file: "main.py" },
  java:       { piston: "java",       file: "Main.java" },
  cpp:        { piston: "c++",        file: "main.cpp" },
  c:          { piston: "c",          file: "main.c" },
  go:         { piston: "go",         file: "main.go" },
} as const;

export type Language = keyof typeof LANGUAGE_CONFIG;

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_CONFIG) as Language[];

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && Object.hasOwn(LANGUAGE_CONFIG, value);
}