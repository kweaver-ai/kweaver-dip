import { Form, Input, Modal, Rate, message } from 'antd'
import React, { useContext, useEffect } from 'react'
import { FrownOutlined, MehOutlined, SmileOutlined } from '@ant-design/icons'
import { MicroWidgetPropsContext } from '@/context'
import { formatError, updateQualityReportReject, updateWorkOrder } from '@/core'

import __ from './locale'
import styles from './styles.module.less'

const RejectModal = ({ item, visible, onClose }: any) => {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [form] = Form.useForm()

    const onFinish = async (values) => {
        const params = values

        try {
            const tip = __('提交成功')

            if (item?.work_order_id) {
                await updateQualityReportReject(item?.work_order_id, params)

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
            title={__('驳回工单')}
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
                    {__('请填写驳回理由')}
                </div>

                <Form.Item
                    name="reject_reason"
                    rules={[{ required: true, message: __('请填写驳回理由') }]}
                >
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

export default RejectModal
