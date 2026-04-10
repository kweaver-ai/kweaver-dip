import { Tooltip } from 'antd'
import clsx from 'clsx'
import type React from 'react'
import intl from 'react-intl-universal'
import IconFont from '@/components/IconFont'
import styles from './index.module.less'
import type { DipChatHeaderProps } from './types'

const DipChatHeader: React.FC<DipChatHeaderProps> = ({ title, digitalHumanName }) => {
  const digitalHumanLabel = intl.get('dipChatKit.digitalHumanLabel').d('数字员工') as string
  const subtitle = `${digitalHumanLabel}：${digitalHumanName || '-'}`

  return (
    <div className={clsx('DipChatHeader', styles.root)}>
      <IconFont type="icon-digital-human" className={styles.titleIcon} />
      <div className={styles.textWrap}>
        <Tooltip title={title} placement="right">
          <span className={styles.titleText}>{title}</span>
        </Tooltip>
        <Tooltip title={subtitle} placement="right">
          <div className={styles.subtitleText}>{subtitle}</div>
        </Tooltip>
      </div>
    </div>
  )
}

export default DipChatHeader
