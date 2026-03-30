import React from 'react'
import styles from '../styles.module.less'
import WorkOrderAudit from '@/components/WorkOrder/WorkOrderAudit'

function OrderAudit() {
    return (
        <div className={styles.orderAuditWrapper}>
            <WorkOrderAudit />
        </div>
    )
}

export default OrderAudit
