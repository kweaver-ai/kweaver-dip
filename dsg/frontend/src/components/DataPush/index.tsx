import React, { memo, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import styles from './styles.module.less'
import __ from './locale'
import ResourceTable from './DataPushTable'
import { DataPushTab } from './const'

/**
 * 数据推送
 */
const DataPush = () => {
    const { pathname } = useLocation()

    const subMenuItems = [
        {
            title: __('数据推送'),
            key: DataPushTab.Manage,
            path: '/dataPush/manage',
            showTitle: true,
            children: '',
        },
        {
            title: __('数据推送监控'),
            key: DataPushTab.Monitor,
            path: '/dataPush/monitor',
            showTitle: false,
            children: '',
        },
        {
            title: __('数据推送审核'),
            key: DataPushTab.Audit,
            path: '/dataPush/audit',
            showTitle: false,
            children: '',
        },
    ]

    const current = useMemo(() => {
        return (
            subMenuItems.find((item) => pathname.endsWith(item.path)) ||
            subMenuItems[0]
        )
    }, [pathname])

    return (
        <div className={styles.dataPush}>
            {current.showTitle && (
                <div className={styles['dataPush-title']}>{current.title}</div>
            )}
            {current.key === DataPushTab.Manage && (
                <ResourceTable menu={DataPushTab.Manage} />
            )}
            {current.key === DataPushTab.Monitor && (
                <ResourceTable menu={DataPushTab.Monitor} />
            )}
            {current.key === DataPushTab.Audit && (
                <ResourceTable menu={DataPushTab.Audit} />
            )}
        </div>
    )
}

export default memo(DataPush)
