import React, { useState, useEffect, useRef, useContext } from 'react'
import { Form, Input, Row, Select, message, InputNumber, Col } from 'antd'
import { trim } from 'lodash'
import { Rule } from 'antd/lib/form'
import {
    OperateType,
    ErrorInfo,
    keyboardCharactersReg,
    nameEnReg,
    numberReg,
    beginWith0,
    extendNameCnReg,
    entendNameEnReg,
} from '@/utils'
import {
    formatError,
    createBusinessStandard,
    IStandardEnum,
    quertStandardDetails,
    editBusinessStandard,
} from '@/core'
import CustomDrawer from '@/components/CustomDrawer'
import styles from './styles.module.less'
import {
    numberAndStringTypeArr,
    numberText,
    numberTypeArr,
    YesOrNo,
} from './const'
import { XlsColored } from '@/icons'
import { TaskInfoContext } from '@/context'
import __ from './locale'

interface ICreateStandard {
    visible: boolean
    type?: OperateType
    modalId: string
    standardId?: number
    formId?: string
    formName?: string
    standardEnum?: IStandardEnum
    onClose?: () => void
    update?: () => void
}

const CreateStandard: React.FC<ICreateStandard> = ({
    visible,
    type = OperateType.CREATE,
    modalId,
    standardId,
    formId,
    formName,
    standardEnum,
    onClose = () => {},
    update = () => {},
}) => {
    const [form] = Form.useForm()

    const [loading, setLoading] = useState(false)

    const { taskInfo } = useContext(TaskInfoContext)

    // 编辑时获取标准详情回显数据
    const getStandardDetail = async () => {
        if (!standardId) return
        try {
            const res = await quertStandardDetails(modalId, formId!, standardId)
            form.setFieldsValue({
                ...res.additional_attributes,
                ...res.base_info,
                ...res.business_attributes,
                ...res.technical_attributes,
                // formulate_basis 标准分类为空时，后端返回0 需处理展示空
                formulate_basis:
                    res.business_attributes?.formulate_basis || undefined,
            })
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (type === OperateType.EDIT && visible && standardId && formId) {
            getStandardDetail()
            return
        }
        form.resetFields()
    }, [standardId, visible, formId])

    const handleOk = async () => {
        form.submit()
    }

    const onFinish = async (values) => {
        try {
            const data = {
                ...values,
                data_length:
                    values.data_length || values.data_length === 0
                        ? Number(values.data_length)
                        : undefined,
                data_accuracy:
                    values.data_accuracy || values.data_accuracy === 0
                        ? Number(values.data_accuracy)
                        : undefined,
                sid: standardId,
                task_id: taskInfo.taskId,
            }

            const params = {
                task_id: taskInfo.taskId,
                standards: [{ ...data }],
            }

            setLoading(true)
            await (type === OperateType.CREATE
                ? createBusinessStandard(modalId, formId!, data)
                : editBusinessStandard(modalId, formId!, params))
            message.success(
                type === OperateType.CREATE ? __('新建成功') : __('编辑成功'),
            )
            setLoading(false)
            onClose()

            // 更新标准列表
            update()
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 通用获取规则
    const getRules = (
        required: boolean,
        regExp: RegExp,
        regExpMessage: string = ErrorInfo.ONLYSUP,
    ) => {
        const rules: Rule[] = []
        if (required) {
            rules.push({
                required: true,
                transform: (val) => trim(val),
                message: ErrorInfo.NOTNULL,
            })
        }
        if (regExp) {
            rules.push({
                pattern: regExp,
                message: regExpMessage,
                transform: (value) => trim(value),
            })
        }

        return rules
    }

    // 校验数据大小是否在 0~65535 或 0到65
    const validateDataLength = (
        value: string,
        max: number,
        errorInfo: ErrorInfo,
    ): Promise<void> => {
        const trimValue = Number(trim(value))
        if (trimValue < 0 || trimValue > max) {
            return Promise.reject(new Error(errorInfo))
        }
        return Promise.resolve()
    }

    // 校验数据精度不能大于数据长度
    const validateIsOverthanDataLength = (
        value: string,
        errorInfo: string,
    ): Promise<void> => {
        const dataLength = form.getFieldValue('data_length')
        if (dataLength && Number(value) > Number(dataLength)) {
            return Promise.reject(new Error(errorInfo))
        }
        return Promise.resolve()
    }

    // 失焦时判断是否输入为0开头，0开头去掉0
    const delBegin0OnBlur = (value: string, field: string) => {
        if (value?.startsWith('0') && value !== '0') {
            form.setFieldsValue({
                [field]: value.replace(beginWith0, ''),
            })
        }
    }

    const getCommonOptions = (placeholder: string) => (
        <Select
            placeholder={placeholder}
            getPopupContainer={(node) => node.parentNode}
        >
            <Select.Option value={YesOrNo.Yes}>{__('是')}</Select.Option>
            <Select.Option value={YesOrNo.No}>{__('否')}</Select.Option>
        </Select>
    )

    const onFieldsChange = (changedFields) => {
        if (changedFields[0]?.name[0] === 'data_length') {
            form.validateFields(['data_accuracy'])
        }
        if (changedFields[0]?.name[0] === 'data_type') {
            form.resetFields(['data_length'])
        }
    }
    return (
        <div className={styles.createStandard}>
            <CustomDrawer
                open={visible}
                loading={loading}
                onClose={onClose}
                handleOk={handleOk}
                headerWidth={1086}
                title={`${
                    type === OperateType.CREATE ? __('新建') : __('编辑')
                }${__('字段')}`}
                titleExtend={
                    <div className={styles.formName}>
                        {__('业务表名称')}
                        {__('：')} <XlsColored className={styles.xlsIcon} />
                        {formName}
                    </div>
                }
            >
                <div className={styles.formWrapper}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        autoComplete="off"
                        onFieldsChange={onFieldsChange}
                    >
                        <div className={styles.title}>{__('字段信息')}</div>

                        <Row>
                            <Form.Item
                                label={__('字段中文名称')}
                                name="name"
                                validateTrigger={['onChange', 'onBlur']}
                                validateFirst
                                rules={[
                                    ...getRules(
                                        true,
                                        extendNameCnReg,
                                        ErrorInfo.EXTENDCNNAME,
                                    ),
                                ]}
                                className={styles.w532}
                            >
                                <Input
                                    placeholder={__('请输入字段中文名称')}
                                    maxLength={128}
                                />
                            </Form.Item>
                            <Form.Item
                                label={__('字段英文名称')}
                                name="name_en"
                                validateTrigger={['onChange', 'onBlur']}
                                validateFirst
                                rules={[
                                    ...getRules(
                                        true,
                                        entendNameEnReg,
                                        ErrorInfo.EXTENDENNAME,
                                    ),
                                ]}
                                className={`${styles.w532} ${styles.ml20}`}
                            >
                                <Input
                                    placeholder={__('请输入字段英文名称')}
                                    maxLength={128}
                                />
                            </Form.Item>
                        </Row>
                        <div className={styles.title}>{__('字段业务属性')}</div>
                        <Row>
                            <Form.Item
                                label={__('是否本业务产生')}
                                name="is_current_business_generation"
                                rules={[
                                    {
                                        required: true,
                                        message: __('请选择是否本业务产生'),
                                    },
                                ]}
                                className={styles.w256}
                            >
                                {getCommonOptions(__('请选择是否本业务产生'))}
                            </Form.Item>
                            <Form.Item
                                label={__('标准主题')}
                                name="standard_theme"
                                rules={getRules(
                                    false,
                                    keyboardCharactersReg,
                                    ErrorInfo.EXCEPTEMOJI,
                                )}
                                className={`${styles.w256} ${styles.ml20}`}
                            >
                                <Input
                                    placeholder={__('请输入标准主题')}
                                    maxLength={128}
                                />
                            </Form.Item>
                            <Form.Item
                                label={__('一级分类')}
                                name="primary_class"
                                rules={getRules(
                                    false,
                                    keyboardCharactersReg,
                                    ErrorInfo.EXCEPTEMOJI,
                                )}
                                className={`${styles.w256} ${styles.ml20}`}
                            >
                                <Input
                                    placeholder={__('请输入一级分类')}
                                    maxLength={128}
                                />
                            </Form.Item>
                            <Form.Item
                                label={__('二级分类')}
                                name="secondary_class"
                                rules={getRules(
                                    false,
                                    keyboardCharactersReg,
                                    ErrorInfo.EXCEPTEMOJI,
                                )}
                                className={`${styles.w256} ${styles.ml20}`}
                            >
                                <Input
                                    placeholder={__('请输入二级分类')}
                                    maxLength={128}
                                />
                            </Form.Item>
                        </Row>
                        <Row>
                            <Form.Item
                                label={__('标准分类（标准级别）')}
                                name="formulate_basis"
                                className={styles.w256}
                            >
                                <Select
                                    placeholder={__(
                                        '请选择标准分类（标准级别）',
                                    )}
                                    allowClear
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
                                >
                                    {standardEnum?.formulate_basis.map(
                                        (item) => (
                                            <Select.Option
                                                value={item.value}
                                                key={item.value}
                                            >
                                                {item.type}
                                            </Select.Option>
                                        ),
                                    )}
                                </Select>
                            </Form.Item>
                            <Form.Item
                                label={__('业务定义')}
                                name="business_definition"
                                rules={getRules(
                                    false,
                                    keyboardCharactersReg,
                                    ErrorInfo.EXCEPTEMOJI,
                                )}
                                className={`${styles.w532} ${styles.ml20}`}
                            >
                                <Input
                                    placeholder={__('请输入业务定义')}
                                    maxLength={128}
                                />
                            </Form.Item>
                            <Form.Item
                                label={__('标准来源规范文件')}
                                name="standard_source_specification_document"
                                rules={getRules(
                                    false,
                                    keyboardCharactersReg,
                                    ErrorInfo.EXCEPTEMOJI,
                                )}
                                className={`${styles.w256} ${styles.ml20}`}
                            >
                                <Input
                                    placeholder={__('请输入标准来源规范文件')}
                                    maxLength={128}
                                />
                            </Form.Item>
                        </Row>
                        <div className={styles.title}>{__('字段技术属性')}</div>
                        <Row gutter={20}>
                            <Col span={6}>
                                <Form.Item
                                    label={__('数据类型')}
                                    name="data_type"
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请选择数据类型'),
                                        },
                                    ]}
                                >
                                    <Select
                                        placeholder={__('请选择数据类型')}
                                        getPopupContainer={(node) =>
                                            node.parentNode
                                        }
                                    >
                                        {standardEnum?.data_type.map((item) => (
                                            <Select.Option
                                                value={item.type}
                                                key={item.value}
                                            >
                                                {item.type}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Form.Item
                                noStyle
                                shouldUpdate={(pre, cur) =>
                                    pre.data_type !== cur.data_type
                                }
                            >
                                {({ getFieldValue }) => {
                                    const dataType = getFieldValue('data_type')
                                    const isShow =
                                        numberAndStringTypeArr.includes(
                                            dataType,
                                        )
                                    return isShow ? (
                                        <Col span={6}>
                                            <Form.Item
                                                label={__('数据长度')}
                                                name="data_length"
                                                validateFirst
                                                rules={[
                                                    ...getRules(
                                                        false,
                                                        numberReg,
                                                        dataType === numberText
                                                            ? ErrorInfo.ONLY0TO65
                                                            : ErrorInfo.ONLY0TO65535,
                                                    ),
                                                    {
                                                        validator: (e, value) =>
                                                            validateDataLength(
                                                                value,
                                                                dataType ===
                                                                    numberText
                                                                    ? 65
                                                                    : 65535,
                                                                dataType ===
                                                                    numberText
                                                                    ? ErrorInfo.ONLY0TO65
                                                                    : ErrorInfo.ONLY0TO65535,
                                                            ),
                                                    },
                                                ]}
                                            >
                                                <Input
                                                    placeholder={
                                                        dataType === numberText
                                                            ? __(
                                                                  '仅支持数字，0～65整数',
                                                              )
                                                            : __(
                                                                  '仅支持数字，0～65535整数',
                                                              )
                                                    }
                                                    onBlur={(e) =>
                                                        delBegin0OnBlur(
                                                            e.target.value,
                                                            'data_length',
                                                        )
                                                    }
                                                />
                                            </Form.Item>
                                        </Col>
                                    ) : null
                                }}
                            </Form.Item>

                            <Form.Item
                                noStyle
                                shouldUpdate={(pre, cur) =>
                                    pre.data_type !== cur.data_type
                                }
                            >
                                {({ getFieldValue }) => {
                                    const isShow = numberTypeArr.includes(
                                        getFieldValue('data_type'),
                                    )
                                    return isShow ? (
                                        <Col span={6}>
                                            <Form.Item
                                                label={__('数据精度')}
                                                name="data_accuracy"
                                                validateFirst
                                                rules={[
                                                    ...getRules(
                                                        false,
                                                        numberReg,
                                                        ErrorInfo.ONLY0TO30,
                                                    ),
                                                    {
                                                        validator: (e, value) =>
                                                            validateDataLength(
                                                                value,
                                                                30,
                                                                ErrorInfo.ONLY0TO30,
                                                            ),
                                                    },
                                                    {
                                                        validator: (e, value) =>
                                                            validateIsOverthanDataLength(
                                                                value,
                                                                __(
                                                                    '数据精度不能大于数据长度',
                                                                ),
                                                            ),
                                                    },
                                                ]}
                                            >
                                                <Input
                                                    placeholder={__(
                                                        '仅支持数字，0～30整数',
                                                    )}
                                                    onBlur={(e) =>
                                                        delBegin0OnBlur(
                                                            e.target.value,
                                                            'data_accuracy',
                                                        )
                                                    }
                                                />
                                            </Form.Item>
                                        </Col>
                                    ) : null
                                }}
                            </Form.Item>

                            <Col span={6}>
                                <Form.Item label={__('计量单位')} name="unit">
                                    <Input
                                        placeholder={__('请输入计量单位')}
                                        maxLength={128}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    label={__('是否主键')}
                                    name="is_primary_key"
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请选择是否主键'),
                                        },
                                    ]}
                                >
                                    {getCommonOptions(__('请选择是否主键'))}
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    label={__('是否增量字段')}
                                    name="is_incremental_field"
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请选择是否增量字段'),
                                        },
                                    ]}
                                >
                                    {getCommonOptions(__('请选择是否增量字段'))}
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    label={__('是否必填')}
                                    name="is_required"
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请选择是否必填'),
                                        },
                                    ]}
                                >
                                    {getCommonOptions(__('请选择是否必填'))}
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    label={__('码表')}
                                    name="code_table"
                                    rules={getRules(
                                        false,
                                        keyboardCharactersReg,
                                        ErrorInfo.EXCEPTEMOJI,
                                    )}
                                >
                                    <Input
                                        placeholder={__('请输入码表')}
                                        maxLength={128}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    label={__('值域')}
                                    name="value_range"
                                    rules={getRules(
                                        false,
                                        keyboardCharactersReg,
                                        ErrorInfo.EXCEPTEMOJI,
                                    )}
                                >
                                    <Input
                                        placeholder={__('请输入值域')}
                                        maxLength={128}
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={6}>
                                <Form.Item
                                    label={__('编码规则')}
                                    name="encoding_rule"
                                    rules={getRules(
                                        false,
                                        keyboardCharactersReg,
                                        ErrorInfo.EXCEPTEMOJI,
                                    )}
                                >
                                    <Input
                                        placeholder={__('请输入编码规则')}
                                        maxLength={128}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    label={__('字段关系')}
                                    name="field_relationship"
                                    rules={getRules(
                                        false,
                                        keyboardCharactersReg,
                                        ErrorInfo.EXCEPTEMOJI,
                                    )}
                                >
                                    <Input
                                        placeholder={__('请输入字段关系')}
                                        maxLength={128}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        <div className={styles.title}>{__('字段附加属性')}</div>
                        <Row>
                            <Form.Item
                                label={__('样例')}
                                name="sample"
                                rules={getRules(
                                    false,
                                    keyboardCharactersReg,
                                    ErrorInfo.EXCEPTEMOJI,
                                )}
                                className={styles.w532}
                            >
                                <Input
                                    placeholder={__('请输入样例')}
                                    maxLength={255}
                                />
                            </Form.Item>
                            <Form.Item
                                label={__('说明')}
                                name="explanation"
                                rules={getRules(
                                    false,
                                    keyboardCharactersReg,
                                    ErrorInfo.EXCEPTEMOJI,
                                )}
                                className={`${styles.w532} ${styles.ml20}`}
                            >
                                <Input
                                    placeholder={__('请输入说明')}
                                    maxLength={255}
                                />
                            </Form.Item>
                        </Row>
                        <Row>
                            <Form.Item
                                label={__('敏感属性')}
                                name="sensitive_attribute"
                                rules={[
                                    {
                                        required: true,
                                        message: __('请选择敏感属性'),
                                    },
                                ]}
                                className={styles.w256}
                            >
                                <Select
                                    placeholder={__('请选择敏感属性')}
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
                                >
                                    {standardEnum?.sensitive_attribute.map(
                                        (item) => (
                                            <Select.Option
                                                value={item.value}
                                                key={item.value}
                                            >
                                                {item.type}
                                            </Select.Option>
                                        ),
                                    )}
                                </Select>
                            </Form.Item>
                            <Form.Item
                                label={__('涉密属性')}
                                name="confidential_attribute"
                                rules={[
                                    {
                                        required: true,
                                        message: __('请选择涉密属性'),
                                    },
                                ]}
                                className={`${styles.w256} ${styles.ml20}`}
                            >
                                <Select
                                    placeholder={__('请选择涉密属性')}
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
                                >
                                    {standardEnum?.confidential_attribute.map(
                                        (item) => (
                                            <Select.Option
                                                value={item.value}
                                                key={item.value}
                                            >
                                                {item.type}
                                            </Select.Option>
                                        ),
                                    )}
                                </Select>
                            </Form.Item>
                            <Form.Item
                                label={__('共享属性')}
                                name="shared_attribute"
                                rules={[
                                    {
                                        required: true,
                                        message: __('请选择共享属性'),
                                    },
                                ]}
                                className={`${styles.w256} ${styles.ml20}`}
                            >
                                <Select
                                    placeholder={__('请选择共享属性')}
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
                                >
                                    {standardEnum?.shared_attribute.map(
                                        (item) => (
                                            <Select.Option
                                                value={item.value}
                                                key={item.value}
                                            >
                                                {item.type}
                                            </Select.Option>
                                        ),
                                    )}
                                </Select>
                            </Form.Item>
                            <Form.Item
                                label={__('开放属性')}
                                name="open_attribute"
                                rules={[
                                    {
                                        required: true,
                                        message: __('请选择开放属性'),
                                    },
                                ]}
                                className={`${styles.w256} ${styles.ml20}`}
                            >
                                <Select
                                    placeholder={__('请选择开放属性')}
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
                                >
                                    {standardEnum?.open_attribute.map(
                                        (item) => (
                                            <Select.Option
                                                value={item.value}
                                                key={item.value}
                                            >
                                                {item.type}
                                            </Select.Option>
                                        ),
                                    )}
                                </Select>
                            </Form.Item>
                        </Row>
                    </Form>
                </div>
            </CustomDrawer>
        </div>
    )
}
export default CreateStandard
