import React from 'react'
import styles from './styles.module.less'

interface ICommonTitle {
    title: string
}
const CommonTitle: React.FC<ICommonTitle> = ({ title }) => {
    return (
        <div className={styles['common-title-wrapper']}>
            <div className={styles['common-title-line']} />
            <div className={styles['common-title']}>{title}</div>
        </div>
    )
}
export default CommonTitle
