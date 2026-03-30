import { Form, Input, Modal, message } from 'antd'
import { useContext } from 'react'
import { MicroWidgetPropsContext } from '@/context'
import { formatError, updateWorkOrderStatus } from '@/core'

import __ from './locale'
import styles from './styles.module.less'
import { StatusType } from '../../helper'

const CompleteModal = ({ item, visible, onClose }: any) => {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [form] = Form.useForm()

    const onFinish = async (values) => {
        const params = { status: StatusType.COMPLETED, ...values }

        try {
            const tip = __('提交成功')

            if (item?.work_order_id) {
                await updateWorkOrderStatus(item?.work_order_id, params)

                if (microWidgetProps?.components?.toast) {
                    microWidgetProps?.components?.toast.success(tip)
                } else {
                    message.success(tip)
                }
            }

            onClose?.(true)
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        }
    }

    return (
        <Modal
            title={__('完成工单')}
            open={visible}
            onCancel={() => onClose(false)}
            maskClosable={false}
            destroyOnClose
            getContainer={false}
            onOk={() => {
                form.submit()
            }}
            width={560}
            bodyStyle={{ maxHeight: 360, overflow: 'auto', padding: '16px' }}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                autoComplete="off"
                className={styles.form}
            >
                <div style={{ marginBottom: '16px' }}>
                    {__('请填写处理说明（选填）')}
                </div>

                <Form.Item name="processing_instructions">
                    <Input.TextArea
                        style={{
                            height: 100,
                            resize: 'none',
                        }}
                        maxLength={300}
                        className={styles['show-count']}
                        placeholder={__('请输入')}
                        showCount
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default CompleteModal
