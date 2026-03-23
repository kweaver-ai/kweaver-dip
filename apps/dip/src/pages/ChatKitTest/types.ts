import type { AiPromptSubmitPayload } from '@/components/DipChatKit/components/AiPromptInput/types'

export interface ChatKitTestRouteState {
  submitData?: AiPromptSubmitPayload
}

export interface ChatKitTestLocationState {
  state: ChatKitTestRouteState
}
