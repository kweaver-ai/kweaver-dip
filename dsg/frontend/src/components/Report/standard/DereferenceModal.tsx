import React from 'react'
import { Modal, Table } from 'antd'
import __ from '../locale'
import styles from '../styles.module.less'

interface IDereferenceModal {
    fieldNameString: string
    dereferenceForms: IDereferenceForm[]
    onCancel: () => void
}

export interface IDereferenceForm {
    id: string
    name: string
}

const DereferenceModal: React.FC<IDereferenceModal> = ({
    fieldNameString,
    dereferenceForms,
    onCancel,
}) => {
    const columns = [
        {
            title: __('表名'),
            dataIndex: 'name',
            key: 'name',
        },
    ]

    return (
        <Modal
            title={__('提示')}
            open={dereferenceForms?.length > 0}
            footer={null}
            width="600px"
            bodyStyle={{ maxHeight: 444, overflow: 'auto' }}
            onCancel={onCancel}
        >
            {__('以下表中${fieldNameString}字段已自动解除引用关系', {
                fieldNameString,
            })}
            <Table
                columns={columns}
                dataSource={dereferenceForms}
                pagination={false}
                className={styles.dereferenceTable}
            />
        </Modal>
    )
}

export default DereferenceModal
