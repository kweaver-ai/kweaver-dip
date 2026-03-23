import { CodeHighlighter, Mermaid } from '@ant-design/x'
import XMarkdown, { type ComponentProps as MarkdownComponentProps } from '@ant-design/x-markdown'
import '@ant-design/x-markdown/dist/x-markdown.css'
import clsx from 'clsx'
import type React from 'react'
import { useMemo } from 'react'
import styles from './index.module.less'
import type { PreviewMarkdownProps } from './types'

const normalizeText = (value: unknown): string => {
  if (typeof value === 'string') {
    return value
  }
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}

const normalizeLanguage = (lang?: string): string => {
  if (!lang) return 'text'
  return lang.trim().split(/\s+/)[0]?.toLowerCase() || 'text'
}

const PreviewMarkdown: React.FC<PreviewMarkdownProps> = ({ content }) => {
  const markdownComponents = useMemo(() => {
    const CodeRenderer: React.FC<MarkdownComponentProps> = ({ children, lang, block, className }) => {
      const codeText = normalizeText(children)
      const language = normalizeLanguage(lang)

      if (!block) {
        return <code className={clsx(styles.inlineCode, className)}>{codeText}</code>
      }

      if (language === 'mermaid') {
        return <Mermaid>{codeText}</Mermaid>
      }

      return <CodeHighlighter lang={language}>{codeText}</CodeHighlighter>
    }

    return {
      code: CodeRenderer,
    }
  }, [])

  return (
    <div className={clsx('PreviewMarkdown', styles.root)}>
      <XMarkdown components={markdownComponents}>{content}</XMarkdown>
    </div>
  )
}

export default PreviewMarkdown
