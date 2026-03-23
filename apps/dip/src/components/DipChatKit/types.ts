import type React from 'react'
import type { AiPromptMentionOption, AiPromptSubmitPayload } from './components/AiPromptInput/types'

export interface DipChatKitAttachment {
  uid: string
  name: string
  size: number
  type: string
  file?: File
}

export interface DipChatKitPreviewPayload {
  title: string
  content: string
  sourceType: 'card' | 'code' | 'mermaid' | 'text'
}

export interface DipChatKitMessageTurn {
  id: string
  question: string
  questionEmployees?: AiPromptMentionOption[]
  pendingSend?: boolean
  questionAttachments: DipChatKitAttachment[]
  answerMarkdown: string
  answerLoading: boolean
  answerStreaming: boolean
  answerError?: string
  createdAt: string
}

export interface DipChatKitPreviewState {
  visible: boolean
  activeTurnId: string
  payload: DipChatKitPreviewPayload | null
}

export interface DipChatKitScrollState {
  autoScrollEnabled: boolean
  showBackToBottom: boolean
  isAtBottom: boolean
}

export interface DipChatKitState {
  messageTurns: DipChatKitMessageTurn[]
  preview: DipChatKitPreviewState
  scroll: DipChatKitScrollState
  chatPanelSize: string | number
}

export interface DipChatKitProps {
  className?: string
  style?: React.CSSProperties
  showHeader?: boolean
  initialSubmitPayload?: AiPromptSubmitPayload
  sessionId?: string
  assignEmployeeValue?: string
  employeeOptions?: AiPromptMentionOption[]
  defaultEmployeeValue?: string
  inputPlaceholder?: string
}
