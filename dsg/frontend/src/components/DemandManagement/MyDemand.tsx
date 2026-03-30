import { Tabs } from 'antd'
import CityDemandApplyList from './City/DemandApplyList'
import ProvinceDemandApplyList from './Province/DemandApplyList'
import __ from './locale'
import styles from './styles.module.less'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

// 需求申请
const MyDemand = () => {
    const [config] = useGeneralConfig()

    return (
        <div className={styles['demand-list-wrapper']}>
            {config.governmentSwitch.on ? (
                <>
                    <div className={styles.title}>{__('需求申请')}</div>
                    <Tabs
                        defaultActiveKey="1"
                        destroyInactiveTabPane
                        items={[
                            {
                                label: __('本市州需求'),
                                key: '1',
                                children: (
                                    <CityDemandApplyList showTitle={false} />
                                ),
                            },
                            {
                                label: __('省级需求'),
                                key: '2',
                                children: <ProvinceDemandApplyList />,
                            },
                        ]}
                    />
                </>
            ) : (
                <CityDemandApplyList />
            )}
        </div>
    )
}

export default MyDemand
