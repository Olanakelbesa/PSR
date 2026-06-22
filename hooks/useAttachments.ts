import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  attachmentsService,
  type AttachmentsFilters,
} from "@/api/services/attachments.service";
import type {
  AttachmentCreateInput,
  AttachmentUpdateInput,
} from "@/types/attachments";

export const attachmentKeys = {
  all: ["attachments"] as const,
  list: (filters: AttachmentsFilters) =>
    ["attachments", "list", filters] as const,
  detail: (id: string | number) => ["attachments", "detail", String(id)] as const,
};

export function useAttachments(filters: AttachmentsFilters = {}) {
  return useQuery({
    queryKey: attachmentKeys.list(filters),
    queryFn: () => attachmentsService.list(filters),
  });
}

export function useAttachment(id: string | number | undefined) {
  return useQuery({
    queryKey: attachmentKeys.detail(id ?? ""),
    queryFn: () => attachmentsService.retrieve(id as string | number),
    enabled: !!id,
  });
}

export function useCreateAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: AttachmentCreateInput) =>
      attachmentsService.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.all });
    },
  });
}

export function useUpdateAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string | number;
      values: AttachmentUpdateInput;
    }) => attachmentsService.update(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.all });
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => attachmentsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.all });
    },
  });
}
