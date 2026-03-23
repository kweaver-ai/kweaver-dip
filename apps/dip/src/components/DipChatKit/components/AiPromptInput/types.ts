import type { SenderProps } from '@ant-design/x'
import type { ReactNode } from 'react'

export interface AiPromptMentionOption {
  value: string
  label: string
  description?: string
  avatar?: ReactNode
}

export interface TriggerCharacterItem {
  character: string
  options: AiPromptMentionOption[]
}

export interface AiPromptSubmitPayload {
  content: string
  employees: AiPromptMentionOption[]
  files: File[]
}

export type MentionTriggerSource = 'keyboard' | 'button'

export interface CursorAnchorPosition {
  left: number
  top: number
}

export interface MentionTriggerMatch {
  character: string
  query: string
}

export interface AiPromptInputProps {
  value?: string
  defaultValue?: string
  assignEmployeeValue?: string
  defaultEmployeeValue?: string
  autoSize?: SenderProps['autoSize']
  onChange?: (value: string) => void
  onSubmit?: (payload: AiPromptSubmitPayload) => void
  onStop?: () => void
  onAttach?: (files: File[]) => void
  onEmployeeSelect?: (item: AiPromptMentionOption) => void
  employeeOptions?: AiPromptMentionOption[]
  placeholder?: string
  employeePanelTitle?: string
  employeeButtonLabel?: string
  attachButtonTitle?: string
  sendButtonTitle?: string
  triggerCharacter?: false | TriggerCharacterItem[]
  disabled?: boolean
  loading?: boolean
  className?: string
}
