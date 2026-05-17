export function useOfficeLevel(id: string) {
  return {
    data: id ? { id, name: "Office Level" } : undefined,
    isLoading: false,
    isError: false,
  };
}
