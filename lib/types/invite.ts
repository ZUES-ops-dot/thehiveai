export interface InviteMspBreakdown {
  total: number
  weekly: number
  monthly: number
  yearly: number
}

export interface InviteSummaryResponse {
  totals: InviteMspBreakdown
  bonusApplied?: boolean
  invitedBy?: string | null
}
