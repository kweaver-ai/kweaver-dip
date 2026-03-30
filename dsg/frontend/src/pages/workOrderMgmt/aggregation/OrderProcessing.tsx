import React from 'react'
import WorkOrderProcessing from '@/components/WorkOrder/WorkOrderProcessing'
import styles from '../../styles.module.less'
import { OrderType } from '@/components/WorkOrder/helper'

function OrderProcessing() {
    return (
        <div className={styles.orderProcessingWrapper}>
            <WorkOrderProcessing orderType={OrderType.AGGREGATION} />
        </div>
    )
}

export default OrderProcessing
