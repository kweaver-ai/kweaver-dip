import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import { downloadApiFile } from './helper'

function Header() {
    return (
        <div className={styles.headerWrapper}>
            <div
                className={styles.downloadButton}
                onClick={() => downloadApiFile()}
            >
                <FontIcon name="icon-xiazai" className={styles.icon} />
                <span>API 管理</span>
            </div>
        </div>
    )
}

export default Header
