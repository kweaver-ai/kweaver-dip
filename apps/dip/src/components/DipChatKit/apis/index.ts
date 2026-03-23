import { get, getCommonHttpHeaders, post } from '@/utils/http'
import intl from 'react-intl-universal'
import type {
  DipChatKitCreateSessionKeyResponse,
  DipChatKitDigitalHumanList,
  DipChatKitResponseRequestBody,
  DipChatKitResponseSSEOptions,
} from './types'

const BASE = '/api/dip-studio/v1'
const DEFAULT_STREAM_TIMEOUT = 600_000

export const createChatSessionKey = (): Promise<DipChatKitCreateSessionKeyResponse> =>
  post(`${BASE}/chat/session`) as Promise<DipChatKitCreateSessionKeyResponse>

export const getDigitalHumanList = (): Promise<DipChatKitDigitalHumanList> => {
  const p1 = get(`${BASE}/digital-human`)
  const p2 = p1.then((result: unknown) =>
    Array.isArray(result) ? (result as DipChatKitDigitalHumanList) : [],
  )
  p2.abort = p1.abort
  return p2
}

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

const extractTextFromPayload = (payload: Record<string, unknown>): string => {
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

const parseSSEData = (rawData: string): { done: boolean; text: string } => {
  const normalizedData = rawData.trim()
  if (!normalizedData) {
    return { done: false, text: '' }
  }

  if (normalizedData === '[DONE]') {
    return { done: true, text: '' }
  }

  let payload: unknown = normalizedData
  try {
    payload = JSON.parse(normalizedData)
  } catch {
    return { done: false, text: normalizedData }
  }

  if (typeof payload === 'string') {
    if (payload === '[DONE]') {
      return { done: true, text: '' }
    }
    return { done: false, text: payload }
  }

  if (typeof payload === 'number' || typeof payload === 'boolean') {
    return { done: false, text: String(payload) }
  }

  if (!payload || typeof payload !== 'object') {
    return { done: false, text: '' }
  }

  const payloadObject = payload as Record<string, unknown>
  const errorMessage = extractErrorMessage(payloadObject)
  if (errorMessage) {
    throw new Error(errorMessage)
  }

  const eventType = payloadObject.type
  if (eventType === 'response.completed' || payloadObject.done === true) {
    return { done: true, text: '' }
  }

  return {
    done: false,
    text: extractTextFromPayload(payloadObject),
  }
}

const parseSSEFrame = (frame: string): { done: boolean; text: string } => {
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
    return { done: false, text: '' }
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

export async function* createDigitalHumanResponseSSE(
  id: string,
  body: DipChatKitResponseRequestBody,
  options: DipChatKitResponseSSEOptions,
): AsyncGenerator<string, void, unknown> {
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
    const response = await fetch(buildFullRequestUrl(`${BASE}/digital-human/${id}/chat/responses`), {
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
          const { done: frameDone, text } = parseSSEFrame(frame)
          if (text) {
            yield text
          }
          if (frameDone) {
            return
          }
        }
      }

      const lastFrame = buffer.trim()
      if (lastFrame) {
        const { text } = parseSSEFrame(lastFrame)
        if (text) {
          yield text
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
