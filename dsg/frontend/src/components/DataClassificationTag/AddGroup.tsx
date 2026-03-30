import React, { useEffect, useState } from 'react'
import { Drawer, Form, Input, Button, TreeSelect, message } from 'antd'
import { trim } from 'lodash'
import __ from './locale'
import styles from './styles.module.less'
import { OperateType } from '@/utils'
import ConfigColor from './ConfigColor'
import {
    IGradeLabel,
    checkGradeLabelName,
    createDataGradeLabel,
    formatError,
    getDataGradeLabel,
} from '@/core'
import { CreateType, generateData } from './const'
import { generateFullPathData } from '../FormGraph/helper'

interface IAddGroup {
    open: boolean
    onClose: () => void
    operateType: OperateType
    onSuccess?: () => void
    data?: IGradeLabel
}
const AddGroup: React.FC<IAddGroup> = ({
    open,
    onClose,
    operateType,
    onSuccess = () => {},
    data,
}) => {
    const [form] = Form.useForm()
    const [dataSource, setDataSource] = useState<
        (IGradeLabel | { name: string; id: string })[]
    >([])
    const [loading, setLoading] = useState(false)

    // 查询
    const getTable = async () => {
        try {
            const res = await getDataGradeLabel({
                keyword: '',
                is_show_label: false,
            })
            generateFullPathData(res.entries, [])
            generateData(
                res.entries,
                (item) => item.id === data?.id || item.path?.includes(data?.id),
            )
            setDataSource([
                ...res.entries.map((item) => ({
                    ...item,
                    children: [],
                })),
                { name: __('无'), id: '1' },
            ])
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (data && operateType === OperateType.EDIT) {
            form.setFieldsValue({
                name: data.name,
                parentId: data.parent_id,
                description: data.description,
            })
        }
    }, [data])

    useEffect(() => {
        if (open) {
            getTable()
        }
    }, [open])

    const onFinish = async (values) => {
        try {
            setLoading(true)
            await createDataGradeLabel({
                ...values,
                nodeType: CreateType.Group,
                id: data?.id,
            })
            message.success(data ? __('编辑成功') : __('新建成功'))
            onClose()
            onSuccess()
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    const validateNameRepeat = async (value: string): Promise<void> => {
        const trimValue = trim(value)
        try {
            const res = await checkGradeLabelName({
                id: operateType === OperateType.CREATE ? '' : data?.id,
                name: trimValue,
                node_type: CreateType.Group,
            })
            if (res) {
                return Promise.reject(
                    new Error(__('该标签组名称已存在，请重新输入')),
                )
            }
            return Promise.resolve()
        } catch (error) {
            formatError(error)
            return Promise.resolve()
        }
    }

    return (
        <Drawer
            open={open}
            onClose={onClose}
            width={640}
            title={
                operateType === OperateType.CREATE
                    ? __('新建标签组')
                    : __('编辑标签组')
            }
            bodyStyle={{ padding: '0' }}
            className={styles['add-tag-wrapper']}
            footer={null}
            maskClosable={false}
        >
            <Form
                form={form}
                onFinish={onFinish}
                autoComplete="off"
                layout="vertical"
                className={styles['form-wrapper']}
            >
                <Form.Item
                    label={__('标签组名称')}
                    name="name"
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    style={{ marginTop: '20px' }}
                    rules={[
                        {
                            required: true,
                            message: __('输入不能为空'),
                        },

                        {
                            validateTrigger: ['onBlur'],
                            validator: (e, value) => validateNameRepeat(value),
                        },
                    ]}
                >
                    <Input
                        placeholder={__('请输入标签组名称')}
                        maxLength={128}
                    />
                </Form.Item>
                <Form.Item
                    label={__('父级标签组')}
                    name="parentId"
                    initialValue="1"
                >
                    <TreeSelect
                        popupClassName={styles['common-tree-select']}
                        getPopupContainer={(node) => node.parentNode}
                        fieldNames={{ label: 'name', value: 'id' }}
                        treeData={dataSource}
                    />
                </Form.Item>

                <Form.Item label={__('描述')} name="description">
                    <Input.TextArea
                        placeholder={__('请输入描述')}
                        maxLength={300}
                        showCount
                        className={styles.textarea}
                    />
                </Form.Item>
            </Form>
            <div className={styles.footer}>
                <Button onClick={onClose}>{__('取消')}</Button>
                <Button
                    type="primary"
                    loading={loading}
                    onClick={() => form.submit()}
                >
                    {__('确定')}
                </Button>
            </div>
        </Drawer>
    )
}

export default AddGroup
