import classNames from 'classnames'
import type { ReactNode } from 'react'

import styles from './index.module.less'

interface DefaultTemplateProps {
  header?: ReactNode
  content?: ReactNode
  footer?: ReactNode
  about?: ReactNode
  background?: string
  loginHeight?: number | string
  className?: string
}

function DefaultTemplate({
  header,
  content,
  footer,
  about,
  background,
  loginHeight = 410,
  className,
}: DefaultTemplateProps) {
  const height =
    typeof loginHeight === 'number' && loginHeight > 435
      ? `${560 + loginHeight - 435}px`
      : typeof loginHeight === 'string'
        ? loginHeight
        : '560px'

  return (
    <div className={classNames(styles.container, className)}>
      <div
        className={styles['background-container']}
        style={{ backgroundImage: background ? `url(${background})` : undefined }}
      />
      <div className={styles.wrapper} style={{ height }}>
        <div className={styles.oem} style={{ height }}>
          <div
            className={styles['oem-img']}
            style={{
              backgroundImage: background ? `url(${background})` : undefined,
              height,
              backgroundSize: `440px ${height}`,
            }}
          />
        </div>
        <div className={styles.index} style={{ height }}>
          <div className={styles['wrap-header-bar']}>{header}</div>
          <div className={styles['wrap-login']}>{content}</div>
          <div className={styles['wrap-footer']}>
            {footer}
            <div className={styles.split} />
            {about}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DefaultTemplate
