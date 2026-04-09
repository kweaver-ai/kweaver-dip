import type { DipChatKitAttachment } from '../../../../types'

export interface UserQuestionBubbleProps {
  question: string
  attachments: DipChatKitAttachment[]
  onEdit: (question: string) => void
  onCopy: () => void
}
