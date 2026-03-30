import { Tabs } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import __ from '../locale'
import ShareApplyTable from '@/components/CitySharing/ShareApplyTable'
// import DataAnalysisApplyTable from '@/components/DataAnalysis/ApplyTable'
import styles from '../styles.module.less'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface MyApplicationProps {
    subTabKey?: string
}
const MyApplication = ({ subTabKey }: MyApplicationProps) => {
    const { checkPermission } = useUserPermCtx()
    const [activeKey, setActiveKey] = useState(subTabKey)

    const items = useMemo(() => {
        const menu: any[] = []
        if (checkPermission('initiateSharedApplication')) {
            menu.push({
                key: 'GXSQ',
                label: __('共享申请'),
                children: <ShareApplyTable tab="apply" isPersonalCenter />,
            })
        }
        // if (checkPermission('initiateDataAnalysisDemand')) {
        //     menu.push({
        //         key: 'SJFX',
        //         label: __('数据分析'),
        //         children: (
        //             <DataAnalysisApplyTable tab="apply" isPersonalCenter />
        //         ),
        //     })
        // }

        return menu
    }, [checkPermission])

    useEffect(() => {
        if (subTabKey) {
            setActiveKey(subTabKey)
        } else {
            setActiveKey(items[0]?.key)
        }
    }, [items, subTabKey])

    return (
        <Tabs
            items={items}
            className={styles.myApplysWrapper}
            activeKey={activeKey}
            onChange={setActiveKey}
        />
    )
}

export default MyApplication
