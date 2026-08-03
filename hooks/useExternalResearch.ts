import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { externalResearchService } from "@/api/services/external-research.service";
import type {
  ExternalResearchDownloadFileType,
  ExternalResearchFilters,
} from "@/types/external-research";

export const externalResearchKeys = {
  all: ["external-research"] as const,
  list: (filters: ExternalResearchFilters) =>
    ["external-research", "list", filters] as const,
  detail: (id: string | number) =>
    ["external-research", "detail", String(id)] as const,
  approvals: (filters: Record<string, unknown>) =>
    ["external-research", "approvals", filters] as const,
};

export function useExternalResearchList(filters: ExternalResearchFilters = {}) {
  return useQuery({
    queryKey: externalResearchKeys.list(filters),
    queryFn: () => externalResearchService.list(filters),
  });
}

export function useExternalResearch(id: string | number | undefined) {
  return useQuery({
    queryKey: externalResearchKeys.detail(id ?? ""),
    queryFn: () => externalResearchService.retrieve(id as string | number),
    enabled: !!id,
  });
}

export function useCreateExternalResearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: Record<string, unknown> | FormData) =>
      externalResearchService.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: externalResearchKeys.all });
    },
  });
}

export function useUpdateExternalResearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string | number;
      values: Record<string, unknown> | FormData;
    }) => externalResearchService.update(id, values),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: externalResearchKeys.all });
      queryClient.invalidateQueries({
        queryKey: externalResearchKeys.detail(variables.id),
      });
    },
  });
}

export function useSubmitExternalResearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => externalResearchService.submit(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: externalResearchKeys.all });
      queryClient.invalidateQueries({
        queryKey: externalResearchKeys.detail(id),
      });
    },
  });
}

export function useRecordExternalResearchDownload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      fileType,
    }: {
      id: string | number;
      fileType?: ExternalResearchDownloadFileType;
    }) => externalResearchService.recordDownload(id, fileType),
    onSuccess: (result, variables) => {
      queryClient.setQueriesData<any>(
        { queryKey: externalResearchKeys.all, exact: false },
        (old: any) => {
          if (!old?.data || !Array.isArray(old.data)) return old;
          return {
            ...old,
            data: old.data.map((item: any) =>
              item.id === variables.id
                ? {
                    ...item,
                    download_count: result.downloadCount,
                    downloadCount: result.downloadCount,
                  }
                : item,
            ),
          };
        },
      );

      queryClient.setQueryData(
        externalResearchKeys.detail(variables.id),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            download_count: result.downloadCount,
            downloadCount: result.downloadCount,
          };
        },
      );

      queryClient.invalidateQueries({ queryKey: externalResearchKeys.all });
    },
  });
}

export function useExternalResearchApprovals(
  filters: Record<string, unknown> = {},
) {
  return useQuery({
    queryKey: externalResearchKeys.approvals(filters),
    queryFn: () => externalResearchService.listApprovals(filters),
  });
}

export function useCreateExternalResearchApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      externalResearchService.createApproval(values),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: externalResearchKeys.all });
      if (variables.external_research) {
        queryClient.invalidateQueries({
          queryKey: externalResearchKeys.detail(variables.external_research as any),
        });
      }
    },
  });
}
