import React from 'react'
import WorkOrderManage from '@/components/WorkOrder/WorkOrderManage'
import styles from '../../styles.module.less'
import __ from '../../locale'
import { OrderType } from '@/components/WorkOrder/helper'

function DataFusion() {
    return (
        <div className={styles.orderManageWrapper}>
            <WorkOrderManage orderType={OrderType.FUNSION} />
        </div>
    )
}

export default DataFusion
