import type { AiPromptSubmitPayload } from '@/components/DipChatKit/components/AiPromptInput/types'

export interface ConversationRouteState {
  submitData?: AiPromptSubmitPayload
  submitToken?: string
}

export interface ConversationLocationState {
  state: ConversationRouteState
}
