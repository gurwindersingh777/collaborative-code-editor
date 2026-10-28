import { APP_NAME, APP_TAGLINE } from "@/lib/config";

type LandingScreenProps = { onCreateRoom: () => void };

export default function LandingScreen({ onCreateRoom }: LandingScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-vs-editor px-6 light-blue-gradient-box">
      <section className="w-full max-w-md border border-vs-line bg-vs-side shadow-2xl shadow-black/20">
        <div className="flex items-center gap-2 border-b border-vs-line px-4 py-3 text-xs text-vs-muted">
          <span className="size-2 rounded-full bg-vs-accent" aria-hidden="true" />
          <span>New workspace</span>
        </div>
        <div className="flex flex-col gap-6 p-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-vs-fg">{APP_NAME}</h1>
            <p className="max-w-sm text-sm leading-6 text-vs-muted">{APP_TAGLINE}</p>
          </div>
          <button onClick={onCreateRoom} className="btn btn-primary h-9 justify-center text-sm font-medium">
            Create a room
          </button>
          <p className="text-center text-[11px] text-vs-muted">Share the room link with your collaborators to start coding together.</p>
        </div>
      </section>
    </main>
  );
}
