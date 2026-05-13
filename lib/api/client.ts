// ============================================================================
// PSR Platform API Client (Mock Mode)
// ============================================================================

import type {
  User,
  PolicyDocument,
  ConceptNote,
  CallForProposal,
  ResearchProposal,
  ResearchProject,
  AuditLog,
  Notification,
  TaxonomyItem,
  Institution,
  ApiResponse,
  PaginatedResponse,
  FilterOptions,
  PaginationOptions,
} from '@/lib/types'

import {
  mockUsers,
  mockPolicyDocuments,
  mockConceptNotes,
  mockCalls,
  mockProposals,
  mockProjects,
  mockAuditLogs,
  mockNotifications,
  mockPolicyTypes,
  mockResearchAreas,
  mockInstitutions,
  mockDashboardStats,
} from './mock-data'

// Simulated network delay
const delay = (ms: number = 400) => new Promise(resolve => setTimeout(resolve, ms + Math.random() * 300))

// Helper for pagination
function paginate<T>(
  items: T[],
  options: PaginationOptions
): PaginatedResponse<T> {
  const { page, pageSize } = options
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedItems = items.slice(startIndex, endIndex)

  return {
    data: paginatedItems,
    pagination: {
      page,
      pageSize,
      total: items.length,
      totalPages: Math.ceil(items.length / pageSize),
    },
  }
}

// Helper for filtering
function filterItems<T extends Record<string, unknown>>(
  items: T[],
  filters: FilterOptions
): T[] {
  return items.filter(item => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const searchableFields = ['title', 'name', 'firstName', 'lastName', 'email', 'description']
      const matches = searchableFields.some(field => {
        const value = item[field]
        return typeof value === 'string' && value.toLowerCase().includes(searchLower)
      })
      if (!matches) return false
    }

    // Status filter
    if (filters.status && item.status !== filters.status) {
      return false
    }

    // Role filter
    if (filters.role && item.role !== filters.role) {
      return false
    }

    return true
  })
}

// ============================================================================
// User API
// ============================================================================
export const userApi = {
  async getUsers(
    filters: FilterOptions = {},
    pagination: PaginationOptions = { page: 1, pageSize: 10 }
  ): Promise<PaginatedResponse<User>> {
    await delay()
    const filtered = filterItems(mockUsers, filters)
    return paginate(filtered, pagination)
  },

  async getUser(id: string): Promise<ApiResponse<User>> {
    await delay()
    const user = mockUsers.find(u => u.id === id)
    if (!user) {
      return { success: false, message: 'User not found' }
    }
    return { success: true, data: user }
  },

  async createUser(data: Partial<User>): Promise<ApiResponse<User>> {
    await delay()
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: data.email || '',
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      role: data.role || 'researcher',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    }
    mockUsers.push(newUser)
    return { success: true, data: newUser }
  },

  async updateUser(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
    await delay()
    const index = mockUsers.findIndex(u => u.id === id)
    if (index === -1) {
      return { success: false, message: 'User not found' }
    }
    mockUsers[index] = { ...mockUsers[index], ...data, updatedAt: new Date().toISOString() }
    return { success: true, data: mockUsers[index] }
  },

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    await delay()
    const index = mockUsers.findIndex(u => u.id === id)
    if (index === -1) {
      return { success: false, message: 'User not found' }
    }
    mockUsers.splice(index, 1)
    return { success: true }
  },
}

// ============================================================================
// Concept Note API
// ============================================================================
export const conceptNoteApi = {
  async getConceptNotes(
    filters: FilterOptions = {},
    pagination: PaginationOptions = { page: 1, pageSize: 10 }
  ): Promise<PaginatedResponse<ConceptNote>> {
    await delay()
    const filtered = filterItems(mockConceptNotes, filters)
    return paginate(filtered, pagination)
  },

  async getConceptNote(id: string): Promise<ApiResponse<ConceptNote>> {
    await delay()
    const note = mockConceptNotes.find(n => n.id === id)
    if (!note) {
      return { success: false, message: 'Concept note not found' }
    }
    return { success: true, data: note }
  },

  async createConceptNote(data: Partial<ConceptNote>): Promise<ApiResponse<ConceptNote>> {
    await delay()
    const newNote: ConceptNote = {
      id: `cn-${Date.now()}`,
      title: data.title || '',
      background: data.background || '',
      objectives: data.objectives || '',
      scope: data.scope || '',
      expectedOutcomes: data.expectedOutcomes || '',
      status: 'draft',
      policyType: data.policyType || 'guideline',
      createdBy: data.createdBy!,
      attachments: [],
      reviews: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    }
    mockConceptNotes.push(newNote)
    return { success: true, data: newNote }
  },

  async updateConceptNote(id: string, data: Partial<ConceptNote>): Promise<ApiResponse<ConceptNote>> {
    await delay()
    const index = mockConceptNotes.findIndex(n => n.id === id)
    if (index === -1) {
      return { success: false, message: 'Concept note not found' }
    }
    mockConceptNotes[index] = { ...mockConceptNotes[index], ...data, updatedAt: new Date().toISOString() }
    return { success: true, data: mockConceptNotes[index] }
  },

  async submitConceptNote(id: string): Promise<ApiResponse<ConceptNote>> {
    return this.updateConceptNote(id, { status: 'submitted' })
  },
}

// ============================================================================
// Policy Document API
// ============================================================================
export const policyApi = {
  async getPolicies(
    filters: FilterOptions = {},
    pagination: PaginationOptions = { page: 1, pageSize: 10 }
  ): Promise<PaginatedResponse<PolicyDocument>> {
    await delay()
    const filtered = filterItems(mockPolicyDocuments, filters)
    return paginate(filtered, pagination)
  },

  async getPolicy(id: string): Promise<ApiResponse<PolicyDocument>> {
    await delay()
    const policy = mockPolicyDocuments.find(p => p.id === id)
    if (!policy) {
      return { success: false, message: 'Policy not found' }
    }
    return { success: true, data: policy }
  },

  async createPolicy(data: Partial<PolicyDocument>): Promise<ApiResponse<PolicyDocument>> {
    await delay()
    const newPolicy: PolicyDocument = {
      id: `pol-${Date.now()}`,
      title: data.title || '',
      description: data.description || '',
      type: data.type || 'guideline',
      status: 'draft',
      category: data.category || '',
      version: 1,
      createdBy: data.createdBy!,
      assignedReviewers: [],
      currentVersion: 1,
      attachments: [],
      reviews: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    }
    mockPolicyDocuments.push(newPolicy)
    return { success: true, data: newPolicy }
  },

  async updatePolicy(id: string, data: Partial<PolicyDocument>): Promise<ApiResponse<PolicyDocument>> {
    await delay()
    const index = mockPolicyDocuments.findIndex(p => p.id === id)
    if (index === -1) {
      return { success: false, message: 'Policy not found' }
    }
    mockPolicyDocuments[index] = { ...mockPolicyDocuments[index], ...data, updatedAt: new Date().toISOString() }
    return { success: true, data: mockPolicyDocuments[index] }
  },
}

// ============================================================================
// Call for Proposals API
// ============================================================================
export const callsApi = {
  async getCalls(
    filters: FilterOptions = {},
    pagination: PaginationOptions = { page: 1, pageSize: 10 }
  ): Promise<PaginatedResponse<CallForProposal>> {
    await delay()
    const filtered = filterItems(mockCalls, filters)
    return paginate(filtered, pagination)
  },

  async getCall(id: string): Promise<ApiResponse<CallForProposal>> {
    await delay()
    const call = mockCalls.find(c => c.id === id)
    if (!call) {
      return { success: false, message: 'Call not found' }
    }
    return { success: true, data: call }
  },

  async getById(id: string): Promise<ApiResponse<CallForProposal>> {
    return this.getCall(id)
  },

  async createCall(data: Partial<CallForProposal>): Promise<ApiResponse<CallForProposal>> {
    await delay()
    const newCall: CallForProposal = {
      id: `call-${Date.now()}`,
      title: data.title || '',
      description: data.description || '',
      eligibilityCriteria: data.eligibilityCriteria || '',
      priorityAreas: data.priorityAreas || [],
      budgetRange: data.budgetRange || { min: 0, max: 0 },
      submissionDeadline: data.submissionDeadline || '',
      status: 'draft',
      attachments: [],
      createdBy: data.createdBy!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    }
    mockCalls.push(newCall)
    return { success: true, data: newCall }
  },

  async updateCall(id: string, data: Partial<CallForProposal>): Promise<ApiResponse<CallForProposal>> {
    await delay()
    const index = mockCalls.findIndex(c => c.id === id)
    if (index === -1) {
      return { success: false, message: 'Call not found' }
    }
    mockCalls[index] = { ...mockCalls[index], ...data, updatedAt: new Date().toISOString() }
    return { success: true, data: mockCalls[index] }
  },

  async publishCall(id: string): Promise<ApiResponse<CallForProposal>> {
    return this.updateCall(id, { status: 'open', publishedAt: new Date().toISOString() })
  },
}

// ============================================================================
// Proposal API
// ============================================================================
export const proposalsApi = {
  async getProposals(
    filters: FilterOptions = {},
    pagination: PaginationOptions = { page: 1, pageSize: 10 }
  ): Promise<PaginatedResponse<ResearchProposal>> {
    await delay()
    const filtered = filterItems(mockProposals, filters)
    return paginate(filtered, pagination)
  },

  async getProposal(id: string): Promise<ApiResponse<ResearchProposal>> {
    await delay()
    const proposal = mockProposals.find(p => p.id === id)
    if (!proposal) {
      return { success: false, message: 'Proposal not found' }
    }
    return { success: true, data: proposal }
  },

  async getById(id: string): Promise<ApiResponse<ResearchProposal>> {
    return this.getProposal(id)
  },

  async submitReview(id: string, data: any): Promise<ApiResponse<void>> {
    await delay()
    const index = mockProposals.findIndex(p => p.id === id)
    if (index === -1) {
      return { success: false, message: 'Proposal not found' }
    }
    // In mock, we just update the status or append the review
    mockProposals[index].status = data.recommendation === 'approve' ? 'approved' : 'rejected'
    return { success: true }
  },

  async createProposal(data: Partial<ResearchProposal>): Promise<ApiResponse<ResearchProposal>> {
    await delay()
    const newProposal: ResearchProposal = {
      id: `prop-${Date.now()}`,
      callId: data.callId || '',
      title: data.title || '',
      abstract: data.abstract || '',
      background: data.background || '',
      objectives: data.objectives || '',
      methodology: data.methodology || '',
      expectedOutcomes: data.expectedOutcomes || '',
      ethicalConsiderations: data.ethicalConsiderations || '',
      principalInvestigator: data.principalInvestigator!,
      coInvestigators: data.coInvestigators || [],
      institution: data.institution || '',
      researchArea: data.researchArea || '',
      budget: data.budget || { personnel: 0, equipment: 0, consumables: 0, travel: 0, other: 0, total: 0 },
      timeline: data.timeline || [],
      status: 'draft',
      attachments: [],
      reviews: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    }
    mockProposals.push(newProposal)
    return { success: true, data: newProposal }
  },

  async updateProposal(id: string, data: Partial<ResearchProposal>): Promise<ApiResponse<ResearchProposal>> {
    await delay()
    const index = mockProposals.findIndex(p => p.id === id)
    if (index === -1) {
      return { success: false, message: 'Proposal not found' }
    }
    mockProposals[index] = { ...mockProposals[index], ...data, updatedAt: new Date().toISOString() }
    return { success: true, data: mockProposals[index] }
  },

  async submitProposal(id: string): Promise<ApiResponse<ResearchProposal>> {
    return this.updateProposal(id, { status: 'submitted', submittedAt: new Date().toISOString() })
  },
}

// ============================================================================
// Project API
// ============================================================================
export const monitoringApi = {
  async getProjects(
    filters: FilterOptions = {},
    pagination: PaginationOptions = { page: 1, pageSize: 10 }
  ): Promise<PaginatedResponse<ResearchProject>> {
    await delay()
    const filtered = filterItems(mockProjects, filters)
    return paginate(filtered, pagination)
  },

  async getProjectById(id: string): Promise<ApiResponse<ResearchProject>> {
    await delay()
    const project = mockProjects.find(p => p.id === id)
    if (!project) {
      return { success: false, message: 'Project not found' }
    }
    return { success: true, data: project }
  },
}

// ============================================================================
// Audit Log API
// ============================================================================
export const auditApi = {
  async getAuditLogs(
    filters: FilterOptions = {},
    pagination: PaginationOptions = { page: 1, pageSize: 10 }
  ): Promise<PaginatedResponse<AuditLog>> {
    await delay()
    const filtered = filterItems(mockAuditLogs, filters)
    return paginate(filtered, pagination)
  },
}

// ============================================================================
// Notification API
// ============================================================================
export const notificationApi = {
  async getNotifications(userId: string): Promise<ApiResponse<Notification[]>> {
    await delay()
    const notifications = mockNotifications.filter(n => n.userId === userId)
    return { success: true, data: notifications }
  },

  async markAsRead(id: string): Promise<ApiResponse<void>> {
    await delay()
    const notification = mockNotifications.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
    return { success: true }
  },

  async markAllAsRead(userId: string): Promise<ApiResponse<void>> {
    await delay()
    mockNotifications
      .filter(n => n.userId === userId)
      .forEach(n => { n.read = true })
    return { success: true }
  },
}

// ============================================================================
// Taxonomy API
// ============================================================================
export const taxonomyApi = {
  async getPolicyTypes(): Promise<ApiResponse<TaxonomyItem[]>> {
    await delay()
    return { success: true, data: mockPolicyTypes }
  },

  async getResearchAreas(): Promise<ApiResponse<TaxonomyItem[]>> {
    await delay()
    return { success: true, data: mockResearchAreas }
  },

  async getInstitutions(): Promise<ApiResponse<Institution[]>> {
    await delay()
    return { success: true, data: mockInstitutions }
  },

  async createTaxonomyItem(type: string, data: Partial<TaxonomyItem>): Promise<ApiResponse<TaxonomyItem>> {
    await delay()
    const newItem: TaxonomyItem = {
      id: `${type}-${Date.now()}`,
      name: data.name || '',
      description: data.description,
      order: data.order || 999,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    if (type === 'policyType') mockPolicyTypes.push(newItem)
    if (type === 'researchArea') mockResearchAreas.push(newItem)
    return { success: true, data: newItem }
  },
}

// ============================================================================
// Dashboard API
// ============================================================================
export const dashboardApi = {
  async getStats(role: string): Promise<ApiResponse<Record<string, unknown>>> {
    await delay()
    const stats = {
      system_admin: mockDashboardStats.admin,
      psr_officer: mockDashboardStats.psrOfficer,
      leo_officer: mockDashboardStats.psrOfficer,
      researcher: mockDashboardStats.researcher,
      roc_reviewer: mockDashboardStats.reviewer,
      director: mockDashboardStats.admin,
      institutional_partner: mockDashboardStats.researcher,
    }
    return { success: true, data: stats[role as keyof typeof stats] || stats.researcher }
  },
}
