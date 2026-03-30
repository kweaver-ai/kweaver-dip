import { Button, Modal } from 'antd'
import React, { memo, useEffect, useMemo, useState } from 'react'
import { InfoCircleFilled } from '@ant-design/icons'
import { BizModelType, messageError } from '@/core'
import CatalogList from './CatalogList'
import FieldList from './FieldList'
import __ from './locale'
import styles from './styles.module.less'
import { useBusinessModelContext } from '../../BusinessModelProvider'

interface IFieldChoose {
    title?: string
    visible: boolean
    bindIds?: string[]
    checked?: any
    onClose: () => void
    onSure: (info, arrs?) => void
    mid?: string
    isDataModel?: boolean
}

/**
 * 关联子流程组件
 * @param visible 显示/隐藏
 * @param bindIds 已关联ID数组
 * @param onClose 关闭
 * @param onSure 确定
 */
const FieldChoose: React.FC<IFieldChoose> = ({
    title,
    visible,
    checked,
    bindIds,
    onClose,
    onSure,
    mid,
    isDataModel,
}) => {
    const [node, setNode] = useState<any>()
    const { businessModelType } = useBusinessModelContext()

    useEffect(() => {
        if (checked && visible) {
            setNode(checked)
        } else {
            setNode(undefined)
        }
    }, [visible, checked])

    // 保存数据
    const handleOk = async () => {
        // 没有选中项不处理
        if (!selNodeField) {
            messageError(__('请选择字段'))
            return
        }
        onSure(node, selNodeField)
    }

    const handleItemCheck = (isChecked: boolean, item: any) => {
        if (isChecked) {
            setNode(item)
        } else {
            setNode(undefined)
        }
    }

    const detachCheckedBindIds = useMemo(() => {
        if (!checked) return bindIds
        return (bindIds || [])?.filter((k) => k !== checked?.id)
    }, [checked, bindIds])

    // 表字段
    const [selNodeField, setSelNodeField] = useState<any>()

    return (
        <div>
            <Modal
                title={title || __('选择字段')}
                width={1000}
                maskClosable={false}
                open={visible}
                onCancel={onClose}
                onOk={handleOk}
                destroyOnClose
                getContainer={false}
                className={styles['field-choose']}
                bodyStyle={{ height: 534, padding: 0 }}
                footer={
                    <div className={styles.bizFooter}>
                        <span>
                            <span className={styles.tip}>
                                <InfoCircleFilled
                                    style={{
                                        color: '#126EE3',
                                        marginRight: '8px',
                                    }}
                                />
                                <span>
                                    {businessModelType === BizModelType.DATA
                                        ? __('仅为您提供"数据表"进行选择')
                                        : __('仅为您提供"业务表"进行选择')}
                                </span>
                            </span>
                        </span>
                        <span>
                            <Button onClick={onClose}>取消</Button>
                            <Button
                                type="primary"
                                disabled={!node || !selNodeField}
                                onClick={handleOk}
                            >
                                确定
                            </Button>
                        </span>
                    </div>
                }
            >
                <div className={styles['field-choose-content']}>
                    <div className={styles['field-choose-content-left']}>
                        <CatalogList
                            mid={mid}
                            bindIds={detachCheckedBindIds}
                            selected={node}
                            onSelect={handleItemCheck}
                            search
                        />
                    </div>
                    <div className={styles['field-choose-content-right']}>
                        <FieldList
                            search
                            showCode
                            selectedId={node?.id}
                            onCheckNode={(field: any) => setSelNodeField(field)}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default memo(FieldChoose)
