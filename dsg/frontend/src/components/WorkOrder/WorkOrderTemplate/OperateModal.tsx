import { Form, Input, Modal, Select } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import React, { useEffect } from 'react'
import { TicketTypeOptions } from './helper'
import __ from './locale'

interface OperateModalProps {
    visible: boolean
    item?: any
    onCancel: () => void
    onSubmit: (values: any) => void
}

const { TextArea } = Input

const OperateModal: React.FC<OperateModalProps> = ({
    visible,
    item,
    onCancel,
    onSubmit,
}) => {
    const [form] = useForm()

    useEffect(() => {
        if (visible && item) {
            form.setFieldsValue({
                template_name: item.template_name,
                description: item.description,
                ticket_type: item.ticket_type,
            })
        } else if (visible) {
            form.resetFields()
        }
    }, [visible, item, form])

    const handleSubmit = async (values: any) => {
        const params = values
        if (item) {
            params.ticket_type = item?.ticket_type
        }
        onSubmit(params)
    }

    const handleCancel = () => {
        form.resetFields()
        onCancel()
    }

    return (
        <Modal
            title={item ? __('编辑基本信息') : __('添加工单模板')}
            open={visible}
            onOk={() => {
                form.submit()
            }}
            onCancel={handleCancel}
            okText={__('确定')}
            cancelText={__('取消')}
            width={600}
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                {item ? (
                    <div
                        style={{
                            marginBottom: 16,
                            color: 'rgba(0, 0, 0, 0.85)',
                        }}
                    >
                        <span
                            style={{
                                color: 'rgba(0, 0, 0, 0.65)',
                                marginRight: 8,
                            }}
                        >
                            {__('工单类型')}:
                        </span>
                        {
                            TicketTypeOptions.find(
                                (option) => option.value === item?.ticket_type,
                            )?.label
                        }
                    </div>
                ) : (
                    <Form.Item
                        name="ticket_type"
                        label={__('工单类型')}
                        rules={[
                            { required: !item, message: __('请选择工单类型') },
                        ]}
                    >
                        <Select
                            placeholder={__('请选择工单类型')}
                            options={TicketTypeOptions}
                        />
                    </Form.Item>
                )}
                <Form.Item
                    name="template_name"
                    label={__('工单模板名称')}
                    rules={[
                        { required: true, message: __('请输入工单模板名称') },
                    ]}
                >
                    <Input
                        placeholder={__('请输入工单模板名称')}
                        maxLength={128}
                    />
                </Form.Item>

                <Form.Item name="description" label={__('描述')}>
                    <TextArea
                        placeholder={__('请输入工单模板描述')}
                        rows={3}
                        showCount
                        maxLength={300}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default OperateModal
