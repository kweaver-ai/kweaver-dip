import type { DipChatKitSessionMessage } from '../../apis/types'
import type { DipChatKitMessageTurn } from '../../types'
import type { AiPromptSubmitPayload } from '../AiPromptInput/types'

export const buildRegeneratePayload = (turn: DipChatKitMessageTurn): AiPromptSubmitPayload => {
  const files = turn.questionAttachments
    .map((attachment) => attachment.file)
    .filter((file): file is File => file instanceof File)

  return {
    content: turn.question,
    files,
    employees: turn.questionEmployees || [],
  }
}

const normalizeSessionMessageRole = (role: unknown): string => {
  if (typeof role !== 'string') return ''
  return role.trim().toLowerCase()
}

const normalizeSessionMessageContentPart = (part: unknown): string => {
  if (part === null || part === undefined) return ''
  if (typeof part === 'string') return part
  if (typeof part === 'number' || typeof part === 'boolean') return String(part)

  if (Array.isArray(part)) {
    return part.map((item) => normalizeSessionMessageContentPart(item)).filter(Boolean).join('')
  }

  if (typeof part === 'object') {
    const payload = part as Record<string, unknown>
    const directTextKeys = ['text', 'output_text', 'content', 'value']

    for (const key of directTextKeys) {
      const value = payload[key]
      if (typeof value === 'string') {
        return value
      }
    }

    const nestedContent = payload.content
    if (Array.isArray(nestedContent)) {
      const nestedText = nestedContent
        .map((item) => normalizeSessionMessageContentPart(item))
        .filter(Boolean)
        .join('')
      if (nestedText) return nestedText
    }
  }

  try {
    return JSON.stringify(part)
  } catch {
    return String(part)
  }
}

export const normalizeSessionMessageContent = (content: unknown): string => {
  return normalizeSessionMessageContentPart(content)
}

const createEmptyTurn = (
  index: number,
  createdAt: string,
  question = '',
  id?: string,
): DipChatKitMessageTurn => {
  return {
    id: id ? `session_turn_${id}` : `session_turn_${index}`,
    question,
    questionEmployees: [],
    questionAttachments: [],
    answerMarkdown: '',
    answerLoading: false,
    answerStreaming: false,
    createdAt,
  }
}

const normalizeSessionCreatedAt = (rawTs: unknown): string => {
  if (typeof rawTs === 'number' && Number.isFinite(rawTs)) {
    return new Date(rawTs).toISOString()
  }
  return new Date().toISOString()
}

export const mapSessionMessagesToTurns = (
  messages: DipChatKitSessionMessage[] | undefined,
): DipChatKitMessageTurn[] => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return []
  }

  const turns: DipChatKitMessageTurn[] = []
  let activeTurn: DipChatKitMessageTurn | null = null

  messages.forEach((message, index) => {
    const role = normalizeSessionMessageRole(message.role)
    const content = normalizeSessionMessageContent(message.content)
    const createdAt = normalizeSessionCreatedAt(message.ts)

    if (role === 'user') {
      const nextTurn = createEmptyTurn(index, createdAt, content, message.id)
      turns.push(nextTurn)
      activeTurn = nextTurn
      return
    }

    if (!content.trim()) {
      return
    }

    if (!activeTurn) {
      const nextTurn = createEmptyTurn(index, createdAt, '', message.id)
      turns.push(nextTurn)
      activeTurn = nextTurn
    }

    activeTurn.answerMarkdown = activeTurn.answerMarkdown
      ? `${activeTurn.answerMarkdown}\n\n${content}`
      : content
  })

  return turns.filter((turn) => {
    return turn.question.trim().length > 0 || turn.answerMarkdown.trim().length > 0
  })
}
