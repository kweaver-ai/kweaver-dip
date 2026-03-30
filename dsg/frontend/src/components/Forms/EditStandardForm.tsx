import React, { useState, useEffect, useRef, useContext } from 'react'
import { Form, message, Input, Select, Space, FormItemProps } from 'antd'
import { slice, trim } from 'lodash'
import { useSize } from 'ahooks'
import {
    IFormEnumConfigModel,
    formsCreate,
    formsEdit,
    formatError,
} from '@/core'
import { ErrorInfo, keyboardCharactersReg, nameReg, OperateType } from '@/utils'
import CustomDrawer from '../CustomDrawer'
import styles from './styles.module.less'
import {
    validateNameLegitimacy,
    validateUniqueness,
    validateValueEmpty,
    validateValueLegitimacy,
} from './validate'
import { AddOutlined, RecycleBinOutlined } from '@/icons'
import { TaskInfoContext } from '@/context'
import __ from './locale'
import { checkNameRepeat } from './helper'

interface IEditFormModel {
    type: OperateType
    visible: boolean
    mid: string
    formItem?: any
    config?: IFormEnumConfigModel
    onClose?: () => void
    update?: () => void
}

/**
 * @param type OperateType 操作类型
 * @param visible boolean 显示/隐藏
 * @param mid string 业务模型id
 * @param formItem 表单信息
 * @param config IFormEnumConfigModel? 表单配置
 * @param onClose
 * @param update
 */
const EditStandardForm: React.FC<IEditFormModel> = ({
    visible,
    type = OperateType.CREATE,
    mid,
    formItem,
    config,
    onClose = () => {},
    update = () => {},
}) => {
    // 任务信息
    const { taskInfo } = useContext(TaskInfoContext)

    const [form] = Form.useForm()

    const ref = useRef<HTMLDivElement>(null)

    // 请求loading
    const [loading, setLoading] = useState(false)

    // 页面大小
    const size = useSize(ref)

    // 输入标签值
    const [tagValue, setTagValue] = useState('')

    const tagRepeat: FormItemProps = {
        validateStatus: 'error',
        help: __('该资源标签重复，请重新输入'),
    }

    const tagMax: FormItemProps = {
        validateStatus: 'error',
        help: __('仅支持创建5个标签'),
    }

    // 标签输入框FormItemProps
    const [formProps, setFormProps] = useState<FormItemProps | undefined>()

    // 数据范围
    const dataRange = (config &&
        config.data_range.length > 0 &&
        config.data_range.map((item) => {
            return { value: item.id, label: item.value }
        })) || [
        { value: 1, label: __('区县') },
        { value: 2, label: __('市直') },
        { value: 3, label: __('全市') },
    ]

    // 更新周期
    const updateCycle = (config &&
        config.update_cycle.length > 0 &&
        config.update_cycle.map((item) => {
            return { value: item.id, label: item.value }
        })) || [
        { value: 1, label: __('不定期') },
        { value: 6, label: __('实时') },
        { value: 11, label: __('每日') },
        { value: 16, label: __('每周') },
        { value: 21, label: __('每月') },
        { value: 26, label: __('每季度') },
        { value: 31, label: __('每半年') },
        { value: 36, label: __('每年') },
        { value: 99, label: __('其他') },
    ]

    useEffect(() => {
        setLoading(false)
        if (type === OperateType.EDIT && formItem && visible) {
            getFormDetail()
            return
        }
        setFormProps(undefined)
        setTagValue('')
        form.resetFields()
    }, [formItem, visible])

    // 获取表单详细信息
    const getFormDetail = () => {
        if (formItem) {
            const {
                name,
                description,
                guideline,
                data_range,
                update_cycle,
                resource_tag,
                source_system,
                source_business_scene,
                related_business_scene,
            } = formItem
            form.setFieldsValue({
                name,
                description,
                guideline,
                data_range,
                update_cycle,
                resource_tag: resource_tag || [],
                source_system: source_system || [''],
                source_business_scene: source_business_scene || [''],
                related_business_scene: related_business_scene || [''],
            })
        }
    }

    const onFinish = async () => {
        setLoading(true)
        try {
            await form.validateFields()
            const values = form.getFieldsValue()
            const {
                source_system,
                source_business_scene,
                related_business_scene,
            } = values
            const sourceSystem = (source_system as string[])
                .map((s) => (s === undefined ? '' : s.trim()))
                .filter((s) => s !== '')
            const sourceBusinessScene = (source_business_scene as string[])
                .map((s) => (s === undefined ? '' : s.trim()))
                .filter((s) => s !== '')
            const relatedBusinessScene = (related_business_scene as string[])
                .map((s) => (s === undefined ? '' : s.trim()))
                .filter((s) => s !== '')
            const params = {
                ...values,
                type: 2,
                source_system: sourceSystem,
                source_business_scene: sourceBusinessScene,
                related_business_scene: relatedBusinessScene,
                task_id: taskInfo.taskId,
            }
            // setLoading(true)
            if (type === OperateType.CREATE) {
                await formsCreate(mid, params)
                message.success(__('新建成功'))
            } else {
                await formsEdit(mid, formItem?.id, params)
                message.success(__('编辑成功'))
            }
            onClose()
            update()
        } catch (error) {
            if (error.errorFields) {
                return
            }
            formatError({ error })
        } finally {
            setLoading(false)
        }
    }

    const onValuesChange = (currentValue: any, allValues: any) => {
        const key = Object.keys(currentValue)[0]
        // 校验多项输入值
        if (
            [
                'source_system',
                'source_business_scene',
                'related_business_scene',
            ].includes(key)
        ) {
            allValues[key].forEach((_: any, index: number) => {
                form.validateFields([[key, index]])
            })
        }
    }

    const validateRepeat = (
        value: string,
        label: string,
        field: string,
    ): Promise<void> => {
        const fieldData = form.getFieldValue(field)

        if (Array.isArray(fieldData)) {
            const temp = fieldData.filter(
                (item) => item && value && trim(item) === trim(value),
            )
            if (temp.length > 1) {
                return Promise.reject(new Error(`该${label}重复，请重新输入`))
            }
        }
        return Promise.resolve()
    }

    // 表单布局
    const formItemLayout = {
        labelCol: {
            span: 4,
        },
        wrapperCol: {
            span: 16,
        },
    }
    const formItemLayoutWithOutLabel = {
        wrapperCol: {
            span: 16,
            offset: 4,
        },
    }

    // label信息
    const labelText = (text: string) => {
        return <span className={styles.textSecondaryColor}>{text}</span>
    }

    // 选择信息array
    const selectArr = [
        {
            name: 'data_range',
            label: __('数据范围'),
            placeholder: __('请选择数据范围'),
            options: dataRange.reverse(),
        },
        {
            name: 'update_cycle',
            label: __('更新周期'),
            placeholder: __('请选择更新周期'),
            options: updateCycle,
        },
    ]

    // 可增删input信息array
    const addDelInputArr = [
        {
            name: 'source_system',
            label: __('来源系统'),
            placeholder: __('请输入来源系统'),
        },
        {
            name: 'source_business_scene',
            label: __('来源业务场景'),
            placeholder: __('请输入来源业务场景'),
        },
        {
            name: 'related_business_scene',
            label: __('关联业务场景'),
            placeholder: __('请输入关联业务场景'),
        },
    ]

    const addDelInputList = (item) => (
        <Form.List initialValue={['']} name={item.name}>
            {(fields, { add, remove }) => {
                return (
                    <>
                        {fields.map((field, index) => (
                            <Form.Item
                                {...(index === 0
                                    ? formItemLayout
                                    : formItemLayoutWithOutLabel)}
                                label={index === 0 ? labelText(item.label) : ''}
                                key={field.key}
                            >
                                <Space className={styles.rowWrapper}>
                                    <Form.Item
                                        {...field}
                                        validateFirst
                                        rules={[
                                            {
                                                validator:
                                                    validateValueLegitimacy(
                                                        keyboardCharactersReg,
                                                        ErrorInfo.EXCEPTEMOJI,
                                                    ),
                                            },
                                            {
                                                validator: (e, value) =>
                                                    validateRepeat(
                                                        value,
                                                        item.label,
                                                        item.name,
                                                    ),
                                            },
                                        ]}
                                        noStyle
                                    >
                                        <Input
                                            style={{
                                                width: 520,
                                            }}
                                            placeholder={item.placeholder}
                                            maxLength={128}
                                        />
                                    </Form.Item>
                                    <span className={styles.btnWrapper}>
                                        <Form.Item
                                            noStyle
                                            shouldUpdate={(
                                                prevValues,
                                                curValues,
                                            ) =>
                                                prevValues[item.name] !==
                                                curValues[item.name]
                                            }
                                        >
                                            {({ getFieldValue }) => {
                                                const rbs: string[] =
                                                    getFieldValue(item.name)
                                                const showDel =
                                                    index !== 0 ||
                                                    rbs.length > 1 ||
                                                    rbs[index]
                                                const current = rbs[index]
                                                const temp = rbs.filter(
                                                    (v, i) => i !== index,
                                                )
                                                const enabled =
                                                    current &&
                                                    !temp.includes(current)
                                                return (
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            width: 56,
                                                        }}
                                                    >
                                                        {showDel && (
                                                            <RecycleBinOutlined
                                                                className={`${styles.deleteIcon} ${styles.iconEnabled}`}
                                                                onClick={() => {
                                                                    remove(
                                                                        field.name,
                                                                    )
                                                                    if (
                                                                        fields.length ===
                                                                        1
                                                                    ) {
                                                                        add()
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                        {fields.length ===
                                                            index + 1 &&
                                                            fields.length <
                                                                3 && (
                                                                <AddOutlined
                                                                    onClick={() =>
                                                                        enabled &&
                                                                        add()
                                                                    }
                                                                    className={`${
                                                                        styles.addIcon
                                                                    } ${
                                                                        enabled
                                                                            ? styles.iconEnabled
                                                                            : styles.iconDisabled
                                                                    }`}
                                                                />
                                                            )}
                                                    </div>
                                                )
                                            }}
                                        </Form.Item>
                                    </span>
                                </Space>
                            </Form.Item>
                        ))}
                    </>
                )
            }}
        </Form.List>
    )

    return (
        <div className={styles.editFormsWrapper}>
            <CustomDrawer
                open={visible}
                okButtonProps={{ loading }}
                onClose={onClose}
                handleOk={onFinish}
                headerWidth={`calc(100% - ${(size?.width || 1700) - 700}px)`}
                title={`${
                    type === OperateType.CREATE ? __('新建') : __('编辑')
                }${__('业务表')}`}
            >
                <div ref={ref} className={styles.formWrapper}>
                    <Form
                        form={form}
                        labelCol={{ span: 4 }}
                        wrapperCol={{ span: 16 }}
                        autoComplete="off"
                        initialValues={{ remember: true }}
                        onValuesChange={onValuesChange}
                    >
                        <Form.Item
                            label={labelText(__('业务表名称'))}
                            name="name"
                            required
                            validateFirst
                            validateTrigger={['onChange', 'onBlur']}
                            rules={[
                                {
                                    required: true,
                                    message: ErrorInfo.NOTNULL,
                                    transform: (value: string) => trim(value),
                                },
                                {
                                    validateTrigger: 'onBlur',
                                    validator: (e, value) =>
                                        checkNameRepeat(
                                            mid,
                                            value,
                                            formItem?.id,
                                        ),
                                },
                            ]}
                        >
                            <Input
                                className={styles.formsBase}
                                placeholder={__('请输入业务表名称')}
                                maxLength={128}
                            />
                        </Form.Item>
                        <Form.Item
                            label={labelText(__('描述'))}
                            name="description"
                            validateFirst
                            rules={[
                                {
                                    transform: (value: string) => trim(value),
                                    // validator: validateValueLegitimacy(
                                    //     keyboardCharactersReg,
                                    //     ErrorInfo.EXCEPTEMOJI,
                                    // ),
                                },
                            ]}
                        >
                            <Input.TextArea
                                className={styles.formsTextArea}
                                style={{
                                    height: 100,
                                    resize: `none`,
                                }}
                                placeholder={__('请输入描述')}
                                maxLength={255}
                            />
                        </Form.Item>
                        <Form.Item
                            label={labelText(__('参考标准'))}
                            name="guideline"
                            validateFirst
                            rules={[
                                {
                                    validator: validateValueLegitimacy(
                                        nameReg,
                                        ErrorInfo.ONLYSUP,
                                    ),
                                },
                            ]}
                        >
                            <Input
                                className={styles.formsBase}
                                placeholder={__('请输入参考标准')}
                                maxLength={128}
                            />
                        </Form.Item>
                        {selectArr.map((item) => (
                            <Form.Item
                                label={labelText(item.label)}
                                name={item.name}
                                required
                                validateFirst
                                rules={[
                                    {
                                        validator: validateValueEmpty(
                                            item.placeholder,
                                        ),
                                    },
                                ]}
                            >
                                <Select
                                    className={styles.formsBase}
                                    placeholder={item.placeholder}
                                    options={item.options}
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
                                />
                            </Form.Item>
                        ))}
                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, curValues) =>
                                prevValues.resource_tag !==
                                curValues.resource_tag
                            }
                        >
                            {({ getFieldValue, setFieldValue }) => {
                                const rbs: string[] =
                                    getFieldValue('resource_tag')
                                return (
                                    <Form.Item
                                        label={labelText(__('资源标签'))}
                                        name="resource_tag"
                                        validateFirst
                                        initialValue={[]}
                                        rules={[
                                            {
                                                type: 'array',
                                                defaultField: {
                                                    pattern:
                                                        keyboardCharactersReg,
                                                    message:
                                                        ErrorInfo.EXCEPTEMOJI,
                                                },
                                            },
                                            {
                                                validator: (e, value) =>
                                                    validateRepeat(
                                                        value,
                                                        '222',
                                                        'resource_tag',
                                                    ),
                                            },
                                        ]}
                                        {...formProps}
                                    >
                                        <Select
                                            mode="tags"
                                            className={styles.formsBase}
                                            placeholder={__(
                                                '支持输入5个资源标签，点击回车即可添加',
                                            )}
                                            open={false}
                                            maxTagTextLength={10}
                                            onChange={(e) => {
                                                if (e.length >= rbs.length) {
                                                    if (e.length > 5) {
                                                        setFieldValue(
                                                            'resource_tag',
                                                            slice(e, 0, 5),
                                                        )
                                                    } else {
                                                        setTagValue('')
                                                    }
                                                } else {
                                                    setFormProps(
                                                        e.includes(
                                                            trim(tagValue),
                                                        )
                                                            ? tagRepeat
                                                            : undefined,
                                                    )
                                                }
                                            }}
                                            onSearch={(e) => {
                                                if (trim(e).length <= 128) {
                                                    setTagValue(e)
                                                }
                                                if (e === '') {
                                                    setFormProps(undefined)
                                                } else if (rbs.length >= 5) {
                                                    setFormProps(tagMax)
                                                } else {
                                                    setFormProps(
                                                        rbs.includes(trim(e))
                                                            ? tagRepeat
                                                            : undefined,
                                                    )
                                                }
                                            }}
                                            searchValue={tagValue}
                                        />
                                    </Form.Item>
                                )
                            }}
                        </Form.Item>
                        {addDelInputArr.map((item) => addDelInputList(item))}
                    </Form>
                </div>
            </CustomDrawer>
        </div>
    )
}

export default EditStandardForm
