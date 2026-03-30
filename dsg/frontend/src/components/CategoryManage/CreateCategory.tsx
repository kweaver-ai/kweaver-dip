import { Form, Input, message, Modal } from 'antd'
import React, { useEffect, useState } from 'react'

import { InfoCircleFilled } from '@ant-design/icons'
import { trim } from 'lodash'
import {
    formatError,
    getCategoryNameCheck,
    ICategoryItem,
    postCategory,
    putCategoryItem,
} from '@/core'
import { commReg, keyboardReg } from '@/utils'
import { info } from '@/utils/modalHelper'
import { OperateType } from './helper'
import __ from './locale'
import styles from './styles.module.less'

interface ICreateCategory {
    // 显示/隐藏
    visible: boolean
    // 操作类型
    operate?: OperateType
    // 操作类目
    item?: ICategoryItem
    onClose: () => void
    onSure: (any) => void
}

/**
 * 创建/编辑 类目
 */
const CreateCategory: React.FC<ICreateCategory> = ({
    visible,
    operate,
    item,
    onClose,
    onSure,
}) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (item && operate === OperateType.EDIT) {
            if (visible) {
                const { name, describe } = item
                form.setFieldsValue({ name, describe })
            }
            return
        }
        if (operate === OperateType.CREATE && !visible) {
            return
        }
        form.resetFields()
    }, [visible, item])

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
            const { name, describe } = form.getFieldsValue()
            let itemInfo
            if (operate === OperateType.CREATE) {
                itemInfo = await postCategory({
                    name,
                    describe,
                })
                message.success(__('新建成功'))
            } else {
                itemInfo = await putCategoryItem(item?.id || '', {
                    name,
                    describe,
                })
                message.success(__('编辑成功'))
            }
            onSure(itemInfo)
            onClose()
        } catch (e) {
            if (e.errorFields) {
                return
            }
            if (
                e?.data?.code ===
                'DataCatalog.Category.CategoryOverflowMaxLayer'
            ) {
                info({
                    title: __('提示'),
                    icon: <InfoCircleFilled style={{ color: '#1890ff' }} />,
                    content: (
                        <div>
                            <div>{__('已达到自定义类目最大数：20。')}</div>
                            <div>{__('请先删除无用类目，再进行新建操作')}</div>
                        </div>
                    ),
                    okText: __('确定'),
                })
            } else {
                formatError(e)
            }
        } finally {
            setLoading(false)
        }
    }

    const validateName = () => {
        return (_: any, value: string) => {
            return new Promise((resolve, reject) => {
                const trimValue = trim(value)
                if (!trimValue) {
                    reject(new Error(__('输入不能为空')))
                }
                if (trimValue && !commReg.test(trimValue)) {
                    reject(
                        new Error(
                            __(
                                '仅支持中英文、数字、下划线、中划线，且不能以下划线和中划线开头',
                            ),
                        ),
                    )
                }
                resolve(1)
            })
        }
    }

    const checkNameRepeat = async (value: string, oldName?: string) => {
        try {
            if (trim(value) === oldName) {
                return Promise.resolve()
            }
            if (trim(value)) {
                const res = await getCategoryNameCheck({
                    id: item?.id,
                    name: value,
                })
                if (res?.repeat) {
                    return Promise.reject(
                        new Error(__('名称已存在，请重新输入')),
                    )
                }
            }
            return Promise.resolve()
        } catch (err) {
            formatError(err)
            return Promise.resolve()
        }
    }

    return (
        <Modal
            title={
                operate === OperateType.CREATE ? __('新建类目') : __('编辑类目')
            }
            width={424}
            maskClosable={false}
            open={visible}
            onCancel={handleModalCancel}
            onOk={handleModalOk}
            destroyOnClose
            getContainer={false}
            okText={__('确定')}
            cancelText={__('取消')}
            bodyStyle={{ padding: '16px 24px 0' }}
            okButtonProps={{ loading, style: { width: 80 } }}
            cancelButtonProps={{ style: { width: 80 } }}
            className={styles['create-category']}
        >
            <Form
                form={form}
                layout="vertical"
                autoComplete="off"
                initialValues={{ remember: true }}
            >
                <Form.Item
                    label={__('类目名称')}
                    name="name"
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            validateTrigger: ['onChange', 'onBlur'],
                            validator: validateName(),
                        },
                        {
                            validateTrigger: 'onBlur',
                            validator: (e, value) =>
                                checkNameRepeat(value, item?.name),
                        },
                    ]}
                >
                    <Input placeholder={__('请输入类目名称')} maxLength={32} />
                </Form.Item>
                <Form.Item
                    label={__('描述')}
                    name="describe"
                    rules={[
                        {
                            pattern: keyboardReg,
                            message: __(
                                '仅支持中英文、数字、及键盘上的特殊字符',
                            ),
                            transform: (value) => trim(value),
                        },
                    ]}
                >
                    <Input.TextArea
                        style={{ resize: 'none', height: 136 }}
                        placeholder={__('请输入类目描述')}
                        maxLength={300}
                        showCount
                        className={styles.desc}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default CreateCategory
