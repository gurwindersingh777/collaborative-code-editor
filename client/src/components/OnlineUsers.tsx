"use client";

import { useEffect, useState } from "react";
import type { Awareness } from "y-protocols/awareness";

type OnlineUser = {
  clientId: number;
  name: string;
  color: string;
};

type OnlineUsersProps = {
  awareness: Awareness;
};

export default function OnlineUsers({
  awareness,
}: OnlineUsersProps) {
  const [users, setUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    function updateUsers() {
      const onlineUsers: OnlineUser[] = [];

      awareness.getStates().forEach(
        (state, clientId) => {
          const user = state.user as
            | {
                name: string;
                color: string;
              }
            | undefined;

          if (!user) return;

          onlineUsers.push({
            clientId,
            name: user.name,
            color: user.color,
          });
        },
      );

      setUsers(onlineUsers);
    }

    updateUsers();

    awareness.on("change", updateUsers);

    return () => {
      awareness.off("change", updateUsers);
    };
  }, [awareness]);

  return (
    <aside className="w-55 shrink-0 border-l border-zinc-700 bg-zinc-900 p-4">
      <h2 className="mb-4 text-sm font-semibold text-zinc-200">
        👥 Online ({users.length})
      </h2>

      <div className="flex flex-col gap-2.5">
        {users.map((user) => (
          <div
            key={user.clientId}
            className="flex items-center gap-2 text-sm text-zinc-300"
          >
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: user.color,
              }}
            />

            <span className="truncate">
              {user.name}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}

