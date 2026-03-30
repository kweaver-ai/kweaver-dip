import React, { memo, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Tabs } from 'antd'
import styles from './styles.module.less'
import __ from './locale'
import { SharingTab } from './const'
import ResourceTable from './ResourceTable'
import { ResourceShareProvider } from './ResourceShareProvider'
import { useQuery } from '@/utils'

/**
 * 共享管理
 */
const ResourceSharing = () => {
    const { pathname } = useLocation()
    const navigate = useNavigate()
    const query = useQuery()
    const tab = query.get('tab') || SharingTab.ToReviewed

    const handleTabChange = (key) => {
        navigate(`/dataService/resourceSharing/audit?tab=${key}`)
    }

    const items: any[] = [
        {
            title: __('资源申请'),
            key: SharingTab.Apply,
            path: '/apply',
            children: '',
        },
        {
            title: __('资源订阅'),
            key: SharingTab.Subscribe,
            path: '/subscribe',
            children: '',
        },
        {
            title: __('共享申请列表'),
            key: SharingTab.Processed,
            path: '/processed',
            children: '',
        },
        {
            title: __('资源审核'),
            label: __('待审核'),
            key: SharingTab.ToReviewed,
            path: '/audit',
            children: '',
        },
        {
            title: __('资源审核'),
            label: __('已审核'),
            key: SharingTab.Reviewed,
            path: '/audit',
            children: '',
        },
    ]

    const current = useMemo(() => {
        if (pathname.endsWith('/audit')) {
            return items.find((item) => item.key === tab)
        }
        return items.find((item) => pathname.endsWith(item.path)) || items[0]
    }, [pathname, tab])

    return (
        <ResourceShareProvider>
            <div className={styles.resourceSharing}>
                <div className={styles['resourceSharing-title']}>
                    {current.title}
                </div>
                {[SharingTab.Reviewed, SharingTab.ToReviewed].includes(
                    current.key,
                ) && (
                    <Tabs
                        defaultActiveKey={SharingTab.Apply}
                        activeKey={tab}
                        onChange={handleTabChange}
                        items={items.slice(-2)}
                        className={styles['resourceSharing-tabs']}
                    />
                )}
                <ResourceTable tab={current.key} />
            </div>
        </ResourceShareProvider>
    )
}

export default memo(ResourceSharing)
