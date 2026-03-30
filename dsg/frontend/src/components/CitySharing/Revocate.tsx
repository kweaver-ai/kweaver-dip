import React, { useEffect } from 'react'
import { Form, Input, Modal, message } from 'antd'
import { ErrorInfo, keyboardReg } from '@/utils'
import __ from './locale'
import styles from './styles.module.less'
import {
    cancelCityShareApply,
    cancelDemandV2,
    cancelSSZDDemand,
    formatError,
} from '@/core'

interface IRevocate {
    open: boolean
    applyId: string
    onClose: () => void
    onOk: () => void
}
const Revocate: React.FC<IRevocate> = ({ open, applyId, onClose, onOk }) => {
    const [form] = Form.useForm()

    useEffect(() => {
        if (!open) {
            form.resetFields()
        }
    }, [open])

    const revocate = async (values) => {
        try {
            await cancelCityShareApply(applyId, {
                cancel_reason: values.reason,
            })
            message.success(__('撤回成功'))
            onOk()
            onClose()
        } catch (error) {
            formatError(error)
        }
    }

    const onFinish = async (values) => {
        revocate(values)
    }

    return (
        <Modal
            title={__('撤回申请')}
            width={640}
            open={open}
            okText={__('确定')}
            onCancel={onClose}
            onOk={() => form.submit()}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                autoComplete="off"
                className={styles['revocate-form']}
            >
                <Form.Item
                    label={__('请说明撤回原因')}
                    name="reason"
                    required
                    rules={[
                        {
                            required: true,
                            message: ErrorInfo.NOTNULL,
                        },
                    ]}
                >
                    <Input.TextArea
                        placeholder={__('请输入')}
                        maxLength={200}
                        className={styles['text-area']}
                        showCount
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default Revocate
