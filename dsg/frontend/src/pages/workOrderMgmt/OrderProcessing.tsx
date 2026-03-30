import React from 'react'
import styles from '../styles.module.less'
import WorkOrderProcessing from '@/components/WorkOrder/WorkOrderProcessing'

function OrderProcessing() {
    return (
        <div className={styles.orderProcessingWrapper}>
            <WorkOrderProcessing />
        </div>
    )
}

export default OrderProcessing
