import * as react from 'react'
import { useState, useEffect } from 'react'
import { noop } from 'lodash'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Modal, Input, Form, Select, message } from 'antd'
import __ from './locale'
import { validateEmpty, validateName } from '@/utils/validate'
import { checkNameCorrect, checkNormalInput } from '../FormGraph/helper'
import styles from './styles.module.less'
import { createIndicatorModel, formatError, updateIndicatorModel } from '@/core'
import { checkNameRepeat } from './helper'
import { OptionModel } from '../MetricModel/const'
import { TabKey } from '../BusinessModeling/const'
import { getActualUrl } from '@/utils'

interface CreateModelType {
    onClose: () => void
    onEditModel?: (values) => void
    mid: string // mid业务模型id  modelId模型id
    visible?: boolean
    modelValue?: any
    jumpUrl?: string
    okText?: string
    viewType: OptionModel
    taskId?: string
    jumpWithWindow?: boolean
}

// 新建或者编辑模型
const CreateModel = ({
    visible = true,
    modelValue,
    jumpUrl,
    onClose,
    okText = __('确定'),
    mid,
    viewType,
    taskId,
    onEditModel,
    jumpWithWindow = false,
}: CreateModelType) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState<boolean>(false)
    const [newmodelId, setNewmodelId] = useState<string>('')
    const redirect = useLocation()
    const navigator = useNavigate()

    useEffect(() => {
        setFormData()
    }, [modelValue])

    const setFormData = () => {
        if (
            modelValue &&
            Object.keys(modelValue).length > 0 &&
            viewType === OptionModel.EditModel
        ) {
            const { modelId } = modelValue
            setNewmodelId(modelId)
            form.setFieldsValue(modelValue)
        } else {
            form.setFieldsValue({
                name: '',
                description: '',
            })
        }
    }
    /**
     * 发请求
     * @param values
     */
    const onFinish = async (values) => {
        try {
            if (viewType === OptionModel.CreateModel) {
                setLoading(true)
                const currentForm = await createIndicatorModel(mid, {
                    ...values,
                    task_id: taskId,
                })

                message.success(__('新建成功'))
                if (jumpUrl) {
                    navigator(
                        `/formGraph/metricModel?mid=${mid}&redirect=${redirect.pathname}&optionModel=${OptionModel.CreateModel}&iid=${currentForm[0].id}&${jumpUrl}`,
                    )
                } else {
                    const url = `/formGraph/metricModel?mid=${mid}&${
                        redirect.search
                    }&redirect=${redirect.pathname}&iid=${
                        currentForm[0].id
                    }&optionModel=${OptionModel.CreateModel}&targetTab=${
                        TabKey.INDICATOR
                    }&jumpMode=${jumpWithWindow ? 'win' : 'nav'}`
                    if (jumpWithWindow) {
                        navigator(url)
                        return
                    }
                    navigator(url)
                }
                onClose()
            } else {
                setLoading(true)
                await updateIndicatorModel(mid, newmodelId, {
                    ...values,
                    task_id: taskId,
                })
                message.success(__('编辑成功'))
                if (onEditModel) {
                    onEditModel({ id: newmodelId, newname: values.name })
                }
                onClose()
            }
        } catch (ex) {
            formatError(ex)
        } finally {
            setLoading(false)
        }
    }
    return (
        <Modal
            width={640}
            title={
                viewType === OptionModel.CreateModel
                    ? __('新建业务指标模型')
                    : __('编辑业务指标模型')
            }
            open={visible}
            bodyStyle={{ maxHeight: 444, overflow: 'auto' }}
            maskClosable={false}
            onCancel={() => {
                onClose()
            }}
            onOk={() => form.submit()}
            destroyOnClose
            getContainer={false}
            okText={okText}
            okButtonProps={{ loading }}
            className={styles.CreateIndicator}
        >
            <Form
                form={form}
                initialValues={modelValue}
                onFinish={onFinish}
                layout="vertical"
            >
                <Form.Item
                    label={__('业务指标模型名称')}
                    required
                    name="name"
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            validator: validateEmpty('输入不能为空'),
                        },
                        {
                            validateTrigger: ['onBlur'],
                            validator: (e, value) =>
                                checkNameRepeat(mid, value, viewType),
                        },
                    ]}
                >
                    <Input
                        placeholder={__('请输入业务指标模型名称')}
                        autoComplete="off"
                        maxLength={128}
                    />
                </Form.Item>
                <Form.Item
                    label={__('描述')}
                    name="description"
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            validateTrigger: ['onBlur'],
                            validator: (e, value) => checkNormalInput(e, value),
                        },
                    ]}
                >
                    <Input.TextArea
                        placeholder={__('请输入描述')}
                        style={{
                            height: `100px`,
                            resize: 'none',
                        }}
                        autoComplete="off"
                        maxLength={255}
                        autoSize={false}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default CreateModel
