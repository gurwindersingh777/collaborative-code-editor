export interface UserPresence {
  name: string;
  color: string;
}

export interface CursorPresence {
  lineNumber: number;
  column: number;
}

export interface AwarenessState {
  user: UserPresence;
  cursor?: CursorPresence;
}