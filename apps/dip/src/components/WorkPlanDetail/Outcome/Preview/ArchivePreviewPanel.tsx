import { CodeHighlighter } from '@ant-design/x'
import XMarkdown from '@ant-design/x-markdown'
import { Spin } from 'antd'
import classNames from 'classnames'
import '@ant-design/x-markdown/dist/x-markdown.css'
import Empty from '@/components/Empty'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import ArchivePreviewNav from './ArchivePreviewNav'
import styles from './ArchivePreviewPanel.module.less'
import type { ArchivePreviewState } from './useArchivePreview'

export type ArchivePreviewPanelProps = {
  preview: ArchivePreviewState
  showHeader?: boolean
  onClose?: () => void
  onDownload?: () => Promise<void> | void
  closable?: boolean
  showInlineDownload?: boolean
  /** 内容区外层额外 class */
  className?: string
  isPreviewFullscreen?: boolean
  onEnterPreviewFullscreen?: () => void
  onExitPreviewFullscreen?: () => void
}

const HTML_PREVIEW_STYLE_TAG = 'data-workplan-html-preview-style'

const injectHtmlPreviewStyle = (html: string): string => {
  const injectedStyle = `<style ${HTML_PREVIEW_STYLE_TAG}>html,body{overflow:auto!important;margin:0;padding:12px;}body{min-height:100%;box-sizing:border-box;}</style>`
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

const CODE_EXT_TO_LANG: Record<string, string> = {
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  mjs: 'javascript',
  cjs: 'javascript',
  py: 'python',
  go: 'go',
  java: 'java',
  scala: 'scala',
  sql: 'sql',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  json: 'json',
  jsonc: 'json',
  yml: 'yaml',
  yaml: 'yaml',
  xml: 'xml',
  css: 'css',
  less: 'less',
  scss: 'scss',
  sass: 'sass',
  html: 'html',
  htm: 'html',
  md: 'markdown',
  mdx: 'markdown',
  txt: 'text',
  log: 'text',
}

const getFileExt = (fileName: string): string => {
  const i = fileName.lastIndexOf('.')
  return i >= 0 ? fileName.slice(i + 1).toLowerCase() : ''
}

const getCodeLangFromTitle = (title: string): string => {
  const ext = getFileExt(title)
  return CODE_EXT_TO_LANG[ext] || 'text'
}

const isCodeLikeTextFile = (title: string): boolean => {
  const ext = getFileExt(title)
  return Boolean(ext && ext !== 'txt' && ext !== 'log' && ext !== 'md' && ext !== 'mdx')
}

const ArchivePreviewPanel = ({
  preview,
  showHeader = false,
  onClose,
  onDownload,
  closable = true,
  showInlineDownload = true,
  className,
  isPreviewFullscreen = false,
  onEnterPreviewFullscreen,
  onExitPreviewFullscreen,
}: ArchivePreviewPanelProps) => {
  const codeLang = getCodeLangFromTitle(preview.title)

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {showHeader ? (
        <ArchivePreviewNav
          title={preview.title}
          onClose={onClose}
          onDownload={onDownload}
          closable={closable}
          isPreviewFullscreen={isPreviewFullscreen}
          onEnterPreviewFullscreen={onEnterPreviewFullscreen}
          onExitPreviewFullscreen={onExitPreviewFullscreen}
        />
      ) : null}
      <ScrollBarContainer
        className={classNames(
          'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4',
          className,
        )}
      >
        {preview.loading ? (
          <div className="flex min-h-[200px] flex-1 items-center justify-center py-10">
            <Spin />
          </div>
        ) : preview.error ? (
          <div className="flex min-h-[200px] flex-1 items-center justify-center py-10">
            <Empty type="failed" title="预览失败" desc={preview.error} />
          </div>
        ) : preview.viewer === 'pdf' && preview.blobUrl ? (
          <iframe
            title={preview.title}
            src={preview.blobUrl}
            className="min-h-[min(480px,60vh)] w-full shrink-0 rounded-md border border-[--dip-border-color]"
          />
        ) : preview.viewer === 'image' && preview.blobUrl ? (
          <div className="flex w-full justify-center py-2">
            <img src={preview.blobUrl} alt={preview.title} className="max-w-full object-contain" />
          </div>
        ) : preview.viewer === 'video' && preview.blobUrl ? (
          <>
            {/* biome-ignore lint/a11y/useMediaCaption: 归档文件预览，通常无字幕轨 */}
            <video
              controls
              src={preview.blobUrl}
              className="max-h-[min(480px,60vh)] w-full shrink-0 rounded-md bg-black"
            />
          </>
        ) : preview.viewer === 'audio' && preview.blobUrl ? (
          <div className="flex flex-col justify-center gap-4 py-2">
            {/* biome-ignore lint/a11y/useMediaCaption: 归档文件预览，通常无字幕轨 */}
            <audio controls src={preview.blobUrl} className="w-full" />
          </div>
        ) : preview.viewer === 'office' && preview.blobUrl ? (
          <div className="flex flex-col gap-4 text-sm text-[--dip-text-color]">
            <p className="m-0 text-[var(--dip-text-color-65)]">
              Office 文档（Word / Excel / PowerPoint
              等）无法在浏览器内直接预览，请下载后使用本地应用打开。
            </p>
            {showInlineDownload ? (
              <a
                href={preview.blobUrl}
                download={preview.title}
                className="inline-flex w-fit items-center rounded-md border border-[--dip-border-color] bg-[--dip-white] px-4 py-2 text-[--dip-text-color] transition-colors hover:bg-[--dip-hover-bg-color]"
              >
                下载文件
              </a>
            ) : null}
          </div>
        ) : preview.viewer === 'download' && preview.blobUrl ? (
          <div className="flex flex-col gap-4 text-sm text-[--dip-text-color]">
            <p className="m-0 text-[var(--dip-text-color-65)]">
              该文件类型暂不支持在线预览，请下载后使用对应软件打开。
            </p>
            {showInlineDownload ? (
              <a
                href={preview.blobUrl}
                download={preview.title}
                className="inline-flex w-fit items-center rounded-md border border-[--dip-border-color] bg-[--dip-white] px-4 py-2 text-[--dip-text-color] transition-colors hover:text-[--dip-primary-color]"
              >
                下载文件
              </a>
            ) : null}
          </div>
        ) : preview.viewer === 'html' && preview.body.trim() ? (
          <iframe
            title={preview.title}
            srcDoc={injectHtmlPreviewStyle(preview.body)}
            className="min-h-[min(520px,68vh)] w-full shrink-0 rounded-md border border-[--dip-border-color] bg-[--dip-white]"
          />
        ) : preview.viewer === 'markdown' && preview.body.trim() ? (
          <XMarkdown className={styles.markdownRoot}>{preview.body}</XMarkdown>
        ) : preview.viewer === 'text' &&
          preview.body.trim() &&
          isCodeLikeTextFile(preview.title) ? (
          <div className="overflow-hidden rounded-md border border-[--dip-border-color]">
            <CodeHighlighter lang={codeLang}>{preview.body}</CodeHighlighter>
          </div>
        ) : preview.body === '' ? (
          <div className="flex min-h-[200px] flex-1 items-center justify-center py-10">
            <Empty title="暂无预览内容" />
          </div>
        ) : (
          <pre className="m-0 whitespace-pre-wrap break-words text-[--dip-text-color]">
            {preview.body}
          </pre>
        )}
      </ScrollBarContainer>
    </div>
  )
}

export default ArchivePreviewPanel
