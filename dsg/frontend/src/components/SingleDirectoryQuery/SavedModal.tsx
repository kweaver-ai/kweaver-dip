import { Form, Input, Modal, message } from 'antd'
import { useBoolean } from 'ahooks'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import __ from './locale'
import {
    createSingleCatalog,
    validateNameUniq,
    formatError,
    updateSingleCatalog,
} from '@/core'

const { Item } = Form

interface Props {
    editId?: string
    defaultValue?: { name: string; description: string }
}

const SavedModal = (props: Props, ref) => {
    const { editId, defaultValue } = props
    const [open, { setTrue, setFalse }] = useBoolean(false)
    const dataRef = useRef<any>({})
    const [form] = Form.useForm()

    const saveTemplate = async (params: any) => {
        try {
            const res = await createSingleCatalog(params)

            if (!res.code) {
                message.success(__('保存成功'))
            }
        } catch (err) {
            formatError(err)
        }
    }

    const updateTemplate = async (params: any) => {
        try {
            const res = await updateSingleCatalog(params)
            if (!res.code) {
                message.success(__('保存成功'))
            }
        } catch (err) {
            formatError(err)
        }
    }

    const openModal = (params: any) => {
        dataRef.current = params
        setTrue()
    }
    const onOk = async () => {
        try {
            const values = await form.validateFields()

            if (editId) {
                updateTemplate({
                    id: editId,
                    ...dataRef.current,
                    ...values,
                })
            } else {
                saveTemplate({ ...dataRef.current, ...values })
            }
            setFalse()
        } catch (err) {
            // 表单验证不通过
        }
    }

    // 校验模板名称唯一性
    const fetchNameUniq = async (name: string): Promise<boolean> => {
        try {
            const res = await validateNameUniq({ name })

            if (res.is_repeated) return false

            return true
        } catch (error) {
            formatError(error)

            return false
        }
    }

    const validatorName = (_, value) => {
        if (!value) return Promise.reject()
        return fetchNameUniq(value).then((isPass) => {
            if (!isPass) {
                return Promise.reject(
                    new Error(__('模板名称已存在，请重新输入')),
                )
            }
            return Promise.resolve()
        })
    }

    useImperativeHandle(ref, () => ({ setTrue: openModal, setFalse }))

    return (
        <Modal
            open={open}
            title={editId ? __('编辑模板') : __('保存模板')}
            onOk={onOk}
            maskClosable={false}
            onCancel={() => {
                setFalse()
            }}
        >
            <Form
                form={form}
                labelCol={{ span: 5 }}
                layout="vertical"
                initialValues={defaultValue}
            >
                <Item
                    label={__('模板名称')}
                    name="name"
                    validateTrigger={['onBlur']}
                    rules={[
                        { required: true },
                        {
                            validator: validatorName,
                        },
                    ]}
                >
                    <Input placeholder={__('请输入')} maxLength={128} />
                </Item>
                <Item label={__('说明')} name="description">
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

export default forwardRef(SavedModal)
