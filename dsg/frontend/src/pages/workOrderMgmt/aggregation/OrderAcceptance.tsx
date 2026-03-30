import React from 'react'
import WorkOrderSignature from '@/components/WorkOrder/WorkOrderSignature'
import styles from '../../styles.module.less'
import { OrderType } from '@/components/WorkOrder/helper'

function OrderAcceptance() {
    return (
        <div className={styles.orderSignatureWrapper}>
            <WorkOrderSignature orderType={OrderType.AGGREGATION} />
        </div>
    )
}

export default OrderAcceptance
