import type { AiPromptMentionOption } from '../AiPromptInput/types'

export interface ChatContentAreaProps {
  sessionId?: string
  assignEmployeeValue?: string
  employeeOptions?: AiPromptMentionOption[]
  defaultEmployeeValue?: string
  inputPlaceholder?: string
  onSessionKeyReady?: (sessionKey: string) => void
}
