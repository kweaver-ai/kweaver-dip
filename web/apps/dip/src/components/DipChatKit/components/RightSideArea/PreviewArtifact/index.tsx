import {
  CloseOutlined,
  DownloadOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
} from '@ant-design/icons'
import { CodeHighlighter } from '@ant-design/x'
import { Avatar, Button, message, Segmented, Skeleton, Tooltip } from 'antd'
import clsx from 'clsx'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import intl from 'react-intl-universal'
import { getSessionArchiveSubpath } from '../../../apis'
import ScrollContainer from '../../ScrollContainer'
import PreviewMarkdown from '../PreviewMarkdown'
import styles from './index.module.less'
import type { PreviewArtifactProps } from './types'

type ArtifactPreviewMode = 'text' | 'markdown' | 'html' | 'image' | 'pdf'
type ArtifactPreviewTab = 'preview' | 'code'

interface ArtifactPreviewState {
  loading: boolean
  error: string
  mode: ArtifactPreviewMode
  textContent: string
  blobUrl: string
}

const TEXT_EXTENSIONS = new Set(['txt', 'json', 'log', 'csv', 'xml', 'yaml', 'yml'])
const MARKDOWN_EXTENSIONS = new Set(['md', 'markdown', 'bkn'])
const HTML_EXTENSIONS = new Set(['html', 'htm'])
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'])
const PDF_EXTENSIONS = new Set(['pdf'])

const getFileExtension = (fileName: string): string => {
  const normalizedFileName = fileName.trim()
  const dotIndex = normalizedFileName.lastIndexOf('.')
  if (dotIndex < 0) return ''
  return normalizedFileName.slice(dotIndex + 1).toLowerCase()
}

const resolvePreviewMode = (fileName: string): ArtifactPreviewMode => {
  const ext = getFileExtension(fileName)
  if (MARKDOWN_EXTENSIONS.has(ext)) return 'markdown'
  if (HTML_EXTENSIONS.has(ext)) return 'html'
  if (IMAGE_EXTENSIONS.has(ext)) return 'image'
  if (PDF_EXTENSIONS.has(ext)) return 'pdf'
  if (TEXT_EXTENSIONS.has(ext)) return 'text'
  return 'text'
}

const getBlobMimeType = (mode: ArtifactPreviewMode, fileName: string): string => {
  if (mode === 'html') return 'text/html;charset=utf-8'
  if (mode === 'markdown') return 'text/markdown;charset=utf-8'
  if (mode === 'text') return 'text/plain;charset=utf-8'
  if (mode === 'image') {
    const ext = getFileExtension(fileName)
    if (ext === 'svg') return 'image/svg+xml'
    if (ext === 'png') return 'image/png'
    if (ext === 'gif') return 'image/gif'
    if (ext === 'webp') return 'image/webp'
    return 'image/jpeg'
  }
  if (mode === 'pdf') return 'application/pdf'
  return 'application/octet-stream'
}

const createInitialState = (): ArtifactPreviewState => ({
  loading: true,
  error: '',
  mode: 'text',
  textContent: '',
  blobUrl: '',
})

const resolveFileInitial = (fileName: string): string => {
  const normalized = fileName.trim()
  if (!normalized) return '#'
  return normalized.slice(0, 1).toUpperCase()
}

const HTML_PREVIEW_STYLE_TAG = 'data-dip-chatkit-html-preview-style'

const injectHtmlPreviewStyle = (html: string): string => {
  const injectedStyle = `<style ${HTML_PREVIEW_STYLE_TAG}>html,body{overflow:hidden!important;margin:0;}body{min-height:100%;}</style>`
  if (!html.trim()) return injectedStyle
  if (html.includes(HTML_PREVIEW_STYLE_TAG)) return html
  if (html.includes('</head>')) {
    return html.replace('</head>', `${injectedStyle}</head>`)
  }
  if (html.includes('<html')) {
    return html.replace(/<html[^>]*>/i, (match) => `${match}<head>${injectedStyle}</head>`)
  }
  return `${injectedStyle}${html}`
}

const getHtmlDocumentHeight = (doc: Document): number => {
  const html = doc.documentElement
  const body = doc.body
  const candidates = [
    html?.scrollHeight ?? 0,
    html?.offsetHeight ?? 0,
    html?.clientHeight ?? 0,
    body?.scrollHeight ?? 0,
    body?.offsetHeight ?? 0,
    body?.clientHeight ?? 0,
  ]
  return Math.max(0, ...candidates)
}

const PreviewArtifact: React.FC<PreviewArtifactProps> = ({
  payload,
  onClose,
  fullscreen,
  onToggleFullscreen,
}) => {
  const [activeTab, setActiveTab] = useState<ArtifactPreviewTab>('preview')
  const [downloading, setDownloading] = useState(false)
  const [state, setState] = useState<ArtifactPreviewState>(createInitialState)
  const [htmlFrameHeight, setHtmlFrameHeight] = useState(0)
  const htmlFrameRef = useRef<HTMLIFrameElement | null>(null)
  const htmlResizeObserverRef = useRef<ResizeObserver | null>(null)
  const htmlLoadTimerRef = useRef<number[]>([])

  const artifactInfo = payload.artifact

  const previewMeta = useMemo(() => {
    if (!artifactInfo) return null
    const sessionKey = artifactInfo.sessionKey.trim()
    const subpath = artifactInfo.subpath.trim()
    const fileName = (artifactInfo.fileName || artifactInfo.subpath || '').trim()
    if (!(sessionKey && subpath && fileName)) return null

    return {
      sessionKey,
      subpath,
      fileName,
      mode: resolvePreviewMode(fileName),
    }
  }, [artifactInfo])

  const canSwitchCodeTab =
    state.mode === 'html' || state.mode === 'markdown' || state.mode === 'text'
  const htmlSrcDoc = useMemo(() => {
    if (state.mode !== 'html') return ''
    return injectHtmlPreviewStyle(state.textContent)
  }, [state.mode, state.textContent])

  const clearHtmlResizeObserver = useCallback(() => {
    if (htmlResizeObserverRef.current) {
      htmlResizeObserverRef.current.disconnect()
      htmlResizeObserverRef.current = null
    }
  }, [])

  const clearHtmlLoadTimers = useCallback(() => {
    if (!htmlLoadTimerRef.current.length) return
    htmlLoadTimerRef.current.forEach((timerId) => {
      window.clearTimeout(timerId)
    })
    htmlLoadTimerRef.current = []
  }, [])

  const syncHtmlFrameHeight = useCallback(() => {
    const doc = htmlFrameRef.current?.contentDocument
    if (!doc) return
    const nextHeight = getHtmlDocumentHeight(doc)
    setHtmlFrameHeight((prevHeight) => (prevHeight === nextHeight ? prevHeight : nextHeight))
  }, [])

  const bindHtmlResizeObserver = useCallback(() => {
    const doc = htmlFrameRef.current?.contentDocument
    if (!doc || typeof ResizeObserver === 'undefined') return

    clearHtmlResizeObserver()

    const observer = new ResizeObserver(() => {
      syncHtmlFrameHeight()
    })

    observer.observe(doc.documentElement)
    if (doc.body) {
      observer.observe(doc.body)
    }

    htmlResizeObserverRef.current = observer
  }, [clearHtmlResizeObserver, syncHtmlFrameHeight])

  useEffect(() => {
    if (activeTab === 'code' && !canSwitchCodeTab) {
      setActiveTab('preview')
    }
  }, [activeTab, canSwitchCodeTab])

  useEffect(() => {
    if (!previewMeta) {
      setState({
        loading: false,
        error: intl.get('dipChatKit.artifactMetaMissing').d('缺少归档文件预览所需信息') as string,
        mode: 'text',
        textContent: '',
        blobUrl: '',
      })
      return undefined
    }

    let disposed = false
    let localBlobUrl = ''

    setState((prevState) => {
      if (prevState.blobUrl) {
        URL.revokeObjectURL(prevState.blobUrl)
      }
      return {
        loading: true,
        error: '',
        mode: previewMeta.mode,
        textContent: '',
        blobUrl: '',
      }
    })

    const loadPreview = async () => {
      try {
        if (
          previewMeta.mode === 'html' ||
          previewMeta.mode === 'markdown' ||
          previewMeta.mode === 'text'
        ) {
          const response = await getSessionArchiveSubpath(
            previewMeta.sessionKey,
            previewMeta.subpath,
            {
              responseType: 'text',
            },
          )
          const textContent = typeof response === 'string' ? response : ''
          if (disposed) return
          setState({
            loading: false,
            error: '',
            mode: previewMeta.mode,
            textContent,
            blobUrl: '',
          })
          return
        }

        const response = await getSessionArchiveSubpath(
          previewMeta.sessionKey,
          previewMeta.subpath,
          {
            responseType: 'arraybuffer',
          },
        )
        if (!(response instanceof ArrayBuffer)) {
          throw new Error(
            intl.get('dipChatKit.archiveFileTypeMismatch').d('归档文件返回类型异常') as string,
          )
        }

        localBlobUrl = URL.createObjectURL(
          new Blob([response], { type: getBlobMimeType(previewMeta.mode, previewMeta.fileName) }),
        )
        if (disposed) {
          URL.revokeObjectURL(localBlobUrl)
          return
        }

        setState({
          loading: false,
          error: '',
          mode: previewMeta.mode,
          textContent: '',
          blobUrl: localBlobUrl,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error && error.message
            ? error.message
            : (intl.get('dipChatKit.archivePreviewLoadFailed').d('归档文件加载失败') as string)

        if (disposed) return
        if (localBlobUrl) {
          URL.revokeObjectURL(localBlobUrl)
          localBlobUrl = ''
        }
        setState({
          loading: false,
          error: errorMessage,
          mode: previewMeta.mode,
          textContent: '',
          blobUrl: '',
        })
      }
    }

    void loadPreview()

    return () => {
      disposed = true
      if (localBlobUrl) {
        URL.revokeObjectURL(localBlobUrl)
      }
    }
  }, [previewMeta])

  useEffect(() => {
    if (state.mode !== 'html') {
      setHtmlFrameHeight(0)
      clearHtmlLoadTimers()
      clearHtmlResizeObserver()
    }
  }, [clearHtmlLoadTimers, clearHtmlResizeObserver, state.mode])

  useEffect(() => {
    return () => {
      clearHtmlLoadTimers()
      clearHtmlResizeObserver()
    }
  }, [clearHtmlLoadTimers, clearHtmlResizeObserver])

  const handleDownload = async () => {
    if (!previewMeta) return

    setDownloading(true)
    try {
      const response = await getSessionArchiveSubpath(previewMeta.sessionKey, previewMeta.subpath, {
        responseType: 'arraybuffer',
      })
      if (!(response instanceof ArrayBuffer)) {
        throw new Error(
          intl.get('dipChatKit.archiveFileTypeMismatch').d('归档文件返回类型异常') as string,
        )
      }

      const blob = new Blob([response], {
        type: getBlobMimeType(previewMeta.mode, previewMeta.fileName),
      })
      const blobUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = blobUrl
      anchor.download = previewMeta.fileName
      anchor.style.display = 'none'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : (intl.get('dipChatKit.archivePreviewLoadFailed').d('归档文件加载失败') as string)
      message.error(errorMessage)
    } finally {
      setDownloading(false)
    }
  }

  const tabOptions = useMemo(
    () => [
      {
        label: intl.get('dipChatKit.artifactTabPreview').d('预览') as string,
        value: 'preview',
      },
      {
        label: intl.get('dipChatKit.artifactTabCode').d('代码') as string,
        value: 'code',
        disabled: !canSwitchCodeTab,
      },
    ],
    [canSwitchCodeTab],
  )

  const renderBody = () => {
    if (state.loading) {
      return (
        <div className={styles.previewSkeletonWrap}>
          <div className={styles.previewSkeletonCard}>
            <Skeleton
              active
              title={{ width: '42%' }}
              paragraph={{
                rows: 10,
                width: ['96%', '88%', '100%', '93%', '86%', '98%', '91%', '84%', '95%', '78%'],
              }}
            />
          </div>
        </div>
      )
    }

    if (state.error) {
      return <div className={styles.errorText}>{state.error}</div>
    }

    if (activeTab === 'code' && canSwitchCodeTab) {
      const codeLang =
        state.mode === 'html' ? 'html' : state.mode === 'markdown' ? 'markdown' : 'text'
      return (
        <div className={styles.codeWrap}>
          <CodeHighlighter lang={codeLang}>{state.textContent}</CodeHighlighter>
        </div>
      )
    }

    if (state.mode === 'markdown') {
      return (
        <div className={styles.markdownWrap}>
          <PreviewMarkdown content={state.textContent} />
        </div>
      )
    }

    if (state.mode === 'html') {
      return (
        <div className={styles.htmlFrameWrap}>
          <iframe
            ref={htmlFrameRef}
            className={styles.htmlFrame}
            style={{ height: `${Math.max(680, htmlFrameHeight)}px` }}
            title={payload.title || previewMeta?.fileName || 'artifact-html-preview'}
            srcDoc={htmlSrcDoc}
            scrolling="no"
            onLoad={() => {
              clearHtmlLoadTimers()
              syncHtmlFrameHeight()
              bindHtmlResizeObserver()
              htmlLoadTimerRef.current.push(window.setTimeout(syncHtmlFrameHeight, 60))
              htmlLoadTimerRef.current.push(window.setTimeout(syncHtmlFrameHeight, 240))
            }}
          />
        </div>
      )
    }

    if (state.mode === 'image') {
      return (
        <img
          className={styles.imagePreview}
          src={state.blobUrl}
          alt={
            previewMeta?.fileName || (intl.get('dipChatKit.artifactImage').d('归档图片') as string)
          }
        />
      )
    }

    if (state.mode === 'pdf') {
      return (
        <iframe
          className={styles.pdfFrame}
          title={payload.title || previewMeta?.fileName || 'artifact-pdf-preview'}
          src={state.blobUrl}
        />
      )
    }

    return (
      <div className={styles.codeWrap}>
        <CodeHighlighter lang="text">{state.textContent}</CodeHighlighter>
      </div>
    )
  }

  const fileName = previewMeta?.fileName || ''
  const fullscreenTitle = fullscreen
    ? (intl.get('dipChatKit.exitFullscreenPreview').d('退出全屏') as string)
    : (intl.get('dipChatKit.fullscreenPreview').d('全屏预览') as string)

  return (
    <div className={clsx('PreviewArtifact', styles.root)}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Avatar className={styles.fileAvatar} size={24}>
            {resolveFileInitial(fileName)}
          </Avatar>
          <Tooltip title={fileName}>
            <span className={styles.fileName}>{fileName}</span>
          </Tooltip>
        </div>
        <div className={styles.headerCenter}>
          <Segmented
            size="small"
            value={activeTab}
            options={tabOptions}
            onChange={(value) => {
              setActiveTab(value as ArtifactPreviewTab)
            }}
          />
        </div>
        <div className={styles.headerRight}>
          <Tooltip title={intl.get('dipChatKit.artifactDownload').d('下载文件')}>
            <Button
              type="text"
              aria-label={intl.get('dipChatKit.artifactDownload').d('下载文件') as string}
              icon={<DownloadOutlined />}
              loading={downloading}
              onClick={() => {
                void handleDownload()
              }}
            />
          </Tooltip>
          <Tooltip title={fullscreenTitle}>
            <Button
              type="text"
              aria-label={fullscreenTitle}
              icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={onToggleFullscreen}
            />
          </Tooltip>
          <Tooltip title={intl.get('dipChatKit.closePreview').d('关闭预览')}>
            <Button
              type="text"
              aria-label={intl.get('dipChatKit.closePreview').d('关闭预览') as string}
              icon={<CloseOutlined />}
              onClick={onClose}
            />
          </Tooltip>
        </div>
      </div>
      <div className={styles.body}>
        <ScrollContainer className={styles.bodyScroll}>{renderBody()}</ScrollContainer>
      </div>
    </div>
  )
}

export default PreviewArtifact
