import * as React from 'react'
import { useState } from 'react'
import { Modal } from 'antd'
import { noop } from 'lodash'
import { ExclamationCircleFilled } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'

interface ConfirmModalType {
    onOk: () => void
    onCancel: () => void
    title: string
    content: string
}
const ConfirmModal = ({
    onOk = noop,
    onCancel = noop,
    title = '',
    content = '',
}: ConfirmModalType) => {
    return (
        <Modal
            open
            onOk={onOk}
            onCancel={onCancel}
            closable={false}
            okText={__('确认')}
            cancelText={__('取消')}
            width={440}
            maskClosable={false}
        >
            <div className={styles.confirmModal}>
                <div className={styles.icon}>
                    <ExclamationCircleFilled
                        style={{ fontSize: '22px', color: '#F5222D' }}
                    />
                </div>
                <div>
                    <div className={styles.title}>{title}</div>
                    <div className={styles.contents}>{content}</div>
                </div>
            </div>
        </Modal>
    )
}
export default ConfirmModal
