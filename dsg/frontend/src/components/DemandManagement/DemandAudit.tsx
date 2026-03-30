import { Tabs } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ProvinceDemandAuditList from './Province/AuditList'
import __ from './locale'
import styles from './styles.module.less'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

// 需求大厅
const DemandAudit = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [activityKey, setActiveKey] = useState('1')
    const [config] = useGeneralConfig()

    useEffect(() => {
        const isProvince = searchParams.get('isProvince')
        if (isProvince) {
            setActiveKey('2')
        }
    }, [])

    return (
        <div className={styles['demand-list-wrapper']}>
            {config.governmentSwitch.on ? (
                <>
                    <div className={styles.title}>{__('需求审核')}</div>
                    <Tabs
                        defaultActiveKey="1"
                        activeKey={activityKey}
                        onChange={(e) => setActiveKey(e)}
                        destroyInactiveTabPane
                        items={[
                            {
                                label: __('本市州需求'),
                                key: '1',
                                children: <div />,
                            },
                            {
                                label: __('省级需求'),
                                key: '2',
                                children: <ProvinceDemandAuditList />,
                            },
                        ]}
                    />
                </>
            ) : (
                <div />
            )}
        </div>
    )
}

export default DemandAudit
