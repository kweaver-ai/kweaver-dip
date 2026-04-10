import { CompressOutlined, ExpandOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
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
  /** 是否展开，默认不展开 */
  expand?: boolean
  /** 当前是否处于全屏预览（抽屉）内 */
  isPreviewFullscreen?: boolean
  /** 进入全屏预览 */
  onEnterPreviewFullscreen?: () => void
  /** 退出全屏预览 */
  onExitPreviewFullscreen?: () => void
}

const ArchivePreviewNav = ({
  title,
  onClose,
  onDownload,
  closable = true,
  className,
  isPreviewFullscreen = false,
  onEnterPreviewFullscreen,
  onExitPreviewFullscreen,
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
      <Tooltip title="下载">
        <Button
          type="text"
          icon={<IconFont type="icon-xiazai" />}
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
        />
      </Tooltip>
      {onEnterPreviewFullscreen || onExitPreviewFullscreen ? (
        <Tooltip title={isPreviewFullscreen ? '退出全屏预览' : '进入全屏预览'}>
          <Button
            type="text"
            icon={isPreviewFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
            onClick={() => {
              if (isPreviewFullscreen) {
                onExitPreviewFullscreen?.()
              } else {
                onEnterPreviewFullscreen?.()
              }
            }}
          />
        </Tooltip>
      ) : null}
      <div className="h-4 w-px bg-[--dip-border-color]" />
      {closable ? (
        <Tooltip title="关闭预览">
          <Button type="text" icon={<IconFont type="icon-close" />} onClick={() => onClose?.()} />
        </Tooltip>
      ) : null}
    </div>
  )
}

export default ArchivePreviewNav
