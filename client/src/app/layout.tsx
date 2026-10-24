import type { Metadata } from "next";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = { title: `${APP_NAME} · Collaborative code editor`, description: APP_TAGLINE };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}