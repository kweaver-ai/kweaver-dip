import { CopyOutlined, RedoOutlined } from '@ant-design/icons'
import { Bubble, CodeHighlighter, Mermaid } from '@ant-design/x'
import XMarkdown, { type ComponentProps as MarkdownComponentProps } from '@ant-design/x-markdown'
import '@ant-design/x-markdown/dist/x-markdown.css'
import clsx from 'clsx'
import isEmpty from 'lodash/isEmpty'
import type React from 'react'
import { Children } from 'react'
import { useMemo } from 'react'
import intl from 'react-intl-universal'
import MessageActions from '../MessageActions'
import styles from './index.module.less'
import type { AiAnswerBubbleProps } from './types'
import {
  buildCardPreviewPayload,
  buildCodePreviewPayload,
  buildMarkdownFilePreviewPayload,
  extractMarkdownFileNameFromHref,
  getDomDataAttributes,
  isMermaidLanguage,
  normalizeLanguage,
  normalizeMarkdownText,
  splitTextByMarkdownFileName,
} from './utils'

const AiAnswerBubble: React.FC<AiAnswerBubbleProps> = ({ turn, onCopy, onRegenerate, onOpenPreview }) => {
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

      const title =
        attrs['data-preview-title'] || (intl.get('dipChatKit.answerCard').d('回答卡片') as string)
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
    turn.answerMarkdown || (turn.answerLoading ? intl.get('dipChatKit.answerLoading').d('处理中...') : '')

  return (
    <div className={clsx('AiAnswerBubble', styles.root)}>
      <Bubble
        className={styles.bubble}
        content={answerContent}
        streaming={turn.answerStreaming}
        typing={turn.answerStreaming ? { effect: 'fade-in' } : false}
        loading={turn.answerLoading && isEmpty(turn.answerMarkdown)}
        contentRender={(content) => {
          return (
            <XMarkdown className={styles.markdownRoot} components={markdownComponents}>
              {normalizeMarkdownText(content)}
            </XMarkdown>
          )
        }}
        footer={
          <div className={styles.actionsWrap}>
            <MessageActions
              actions={[
                {
                  key: 'copy-answer',
                  title: intl.get('dipChatKit.copyAnswer').d('复制回答') as string,
                  icon: <CopyOutlined />,
                  onClick: onCopy,
                },
                {
                  key: 'regenerate-answer',
                  title: intl.get('dipChatKit.regenerateAnswer').d('重新生成') as string,
                  icon: <RedoOutlined />,
                  onClick: onRegenerate,
                },
              ]}
            />
          </div>
        }
      />
      {turn.answerError && <div className={styles.errorText}>{turn.answerError}</div>}
    </div>
  )
}

export default AiAnswerBubble
