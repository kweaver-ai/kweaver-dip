import type { DipChatKitMessageTurn, DipChatKitPreviewPayload } from '../../../../types'

export interface AiAnswerBubbleProps {
  turn: DipChatKitMessageTurn
  isLatestAnswerTurn: boolean
  onCopy: () => void
  onRegenerate: () => void
  onOpenPreview: (payload: DipChatKitPreviewPayload) => void
}

export interface DipChatKitToolCardItem {
  id: string
  kind: 'call' | 'result'
  status?: 'in_progress' | 'completed'
  title: string
  detail: string
  toolName: string
  toolCallId: string
  text: string
  inlineText: string
  previewText: string
  isError?: boolean
}
