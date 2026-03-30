import { useEffect, useState } from 'react'
import { trim } from 'lodash'
import { Form, Input, Modal } from 'antd'
import {
    formatError,
    createFirm,
    FirmCheckType,
    IFirm,
    uniqueCheckFirm,
    editFirm,
} from '@/core'
import __ from '../locale'

interface IReply {
    open: boolean
    item?: IFirm
    onCreateSuccess: () => void
    onCreateClose: () => void
}

const regex = /^[A-HJ-NP-RT-UWXY0-9]+$/
const lengthRegex = /^.{15}(.{3})?$/
const phoneRegex = /^[0-9+-]+$/

const Create = ({ open, item, onCreateSuccess, onCreateClose }: IReply) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState<boolean>(false)

    useEffect(() => {
        // 编辑，用原来的值填充表单
        if (item) {
            form.setFieldsValue({
                name: item.name,
                uniform_code: item.uniform_code,
                legal_represent: item.legal_represent,
                contact_phone: item.contact_phone,
            })
        }
    }, [item])

    const onFinish = async (values) => {
        setLoading(true)
        try {
            if (item) {
                await editFirm(item.id, values)
            } else {
                await createFirm(values)
            }
            onCreateSuccess()
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 校验重名
    const inputValidate = async (
        value: string,
        type: FirmCheckType,
    ): Promise<void> => {
        setLoading(true)
        try {
            const trimValue = trim(value)

            const res = await uniqueCheckFirm({
                check_type: type,
                value: trimValue,
            })

            if (res.repeat) {
                return Promise.reject(
                    new Error(
                        type === FirmCheckType.UniformCode
                            ? __('统一社会信用代码已存在，请重新输入')
                            : __('公司名称已存在，请重新输入'),
                    ),
                )
            }

            return Promise.resolve()
        } catch (error) {
            formatError(error)
            return Promise.resolve()
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            open={open}
            title={item ? __('编辑公司信息') : __('新建公司信息')}
            width="640px"
            getContainer={false}
            maskClosable={false}
            destroyOnClose
            onOk={() => form.submit()}
            onCancel={onCreateClose}
            okButtonProps={{ loading }}
        >
            <Form
                name="create"
                form={form}
                layout="vertical"
                wrapperCol={{ span: 24 }}
                initialValues={{ remember: true }}
                onFinish={onFinish}
                autoComplete="off"
            >
                <Form.Item
                    label={__('公司名称')}
                    name="name"
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            message: __('输入不能为空'),
                        },
                        {
                            validateTrigger: 'onBlur',
                            validator: (e, value) => {
                                // 编辑时，如果输入的值与原来的值相同，则不校验
                                if (item && value === item.name) {
                                    return Promise.resolve()
                                }
                                return inputValidate(value, FirmCheckType.Name)
                            },
                        },
                    ]}
                    validateFirst
                >
                    <Input placeholder={__('请输入')} maxLength={128} />
                </Form.Item>
                <Form.Item
                    label={__('统一社会信用代码')}
                    name="uniform_code"
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            message: __('输入不能为空'),
                        },
                        {
                            pattern: regex,
                            message: __(
                                '仅包含大写英文（I、O、Z、S、V除外）及数字',
                            ),
                        },
                        {
                            pattern: lengthRegex,
                            message: __('仅支持输入15或18个字符'),
                        },
                        {
                            validateTrigger: 'onBlur',
                            validator: (e, value) => {
                                // 编辑时，如果输入的值与原来的值相同，则不校验
                                if (item && value === item.uniform_code) {
                                    return Promise.resolve()
                                }
                                return inputValidate(
                                    value,
                                    FirmCheckType.UniformCode,
                                )
                            },
                        },
                    ]}
                    validateFirst
                >
                    <Input placeholder={__('请输入')} maxLength={18} />
                </Form.Item>
                <Form.Item
                    label={__('法定代表/负责人姓名')}
                    name="legal_represent"
                    rules={[
                        {
                            required: true,
                            message: __('输入不能为空'),
                        },
                    ]}
                    validateFirst
                >
                    <Input placeholder={__('请输入')} maxLength={128} />
                </Form.Item>
                <Form.Item
                    label={__('联系电话')}
                    name="contact_phone"
                    rules={[
                        {
                            required: true,
                            message: __('输入不能为空'),
                        },
                        {
                            pattern: phoneRegex,
                            message: __('仅支持输入数字及+、-'),
                        },
                        {
                            min: 3,
                            max: 20,
                            message: __('仅支持输入3~20个字符'),
                        },
                    ]}
                    validateFirst
                >
                    <Input
                        placeholder={__('请输入')}
                        minLength={3}
                        maxLength={20}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default Create
