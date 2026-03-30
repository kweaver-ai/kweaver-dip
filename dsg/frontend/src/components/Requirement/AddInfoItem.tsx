import React, { useEffect } from 'react'
import { Col, Form, Input, Modal, Row, Select } from 'antd'
import __ from './locale'
import { dataTypes } from './const'
import { ErrorInfo, keyboardReg, nameReg } from '@/utils'
import { IInfoItem } from '@/core'

interface IAddInfoItem {
    open: boolean
    onClose: () => void
    getInfoItem: (values: IInfoItem[]) => void
}
const AddInfoItem: React.FC<IAddInfoItem> = ({
    open,
    onClose,
    getInfoItem,
}) => {
    const [form] = Form.useForm()

    const onFinish = (values) => {
        getInfoItem({ ...values, description: values.desc, desc: undefined })
        onClose()
    }

    useEffect(() => {
        if (!open) {
            onClose()
            form.resetFields()
        }
    }, [open])

    return (
        <Modal
            open={open}
            title={__('添加信息项')}
            onCancel={onClose}
            onOk={() => form.submit()}
            destroyOnClose
            maskClosable={false}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                autoComplete="off"
            >
                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item
                            label={__('信息项名称')}
                            name="item_name"
                            rules={[
                                {
                                    required: true,
                                    message: ErrorInfo.NOTNULL,
                                },
                                {
                                    pattern: nameReg,
                                    message: ErrorInfo.ONLYSUP,
                                },
                            ]}
                        >
                            <Input
                                placeholder={__('请输入信息项名称')}
                                maxLength={128}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label={__('数据类型')}
                            name="data_type"
                            rules={[
                                {
                                    required: true,
                                    message: __('请选择数据类型'),
                                },
                            ]}
                        >
                            <Select
                                placeholder={__('请选择数据类型')}
                                getPopupContainer={(node) => node.parentNode}
                            >
                                {dataTypes.map((type) => (
                                    <Select.Option
                                        value={type.value}
                                        key={type.value}
                                    >
                                        {type.label}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item
                    label={__('描述')}
                    name="desc"
                    rules={[
                        {
                            required: true,
                            message: ErrorInfo.NOTNULL,
                        },
                        {
                            pattern: keyboardReg,
                            message: ErrorInfo.EXCEPTEMOJI,
                        },
                    ]}
                >
                    <Input.TextArea
                        placeholder={__('请输入描述')}
                        style={{ height: 120, resize: 'none' }}
                        maxLength={255}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}
export default AddInfoItem
