import React, { useEffect, useState } from 'react'
import { Modal } from 'antd'
import ViewList from './ViewList'
import styles from './styles.module.less'
import DataView from './DataView'
import FieldList from './FieldList'

const ViewChoose = ({ open, bindItems, onClose, onSure }: any) => {
    const [checkedItems, setCheckedItems] = useState<any[]>([])
    const [selectedNode, setSelectedNode] = useState<any>()
    const handleOk = async () => {
        onSure(checkedItems)
    }

    const handleCheck = (isCheck: boolean, item) => {
        if (isCheck) {
            setCheckedItems((prev) => [...(prev ?? []), item])
        } else {
            setCheckedItems((prev) => prev?.filter((o) => o?.id !== item?.id))
        }
    }

    const handleRemove = (items) => {
        const ids = items?.map((o) => o?.id)
        setCheckedItems((prev) => prev?.filter((o) => !ids?.includes(o?.id)))
    }

    return (
        <Modal
            title="选择库表"
            width={980}
            maskClosable={false}
            open={open}
            onCancel={onClose}
            onOk={handleOk}
            destroyOnClose
            getContainer={false}
            okButtonProps={{
                disabled: !checkedItems?.length,
            }}
            bodyStyle={{ height: 484, padding: '16px 24px' }}
        >
            <div className={styles['view-choose']}>
                <div>
                    <div className={styles['box-dataview']}>
                        <div className={styles['box-title']}>库表</div>
                        <DataView
                            bindItems={bindItems}
                            checkedItems={checkedItems}
                            onCheck={handleCheck}
                            onChoose={(it) => setSelectedNode(it)}
                        />
                    </div>
                </div>
                <div>
                    <div className={styles['box-fields']}>
                        <FieldList resourceId={selectedNode?.id} />
                    </div>
                    <div className={styles['box-viewlist']}>
                        <ViewList data={checkedItems} onDelete={handleRemove} />
                    </div>
                </div>
            </div>
        </Modal>
    )
}

export default ViewChoose
