// ============================================================================
// PSR System — Reusable Reviewer Pool Component Types
// ============================================================================

export interface ReviewQuestionCategory {
  id: number | string;
  name: string;
}

export interface ReviewQuestionItem {
  id: number | string;
  text?: string;
  maxPoints?: number;
  category?: ReviewQuestionCategory | null;
}

export interface ReviewCriteriaResponse {
  id: number | string;
  question?: ReviewQuestionItem | null;
  pointsEarned: number;
}

export interface ReviewerEvaluationData {
  id?: number | string;
  comments?: string | null;
  totalScore?: number | null;
  attachment?: string | null;
  hasResponses?: boolean;
  responses?: ReviewCriteriaResponse[];
  createdAt?: string | null;
}

export interface ReviewerPoolItem {
  id: number | string;
  fullName: string;
  email: string;
  role?: string | null;
  photoUrl?: string | null;
  organization?: string | null;
  unit?: string | null;
  isCompleted?: boolean;
  totalScore?: number | null;
  scorePercentage?: number | null;
  reviewData?: ReviewerEvaluationData | null;
}

export interface CategoryGroup {
  id: number | string;
  name: string;
  responses: ReviewCriteriaResponse[];
}

export interface ReviewerPoolListProps {
  title?: string;
  subtitle?: string;
  reviewers: ReviewerPoolItem[];
  maxPossiblePoints?: number;
  overallAverageScorePct?: number | null;
  overallAverageScore?: number | null;
  submittedCount?: number;
  showManageAction?: boolean;
  manageActionLabel?: string;
  onManageReviewers?: () => void;
  onReviewerClick?: (reviewer: ReviewerPoolItem) => void;
  selectable?: boolean;
  selectedIds?: Array<number | string>;
  onToggleSelect?: (reviewerId: number | string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}
