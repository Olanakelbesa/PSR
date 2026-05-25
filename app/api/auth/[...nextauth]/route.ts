// ============================================================================
// PSR Platform — NextAuth v5 Route Handler
// ============================================================================

import NextAuth, { type Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { User } from "@/lib/types";

// ─── Type augmentation ────────────────────────────────────────────────────────
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

const BACKEND_URL =
  process.env.BACKEND_URL ??
  "http://localhost:8000"; /* Default for development; should be overridden in production via .env.local */

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
          const res = await fetch(`${BACKEND_URL}/api/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          if (!res.ok) {
            console.error(`[NextAuth] Login failed with status: ${res.status}`);
            const errorText = await res.text();
            console.error(`[NextAuth] Error response: ${errorText}`);
            return null;
          }

          const data = await res.json();
          const user = data.data?.user;
          const token = data.data?.accessToken?.token;
          const refreshToken = data.data?.refreshToken?.token;

          if (!user || !token) {
            console.error(
              `[NextAuth] Missing user or token in response. Data:`,
              JSON.stringify(data),
            );
            return null;
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
          console.error(
            `[NextAuth] Network or parsing error during login:`,
            err,
          );
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        token.backendToken = u.backendToken;
        token.backendRefreshToken = u.backendRefreshToken;
        token.backendTokenExpires = u.backendTokenExpires;
        token.user = u.psrUser;
        token.error = undefined;
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
        return { ...token, error: "RefreshTokenError" };
      }

      try {
        const res = await fetch(`${BACKEND_URL}/api/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: token.backendRefreshToken }),
        });

        if (!res.ok) {
          throw new Error(`Refresh failed: ${res.status}`);
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
          console.error("[NextAuth] Token refresh failed:", err);
        }
        return { ...token, error: "RefreshTokenError" };
      }
    },
    async session({ session, token }) {
      if (token) {
        session.user = token.user as any;
        session.backendToken = token.backendToken as string;
        session.backendRefreshToken = token.backendRefreshToken as
          | string
          | undefined;
        session.error = token.error as Session["error"];
      }
      return session;
    },
  },
});

export const { GET, POST } = handlers;
