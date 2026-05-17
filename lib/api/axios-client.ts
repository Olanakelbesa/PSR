import { API_ENDPOINTS } from "./api-config";

const proposalOptionsData = {
  data: {
    proposal_type: {
      id: "1",
      name: "Default Proposal Type",
      options: [{ id: "1", name: "Default Proposal Type" }],
    },
    subcall: { options: [] },
    submission_levels: [],
  },
};

const proposalTemplateSectionsData = { data: [] };

const axiosClient = {
  async get(url: string, _config?: unknown) {
    if (url === API_ENDPOINTS.PROPOSALS.OPTIONS) {
      return { data: proposalOptionsData };
    }

    if (url === API_ENDPOINTS.PROPOSAL_TEMPLATE_SECTION.LIST) {
      return { data: proposalTemplateSectionsData };
    }

    return { data: {} };
  },
};

export default axiosClient;
