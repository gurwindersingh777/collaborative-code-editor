export interface UserPresence {
  name: string;
  color: string;
}

export interface CursorPresence {
  lineNumber: number;
  column: number;
}

export interface SelectionPresence {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface AwarenessState {
  user: UserPresence;
  cursor?: CursorPresence;
  selection?: SelectionPresence;
}