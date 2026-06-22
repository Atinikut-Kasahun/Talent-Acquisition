/**
 * authFetch — a drop-in replacement for fetch() that:
 *  1. Automatically attaches the JWT Authorization header.
 *  2. On a 401 response, clears the stale token and redirects to /signin.
 */
export function getAuthHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export async function authFetch(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...(init?.headers ?? {}),
  };

  const res = await fetch(input, { ...init, headers });

  if (res.status === 401) {
    // Token expired or invalid — clean up and redirect to sign-in
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/signin";
  }

  return res;
}
