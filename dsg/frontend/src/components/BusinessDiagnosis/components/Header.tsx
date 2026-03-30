import { ReactNode } from 'react'
import { LeftOutlined } from '@ant-design/icons'
import styles from '../styles.module.less'
import __ from '../locale'
import GlobalMenu from '../../GlobalMenu'

interface Iheader {
    back: () => void
    backText?: string
    leftContent?: ReactNode | string
    rightContent?: ReactNode | string
    showGlobalMenu?: boolean
}
const Header = (params: Iheader) => {
    const {
        back,
        backText = __('返回'),
        leftContent,
        rightContent,
        showGlobalMenu = true,
    } = params
    return (
        <div className={styles.headerWrapper}>
            <div className={styles.left}>
                {showGlobalMenu && <GlobalMenu />}
                <span className={styles['left-back']} onClick={back}>
                    <LeftOutlined className={styles.returnArrow} />
                    <span className={styles.returnText}>{backText}</span>
                </span>
                <div className={styles.divider} />
                {leftContent}
            </div>
            <div className={styles.rightBox}>{rightContent}</div>
        </div>
    )
}

export default Header
