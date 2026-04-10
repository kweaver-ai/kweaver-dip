export interface DipChatKitCreateSessionKeyResponse {
  sessionKey: string
}

export interface DipChatKitCreateSessionKeyRequest {
  agentId: string
}

export interface DipChatKitGetSessionMessagesParams {
  limit?: number
}

export interface DipChatKitSessionMessage {
  id?: string
  role?: string
  content?: unknown
  ts?: number
  toolName?: string
  toolCallId?: string
  isError?: boolean
  details?: Record<string, unknown>
  [key: string]: unknown
}

export interface DipChatKitSessionGetResponse {
  key: string
  messages?: DipChatKitSessionMessage[]
}

export type DipChatKitSessionArchiveEntryType = 'file' | 'directory' | 'other'

export interface DipChatKitSessionArchiveEntry {
  name: string
  type: DipChatKitSessionArchiveEntryType
  [key: string]: unknown
}

export interface DipChatKitSessionArchivesResponse {
  path: string
  contents: DipChatKitSessionArchiveEntry[]
  [key: string]: unknown
}

export interface DipChatKitSessionArchiveSubpathOptions {
  responseType?: 'json' | 'text' | 'arraybuffer'
  timeout?: number
}

export type DipChatKitSessionArchiveSubpathResponse =
  | DipChatKitSessionArchivesResponse
  | string
  | ArrayBuffer

export interface DipChatKitDigitalHuman {
  id: string
  name: string
}

export type DipChatKitDigitalHumanList = DipChatKitDigitalHuman[]

export interface DipChatKitDigitalHumanDetail {
  id: string
  name: string
}

export interface DipChatKitResponseSSEOptions {
  sessionKey: string
  timeout?: number
  signal?: AbortSignal
}

export interface DipChatKitUploadChatAttachmentResponse {
  path: string
}

export interface DipChatKitChatAttachmentSource {
  type: 'path'
  path: string
}

export interface DipChatKitChatAttachment {
  type: 'input_file'
  source: DipChatKitChatAttachmentSource
}

export type DipChatKitResponseRequestBody = Record<string, unknown>

export type DipChatKitResponseStreamStatus = 'in_progress' | 'completed'

export interface DipChatKitResponseStreamToolCallPayload {
  id: string
  toolName: string
  toolCallId: string
  text: string
  status: DipChatKitResponseStreamStatus
  isError?: boolean
  itemId?: string
  outputIndex?: number
}

export interface DipChatKitResponseStreamTextChunk {
  kind: 'text'
  text: string
}

export interface DipChatKitResponseStreamToolCallChunk {
  kind: 'toolCall'
  payload: DipChatKitResponseStreamToolCallPayload
}

export type DipChatKitResponseStreamChunk =
  | DipChatKitResponseStreamTextChunk
  | DipChatKitResponseStreamToolCallChunk
