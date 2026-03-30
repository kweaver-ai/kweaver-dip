import { Modal, Form, Input, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { forwardRef, useEffect, useState } from 'react'
import { noop, trim } from 'lodash'
import {
    createGradeRuleGroup,
    checkGradeRuleGroupName,
    editGradeRuleGroup,
    formatError,
} from '@/core'
import __ from '../../locale'
import { ErrorInfo } from '@/utils'
import { useClassificationContext } from '../ClassificationProvider'

const { TextArea } = Input

interface ICreateGroup {
    open: boolean
    onClose: () => void
    onOk: () => void
    curInfo?: any
    isEdit: boolean
}

const CreateGroup = (props: ICreateGroup, ref) => {
    const { open, onClose, onOk, curInfo, isEdit } = props
    const [form] = Form.useForm()
    const { setSelectedAttribute, selectedAttribute } =
        useClassificationContext()
    const [loading, setLoading] = useState<boolean>(false)

    useEffect(() => {
        if (curInfo?.id && isEdit) {
            form.setFieldsValue(curInfo)
        }
    }, [curInfo])

    const onFinish = async (values: any) => {
        try {
            setLoading(true)
            const action = isEdit ? editGradeRuleGroup : createGradeRuleGroup
            await action({
                ...values,
                id: isEdit ? curInfo?.id : undefined,
                business_object_id: selectedAttribute.id,
            })
            onOk()
        } catch (e) {
            formatError(e)
        } finally {
            setLoading(false)
        }
    }
    const validateNameRepeat = async (value: string): Promise<void> => {
        const trimValue = trim(value)
        try {
            const res = await checkGradeRuleGroupName({
                id: isEdit ? curInfo?.id : undefined,
                name: trimValue,
                business_object_id: selectedAttribute.id,
            })
            if (res?.repeat) {
                return Promise.reject(
                    new Error(__('该规则组名称已存在，请重新输入')),
                )
            }
            return Promise.resolve()
        } catch (error) {
            if (error.data.data) {
                return Promise.reject(
                    new Error(__('该规则组名称已存在，请重新输入')),
                )
            }
            return Promise.resolve()
        }
    }
    return (
        <Modal
            open={open}
            title={isEdit ? '编辑规则组' : '添加规则组'}
            width={640}
            getContainer={false}
            maskClosable={false}
            destroyOnClose
            onCancel={() => onClose()}
            onOk={() => form.submit()}
            confirmLoading={loading}
        >
            <Form
                form={form}
                autoComplete="off"
                layout="vertical"
                onFinish={onFinish}
                scrollToFirstError
            >
                <Form.Item
                    label={__('规则组名称')}
                    name="name"
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            message: ErrorInfo.NOTNULL,
                            transform: (value) => trim(value),
                        },
                        {
                            validateTrigger: ['onBlur'],
                            validator: (e, value) => validateNameRepeat(value),
                        },
                    ]}
                >
                    <Input
                        placeholder={__('请输入规则组名称')}
                        maxLength={128}
                    />
                </Form.Item>
                <Form.Item
                    label={__('规则组描述')}
                    name="description"
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            transform: (value) => trim(value),
                        },
                    ]}
                >
                    <TextArea
                        maxLength={300}
                        placeholder={__('请输入规则组描述')}
                        showCount
                        // style={{ resize: 'none', height: 134 }}
                        // className={styles.showCount}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default forwardRef(CreateGroup)
