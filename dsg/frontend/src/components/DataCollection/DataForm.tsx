import { AutoComplete, Modal, Form } from 'antd'
import * as React from 'react'
import { useState, useEffect } from 'react'
import { Node } from '@antv/x6'
import { trim } from 'lodash'
import { ComponentType, AutoFormConfig } from '@/ui'
import __ from './locale'
import { PasteSourceChecked } from './const'
import { enBeginNameReg, enBeginNameRegNew, entendNameEnReg } from '@/utils'

interface DataFormType {
    onConfirm: (values) => void
    onCancel: () => void
    open
    title?: string
    defaultData?: any
    node?: Node | null
}
const DataForm = ({
    onConfirm,
    onCancel,
    open,
    title = __('添加数据表'),
    defaultData,
    node,
}: DataFormType) => {
    const [form] = Form.useForm()
    useEffect(() => {
        form.resetFields()
    }, [open])
    useEffect(() => {
        form.setFieldsValue(defaultData)
    }, [defaultData])
    const handleFinsh = (values) => {
        onConfirm({
            name: trim(values?.name || ''),
            description: trim(values?.description || ''),
        })
    }
    return (
        <Modal
            title={title}
            onCancel={onCancel}
            onOk={() => {
                form.submit()
            }}
            open={open}
            maskClosable={false}
        >
            <AutoFormConfig
                config={{
                    name: {
                        label: __('数据表名称'),
                        type: ComponentType.Input,
                        disabled: !!(
                            node &&
                            node.data.formInfo.checked !==
                                PasteSourceChecked.New
                        ),
                        rules: [
                            {
                                required: true,
                                transform: (value) => trim(value),
                                message: __('输入不能为空'),
                            },
                            {
                                pattern: enBeginNameRegNew,
                                message: __(
                                    '仅支持英文、数字、下划线，且必须以字母开头',
                                ),
                                transform: (value) => trim(value),
                            },
                        ],
                        placeholder: __('请输入数据表名称'),
                        maxLength: 255,
                    },
                    description: {
                        label: __('描述'),
                        type: ComponentType.TextArea,
                        disabled: !!(
                            node &&
                            node.data.formInfo.checked !==
                                PasteSourceChecked.New
                        ),
                        placeholder: __('请输入描述'),
                        others: {
                            style: {
                                height: '80px',
                            },
                        },
                    },
                }}
                defaultData={defaultData}
                onFinsh={handleFinsh}
                onChange={() => {}}
                form={form}
                layout="vertical"
            />
        </Modal>
    )
}

export default DataForm
