import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  minutesService,
  type MinutesFilters,
} from "@/api/services/minutes.service";
import type { MinuteCreateInput } from "@/types/minutes";

export const minuteKeys = {
  all: ["minutes"] as const,
  list: (filters: MinutesFilters) => ["minutes", "list", filters] as const,
  detail: (id: string | number) => ["minutes", "detail", String(id)] as const,
};

export function useMinutes(filters: MinutesFilters = {}) {
  return useQuery({
    queryKey: minuteKeys.list(filters),
    queryFn: () => minutesService.list(filters),
  });
}

export function useMinute(id: string | number | undefined) {
  return useQuery({
    queryKey: minuteKeys.detail(id ?? ""),
    queryFn: () => minutesService.retrieve(id as string | number),
    enabled: !!id,
  });
}

export function useCreateMinute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: MinuteCreateInput) => minutesService.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: minuteKeys.all });
    },
  });
}
