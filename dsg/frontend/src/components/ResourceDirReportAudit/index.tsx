import { Tabs } from 'antd'
import { useEffect, useState } from 'react'
import { useQuery } from '@/utils'
import __ from './locale'
import styles from './styles.module.less'
import DirReportAuditTable from './DirReportAuditTable'
import { AuditType } from './const'

const ResourceDirReportAudit = () => {
    const query = useQuery()
    const tabKey = query.get('tabKey') || ''

    const [activeKey, setActiveKey] = useState<AuditType>(AuditType.Tasks)

    useEffect(() => {
        if (tabKey && tabKey !== 'undefined') {
            setActiveKey(tabKey as AuditType)
        }
    }, [tabKey])

    const handleTabChange = (key) => {
        setActiveKey(key)
    }

    const tabItemsData = [
        {
            label: __('待审核'),
            title: __('待审核'),
            key: AuditType.Tasks,
            children: <DirReportAuditTable type={AuditType.Tasks} />,
        },
        {
            label: __('已审核'),
            title: __('已审核'),
            key: AuditType.Historys,
            children: <DirReportAuditTable type={AuditType.Historys} />,
        },
    ]

    return (
        <div className={styles['dir-report-audit']}>
            <Tabs
                activeKey={activeKey}
                onChange={handleTabChange}
                items={tabItemsData}
                className={styles['dir-report-audit-tabs']}
            />
        </div>
    )
}

export default ResourceDirReportAudit
