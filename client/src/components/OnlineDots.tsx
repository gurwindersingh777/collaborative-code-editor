import type { PresenceUser } from "@/types/room";

type OnlineDotsProps = { users: PresenceUser[]; selfId: string | null };

export default function OnlineDots({ users, selfId }: OnlineDotsProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-vs-muted">{users.length} online</span>

      <div className="flex items-center gap-1">
        {users.map((user) => {
          const isSelf = user.socketId === selfId;
          return (
            <span
              key={user.socketId}
              title={isSelf ? `${user.name} (you)` : user.name}
              className={`h-2 w-2 rounded-full ${
                isSelf ? "ring-1 ring-vs-fg ring-offset-1 ring-offset-vs-side" : ""
              }`}
              style={{ backgroundColor: user.color }}
            />
          );
        })}
      </div>
    </div>
  );
}