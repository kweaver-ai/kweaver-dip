import React from 'react'
import styles from '../styles.module.less'
import MyTask from '@/components/MyTask'

function OrderTask() {
    return (
        <div className={styles.orderTaskWrapper}>
            <MyTask />
        </div>
    )
}

export default OrderTask
