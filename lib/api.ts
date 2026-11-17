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

export async function uploadFile(file: File): Promise<{ file_url: string; file_name: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const result = await apiFetch<{ data: { file_url: string; file_name: string } }>("/api/upload", {
    method: "POST",
    body: formData,
  });
  return result.data;
}

export async function downloadFile(fileUrl: string, fileName: string): Promise<void> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
  const response = await fetch(`${API_BASE_URL}${fileUrl}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error("File tidak dapat diunduh");
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName || "file";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}