import { Tabs } from 'antd'
import { useState, useEffect } from 'react'
import classnames from 'classnames'
import { getFeedbackCountResMode } from '@/core'
import FeedbackTable from './FeedbackTable'
import { FeedbackMenuEnum } from '../helper'
import styles from '../styles.module.less'
import __ from '../locale'

/**
 * 反馈列表
 */
const FeedbackList = (props: any) => {
    const { resType } = props
    const [activeKey, setActiveKey] = useState(FeedbackMenuEnum.Pending)
    const [numMap, setNumMap] = useState({
        total_num: 0,
        pending_num: 0,
        replied_num: 0,
    })

    // useEffect(() => {
    //     getData()
    // }, [])

    // const getData = async () => {
    //     const res = await getFeedbackCountResMode({ res_type: resType })
    //     setNumMap(res)
    // }

    const handleTabChange = (key: FeedbackMenuEnum) => {
        setActiveKey(key)
    }

    const renderTabContent = (key: FeedbackMenuEnum) => {
        if (key !== activeKey) return null

        return (
            <FeedbackTable
                key={key}
                menu={key}
                // onReplySuccess={getData}
                scrollY="calc(100vh - 301px)"
                resType={resType}
            />
        )
    }

    const renderTabLabel = (title: string, count: number) => {
        return (
            <span>
                {title}
                <span style={{ marginLeft: 4 }}>{`(${count})`}</span>
            </span>
        )
    }

    return (
        <div className={classnames(styles.feedbackMgt, styles.feedbackList)}>
            <Tabs
                activeKey={activeKey}
                onChange={(key) => handleTabChange(key as FeedbackMenuEnum)}
                items={[
                    {
                        // label: renderTabLabel(__('待办'), numMap?.pending_num),
                        label: __('待办'),
                        key: FeedbackMenuEnum.Pending,
                        children: renderTabContent(FeedbackMenuEnum.Pending),
                    },
                    {
                        // label: renderTabLabel(__('已办'), numMap?.replied_num),
                        label: __('已办'),
                        key: FeedbackMenuEnum.Handled,
                        children: renderTabContent(FeedbackMenuEnum.Handled),
                    },
                ]}
                className={styles.feedbackTabs}
            />
        </div>
    )
}

export default FeedbackList
