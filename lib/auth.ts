export function getSession() {
  if (typeof window === "undefined") return null;

  const session = localStorage.getItem("pos-session");

  if (!session) return null;

  return JSON.parse(session);
}

export function logout() {
  localStorage.removeItem("pos-session");
}