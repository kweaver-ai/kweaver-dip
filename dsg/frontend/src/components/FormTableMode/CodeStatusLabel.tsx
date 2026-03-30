import { FC } from 'react'
import { CodeStatus } from './const'
import __ from './locale'
import styles from './styles.module.less'

/**
 * 标签状态
 */
interface ICodeStatusLabel {
    // 状态
    status: CodeStatus
}
const CodeStatusLabel: FC<ICodeStatusLabel> = ({ status }) => {
    if (status === CodeStatus.Deleted) {
        return <div className={styles.quoteDeletedStatus}>{__('已删除')} </div>
    }
    if (status === CodeStatus.Disabled) {
        return <div className={styles.quoteDisableStatus}>{__('已停用')} </div>
    }
    return null
}

export default CodeStatusLabel
