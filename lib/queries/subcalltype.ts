export function useSubCallType(id: string) {
  return {
    data: id ? { id, name: "Sub Call Type" } : undefined,
    isLoading: false,
    isError: false,
  };
}
