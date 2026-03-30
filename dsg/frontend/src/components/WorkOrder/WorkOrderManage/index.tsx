import { Tabs, Badge, Button } from 'antd'
import React, { useEffect, useState } from 'react'
import className from 'classnames'
import { OrderType } from '../helper'
import CreationWorkOrder from './CreationWorkOrder'
import ResponsibleWorkOrder from './ResponsibleWorkOrder'
import styles from './styles.module.less'
import { getWorkOrderQualityAudit, formatError } from '@/core'
import QualityExamineDrawer from './QualityExamineDrawer'
import __ from './locale'

function WorkOrderManage({ orderType }: { orderType?: OrderType }) {
    const [qualityExamineOpen, setQualityExamineOpen] = useState<boolean>(false)
    const [orderList, setOrderList] = useState<any[]>([])
    const items = [
        {
            label: '我创建的',
            key: 'creation',
            children: <CreationWorkOrder orderType={orderType} />,
        },
        {
            label: '我负责的',
            key: 'responsible',
            children: <ResponsibleWorkOrder orderType={orderType} />,
        },
    ]

    useEffect(() => {
        if (orderType === OrderType.QUALITY_EXAMINE) {
            getDataList()
        }
    }, [])

    // 工单查询
    const getDataList = async () => {
        try {
            const res = await getWorkOrderQualityAudit({
                offset: 1,
                limit: 10,
            })
            setOrderList(res.entries)
        } catch (error) {
            formatError(error)
            setOrderList([])
        }
    }

    return (
        <div className={styles.workOrderWrapper}>
            <Tabs items={items} destroyInactiveTabPane />
            {/* {orderType === OrderType.QUALITY_EXAMINE && (
                <div className={styles.orderBtn}>
                    <Badge dot={!!orderList.length}>
                        <div
                            className={className(
                                styles.orderText,
                                !orderList.length && styles.disable,
                            )}
                            onClick={() => {
                                if (!orderList.length) return
                                setQualityExamineOpen(true)
                            }}
                        >
                            <span className={styles.orderIcon}>{__('检')}</span>
                            {__('新表质检')}
                        </div>
                    </Badge>
                </div>
            )} */}
            {qualityExamineOpen && (
                <QualityExamineDrawer
                    open={qualityExamineOpen}
                    onClose={() => {
                        setQualityExamineOpen(false)
                    }}
                />
            )}
        </div>
    )
}

export default WorkOrderManage
