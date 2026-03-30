import React from 'react'
import { Empty } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'

function OrderTask() {
    return (
        <div style={{ paddingTop: '200px' }}>
            <Empty iconSrc={dataEmpty} desc="暂无数据" />
        </div>
    )
}

export default OrderTask
