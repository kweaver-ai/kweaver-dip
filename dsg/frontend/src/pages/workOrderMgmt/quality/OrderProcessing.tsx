import React from 'react'
import styles from '../../styles.module.less'
import DataQualityProcessing from '@/components/WorkOrder/WorkOrderProcessing/DataQualityProcessing'

function OrderProcessing() {
    return (
        <div className={styles.orderProcessingWrapper}>
            <DataQualityProcessing />
        </div>
    )
}

export default OrderProcessing
