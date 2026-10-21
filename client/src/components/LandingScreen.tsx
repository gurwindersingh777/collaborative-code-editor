import { APP_NAME, APP_TAGLINE } from "@/lib/config";

type LandingScreenProps = { onCreateRoom: () => void };

export default function LandingScreen({ onCreateRoom }: LandingScreenProps) {
  return (
    <main className="flex h-screen flex-col items-center justify-center gap-3">
      <h1 className="text-sm font-medium">{APP_NAME}</h1>
      <p className="text-xs text-vs-muted">{APP_TAGLINE}</p>
      <button onClick={onCreateRoom} className="btn btn-primary">Create room</button>
    </main>
  );
}