import React, { memo } from 'react'
import { Modal } from 'antd'
import FieldList from './ChooseBizTable/FieldList'
import __ from '../locale'
import styles from '../styles.module.less'
/**
 * 表字段预览
 * @returns
 */
function FieldPreview({
    tableId,
    visible,
    onClose,
}: {
    tableId: string
    visible: boolean
    onClose: () => void
}) {
    return (
        <Modal
            title={__('预览维度表')}
            width={480}
            maskClosable={false}
            open={visible}
            onCancel={onClose}
            destroyOnClose
            getContainer={false}
            bodyStyle={{ height: 444, padding: 0 }}
            footer={null}
        >
            <div className={styles['field-preview']}>
                <FieldList selectedId={tableId} showCode />
            </div>
        </Modal>
    )
}

export default memo(FieldPreview)
