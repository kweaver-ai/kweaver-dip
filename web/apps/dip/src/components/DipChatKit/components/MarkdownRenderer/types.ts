import type { ComponentProps as MarkdownComponentProps } from '@ant-design/x-markdown'
import type React from 'react'

export type MarkdownRendererVariant = 'preview' | 'answer' | 'tool' | 'thinking'

export type MarkdownRendererComponents = Record<string, React.FC<MarkdownComponentProps>>

export interface MarkdownRendererProps {
  content: string
  className?: string
  variant?: MarkdownRendererVariant
  components?: MarkdownRendererComponents
}
