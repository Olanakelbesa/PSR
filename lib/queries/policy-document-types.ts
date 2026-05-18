import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/api/endpoints";

export interface PolicyDocumentType {
  id: number;
  name: string;
  description: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
}

export function usePolicyDocumentTypes() {
  return useQuery({
    queryKey: ["policy-document-types"],
    queryFn: async () => {
      try {
        const { data } = await api.get(API_ENDPOINTS.REFERENCE.POLICY_DOCUMENT_TYPES);
        return data.success && data.data ? (data.data as PolicyDocumentType[]) : [];
      } catch (err) {
        console.warn("[API] Failed to fetch policy document types dynamically.", err);
        return [] as PolicyDocumentType[];
      }
    },
  });
}
