import React from 'react'
import moment from 'moment'
import { Popover } from 'antd'
import { Empty, Loader } from '@/ui'
import { statusMap } from './const'
import dataEmpty from '@/assets/dataEmpty.svg'
import styles from './styles.module.less'
import __ from './locale'

/**
 * 带圆点状态 view
 */
export const StatusView: React.FC<{
    record: any
    tip?: string
}> = ({ record, tip }) => {
    const { text, color } = statusMap[record?.status] || {}
    return (
        <div className={styles.statusView}>
            <div
                className={styles.dot}
                style={{ background: color || 'transparent' }}
            />
            <span className={styles.text}>{text || '--'}</span>
        </div>
    )
}

/**
 * 空数据
 */
export const renderEmpty = (marginTop: number = 36) => (
    <Empty
        iconSrc={dataEmpty}
        desc={__('暂无数据')}
        style={{ marginTop, width: '100%' }}
    />
)

/**
 * 加载中
 */
export const renderLoader = (marginTop: number = 104) => (
    <div style={{ marginTop, width: '100%' }}>
        <Loader />
    </div>
)
