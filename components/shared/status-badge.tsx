import { cn } from '@/lib/utils'
import { POLICY_STATUSES, PROPOSAL_STATUSES, CALL_STATUSES, ROLES } from '@/lib/constants'
import type { PolicyStatus, ProposalStatus, CallStatus, UserRole, UserStatus } from '@/lib/types'

type StatusType = 'policy' | 'proposal' | 'call' | 'role' | 'user'

interface StatusBadgeProps {
  type: StatusType
  status: PolicyStatus | ProposalStatus | CallStatus | UserRole | UserStatus
  className?: string
}

const USER_STATUSES: Record<UserStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
}

export function StatusBadge({ type, status, className }: StatusBadgeProps) {
  let config: { label: string; color: string } | undefined

  switch (type) {
    case 'policy':
      config = POLICY_STATUSES[status as PolicyStatus]
      break
    case 'proposal':
      config = PROPOSAL_STATUSES[status as ProposalStatus]
      break
    case 'call':
      config = CALL_STATUSES[status as CallStatus]
      break
    case 'role':
      config = ROLES[status as UserRole]
      break
    case 'user':
      config = USER_STATUSES[status as UserStatus]
      break
  }

  if (!config) {
    return null
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  )
}
