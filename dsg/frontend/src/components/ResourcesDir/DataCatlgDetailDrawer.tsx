import React, { useRef } from 'react'
import { Drawer } from 'antd'
import { noop } from 'lodash'
import DirDetailContent from './DirDetailContent'

interface IDataCatlgDetailDrawer {
    // 传入的目录部分相关信息（如id,name，其余信息在组件内通过接口获取）
    catlgItem?: any
    // 为true表明目录详情页为抽屉形式显示
    open?: boolean
    onCancel?: () => void
    getContainer?: () => HTMLElement
}

function DataCatlgDetailDrawer({
    catlgItem = {},
    open,
    onCancel = noop,
    getContainer,
}: IDataCatlgDetailDrawer) {
    const handleCancel = () => {
        onCancel()
    }

    const ref = useRef({
        getDirName: () => {},
    })
    return (
        <Drawer
            headerStyle={{ display: 'none' }}
            placement="right"
            onClose={handleCancel}
            open={open}
            bodyStyle={{
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 1280,
            }}
            // width="calc(100vw - 220px)"
            width="100vw"
            push={false}
            getContainer={getContainer}
        >
            <DirDetailContent
                catlgItem={catlgItem}
                isDrawer
                onReturn={handleCancel}
            />
        </Drawer>
    )
}

export default DataCatlgDetailDrawer
