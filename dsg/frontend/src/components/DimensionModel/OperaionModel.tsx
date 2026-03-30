import React, { useState, useEffect } from 'react'
import { Modal, Input, Form, message, Select } from 'antd'
import __ from './locale'
import { validateEmpty } from '@/utils/validate'
import { OperateType } from '@/utils'
import { createDimensionModel, formatError, updateDimensionModel } from '@/core'
import { IDimModelItem } from '@/core/apis/indicatorManagement/index.d'
import { checkNameRepeat } from './helper'
import { DimensionModule } from './const'

interface IOperaionModelType {
    visible?: boolean
    item?: IDimModelItem
    operate: OperateType
    onClose: () => void
    onSure: (any) => void
}

/**
 * 创建/编辑 维度模型
 * @param visible 显示/隐藏
 * @param operate 操作类型
 * @param item 维度模型item
 * @param onClose 关闭
 * @param onSure 确定
 */
const OperaionModel = ({
    visible,
    operate,
    item,
    onClose,
    onSure,
}: IOperaionModelType) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState<boolean>(false)

    useEffect(() => {
        if (visible) {
            form.resetFields()
        } else {
            setTimeout(() => {
                form.resetFields()
            }, 100)
        }
        if (item && operate === OperateType.BASEEDIT) {
            const { name, dim_module, description } = item
            form.setFieldsValue({ name, dim_module, description })
        }
    }, [visible, item])

    // 对话框onOk
    const handleModalOk = async () => {
        try {
            setLoading(true)
            await form.validateFields()
            const { name, dim_module, description } = form.getFieldsValue()
            let itemInfo
            if (operate === OperateType.CREATE) {
                // 创建模式下直接进入画布
                itemInfo = { name, dim_module, description }
            } else {
                itemInfo = await updateDimensionModel(item?.id!, {
                    name,
                    description,
                })
                message.success(__('编辑成功'))
            }
            onClose()
            onSure(itemInfo)
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
            width={640}
            title={
                operate === OperateType.CREATE
                    ? __('新建维度模型')
                    : __('编辑维度模型')
            }
            open={visible}
            maskClosable={false}
            onCancel={onClose}
            onOk={handleModalOk}
            destroyOnClose
            getContainer={false}
            okText={__('确定')}
            cancelText={__('取消')}
            okButtonProps={{ loading }}
        >
            <Form
                form={form}
                initialValues={{ remember: true }}
                layout="vertical"
                autoComplete="off"
            >
                <Form.Item
                    label={__('维度模型名称')}
                    required
                    name="name"
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            validator: validateEmpty(__('输入不能为空')),
                        },
                        {
                            validateTrigger: ['onBlur'],
                            validator: (e, value) =>
                                checkNameRepeat(value, item?.name),
                        },
                    ]}
                >
                    <Input
                        placeholder={__('请输入维度模型名称')}
                        maxLength={128}
                    />
                </Form.Item>
                <Form.Item label={__('维度模式')} name="dim_module">
                    <Select
                        defaultValue={0}
                        options={DimensionModule}
                        placeholder={__('请选择维度模式')}
                        disabled
                    />
                </Form.Item>
                <Form.Item
                    label={__('描述')}
                    name="description"
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                >
                    <Input.TextArea
                        placeholder={__('请输入描述')}
                        style={{ height: 136, resize: `none` }}
                        maxLength={300}
                        autoSize={false}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default OperaionModel
