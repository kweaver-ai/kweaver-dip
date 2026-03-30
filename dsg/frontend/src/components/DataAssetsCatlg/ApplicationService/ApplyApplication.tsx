import React, { useEffect, useState } from 'react'
import { Form, Input, message, Modal, Radio } from 'antd'
import { addApiApply, formatError } from '@/core'
import { ErrorInfo, keyboardReg } from '@/utils'
import __ from '../locale'
import styles from '../styles.module.less'
import { validateEmpty } from '@/utils/validate'

interface IApplyApplication {
    id: string
    open: boolean
    onClose: () => void
    onOk: () => void
}
const ApplyApplication: React.FC<IApplyApplication> = ({
    id,
    open,
    onClose,
    onOk,
}) => {
    const [form] = Form.useForm()

    const onFinish = async (values) => {
        try {
            const { apply_reason, apply_days } = values
            await addApiApply({ service_id: id, apply_reason, apply_days })
            message.success(__('操作成功'))
            onOk()
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (!open) {
            form.resetFields()
        }
    }, [open])

    const [onTextAreaFocus, setOnTextAreaFocus] = useState(false)

    return (
        <Modal
            title={__('申请API')}
            open={open}
            width={520}
            className={styles.applyAccessModal}
            onCancel={onClose}
            onOk={() => {
                form.submit()
            }}
            destroyOnClose
            maskClosable={false}
            wrapProps={{
                onClick: (e) => {
                    e.stopPropagation()
                },
            }}
            zIndex={1001}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                className={styles.applyForm}
            >
                <Form.Item label="有效期" name="apply_days" initialValue={0}>
                    <Radio.Group>
                        <Radio disabled value={0}>
                            永久
                        </Radio>
                        {/* <Radio value={7}>7天</Radio>
                        <Radio value={15}>15天</Radio>
                        <Radio value={30}>30天</Radio> */}
                    </Radio.Group>
                </Form.Item>
                <Form.Item
                    label="申请理由"
                    required
                    name="apply_reason"
                    rules={[
                        {
                            required: true,
                            message: ErrorInfo.NOTNULL,
                            validator: validateEmpty(ErrorInfo.NOTNULL),
                        },
                        {
                            pattern: keyboardReg,
                            message: ErrorInfo.EXCEPTEMOJI,
                        },
                    ]}
                >
                    <Input.TextArea
                        className={styles.showCount}
                        style={{
                            height: 104,
                            resize: 'none',
                            borderColor: onTextAreaFocus ? '#3a8ff0' : '',
                            boxShadow: onTextAreaFocus
                                ? '0 0 0 2px rgb(18 110 227 / 20%)'
                                : '',
                        }}
                        onFocus={() => {
                            setOnTextAreaFocus(true)
                        }}
                        onBlur={() => {
                            setOnTextAreaFocus(false)
                        }}
                        placeholder="请输入"
                        showCount
                        maxLength={800}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default ApplyApplication
