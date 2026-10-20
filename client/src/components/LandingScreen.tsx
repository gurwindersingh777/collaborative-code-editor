type LandingScreenProps = { onCreateRoom: () => void };

export default function LandingScreen({ onCreateRoom }: LandingScreenProps) {
  return (
    <main className="flex h-screen flex-col items-center justify-center gap-3">
      <h1 className="text-sm font-medium">Collaborative Code Editor</h1>
      <p className="text-xs text-vs-muted">Create a room and share the link.</p>
      <button onClick={onCreateRoom} className="btn btn-primary">Create room</button>
    </main>
  );
}