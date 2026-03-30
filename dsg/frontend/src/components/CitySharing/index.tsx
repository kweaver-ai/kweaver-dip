import React, { memo, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Tabs } from 'antd'
import styles from './styles.module.less'
import __ from './locale'
import { leftMenuItems, SharingTab } from './const'
import ShareApplyTable from './ShareApplyTable'
import ImplementDataTable from './ImplementDataTable'
import { useQuery } from '@/utils'

/**
 * 本市州共享申请
 */
const CitySharing = () => {
    const { pathname } = useLocation()
    const navigate = useNavigate()
    const query = useQuery()
    // const tab = query.get('tab') || SharingTab.ToReviewed

    // const handleTabChange = (key) => {
    //     navigate(`/dataService/citySharing/audit?tab=${key}`)
    // }

    const current = useMemo(() => {
        // if (pathname.endsWith('/audit')) {
        //     return items.find((item) => item.key === tab)
        // }
        return (
            leftMenuItems.find((item) => pathname.endsWith(item.path)) ||
            leftMenuItems[0]
        )
    }, [pathname])

    return (
        <div className={styles.citySharing}>
            {/* <div className={styles['citySharing-title']}>{current.title}</div> */}
            {/* {[SharingTab.Reviewed, SharingTab.ToReviewed].includes(
                    current.key,
                ) && (
                    <Tabs
                        defaultActiveKey={SharingTab.Apply}
                        activeKey={tab}
                        onChange={handleTabChange}
                        items={items.slice(-2)}
                        className={styles['resourceSharing-tabs']}
                    />
                )} */}
            {current.key === SharingTab.ImplementData ? (
                <ImplementDataTable />
            ) : (
                <ShareApplyTable tab={current.key} />
            )}
        </div>
    )
}

export default memo(CitySharing)
