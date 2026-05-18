import apiClient from "./client";

export const userApi = {
  getUsers: async (...args: any[]) => (await apiClient.get("/users", { params: Object.assign({}, ...args) })).data,
  getUser: async (id: string) => (await apiClient.get(`/users/${id}`)).data,
  createUser: async (data: any) => (await apiClient.post("/users", data)).data,
  updateUser: async (id: string, data: any) => (await apiClient.patch(`/users/${id}`, data)).data,
  deleteUser: async (id: string) => (await apiClient.delete(`/users/${id}`)).data,
};

export const policyApi = {
  getPolicies: async (...args: any[]) => (await apiClient.get("/policies", { params: Object.assign({}, ...args) })).data,
  getPolicy: async (id: string) => (await apiClient.get(`/policies/${id}`)).data,
  createPolicy: async (data: any) => (await apiClient.post("/policies", data)).data,
  updatePolicy: async (id: string, data: any) => (await apiClient.patch(`/policies/${id}`, data)).data,
  deletePolicy: async (id: string) => (await apiClient.delete(`/policies/${id}`)).data,
  uploadDocument: async (id: string, data: FormData) => (await apiClient.post(`/policies/${id}/documents`, data, { headers: { "Content-Type": "multipart/form-data" } })).data,
};

export const conceptNoteApi = {
  getConceptNotes: async (...args: any[]) => (await apiClient.get("/v1/concept-notes/", { params: Object.assign({}, ...args) })).data,
  getConceptNote: async (id: string) => (await apiClient.get(`/v1/concept-notes/${id}/`)).data,
  createConceptNote: async (data: any) => (await apiClient.post("/v1/concept-notes/", data)).data,
  updateConceptNote: async (id: string, data: any) => (await apiClient.patch(`/v1/concept-notes/${id}/`, data)).data,
  deleteConceptNote: async (id: string) => (await apiClient.delete(`/v1/concept-notes/${id}/`)).data,
  submitConceptNote: async (id: string) => (await apiClient.post(`/v1/concept-notes/${id}/submit/`)).data,
};

export const proposalsApi = {
  getProposals: async (...args: any[]) => (await apiClient.get("/proposals", { params: Object.assign({}, ...args) })).data,
  getProposal: async (id: string) => (await apiClient.get(`/proposals/${id}`)).data,
  getById: async (id: string) => (await apiClient.get(`/proposals/${id}`)).data,
  createProposal: async (data: any) => (await apiClient.post("/proposals", data)).data,
  updateProposal: async (id: string, data: any) => (await apiClient.patch(`/proposals/${id}`, data)).data,
  deleteProposal: async (id: string) => (await apiClient.delete(`/proposals/${id}`)).data,
  submitProposal: async (id: string) => (await apiClient.post(`/proposals/${id}/submit`)).data,
  assignReviewers: async (id: string, reviewerIds: string[]) => (await apiClient.post(`/proposals/${id}/assign-reviewers`, { reviewerIds })).data,
  submitReview: async (id: string, data: any) => (await apiClient.post(`/proposals/${id}/reviews`, data)).data,
};

export const taxonomyApi = {
  getThematicAreas: async (...args: any[]) => (await apiClient.get("/v1/thematicareas", { params: Object.assign({}, ...args) })).data,
  getInstitutions: async (...args: any[]) => (await apiClient.get("/v1/organizations/", { params: Object.assign({}, ...args) })).data,
};

export const callsApi = {
  getCalls: async (...args: any[]) => (await apiClient.get("/calls", { params: Object.assign({}, ...args) })).data,
  getCall: async (id: string) => (await apiClient.get(`/calls/${id}`)).data,
  createCall: async (data: any) => (await apiClient.post("/calls", data)).data,
  updateCall: async (id: string, data: any) => (await apiClient.patch(`/calls/${id}`, data)).data,
  deleteCall: async (id: string) => (await apiClient.delete(`/calls/${id}`)).data,
};

export const monitoringApi = {
  getProgressReports: async (...args: any[]) => (await apiClient.get("/projects/progress-reports", { params: Object.assign({}, ...args) })).data,
  getProgressReport: async (id: string) => (await apiClient.get(`/projects/progress-reports/${id}`)).data,
  getProjects: async (...args: any[]) => (await apiClient.get("/projects", { params: Object.assign({}, ...args) })).data,
  getProjectById: async (id: string) => (await apiClient.get(`/projects/${id}`)).data,
  submitProgressReport: async (id: string, data: any) => (await apiClient.post(`/projects/progress-reports/${id}/submit`, data)).data,
  getTerminalReports: async (...args: any[]) => (await apiClient.get("/projects/terminal-reports", { params: Object.assign({}, ...args) })).data,
  getTerminalReport: async (id: string) => (await apiClient.get(`/projects/terminal-reports/${id}`)).data,
};
