// Thin route handler — config lives in lib/auth/nextauth.ts (Vercel function budget).
// Served at /auth-api/* (not /api/auth/*) because the MOH gateway routes /api/*
// directly to Django, bypassing this app. Matches `basePath` in lib/auth/nextauth.ts.
export { GET, POST } from "@/lib/auth/nextauth";
