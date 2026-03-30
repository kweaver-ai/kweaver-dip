import React from 'react'
import { Modal, Table } from 'antd'
import __ from '../locale'
import { IMainBusinesses } from '@/core'

interface IInconsistentFormsModal {
    inconsistentForms: IMainBusinesses[]
    onCancelModal: () => void
}

const InconsistentFormsModal: React.FC<IInconsistentFormsModal> = ({
    inconsistentForms,
    onCancelModal,
}) => {
    const columns = [
        {
            title: __('业务表'),
            dataIndex: 'business_form_name',
            key: 'business_form_name',
            ellipsis: true,
        },
        {
            title: __('业务模型'),
            dataIndex: 'main_business_name',
            key: 'main_business_name',
            ellipsis: true,
        },
        {
            title: __('组织或部门'),
            dataIndex: 'department_name',
            key: 'department_name',
            ellipsis: true,
        },
    ]

    return (
        <Modal
            title={__('查看业务表')}
            open={inconsistentForms.length > 0}
            onCancel={onCancelModal}
            footer={null}
            width="600px"
            bodyStyle={{ maxHeight: 444, overflow: 'auto' }}
        >
            <Table
                dataSource={inconsistentForms}
                columns={columns}
                pagination={false}
            />
        </Modal>
    )
}

export default InconsistentFormsModal
