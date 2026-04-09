import uniqBy from 'lodash/uniqBy'
import intl from 'react-intl-universal'
import type { AiPromptMentionOption, CursorAnchorPosition, MentionTriggerMatch } from './types'

const MB = 1024 * 1024
const MAX_IMAGE_SIZE = 10 * MB
const MAX_DOCUMENT_SIZE = 5 * MB

const imageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
])

const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'])

const documentMimeTypes = new Set([
  'text/plain',
  'text/markdown',
  'text/html',
  'text/csv',
  'application/json',
  'application/pdf',
])

const documentExtensions = new Set(['txt', 'md', 'markdown', 'html', 'htm', 'csv', 'json', 'pdf'])

type AttachmentCategory = 'image' | 'document'

export interface AttachmentValidationResult {
  validFiles: File[]
  errorMessages: string[]
}

const getFileExtension = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf('.')
  if (lastDotIndex < 0) return ''
  return fileName.slice(lastDotIndex + 1).toLocaleLowerCase()
}

const resolveAttachmentCategory = (file: File): AttachmentCategory | null => {
  const normalizedType = file.type.toLocaleLowerCase()
  const extension = getFileExtension(file.name)

  if (imageMimeTypes.has(normalizedType) || imageExtensions.has(extension)) {
    return 'image'
  }

  if (documentMimeTypes.has(normalizedType) || documentExtensions.has(extension)) {
    return 'document'
  }

  return null
}

const createUnsupportedTypeMessage = (fileName: string): string => {
  return intl
    .get('dipChatKit.unsupportedFileType', { fileName })
    .d(
      `文件“${fileName}”类型不支持，仅支持图片（jpeg/png/gif/webp/heic/heif）和文件（txt/markdown/html/csv/json/pdf）`,
    ) as string
}

const createSizeExceededMessage = (fileName: string, category: AttachmentCategory): string => {
  if (category === 'image') {
    return intl
      .get('dipChatKit.imageSizeExceeded', { fileName })
      .d(`图片“${fileName}”超过 10MB 限制`) as string
  }
  return intl
    .get('dipChatKit.fileSizeExceeded', { fileName })
    .d(`文件“${fileName}”超过 5MB 限制`) as string
}

const createDuplicateFileMessage = (fileName: string): string => {
  return intl
    .get('dipChatKit.duplicateFileUploaded', { fileName })
    .d(`文件“${fileName}”已上传，不允许重复上传`) as string
}

export const validateAttachmentFiles = (
  files: File[],
  currentFiles: File[] = [],
): AttachmentValidationResult => {
  const validFiles: File[] = []
  const errorMessages: string[] = []
  const existingFileNames = new Set(currentFiles.map((item) => item.name))
  const currentBatchFileNames = new Set<string>()

  for (const file of files) {
    if (existingFileNames.has(file.name) || currentBatchFileNames.has(file.name)) {
      errorMessages.push(createDuplicateFileMessage(file.name))
      continue
    }

    const category = resolveAttachmentCategory(file)
    if (!category) {
      errorMessages.push(createUnsupportedTypeMessage(file.name))
      continue
    }

    if (category === 'image' && file.size > MAX_IMAGE_SIZE) {
      errorMessages.push(createSizeExceededMessage(file.name, category))
      continue
    }

    if (category === 'document' && file.size > MAX_DOCUMENT_SIZE) {
      errorMessages.push(createSizeExceededMessage(file.name, category))
      continue
    }

    validFiles.push(file)
    currentBatchFileNames.add(file.name)
  }

  return {
    validFiles,
    errorMessages,
  }
}

const mirrorStyleKeys: Array<keyof CSSStyleDeclaration> = [
  'boxSizing',
  'width',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'fontVariant',
  'letterSpacing',
  'lineHeight',
  'textTransform',
  'textIndent',
  'textRendering',
  'wordSpacing',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'overflowX',
  'overflowY',
  'whiteSpace',
  'tabSize',
]

export const getTextAreaCaretPosition = (
  textArea: HTMLTextAreaElement,
  cursorIndex: number,
): CursorAnchorPosition => {
  const mirror = document.createElement('div')
  const marker = document.createElement('span')
  const computedStyle = window.getComputedStyle(textArea)

  for (const key of mirrorStyleKeys) {
    const styleKey = key as string
    ;(mirror.style as unknown as Record<string, string>)[styleKey] = (
      computedStyle as unknown as Record<string, string>
    )[styleKey]
  }

  mirror.style.position = 'absolute'
  mirror.style.left = '-9999px'
  mirror.style.top = '0'
  mirror.style.visibility = 'hidden'
  mirror.style.pointerEvents = 'none'
  mirror.style.wordBreak = 'break-word'
  mirror.style.overflowWrap = 'anywhere'

  const beforeValue = textArea.value.slice(0, cursorIndex)
  mirror.textContent = beforeValue
  if (beforeValue.endsWith('\n')) {
    mirror.textContent += '\u200b'
  }

  marker.textContent = textArea.value.slice(cursorIndex, cursorIndex + 1) || '\u200b'
  mirror.appendChild(marker)
  document.body.appendChild(mirror)

  const lineHeight =
    Number.parseFloat(computedStyle.lineHeight) || marker.getBoundingClientRect().height || 20

  const left = marker.offsetLeft - textArea.scrollLeft
  const top = marker.offsetTop - textArea.scrollTop + lineHeight

  document.body.removeChild(mirror)

  return {
    left,
    top,
  }
}

export const getContentEditableTextBeforeCursor = (editableElement: HTMLElement): string => {
  const selection = window.getSelection()
  if (!(selection && selection.rangeCount > 0)) return ''

  const range = selection.getRangeAt(0)
  if (!editableElement.contains(range.startContainer)) return ''

  const clonedRange = range.cloneRange()
  clonedRange.selectNodeContents(editableElement)
  clonedRange.setEnd(range.startContainer, range.startOffset)

  const fragment = clonedRange.cloneContents()
  fragment.querySelectorAll('[data-slot-key]').forEach((node) => {
    node.remove()
  })

  return (fragment.textContent || '').replace(/\u200b/g, '')
}

export const getContentEditableCaretPosition = (
  editableElement: HTMLElement,
  containerElement: HTMLElement,
): CursorAnchorPosition => {
  const selection = window.getSelection()
  const fallback = {
    left: 8,
    top: 8,
  }
  if (!(selection && selection.rangeCount > 0)) return fallback

  const range = selection.getRangeAt(0)
  if (!editableElement.contains(range.startContainer)) return fallback

  const caretRange = range.cloneRange()
  caretRange.collapse(true)

  const caretRect = caretRange.getClientRects()[0]
  const editableRect = editableElement.getBoundingClientRect()
  const targetRect = caretRect ?? editableRect
  const containerRect = containerElement.getBoundingClientRect()

  return {
    left: Math.max(targetRect.left - containerRect.left, 8),
    top: Math.max(targetRect.bottom - containerRect.top, 8),
  }
}

export const parseTriggerQueryBeforeCursor = (
  value: string,
  cursorIndex: number,
  characters: string[],
): MentionTriggerMatch | null => {
  if (!characters.length) return null

  const beforeCursor = value.slice(0, cursorIndex)

  let latestMatchIndex = -1
  let latestMatch: MentionTriggerMatch | null = null

  for (const character of characters) {
    if (!character) continue

    const index = beforeCursor.lastIndexOf(character)
    if (index < 0) continue

    const query = beforeCursor.slice(index + character.length)
    if (/\s/.test(query)) {
      continue
    }

    if (index > latestMatchIndex) {
      latestMatchIndex = index
      latestMatch = {
        character,
        query,
      }
    }
  }

  return latestMatch
}

export const filterMentionOptionsByQuery = (
  options: AiPromptMentionOption[],
  query: string,
): AiPromptMentionOption[] => {
  if (!query) return options
  const normalizedQuery = query.toLocaleLowerCase()

  return options.filter((item) => {
    return item.label.toLocaleLowerCase().includes(normalizedQuery)
  })
}

export const canStartTriggerAtCursor = (_value: string, _cursorIndex: number): boolean => true

export const getAttachmentFileKey = (file: File): string => {
  return `${file.name}_${file.size}_${file.lastModified}`
}

export const mergeAttachmentFiles = (currentFiles: File[], nextFiles: File[]): File[] => {
  return uniqBy([...currentFiles, ...nextFiles], getAttachmentFileKey)
}

interface UploadFileLike {
  name?: string
  size?: number
  type?: string
  originFileObj?: unknown
}

const isFileLike = (file: unknown): file is File => {
  if (!(file && typeof file === 'object')) return false
  const candidate = file as Partial<File>
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.size === 'number' &&
    typeof candidate.type === 'string'
  )
}

export const getRawUploadFile = (uploadFile: UploadFileLike): File | null => {
  const maybeRawFile = uploadFile.originFileObj ?? uploadFile
  if (isFileLike(maybeRawFile)) {
    return maybeRawFile
  }
  return null
}
