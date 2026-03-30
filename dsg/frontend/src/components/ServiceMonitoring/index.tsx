import React, { memo, useState } from 'react'
import { Tabs } from 'antd'
import MonitoringTable from './MonitoringTable'
import __ from './locale'
import styles from './styles.module.less'
import { TabMode } from './const'

/**
 * 服务监控
 */
const ServiceMonitoring = ({ id }: { id?: string }): React.ReactElement => {
    const [activeTab, setActiveTab] = useState(TabMode.Log)

    const tabItems = [
        {
            key: TabMode.Log,
            label: __('日志监控'),
            children: <MonitoringTable mode={TabMode.Log} id={id} />,
        },
        {
            key: TabMode.Error,
            label: __('错误监控'),
            children: <MonitoringTable mode={TabMode.Error} id={id} />,
        },
    ]

    return (
        <div className={styles.serviceMonitoring}>
            {/* <Tabs
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key as TabMode)}
                items={tabItems}
                className={styles.monitoringTabs}
                destroyInactiveTabPane
            /> */}
            <MonitoringTable mode={TabMode.Log} id={id} />
        </div>
    )
}

export default memo(ServiceMonitoring)
