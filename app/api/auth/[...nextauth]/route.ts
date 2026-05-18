// ============================================================================
// PSR Platform — NextAuth v5 Route Handler
// ============================================================================

import NextAuth, { type Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { User } from "@/lib/types";
import { NextRequest } from "next/server";

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

const BACKEND_URL = process.env.BACKEND_URL ?? "https://psr-policyresearchmanagmentsystem.onrender.com";

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
            console.error(`[NextAuth] Missing user or token in response. Data:`, JSON.stringify(data));
            return null;
          }

          return {
            id: String(user.id),
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            backendToken: token,
            backendRefreshToken: refreshToken,
            backendTokenExpires: data.data?.accessToken?.expires ? new Date(data.data.accessToken.expires).getTime() : Date.now() + 1000 * 60 * 60 * 8,
            psrUser: user,
          };
        } catch (err) {
          console.error(`[NextAuth] Network or parsing error during login:`, err);
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
      }

      const now = Date.now();
      const tokenExpires = (token.backendTokenExpires as number) ?? 0;

      if (now < tokenExpires) {
        return token;
      }

      if (!token.backendRefreshToken) {
        return { ...token, error: "RefreshTokenError" };
      }

      try {
        const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: token.backendRefreshToken }),
        });

        if (!res.ok) throw new Error("Refresh failed");

        const data = await res.json();
        return {
          ...token,
          backendToken: data.accessToken ?? data.token,
          backendRefreshToken: data.refreshToken ?? token.backendRefreshToken,
          backendTokenExpires: Date.now() + 1000 * 60 * 60 * 8,
        };
      } catch {
        return { ...token, error: "RefreshTokenError" };
      }
    },
    async session({ session, token }) {
      if (token) {
        session.user = token.user as any;
        session.backendToken = token.backendToken as string;
        session.backendRefreshToken = token.backendRefreshToken as string | undefined;
        session.error = token.error as Session["error"];
      }
      return session;
    },
  },
});

export const { GET, POST } = handlers;
