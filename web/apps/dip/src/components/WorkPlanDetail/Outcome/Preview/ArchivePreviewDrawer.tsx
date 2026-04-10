import type { DrawerProps } from 'antd'
import { Drawer } from 'antd'
import Empty from '@/components/Empty'
import ArchivePreviewPanel from './ArchivePreviewPanel'
import type { ArchivePreviewState } from './useArchivePreview'

export type ArchivePreviewDrawerProps = Pick<
  DrawerProps,
  'open' | 'size' | 'placement' | 'getContainer'
> & {
  preview: ArchivePreviewState | null
  onClose: () => void
  onDownload?: () => Promise<void> | void
  showInlineDownload?: boolean
  isPreviewFullscreen?: boolean
  onEnterPreviewFullscreen?: () => void
  onExitPreviewFullscreen?: () => void
}

const ArchivePreviewDrawer = ({
  open,
  preview,
  onClose,
  onDownload,
  showInlineDownload,
  isPreviewFullscreen = false,
  onEnterPreviewFullscreen,
  onExitPreviewFullscreen,
  ...restProps
}: ArchivePreviewDrawerProps) => {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      closable={false}
      mask={{ closable: true }}
      destroyOnHidden
      styles={{ body: { padding: 0, overflow: 'hidden' } }}
      rootStyle={{ position: 'absolute' }}
      size="100%"
      {...restProps}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[--dip-white]">
        {preview ? (
          <ArchivePreviewPanel
            preview={preview}
            showHeader
            onClose={onClose}
            onDownload={onDownload}
            showInlineDownload={showInlineDownload}
            isPreviewFullscreen={isPreviewFullscreen}
            onEnterPreviewFullscreen={onEnterPreviewFullscreen}
            onExitPreviewFullscreen={onExitPreviewFullscreen}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6">
            <Empty title="暂无预览内容" />
          </div>
        )}
      </div>
    </Drawer>
  )
}

export default ArchivePreviewDrawer
