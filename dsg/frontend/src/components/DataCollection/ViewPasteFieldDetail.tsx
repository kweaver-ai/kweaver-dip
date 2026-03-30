import * as React from 'react'
import { useState, useEffect } from 'react'
import { Drawer, Form } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import { CyclesOptions, DataRangeOptions } from '../Forms/const'
import { formatError } from '@/core'
import AutoFormView from '../AutoFormView'
import { DisplayInfoComponentType } from '../AutoFormView/helper'

interface ViewPasteFormDetailType {
    fieldInfo: any
    onClose: () => void
}

const ViewPasteFieldDetail = ({
    onClose,
    fieldInfo,
}: ViewPasteFormDetailType) => {
    const [form] = Form.useForm()
    const [formConfig, setFormConfig] = useState<any>(null)

    useEffect(() => {
        initFormConfig()
    }, [fieldInfo])
    /**
     * 初始化配置
     */

    const initFormConfig = () => {
        setFormConfig({
            name: {
                type: DisplayInfoComponentType.Text,
                label: __('字段名称'),
            },
            type: {
                type: DisplayInfoComponentType.Text,
                label: __('字段类型'),
            },
            ...(['char', 'varchar'].includes(fieldInfo.type)
                ? {
                      length: {
                          type: DisplayInfoComponentType.Text,
                          label: __('字段长度'),
                      },
                  }
                : {}),
            ...(fieldInfo.type === 'decimal'
                ? {
                      length: {
                          type: DisplayInfoComponentType.Text,
                          label: __('字段长度'),
                      },
                      field_precision: {
                          type: DisplayInfoComponentType.Text,
                          label: __('字段标度'),
                      },
                  }
                : {}),
            description: {
                type: DisplayInfoComponentType.AreaText,
                label: __('字段注释'),
            },
        })
    }
    return (
        <Drawer
            width={400}
            title={
                <div className={styles.editFieldTitle}>
                    <div className={styles.editTitle}>{__('字段信息')}</div>
                    <div className={styles.closeButton}>
                        <CloseOutlined
                            onClick={() => {
                                onClose()
                            }}
                        />
                    </div>
                </div>
            }
            placement="right"
            closable={false}
            onClose={() => {
                onClose()
            }}
            mask={false}
            open
            getContainer={false}
            style={{ position: 'absolute' }}
            className={styles.nodeConfigWrapper}
            footer={null}
            destroyOnClose
        >
            {formConfig && (
                <AutoFormView data={fieldInfo} config={formConfig} />
            )}
        </Drawer>
    )
}

export default ViewPasteFieldDetail
