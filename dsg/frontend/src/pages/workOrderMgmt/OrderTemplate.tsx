import React from 'react'
import styles from '../styles.module.less'
// import WorkOrderTemplate from '@/components/WorkOrder/WorkOrderTemplate'
import { WorkOrderTemplateManagement } from '@/components/WorkOrderTemplate'

function OrderTask() {
    return (
        <div className={styles.orderTemplateWrapper}>
            {/* <WorkOrderTemplate /> */}
            <WorkOrderTemplateManagement />
        </div>
    )
}

export default OrderTask
