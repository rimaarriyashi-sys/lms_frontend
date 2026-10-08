const API_BASE_URL = "http://localhost:8080";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("token");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`,
    { ...options, headers },
  );

  const responseText = await response.text();
  let data: unknown = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      if (response.ok) {
        throw new Error("Invalid JSON response from API");
      }
    }
  }

  if (!response.ok) {
    const errorMessage =
      typeof data === "object" && data !== null && "error" in data &&
      typeof data.error === "string"
        ? data.error
        : `Request failed with status ${response.status}`;

    throw new Error(errorMessage);
  }

  return data as T;
}

export async function apiFetchList<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T[]> {
  const result = await apiFetch<{ data: T[] }>(endpoint, options);
  return Array.isArray(result?.data) ? result.data : [];
}