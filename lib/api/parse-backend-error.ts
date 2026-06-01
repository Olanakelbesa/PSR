// Parses standard PSR backend API error payloads for display in the UI.

export type BackendApiErrorBody = {
  success?: boolean;
  message?: string;
  data?: unknown;
  statusCode?: number;
  error?:
    | string
    | string[]
    | Record<string, string | string[]>
    | {
        code?: string;
        message?: string;
        details?: Record<string, string | string[]>;
      };
  errors?: Record<string, string | string[]>;
};

function flattenFieldMessages(
  source: Record<string, unknown>,
  options?: { skipKeys?: string[] },
) {
  const skip = new Set(options?.skipKeys ?? []);

  return Object.entries(source).flatMap(([field, value]) => {
    if (skip.has(field)) return [];

    const list = Array.isArray(value) ? value : [value];
    return list
      .map((entry) => String(entry).trim())
      .filter(Boolean)
      .map((entry) => (field ? `${field}: ${entry}` : entry));
  });
}

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
    const nested = data.error as Record<string, unknown>;

    if (typeof nested.message === "string" && nested.message.trim()) {
      return nested.message.trim();
    }

    if (nested.details && typeof nested.details === "object") {
      const detailMessages = flattenFieldMessages(
        nested.details as Record<string, unknown>,
      );
      if (detailMessages.length > 0) return detailMessages.join(" ");
    }

    const messages = flattenFieldMessages(nested, {
      skipKeys: ["code", "message", "details"],
    });
    if (messages.length > 0) return messages.join(" ");
  }

  if (data.errors && typeof data.errors === "object") {
    const messages = flattenFieldMessages(
      data.errors as Record<string, unknown>,
    );
    if (messages.length > 0) return messages.join(" ");
  }

  return fallback;
}

export function parseBackendApiMessageFromError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: unknown } }).response;
    if (response?.data) {
      return parseBackendApiMessage(response.data, fallback);
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
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
