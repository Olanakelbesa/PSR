import type { GrantCall } from "@/types";

// Mock grant calls data (should match the one in grant-calls page)
export const MOCK_GRANT_CALLS: GrantCall[] = [
  {
    id: 1,
    title: "2025 Research Excellence Grant",
    description:
      "Support for fundamental research across all scientific disciplines.",
    proposal_type: "Research",
    sub_call_type: "Basic Research",
    open_date: "2025-01-01T00:00:00Z",
    close_date: "2025-03-31T23:59:59Z",
    status: "open",
    thumbnail: null,
  },
  {
    id: 2,
    title: "Community Engagement Innovation Fund",
    description:
      "Fund projects that bridge the gap between research and community impact.",
    proposal_type: "Community",
    sub_call_type: "Community Outreach",
    open_date: "2025-02-01T00:00:00Z",
    close_date: "2025-04-30T23:59:59Z",
    status: "open",
    thumbnail: null,
  },
];

// Call types remain simple string arrays
export const CALL_TYPES = ["Research", "Community"];

// Sub call types remain simple string arrays
export const SUB_CALL_TYPES = [
  "Basic Research",
  "Community Outreach",
  "Applied Research",
  "Health Research",
  "Education Programs",
  "Health Programs",
  "Education Research",
];

// Thematic areas - simplified
export const THEMATIC_AREAS = [
  { id: 1, name: "Theme 1: Agriculture, Water & Food Security" },
  { id: 2, name: "Theme 2: Manufacturing and Construction" },
  { id: 3, name: "Theme 3: Natural Resources" },
  { id: 4, name: "Theme 4: Promoting Health and Human Well-being" },
  { id: 5, name: "Theme 5: Social Sciences, Economics and Development" },
  { id: 6, name: "Theme 6: Innovation and Communication Technology" },
  { id: 7, name: "Theme 7: Artificial Intelligence and Big Data" },
];
