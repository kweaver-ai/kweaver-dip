import { CloseOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import clsx from 'clsx'
import type React from 'react'
import intl from 'react-intl-universal'
import PreviewCode from './PreviewCode'
import PreviewMarkdown from './PreviewMarkdown'
import PreviewMermaid from './PreviewMermaid'
import PreviewPlaceholder from './PreviewPlaceholder'
import styles from './index.module.less'
import type { RightSideAreaProps } from './types'

const RightSideArea: React.FC<RightSideAreaProps> = ({ visible, payload, onClose }) => {
  const renderPreviewContent = () => {
    if (!payload?.content) {
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

  return (
    <div className={clsx('RightSideArea', styles.root)}>
      <div className={styles.header}>
        <span className={styles.title}>{intl.get('dipChatKit.previewAreaTitle').d('预览区')}</span>
        <Tooltip title={intl.get('dipChatKit.closePreview').d('关闭预览')}>
          <Button
            type="text"
            aria-label={intl.get('dipChatKit.closePreview').d('关闭预览') as string}
            icon={<CloseOutlined />}
            onClick={onClose}
            disabled={!visible}
          />
        </Tooltip>
      </div>
      <div className={styles.content}>
        <div className={styles.placeholderCard}>
          <div className={styles.placeholderTitle}>
            {payload?.title ||
              (intl
                .get('dipChatKit.rightSideAreaPlaceholderTitle')
                .d('RightSideArea 占位区域') as string)}
          </div>
          {renderPreviewContent()}
        </div>
      </div>
    </div>
  )
}

export default RightSideArea
