import { ReactNode } from 'react'
import styles from './styles.module.less'

interface ILabelTitle {
    label: string | ReactNode
}
const LabelTitle = ({ label }: ILabelTitle) => {
    return (
        <div className={styles.labelTitleWrapper}>
            <span className={styles.labelLine} />
            <span>{label}</span>
        </div>
    )
}

export default LabelTitle
