import type * as Y from "yjs";
import Chat from "./Chat";
import OnlineUsers from "./OnlineUsers";
import ProblemStatement from "./ProblemStatement";
import type { PresenceUser } from "@/types/room";

export type SideTab = "problem" | "output" | "chat" | "people";

const TABS: { id: SideTab; label: string }[] = [
  { id: "problem", label: "Problem" },
  { id: "output", label: "Output" },
  { id: "chat", label: "Chat" },
  { id: "people", label: "People" },
];

type SidePanelProps = {
  roomId: string;
  problem: Y.Text | null;
  locked: boolean;
  output: string;
  users: PresenceUser[];
  selfId: string | null;
  onRename: (name: string) => void;
  activeTab: SideTab;
  onTabChange: (tab: SideTab) => void;
};

export default function SidePanel({
  roomId, problem, locked, output, users, selfId, onRename, activeTab, onTabChange,
}: SidePanelProps) {
  const panel = (tab: SideTab) => (activeTab === tab ? "h-full" : "hidden");

  return (
    <aside className="flex min-h-0 flex-col border-l border-vs-line bg-vs-side">
      <div className="flex h-8 shrink-0 items-center border-b border-vs-line px-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-vs-muted">Workspace</span>
      </div>
      <div role="tablist" className="flex h-9 shrink-0 border-b border-vs-line">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`-mb-px border-b px-3 text-[11px] uppercase tracking-wide ${
              activeTab === tab.id
                ? "border-vs-accent text-white"
                : "border-transparent text-vs-muted hover:text-vs-fg"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1">
        <div className={panel("problem")}>
          {problem && <ProblemStatement problem={problem} isReadOnly={locked} />}
        </div>

        <div className={panel("output")}>
          <pre
            className={`h-full overflow-auto whitespace-pre-wrap p-3 font-mono text-xs leading-5 ${
              output ? "" : "text-vs-muted"
            }`}
          >
            {output || "Run the code to see its output here."}
          </pre>
        </div>

        <div className={panel("chat")}>
          <Chat roomId={roomId} active={activeTab === "chat"} />
        </div>

        <div className={panel("people")}>
          <OnlineUsers users={users} selfId={selfId} onRename={onRename} />
        </div>
      </div>
    </aside>
  );
}
