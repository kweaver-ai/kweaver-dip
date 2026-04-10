import classNames from 'classnames'
import type { ReactNode } from 'react'
import type { LoginBoxLocationType, LoginBoxStyleType } from '@/apis'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import Content from '../Content'
import Footer from '../Footer'
import Header from '../Header'
import styles from './index.module.less'

interface RegularTemplateProps {
  header?: ReactNode
  content?: ReactNode
  footer?: ReactNode
  about?: ReactNode
  background?: string
  fontStyle?: 'dark' | 'light'
  loginBoxLocation?: LoginBoxLocationType | string
  loginBoxStyle?: LoginBoxStyleType | string
  className?: string
  iframeHeight?: number
}

const RegularTemplate = ({
  header = <Header />,
  content,
  footer = <Footer />,
  about,
  background,
  fontStyle = 'dark',
  loginBoxLocation = 'right',
  loginBoxStyle = 'white',
  className,
  iframeHeight = 410,
}: RegularTemplateProps) => {
  return (
    <ScrollBarContainer
      className={classNames(styles.container, className)}
      style={{ backgroundImage: background ? `url(${background})` : undefined }}
    >
      <div className={styles.main}>
        <div
          className={classNames(
            styles.index,
            loginBoxLocation === 'center' ? styles['index-center'] : '',
            loginBoxStyle === 'transparent' ? styles['index-transparent'] : '',
          )}
        >
          <div className={styles['header-bar']}>{header}</div>
          <div className={styles.login}>
            {content || <Content iframeHeight={iframeHeight} width={420} />}
          </div>
          <div className={styles.footer}>{footer}</div>
        </div>
        <div className={fontStyle === 'light' ? styles.mask : ''} />
      </div>
      <div className={classNames(styles.about, fontStyle === 'light' ? styles.font : '')}>
        {about}
      </div>
    </ScrollBarContainer>
  )
}

export default RegularTemplate
