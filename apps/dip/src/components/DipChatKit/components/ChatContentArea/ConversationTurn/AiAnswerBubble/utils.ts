import isString from 'lodash/isString'
import intl from 'react-intl-universal'
import type { DipChatKitPreviewPayload } from '../../../../types'

const MARKDOWN_FILE_NAME_PATTERN =
  /([^\s"'“”‘’<>()\[\]{}]+?\.md)(?=$|[\s,，。！？；:：)）\]】"'“”‘’])/gi

export const normalizeMarkdownText = (value: unknown): string => {
  if (isString(value)) return value
  if (value === null || value === undefined) return ''
  return String(value)
}

export const normalizeLanguage = (lang?: string): string => {
  if (!lang) return ''
  return lang.trim().split(/\s+/)[0]?.toLowerCase() || ''
}

export const isMermaidLanguage = (lang: string): boolean => {
  return lang === 'mermaid'
}

export const getDomDataAttributes = (domNode: unknown): Record<string, string> => {
  if (!domNode || typeof domNode !== 'object') return {}
  if (!('attribs' in domNode)) return {}

  const attrs = (domNode as { attribs?: Record<string, string> }).attribs
  if (!attrs || typeof attrs !== 'object') return {}
  return attrs
}

export const buildCodePreviewPayload = (lang: string, code: string): DipChatKitPreviewPayload => {
  const sourceType = isMermaidLanguage(lang) ? 'mermaid' : 'code'
  const resolvedDefaultLanguage = intl.get('dipChatKit.defaultCodeLanguage').d('text') as string
  const resolvedLanguage = lang || resolvedDefaultLanguage
  return {
    title: isMermaidLanguage(lang)
      ? (intl.get('dipChatKit.mermaidPreview').d('Mermaid 预览') as string)
      : (intl
          .get('dipChatKit.codeSnippetTitle', { lang: resolvedLanguage })
          .d(`${resolvedLanguage} 代码片段`) as string),
    content: code,
    sourceType,
  }
}

export const buildCardPreviewPayload = (
  title: string,
  content: string,
): DipChatKitPreviewPayload => {
  return {
    title,
    content,
    sourceType: 'card',
  }
}

export interface TextSegment {
  type: 'text' | 'file'
  value: string
}

export const splitTextByMarkdownFileName = (text: string): TextSegment[] => {
  if (!text) return []

  const segments: TextSegment[] = []
  let lastIndex = 0
  MARKDOWN_FILE_NAME_PATTERN.lastIndex = 0

  let match = MARKDOWN_FILE_NAME_PATTERN.exec(text)
  while (match) {
    const fullMatch = match[0]
    const matchIndex = match.index
    if (matchIndex > lastIndex) {
      segments.push({
        type: 'text',
        value: text.slice(lastIndex, matchIndex),
      })
    }

    segments.push({
      type: 'file',
      value: fullMatch,
    })

    lastIndex = matchIndex + fullMatch.length
    match = MARKDOWN_FILE_NAME_PATTERN.exec(text)
  }

  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      value: text.slice(lastIndex),
    })
  }

  return segments
}

export const extractMarkdownFileNameFromHref = (href: string): string => {
  if (!href) return ''
  const path = href.split('#')[0]?.split('?')[0] || ''
  const fileNameWithEncoding = path.split('/').pop() || ''
  if (!fileNameWithEncoding) return ''

  let fileName = fileNameWithEncoding
  try {
    fileName = decodeURIComponent(fileNameWithEncoding)
  } catch {
    fileName = fileNameWithEncoding
  }

  if (!/\.md$/i.test(fileName)) {
    return ''
  }

  return fileName
}

export const buildMarkdownFilePreviewPayload = (
  fileName: string,
  sourceContent?: string,
): DipChatKitPreviewPayload => {
  return {
    title: fileName || (intl.get('dipChatKit.markdownFile').d('Markdown 文件') as string),
    content: sourceContent || fileName || '',
    sourceType: 'text',
  }
}
