export const config = {
  port: Number(process.env.PORT) || 4000,
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:3000",
  pistonUrl: process.env.PISTON_URL ?? "http://localhost:2000",
} as const; 