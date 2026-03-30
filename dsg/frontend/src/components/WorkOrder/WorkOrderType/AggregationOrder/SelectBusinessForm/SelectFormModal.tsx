import { Modal } from 'antd'
import React, { useState } from 'react'
import __ from './locale'
import styles from './styles.module.less'
import ViewList from './ViewList'
import DataView from './DataView'
import DepartTree from './DepartTree'

const allNodeInfo = {
    id: '',
    type: 'all',
    path: '',
    name: '全部',
}

function SelectFormModal({ open, bindItems, onClose, onSure }: any) {
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

    // 获取选中的节点
    const getSelectedNode = (sn?: any) => {
        let node
        if (sn) {
            node = { ...sn }
        } else {
            node = allNodeInfo
        }
        setSelectedNode(sn || allNodeInfo)
    }

    return (
        <Modal
            title={__('选择业务表')}
            width={800}
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
            <div className={styles['bizform-choose']}>
                <div>
                    <div className={styles['box-depart']}>
                        <div className={styles['box-title']}>部门</div>
                        <DepartTree onChange={getSelectedNode} />
                    </div>
                </div>
                <div>
                    <div className={styles['box-dataview']}>
                        <div className={styles['box-title']}>业务表</div>
                        <DataView
                            node={selectedNode}
                            bindItems={bindItems}
                            checkedItems={checkedItems}
                            onCheck={handleCheck}
                        />
                    </div>
                    <div className={styles['box-viewlist']}>
                        <ViewList data={checkedItems} onDelete={handleRemove} />
                    </div>
                </div>
            </div>
        </Modal>
    )
}

export default SelectFormModal
