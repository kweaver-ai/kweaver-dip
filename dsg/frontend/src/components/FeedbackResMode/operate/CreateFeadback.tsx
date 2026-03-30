import { useEffect, useState } from 'react'
import { Form, Input, Modal, Radio } from 'antd'
import { formatError, postFeedbackResMode, ResType } from '@/core'
import { feedbackTypeOptions } from '../helper'
import __ from '../locale'

interface IReply {
    open: boolean
    item: any
    resType: ResType
    onCreateSuccess: () => void
    onCreateClose: () => void
}

const CreateFeadback = ({
    open,
    item,
    resType,
    onCreateSuccess,
    onCreateClose,
}: IReply) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        form.setFieldsValue({
            res_title:
                item?.raw_name ||
                item?.name ||
                item?.business_name ||
                item?.service_name ||
                item?.raw_title,
        })
    }, [item])

    const onFinish = async (values) => {
        if (loading) return

        setLoading(true)
        const { feedback_type, feedback_desc } = values
        const params = {
            feedback_type,
            feedback_desc,
            res_id: item?.id,
            res_type: resType,
        }
        try {
            await postFeedbackResMode(params)
            onCreateSuccess()
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    const handleClickSubmit = async () => {
        if (loading) return

        try {
            await form.validateFields()
            form.submit()
        } catch (error) {
            // console.log(error)
        }
    }

    // 点击弹窗阻止冒泡
    const renderModalContent = (node) => {
        return (
            <div
                onClick={(e) => {
                    e.stopPropagation()
                }}
            >
                {node}
            </div>
        )
    }

    return (
        <Modal
            open={open}
            title={__('新建反馈')}
            width="800px"
            destroyOnClose
            maskClosable={false}
            onOk={handleClickSubmit}
            onCancel={onCreateClose}
            modalRender={renderModalContent}
            wrapProps={{
                onClick: (e) => {
                    e.stopPropagation()
                },
            }}
            zIndex={1002}
            confirmLoading={loading}
        >
            <Form
                name="create"
                form={form}
                layout="vertical"
                wrapperCol={{ span: 24 }}
                initialValues={{ remember: true }}
                onFinish={onFinish}
                autoComplete="off"
            >
                <Form.Item label={__('数据资源名称')} name="res_title">
                    <Input disabled />
                </Form.Item>
                <Form.Item
                    label={__('反馈类型')}
                    name="feedback_type"
                    rules={[
                        {
                            required: true,
                            message: __('输入不能为空'),
                        },
                    ]}
                >
                    <Radio.Group>
                        {feedbackTypeOptions
                            .filter((i) => i.value !== '')
                            .map((i) => (
                                <Radio key={i.value} value={i.value}>
                                    {i.label}
                                </Radio>
                            ))}
                    </Radio.Group>
                </Form.Item>
                <Form.Item
                    label={__('反馈描述')}
                    name="feedback_desc"
                    rules={[
                        {
                            required: true,
                            message: __('输入不能为空'),
                        },
                    ]}
                >
                    <Input.TextArea
                        style={{
                            height: 64,
                            resize: 'none',
                        }}
                        maxLength={300}
                        placeholder={__('请输入')}
                        showCount
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default CreateFeadback
