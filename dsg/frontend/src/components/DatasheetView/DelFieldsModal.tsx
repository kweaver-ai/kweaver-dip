import React, { useEffect, useState } from 'react'
import { Modal, Tooltip } from 'antd'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from './locale'
import { getStateTag, getFieldTypeEelment } from './helper'

interface IDelFieldsModal {
    open: boolean
    onClose: () => void
    sum: number
    fieldData: any[]
}

const DelFieldsModal: React.FC<IDelFieldsModal> = ({
    open,
    onClose,
    sum,
    fieldData = [],
}) => {
    return (
        <div>
            <Modal
                title={`${__('查看源数据表删除的字段 (')}${sum}${__(')')}`}
                width={640}
                open={open}
                onCancel={onClose}
                className={classnames(
                    styles.fieldsTableWrapper,
                    styles.delFieldsModalWrapper,
                )}
                maskClosable={false}
                footer={null}
            >
                <div className={styles.modalBox}>
                    {fieldData?.map((item) => {
                        return (
                            <div className={styles.tableItemBox} key={item.id}>
                                <div className={styles.tableItem}>
                                    <span className={styles.iconBox}>
                                        {getFieldTypeEelment(
                                            {
                                                ...item,
                                                type: item.data_type,
                                            },
                                            24,
                                        )}
                                    </span>

                                    <div style={{ width: 'calc(100% - 32px)' }}>
                                        <div
                                            className={styles.name}
                                            title={item.business_name}
                                        >
                                            {item.business_name}
                                        </div>
                                        <div
                                            className={styles.code}
                                            title={item.technical_name}
                                        >
                                            <span className={styles.codeText}>
                                                {item.technical_name}
                                            </span>
                                            <Tooltip
                                                title={__(
                                                    '源数据表删除了此字段',
                                                )}
                                                placement="right"
                                                color="#fff"
                                                overlayInnerStyle={{
                                                    color: '#000',
                                                }}
                                            >
                                                <span className={styles.del}>
                                                    {getStateTag('del')}
                                                </span>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Modal>
        </div>
    )
}

export default DelFieldsModal
