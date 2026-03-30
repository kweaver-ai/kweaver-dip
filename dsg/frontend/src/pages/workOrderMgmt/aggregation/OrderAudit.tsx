import React from 'react'
import styles from '../../styles.module.less'
import { OrderType } from '@/components/WorkOrder/helper'
import WorkOrderAudit from '@/components/WorkOrder/WorkOrderAudit'

function OrderAudit() {
    return (
        <div className={styles.orderAuditWrapper}>
            <WorkOrderAudit orderType={OrderType.AGGREGATION} />
        </div>
    )
}

export default OrderAudit
