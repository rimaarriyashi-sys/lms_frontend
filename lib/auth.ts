const TOKEN_KEY = "token";
const ROLE_ID_KEY = "role_id";

export function saveAuth(token: string, roleId: number): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_ID_KEY, String(roleId));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRoleId(): number | null {
  const roleId = localStorage.getItem(ROLE_ID_KEY);

  if (roleId === null) {
    return null;
  }

  const parsedRoleId = Number(roleId);
  return Number.isInteger(parsedRoleId) ? parsedRoleId : null;
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_ID_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

export function roleIdToPath(roleId: number): string {
  const paths: Record<number, string> = {
    1: "/admin",
    2: "/guru",
    3: "/siswa",
    4: "/kurikulum",
    5: "/kepsek",
  };

  const path = paths[roleId];

  if (!path) {
    throw new Error(`Unknown role_id: ${roleId}`);
  }

  return path;
}