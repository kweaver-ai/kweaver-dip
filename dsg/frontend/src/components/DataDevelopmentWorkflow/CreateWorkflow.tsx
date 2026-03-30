import React, { useEffect, useState } from 'react'
import { Form, Input, message, Modal } from 'antd'
import { trim } from 'lodash'
import styles from './styles.module.less'
import { editWorkFlow, formatError } from '@/core'
import { ErrorInfo, keyboardCharactersReg } from '@/utils'
import __ from './locale'
import { OperateType } from './const'
import { checkNameRepeat } from './helper'
import { validateName, validateTextLegitimacy } from '@/utils/validate'

interface ICreateWorkflow {
    visible: boolean
    operate?: OperateType
    item?: any
    taskId?: string
    onClose: () => void
    onSure: (any) => void
}

/**
 * 创建/编辑 工作流
 * @param visible 显示/隐藏
 * @param operate 操作类型
 * @param item 工作流
 * @param onClose 关闭
 * @param onSure 确定
 */
const CreateWorkflow: React.FC<ICreateWorkflow> = ({
    visible,
    operate,
    item,
    taskId,
    onClose,
    onSure,
}) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (item && operate !== OperateType.CREATE) {
            const { name, description } = item
            form.setFieldsValue({ name, description })
            return
        }
        form.resetFields()
    }, [visible])

    // 对话框onCancel
    const handleModalCancel = () => {
        onClose()
        form.resetFields()
    }

    // 对话框onOk
    const handleModalOk = async () => {
        try {
            setLoading(true)
            await form.validateFields()
            const { name, description } = form.getFieldsValue()
            if (operate === OperateType.CREATE) {
                onSure({ name, description })
            } else {
                const res = await editWorkFlow(item?.id || '', {
                    name,
                    description,
                    task_id: taskId,
                })
                message.success(__('编辑成功'))
                handleModalCancel()
                onSure({ name, description })
            }
        } catch (e) {
            if (e.errorFields) {
                return
            }
            formatError(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            title={`${
                operate === OperateType.CREATE
                    ? __('新建工作流')
                    : __('编辑基本信息')
            }`}
            width={640}
            maskClosable={false}
            open={visible}
            onCancel={handleModalCancel}
            onOk={handleModalOk}
            destroyOnClose
            getContainer={false}
            okButtonProps={{ loading }}
        >
            <Form
                form={form}
                layout="vertical"
                autoComplete="off"
                initialValues={{ remember: true }}
            >
                <Form.Item
                    label={__('工作流名称')}
                    name="name"
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            validateTrigger: 'onChange',
                            validator: validateName(),
                        },
                        {
                            validateTrigger: ['onBlur'],
                            validator: (e, value) =>
                                checkNameRepeat(value, item?.name, item?.id),
                        },
                    ]}
                >
                    <Input
                        placeholder={__('请输入工作流名称')}
                        maxLength={128}
                    />
                </Form.Item>
                <Form.Item label={__('描述')} name="description">
                    <Input.TextArea
                        style={{ height: 136, resize: `none` }}
                        placeholder={__('请输入描述')}
                        maxLength={300}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default CreateWorkflow
