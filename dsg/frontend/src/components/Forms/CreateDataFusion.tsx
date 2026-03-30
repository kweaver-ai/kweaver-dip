import { Button, Form, Input, Modal, Space } from 'antd'
import { FC } from 'react'
import { trim } from 'lodash'
import __ from './locale'
import styles from './styles.module.less'
import { checkNameRepeat } from './helper'
import { ErrorInfo } from '@/utils'
import { formatError, formsCreate } from '@/core'
import { FormTableKind, NewFormType } from './const'

interface CreateDataFusionProps {
    visible: boolean
    onClose: () => void
    onConfirm: () => void
    mid: string
    taskId?: string
}

const CreateDataFusion: FC<CreateDataFusionProps> = ({
    visible,
    onClose,
    onConfirm,
    mid,
    taskId,
}) => {
    const [form] = Form.useForm()

    const handleConfirmForm = async (values) => {
        try {
            // 发送请求
            await formsCreate(mid, {
                ...values,
                table_kind: FormTableKind.DATA_FUSION,
                task_id: taskId,
            })
            onConfirm()
        } catch (err) {
            formatError(err)
        }
    }
    return (
        <Modal
            title={__('新建数据融合表')}
            width={640}
            onCancel={onClose}
            footer={
                <Space size={8}>
                    <Button onClick={onClose}>{__('取消')}</Button>
                    <Button
                        onClick={() => {
                            form.submit()
                        }}
                        type="primary"
                    >
                        {__('确定')}
                    </Button>
                </Space>
            }
            open={visible}
        >
            <Form
                form={form}
                layout="vertical"
                autoComplete="off"
                onFinish={handleConfirmForm}
            >
                <Form.Item
                    name="name"
                    label={__('表业务名称')}
                    required
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            message: ErrorInfo.NOTNULL,
                            transform: (value: string) => trim(value),
                            // validator: validateName(),
                        },
                        // {
                        //     validateTrigger: ['onBlur'],
                        //     validator: (e, value) =>
                        //         checkNameCorrect(e, value),
                        // },
                        {
                            validateTrigger: ['onBlur'],
                            validator: (e, value) =>
                                checkNameRepeat(mid, value),
                        },
                    ]}
                >
                    <Input
                        placeholder={__('请输入表业务名称')}
                        autoComplete="off"
                        maxLength={128}
                    />
                </Form.Item>
                <Form.Item
                    name="technical_name"
                    label={__('表技术名称')}
                    required
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            message: ErrorInfo.NOTNULL,
                            transform: (value: string) => trim(value),
                            // validator: validateName(),
                        },
                        // {
                        //     validateTrigger: ['onBlur'],
                        //     validator: (e, value) =>
                        //         checkNameCorrect(e, value),
                        // },
                        // {
                        //     validateTrigger: ['onBlur'],
                        //     validator: (e, value) =>
                        //         checkNameRepeat(mid, value),
                        // },
                    ]}
                >
                    <Input
                        placeholder={__('请输入表技术名称')}
                        autoComplete="off"
                        maxLength={128}
                    />
                </Form.Item>
                <Form.Item
                    label={__('描述')}
                    name="description"
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            transform: (value: string) => trim(value),
                            // validateTrigger: ['onBlur'],
                            // validator: (e, value) => checkNormalInput(e, value),
                        },
                    ]}
                >
                    <Input.TextArea
                        placeholder={__('请输入描述')}
                        style={{
                            height: `100px`,
                            resize: 'none',
                        }}
                        autoComplete="off"
                        maxLength={255}
                        autoSize={false}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default CreateDataFusion
