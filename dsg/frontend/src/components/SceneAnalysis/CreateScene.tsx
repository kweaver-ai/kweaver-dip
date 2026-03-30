import React, { useState, useEffect } from 'react'
import { Modal, Input, Form, message, TreeSelect } from 'antd'
import { useNavigate } from 'react-router-dom'
import __ from './locale'
import { validateEmpty } from '@/utils/validate'
import { OperateType } from '@/utils'
import {
    ISceneItem,
    createSceneAnalysis,
    editSceneAnalysis,
    formatError,
    getSceneCatalogTree,
    ICatalogItem,
} from '@/core'
import { checkNameRepeat, sceneAnalFormatError } from './helper'
import { ModuleType } from './const'

interface CreateModelType {
    visible?: boolean
    item?: ISceneItem
    operate: OperateType
    selectedCatalog?: ICatalogItem
    onClose: (isError: boolean) => void
    onSure: (any) => void
}

/**
 * 创建/编辑 场景分析
 * @param visible 显示/隐藏
 * @param operate 操作类型
 * @param item 场景item
 * @param onClose 关闭
 * @param onSure 确定
 */
const CreateScene = ({
    visible,
    operate,
    item,
    selectedCatalog,
    onClose,
    onSure,
}: CreateModelType) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState<boolean>(false)
    const [catalogTreeData, setCatalogTreeData] = useState<ICatalogItem[]>([])
    const [treeLoading, setTreeLoading] = useState<boolean>(false)
    const navigator = useNavigate()

    // 获取分类树数据（使用 mock 数据）
    const fetchCatalogTree = async () => {
        try {
            setTreeLoading(true)
            const res = await getSceneCatalogTree()
            setCatalogTreeData(res?.catalog_node || [])
        } catch (error) {
            formatError(error)
            setCatalogTreeData([])
        } finally {
            setTreeLoading(false)
        }
    }

    useEffect(() => {
        if (visible) {
            fetchCatalogTree()
        }
    }, [visible])

    useEffect(() => {
        if (item && operate === OperateType.EDIT) {
            if (visible) {
                const { name, desc, catalog_id } = item
                form.setFieldsValue({ name, desc, catalog_id })
            }
            return
        }
        if (operate === OperateType.CREATE && !visible) {
            return
        }
        form.resetFields()
        // 新建时回填分类信息
        if (operate === OperateType.CREATE && visible && selectedCatalog) {
            form.setFieldsValue({
                catalog_id: selectedCatalog?.id,
            })
        }
    }, [visible, item, operate, selectedCatalog, form])

    // 对话框onCancel
    const handleModalCancel = () => {
        onClose(false)
        form.resetFields()
    }

    // 对话框onOk
    const handleModalOk = async () => {
        try {
            setLoading(true)
            await form.validateFields()
            const { name, desc, catalog_id } = form.getFieldsValue()
            let itemInfo
            if (operate === OperateType.CREATE) {
                itemInfo = await createSceneAnalysis({
                    name,
                    desc,
                    catalog_id,
                })
            } else {
                itemInfo = await editSceneAnalysis({
                    id: item?.id || '',
                    name,
                    desc,
                    catalog_id,
                })
                message.success(__('编辑成功'))
            }
            onClose(false)
            onSure(itemInfo)
        } catch (e) {
            if (e.errorFields) {
                return
            }
            sceneAnalFormatError(ModuleType.SceneAnalysis, navigator, e, () => {
                onClose(true)
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            width={640}
            title={
                operate === OperateType.CREATE
                    ? __('新建场景分析')
                    : __('编辑基本信息')
            }
            open={visible}
            maskClosable={false}
            onCancel={handleModalCancel}
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
                    label={__('场景分析名称')}
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
                                checkNameRepeat(value, item?.name, item?.id),
                        },
                    ]}
                >
                    <Input
                        placeholder={__('请输入场景分析名称')}
                        maxLength={128}
                    />
                </Form.Item>
                <Form.Item
                    label={__('场景分类')}
                    required
                    name="catalog_id"
                    rules={[
                        {
                            required: true,
                            message: __('请选择场景分类'),
                        },
                    ]}
                >
                    <TreeSelect
                        placeholder={__('请选择场景分类')}
                        treeData={catalogTreeData}
                        fieldNames={{
                            label: 'catalog_name',
                            value: 'id',
                            children: 'children',
                        }}
                        treeDefaultExpandAll
                        showSearch
                        allowClear
                        loading={treeLoading}
                        treeNodeFilterProp="catalog_name"
                        style={{ width: '100%' }}
                    />
                </Form.Item>
                <Form.Item
                    label={__('描述')}
                    name="desc"
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

export default CreateScene
