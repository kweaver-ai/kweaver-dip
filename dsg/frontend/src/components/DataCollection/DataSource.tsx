import { AutoComplete, Modal, Form } from 'antd'
import * as React from 'react'
import { useState, useEffect } from 'react'
import { trim } from 'lodash'
import { ComponentType, AutoFormConfig } from '@/ui'
import __ from './locale'

interface DataSourceType {
    onConfirm: (values) => void
    onCancel: () => void
    open
    title?: string
    defaultData?: any
}
const DataSource = ({
    onConfirm,
    onCancel,
    open,
    title = __('添加信息系统'),
    defaultData,
}: DataSourceType) => {
    const [form] = Form.useForm()
    useEffect(() => {
        form.resetFields()
    }, [open])
    useEffect(() => {
        form.setFieldsValue(defaultData)
    }, [defaultData])
    const handleFinsh = (values) => {
        onConfirm({
            name: trim(values.name),
        })
    }
    return (
        <Modal
            title={title}
            onCancel={onCancel}
            onOk={() => {
                form.submit()
            }}
            okText={__('确定')}
            open={open}
            maskClosable={false}
        >
            <AutoFormConfig
                config={{
                    name: {
                        label: __('信息系统名称'),
                        type: ComponentType.Input,
                        disabled: false,
                        placeholder: __('请输入信息系统名称'),
                        maxLength: 128,
                        rules: [
                            {
                                required: true,
                                transform: (value) => trim(value),
                                message: __('输入不能为空'),
                            },
                        ],
                    },
                }}
                onFinsh={handleFinsh}
                onChange={() => {}}
                form={form}
                layout="vertical"
                defaultData={defaultData}
            />
        </Modal>
    )
}

export default DataSource
