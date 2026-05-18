import { useQuery } from "@tanstack/react-query";

import { taxonomyApi } from "@/lib/api/client";

export interface PolicyDocumentType {
  id: number;
  name: string;
  description: string;
  isDeleted: boolean;
  deletedAt: string | null;
}

export function usePolicyDocumentTypes() {
  return useQuery({
    queryKey: ["policy-document-types"],
    queryFn: async () => {
      const response = await taxonomyApi.getPolicyTypes();
      return response.success && response.data ? response.data : [];
    },
  });
}
