import React, { useEffect } from 'react'
import { Form, Input, Modal, message } from 'antd'
import { ErrorInfo, keyboardReg } from '@/utils'
import __ from './locale'
import styles from './styles.module.less'
import { cancelDemandV2, cancelSSZDDemand, formatError } from '@/core'

interface IRevocate {
    open: boolean
    demandId: string
    onClose: () => void
    onOk: () => void
    isProvince?: boolean
}
const Revocate: React.FC<IRevocate> = ({
    open,
    demandId,
    onClose,
    onOk,
    isProvince = false,
}) => {
    const [form] = Form.useForm()

    useEffect(() => {
        if (!open) {
            form.resetFields()
        }
    }, [open])

    const cityRevocate = async (values) => {
        try {
            await cancelDemandV2(demandId, { canceled_reason: values.reason })
            message.success(__('撤销成功'))
            onOk()
            onClose()
        } catch (error) {
            formatError(error)
        }
    }

    const provinceRevocate = async (values) => {
        try {
            await cancelSSZDDemand(demandId, { cancel_reason: values.reason })
            message.success(__('撤销成功'))
            onOk()
            onClose()
        } catch (error) {
            formatError(error)
        }
    }

    const onFinish = async (values) => {
        if (isProvince) {
            provinceRevocate(values)
        } else {
            cityRevocate(values)
        }
    }

    return (
        <Modal
            title={__('撤销需求')}
            width={640}
            open={open}
            okText={__('提交')}
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
                    label={__('请说明撤销原因')}
                    name="reason"
                    required
                    rules={[
                        {
                            required: true,
                            message: __('撤销原因不能为空'),
                        },
                        {
                            pattern: keyboardReg,
                            message: ErrorInfo.EXCEPTEMOJI,
                        },
                    ]}
                >
                    <Input.TextArea
                        placeholder={__('请输入')}
                        maxLength={300}
                        className={styles['text-area']}
                        showCount
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default Revocate
