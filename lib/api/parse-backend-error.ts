// Parses standard PSR backend API error payloads for display in the UI.

export type BackendApiErrorBody = {
  success?: boolean;
  message?: string;
  data?: unknown;
  statusCode?: number;
  error?: string | string[] | Record<string, string | string[]>;
  errors?: Record<string, string | string[]>;
};

export function parseBackendApiMessage(
  body: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!body || typeof body !== "object") return fallback;

  const data = body as BackendApiErrorBody;

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message.trim();
  }

  if (Array.isArray(data.error)) {
    const messages = data.error
      .map((entry) => String(entry).trim())
      .filter(Boolean);
    if (messages.length > 0) return messages.join(" ");
  }

  if (typeof data.error === "string" && data.error.trim()) {
    return data.error.trim();
  }

  if (data.error && typeof data.error === "object") {
    const messages = Object.entries(data.error).flatMap(([field, value]) => {
      const list = Array.isArray(value) ? value : [value];
      return list
        .map((entry) => String(entry).trim())
        .filter(Boolean)
        .map((entry) => (field ? `${field}: ${entry}` : entry));
    });
    if (messages.length > 0) return messages.join(" ");
  }

  if (data.errors && typeof data.errors === "object") {
    const messages = Object.entries(data.errors).flatMap(([field, value]) => {
      const list = Array.isArray(value) ? value : [value];
      return list
        .map((entry) => String(entry).trim())
        .filter(Boolean)
        .map((entry) => `${field}: ${entry}`);
    });
    if (messages.length > 0) return messages.join(" ");
  }

  return fallback;
}

export function getSignInErrorMessage(
  result: { error?: string | null; code?: string | null },
  fallback = "Sign in failed. Please try again.",
): string {
  const code = result.code?.trim();
  if (code && code !== "credentials") {
    try {
      return decodeURIComponent(code);
    } catch {
      return code;
    }
  }

  if (result.error && result.error !== "CredentialsSignin") {
    return result.error;
  }

  return fallback;
}
