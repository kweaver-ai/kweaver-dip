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
 * 接入IP
 */
export const IpView: React.FC<{ record: any }> = ({ record }) => {
    const raw = record?.call_host_and_port
    if (typeof raw !== 'string' || !raw.trim()) {
        return '--'
    }

    const ipList = raw
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s)

    if (ipList.length === 0) {
        return '--'
    }

    const firstIp = ipList[0]
    const remainingCount = ipList.length - 1

    // 生成剩余IP列表的Popover内容
    const renderPopoverContent = () => {
        const remainingIps = ipList.slice(1)
        return (
            <div className={styles.ipPopoverContent}>
                {remainingIps.map((item: any, index: number) => (
                    <div key={index} className={styles.ipPopoverItem}>
                        {item}
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className={styles.ipViewWrapper}>
            <div className={styles.firstIp} title={firstIp}>
                {firstIp}
            </div>
            {remainingCount > 0 && (
                <Popover
                    content={renderPopoverContent()}
                    trigger="hover"
                    placement="topLeft"
                >
                    <div className={styles.moreTag}>+{remainingCount}</div>
                </Popover>
            )}
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

// 将期望完成时间、创建时间调整为时间戳
export const timeStrToTimestamp = (searchObj: any) => {
    const obj: any = {}
    const timeFields = ['start_time', 'end_time']
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const key in searchObj) {
        if (Object.prototype.hasOwnProperty.call(searchObj, key)) {
            obj[key] = searchObj[key]
                ? timeFields.includes(key)
                    ? moment(searchObj[key]).valueOf()
                    : searchObj[key]
                : undefined
        }
    }
    return obj
}
