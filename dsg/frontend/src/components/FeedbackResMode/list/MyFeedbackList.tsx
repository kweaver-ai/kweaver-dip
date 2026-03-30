import { Tabs } from 'antd'
import { useState } from 'react'
import classnames from 'classnames'
import FeedbackTable from './FeedbackTable'
import { FeedbackMenuEnum } from '../helper'
import styles from '../styles.module.less'
import __ from '../locale'

/**
 * 我的反馈
 */
const MyFeedbackList = () => {
    const [activeKey, setActiveKey] = useState<FeedbackMenuEnum>(
        FeedbackMenuEnum.DataView,
    )

    const handleTabChange = (key: FeedbackMenuEnum) => {
        setActiveKey(key)
    }

    const renderTabContent = (key: FeedbackMenuEnum) => {
        if (key !== activeKey) return null

        return (
            <FeedbackTable key={key} menu={key} scrollY="calc(100vh - 312px)" />
        )
    }

    return (
        <div className={classnames(styles.feedbackMgt, styles.myFeedback)}>
            <Tabs
                activeKey={activeKey}
                onChange={(key) => handleTabChange(key as FeedbackMenuEnum)}
                items={[
                    {
                        label: __('逻辑视图'),
                        key: FeedbackMenuEnum.DataView,
                        children: renderTabContent(FeedbackMenuEnum.DataView),
                    },
                    {
                        label: __('接口服务'),
                        key: FeedbackMenuEnum.InterfaceSvc,
                        children: renderTabContent(
                            FeedbackMenuEnum.InterfaceSvc,
                        ),
                    },
                    {
                        label: __('指标'),
                        key: FeedbackMenuEnum.Indicator,
                        children: renderTabContent(FeedbackMenuEnum.Indicator),
                    },
                ]}
                className={styles.feedbackTabs}
            />
        </div>
    )
}

export default MyFeedbackList
