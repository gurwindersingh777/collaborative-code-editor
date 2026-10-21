import { useRef, useState } from "react";
import { MAX_NAME_LENGTH, cleanName } from "@/lib/presence";
import type { PresenceUser } from "@/types/room";

type OnlineUsersProps = {
  users: PresenceUser[];
  selfId: string | null;
  onRename: (name: string) => void;
};

export default function OnlineUsers({ users, selfId, onRename }: OnlineUsersProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const finished = useRef(false); 

  const me = users.find((user) => user.socketId === selfId);

  function startEditing() {
    finished.current = false;
    setDraft(me?.name ?? "");
    setEditing(true);
  }

  function finish(save: boolean) {
    if (finished.current) return;
    finished.current = true;

    const name = cleanName(draft);
    if (save && name && name !== me?.name) onRename(name);
    setEditing(false);
  }

  if (users.length === 0) {
    return <p className="p-3 text-xs text-vs-muted">Nobody here yet.</p>;
  }

  return (
    <ul className="h-full space-y-1 overflow-y-auto p-3">
      {users.map((user) => {
        const isSelf = user.socketId === selfId;

        return (
          <li key={user.socketId} className="flex h-6 items-center gap-2 text-xs">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: user.color }} />

            {isSelf && editing ? (
              <input
                autoFocus
                value={draft}
                maxLength={MAX_NAME_LENGTH}
                onChange={(event) => setDraft(event.target.value)}
                onFocus={(event) => event.target.select()}
                onBlur={() => finish(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") finish(true);
                  if (event.key === "Escape") finish(false);
                }}
                className="field min-w-0 flex-1"
              />
            ) : (
              <>
                <span className="min-w-0 flex-1 truncate">
                  {user.name}
                  {isSelf && <span className="ml-1 text-vs-muted">(you)</span>}
                </span>
                {isSelf && <button onClick={startEditing} className="btn">Rename</button>}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}