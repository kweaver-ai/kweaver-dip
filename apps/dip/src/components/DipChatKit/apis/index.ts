import { get, getCommonHttpHeaders, post } from '@/utils/http'
import intl from 'react-intl-universal'
import type {
  DipChatKitCreateSessionKeyRequest,
  DipChatKitCreateSessionKeyResponse,
  DipChatKitDigitalHumanList,
  DipChatKitDigitalHumanDetail,
  DipChatKitSessionArchiveSubpathOptions,
  DipChatKitSessionArchiveSubpathResponse,
  DipChatKitGetSessionMessagesParams,
  DipChatKitResponseRequestBody,
  DipChatKitResponseStreamChunk,
  DipChatKitResponseSSEOptions,
  DipChatKitResponseStreamToolCallChunk,
  DipChatKitResponseStreamToolCallPayload,
  DipChatKitSessionGetResponse,
  DipChatKitUploadChatAttachmentResponse,
} from './types'

const BASE = '/api/dip-studio/v1'
const DEFAULT_STREAM_TIMEOUT = 600_000

function cleanParams<T extends Record<string, unknown>>(obj?: T): T | undefined {
  if (!obj) return undefined
  const entries = Object.entries(obj).filter(([, value]) => value !== undefined)
  if (entries.length === 0) return undefined
  return Object.fromEntries(entries) as T
}

function encodeArchiveSubpath(subpath: string): string {
  return subpath
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/')
}

export const createChatSessionKey = (
  agentId: string,
): Promise<DipChatKitCreateSessionKeyResponse> =>
  post(`${BASE}/chat/session`, {
    body: {
      agentId,
    } satisfies DipChatKitCreateSessionKeyRequest,
  }) as Promise<DipChatKitCreateSessionKeyResponse>

export const getDigitalHumanList = (): Promise<DipChatKitDigitalHumanList> => {
  const p1 = get(`${BASE}/digital-human`)
  const p2 = p1.then((result: unknown) =>
    Array.isArray(result) ? (result as DipChatKitDigitalHumanList) : [],
  )
  p2.abort = p1.abort
  return p2
}

export const getDigitalHumanDetail = (id: string): Promise<DipChatKitDigitalHumanDetail> =>
  get(`${BASE}/digital-human/${encodeURIComponent(id)}`) as Promise<DipChatKitDigitalHumanDetail>

export const getDigitalHumanSessionMessages = (
  sessionId: string,
  params?: DipChatKitGetSessionMessagesParams,
): Promise<DipChatKitSessionGetResponse> =>
  get(`${BASE}/sessions/${sessionId}/messages`, {
    params: cleanParams(params as Record<string, unknown> | undefined),
  }) as Promise<DipChatKitSessionGetResponse>

export const getSessionArchiveSubpath = (
  sessionId: string,
  subpath: string,
  options?: DipChatKitSessionArchiveSubpathOptions,
): Promise<DipChatKitSessionArchiveSubpathResponse> =>
  get(`${BASE}/sessions/${sessionId}/archives/${encodeArchiveSubpath(subpath)}`, {
    ...(options?.responseType !== undefined ? { responseType: options.responseType } : {}),
    ...(options?.timeout !== undefined ? { timeout: options.timeout } : {}),
  }) as Promise<DipChatKitSessionArchiveSubpathResponse>

const buildFullRequestUrl = (path: string): string => {
  return `${window.location.protocol}//${window.location.host}${path}`
}

const readPathString = (source: unknown, path: Array<string | number>): string => {
  let current: unknown = source
  for (const key of path) {
    if (current === null || current === undefined) return ''
    if (typeof key === 'number') {
      if (!Array.isArray(current)) return ''
      current = current[key]
      continue
    }

    if (typeof current !== 'object') return ''
    if (!(key in current)) return ''
    current = (current as Record<string, unknown>)[key]
  }

  return typeof current === 'string' ? current : ''
}

const normalizeEventType = (value: unknown): string => {
  if (typeof value !== 'string') return ''
  return value.trim().toLowerCase()
}

const toTextFromUnknown = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

const toOptionalFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  return value
}

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  if (!normalized) return undefined
  return normalized
}

const buildToolCallEventId = (
  toolCallId: string,
  itemId: string,
  outputIndex: number | undefined,
  toolName: string,
): string => {
  if (toolCallId) return `sse_tool_call_${toolCallId}`
  if (itemId) return `sse_tool_call_${itemId}`
  if (outputIndex !== undefined) return `sse_tool_call_${outputIndex}_${toolName || 'tool'}`
  return `sse_tool_call_${toolName || 'tool'}`
}

const extractToolCallChunkFromPayload = (
  payload: Record<string, unknown>,
): DipChatKitResponseStreamToolCallChunk | null => {
  const eventType = normalizeEventType(payload.type)
  if (eventType !== 'response.output_item.added' && eventType !== 'response.output_item.done') {
    return null
  }

  const item = payload.item
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return null
  }

  const itemPayload = item as Record<string, unknown>
  const itemType = normalizeEventType(itemPayload.type)
  if (itemType !== 'function_call') {
    return null
  }

  const toolName = toOptionalString(itemPayload.name) || ''
  const toolCallId = toOptionalString(itemPayload.call_id ?? itemPayload.callId) || ''
  const itemId = toOptionalString(itemPayload.id) || ''
  const outputIndex = toOptionalFiniteNumber(payload.output_index)
  const isCompleted = eventType === 'response.output_item.done'
  const text = toTextFromUnknown(itemPayload.arguments)
  const isError = isCompleted && itemPayload.error !== undefined && itemPayload.error !== null
  const status: DipChatKitResponseStreamToolCallPayload['status'] =
    isCompleted ? 'completed' : 'in_progress'

  return {
    kind: 'toolCall',
    payload: {
      id: buildToolCallEventId(toolCallId, itemId, outputIndex, toolName),
      toolName,
      toolCallId,
      text,
      status,
      isError,
      itemId,
      outputIndex,
    },
  }
}

const extractTextFromPayload = (payload: Record<string, unknown>): string => {
  const eventType = normalizeEventType(payload.type)
  if (eventType === 'response.output_text.delta') {
    const delta = payload.delta
    return typeof delta === 'string' ? delta : ''
  }

  if (eventType === 'response.output_text.done') {
    return ''
  }

  const directTextKeys = ['delta', 'content', 'text', 'output_text']
  for (const key of directTextKeys) {
    const value = payload[key]
    if (typeof value === 'string') {
      return value
    }
  }

  const pathCandidates: Array<Array<string | number>> = [
    ['choices', 0, 'delta', 'content'],
    ['choices', 0, 'text'],
    ['choices', 0, 'message', 'content'],
    ['response', 'output_text'],
    ['data', 'delta'],
    ['data', 'content'],
  ]
  for (const path of pathCandidates) {
    const value = readPathString(payload, path)
    if (value) {
      return value
    }
  }

  const content = payload.content
  if (Array.isArray(content)) {
    const parts = content
      .map((item) => {
        if (typeof item === 'string') return item
        if (!item || typeof item !== 'object') return ''
        const textValue = (item as Record<string, unknown>).text
        return typeof textValue === 'string' ? textValue : ''
      })
      .filter(Boolean)

    if (parts.length > 0) {
      return parts.join('')
    }
  }

  return ''
}

const extractErrorMessage = (payload: Record<string, unknown>): string => {
  const directError = payload.error
  if (typeof directError === 'string' && directError.trim()) {
    return directError
  }

  if (directError && typeof directError === 'object') {
    const message = (directError as Record<string, unknown>).message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  const message = payload.message
  if (typeof message === 'string' && message.trim()) {
    return message
  }

  return ''
}

const parseSSEData = (rawData: string): { done: boolean; chunks: DipChatKitResponseStreamChunk[] } => {
  const normalizedData = rawData.trim()
  if (!normalizedData) {
    return { done: false, chunks: [] }
  }

  if (normalizedData === '[DONE]') {
    return { done: true, chunks: [] }
  }

  let payload: unknown = normalizedData
  try {
    payload = JSON.parse(normalizedData)
  } catch {
    return {
      done: false,
      chunks: [{ kind: 'text', text: normalizedData }],
    }
  }

  if (typeof payload === 'string') {
    if (payload === '[DONE]') {
      return { done: true, chunks: [] }
    }
    return {
      done: false,
      chunks: [{ kind: 'text', text: payload }],
    }
  }

  if (typeof payload === 'number' || typeof payload === 'boolean') {
    return {
      done: false,
      chunks: [{ kind: 'text', text: String(payload) }],
    }
  }

  if (!payload || typeof payload !== 'object') {
    return { done: false, chunks: [] }
  }

  const payloadObject = payload as Record<string, unknown>
  const errorMessage = extractErrorMessage(payloadObject)
  if (errorMessage) {
    throw new Error(errorMessage)
  }

  const eventType = payloadObject.type
  if (eventType === 'response.completed' || payloadObject.done === true) {
    return { done: true, chunks: [] }
  }

  const chunks: DipChatKitResponseStreamChunk[] = []
  const toolCallChunk = extractToolCallChunkFromPayload(payloadObject)
  if (toolCallChunk) {
    chunks.push(toolCallChunk)
  }

  const text = extractTextFromPayload(payloadObject)
  if (text) {
    chunks.push({
      kind: 'text',
      text,
    })
  }

  return {
    done: false,
    chunks,
  }
}

const parseSSEFrame = (frame: string): { done: boolean; chunks: DipChatKitResponseStreamChunk[] } => {
  const lines = frame.split('\n')
  const dataLines: string[] = []

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    if (!line || line.startsWith(':')) {
      continue
    }
    if (!line.startsWith('data:')) {
      continue
    }
    dataLines.push(line.slice(5).trimStart())
  }

  if (dataLines.length === 0) {
    return { done: false, chunks: [] }
  }

  return parseSSEData(dataLines.join('\n'))
}

const formatHttpErrorMessage = async (response: Response): Promise<string> => {
  const responseText = (await response.text()).trim()
  if (!responseText) {
    return intl
      .get('dipChatKit.httpRequestFailed', { status: response.status })
      .d(`请求失败（HTTP ${response.status}）`) as string
  }

  try {
    const payload = JSON.parse(responseText) as Record<string, unknown>
    const message = extractErrorMessage(payload)
    if (message) {
      return message
    }
  } catch {
    // Keep original text as fallback error message.
  }

  return responseText
}

export const uploadChatAttachment = async (
  file: File,
  sessionKey: string,
  signal?: AbortSignal,
): Promise<DipChatKitUploadChatAttachmentResponse['path']> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(buildFullRequestUrl(`${BASE}/chat/upload`), {
    method: 'POST',
    headers: {
      ...getCommonHttpHeaders(),
      'x-openclaw-session-key': sessionKey,
    },
    body: formData,
    signal,
  })

  if (!response.ok) {
    throw new Error(await formatHttpErrorMessage(response))
  }

  const data = (await response.json()) as DipChatKitUploadChatAttachmentResponse | Record<string, unknown>
  const path =
    typeof (data as DipChatKitUploadChatAttachmentResponse).path === 'string'
      ? (data as DipChatKitUploadChatAttachmentResponse).path.trim()
      : ''

  if (!path) {
    throw new Error(
      intl.get('dipChatKit.uploadAttachmentMissingPath').d('上传附件失败，未返回有效路径') as string,
    )
  }

  return path
}

export async function* createDigitalHumanResponseSSE(
  body: DipChatKitResponseRequestBody,
  options: DipChatKitResponseSSEOptions,
): AsyncGenerator<DipChatKitResponseStreamChunk, void, unknown> {
  const { sessionKey, signal, timeout = DEFAULT_STREAM_TIMEOUT } = options
  const abortController = new AbortController()
  const timeoutId = window.setTimeout(() => {
    abortController.abort()
  }, timeout)

  const forwardAbort = () => {
    abortController.abort()
  }

  if (signal) {
    if (signal.aborted) {
      abortController.abort()
    } else {
      signal.addEventListener('abort', forwardAbort)
    }
  }

  try {
    const response = await fetch(buildFullRequestUrl(`${BASE}/chat/agent`), {
      method: 'POST',
      headers: {
        ...getCommonHttpHeaders(),
        Accept: 'text/event-stream',
        'Content-Type': 'application/json;charset=UTF-8',
        'x-openclaw-session-key': sessionKey,
      },
      body: JSON.stringify(body),
      signal: abortController.signal,
    })

    if (!response.ok) {
      throw new Error(await formatHttpErrorMessage(response))
    }

    if (!response.body) {
      throw new Error(
        intl.get('dipChatKit.sseNoReadableStream').d('服务端未返回可读取的 SSE 数据流') as string,
      )
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (!value) continue

        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')

        while (true) {
          const separatorIndex = buffer.indexOf('\n\n')
          if (separatorIndex === -1) break

          const frame = buffer.slice(0, separatorIndex)
          buffer = buffer.slice(separatorIndex + 2)
          const { done: frameDone, chunks } = parseSSEFrame(frame)
          if (chunks.length > 0) {
            for (const chunk of chunks) {
              yield chunk
            }
          }
          if (frameDone) {
            return
          }
        }
      }

      const lastFrame = buffer.trim()
      if (lastFrame) {
        const { chunks } = parseSSEFrame(lastFrame)
        if (chunks.length > 0) {
          for (const chunk of chunks) {
            yield chunk
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  } finally {
    window.clearTimeout(timeoutId)
    signal?.removeEventListener('abort', forwardAbort)
  }
}
