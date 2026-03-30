import { Tabs } from 'antd'
import { useState } from 'react'
import { getRaiseObjectionAudit } from '@/core'
import ObjectionTable from './ObjectionTable'
import { ObjectionMenuEnum } from '../helper'
import styles from '../styles.module.less'
import __ from '../locale'

/**
 * 数据异议审核
 */
const ObjectionReviewList = () => {
    const [activeKey, setActiveKey] = useState(ObjectionMenuEnum.PendingReview)

    const handleTabChange = (key: ObjectionMenuEnum) => {
        setActiveKey(key)
    }

    const renderTabContent = (key: ObjectionMenuEnum) => {
        if (key !== activeKey) return null

        return (
            <ObjectionTable
                key={key}
                menu={key}
                func={getRaiseObjectionAudit}
            />
        )
    }

    return (
        <div className={styles.objectionMgt}>
            <div className={styles.objectionTitle}>{__('数据异议审核')}</div>
            <Tabs
                activeKey={activeKey}
                onChange={(key) => handleTabChange(key as ObjectionMenuEnum)}
                items={[
                    {
                        label: __('待审核'),
                        key: ObjectionMenuEnum.PendingReview,
                        children: renderTabContent(
                            ObjectionMenuEnum.PendingReview,
                        ),
                    },
                    {
                        label: __('已审核'),
                        key: ObjectionMenuEnum.Reviewed,
                        children: renderTabContent(ObjectionMenuEnum.Reviewed),
                    },
                ]}
            />
        </div>
    )
}

export default ObjectionReviewList
