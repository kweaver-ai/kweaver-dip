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
  sourceType: 'card' | 'code' | 'mermaid' | 'text' | 'artifact'
  artifact?: {
    sessionKey: string
    subpath: string
    fileName: string
    archiveRoot?: string
  }
}

export type DipChatKitAnswerEventType = 'toolCall' | 'toolResult' | 'system' | 'unknown'

export interface DipChatKitAnswerEvent {
  id: string
  type: DipChatKitAnswerEventType
  role: string
  text: string
  toolName?: string
  toolCallId?: string
  isError?: boolean
  timestamp?: number
  details?: Record<string, unknown>
}

export interface DipChatKitAnswerTimelineTextItem {
  id: string
  kind: 'text'
  text: string
}

export interface DipChatKitAnswerTimelineEventItem {
  id: string
  kind: 'event'
  event: DipChatKitAnswerEvent
}

export type DipChatKitAnswerTimelineItem =
  | DipChatKitAnswerTimelineTextItem
  | DipChatKitAnswerTimelineEventItem

export interface DipChatKitMessageTurn {
  id: string
  sessionKey?: string
  question: string
  questionEmployees?: AiPromptMentionOption[]
  pendingSend?: boolean
  questionAttachments: DipChatKitAttachment[]
  answerMarkdown: string
  answerEvents: DipChatKitAnswerEvent[]
  answerTimeline: DipChatKitAnswerTimelineItem[]
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

export type DipChatKitLocale = 'zh_cn' | 'en_us' | 'zh_tw'

export interface DipChatKitProps {
  className?: string
  style?: React.CSSProperties
  locale?: DipChatKitLocale
  showHeader?: boolean
  initialSubmitPayload?: AiPromptSubmitPayload
  sessionId?: string
  assignEmployeeValue?: string
  employeeOptions?: AiPromptMentionOption[]
  defaultEmployeeValue?: string
  inputPlaceholder?: string
  onSessionKeyReady?: (sessionKey: string) => void
}
