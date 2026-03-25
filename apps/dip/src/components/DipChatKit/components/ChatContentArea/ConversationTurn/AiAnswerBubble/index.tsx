import {
  CopyOutlined,
  RedoOutlined,
  RightOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import { Bubble, CodeHighlighter, Mermaid, ThoughtChain } from '@ant-design/x'
import XMarkdown, { type ComponentProps as MarkdownComponentProps } from '@ant-design/x-markdown'
import '@ant-design/x-markdown/dist/x-markdown.css'
import clsx from 'clsx'
import isEmpty from 'lodash/isEmpty'
import type React from 'react'
import { Children, useMemo } from 'react'
import intl from 'react-intl-universal'
import MessageActions from '../MessageActions'
import type { MessageAction } from '../MessageActions/types'
import styles from './index.module.less'
import type { AiAnswerBubbleProps, DipChatKitToolCardItem } from './types'
import {
  buildCardPreviewPayload,
  buildCodePreviewPayload,
  buildMarkdownFilePreviewPayload,
  buildToolCardItems,
  extractMarkdownFileNameFromHref,
  getDomDataAttributes,
  getToolCardsSummary,
  isMermaidLanguage,
  isToolRoleEvent,
  normalizeLanguage,
  normalizeMarkdownText,
  splitTextByMarkdownFileName,
} from './utils'

const AiAnswerBubble: React.FC<AiAnswerBubbleProps> = ({ turn, onCopy, onRegenerate, onOpenPreview }) => {
  const toolCards = useMemo(() => {
    return buildToolCardItems(turn.answerEvents)
  }, [turn.answerEvents])

  const toolCardsSummary = useMemo(() => {
    return getToolCardsSummary(toolCards)
  }, [toolCards])

  const hasToolRoleEvents = useMemo(() => {
    return turn.answerEvents.some(isToolRoleEvent)
  }, [turn.answerEvents])

  const markdownComponents = useMemo(() => {
    const openMarkdownFilePreview = (fileName: string, sourceContent?: string) => {
      onOpenPreview(buildMarkdownFilePreviewPayload(fileName, sourceContent))
    }

    const renderTextWithMarkdownFilePreview = (text: string, keyPrefix: string): React.ReactNode[] => {
      const segments = splitTextByMarkdownFileName(text)
      if (segments.length === 0) {
        return [text]
      }

      return segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={`${keyPrefix}-text-${index}`}>{segment.value}</span>
        }

        return (
          <span
            key={`${keyPrefix}-file-${index}`}
            className={styles.markdownFileLink}
            role="button"
            tabIndex={0}
            onClick={() => {
              openMarkdownFilePreview(segment.value, segment.value)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openMarkdownFilePreview(segment.value, segment.value)
              }
            }}
          >
            {segment.value}
          </span>
        )
      })
    }

    const renderChildrenWithMarkdownFilePreview = (
      children: React.ReactNode,
      keyPrefix: string,
    ): React.ReactNode[] => {
      const nodes = Children.toArray(children)
      return nodes.reduce<React.ReactNode[]>((result, node, index) => {
        if (typeof node === 'string') {
          const textNodes = renderTextWithMarkdownFilePreview(node, `${keyPrefix}-${index}`)
          result.push(...textNodes)
          return result
        }

        result.push(node)
        return result
      }, [])
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
          <div
            className={styles.blockCodeWrap}
            onClick={() => {
              onOpenPreview(buildCodePreviewPayload(language, codeText))
            }}
            role="presentation"
          >
            <Mermaid>{codeText}</Mermaid>
          </div>
        )
      }

      return (
        <div
          className={styles.blockCodeWrap}
          onClick={() => {
            onOpenPreview(buildCodePreviewPayload(language, codeText))
          }}
          role="presentation"
        >
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

    const ParagraphRenderer: React.FC<MarkdownComponentProps> = ({ children, className }) => {
      return <p className={className}>{renderChildrenWithMarkdownFilePreview(children, 'p')}</p>
    }

    const ListItemRenderer: React.FC<MarkdownComponentProps> = ({ children, className }) => {
      return <li className={className}>{renderChildrenWithMarkdownFilePreview(children, 'li')}</li>
    }

    const DivRenderer: React.FC<MarkdownComponentProps> = ({ children, className, domNode }) => {
      const attrs = getDomDataAttributes(domNode)
      const isPreviewCard = attrs['data-preview-card'] === 'true'
      if (!isPreviewCard) {
        return <div className={className}>{children}</div>
      }

      const title = attrs['data-preview-title'] || (intl.get('dipChatKit.answerCard').d('Answer card') as string)
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
      p: ParagraphRenderer,
      li: ListItemRenderer,
      div: DivRenderer,
    }
  }, [onOpenPreview])

  const answerContent =
    turn.answerMarkdown || (turn.answerLoading ? intl.get('dipChatKit.answerLoading').d('Processing...') : '')
  const hasToolCards = toolCards.length > 0
  const shouldRenderAnswerBubble =
    Boolean(answerContent) || turn.answerLoading || turn.answerStreaming || hasToolCards

  const bubbleActions = useMemo<MessageAction[]>(() => {
    const actions: MessageAction[] = []
    if (hasToolRoleEvents) {
      return actions
    }

    if (turn.answerMarkdown.trim()) {
      actions.push({
        key: 'copy-answer',
        title: intl.get('dipChatKit.copyAnswer').d('Copy answer') as string,
        icon: <CopyOutlined />,
        onClick: onCopy,
      })
    }

    if (turn.question.trim()) {
      actions.push({
        key: 'regenerate-answer',
        title: intl.get('dipChatKit.regenerateAnswer').d('Regenerate') as string,
        icon: <RedoOutlined />,
        onClick: onRegenerate,
      })
    }

    return actions
  }, [hasToolRoleEvents, onCopy, onRegenerate, turn.answerMarkdown, turn.question])

  const toolThoughtChainItems = useMemo(() => {
    return toolCards.map((toolCard: DipChatKitToolCardItem) => {
      const canOpenPreview = Boolean(toolCard.text)
      const hasPreviewContent = Boolean(toolCard.inlineText || toolCard.previewText)
      const status: 'error' | 'success' | undefined = toolCard.isError
        ? 'error'
        : toolCard.kind === 'result'
          ? 'success'
          : undefined

      return {
        key: toolCard.id,
        icon: status ? undefined : <ToolOutlined />,
        status,
        title: <span className={styles.toolThoughtChainTitle}>{toolCard.title}</span>,
        description: (
          <div className={styles.toolThoughtChainDescription}>
            {toolCard.detail && <span className={styles.toolThoughtChainMeta}>{toolCard.detail}</span>}
            {toolCard.toolCallId && (
              <span className={styles.toolThoughtChainMeta}>
                {intl.get('dipChatKit.eventCallId').d('Call ID')}: {toolCard.toolCallId}
              </span>
            )}
            {!canOpenPreview && toolCard.kind === 'result' && (
              <span className={styles.toolThoughtChainMeta}>
                {intl.get('dipChatKit.toolCompleted').d('Completed')}
              </span>
            )}
          </div>
        ),
        collapsible: hasPreviewContent,
        content: hasPreviewContent ? (
          <div className={styles.toolThoughtChainContent}>
            {toolCard.inlineText && (
              <div className={styles.toolThoughtChainInline}>{toolCard.inlineText}</div>
            )}
            {toolCard.previewText && (
              <pre className={styles.toolThoughtChainPreview}>{toolCard.previewText}</pre>
            )}
          </div>
        ) : undefined,
        footer: canOpenPreview ? (
          <span
            className={styles.toolThoughtChainView}
            role="button"
            tabIndex={0}
            onClick={() => {
              onOpenPreview(buildCardPreviewPayload(toolCard.title, toolCard.text))
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              onOpenPreview(buildCardPreviewPayload(toolCard.title, toolCard.text))
            }}
          >
            {intl.get('dipChatKit.eventActionView').d('View')} <RightOutlined />
          </span>
        ) : null,
      }
    })
  }, [onOpenPreview, toolCards])

  const renderToolCardsCollapse = () => {
    return (
      <details className={styles.chatToolsCollapse}>
        <summary className={styles.chatToolsSummary}>
          <span className={styles.chatToolsSummaryIcon}>
            <ToolOutlined />
          </span>
          <span className={styles.chatToolsSummaryCount}>
            {intl
              .get('dipChatKit.toolCountText', { count: toolCards.length })
              .d(`${toolCards.length} tool${toolCards.length === 1 ? '' : 's'}`)}
          </span>
          <span className={styles.chatToolsSummaryNames}>{toolCardsSummary}</span>
        </summary>
        <div className={styles.chatToolsCollapseBody}>
          <ThoughtChain
            className={styles.toolThoughtChain}
            line="dashed"
            items={toolThoughtChainItems}
            classNames={{
              item: styles.toolThoughtChainItem,
              itemContent: styles.toolThoughtChainItemContent,
              itemFooter: styles.toolThoughtChainItemFooter,
            }}
          />
        </div>
      </details>
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
            footer: {
              marginBlockStart: 6,
            },
          }}
          contentRender={(content) => {
            const normalizedContent = normalizeMarkdownText(content)
            const toolPreview = normalizedContent.trim().replace(/\s+/g, ' ').slice(0, 120)
            const toolSummary = toolCardsSummary || toolPreview
            const shouldRenderToolMessageCollapse = hasToolCards && hasToolRoleEvents

            return (
              <>
                {shouldRenderToolMessageCollapse ? (
                  <details className={styles.chatToolMsgCollapse}>
                    <summary className={styles.chatToolMsgSummary}>
                      <span className={styles.chatToolMsgSummaryIcon}>
                        <ToolOutlined />
                      </span>
                      <span className={styles.chatToolMsgSummaryLabel}>
                        {intl.get('dipChatKit.toolOutputLabel').d('Tool output')}
                      </span>
                      {!!toolSummary && (
                        <span className={styles.chatToolMsgSummaryNames}>{toolSummary}</span>
                      )}
                    </summary>
                    <div className={styles.chatToolMsgBody}>
                      {!!normalizedContent && (
                        <XMarkdown className={styles.markdownRoot} components={markdownComponents}>
                          {normalizedContent}
                        </XMarkdown>
                      )}
                      {renderToolCardsCollapse()}
                    </div>
                  </details>
                ) : (
                  <>
                    {!!normalizedContent && (
                      <XMarkdown className={styles.markdownRoot} components={markdownComponents}>
                        {normalizedContent}
                      </XMarkdown>
                    )}
                    {hasToolCards && renderToolCardsCollapse()}
                  </>
                )}
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
