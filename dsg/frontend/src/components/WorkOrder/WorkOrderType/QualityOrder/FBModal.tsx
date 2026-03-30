import { FrownOutlined, MehOutlined, SmileOutlined } from '@ant-design/icons'
import { Form, Input, Modal, Rate, message } from 'antd'
import React, { useContext, useEffect } from 'react'
import { formatError, updateQualityReportFeedback } from '@/core'
import { MicroWidgetPropsContext } from '@/context'

import __ from './locale'
import styles from './styles.module.less'

const scoreIcons: Record<number, React.ReactNode> = {
    1: <FrownOutlined />,
    2: <FrownOutlined />,
    3: <MehOutlined />,
    4: <SmileOutlined />,
    5: <SmileOutlined />,
}
const FeedbackModal = ({ item, visible, onClose }: any) => {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [form] = Form.useForm()

    useEffect(() => {
        if (item) {
            const { score } = item
            form?.setFieldsValue({
                score: score || 3,
            })
        } else {
            form?.resetFields()
        }
    }, [item, form])

    const onFinish = async (values) => {
        const params = values

        try {
            const tip = __('提交成功')

            if (item?.work_order_id) {
                await updateQualityReportFeedback(item?.work_order_id, params)

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
            title={__('反馈')}
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
                <div style={{ marginBottom: '12px' }}>
                    {__('这次整改结果是否满意?')}
                </div>
                <Form.Item
                    name="score"
                    rules={[{ required: true, message: __('请选择评分') }]}
                >
                    <Rate
                        defaultValue={3}
                        character={(props) =>
                            scoreIcons[(props?.index ?? 0) + 1]
                        }
                    />
                </Form.Item>
                <Form.Item name="feedback_content">
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

export default FeedbackModal
