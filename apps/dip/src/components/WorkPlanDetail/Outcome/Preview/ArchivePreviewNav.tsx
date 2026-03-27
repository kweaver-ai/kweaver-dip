import { Button } from 'antd'
import classNames from 'classnames'
import { useState } from 'react'
import IconFont from '@/components/IconFont'

export type ArchivePreviewNavProps = {
  title: string
  onClose?: () => void
  onDownload?: () => Promise<void> | void
  /** 是否展示关闭按钮，默认展示 */
  closable?: boolean
  className?: string
}

const ArchivePreviewNav = ({
  title,
  onClose,
  onDownload,
  closable = true,
  className,
}: ArchivePreviewNavProps) => {
  const [downloading, setDownloading] = useState(false)

  return (
    <div
      className={classNames(
        'flex h-[61px] shrink-0 items-center justify-between gap-2 border-b border-[--dip-border-color] px-4',
        className,
      )}
    >
      <span className="min-w-0 flex-1 truncate text-base" title={title}>
        {title}
      </span>
      <Button
        disabled={!onDownload || downloading}
        onClick={async () => {
          if (!onDownload || downloading) return
          setDownloading(true)
          try {
            await onDownload()
          } finally {
            setDownloading(false)
          }
        }}
      >
        下载
      </Button>
      {closable ? (
        <button
          type="button"
          aria-label="关闭预览"
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-[var(--dip-text-color-45)] transition-colors hover:bg-[--dip-hover-bg-color] hover:text-[--dip-text-color]"
          onClick={() => onClose?.()}
        >
          <IconFont type="icon-close" />
        </button>
      ) : null}
    </div>
  )
}

export default ArchivePreviewNav
