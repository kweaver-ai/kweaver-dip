import { FC, useState, useEffect } from 'react'
import { Modal, Form, Input } from 'antd'
import { trim } from 'lodash'
import { keyboardReg } from '@/utils'
import __ from './locale'
import { EditStatus } from '../DataSynchronization/const'
import { validateName } from '@/utils/validate'
import { checkProcessModelNameRepeat } from './helper'

interface IEditData {
    type: EditStatus
    initData: any
    onClose: () => void
    onConfirm: (data: any) => void
}

const EditData: FC<IEditData> = ({ type, initData, onClose, onConfirm }) => {
    // 表单实例
    const [form] = Form.useForm()

    // 弹窗状态
    const [open, setOpen] = useState<boolean>(!!type)

    useEffect(() => {
        form.setFieldsValue(initData)
    }, [initData])

    useEffect(() => {
        setOpen(!!type)
    }, [type])

    /**
     * 完成
     * @param values
     */
    const handleFinish = (values) => {
        onConfirm({
            name: trim(values.name),
            description: trim(values.description),
        })
    }
    return (
        <Modal
            open={open}
            maskClosable={false}
            onCancel={onClose}
            onOk={() => {
                form.submit()
            }}
            width={640}
            title={
                type === EditStatus.CREATE
                    ? __('新建数据加工')
                    : __('编辑基本信息')
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
                    label={__('数据加工名称')}
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            validateTrigger: ['onChange', 'onBlur'],
                            validator: validateName(),
                        },
                        {
                            validateTrigger: ['onBlur'],
                            validator: (ruler, value) => {
                                const params = initData.id
                                    ? {
                                          name: value,
                                          id: initData.id,
                                      }
                                    : { name: value }
                                return checkProcessModelNameRepeat(
                                    ruler,
                                    params,
                                )
                            },
                        },
                    ]}
                >
                    <Input
                        placeholder={__('请输入数据加工名称')}
                        maxLength={128}
                    />
                </Form.Item>
                <Form.Item
                    name="description"
                    label={__('描述')}
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
                    <Input.TextArea
                        placeholder={__('请输入描述')}
                        maxLength={300}
                        style={{ height: 136, resize: `none` }}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default EditData
