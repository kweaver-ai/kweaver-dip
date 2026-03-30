import { memo, ReactNode } from 'react'
import styles from './styles.module.less'

interface ITips {
    // 图标
    icon?: ReactNode

    // 提示语
    message: string
}

function Tips({ icon, message }: ITips) {
    return (
        <div className={styles.tips_wrapper}>
            {icon}
            <div className={styles.qa_tips}>{message}</div>
        </div>
    )
}

export default memo(Tips)
