// ============================================================================
// RPDMS — NextAuth v5 configuration (server-only)
// ============================================================================
// Kept out of app/api route files so route handlers stay thin (1 function each).

import NextAuth, { type Session, CredentialsSignin } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { User } from "@/lib/types";
import { isPublicPath } from "@/lib/auth/public-routes";
import { parseBackendApiMessage } from "@/lib/api/parse-backend-error";

class BackendLoginError extends CredentialsSignin {
  code: string;

  constructor(message: string) {
    super();
    this.code = message;
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: User["role"];
      institution?: string;
      department?: string;
      position?: string;
      status: User["status"];
      avatar?: string;
    };
    backendToken: string;
    backendRefreshToken?: string;
    expires: string;
    error?: "RefreshTokenError";
  }

  interface JWT {
    backendToken: string;
    backendRefreshToken?: string;
    backendTokenExpires?: number;
    user: Session["user"];
    error?: "RefreshTokenError";
  }
}

// Read at request time — module-level process.env is inlined at `next build`
// and ignores .env changes until you rebuild.
function getBackendUrl(): string {
  const raw =
    process.env["BACKEND_URL"] ??
    process.env["API_BASE_URL"] ??
    "http://127.0.0.1:8001";
  return raw.replace(/\/+$/, "");
}

type MinimalSessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: User["role"];
  status: User["status"];
  institution?: string;
  department?: string;
  position?: string;
  avatar?: string;
  phone?: string;
  createdAt?: string;
  lastLogin?: string;
};

function buildMinimalSessionUser(user: any): MinimalSessionUser {
  const role =
    (user?.roles?.[0]?.slug as User["role"] | undefined) ??
    (user?.role as User["role"] | undefined) ??
    "researcher";

  return {
    id: String(user?.id ?? ""),
    email: user?.email ?? "",
    firstName: user?.firstName ?? user?.first_name ?? "",
    lastName: user?.lastName ?? user?.last_name ?? "",
    role,
    status: (user?.status as User["status"]) ?? "active",
    institution: user?.organization?.name ?? user?.institution,
    department: user?.unit?.name ?? user?.department,
    position: user?.title?.name ?? user?.position,
    avatar: user?.photoUrl ?? user?.avatar,
    phone: user?.phone,
    createdAt: user?.createdAt ?? user?.created,
    lastLogin: user?.lastLogin ?? user?.last_login,
  };
}

function staleSessionToken(token: Record<string, unknown>) {
  return {
    ...token,
    error: "RefreshTokenError" as const,
    user: undefined,
    backendToken: "",
    backendRefreshToken: "",
    backendTokenExpires: 0,
  };
}

function buildDisplayName(user: any): string {
  const parts = [
    user?.firstName ?? user?.first_name,
    user?.middleName ?? user?.middle_name,
    user?.lastName ?? user?.last_name,
  ]
    .map((part) => String(part ?? "").trim())
    .filter((part) => part.length > 0);

  return parts.join(" ") || user?.email || "User";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  // Required when self-hosting behind a reverse proxy (nginx/gateway):
  // trust the Host / X-Forwarded-* headers to build correct callback URLs.
  trustHost: true,
  // The MOH gateway routes /api/* away from this app, so auth endpoints
  // live under /auth-api instead of the default /api/auth.
  basePath: "/auth-api",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "PSR Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.toLowerCase().trim();
        const password = credentials?.password as string;

        if (!email || !password) return null;

        try {
          const res = await fetch(`${getBackendUrl()}/api/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          if (!res.ok) {
            let errorBody: unknown = null;
            try {
              errorBody = await res.json();
            } catch {
              /* non-JSON error body */
            }

            const message = parseBackendApiMessage(
              errorBody,
              "Invalid email or password.",
            );

            if (process.env.NODE_ENV === "development") {
              console.error(
                `[NextAuth] Login failed with status: ${res.status}`,
                errorBody,
              );
            }

            throw new BackendLoginError(message);
          }

          const data = await res.json();
          const user = data.data?.user;
          const token = data.data?.accessToken?.token;
          const refreshToken = data.data?.refreshToken?.token;

          if (!user || !token) {
            const message = parseBackendApiMessage(
              data,
              "Invalid email or password.",
            );
            throw new BackendLoginError(message);
          }

          return {
            id: String(user.id),
            email: user.email,
            name: buildDisplayName(user),
            backendToken: token,
            backendRefreshToken: refreshToken,
            backendTokenExpires: data.data?.accessToken?.expires
              ? new Date(data.data.accessToken.expires).getTime()
              : Date.now() + 1000 * 60 * 60 * 8,
            psrUser: buildMinimalSessionUser(user),
          };
        } catch (err) {
          if (err instanceof CredentialsSignin) {
            throw err;
          }

          console.error(
            `[NextAuth] login fetch failed → backend=${getBackendUrl()} ::`,
            err instanceof Error ? err.message : err,
          );

          throw new BackendLoginError(
            "Unable to reach the server. Please try again.",
          );
        }
      },
    }),
  ],
  callbacks: {
    authorized({ auth: session, request: { nextUrl } }) {
      if (isPublicPath(nextUrl.pathname)) return true;
      return !!session;
    },
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        token.backendToken = u.backendToken;
        token.backendRefreshToken = u.backendRefreshToken;
        token.backendTokenExpires = u.backendTokenExpires;
        token.user = u.psrUser;
        token.error = undefined;
      }

      if (token.error === "RefreshTokenError") {
        return staleSessionToken(token as Record<string, unknown>);
      }

      const now = Date.now();
      const tokenExpires =
        typeof token.backendTokenExpires === "number" &&
        token.backendTokenExpires > 0
          ? (token.backendTokenExpires as number)
          : now + 1000 * 60 * 60 * 8;

      if (now < tokenExpires) {
        return token;
      }

      if (!token.backendRefreshToken) {
        return staleSessionToken(token as Record<string, unknown>);
      }

      try {
        const res = await fetch(`${getBackendUrl()}/api/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: token.backendRefreshToken }),
        });

        if (!res.ok) {
          return staleSessionToken(token as Record<string, unknown>);
        }

        const data = await res.json();

        return {
          ...token,
          backendToken: data.access ?? data.accessToken ?? data.token,
          backendRefreshToken: data.refresh ?? token.backendRefreshToken,
          backendTokenExpires: Date.now() + 1000 * 60 * 60 * 8,
          error: undefined,
        };
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[NextAuth] Token refresh failed:", err);
        }
        return staleSessionToken(token as Record<string, unknown>);
      }
    },
    async session({ session, token }) {
      if (token?.error === "RefreshTokenError") {
        session.user = undefined as unknown as typeof session.user;
        session.backendToken = "";
        session.backendRefreshToken = undefined;
        session.error = "RefreshTokenError";
        return session;
      }

      if (token) {
        session.user = token.user as typeof session.user;
        session.backendToken = token.backendToken as string;
        session.backendRefreshToken = token.backendRefreshToken as
          | string
          | undefined;
        session.error = undefined;
      }
      return session;
    },
  },
});

export const { GET, POST } = handlers;
