import isEmpty from 'lodash/isEmpty'
import isString from 'lodash/isString'
import truncate from 'lodash/truncate'
import type { AiPromptSubmitPayload } from './components/AiPromptInput/types'
import type { DipChatKitMessageTurn } from './types'

export const getConversationTitle = (messageTurns: DipChatKitMessageTurn[]): string => {
  const defaultTitle = ''
  if (isEmpty(messageTurns)) return defaultTitle
  const firstQuestion = messageTurns[0]?.question ?? ''
  if (!firstQuestion) return defaultTitle
  return truncate(firstQuestion, { length: 50, omission: '' })
}

export const isAsyncIterable = <T = unknown>(value: unknown): value is AsyncIterable<T> => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as { [Symbol.asyncIterator]?: unknown }
  return typeof candidate[Symbol.asyncIterator] === 'function'
}

export const normalizeStreamChunk = (chunk: unknown): string => {
  if (isString(chunk)) return chunk
  if (chunk === null || chunk === undefined) return ''
  return String(chunk)
}

export const splitTextToChunks = (text: string, chunkSize = 14): string[] => {
  if (!text) return []
  const chunks: string[] = []
  for (let index = 0; index < text.length; index += chunkSize) {
    chunks.push(text.slice(index, index + chunkSize))
  }
  return chunks
}

export const wait = async (ms: number): Promise<void> => {
  await new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export const parseAgentIdFromSessionKey = (sessionKey: string): string => {
  const normalizedSessionKey = sessionKey.trim()
  if (!normalizedSessionKey.startsWith('agent:')) return ''

  const parts = normalizedSessionKey.split(':')
  if (parts.length < 3) return ''
  if (parts[0] !== 'agent') return ''

  return parts[1]?.trim() || ''
}

export const buildDefaultMessageTurnsFromSubmitPayload = (
  payload?: AiPromptSubmitPayload,
): DipChatKitMessageTurn[] => {
  if (!payload?.content) {
    return []
  }

  const questionAttachments = payload.files.map((file) => ({
    uid: `${file.name}_${file.size}_${file.lastModified}`,
    name: file.name,
    size: file.size,
    type: file.type,
    file,
  }))

  return [
    {
      id: `turn_init_${Date.now()}`,
      question: payload.content,
      questionEmployees: payload.employees,
      pendingSend: true,
      questionAttachments,
      answerMarkdown: '',
      answerEvents: [],
      answerTimeline: [],
      answerLoading: false,
      answerStreaming: false,
      createdAt: new Date().toISOString(),
    },
  ]
}
