import type { AiPromptSubmitPayload } from '@/components/DipChatKit/components/AiPromptInput/types'

export interface ConversationRouteState {
  submitData?: AiPromptSubmitPayload
}

export interface ConversationLocationState {
  state: ConversationRouteState
}
