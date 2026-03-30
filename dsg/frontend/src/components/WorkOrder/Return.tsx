import { LeftOutlined } from '@ant-design/icons'
import { Divider } from 'antd'
import React from 'react'
import styles from './styles.module.less'
import __ from './locale'

interface IReturn {
    onReturn: () => void
    title: React.ReactNode
}
const Return: React.FC<IReturn> = ({ onReturn, title }) => {
    return (
        <div className={styles['return-wrapper']}>
            <div onClick={onReturn} className={styles['return-info']}>
                <LeftOutlined className={styles.arrow} />
                <span className={styles.text}>{__('返回')}</span>
            </div>
            <Divider className={styles.divider} type="vertical" />
            <div
                className={styles.title}
                title={typeof title === 'string' ? title : undefined}
            >
                {title}
            </div>
        </div>
    )
}
export default Return
