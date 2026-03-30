import React from 'react'
import { OrderType } from '@/components/WorkOrder/helper'
import ExecuteTasks from '@/components/WorkOrder/ExecuteTasks'
import styles from '../../styles.module.less'

function OrderTask() {
    return (
        <div className={styles.orderTaskWrapper}>
            <ExecuteTasks orderType={OrderType.COMPREHENSION} />
        </div>
    )
}

export default OrderTask
