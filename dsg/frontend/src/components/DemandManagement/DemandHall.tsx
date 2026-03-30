import { Tabs } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import CityDemandHallList from './City/DemandHallList'
import ProvinceDemandHallList from './Province/DemandHallList'
import __ from './locale'
import styles from './styles.module.less'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

// 需求大厅
const DemandHall = () => {
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
                    <div className={styles.title}>{__('需求大厅')}</div>
                    <Tabs
                        defaultActiveKey="1"
                        activeKey={activityKey}
                        onChange={(e) => setActiveKey(e)}
                        destroyInactiveTabPane
                        items={[
                            {
                                label: __('本市州需求'),
                                key: '1',
                                children: (
                                    <CityDemandHallList showTitle={false} />
                                ),
                            },
                            {
                                label: __('省级需求'),
                                key: '2',
                                children: <ProvinceDemandHallList />,
                            },
                        ]}
                    />
                </>
            ) : (
                <CityDemandHallList />
            )}
        </div>
    )
}

export default DemandHall
