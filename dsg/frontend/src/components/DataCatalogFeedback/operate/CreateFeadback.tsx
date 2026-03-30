import { useEffect } from 'react'
import { Form, Input, Modal } from 'antd'
import { formatError, postFeedback, DataDictType } from '@/core'
import DictionarySelect from '@/ui/DictionarySelect'
import __ from '../locale'

interface IReply {
    open: boolean
    item: any
    onCreateSuccess: () => void
    onCreateClose: () => void
}

const CreateFeadback = ({
    open,
    item,
    onCreateSuccess,
    onCreateClose,
}: IReply) => {
    const [form] = Form.useForm()

    useEffect(() => {
        form.setFieldsValue({
            catalog_title: item?.raw_name || item?.name,
        })
    }, [item])

    const onFinish = async (values) => {
        const { feedback_type, feedback_desc } = values
        const params = {
            feedback_type,
            feedback_desc,
            catalog_id: item?.id,
        }
        try {
            await postFeedback(params)
            onCreateSuccess()
        } catch (error) {
            formatError(error)
        }
    }

    const handleClickSubmit = async () => {
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
                    e.preventDefault()
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
                    e.preventDefault()
                },
            }}
            zIndex={1002}
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
                <Form.Item label={__('数据资源目录名称')} name="catalog_title">
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
                    <DictionarySelect
                        dictType={DataDictType.CatalogFeedbackType}
                    />
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
