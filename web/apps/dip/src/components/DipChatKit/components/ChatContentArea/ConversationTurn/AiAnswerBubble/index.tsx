import { CheckOutlined, CopyOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import { Bubble, CodeHighlighter, Mermaid, Think, ThoughtChain } from '@ant-design/x'
import type { ComponentProps as MarkdownComponentProps } from '@ant-design/x-markdown'
import { Button, Collapse, Tag, Tooltip } from 'antd'
import clsx from 'clsx'
import isEmpty from 'lodash/isEmpty'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import intl from 'react-intl-universal'
import IconFont from '@/components/IconFont'
import type { DipChatKitAnswerEvent, DipChatKitAnswerTimelineItem } from '../../../../types'
import MarkdownRenderer from '../../../MarkdownRenderer'
import MessageActions from '../MessageActions'
import type { MessageAction } from '../MessageActions/types'
import ArtifactMessageCard from './ArtifactMessageCard'
import styles from './index.module.less'
import type { AiAnswerBubbleProps, DipChatKitToolCardItem } from './types'
import {
  buildArchiveGridPreviewPayload,
  buildCardPreviewPayload,
  buildMarkdownFilePreviewPayload,
  buildToolCardItems,
  extractMarkdownFileNameFromHref,
  extractThinkingContent,
  getDomDataAttributes,
  isMermaidLanguage,
  normalizeLanguage,
  normalizeMarkdownText,
} from './utils'

const TOOL_CARD_COLLAPSED_MAX_HEIGHT = 200
const STREAMING_TOOL_SUMMARY_KEYS = ['summary', 'description', 'desc', 'detail'] as const

interface AiAnswerBubbleTextSegment {
  id: string
  kind: 'text'
  text: string
}

interface AiAnswerBubbleToolSegment {
  id: string
  kind: 'tools'
  events: DipChatKitAnswerEvent[]
}

type AiAnswerBubbleSegment = AiAnswerBubbleTextSegment | AiAnswerBubbleToolSegment

const isNonEmptyText = (value: string): boolean => {
  return value.trim().length > 0
}

const buildFallbackTimeline = (answerMarkdown: string, answerEvents: DipChatKitAnswerEvent[]) => {
  const timeline: DipChatKitAnswerTimelineItem[] = []
  if (answerMarkdown) {
    timeline.push({
      id: 'fallback_timeline_text',
      kind: 'text',
      text: answerMarkdown,
    })
  }

  answerEvents.forEach((event, index) => {
    timeline.push({
      id: `fallback_timeline_event_${index}`,
      kind: 'event',
      event,
    })
  })

  return timeline
}

const buildAnswerSegments = (
  timeline: DipChatKitAnswerTimelineItem[],
  answerMarkdown: string,
  answerEvents: DipChatKitAnswerEvent[],
): AiAnswerBubbleSegment[] => {
  const sourceTimeline =
    timeline.length > 0 ? timeline : buildFallbackTimeline(answerMarkdown, answerEvents)
  const segments: AiAnswerBubbleSegment[] = []

  let toolEventsBuffer: DipChatKitAnswerEvent[] = []
  let textBuffer = ''

  const flushToolBuffer = () => {
    if (toolEventsBuffer.length === 0) return
    segments.push({
      id: `segment_tools_${segments.length}_${toolEventsBuffer[0]?.id || 'unknown'}`,
      kind: 'tools',
      events: toolEventsBuffer,
    })
    toolEventsBuffer = []
  }

  const flushTextBuffer = () => {
    if (!isNonEmptyText(textBuffer)) {
      textBuffer = ''
      return
    }
    segments.push({
      id: `segment_text_${segments.length}`,
      kind: 'text',
      text: textBuffer,
    })
    textBuffer = ''
  }

  sourceTimeline.forEach((item) => {
    if (item.kind === 'event') {
      flushTextBuffer()
      toolEventsBuffer.push(item.event)
      return
    }

    const nextText = item.text || ''
    if (!nextText) return

    if (isNonEmptyText(nextText)) {
      flushToolBuffer()
    }
    textBuffer = `${textBuffer}${nextText}`
  })

  flushTextBuffer()
  flushToolBuffer()

  return segments
}

const normalizeComparableText = (value: string): string => {
  return value.replace(/\r\n/g, '\n').trim()
}

const getFirstNonEmptyStringByKeys = (
  source: Record<string, unknown> | undefined,
  keys: readonly string[],
): string => {
  if (!source) return ''

  for (const key of keys) {
    const value = source[key]
    if (typeof value !== 'string') continue
    const normalized = value.trim()
    if (normalized) {
      return normalized
    }
  }

  return ''
}

const parseRecordFromText = (text: string): Record<string, unknown> | null => {
  const trimmed = text.trim()
  if (!trimmed) return null
  if (
    !(
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    )
  ) {
    return null
  }

  try {
    const parsed = JSON.parse(trimmed)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

const extractStreamingToolSummary = (event: DipChatKitAnswerEvent): string => {
  const summaryFromDetails = getFirstNonEmptyStringByKeys(
    event.details,
    STREAMING_TOOL_SUMMARY_KEYS,
  )
  if (summaryFromDetails) return summaryFromDetails

  const parsedText = parseRecordFromText(event.text || '')
  if (!parsedText) return ''

  const summaryFromRoot = getFirstNonEmptyStringByKeys(parsedText, STREAMING_TOOL_SUMMARY_KEYS)
  if (summaryFromRoot) return summaryFromRoot

  const args = parsedText.arguments
  if (typeof args === 'string') {
    const parsedArgs = parseRecordFromText(args)
    if (!parsedArgs) return ''
    return getFirstNonEmptyStringByKeys(parsedArgs, STREAMING_TOOL_SUMMARY_KEYS)
  }

  if (args && typeof args === 'object' && !Array.isArray(args)) {
    const summaryFromArguments = getFirstNonEmptyStringByKeys(
      args as Record<string, unknown>,
      STREAMING_TOOL_SUMMARY_KEYS,
    )
    if (summaryFromArguments) return summaryFromArguments
  }

  return ''
}

const resolveInProgressToolHint = (
  events: DipChatKitAnswerEvent[],
): {
  summary: string
  toolName: string
} => {
  let fallbackToolName = ''

  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index]
    if (event.type !== 'toolCall') continue
    if (event.details?.status !== 'in_progress') continue

    const toolName = event.toolName?.trim() || ''
    if (!fallbackToolName && toolName) {
      fallbackToolName = toolName
    }

    const summary = extractStreamingToolSummary(event)
    if (summary) {
      return {
        summary,
        toolName,
      }
    }
  }

  return {
    summary: '',
    toolName: fallbackToolName,
  }
}

const extractToolDuplicateCandidates = (events: DipChatKitAnswerEvent[]): string[] => {
  const candidateSet = new Set<string>()
  events.forEach((event) => {
    const text = normalizeComparableText(event.text || '')
    if (!text) return
    if (text.length < 16) return
    candidateSet.add(text)
  })
  return Array.from(candidateSet).sort((left, right) => right.length - left.length)
}

const stripDuplicatedToolText = (text: string, events: DipChatKitAnswerEvent[]): string => {
  const candidates = extractToolDuplicateCandidates(events)
  if (candidates.length === 0) return text

  let nextText = text
  candidates.forEach((candidate) => {
    if (!candidate) return
    if (!nextText.includes(candidate)) return
    nextText = nextText.split(candidate).join('')
  })

  return nextText.replace(/\n{3,}/g, '\n\n').trim()
}

const normalizeAnswerSegments = (segments: AiAnswerBubbleSegment[]): AiAnswerBubbleSegment[] => {
  const normalizedSegments: AiAnswerBubbleSegment[] = []

  segments.forEach((segment, index) => {
    if (segment.kind === 'tools') {
      const lastSegment = normalizedSegments[normalizedSegments.length - 1]
      if (lastSegment && lastSegment.kind === 'tools') {
        lastSegment.events = [...lastSegment.events, ...segment.events]
        return
      }
      normalizedSegments.push({
        ...segment,
        events: [...segment.events],
      })
      return
    }

    const previousSegment = normalizedSegments[normalizedSegments.length - 1]
    const previousToolEvents =
      previousSegment && previousSegment.kind === 'tools' ? previousSegment.events : []
    const nextSegment = segments[index + 1]
    const nextToolEvents = nextSegment && nextSegment.kind === 'tools' ? nextSegment.events : []
    const filteredByPrevious = stripDuplicatedToolText(segment.text, previousToolEvents)
    const filteredText = stripDuplicatedToolText(filteredByPrevious, nextToolEvents)

    if (!isNonEmptyText(filteredText)) {
      return
    }

    const lastSegment = normalizedSegments[normalizedSegments.length - 1]
    if (lastSegment && lastSegment.kind === 'text') {
      lastSegment.text = `${lastSegment.text}${filteredText}`
      return
    }

    normalizedSegments.push({
      ...segment,
      text: filteredText,
    })
  })

  return normalizedSegments
}

const isToolCardStateEqual = (
  left: Record<string, boolean>,
  right: Record<string, boolean>,
): boolean => {
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  if (leftKeys.length !== rightKeys.length) return false
  return leftKeys.every((key) => left[key] === right[key])
}

const AiAnswerBubble: React.FC<AiAnswerBubbleProps> = ({
  turn,
  isLatestAnswerTurn: _isLatestAnswerTurn,
  onCopy,
  onRegenerate: _onRegenerate,
  onOpenPreview,
}) => {
  const allToolCards = useMemo(() => {
    return buildToolCardItems(turn.answerEvents)
  }, [turn.answerEvents])

  const answerSegments = useMemo(() => {
    const rawSegments = buildAnswerSegments(
      turn.answerTimeline || [],
      turn.answerMarkdown,
      turn.answerEvents,
    )
    return normalizeAnswerSegments(rawSegments)
  }, [turn.answerEvents, turn.answerMarkdown, turn.answerTimeline])

  const isCallingTool = useMemo(() => {
    return turn.answerEvents.some((event) => {
      if (event.type !== 'toolCall') return false
      return event.details?.status === 'in_progress'
    })
  }, [turn.answerEvents])
  const [overflowToolCards, setOverflowToolCards] = useState<Record<string, boolean>>({})
  const [expandedToolCards, setExpandedToolCards] = useState<Record<string, boolean>>({})
  const toolCardBodyRefMap = useRef<Record<string, HTMLDivElement | null>>({})

  const setToolCardBodyRef = useCallback((cardId: string, node: HTMLDivElement | null) => {
    toolCardBodyRefMap.current[cardId] = node
  }, [])

  const measureToolCardOverflow = useCallback(() => {
    const nextOverflowState: Record<string, boolean> = {}
    allToolCards.forEach((toolCard) => {
      const bodyElement = toolCardBodyRefMap.current[toolCard.id]
      if (!bodyElement) return
      nextOverflowState[toolCard.id] = bodyElement.scrollHeight > TOOL_CARD_COLLAPSED_MAX_HEIGHT
    })

    setOverflowToolCards((prevState) => {
      if (isToolCardStateEqual(prevState, nextOverflowState)) return prevState
      return nextOverflowState
    })

    setExpandedToolCards((prevState) => {
      const nextExpandedState: Record<string, boolean> = {}
      allToolCards.forEach((toolCard) => {
        if (nextOverflowState[toolCard.id] && prevState[toolCard.id]) {
          nextExpandedState[toolCard.id] = true
        }
      })
      if (isToolCardStateEqual(prevState, nextExpandedState)) return prevState
      return nextExpandedState
    })
  }, [allToolCards])

  useEffect(() => {
    const validCardIdSet = new Set(allToolCards.map((toolCard) => toolCard.id))
    Object.keys(toolCardBodyRefMap.current).forEach((cardId) => {
      if (!validCardIdSet.has(cardId)) {
        delete toolCardBodyRefMap.current[cardId]
      }
    })
  }, [allToolCards])

  useEffect(() => {
    measureToolCardOverflow()
    const resizeObserver =
      typeof window.ResizeObserver === 'function'
        ? new window.ResizeObserver(() => {
            measureToolCardOverflow()
          })
        : null
    const observeToolCardBodies = () => {
      if (!resizeObserver) return
      Object.values(toolCardBodyRefMap.current).forEach((bodyElement) => {
        if (bodyElement) {
          resizeObserver.observe(bodyElement)
        }
      })
    }

    const rafId = window.requestAnimationFrame(() => {
      observeToolCardBodies()
      measureToolCardOverflow()
    })
    const handleWindowResize = () => {
      measureToolCardOverflow()
    }

    window.addEventListener('resize', handleWindowResize)
    return () => {
      resizeObserver?.disconnect()
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleWindowResize)
    }
  }, [measureToolCardOverflow])

  const toggleToolCardExpanded = useCallback((cardId: string) => {
    setExpandedToolCards((prevState) => ({
      ...prevState,
      [cardId]: !prevState[cardId],
    }))
  }, [])

  const markdownComponents = useMemo(() => {
    const openMarkdownFilePreview = (fileName: string, sourceContent?: string) => {
      onOpenPreview(buildMarkdownFilePreviewPayload(fileName, sourceContent))
    }

    const CodeRenderer: React.FC<MarkdownComponentProps> = ({
      children,
      lang,
      block,
      className,
    }) => {
      const language = normalizeLanguage(lang)
      const codeText = normalizeMarkdownText(children)

      if (!block) {
        return <code className={clsx(styles.inlineCode, className)}>{codeText}</code>
      }

      if (isMermaidLanguage(language)) {
        return (
          <div className={styles.blockCodeWrap}>
            <Mermaid>{codeText}</Mermaid>
          </div>
        )
      }

      const artifactPreviewPayload = buildArchiveGridPreviewPayload(turn.sessionKey, codeText)
      if (artifactPreviewPayload?.artifact) {
        return (
          <div className={styles.blockCodeWrap}>
            <ArtifactMessageCard
              fileName={artifactPreviewPayload.artifact.fileName}
              archiveRoot={artifactPreviewPayload.artifact.archiveRoot || ''}
              onClick={() => {
                onOpenPreview(artifactPreviewPayload)
              }}
            />
          </div>
        )
      }

      return (
        <div className={styles.blockCodeWrap}>
          <CodeHighlighter lang={language || 'text'}>{codeText}</CodeHighlighter>
        </div>
      )
    }

    const LinkRenderer: React.FC<MarkdownComponentProps> = ({ children, className, href }) => {
      const hrefText = normalizeMarkdownText(href)
      const fileName = extractMarkdownFileNameFromHref(hrefText)

      if (!fileName) {
        return (
          <a className={className} href={hrefText || undefined} target="_blank" rel="noreferrer">
            {children}
          </a>
        )
      }

      const displayText = normalizeMarkdownText(children) || fileName
      return (
        <span
          className={clsx(className, styles.markdownFileLink)}
          role="button"
          tabIndex={0}
          onClick={() => {
            openMarkdownFilePreview(fileName, hrefText || displayText)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              openMarkdownFilePreview(fileName, hrefText || displayText)
            }
          }}
        >
          {displayText}
        </span>
      )
    }

    const DivRenderer: React.FC<MarkdownComponentProps> = ({ children, className, domNode }) => {
      const attrs = getDomDataAttributes(domNode)
      const isPreviewCard = attrs['data-preview-card'] === 'true'
      if (!isPreviewCard) {
        return <div className={className}>{children}</div>
      }

      const title =
        attrs['data-preview-title'] ||
        (intl.get('dipChatKit.answerCard').d('Answer card') as string)
      const content = attrs['data-preview-content'] || normalizeMarkdownText(children)

      return (
        <div
          className={styles.previewCard}
          onClick={() => {
            onOpenPreview(buildCardPreviewPayload(title, content))
          }}
          role="presentation"
        >
          <span className={styles.previewCardTitle}>{title}</span>
          <span className={styles.previewCardDesc}>{content}</span>
        </div>
      )
    }

    return {
      code: CodeRenderer,
      a: LinkRenderer,
      div: DivRenderer,
    }
  }, [onOpenPreview, turn.sessionKey])

  const toolCardMarkdownComponents = useMemo(() => {
    const ToolCardLinkRenderer: React.FC<MarkdownComponentProps> = ({
      children,
      className,
      href,
    }) => {
      const hrefText = normalizeMarkdownText(href)
      return (
        <a className={className} href={hrefText || undefined} target="_blank" rel="noreferrer">
          {children}
        </a>
      )
    }

    return {
      a: ToolCardLinkRenderer,
    }
  }, [])

  const answerContent =
    turn.answerMarkdown ||
    (turn.answerLoading ? intl.get('dipChatKit.answerLoading').d('Processing...') : '')
  const hasToolCards = allToolCards.length > 0
  const shouldRenderAnswerBubble =
    Boolean(answerContent) || turn.answerLoading || turn.answerStreaming || hasToolCards

  const bubbleActions = useMemo<MessageAction[]>(() => {
    const actions: MessageAction[] = []
    const hasAnswerText = Boolean(turn.answerMarkdown.trim())
    if (turn.answerStreaming || turn.answerLoading) {
      return actions
    }

    if (hasAnswerText) {
      actions.push({
        key: 'copy-answer',
        title: intl.get('dipChatKit.copyAnswer').d('Copy answer') as string,
        icon: <CopyOutlined />,
        onClick: onCopy,
      })
    }

    return actions
  }, [onCopy, turn.answerLoading, turn.answerMarkdown, turn.answerStreaming])

  const resolveToolIconType = (toolName: string): string => {
    const normalizedToolName = toolName.trim().toLowerCase()
    if (
      normalizedToolName === 'read' ||
      normalizedToolName.includes('read') ||
      normalizedToolName.includes('doc') ||
      normalizedToolName.includes('file')
    ) {
      return 'icon-plan'
    }
    return 'icon-tool'
  }

  const renderToolCard = (toolCard: DipChatKitToolCardItem) => {
    const hasText = Boolean(toolCard.text.trim())
    const showPreview = Boolean(toolCard.previewText)
    const showInline = Boolean(toolCard.inlineText)
    const shouldRenderResultMarkdown = toolCard.kind === 'result' && hasText
    const isOverflow = Boolean(overflowToolCards[toolCard.id])
    const isExpanded = Boolean(expandedToolCards[toolCard.id])
    const shouldCollapse = isOverflow && !isExpanded
    const statusText = toolCard.isError
      ? (intl.get('dipChatKit.eventActionError').d('Error') as string)
      : toolCard.status === 'in_progress'
        ? (intl.get('dipChatKit.toolInProgress').d('In progress') as string)
        : toolCard.kind === 'result' || toolCard.status === 'completed'
          ? (intl.get('dipChatKit.toolCompleted').d('Completed') as string)
          : (intl.get('dipChatKit.toolCompleted').d('Completed') as string)
    const statusTagColor = toolCard.isError
      ? 'error'
      : toolCard.status === 'in_progress'
        ? 'processing'
        : 'success'

    return (
      <div
        key={toolCard.id}
        className={clsx(
          'chatToolCard',
          styles.chatToolCard,
          isOverflow && styles.chatToolCardOverflow,
          shouldCollapse && styles.chatToolCardCollapsed,
          toolCard.isError && styles.chatToolCardError,
        )}
        style={shouldCollapse ? { maxHeight: `${TOOL_CARD_COLLAPSED_MAX_HEIGHT}px` } : undefined}
      >
        <div
          className={styles.chatToolCardBody}
          ref={(node) => {
            setToolCardBodyRef(toolCard.id, node)
          }}
        >
          <div className={styles.chatToolCardHeader}>
            <div className={styles.chatToolCardTitle}>
              <span className={styles.chatToolCardIcon}>
                <IconFont type={resolveToolIconType(toolCard.toolName || toolCard.title)} />
              </span>
              <span>{toolCard.title}</span>
            </div>
            {!hasText && (
              <span className={styles.chatToolCardStatus}>
                <CheckOutlined />
              </span>
            )}
          </div>
          {toolCard.detail && <div className={styles.chatToolCardDetail}>{toolCard.detail}</div>}
          {!hasText && (
            <div className={styles.chatToolCardStatusText}>
              <Tag color={statusTagColor}>{statusText}</Tag>
            </div>
          )}
          {showPreview && (
            <div className={styles.chatToolCardPreview}>
              {shouldRenderResultMarkdown ? (
                <MarkdownRenderer
                  className={styles.toolCardMarkdown}
                  variant="tool"
                  components={toolCardMarkdownComponents}
                  content={toolCard.text}
                />
              ) : (
                <pre className={styles.chatToolCardPreviewText}>{toolCard.previewText}</pre>
              )}
            </div>
          )}
          {showInline && (
            <div className={styles.chatToolCardInline}>
              {shouldRenderResultMarkdown ? (
                <MarkdownRenderer
                  className={styles.toolCardMarkdown}
                  variant="tool"
                  components={toolCardMarkdownComponents}
                  content={toolCard.text}
                />
              ) : (
                <span className={styles.chatToolCardInlineText}>{toolCard.inlineText}</span>
              )}
            </div>
          )}
        </div>

        {isOverflow && (
          <>
            {shouldCollapse && <div className={styles.chatToolCardFadeMask} />}
            <div className={styles.chatToolCardToggleWrap}>
              <Tooltip
                title={
                  isExpanded
                    ? (intl.get('dipChatKit.collapse').d('收起') as string)
                    : (intl.get('dipChatKit.expand').d('更多') as string)
                }
              >
                <Button
                  type="text"
                  size="small"
                  className={styles.chatToolCardToggleBtn}
                  icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                  aria-label={
                    isExpanded
                      ? (intl.get('dipChatKit.collapse').d('收起') as string)
                      : (intl.get('dipChatKit.expand').d('更多') as string)
                  }
                  onClick={() => {
                    toggleToolCardExpanded(toolCard.id)
                  }}
                />
              </Tooltip>
            </div>
          </>
        )}
      </div>
    )
  }

  const renderToolCards = (toolCards: DipChatKitToolCardItem[], isToolOnly = false) => {
    if (toolCards.length === 0) {
      return null
    }

    return (
      <div className={clsx(styles.chatToolsList, isToolOnly && styles.chatToolsListToolOnly)}>
        {toolCards.map(renderToolCard)}
      </div>
    )
  }

  const renderStreamingThought = (events?: DipChatKitAnswerEvent[]) => {
    if (!turn.answerStreaming) return null
    const generatingDesc = intl.get('dipChatKit.generatingDesc').d('Please wait...') as string
    let title = intl.get('dipChatKit.generating').d('Generating') as string

    if (isCallingTool) {
      const toolHint = resolveInProgressToolHint(events || turn.answerEvents)
      if (toolHint.summary) {
        title = toolHint.summary
      } else if (toolHint.toolName) {
        title = intl
          .get('dipChatKit.toolCallingWithName', { toolName: toolHint.toolName })
          .d(`Calling ${toolHint.toolName}`) as string
      } else {
        title = intl.get('dipChatKit.toolCalling').d('Calling tools') as string
      }
    }

    return (
      <ThoughtChain.Item
        className={styles.streamingThought}
        blink
        variant="text"
        title={title}
        description={generatingDesc}
      />
    )
  }

  const isToolSegmentInProgress = (events: DipChatKitAnswerEvent[]): boolean => {
    return events.some(
      (event) => event.type === 'toolCall' && event.details?.status === 'in_progress',
    )
  }

  const renderToolProcessSegment = (segment: AiAnswerBubbleToolSegment, index: number) => {
    const segmentToolCards = buildToolCardItems(segment.events)
    if (segmentToolCards.length === 0) return null

    const panelKey = `tool_process_panel_${segment.id}_${index}`
    const inProgress = isToolSegmentInProgress(segment.events)
    const keepExpandedUntilStreamDone = turn.answerStreaming
    const toolCalledText = intl
      .get('dipChatKit.toolCalledCount', { count: segmentToolCards.length })
      .d(`调用了${segmentToolCards.length}个工具`) as string

    return (
      <Collapse
        className={styles.chatToolsCollapse}
        key={`${panelKey}_${keepExpandedUntilStreamDone ? 'streaming' : 'done'}`}
        ghost
        expandIconPosition="start"
        defaultActiveKey={keepExpandedUntilStreamDone ? [panelKey] : []}
        items={[
          {
            key: panelKey,
            label: toolCalledText,
            children: (
              <>
                {renderToolCards(segmentToolCards)}
                {inProgress && renderStreamingThought(segment.events)}
              </>
            ),
          },
        ]}
      />
    )
  }

  const renderTextSegment = (text: string, index: number) => {
    const { thinkingText, answerText } = extractThinkingContent(text)

    if (!(thinkingText || answerText)) {
      return null
    }

    return (
      <div key={`answer_text_segment_${index}`}>
        {!!thinkingText && (
          <Think
            className={styles.thinkingBlock}
            title={intl.get('dipChatKit.thinkingTitle').d('思考过程') as string}
            blink={turn.answerStreaming}
            defaultExpanded={false}
          >
            <MarkdownRenderer
              className={styles.thinkingMarkdown}
              variant="thinking"
              components={markdownComponents}
              content={thinkingText}
            />
          </Think>
        )}
        {!!answerText && (
          <MarkdownRenderer
            className={styles.markdownRoot}
            variant="answer"
            components={markdownComponents}
            content={answerText}
          />
        )}
      </div>
    )
  }

  return (
    <div className={clsx('AiAnswerBubble', styles.root)}>
      {shouldRenderAnswerBubble && (
        <Bubble
          className={styles.bubble}
          content={answerContent}
          streaming={turn.answerStreaming}
          typing={turn.answerStreaming ? { effect: 'fade-in' } : false}
          loading={turn.answerLoading && isEmpty(turn.answerMarkdown)}
          styles={{
            content: {
              background: 'transparent',
            },
            footer: {
              marginBlockStart: 6,
            },
          }}
          contentRender={(content) => {
            const normalizedContent = normalizeMarkdownText(content)
            const hasBuiltSegments = answerSegments.length > 0

            return (
              <>
                {hasBuiltSegments
                  ? answerSegments.map((segment, index) => {
                      if (segment.kind === 'tools') {
                        return (
                          <div key={segment.id}>{renderToolProcessSegment(segment, index)}</div>
                        )
                      }
                      return renderTextSegment(segment.text, index)
                    })
                  : renderTextSegment(normalizedContent, 0)}
                {turn.answerStreaming && !isCallingTool && renderStreamingThought()}
              </>
            )
          }}
          footer={
            bubbleActions.length > 0 ? (
              <div className={styles.actionsWrap}>
                <MessageActions actions={bubbleActions} />
              </div>
            ) : null
          }
        />
      )}
      {turn.answerError && <div className={styles.errorText}>{turn.answerError}</div>}
    </div>
  )
}

export default AiAnswerBubble
