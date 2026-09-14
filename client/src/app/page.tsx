"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("Checking server...");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Server returned an error");
        }

        return response.json();
      })
      .then((data) => {
        setStatus(data.status);
      })
      .catch(() => {
        setStatus("Server unavailable");
      });
  }, []);

  return (
    <main>
      <h1>Collaborative Code Editor</h1>
      <p>Backend status: {status}</p>
    </main>
  );
}