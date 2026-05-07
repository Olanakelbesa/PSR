// ============================================================================
// PSR Platform Mock Data
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
} from '@/lib/types'

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9)

// ============================================================================
// Users
// ============================================================================
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@moh.gov.et',
    phone: '+251911234567',
    firstName: 'Abebe',
    lastName: 'Kebede',
    role: 'system_admin',
    institution: 'Ministry of Health',
    department: 'ICT Directorate',
    position: 'System Administrator',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-03-15T08:30:00Z',
  },
  {
    id: '2',
    email: 'psr@moh.gov.et',
    phone: '+251912345678',
    firstName: 'Tigist',
    lastName: 'Haile',
    role: 'psr_officer',
    institution: 'Ministry of Health',
    department: 'PSR Office',
    position: 'Senior Officer',
    status: 'active',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    lastLogin: '2024-03-14T14:20:00Z',
  },
  {
    id: '3',
    email: 'researcher@aau.edu.et',
    phone: '+251913456789',
    firstName: 'Dawit',
    lastName: 'Mengistu',
    role: 'researcher',
    institution: 'Addis Ababa University',
    department: 'School of Public Health',
    position: 'Associate Professor',
    status: 'active',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    lastLogin: '2024-03-13T10:45:00Z',
  },
  {
    id: '4',
    email: 'reviewer@moh.gov.et',
    phone: '+251914567890',
    firstName: 'Sara',
    lastName: 'Tesfaye',
    role: 'roc_reviewer',
    institution: 'Ministry of Health',
    department: 'Research Oversight Committee',
    position: 'Technical Reviewer',
    status: 'active',
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
    lastLogin: '2024-03-12T16:00:00Z',
  },
  {
    id: '5',
    email: 'director@moh.gov.et',
    phone: '+251915678901',
    firstName: 'Yohannes',
    lastName: 'Girma',
    role: 'director',
    institution: 'Ministry of Health',
    department: 'Policy & Planning',
    position: 'Director',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-03-15T09:00:00Z',
  },
  {
    id: '6',
    email: 'leo@moh.gov.et',
    phone: '+251916789012',
    firstName: 'Meron',
    lastName: 'Alemu',
    role: 'leo_officer',
    institution: 'Ministry of Health',
    department: 'LEO Office',
    position: 'Learning Officer',
    status: 'active',
    createdAt: '2024-02-20T00:00:00Z',
    updatedAt: '2024-02-20T00:00:00Z',
    lastLogin: '2024-03-14T11:30:00Z',
  },
  {
    id: '7',
    email: 'partner@who.int',
    phone: '+251917890123',
    firstName: 'Michael',
    lastName: 'Johnson',
    role: 'institutional_partner',
    institution: 'World Health Organization',
    department: 'Country Office',
    position: 'Health Systems Advisor',
    status: 'active',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
    lastLogin: '2024-03-10T15:00:00Z',
  },
  {
    id: '8',
    email: 'inactive@test.com',
    phone: '+251918901234',
    firstName: 'Test',
    lastName: 'User',
    role: 'researcher',
    institution: 'Test Institution',
    department: 'Test Department',
    position: 'Researcher',
    status: 'inactive',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  },
]

// ============================================================================
// Concept Notes
// ============================================================================
export const mockConceptNotes: ConceptNote[] = [
  {
    id: 'cn-001',
    title: 'National Health Insurance Implementation Guidelines',
    background: 'Ethiopia has embarked on implementing a national health insurance scheme to achieve universal health coverage. This concept note proposes the development of comprehensive implementation guidelines.',
    objectives: 'To develop clear, actionable guidelines for the rollout of the national health insurance program across all regions.',
    scope: 'The guidelines will cover enrollment procedures, benefit packages, provider payment mechanisms, and quality assurance frameworks.',
    methodology: 'Literature review, stakeholder consultations, and pilot testing in selected woredas.',
    expectedOutcomes: 'A comprehensive guideline document that can be used by regional health bureaus and implementing partners.',
    timeline: 'Q2 2024 - Q4 2024',
    status: 'under_review',
    policyType: 'guideline',
    createdBy: mockUsers[1],
    attachments: [
      { id: 'att-1', name: 'Background_Document.pdf', type: 'application/pdf', size: 2500000, url: '#', uploadedAt: '2024-03-01T00:00:00Z' }
    ],
    reviews: [],
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-10T00:00:00Z',
  },
  {
    id: 'cn-002',
    title: 'Digital Health Strategy 2025-2030',
    background: 'The rapid advancement of digital technologies presents opportunities to strengthen health systems and improve health outcomes.',
    objectives: 'To develop a comprehensive digital health strategy that aligns with national health priorities and international best practices.',
    scope: 'Electronic health records, telemedicine, health information exchange, and digital health governance.',
    expectedOutcomes: 'A strategic roadmap for digital health transformation in Ethiopia.',
    status: 'draft',
    policyType: 'strategy',
    createdBy: mockUsers[5],
    attachments: [],
    reviews: [],
    createdAt: '2024-03-05T00:00:00Z',
    updatedAt: '2024-03-05T00:00:00Z',
  },
  {
    id: 'cn-003',
    title: 'Community Health Worker Training Standards',
    background: 'Community health workers play a crucial role in primary healthcare delivery. Standardized training is essential for quality service provision.',
    objectives: 'To establish national training standards for community health workers.',
    scope: 'Curriculum development, competency frameworks, and certification requirements.',
    expectedOutcomes: 'National training standards document and implementation toolkit.',
    status: 'approved',
    policyType: 'standard',
    createdBy: mockUsers[1],
    attachments: [],
    reviews: [
      {
        id: 'rev-1',
        reviewerId: '4',
        reviewer: mockUsers[3],
        comments: 'Well-structured concept note. Recommend proceeding to draft development.',
        recommendation: 'approve',
        createdAt: '2024-02-28T00:00:00Z',
      }
    ],
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  },
]

// ============================================================================
// Policy Documents
// ============================================================================
export const mockPolicyDocuments: PolicyDocument[] = [
  {
    id: 'pol-001',
    title: 'National Health Policy 2024',
    description: 'Comprehensive health policy framework for Ethiopia',
    type: 'policy',
    status: 'published',
    category: 'Health System',
    version: 1,
    createdBy: mockUsers[4],
    assignedReviewers: [mockUsers[3], mockUsers[1]],
    currentVersion: 2,
    attachments: [
      { id: 'att-2', name: 'National_Health_Policy_2024.pdf', type: 'application/pdf', size: 5000000, url: '#', uploadedAt: '2024-01-15T00:00:00Z' }
    ],
    reviews: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    publishedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'pol-002',
    title: 'Primary Health Care Directive',
    description: 'Directive on primary health care service delivery',
    type: 'directive',
    status: 'under_review',
    category: 'Primary Care',
    version: 1,
    createdBy: mockUsers[1],
    assignedReviewers: [mockUsers[4]],
    currentVersion: 1,
    attachments: [],
    reviews: [],
    createdAt: '2024-02-20T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  },
  {
    id: 'pol-003',
    title: 'Maternal and Child Health Protocol',
    description: 'Standard protocol for maternal and child health services',
    type: 'protocol',
    status: 'published',
    category: 'Maternal Health',
    version: 3,
    createdBy: mockUsers[1],
    assignedReviewers: [],
    currentVersion: 3,
    attachments: [],
    reviews: [],
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
    publishedAt: '2024-01-10T00:00:00Z',
  },
]

// ============================================================================
// Calls for Proposals
// ============================================================================
export const mockCalls: CallForProposal[] = [
  {
    id: 'call-001',
    title: 'Health Systems Strengthening Research 2024',
    description: 'Call for research proposals on health systems strengthening interventions in Ethiopia. We are seeking innovative research that addresses key challenges in health service delivery, health workforce, health financing, and health governance.',
    eligibilityCriteria: 'Open to researchers affiliated with Ethiopian academic and research institutions. Principal investigators must hold at least a Master\'s degree. Collaborative proposals with international partners are encouraged.',
    priorityAreas: ['Health System Strengthening', 'Health Financing', 'Health Workforce'],
    budgetRange: { min: 500000, max: 2000000 },
    submissionDeadline: '2024-06-30T23:59:59Z',
    reviewDeadline: '2024-08-15T23:59:59Z',
    status: 'open',
    attachments: [
      { id: 'att-3', name: 'Call_Guidelines.pdf', type: 'application/pdf', size: 1500000, url: '#', uploadedAt: '2024-03-01T00:00:00Z' }
    ],
    createdBy: mockUsers[1],
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
    publishedAt: '2024-03-01T00:00:00Z',
  },
  {
    id: 'call-002',
    title: 'Implementation Research on Primary Health Care',
    description: 'This call invites research proposals that focus on implementation challenges and solutions for primary health care services in Ethiopia.',
    eligibilityCriteria: 'Ethiopian institutions only. PI must have prior experience in implementation research.',
    priorityAreas: ['Primary Health Care', 'Implementation Research'],
    budgetRange: { min: 300000, max: 1000000 },
    submissionDeadline: '2024-05-15T23:59:59Z',
    status: 'open',
    attachments: [],
    createdBy: mockUsers[5],
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
    publishedAt: '2024-02-15T00:00:00Z',
  },
  {
    id: 'call-003',
    title: 'COVID-19 Health Systems Impact Study',
    description: 'Research on the impact of COVID-19 on health systems and service delivery.',
    eligibilityCriteria: 'Open to all researchers.',
    priorityAreas: ['Communicable Diseases', 'Health System Strengthening'],
    budgetRange: { min: 200000, max: 800000 },
    submissionDeadline: '2023-12-31T23:59:59Z',
    status: 'closed',
    attachments: [],
    createdBy: mockUsers[1],
    createdAt: '2023-09-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    publishedAt: '2023-09-01T00:00:00Z',
  },
]

// ============================================================================
// Research Proposals
// ============================================================================
export const mockProposals: ResearchProposal[] = [
  {
    id: 'prop-001',
    callId: 'call-001',
    call: mockCalls[0],
    title: 'Strengthening District Health Management Through Digital Tools',
    abstract: 'This study aims to evaluate the effectiveness of a digital health management information system in improving district-level health planning and decision-making.',
    background: 'District health management teams face challenges in data-driven decision making due to fragmented information systems.',
    objectives: 'To assess the impact of an integrated digital dashboard on health management decisions at district level.',
    methodology: 'Mixed methods study combining quantitative analysis of health indicators with qualitative assessment of decision-making processes.',
    expectedOutcomes: 'Evidence on the effectiveness of digital tools for health management and recommendations for scale-up.',
    ethicalConsiderations: 'Ethical approval will be obtained from AAU IRB. Informed consent will be obtained from all participants.',
    principalInvestigator: mockUsers[2],
    coInvestigators: [
      { id: 'ci-1', name: 'Helen Assefa', email: 'helen@aau.edu.et', role: 'co_pi', institution: 'Addis Ababa University', expertise: 'Health Informatics' }
    ],
    institution: 'Addis Ababa University',
    researchArea: 'Health System Strengthening',
    budget: {
      personnel: 400000,
      equipment: 150000,
      consumables: 50000,
      travel: 100000,
      other: 50000,
      total: 750000,
      justification: 'Budget is based on 18-month implementation timeline with field work in 4 regions.',
    },
    timeline: [
      { id: 'tl-1', activity: 'Literature review and tool development', startMonth: 1, endMonth: 3, deliverables: 'Digital dashboard prototype' },
      { id: 'tl-2', activity: 'Baseline data collection', startMonth: 4, endMonth: 6, deliverables: 'Baseline report' },
      { id: 'tl-3', activity: 'Implementation and monitoring', startMonth: 7, endMonth: 15, deliverables: 'Monthly progress reports' },
      { id: 'tl-4', activity: 'Endline evaluation and reporting', startMonth: 16, endMonth: 18, deliverables: 'Final report and publications' },
    ],
    status: 'under_review',
    attachments: [
      { id: 'att-4', name: 'Full_Proposal.pdf', type: 'application/pdf', size: 3000000, url: '#', uploadedAt: '2024-03-15T00:00:00Z' }
    ],
    reviews: [],
    submittedAt: '2024-03-15T00:00:00Z',
    createdAt: '2024-03-10T00:00:00Z',
    updatedAt: '2024-03-15T00:00:00Z',
  },
  {
    id: 'prop-002',
    callId: 'call-001',
    call: mockCalls[0],
    title: 'Health Financing Reform Impact Assessment',
    abstract: 'Assessment of the impact of recent health financing reforms on service utilization and health outcomes.',
    background: 'Ethiopia has implemented significant health financing reforms including community-based health insurance.',
    objectives: 'To evaluate the impact of health financing reforms on access to and utilization of health services.',
    methodology: 'Retrospective cohort study using administrative data and household surveys.',
    expectedOutcomes: 'Evidence on reform effectiveness and policy recommendations.',
    ethicalConsiderations: 'Secondary data analysis with IRB approval.',
    principalInvestigator: mockUsers[2],
    coInvestigators: [],
    institution: 'Addis Ababa University',
    researchArea: 'Health Financing',
    budget: {
      personnel: 300000,
      equipment: 50000,
      consumables: 30000,
      travel: 80000,
      other: 40000,
      total: 500000,
    },
    timeline: [
      { id: 'tl-5', activity: 'Data collection and cleaning', startMonth: 1, endMonth: 4, deliverables: 'Clean dataset' },
      { id: 'tl-6', activity: 'Analysis', startMonth: 5, endMonth: 10, deliverables: 'Analysis report' },
      { id: 'tl-7', activity: 'Reporting', startMonth: 11, endMonth: 12, deliverables: 'Final report' },
    ],
    status: 'draft',
    attachments: [],
    reviews: [],
    createdAt: '2024-03-20T00:00:00Z',
    updatedAt: '2024-03-20T00:00:00Z',
  },
  {
    id: 'prop-003',
    callId: 'call-003',
    call: mockCalls[2],
    title: 'COVID-19 Impact on Essential Health Services',
    abstract: 'Study of COVID-19 pandemic impact on essential health service delivery in Ethiopia.',
    background: 'The COVID-19 pandemic disrupted health services globally.',
    objectives: 'To quantify the impact of COVID-19 on essential health service delivery.',
    methodology: 'Interrupted time series analysis of routine health data.',
    expectedOutcomes: 'Quantified impact estimates and recovery recommendations.',
    ethicalConsiderations: 'Uses anonymized routine data.',
    principalInvestigator: mockUsers[2],
    coInvestigators: [],
    institution: 'Addis Ababa University',
    researchArea: 'Health System Strengthening',
    budget: {
      personnel: 250000,
      equipment: 30000,
      consumables: 20000,
      travel: 50000,
      other: 30000,
      total: 380000,
    },
    timeline: [],
    status: 'completed',
    attachments: [],
    reviews: [
      {
        id: 'pr-1',
        proposalId: 'prop-003',
        reviewerId: '4',
        reviewer: mockUsers[3],
        technicalMerit: 22,
        methodology: 20,
        feasibility: 18,
        budget: 13,
        impact: 14,
        overallScore: 87,
        strengths: 'Timely research topic with strong methodology.',
        weaknesses: 'Limited geographic scope.',
        recommendation: 'approve',
        comments: 'Recommended for funding with minor revisions.',
        createdAt: '2023-11-15T00:00:00Z',
      }
    ],
    submittedAt: '2023-10-15T00:00:00Z',
    createdAt: '2023-10-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
]

// ============================================================================
// Research Projects (Approved & Contracted)
// ============================================================================
export const mockProjects: ResearchProject[] = [
  {
    id: 'proj-001',
    proposalId: 'prop-003',
    proposal: mockProposals[2],
    contractNumber: 'MOH/PSR/2023/001',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'active',
    milestones: [
      { id: 'ms-1', title: 'Inception Report', description: 'Submit inception report with detailed workplan', dueDate: '2024-02-01', status: 'completed', completedAt: '2024-01-28' },
      { id: 'ms-2', title: 'Data Collection Complete', description: 'Complete all data collection activities', dueDate: '2024-06-30', status: 'in_progress' },
      { id: 'ms-3', title: 'Draft Report', description: 'Submit draft final report', dueDate: '2024-10-31', status: 'pending' },
      { id: 'ms-4', title: 'Final Report', description: 'Submit final report with all deliverables', dueDate: '2024-12-15', status: 'pending' },
    ],
    progressReports: [
      {
        id: 'pr-1',
        projectId: 'proj-001',
        reportingPeriod: 'Q1 2024',
        activitiesCompleted: 'Completed literature review and finalized study protocol. Obtained ethical approval. Recruited and trained data collectors.',
        challenges: 'Minor delays in ethical approval process.',
        nextSteps: 'Begin data collection in selected health facilities.',
        budgetSpent: 95000,
        attachments: [],
        status: 'approved',
        submittedAt: '2024-04-05T00:00:00Z',
        createdAt: '2024-04-01T00:00:00Z',
      }
    ],
    budgetUtilization: {
      allocated: 380000,
      spent: 95000,
      remaining: 285000,
      breakdown: [
        { category: 'Personnel', allocated: 250000, spent: 62500 },
        { category: 'Equipment', allocated: 30000, spent: 25000 },
        { category: 'Consumables', allocated: 20000, spent: 3000 },
        { category: 'Travel', allocated: 50000, spent: 4500 },
        { category: 'Other', allocated: 30000, spent: 0 },
      ],
    },
    outputs: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-04-05T00:00:00Z',
  },
]

// ============================================================================
// Audit Logs
// ============================================================================
export const mockAuditLogs: AuditLog[] = [
  {
    id: 'log-001',
    userId: '1',
    user: mockUsers[0],
    action: 'CREATE',
    entityType: 'User',
    entityId: '7',
    details: { email: 'partner@who.int', role: 'institutional_partner' },
    ipAddress: '192.168.1.100',
    createdAt: '2024-03-01T10:30:00Z',
  },
  {
    id: 'log-002',
    userId: '2',
    user: mockUsers[1],
    action: 'UPDATE',
    entityType: 'ConceptNote',
    entityId: 'cn-001',
    details: { field: 'status', from: 'draft', to: 'submitted' },
    ipAddress: '192.168.1.101',
    createdAt: '2024-03-10T14:20:00Z',
  },
  {
    id: 'log-003',
    userId: '3',
    user: mockUsers[2],
    action: 'CREATE',
    entityType: 'Proposal',
    entityId: 'prop-001',
    details: { title: 'Strengthening District Health Management Through Digital Tools' },
    ipAddress: '192.168.1.102',
    createdAt: '2024-03-10T09:15:00Z',
  },
  {
    id: 'log-004',
    userId: '4',
    user: mockUsers[3],
    action: 'CREATE',
    entityType: 'Review',
    entityId: 'pr-1',
    details: { proposalId: 'prop-003', recommendation: 'approve' },
    ipAddress: '192.168.1.103',
    createdAt: '2023-11-15T16:45:00Z',
  },
  {
    id: 'log-005',
    userId: '1',
    user: mockUsers[0],
    action: 'UPDATE',
    entityType: 'User',
    entityId: '8',
    details: { field: 'status', from: 'active', to: 'inactive' },
    ipAddress: '192.168.1.100',
    createdAt: '2024-03-01T11:00:00Z',
  },
]

// ============================================================================
// Notifications
// ============================================================================
export const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    userId: '2',
    title: 'New Proposal Submitted',
    message: 'A new research proposal "Strengthening District Health Management" has been submitted for review.',
    type: 'info',
    link: '/research/proposals/prop-001',
    read: false,
    createdAt: '2024-03-15T10:00:00Z',
  },
  {
    id: 'notif-002',
    userId: '3',
    title: 'Review Completed',
    message: 'Your proposal "COVID-19 Impact on Essential Health Services" has been reviewed and approved.',
    type: 'success',
    link: '/research/proposals/prop-003',
    read: true,
    createdAt: '2023-11-16T09:00:00Z',
  },
  {
    id: 'notif-003',
    userId: '4',
    title: 'Review Assignment',
    message: 'You have been assigned to review a new research proposal.',
    type: 'info',
    link: '/research/reviews',
    read: false,
    createdAt: '2024-03-16T08:30:00Z',
  },
]

// ============================================================================
// Taxonomy Items
// ============================================================================
export const mockPolicyTypes: TaxonomyItem[] = [
  { id: 'pt-1', name: 'Policy', description: 'High-level policy document', order: 1, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pt-2', name: 'Strategy', description: 'Strategic framework or plan', order: 2, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pt-3', name: 'Guideline', description: 'Operational guidelines', order: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pt-4', name: 'Protocol', description: 'Standard operating protocol', order: 4, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pt-5', name: 'Standard', description: 'Technical or quality standard', order: 5, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pt-6', name: 'Directive', description: 'Administrative directive', order: 6, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
]

export const mockResearchAreas: TaxonomyItem[] = [
  { id: 'ra-1', name: 'Health System Strengthening', order: 1, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'ra-2', name: 'Primary Health Care', order: 2, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'ra-3', name: 'Maternal & Child Health', order: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'ra-4', name: 'Communicable Diseases', order: 4, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'ra-5', name: 'Non-Communicable Diseases', order: 5, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'ra-6', name: 'Health Financing', order: 6, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'ra-7', name: 'Digital Health', order: 7, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'ra-8', name: 'Health Workforce', order: 8, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
]

export const mockInstitutions: Institution[] = [
  { id: 'inst-1', name: 'Ministry of Health', type: 'government', contactEmail: 'info@moh.gov.et', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'inst-2', name: 'Addis Ababa University', type: 'academic', contactEmail: 'info@aau.edu.et', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'inst-3', name: 'Ethiopian Public Health Institute', type: 'government', contactEmail: 'info@ephi.gov.et', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'inst-4', name: 'World Health Organization', type: 'international', contactEmail: 'ethiopia@who.int', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'inst-5', name: 'USAID', type: 'international', contactEmail: 'ethiopia@usaid.gov', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'inst-6', name: 'Jimma University', type: 'academic', contactEmail: 'info@ju.edu.et', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
]

// ============================================================================
// Dashboard Statistics
// ============================================================================
export const mockDashboardStats = {
  admin: {
    totalUsers: mockUsers.length,
    activeUsers: mockUsers.filter(u => u.status === 'active').length,
    totalPolicies: mockPolicyDocuments.length,
    publishedPolicies: mockPolicyDocuments.filter(p => p.status === 'published').length,
    totalProposals: mockProposals.length,
    activeProjects: mockProjects.filter(p => p.status === 'active').length,
    pendingReviews: 3,
    recentActivity: mockAuditLogs.slice(0, 5),
  },
  psrOfficer: {
    pendingConceptNotes: mockConceptNotes.filter(cn => cn.status === 'submitted' || cn.status === 'under_review').length,
    pendingDrafts: mockPolicyDocuments.filter(p => p.status === 'under_review').length,
    openCalls: mockCalls.filter(c => c.status === 'open').length,
    submittedProposals: mockProposals.filter(p => p.status === 'submitted' || p.status === 'under_review').length,
    activeProjects: mockProjects.filter(p => p.status === 'active').length,
  },
  researcher: {
    myProposals: mockProposals.length,
    draftProposals: mockProposals.filter(p => p.status === 'draft').length,
    submittedProposals: mockProposals.filter(p => p.status === 'submitted' || p.status === 'under_review').length,
    activeProjects: mockProjects.length,
    openCalls: mockCalls.filter(c => c.status === 'open').length,
    upcomingDeadlines: mockCalls.filter(c => c.status === 'open').map(c => ({
      title: c.title,
      deadline: c.submissionDeadline,
    })),
  },
  reviewer: {
    assignedReviews: 2,
    completedReviews: 1,
    pendingReviews: 1,
  },
}
