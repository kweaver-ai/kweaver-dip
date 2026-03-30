import React, { useState, useEffect } from 'react'
import { Modal, Input, Form, message, ModalProps } from 'antd'
import __ from '../locale'
import {
    formatError,
    IShareApplyBasic,
    putShareApplyEscalateAuditCancel,
} from '@/core'

interface IRevokeModal extends ModalProps {
    data?: IShareApplyBasic
    open: boolean
    onOk: (value) => void
}

/**
 * 撤销需求
 */
const RevokeModal = ({ data, open, onOk, ...props }: IRevokeModal) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState<boolean>(false)

    useEffect(() => {
        form.resetFields()
    }, [open])

    // 撤销请求
    const handleOk = async () => {
        if (!data?.id) return
        try {
            setLoading(true)
            await form.validateFields()
            const { cancel_reason } = form.getFieldsValue()
            await putShareApplyEscalateAuditCancel(data.id, cancel_reason)
            message.success(__('撤销成功'))
            onOk(cancel_reason)
        } catch (e) {
            if (e.errorFields) {
                return
            }
            formatError(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            width={640}
            open={open}
            title={__('撤销申请')}
            maskClosable={false}
            destroyOnClose
            getContainer={false}
            okText={__('确定')}
            cancelText={__('取消')}
            okButtonProps={{ loading, style: { minWidth: 80 } }}
            cancelButtonProps={{ style: { minWidth: 80 } }}
            onOk={() => handleOk()}
            {...props}
        >
            <Form
                form={form}
                initialValues={{ remember: true }}
                layout="vertical"
                autoComplete="off"
            >
                <Form.Item
                    label={__('请说明撤销原因')}
                    name="cancel_reason"
                    validateFirst
                    rules={[
                        {
                            required: true,
                            message: __('撤销原因不能为空'),
                        },
                    ]}
                >
                    <Input.TextArea
                        placeholder={__('请输入')}
                        autoSize={{ minRows: 5, maxRows: 5 }}
                        showCount
                        maxLength={300}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default RevokeModal
