import * as React from 'react'
import styles from './styles.module.less'

interface FormTitleType {
    title: string
}

const FormTitle = ({ title }: FormTitleType) => {
    return (
        <div className={styles.titleBarBody}>
            <div className={styles.titleBarContent}>{title}</div>
        </div>
    )
}

export default FormTitle
