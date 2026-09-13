const API_URL = "http://localhost:4000";

export async function checkServerHealth() {
  const response = await fetch(`${API_URL}/api/health`);

  if (!response.ok) {
    throw new Error("Server health check failed");
  }

  return response.json();
}