export function useOffice(id: string) {
  return {
    data: id ? { id, name: "Office" } : undefined,
    isLoading: false,
    isError: false,
  };
}
