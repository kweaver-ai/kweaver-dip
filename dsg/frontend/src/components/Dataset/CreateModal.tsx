import { Form, Input, Modal } from 'antd'
import { useBoolean } from 'ahooks'
import { forwardRef, useEffect, useImperativeHandle } from 'react'
import __ from './locale'
import {
    createDataset,
    formatError,
    IDataset,
    updateDataset,
    validateDatasetName,
} from '@/core'

const { Item } = Form

interface Props {
    defaultValue?: IDataset & { id: string }
    onConfirm?: { (id?: string): void }
}

const CreateModal = (props: Props, ref) => {
    const { defaultValue, onConfirm } = props
    const [open, { setTrue, setFalse }] = useBoolean(false)
    const [form] = Form.useForm()

    const saveTemplate = async (params: any) => {
        try {
            const res = await createDataset(params)

            if (res.id) {
                if (onConfirm) {
                    onConfirm(res.id)
                }
                setFalse()
            }
        } catch (err) {
            formatError(err)
        }
    }

    const updateTemplate = async (params: any) => {
        try {
            await updateDataset(params)
            if (onConfirm) {
                onConfirm()
            }
            setFalse()
        } catch (err) {
            formatError(err)
        }
    }

    const onOk = async () => {
        try {
            const values = await form.validateFields()

            if (defaultValue?.id) {
                updateTemplate({
                    id: defaultValue?.id,
                    ...values,
                })
            } else {
                saveTemplate(values)
            }
            setFalse()
            form.resetFields()
        } catch (err) {
            // 表单验证不通过
        }
    }

    const validateNameReq = async (name) => {
        try {
            const params = defaultValue?.id
                ? {
                      name,
                      id: defaultValue?.id,
                  }
                : {
                      name,
                  }
            const res = await validateDatasetName(params)

            if (res.exists) return false
            return true
        } catch (error) {
            return false
        }
    }

    const validateName = async (_, value) => {
        if (!value) return Promise.reject()
        return validateNameReq(value).then((isPass) => {
            if (!isPass) {
                return Promise.reject(
                    new Error(__('该数据集名称已存在，请重新输入')),
                )
            }
            return Promise.resolve()
        })
    }

    useImperativeHandle(ref, () => ({ setTrue, setFalse }))

    useEffect(() => {
        if (defaultValue) {
            form.setFieldsValue(defaultValue)
        } else {
            form.resetFields()
        }
    }, [defaultValue])

    return (
        <Modal
            open={open}
            title={defaultValue?.id ? __('编辑数据集') : __('新建数据集')}
            onOk={onOk}
            maskClosable={false}
            destroyOnClose
            onCancel={() => {
                setFalse()
                form.resetFields()
            }}
        >
            <Form form={form} labelCol={{ span: 5 }} layout="vertical">
                <Item
                    label={__('数据集名称')}
                    name="data_set_name"
                    validateTrigger={['onBlur']}
                    rules={[
                        { required: true, message: __('输入不能为空') },
                        { validator: validateName },
                    ]}
                >
                    <Input placeholder={__('请输入')} maxLength={128} />
                </Item>
                <Item label={__('描述')} name="description">
                    <Input.TextArea
                        rows={3}
                        placeholder={__('请输入')}
                        maxLength={255}
                    />
                </Item>
            </Form>
        </Modal>
    )
}

export default forwardRef(CreateModal)
