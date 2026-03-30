import React, { useEffect, useState } from 'react'
import {
    Form,
    Input,
    message,
    Row,
    Col,
    Modal,
    Select,
    Button,
    Space,
    InputNumber,
    DatePicker,
} from 'antd'
import JSEncrypt from 'jsencrypt'
import { noop, trim } from 'lodash'
import moment from 'moment'
import { ErrorInfo, keyboardReg, nameReg, OperateType } from '@/utils'
import {
    validateNumber,
    validateEmpty,
    validatePort,
    validateTextLegitimacy,
} from '@/utils/validate'
import styles from './styles.module.less'
import {
    reqAddInfoSystem,
    editDataSource,
    formatError,
    getDataBaseDetails,
    getObjects,
    reqNameIsValid,
    reqUpdInfoSystem,
    reqInfoSystemDetail,
    ISystemItem,
} from '@/core'
import __ from './locale'
import { ConfigurationCenterErrorCode } from './helper'
import DepartmentAndOrgSelect from '../DepartmentAndOrgSelect'

const { TextArea } = Input

interface IAddInfoSystem {
    visible: boolean
    operateType: OperateType
    editItem?: ISystemItem
    onClose: () => void
    onSuccess?: () => void
}
const AddInfoSystem: React.FC<IAddInfoSystem> = ({
    operateType,
    visible,
    editItem,
    onClose,
    onSuccess = noop,
}) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (visible) {
            setLoading(false)
            setInitValues()
            form.setFieldsValue({
                ...editItem,
                acceptance_at: editItem?.acceptance_at
                    ? moment(editItem.acceptance_at)
                    : undefined,
                status: editItem?.status || undefined,
                js_department_id: editItem?.js_department_id || undefined,
            })
        } else {
            form.resetFields()
        }
    }, [visible])

    const setInitValues = () => {
        form.resetFields()
    }

    // 保存信息系统
    const onFinish = async (values) => {
        try {
            const params = {
                ...values,
                status: values.status ? Number(values.status) : 0,
                acceptance_at: values.acceptance_at
                    ? moment(values.acceptance_at).valueOf()
                    : undefined,
            }
            setLoading(true)
            if (operateType === OperateType.CREATE) {
                await reqAddInfoSystem(params)
                message.success(__('新建成功'))
            } else {
                await reqUpdInfoSystem(editItem?.id || '', params)
                message.success(__('编辑成功'))
            }
            onSuccess()
        } catch (error) {
            formatError(error)
            setLoading(false)
        } finally {
            setLoading(false)
        }
    }

    // 重名校验
    const validateNameRepeat = async (value: string): Promise<void> => {
        const trimValue = trim(value)
        try {
            if (operateType === OperateType.CREATE) {
                await reqNameIsValid({
                    id:
                        operateType === OperateType.CREATE
                            ? undefined
                            : editItem?.id || '',
                    name: trimValue,
                })
            }
            return Promise.resolve()
        } catch (error) {
            if (
                error.data.code ===
                ConfigurationCenterErrorCode.InfoSystemNameExist
            ) {
                return Promise.reject(
                    new Error(__('该信息系统名称已存在，请重新输入')),
                )
            }
            return Promise.resolve()
        }
    }

    return (
        <div className={styles.addInfoSystemWrapper}>
            <Modal
                width={640}
                open={visible}
                className={styles.addInfoSystemModal}
                closable
                title={
                    operateType === OperateType.CREATE
                        ? __('添加信息系统')
                        : __('编辑信息系统')
                }
                destroyOnClose
                maskClosable={false}
                bodyStyle={{ maxHeight: 500, overflow: 'auto' }}
                onCancel={onClose}
                footer={
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                        }}
                    >
                        <Space size={12}>
                            <Button onClick={onClose}>{__('取消')}</Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                onClick={() => form.submit()}
                            >
                                {__('确定')}
                            </Button>
                        </Space>
                    </div>
                }
            >
                <Form
                    form={form}
                    autoComplete="off"
                    layout="vertical"
                    onFinish={onFinish}
                    scrollToFirstError
                >
                    <Row gutter={24}>
                        <Col span={24}>
                            <Form.Item
                                label={__('信息系统名称')}
                                name="name"
                                validateFirst
                                validateTrigger={['onChange', 'onBlur']}
                                rules={[
                                    {
                                        required: true,
                                        message: ErrorInfo.NOTNULL,
                                        transform: (value) => trim(value),
                                    },
                                    // {
                                    //     pattern: nameReg,
                                    //     message: ErrorInfo.ONLYSUP,
                                    //     transform: (value) => trim(value),
                                    // },
                                    {
                                        validateTrigger: ['onBlur'],
                                        validator: (e, value) =>
                                            validateNameRepeat(value),
                                    },
                                ]}
                            >
                                <Input
                                    placeholder={__('请输入名称')}
                                    maxLength={128}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name="department_id"
                                label={__('所属部门')}
                            >
                                <DepartmentAndOrgSelect
                                    allowClear
                                    getInitValueError={(errorMessage) => {
                                        form?.setFields([
                                            {
                                                name: 'org_id',
                                                errors: [errorMessage],
                                                value: null,
                                            },
                                        ])
                                    }}
                                    defaultValue={editItem?.department_id || ''}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name="js_department_id"
                                label={__('建设部门')}
                            >
                                <DepartmentAndOrgSelect
                                    allowClear
                                    placement="bottomLeft"
                                    dropdownStyle={{ maxHeight: 220 }}
                                    dropdownAlign={{
                                        overflow: {
                                            adjustY: false,
                                            adjustX: false,
                                        },
                                    }}
                                    getInitValueError={(errorMessage) => {
                                        form?.setFields([
                                            {
                                                name: 'org_id',
                                                errors: [errorMessage],
                                                value: null,
                                            },
                                        ])
                                    }}
                                    placeholder={__('请选择建设部门')}
                                    defaultValue={
                                        editItem?.js_department_id || ''
                                    }
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="status" label={__('系统状态')}>
                                <Select
                                    placeholder={__('请选择系统状态')}
                                    options={[
                                        {
                                            value: 1,
                                            label: __('已建'),
                                        },
                                        {
                                            value: 2,
                                            label: __('拟建'),
                                        },
                                        {
                                            value: 3,
                                            label: __('在建'),
                                        },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name="acceptance_at"
                                label={__('验收时间')}
                            >
                                <DatePicker
                                    placeholder={__('请选择')}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                label={__('描述')}
                                name="description"
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
                                <TextArea
                                    maxLength={300}
                                    showCount
                                    className={styles.showCount}
                                    placeholder={`${__('请输入')}${__('描述')}`}
                                    style={{ resize: 'none', height: 136 }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    )
}

export default AddInfoSystem
