import React, { useRef } from 'react'
import { Drawer } from 'antd'
import styles from './styles.module.less'
import __ from './locale'
import ApiDetail from './Detail'

function DetailDialog({ id, toast, open, onCancel }: any) {
    const handleCancel = () => {
        onCancel()
    }

    const ref = useRef({
        getDirName: () => {},
    })
    return (
        <Drawer
            title={__('查看接口服务详情')}
            placement="right"
            onClose={handleCancel}
            open={open}
            width="90%"
        >
            <div className={styles.modalContent}>
                <ApiDetail code={id} ref={ref} isAuditDetail />
            </div>
        </Drawer>
    )
}

export default DetailDialog
