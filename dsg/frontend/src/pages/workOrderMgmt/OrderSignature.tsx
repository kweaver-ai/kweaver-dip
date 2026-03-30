import React from 'react'
import styles from '../styles.module.less'
import WorkOrderSignature from '@/components/WorkOrder/WorkOrderSignature'

function OrderSignature() {
    return (
        <div className={styles.orderSignatureWrapper}>
            <WorkOrderSignature />
        </div>
    )
}

export default OrderSignature
