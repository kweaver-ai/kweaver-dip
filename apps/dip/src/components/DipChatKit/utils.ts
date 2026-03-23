import isEmpty from 'lodash/isEmpty'
import isString from 'lodash/isString'
import truncate from 'lodash/truncate'
import intl from 'react-intl-universal'
import type { DipChatKitMessageTurn } from './types'

export const getConversationTitle = (messageTurns: DipChatKitMessageTurn[]): string => {
  const defaultTitle = intl.get('dipChatKit.conversationTitle').d('对话 AI 生成') as string
  if (isEmpty(messageTurns)) return defaultTitle
  const firstQuestion = messageTurns[0]?.question ?? ''
  if (!firstQuestion) return defaultTitle
  return truncate(firstQuestion, { length: 50, omission: '' })
}

export const isAsyncIterable = (value: unknown): value is AsyncIterable<string> => {
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
