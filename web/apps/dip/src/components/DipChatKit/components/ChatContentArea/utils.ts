import type { DipChatKitSessionMessage } from '../../apis/types'
import type { DipChatKitAnswerEvent, DipChatKitMessageTurn } from '../../types'
import type { AiPromptSubmitPayload } from '../AiPromptInput/types'

const SYSTEM_ROLE = 'system'

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

const normalizeSessionContentPartType = (type: unknown): string => {
  if (typeof type !== 'string') return ''
  return type.trim().toLowerCase()
}

const isNonTextContentPartType = (type: string): boolean => {
  if (!type) return false
  return (
    type === 'toolcall' ||
    type === 'tool_call' ||
    type === 'function_call' ||
    type === 'function_call_output' ||
    type === 'item_reference'
  )
}

const normalizeSessionMessageContentPart = (part: unknown): string => {
  if (part === null || part === undefined) return ''
  if (typeof part === 'string') return part
  if (typeof part === 'number' || typeof part === 'boolean') return String(part)

  if (Array.isArray(part)) {
    return part
      .map((item) => normalizeSessionMessageContentPart(item))
      .filter(Boolean)
      .join('')
  }

  if (typeof part === 'object') {
    const payload = part as Record<string, unknown>
    const contentType = normalizeSessionContentPartType(payload.type)
    if (isNonTextContentPartType(contentType)) {
      return ''
    }

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

const normalizeToolName = (value: unknown): string => {
  if (typeof value !== 'string') return ''
  return value.trim()
}

const normalizeToolCallId = (value: unknown): string => {
  if (typeof value !== 'string') return ''
  return value.trim()
}

const normalizeDetails = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  return value as Record<string, unknown>
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

const extractToolCallEventsFromMessage = (
  message: DipChatKitSessionMessage,
  index: number,
): DipChatKitAnswerEvent[] => {
  const content = message.content
  if (!Array.isArray(content)) return []

  const timestamp =
    typeof message.ts === 'number' && Number.isFinite(message.ts) ? message.ts : undefined

  return content.reduce<DipChatKitAnswerEvent[]>((events, part, partIndex) => {
    if (!part || typeof part !== 'object' || Array.isArray(part)) return events
    const payload = part as Record<string, unknown>
    const type = normalizeSessionContentPartType(payload.type)
    if (type !== 'toolcall' && type !== 'tool_call' && type !== 'function_call') {
      return events
    }

    const name = normalizeToolName(payload.name ?? payload.toolName)
    const callId = normalizeToolCallId(payload.id ?? payload.call_id ?? payload.callId)
    const text = normalizeSessionMessageContent(payload.arguments)

    events.push({
      id: `session_event_tool_call_${index}_${partIndex}`,
      type: 'toolCall',
      role: 'assistant',
      toolName: name,
      toolCallId: callId,
      text,
      timestamp,
    })

    return events
  }, [])
}

const createSessionEvent = (
  message: DipChatKitSessionMessage,
  index: number,
  role: string,
): DipChatKitAnswerEvent | null => {
  const toolName = normalizeToolName((message as Record<string, unknown>).toolName)
  const toolCallId = normalizeToolCallId((message as Record<string, unknown>).toolCallId)
  const isError = (message as Record<string, unknown>).isError === true
  const details = normalizeDetails((message as Record<string, unknown>).details)
  const timestamp =
    typeof message.ts === 'number' && Number.isFinite(message.ts) ? message.ts : undefined
  const contentText = normalizeSessionMessageContent(message.content).trim()
  const detailsText = details ? toTextFromUnknown(details) : ''
  const text = contentText || detailsText

  if (!(text || toolName || toolCallId || details)) {
    return null
  }

  if (role === 'toolresult' || role === 'tool') {
    return {
      id: `session_event_tool_result_${index}`,
      type: 'toolResult',
      role,
      text,
      toolName,
      toolCallId,
      isError,
      timestamp,
      details,
    }
  }

  if (role && role !== 'assistant' && role !== 'user' && role !== SYSTEM_ROLE) {
    return {
      id: `session_event_unknown_${index}`,
      type: 'unknown',
      role,
      text,
      toolName,
      toolCallId,
      isError,
      timestamp,
      details,
    }
  }

  return null
}

const createEmptyTurn = (
  index: number,
  createdAt: string,
  sessionKey: string,
  question = '',
  id?: string,
): DipChatKitMessageTurn => {
  const normalizedId = id ? `${id}_${index}` : String(index)

  return {
    id: `session_turn_${normalizedId}`,
    sessionKey,
    question,
    questionEmployees: [],
    questionAttachments: [],
    answerMarkdown: '',
    answerEvents: [],
    answerTimeline: [],
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

const appendTurnAnswerText = (turn: DipChatKitMessageTurn, text: string, timelineId: string) => {
  const normalizedText = text.trim()
  if (!normalizedText) return

  turn.answerMarkdown = turn.answerMarkdown
    ? `${turn.answerMarkdown}\n\n${normalizedText}`
    : normalizedText
  turn.answerTimeline.push({
    id: timelineId,
    kind: 'text',
    text: normalizedText,
  })
}

const appendTurnAnswerEvent = (
  turn: DipChatKitMessageTurn,
  event: DipChatKitAnswerEvent,
  timelineId: string,
) => {
  turn.answerEvents.push(event)
  turn.answerTimeline.push({
    id: timelineId,
    kind: 'event',
    event,
  })
}

export const mapSessionMessagesToTurns = (
  messages: DipChatKitSessionMessage[] | undefined,
  sessionKey = '',
): DipChatKitMessageTurn[] => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return []
  }

  const turns: DipChatKitMessageTurn[] = []
  let activeTurn: DipChatKitMessageTurn | null = null

  messages.forEach((message, index) => {
    const role = normalizeSessionMessageRole(message.role)
    const content = normalizeSessionMessageContent(message.content).trim()
    const createdAt = normalizeSessionCreatedAt(message.ts)

    if (role === SYSTEM_ROLE) {
      return
    }

    if (role === 'user') {
      const nextTurn = createEmptyTurn(index, createdAt, sessionKey, content, message.id)
      turns.push(nextTurn)
      activeTurn = nextTurn
      return
    }

    if (!activeTurn) {
      activeTurn = createEmptyTurn(index, createdAt, sessionKey, '', message.id)
      turns.push(activeTurn)
    }
    const resolvedTurn = activeTurn
    if (!resolvedTurn) return

    if (role === 'assistant' && content) {
      appendTurnAnswerText(resolvedTurn, content, `session_timeline_text_${index}`)
    }

    if (role === 'assistant') {
      const toolCallEvents = extractToolCallEventsFromMessage(message, index)
      if (toolCallEvents.length > 0) {
        toolCallEvents.forEach((toolEvent, toolIndex) => {
          appendTurnAnswerEvent(
            resolvedTurn,
            toolEvent,
            `session_timeline_event_tool_call_${index}_${toolIndex}`,
          )
        })
      }
    }

    const event = createSessionEvent(message, index, role)
    if (event) {
      appendTurnAnswerEvent(resolvedTurn, event, `session_timeline_event_${index}`)
    }

    if (role !== 'assistant' && role !== SYSTEM_ROLE && content) {
      appendTurnAnswerText(resolvedTurn, content, `session_timeline_text_non_assistant_${index}`)
    }
  })

  return turns.filter((turn) => {
    return (
      turn.question.trim().length > 0 ||
      turn.answerMarkdown.trim().length > 0 ||
      turn.answerEvents.length > 0
    )
  })
}
