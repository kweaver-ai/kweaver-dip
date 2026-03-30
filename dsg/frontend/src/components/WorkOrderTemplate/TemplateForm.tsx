import {
    Button,
    Col,
    DatePicker,
    Form,
    Input,
    Modal,
    Row,
    Select,
    Switch,
    message,
} from 'antd'
import { trim } from 'lodash'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { nameReg, validateName } from '@/utils'
import type {
    IWorkOrderTemplatesInfo,
    WorkOrderTemplateContent,
    WorkOrderTemplateType,
} from '@/core/apis/taskCenter/index.d'
import { checkNameWorkOrderTemplate, formatError } from '@/core'
import { FORM_FIELDS_CONFIG, WORK_ORDER_TYPES } from './const'
import styles from './styles.module.less'

const { Option } = Select
const { TextArea } = Input
const { RangePicker } = DatePicker

interface TemplateFormProps {
    visible: boolean
    mode: 'create' | 'edit'
    initialValues?: IWorkOrderTemplatesInfo | null
    onSubmit: (data: any) => void
    onCancel: () => void
}

const TemplateForm: React.FC<TemplateFormProps> = ({
    visible,
    mode,
    initialValues,
    onSubmit,
    onCancel,
}) => {
    const [form] = Form.useForm()
    const [currentType, setCurrentType] =
        useState<WorkOrderTemplateType>('research')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (visible && initialValues) {
            // 编辑模式，设置初始值
            const formValues: any = {
                template_name: initialValues.template_name,
                template_type: initialValues.template_type,
                description: initialValues.description,
                is_active: initialValues.is_active === 1,
            }

            // 处理内容字段，特别是日期字段
            if (initialValues.content) {
                Object.keys(initialValues.content).forEach((key) => {
                    const value = initialValues.content![key]

                    // 字段转换：将API的description转换为表单的work_order_description
                    const formFieldName =
                        key === 'description' ? 'work_order_description' : key

                    // 处理日期范围字段
                    if (typeof value === 'string' && value.includes(',')) {
                        const dates = value
                            .split(',')
                            .map((dateStr) => {
                                const date = moment(dateStr.trim())
                                // 验证日期是否有效
                                return date.isValid() ? date : null
                            })
                            .filter((date) => date !== null)
                        // 只有当所有日期都有效时才设置值
                        if (dates.length === 2) {
                            formValues[formFieldName] = dates
                        }
                    }
                    // 处理单个日期字段
                    else if (
                        typeof value === 'string' &&
                        /^\d{4}-\d{2}-\d{2}$/.test(value)
                    ) {
                        const date = moment(value)
                        // 只有当日期有效时才设置值
                        if (date.isValid()) {
                            formValues[formFieldName] = date
                        }
                    }
                    // 处理数组字段
                    else if (Array.isArray(value)) {
                        formValues[formFieldName] = value.join(', ')
                    }
                    // 其他字段直接赋值
                    else {
                        formValues[formFieldName] = value
                    }
                })
            }

            form.setFieldsValue(formValues)
            setCurrentType(initialValues.template_type)
        } else if (visible && mode === 'create') {
            // 创建模式，重置表单
            form.resetFields()
            form.setFieldsValue({
                is_active: true,
            })
            setCurrentType('research')
        }
    }, [visible, initialValues, mode, form])

    const handleTypeChange = (type: WorkOrderTemplateType) => {
        setCurrentType(type)
        // 清空内容相关的字段，但保留基本信息
        const currentValues = form.getFieldsValue()
        const fieldsToKeep = [
            'template_name',
            'description',
            'is_active',
            'work_order_description',
        ]
        const newValues = Object.keys(currentValues)
            .filter((key) => fieldsToKeep.includes(key))
            .reduce((obj, key) => {
                return {
                    ...obj,
                    [key]: currentValues[key],
                }
            }, {} as any)

        form.setFieldsValue({
            ...newValues,
            template_type: type,
        })
    }

    const onFinish = async (values) => {
        try {
            setLoading(true)
            // 处理特殊字段
            const formData = {
                ...values,
                is_active: values.is_active ? 1 : 0,
                content: {} as WorkOrderTemplateContent,
            }

            // 根据模板类型构建content对象
            const fields = FORM_FIELDS_CONFIG[currentType]
            fields.forEach((field) => {
                if (
                    values[field.name] !== undefined &&
                    values[field.name] !== null
                ) {
                    // 字段转换：将表单的work_order_description转换为API的description
                    const apiFieldName =
                        field.name === 'work_order_description'
                            ? 'description'
                            : field.name

                    if (
                        field.type === 'dateRange' &&
                        Array.isArray(values[field.name])
                    ) {
                        // 处理日期范围，确保moment对象有效
                        const validDates = values[field.name]
                            .map((date: any) => moment(date))
                            .filter((date: any) => date.isValid())
                            .map((date: any) => date.format('YYYY-MM-DD'))

                        if (validDates.length === 2) {
                            formData.content[apiFieldName] =
                                validDates.join(',')
                        }
                    } else if (field.type === 'date' && values[field.name]) {
                        // 处理单个日期，确保moment对象有效
                        const date = moment(values[field.name])
                        if (date.isValid()) {
                            formData.content[apiFieldName] =
                                date.format('YYYY-MM-DD')
                        }
                    } else if (
                        field.name === 'table_fields' &&
                        typeof values[field.name] === 'string'
                    ) {
                        // 处理表字段数组
                        formData.content[apiFieldName] = values[field.name]
                            .split(',')
                            .map((item: string) => item.trim())
                            .filter((item: string) => item)
                    } else {
                        formData.content[apiFieldName] = values[field.name]
                    }
                }
            })

            // 移除content相关字段，避免重复
            Object.keys(formData.content).forEach((apiKey) => {
                // 转换API字段名回表单字段名进行清理
                const formFieldName =
                    apiKey === 'description' ? 'work_order_description' : apiKey
                delete formData[formFieldName]
            })

            onSubmit(formData)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    const renderFormField = (field: any) => {
        switch (field.type) {
            case 'input':
                return <Input placeholder={field.placeholder} maxLength={200} />

            case 'textarea':
                return (
                    <TextArea
                        placeholder={field.placeholder}
                        rows={4}
                        maxLength={1000}
                        showCount
                    />
                )

            case 'select':
                return (
                    <Select placeholder={field.placeholder} allowClear>
                        {field.options?.map((option: any) => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                )

            case 'date':
                return (
                    <DatePicker
                        placeholder={field.placeholder}
                        style={{ width: '100%' }}
                    />
                )

            case 'dateRange':
                return (
                    <RangePicker
                        placeholder={['开始日期', '结束日期']}
                        style={{ width: '100%' }}
                    />
                )

            case 'custom':
                return (
                    <div className={styles.customField}>
                        <span className={styles.customFieldPlaceholder}>
                            暂不支持自定义字段编辑
                        </span>
                    </div>
                )

            default:
                return <Input placeholder={field.placeholder} />
        }
    }

    const validateNameRepeat = (fid?: string) => {
        return (_: any, value: string) => {
            return new Promise((resolve, reject) => {
                const trimValue = trim(value)
                if (!trimValue) {
                    reject(new Error('输入不能为空'))
                    return
                }
                if (trimValue && !nameReg.test(trimValue)) {
                    reject(new Error('仅支持中英文、数字、下划线及中划线'))
                    return
                }
                const errorMsg = '该名称已存在，请重新输入'
                checkNameWorkOrderTemplate({
                    template_name: trimValue,
                    exclude_id: fid,
                })
                    .then((res) => {
                        if (res?.exists) {
                            reject(new Error(errorMsg))
                        } else {
                            resolve(1)
                        }
                    })
                    .catch(() => {
                        reject(new Error(errorMsg))
                    })
            })
        }
    }

    return (
        <Modal
            title={mode === 'create' ? '新增工单模板' : '编辑工单模板'}
            open={visible}
            onCancel={onCancel}
            width={800}
            bodyStyle={{
                maxHeight: '70vh',
                overflowY: 'auto',
            }}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    取消
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={loading}
                    onClick={() => form?.submit()}
                >
                    {mode === 'create' ? '确定' : '保存'}
                </Button>,
            ]}
        >
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="template_name"
                            label="模板名称"
                            validateTrigger={['onChange', 'onBlur']}
                            validateFirst
                            rules={[
                                { required: true, message: '请输入模板名称' },
                                {
                                    max: 100,
                                    message: '模板名称不能超过100个字符',
                                },
                                {
                                    required: true,
                                    validateTrigger: 'onChange',
                                    validator: validateName(),
                                },
                                {
                                    validateTrigger: 'onBlur',
                                    validator: validateNameRepeat(
                                        initialValues?.id,
                                    ),
                                },
                            ]}
                        >
                            <Input
                                placeholder="请输入模板名称"
                                maxLength={100}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="template_type"
                            label="工单类型"
                            rules={[
                                { required: true, message: '请选择工单类型' },
                            ]}
                        >
                            <Select
                                placeholder="请选择工单类型"
                                onChange={handleTypeChange}
                                disabled={mode === 'edit'} // 编辑模式下不允许修改类型
                            >
                                {WORK_ORDER_TYPES.map((type) => (
                                    <Option key={type.value} value={type.value}>
                                        {type.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    name="description"
                    label="模板描述"
                    rules={[{ max: 500, message: '描述不能超过500个字符' }]}
                >
                    <TextArea
                        placeholder="请输入模板描述"
                        rows={3}
                        maxLength={500}
                        showCount
                    />
                </Form.Item>

                {mode === 'edit' && (
                    <Form.Item
                        name="is_active"
                        label="启用状态"
                        valuePropName="checked"
                    >
                        <Switch
                            checkedChildren="启用"
                            unCheckedChildren="禁用"
                        />
                    </Form.Item>
                )}

                <div className={styles.formFields}>
                    <h3>模板内容配置</h3>
                    <Row gutter={16}>
                        {FORM_FIELDS_CONFIG[currentType]?.map(
                            (field, index) => (
                                <Col
                                    key={field.name}
                                    span={field.type === 'textarea' ? 24 : 12}
                                >
                                    <Form.Item
                                        name={field.name}
                                        label={field.label}
                                        rules={[
                                            {
                                                required: !!field.required,
                                                message: `请输入${field.label}`,
                                            },
                                        ].filter(Boolean)}
                                    >
                                        {renderFormField(field)}
                                    </Form.Item>
                                </Col>
                            ),
                        )}
                    </Row>
                </div>
            </Form>
        </Modal>
    )
}

export default TemplateForm
