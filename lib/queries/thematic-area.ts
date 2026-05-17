import { mockResearchAreas } from "@/lib/api/mock-data";

export function useThematicAreas() {
  return {
    data: { data: mockResearchAreas as any[] },
    isLoading: false,
    isError: false,
  };
}

export function useThematicArea(id: string) {
  return {
    data: (mockResearchAreas as any[]).find(
      (area) => String(area.id) === String(id),
    ),
    isLoading: false,
    isError: false,
  };
}
