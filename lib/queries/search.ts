import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/api/endpoints";

export interface SearchResultItem {
  id: number;
  source: "policy_repository" | "research_output";
  title: string;
  subtitle: string;
  snippet: string;
  score: number;
  access_level: "public" | "restricted";
  document_type: string;
  date: string | null;
  url: string;
  file_url: string;
  metadata: Record<string, any>;
  explain?: Record<string, any>;
}

export interface SearchResponse {
  success: boolean;
  results: SearchResultItem[];
  meta: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    counts: {
      policy_repository: number;
      research_outputs: number;
    };
  };
  facets: {
    source: Array<{ value: string; count: number }>;
  };
}

export interface SearchFilters {
  search?: string;
  source?: "all" | "policy_repository" | "research_output";
  mode?: "hybrid" | "keyword" | "semantic" | "fuzzy" | "default";
  page?: number;
  page_size?: number;
  sort?: "relevance" | "date_desc" | "date_asc";
  access_level?: "all" | "public" | "restricted";
  explain?: boolean;
  year?: number | string;
  organization?: string;
  status?: string;
  doc_type?: string;
}

export function useUnifiedSearch(filters: SearchFilters = {}) {
  return useQuery<SearchResponse>({
    queryKey: ["unified-search", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.source) params.append("source", filters.source);
      if (filters.mode) params.append("mode", filters.mode);
      if (filters.page) params.append("page", String(filters.page));
      if (filters.page_size) params.append("page_size", String(filters.page_size));
      if (filters.sort) params.append("sort", filters.sort);
      if (filters.access_level) params.append("access_level", filters.access_level);
      if (filters.explain !== undefined) params.append("explain", String(filters.explain));
      if (filters.year) params.append("year", String(filters.year));
      if (filters.organization) params.append("organization", filters.organization);
      if (filters.status) params.append("status", filters.status);
      if (filters.doc_type) params.append("doc_type", filters.doc_type);

      const queryString = params.toString();
      const url = `${API_ENDPOINTS.SEARCH.LIST}${queryString ? `?${queryString}` : ""}`;
      const { data } = await api.get(url);
      return data as SearchResponse;
    },
    enabled: true,
  });
}

export interface SuggestionItem {
  id: number;
  source: string;
  title: string;
  organization: string;
  document_type: string;
}

export function useSearchSuggestions(search: string, source: string = "all") {
  return useQuery<SuggestionItem[]>({
    queryKey: ["search-suggestions", search, source],
    queryFn: async () => {
      if (!search || search.trim().length < 2) return [];
      const params = new URLSearchParams();
      params.append("search", search);
      params.append("source", source);
      params.append("access_level", "public");
      params.append("mode", "hybrid");
      params.append("page", "1");
      params.append("page_size", "10");
      params.append("sort", "relevance");

      const url = `${API_ENDPOINTS.SEARCH.LIST}?${params.toString()}`;
      const { data } = await api.get<SearchResponse>(url);
      return (data.results ?? []).map((item) => ({
        id: item.id,
        source: item.source,
        title: item.title,
        organization: String(item.metadata?.organization ?? item.subtitle ?? ""),
        document_type: item.document_type,
      }));
    },
    enabled: search.trim().length >= 2,
  });
}
