import { Modal, Tooltip } from 'antd'
import React, { useEffect, useState } from 'react'
import {
    formatError,
    getCodeRuleDataElement,
    ICodeRuleDataElement,
} from '@/core'
import __ from './locale'
import styles from './styles.module.less'

interface IViewDataElement {
    id?: string
    visible: boolean
    onClose: () => void
}
const ViewDataElement: React.FC<IViewDataElement> = ({
    id,
    visible,
    onClose,
}) => {
    const [dataElement, setDataElement] = useState<ICodeRuleDataElement[]>()

    const getDataElement = async () => {
        if (!id) return
        try {
            const res = await getCodeRuleDataElement(id, {
                offset: 1,
                limit: 1000,
            })
            setDataElement(res.data)
        } catch (error) {
            formatError({ error })
        }
    }

    useEffect(() => {
        if (visible) {
            getDataElement()
        }
    }, [visible, id])

    return (
        <div className={styles.viewDataelementWrapper}>
            <Modal
                title={__('查看引用')}
                width={372}
                open={visible}
                bodyStyle={{
                    padding: '24px',
                }}
                onCancel={onClose}
                getContainer={false}
                footer={null}
            >
                <div>
                    <div className="titleName">
                        {__('该编码规则被以下数据元引用：')}
                    </div>
                    <div className={styles.dataElementWrapper}>
                        {dataElement?.map((de) => (
                            <Tooltip
                                title={de.name_cn}
                                placement="topLeft"
                                destroyTooltipOnHide
                            >
                                <div className={styles.dataElementName}>
                                    · {de.name_cn}
                                </div>
                            </Tooltip>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    )
}
export default ViewDataElement
