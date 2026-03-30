import React, { useEffect, useState } from 'react'
import { Row, Col, Button, Form, Input, message, Modal, Select } from 'antd'
import { trim } from 'lodash'
import {
    formatError,
    createBusinessMatters,
    updateBusinessMatters,
    businessMattersNameCheck,
} from '@/core'
import DepartmentAndOrgSelect from '../DepartmentAndOrgSelect'
import { OperateType } from '@/utils'
import NumberInput from '@/ui/NumberInput'
import { NumberType } from '@/ui/NumberInput/const'
import __ from './locale'
import styles from './styles.module.less'
import { getDictItems } from './helper'

interface ICreateModal {
    open: boolean
    operate?: OperateType
    currentData?: any
    onClose: (refresh?: boolean) => void
}

const CreateModal: React.FC<ICreateModal> = ({
    open,
    operate,
    currentData,
    onClose,
}) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [initialDepartment, setInitialDepartment] = useState<string>('')
    const [typeOptions, setTypeOptions] = useState<any[]>([])

    useEffect(() => {
        if (open) {
            getTypeOptions()
        }
        if (open && operate === OperateType.EDIT && currentData) {
            form.setFieldsValue(currentData)
            setInitialDepartment(currentData?.department_id)
            return
        }
        form.resetFields()
    }, [open])

    // 对话框onOk
    const handleModalOk = async () => {
        try {
            setLoading(true)
            await form.validateFields()
            const params = form.getFieldsValue()
            params.materials_number = Number(params.materials_number) || 0
            if (operate === OperateType.CREATE) {
                await createBusinessMatters(params)
                message.success(__('新建成功'))
            } else {
                await updateBusinessMatters({ ...params, id: currentData.id })
                message.success(__('编辑成功'))
            }
            onClose(true)
        } catch (e) {
            if (e.errorFields) {
                return
            }
            formatError(e)
        } finally {
            setLoading(false)
        }
    }

    // 验证名称是否重复
    const validateNameRepeat = (_id?: string) => {
        return (_: any, value: string) => {
            return new Promise((resolve, reject) => {
                const trimValue = trim(value)
                if (!trimValue) {
                    reject(new Error(__('输入不能为空')))
                    return
                }
                const errorMsg = __('该名称已存在，请重新输入')
                businessMattersNameCheck({
                    name: trimValue,
                    id: _id,
                })
                    .then((res) => {
                        if (res?.repeat) {
                            reject(new Error(errorMsg))
                        } else {
                            resolve(1)
                        }
                    })
                    .catch((err) => {
                        reject(new Error(err?.data?.description))
                    })
            })
        }
    }

    const getTypeOptions = async () => {
        const res = await getDictItems()
        setTypeOptions(res)
    }

    return (
        <Modal
            title={
                operate === OperateType.CREATE
                    ? __('新建业务事项')
                    : __('编辑业务事项')
            }
            width={640}
            maskClosable={false}
            open={open}
            onCancel={() => onClose()}
            destroyOnClose
            getContainer={false}
            okButtonProps={{ loading }}
            footer={[
                <Button
                    onClick={() => onClose()}
                    key="cancel"
                    style={{ minWidth: 80 }}
                >
                    {__('取消')}
                </Button>,
                <Button
                    type="primary"
                    onClick={handleModalOk}
                    loading={loading}
                    key="confirm"
                    style={{ minWidth: 80 }}
                >
                    {__('确定')}
                </Button>,
            ]}
        >
            <Form
                className={styles.modalWrapper}
                form={form}
                layout="vertical"
                autoComplete="off"
            >
                <Row>
                    <Col span={24}>
                        <Form.Item
                            name="name"
                            required
                            label={__('事项名称')}
                            validateFirst
                            validateTrigger={['onChange', 'onBlur']}
                            rules={[
                                {
                                    required: true,
                                    validateTrigger: 'onChange',
                                    transform: (value: string) => trim(value),
                                    message: __('输入不能为空'),
                                },
                                {
                                    validateTrigger: 'onBlur',
                                    validator: validateNameRepeat(
                                        currentData?.id,
                                    ),
                                },
                            ]}
                        >
                            <Input
                                placeholder={__('请输入')}
                                maxLength={128}
                                allowClear
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12} className={styles.padRight}>
                        <Form.Item
                            required
                            rules={[
                                {
                                    required: true,
                                    validateTrigger: 'onChange',
                                    message: __('输入不能为空'),
                                },
                            ]}
                            label={__('事项类型')}
                            name="type_key"
                        >
                            <Select
                                placeholder={__('请选择')}
                                options={typeOptions}
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.label ?? '').includes(input)
                                }
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12} className={styles.padLeft}>
                        <Form.Item
                            required
                            label={__('所属组织架构')}
                            name="department_id"
                            rules={[
                                {
                                    required: true,
                                    validateTrigger: 'onChange',
                                    message: __('输入不能为空'),
                                },
                            ]}
                        >
                            <DepartmentAndOrgSelect
                                placeholder={__('请选择所属组织架构')}
                                defaultValue={initialDepartment}
                                allowClear
                                onChange={(val) => {
                                    if (!val) {
                                        setInitialDepartment('')
                                    }
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12} className={styles.padRight}>
                        <Form.Item name="materials_number" label={__('材料数')}>
                            <NumberInput
                                placeholder={__('请输入')}
                                maxLength={10}
                                type={NumberType.Natural}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    )
}

export default CreateModal
