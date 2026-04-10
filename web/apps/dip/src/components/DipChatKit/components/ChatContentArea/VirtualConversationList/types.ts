import type { DipChatKitMessageTurn, DipChatKitPreviewPayload } from '../../../types'

export interface VirtualConversationListProps {
  className?: string
  messageTurns: DipChatKitMessageTurn[]
  loading: boolean
  emptyStateText: string
  autoScrollEnabled: boolean
  onUserScrollUp?: () => void
  onReachBottomChange?: (isAtBottom: boolean) => void
  onEditQuestion: (turnId: string, question: string) => void
  onCopyQuestion: (question: string) => void
  onCopyAnswer: (answer: string) => void
  onRegenerateAnswer: (turnId: string) => void
  onOpenPreview: (turnId: string, payload: DipChatKitPreviewPayload) => void
}

export interface VirtualConversationListRef {
  scrollToBottom: (behavior?: ScrollBehavior) => void
  isAtBottom: () => boolean
  getElement: () => HTMLDivElement | null
}
