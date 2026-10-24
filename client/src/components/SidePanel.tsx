import type * as Y from "yjs";
import Chat from "./Chat";
import OnlineUsers from "./OnlineUsers";
import ProblemStatement from "./ProblemStatement";
import type { PresenceUser } from "@/types/room";
import { FileText, MessageSquare, Terminal, Users } from "lucide-react";

export type SideTab = "problem" | "output" | "chat" | "people";

const TABS: { id: SideTab; label: string; icon: typeof FileText }[] = [
  { id: "problem", label: "Problem", icon: FileText },
  { id: "output", label: "Output", icon: Terminal },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "people", label: "People", icon: Users },
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
      <div className="flex h-9 shrink-0 items-center border-b border-vs-line px-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-vs-muted">
          Workspace
        </span>
      </div>

      <div role="tablist" className="flex h-9 shrink-0 border-b border-vs-line">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              aria-label={tab.label}
              title={tab.label}
              onClick={() => onTabChange(tab.id)}
              className={`-mb-px flex min-w-0 flex-1 items-center justify-center gap-1.5 border-b-2 px-2 text-[11px] font-medium uppercase tracking-wide transition-colors ${active
                  ? "border-vs-accent text-white"
                  : "border-transparent text-vs-muted hover:bg-white/5 hover:text-vs-fg"
                }`}
            >
              <tab.icon size={14} className="shrink-0" aria-hidden="true" />
              <span className="hidden truncate sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1">
        <div className={panel("problem")}>
          {problem && <ProblemStatement problem={problem} isReadOnly={locked} />}
        </div>

        <div className={panel("output")}>
          <pre
            className={`h-full overflow-auto whitespace-pre-wrap p-4 font-mono text-[13px] leading-6 ${output
              ? /error|exception|traceback|failed/i.test(output)
                ? "text-red-300"
                : "text-vs-fg"
              : "text-vs-muted"
              }`}
          >
            {output || <span className="text-vs-muted text-[13px]">Run the code to see its output here.</span>}
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