import XMarkdown from '@ant-design/x-markdown'
import { Spin } from 'antd'
import classNames from 'classnames'
import '@ant-design/x-markdown/dist/x-markdown.css'
import Empty from '@/components/Empty'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import styles from './ArchivePreviewPanel.module.less'
import type { ArchivePreviewState } from './useArchivePreview'

export type ArchivePreviewPanelProps = {
  preview: ArchivePreviewState
  /** 内容区外层额外 class */
  className?: string
}

const ArchivePreviewPanel = ({ preview, className }: ArchivePreviewPanelProps) => {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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
        ) : preview.body === '' ? (
          <div className="flex min-h-[200px] flex-1 items-center justify-center py-10">
            <Empty title="暂无预览内容" />
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
            <a
              href={preview.blobUrl}
              download={preview.title}
              className="inline-flex w-fit items-center rounded-md border border-[--dip-border-color] bg-[--dip-white] px-4 py-2 text-[--dip-text-color] transition-colors hover:bg-[--dip-hover-bg-color]"
            >
              下载文件
            </a>
          </div>
        ) : preview.viewer === 'download' && preview.blobUrl ? (
          <div className="flex flex-col gap-4 text-sm text-[--dip-text-color]">
            <p className="m-0 text-[var(--dip-text-color-65)]">
              该文件类型暂不支持在线预览，请下载后使用对应软件打开。
            </p>
            <a
              href={preview.blobUrl}
              download={preview.title}
              className="inline-flex w-fit items-center rounded-md border border-[--dip-border-color] bg-[--dip-white] px-4 py-2 text-[--dip-text-color] transition-colors hover:text-[--dip-primary-color]"
            >
              下载文件
            </a>
          </div>
        ) : preview.viewer === 'markdown' ? (
          <XMarkdown className={styles.markdownRoot}>{preview.body}</XMarkdown>
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
