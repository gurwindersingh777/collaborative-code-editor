function parseOrigins(value: string | undefined): string[] {
  return (value ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  clientOrigins: parseOrigins(process.env.CLIENT_URL),
  pistonUrl: process.env.PISTON_URL ?? "http://localhost:2000",
  pistonKey: process.env.PISTON_KEY ?? "",
} as const;