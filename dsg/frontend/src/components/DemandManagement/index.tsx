import { Tabs } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import CityDemandMgtList from './City/DemandMgtList'
import ProvinceDemandMgtList from './Province/DemandMgtList'
import __ from './locale'
import styles from './styles.module.less'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

// 需求处理
const DemandManagement = () => {
    const [searchParams] = useSearchParams()
    const [activityKey, setActiveKey] = useState('1')
    const [config] = useGeneralConfig()

    useEffect(() => {
        const isProvince = searchParams.get('isProvince')
        if (isProvince) {
            setActiveKey('2')
        }
    }, [window.location.pathname])

    return (
        <div className={styles['demand-list-wrapper']}>
            {config.governmentSwitch.on ? (
                <Tabs
                    defaultActiveKey="1"
                    activeKey={activityKey}
                    onChange={(e) => setActiveKey(e)}
                    destroyInactiveTabPane
                    items={[
                        {
                            label: __('本市州需求'),
                            key: '1',
                            children: <CityDemandMgtList />,
                        },
                        {
                            label: __('省级需求'),
                            key: '2',
                            children: <ProvinceDemandMgtList />,
                        },
                    ]}
                />
            ) : (
                <CityDemandMgtList />
            )}
        </div>
    )
}

export default DemandManagement
