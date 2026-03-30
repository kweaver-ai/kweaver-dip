import React, { useEffect, useMemo } from 'react'
import { Modal, Form, Input, message } from 'antd'
import {
    addSceneCatalog,
    updateSceneCatalog,
    formatError,
    ICatalogItem,
    checkSceneCatalogName,
} from '@/core'
import __ from '../locale'

interface ICreate {
    // 是否可见
    visible: boolean
    // 父分类id（新建子分类时传入）
    parent_id?: string
    // 重命名时传入的节点
    editNode?: ICatalogItem
    // 取消回调
    onCancel: () => void
    // 成功回调，重命名时传递新名称
    onSuccess?: (newName?: string) => void
}

/**
 * 新建/重命名分类目录弹窗组件
 */
const Create: React.FC<ICreate> = ({
    visible,
    parent_id,
    editNode,
    onCancel,
    onSuccess,
}) => {
    const [form] = Form.useForm()
    const isEditMode = !!editNode

    // 计算最终的父级ID
    const finalParentId = useMemo(() => {
        return isEditMode ? editNode?.parent_id : parent_id!
    }, [isEditMode, editNode?.parent_id, parent_id])

    useEffect(() => {
        if (visible) {
            if (isEditMode) {
                // 重命名模式，设置初始值
                form.setFieldsValue({
                    catalog_name: editNode?.catalog_name,
                })
            } else {
                // 新建模式，重置表单
                form.resetFields()
            }
        } else {
            form.resetFields()
        }
    }, [visible, isEditMode, editNode, form])

    // 提交新建/重命名目录
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()
            const { catalog_name } = values

            if (isEditMode) {
                // 重命名模式
                await updateSceneCatalog(editNode.id, { catalog_name })
                message.success(__('重命名成功'))
                form.resetFields()
                onSuccess?.(catalog_name) // 传递新名称
                onCancel()
            } else {
                // 新建模式：parent_id 在 handleAddRoot 中已设置为固定值，在 handleAddChild 中为节点id
                await addSceneCatalog({
                    catalog_name,
                    parent_id: finalParentId,
                })
                message.success(__('新建成功'))
                form.resetFields()
                onSuccess?.()
                onCancel()
            }
        } catch (error: any) {
            // checkNameRepeat 的错误会通过表单验证抛出，不应该使用 formatError 提示
            if (!error?.errorFields) {
                formatError(error)
            }
        }
    }

    const checkNameRepeat = async (value: string) => {
        if (!value) {
            return Promise.resolve()
        }
        try {
            // 编辑模式：使用编辑节点的父级id，如果为空则使用固定值
            // 新建模式：parent_id 在 handleAddRoot 中已设置为固定值，在 handleAddChild 中为节点id
            const res = await checkSceneCatalogName({
                parent_id: finalParentId,
                name: value,
                id: isEditMode ? editNode?.id : undefined,
            })
            if (res.repeat) {
                return Promise.reject(new Error(__('名称已存在，请重新输入')))
            }
            return Promise.resolve()
        } catch (error) {
            return Promise.reject(new Error(__('名称已存在，请重新输入')))
        }
    }

    return (
        <Modal
            title={isEditMode ? __('重命名') : __('新建场景分类')}
            open={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            destroyOnClose
        >
            <Form form={form} layout="horizontal">
                <Form.Item
                    label={__('场景分类名称')}
                    name="catalog_name"
                    rules={[
                        {
                            required: true,
                            message: __('请输入场景分类名称'),
                            validateTrigger: 'onChange',
                        },
                        {
                            validator: (_, value) => {
                                return checkNameRepeat(value)
                            },
                            validateTrigger: 'onBlur',
                        },
                    ]}
                >
                    <Input
                        placeholder={__('请输入')}
                        maxLength={20}
                        onBlur={() => {
                            form.validateFields(['catalog_name'])
                        }}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default Create
