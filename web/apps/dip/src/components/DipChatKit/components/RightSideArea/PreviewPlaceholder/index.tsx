import clsx from 'clsx'
import type React from 'react'
import intl from 'react-intl-universal'
import styles from './index.module.less'
import type { PreviewPlaceholderProps } from './types'

const PreviewPlaceholder: React.FC<PreviewPlaceholderProps> = ({ content }) => {
  return (
    <p className={clsx('PreviewPlaceholder', styles.root)}>
      {content ||
        (intl
          .get('dipChatKit.previewPlaceholder')
          .d('后续会在这里承载回答卡片联动的详细预览内容。') as string)}
    </p>
  )
}

export default PreviewPlaceholder
