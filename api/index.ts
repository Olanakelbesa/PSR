// ============================================================================
// PSR Platform — API Layer Barrel Export
// ============================================================================
// Canonical import point for the API layer:
//   import apiClient from "@/api/client"
//   import { API_ENDPOINTS } from "@/api/endpoints"
//   import { login, getConceptNotes } from "@/api/services"

export { default as apiClient } from "./client";
export type { ApiError } from "./client";
export { tokenStorage } from "./client";
export { API_ENDPOINTS } from "./endpoints";
export type { ApiEndpoints } from "./endpoints";
export * from "./services";
