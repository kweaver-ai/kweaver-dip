import React, { useEffect, useState } from 'react'
import { Modal, Form, Button, Input } from 'antd'
import { noop, trim } from 'lodash'
import { keyboardReg } from '@/utils'
import { validateName } from '@/utils/validate'
import styles from './styles.module.less'
import __ from './locale'
import { checkSyncModelNameRepeat } from './helper'

interface HeaderEditModalType {
    open: boolean
    data: any
    left: number
    onUpdateData: (data: any) => void
    onClose: () => void
    isNeedEdit?: boolean
}

const HeaderEditModal = ({
    open = false,
    onClose = noop,
    data,
    left = 100,
    onUpdateData = noop,
    isNeedEdit = false,
}: HeaderEditModalType) => {
    const [form] = Form.useForm()
    const [editStatus, setEditStatus] = useState(false)

    useEffect(() => {
        form.resetFields()
        form.setFieldsValue(data)
    }, [data])
    /**
     * 完成
     * @param values
     */
    const handleFinish = (values) => {
        onUpdateData({
            name: trim(values.name),
            description: trim(values.description),
        })
        setEditStatus(false)
    }

    return (
        <Modal
            title={__('数据同步信息')}
            open={open}
            width={400}
            style={{
                width: '400px',
                position: 'absolute',
                left,
                top: '52px',
            }}
            maskClosable={!editStatus}
            bodyStyle={{
                padding: '16px 20px 0px 20px',
            }}
            destroyOnClose
            onCancel={() => {
                setEditStatus(false)
                onClose()
            }}
            mask={false}
            footer={
                isNeedEdit ? (
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        {editStatus ? (
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Button
                                    style={{
                                        width: '168px',
                                        height: '36px',
                                    }}
                                    onClick={() => {
                                        onClose()
                                        setEditStatus(false)
                                    }}
                                >
                                    {__('取消')}
                                </Button>
                                <Button
                                    type="primary"
                                    style={{
                                        width: '168px',
                                        height: '36px',
                                    }}
                                    onClick={() => {
                                        form.submit()
                                    }}
                                >
                                    {__('确定')}
                                </Button>
                            </div>
                        ) : (
                            <Button
                                style={{
                                    width: '360px',
                                    height: '36px',
                                }}
                                onClick={() => {
                                    setEditStatus(true)
                                    // form.resetFields(['name', 'description'])
                                }}
                            >
                                {__('编辑信息')}
                            </Button>
                        )}
                    </div>
                ) : null
            }
        >
            <Form
                form={form}
                onFinish={handleFinish}
                layout="vertical"
                autoComplete="off"
            >
                <Form.Item
                    name="name"
                    label={
                        <span
                            style={{
                                color: editStatus
                                    ? 'rgba(0,0,0,0.85)'
                                    : 'rgba(0,0,0,0.45)',
                            }}
                        >
                            {__('数据同步名称')}
                        </span>
                    }
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: editStatus,
                            validateTrigger: ['onChange', 'onBlur'],
                            validator: validateName(),
                        },
                        {
                            validateTrigger: ['onBlur'],
                            validator: (ruler, value) => {
                                const params = data.id
                                    ? {
                                          name: value,
                                          id: data.id,
                                      }
                                    : { name: value }
                                return checkSyncModelNameRepeat(ruler, params)
                            },
                        },
                    ]}
                >
                    {editStatus ? (
                        <Input
                            placeholder={__('请输入数据同步名称')}
                            maxLength={128}
                        />
                    ) : (
                        <div>{data?.name}</div>
                    )}
                </Form.Item>
                <Form.Item
                    name="description"
                    label={
                        <span
                            style={{
                                color: editStatus
                                    ? 'rgba(0,0,0,0.85)'
                                    : 'rgba(0,0,0,0.45)',
                            }}
                        >
                            {__('描述')}
                        </span>
                    }
                    validateFirst
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
                    {editStatus ? (
                        <Input.TextArea
                            autoSize={false}
                            maxLength={300}
                            style={{
                                height: '120px',
                                resize: 'none',
                            }}
                            onKeyDown={(e) => {
                                if (e.keyCode === 13) {
                                    e.preventDefault()
                                }
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                maxHeight: '120px',
                                overflowX: 'auto',
                                color: data?.description
                                    ? 'rgba(0,0,0,0.85)'
                                    : 'rgba(0,0,0,0.45)',
                            }}
                        >
                            {data?.description
                                ? data.description
                                : __('暂无描述')}
                        </div>
                    )}
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default HeaderEditModal
