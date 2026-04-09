import { CloseOutlined, FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import clsx from 'clsx'
import type React from 'react'
import intl from 'react-intl-universal'
import ScrollContainer from '../ScrollContainer'
import styles from './index.module.less'
import PreviewArtifact from './PreviewArtifact'
import PreviewCode from './PreviewCode'
import PreviewMarkdown from './PreviewMarkdown'
import PreviewMermaid from './PreviewMermaid'
import PreviewPlaceholder from './PreviewPlaceholder'
import type { RightSideAreaProps } from './types'

const RightSideArea: React.FC<RightSideAreaProps> = ({
  visible,
  payload,
  onClose,
  fullscreen,
  onToggleFullscreen,
}) => {
  const renderGenericPreviewBody = () => {
    if (!payload) {
      return <PreviewPlaceholder />
    }

    if (!payload.content) {
      return <PreviewPlaceholder />
    }

    if (payload.sourceType === 'code') {
      return <PreviewCode content={payload.content} />
    }

    if (payload.sourceType === 'mermaid') {
      return <PreviewMermaid content={payload.content} />
    }

    return <PreviewMarkdown content={payload.content} />
  }

  const renderPreviewContent = () => {
    if (!payload) {
      return <PreviewPlaceholder />
    }

    if (payload.sourceType === 'artifact') {
      return (
        <PreviewArtifact
          payload={payload}
          onClose={onClose}
          fullscreen={fullscreen}
          onToggleFullscreen={onToggleFullscreen}
        />
      )
    }

    const previewTitle =
      payload.title.trim() || (intl.get('dipChatKit.previewAreaTitle').d('预览') as string)
    const closeTitle = intl.get('dipChatKit.closePreview').d('关闭预览') as string
    const fullscreenTitle = fullscreen
      ? (intl.get('dipChatKit.exitFullscreenPreview').d('退出全屏') as string)
      : (intl.get('dipChatKit.fullscreenPreview').d('全屏预览') as string)

    return (
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelHeaderLeft}>
            <Tooltip title={previewTitle}>
              <span className={styles.panelTitle}>{previewTitle}</span>
            </Tooltip>
          </div>
          <div className={styles.panelHeaderRight}>
            <Tooltip title={fullscreenTitle}>
              <Button
                type="text"
                aria-label={fullscreenTitle}
                icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={onToggleFullscreen}
              />
            </Tooltip>
            <Tooltip title={closeTitle}>
              <Button
                type="text"
                aria-label={closeTitle}
                icon={<CloseOutlined />}
                onClick={onClose}
              />
            </Tooltip>
          </div>
        </div>
        <div className={styles.panelBody}>
          <ScrollContainer className={styles.panelBodyScroll}>
            {renderGenericPreviewBody()}
          </ScrollContainer>
        </div>
      </div>
    )
  }

  return (
    <div className={clsx('RightSideArea', styles.root)}>
      <div className={styles.content}>
        {!visible ? <PreviewPlaceholder /> : renderPreviewContent()}
      </div>
    </div>
  )
}

export default RightSideArea
