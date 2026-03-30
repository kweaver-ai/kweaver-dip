import { Tabs } from 'antd'
import { useEffect, useState } from 'react'
import classnames from 'classnames'
import FeedbackTable from './FeedbackTable'
import FeedbackTableResMode from '@/components/FeedbackResMode/list/FeedbackTable'
import { FeedbackMenuEnum } from '../helper'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { FeedbackMenuEnum as FeedbackMenuEnumResMode } from '@/components/FeedbackResMode/helper'
import styles from '../styles.module.less'
import __ from '../locale'

/**
 * 我的反馈
 */
const MyFeedbackList = () => {
    const [{ using }] = useGeneralConfig()

    const [activeKey, setActiveKey] = useState<FeedbackMenuEnum>(
        FeedbackMenuEnum.MyFeedback,
    )

    const handleTabChange = (key: FeedbackMenuEnum) => {
        setActiveKey(key)
    }

    useEffect(() => {
        setActiveKey(
            using === 2
                ? FeedbackMenuEnum.DataView
                : FeedbackMenuEnum.MyFeedback,
        )
    }, [using])

    const renderTabContent = (key: FeedbackMenuEnum) => {
        if (key !== activeKey) return null

        if (key === FeedbackMenuEnum.MyFeedback) {
            return (
                <FeedbackTable
                    key={FeedbackMenuEnum.MyFeedback}
                    menu={FeedbackMenuEnum.MyFeedback}
                    scrollY="calc(100vh - 343px)"
                />
            )
        }
        if (
            key === FeedbackMenuEnum.InterfaceSvc ||
            key === FeedbackMenuEnum.DataView
        ) {
            return (
                <FeedbackTableResMode
                    key={key}
                    menu={key as any}
                    resType={key as any}
                    scrollY="calc(100vh - 343px)"
                />
            )
        }
        return null
    }

    return (
        <div className={classnames(styles.feedbackMgt)}>
            <Tabs
                activeKey={activeKey}
                onChange={(key) => handleTabChange(key as FeedbackMenuEnum)}
                items={[
                    {
                        label: __('库表'),
                        key: FeedbackMenuEnum.DataView,
                        children: renderTabContent(FeedbackMenuEnum.DataView),
                    },
                    {
                        label: __('数据资源目录'),
                        key: FeedbackMenuEnum.MyFeedback,
                        children: renderTabContent(FeedbackMenuEnum.MyFeedback),
                    },
                    {
                        label: __('接口服务'),
                        key: FeedbackMenuEnum.InterfaceSvc,
                        children: renderTabContent(
                            FeedbackMenuEnum.InterfaceSvc,
                        ),
                    },
                ].filter((item) =>
                    using === 2
                        ? item?.key !== FeedbackMenuEnum.MyFeedback
                        : item?.key !== FeedbackMenuEnum.DataView,
                )}
                className={styles.feedbackTabs}
            />
        </div>
    )
}

export default MyFeedbackList
