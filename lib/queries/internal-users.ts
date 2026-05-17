export function useInternalUsers(_params?: any) {
  return {
    data: { results: [] as any[] },
    isLoading: false,
    isError: false,
  };
}

export function useInternalUserById(_id: string | null) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
  };
}
