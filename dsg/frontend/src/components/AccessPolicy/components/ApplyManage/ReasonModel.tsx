import React, { useState, useEffect, useContext } from 'react'
import { Modal, Input, Form } from 'antd'
import __ from '../../locale'
import { formatError } from '@/core'
import styles from './styles.module.less'
import { MicroWidgetPropsContext } from '@/context'

interface IReasonModelType {
    visible?: boolean
    onClose: () => void
    onSure: (any) => void
}

/**
 * 权限申请理由
 * @param visible 显示/隐藏
 * @param onClose 关闭
 * @param onSure 确定
 */
const ReasonModel = ({ visible, onClose, onSure }: IReasonModelType) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState<boolean>(false)
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)

    useEffect(() => {
        if (visible) {
            form.resetFields()
        }
    }, [visible])

    // 对话框onOk
    const handleModalOk = async () => {
        try {
            setLoading(true)
            await form.validateFields()
            const { reason } = form.getFieldsValue()
            onSure(reason)
        } catch (e) {
            if (e.errorFields) {
                return
            }
            formatError(e, microWidgetProps?.components?.toast)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.reasonModel}>
            <Modal
                width={480}
                title={__('申请理由')}
                open={visible}
                maskClosable={false}
                onCancel={onClose}
                onOk={handleModalOk}
                destroyOnClose
                getContainer={false}
                okText={__('提交')}
                cancelText={__('取消')}
                okButtonProps={{ loading }}
            >
                <Form form={form} layout="vertical" autoComplete="off">
                    <Form.Item
                        label={__('申请理由')}
                        name="reason"
                        validateFirst
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[{ required: true, message: '输入不能为空' }]}
                    >
                        <Input.TextArea
                            placeholder={__('请输入发起申请的理由')}
                            style={{ height: 136, resize: `none` }}
                            maxLength={800}
                            autoSize={false}
                            required
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default ReasonModel
