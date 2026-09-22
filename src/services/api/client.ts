const BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

const ACCESS_KEY = "cg_access";
const REFRESH_KEY = "cg_refresh";
const USER_KEY = "cg_user";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(REFRESH_KEY);
}

export function saveTokens(access: string, refresh: string) {
  sessionStorage.setItem(ACCESS_KEY, access);
  sessionStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(USER_KEY);

  // Remove old persistent tokens from previous implementation.
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function saveUser(user: unknown) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getSavedUser<T = unknown>(): T | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(USER_KEY);

  try {
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

let refreshing: Promise<string | null> | null = null;

async function refresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) return null;

  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/token/refresh/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh: refreshToken,
          }),
          cache: "no-store",
        });

        if (!res.ok) {
          clearTokens();
          return null;
        }

        const data = await res.json();

        if (!data?.access) {
          clearTokens();
          return null;
        }

        saveTokens(data.access, data.refresh ?? refreshToken);

        return data.access;
      } catch {
        clearTokens();
        return null;
      } finally {
        refreshing = null;
      }
    })();
  }

  return refreshing;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = getAccessToken();

  const headers = new Headers(init.headers);

  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (res.status === 401 && retry && getRefreshToken()) {
    const nextToken = await refresh();

    if (nextToken) {
      return apiFetch<T>(path, init, false);
    }

    clearTokens();

    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }

    throw new Error("Session expired. Please login again.");
  }

  const text = await res.text();

  let data: unknown = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      detail: text,
    };
  }

  if (!res.ok) {
    let message =
      typeof data === "object" &&
      data !== null &&
      "detail" in data
        ? String((data as { detail: unknown }).detail)
        : typeof data === "object" &&
            data !== null &&
            "message" in data
          ? String((data as { message: unknown }).message)
          : "Request failed";

    if (
      typeof data === "object" &&
      data !== null &&
      "remaining_attempts" in data
    ) {
      message += ` Remaining login attempts: ${String(
        (data as { remaining_attempts: unknown }).remaining_attempts,
      )}.`;
    }

    if (
      typeof data === "object" &&
      data !== null &&
      "password" in data
    ) {
      const passwordError = (data as { password: unknown }).password;

      message +=
        " " +
        (Array.isArray(passwordError)
          ? passwordError.join(" ")
          : String(passwordError));
    }

    throw new Error(message);
  }

  return data as T;
}