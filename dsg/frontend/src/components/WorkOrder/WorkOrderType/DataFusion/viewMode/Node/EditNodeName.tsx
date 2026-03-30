import React, { useState, useEffect } from 'react'
import { Modal, Input, Form } from 'antd'
import { Graph, Node } from '@antv/x6'
import { trim } from 'lodash'
import __ from '../locale'
import { validateEmpty } from '@/utils/validate'
import { formatError } from '@/core'

interface CreateModelType {
    visible?: boolean
    graph?: Graph
    node?: Node<Node.Properties>
    onClose: () => void
}

/**
 * 编辑节点名称
 * @param visible 显示/隐藏
 * @param graph 画布
 * @param node 待编辑节点
 * @param onClose
 * @returns
 */
const EditNodeName = ({ visible, graph, node, onClose }: CreateModelType) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState<boolean>(false)

    useEffect(() => {
        if (node && visible) {
            const { name } = node.getData()
            if (name) {
                form.setFieldsValue({
                    name,
                })
            }
        }
    }, [visible, node])

    // 保存名称
    const handleSave = async () => {
        try {
            setLoading(true)
            await form.validateFields()
            const values = form.getFieldsValue()
            const { name } = values
            if (node!.data) {
                const dataInfo = {
                    ...node?.data,
                    name: trim(name),
                }
                node!.setData(dataInfo)
            }
            onClose()
        } catch (e) {
            if (e.errorFields) {
                return
            }
            formatError(e)
        } finally {
            setLoading(false)
        }
    }

    // 校验名称唯一性
    const checkNameRepeat = async (value) => {
        if (!graph) return Promise.resolve()
        const name = trim(value)
        const nodes = graph.getNodes()
        for (let i = 0; i < nodes.length; i += 1) {
            if (nodes[i].getData().name === name && nodes[i].id !== node!.id) {
                return Promise.reject(
                    new Error(__('该节点名称已存在，请重新输入')),
                )
            }
        }
        return Promise.resolve()
    }

    return (
        <Modal
            width={640}
            title={__('编辑节点名称')}
            open={visible}
            bodyStyle={{ maxHeight: 444, overflow: 'auto' }}
            maskClosable={false}
            okText={__('确定')}
            cancelText={__('取消')}
            onCancel={() => onClose()}
            onOk={handleSave}
            destroyOnClose
            getContainer={false}
            okButtonProps={{ loading }}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label={__('节点名称')}
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
                            validateTrigger: 'onBlur',
                            validator: (e, value) => checkNameRepeat(value),
                        },
                    ]}
                >
                    <Input
                        placeholder={__('请输入节点名称')}
                        autoComplete="off"
                        maxLength={20}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default EditNodeName
