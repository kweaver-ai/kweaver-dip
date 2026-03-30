import React, { useContext } from 'react'
import { Divider, Form, Tabs, TabsProps } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import __ from './locale'
import styles from './styles.module.less'
import { MicroWidgetPropsContext } from '@/context'
import { isMicroWidget } from '@/core'
import GlobalMenu from '@/components/GlobalMenu'

interface IReturn {
    onReturn: () => void
    title: string
    isShowMenu?: boolean
}
const Return: React.FC<IReturn> = ({ onReturn, title, isShowMenu = true }) => {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    return (
        <div className={styles['return-wrapper']}>
            {isMicroWidget({ microWidgetProps }) ? null : isShowMenu ? (
                <GlobalMenu />
            ) : null}
            <div onClick={onReturn} className={styles['return-info']}>
                <LeftOutlined className={styles.arrow} />
                <span className={styles.text}>{__('返回')}</span>
            </div>
            <Divider className={styles.divider} type="vertical" />
            <div className={styles.title} title={title}>
                {title}
            </div>
        </div>
    )
}
export default Return
