import React from 'react'
import styles from '../styles.module.less'
import WorkOrderManage from '@/components/WorkOrder/WorkOrderManage'

function OrderManage() {
    return (
        <div className={styles.orderManageWrapper}>
            <WorkOrderManage />
        </div>
    )
}

export default OrderManage
