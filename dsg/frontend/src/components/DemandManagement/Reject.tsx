import React, { useEffect } from 'react'
import { Form, Input, Modal } from 'antd'
import { ErrorInfo, keyboardReg } from '@/utils'
import __ from './locale'
import styles from './styles.module.less'

interface IReject {
    open: boolean
    demandId?: string
    onClose: () => void
    onOk: (reason: string) => void
}
const Reject: React.FC<IReject> = ({ open, demandId, onClose, onOk }) => {
    const [form] = Form.useForm()

    useEffect(() => {
        if (!open) {
            form.resetFields()
        }
    }, [open])

    const onFinish = (values) => {
        onOk(values.description)
    }

    return (
        <Modal
            title={__('驳回说明')}
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
                    label={__('说明内容')}
                    name="description"
                    required
                    rules={[
                        {
                            required: true,
                            message: __('驳回说明不能为空'),
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

export default Reject
