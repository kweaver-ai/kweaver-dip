import { Form, Input, Select, message } from 'antd'
import { trim } from 'lodash'
import React, {
    Ref,
    forwardRef,
    memo,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react'
import { OperateType, nameReg } from '@/utils'
import {
    IBusinessIndicator,
    checkBizIndicatorNameRepeat,
    createCoreBusinessIndicator,
    formatError,
    updateCoreBusinessIndicator,
} from '@/core'
import { CycleList } from '../const'
import __ from '../locale'
import styles from './styles.module.less'
import FieldChoose from './FieldChoose'

interface ILabelTitle {
    label: string
}
const LabelTitle: React.FC<ILabelTitle> = ({ label }) => {
    return (
        <div className={styles.labelTitleWrapper}>
            <span className={styles.labelLine} />
            <span>{label}</span>
        </div>
    )
}

/**
 * 合法性校验
 * @returns
 */
export const validateEmpty = () => {
    return (_: any, value: string) => {
        return new Promise((resolve, reject) => {
            const trimValue = trim(value)
            if (!trimValue) {
                reject(new Error(__('输入不能为空')))
            }
            resolve(1)
        })
    }
}

/**
 * 检查名称重复
 * @param {string} name 输入值
 * @param {string} oldName 旧名称
 */
export const checkNameRepeat = async (
    name: string,
    mode_id: string,
    oldName?: string,
) => {
    try {
        if (!trim(name)) {
            return Promise.reject(new Error(__('输入不能为空')))
        }
        if (trim(name) === oldName) {
            return Promise.resolve()
        }
        const res = await checkBizIndicatorNameRepeat({
            name,
            mid: mode_id,
        })
        if (res?.repeat) {
            return Promise.reject(new Error(__('该指标名称已存在，请重新输入')))
        }
        return Promise.resolve()
    } catch (ex) {
        formatError(ex)
        return Promise.resolve()
    }
}

const isEqualObj = (prev: any, next: any) => {
    const keys = Object.keys(next || {})

    return !keys?.some((k) => (prev?.[k] ?? '') !== (next?.[k] ?? ''))
}

interface ICommonForm {
    mId?: string
    item?: IBusinessIndicator
    operate: OperateType
}

/**
 * 业务指标公用表单内容
 * @returns
 */
const InnerCommonForm = (
    { mId, item, operate }: ICommonForm,
    ref: Ref<any>,
) => {
    const [form] = Form.useForm()

    const [fieldVisible, setFieldVisible] = useState<boolean>(false)

    useImperativeHandle(ref, () => ({
        checkIsChange,
        handleSubmit,
        setValues,
        resetFields,
    }))

    const setValues = () => {
        if (item && operate === OperateType.EDIT) {
            const {
                name,
                code,
                description,
                calculation_formula,
                unit,
                statistics_cycle,
                statistical_caliber,
            } = item
            form.setFieldsValue({
                name,
                code,
                description,
                calculation_formula,
                unit,
                statistics_cycle,
                statistical_caliber,
            })
        }
    }

    const resetFields = () => {
        form.resetFields()
    }

    const handleSubmit = async () => {
        try {
            await form.validateFields()

            const fields = form.getFieldsValue()
            const params = {
                name: trim(fields?.name),
                description: trim(fields?.description),
                calculation_formula: trim(fields?.calculation_formula),
                unit: trim(fields?.unit),
                statistics_cycle: trim(fields?.statistics_cycle),
                statistical_caliber: trim(fields?.statistical_caliber),
            }

            let itemInfo
            if (operate === OperateType.CREATE) {
                itemInfo = await createCoreBusinessIndicator(mId || '', params)

                message.success(__('新建成功'))
            } else {
                itemInfo = await updateCoreBusinessIndicator(item?.id!, {
                    ...params,
                    mid: mId,
                })
                message.success(__('编辑成功'))
            }
            return true
        } catch (e) {
            if (e.errorFields) {
                return false
            }
            formatError(e)
        }
        return false
    }

    // 校验是否变动
    const checkIsChange = () => {
        const current = form.getFieldsValue()
        return isEqualObj(item, current)
    }

    /**
     * 插入字段
     */
    const handleInsert = () => {
        setFieldVisible(true)
    }

    /**
     * 确定插入字段
     * @param table 表
     * @param field 字段
     */
    const handleFieldSure = (table: any, field: any) => {
        const text = ` { ${table.name}.${field.name} } `
        const formulaText = form.getFieldValue('calculation_formula') || ''
        form?.setFieldsValue({ calculation_formula: formulaText + text })
        setFieldVisible(false)
    }

    return (
        <div className={styles['common-form']}>
            <Form
                className={styles.baseInfoForm}
                autoComplete="off"
                form={form}
                layout="horizontal"
                labelCol={{ flex: '90px' }}
            >
                <LabelTitle label={__('基本信息')} />

                <Form.Item
                    label={__('指标名称')}
                    name="name"
                    required
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    wrapperCol={{ span: 6 }}
                    rules={[
                        {
                            required: true,
                            validateTrigger: 'onChange',
                            validator: validateEmpty(),
                        },
                        {
                            pattern: nameReg,
                            message: __('仅支持中英文、数字、下划线及中划线'),
                            transform: (value) => trim(value),
                        },
                        {
                            validateTrigger: 'onBlur',
                            validator: (e, value) =>
                                checkNameRepeat(value, mId || '', item?.name),
                        },
                    ]}
                >
                    <Input placeholder={__('请输入指标名称')} maxLength={128} />
                </Form.Item>

                {operate === OperateType.EDIT && (
                    <Form.Item
                        label={__('指标编号')}
                        name="code"
                        wrapperCol={{ span: 6 }}
                    >
                        <Input placeholder={__('请输入指标编号')} disabled />
                    </Form.Item>
                )}

                <Form.Item
                    label={__('描述')}
                    name="description"
                    wrapperCol={{ span: 12 }}
                >
                    <Input.TextArea
                        style={{ height: 80, resize: `none` }}
                        placeholder={__('请输入描述')}
                        maxLength={300}
                    />
                </Form.Item>

                <LabelTitle label={__('统计信息')} />

                <div className={styles['insert-field']}>
                    <span onClick={handleInsert}>+ {__('插入字段')}</span>
                </div>
                <Form.Item
                    label={__('计算公式')}
                    name="calculation_formula"
                    wrapperCol={{ span: 6 }}
                >
                    <Input.TextArea
                        style={{ height: 80, resize: `none` }}
                        placeholder={__('请输入计算公式')}
                        maxLength={300}
                    />
                </Form.Item>

                <Form.Item
                    label={__('指标单位')}
                    required
                    name="unit"
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    wrapperCol={{ span: 6 }}
                    rules={[
                        {
                            required: true,
                            validateTrigger: ['onChange', 'onBlur'],
                            validator: validateEmpty(),
                        },
                    ]}
                >
                    <Input placeholder={__('请输入指标单位')} maxLength={10} />
                </Form.Item>

                <Form.Item
                    label={__('统计周期')}
                    required
                    name="statistics_cycle"
                    wrapperCol={{ span: 6 }}
                    rules={[
                        {
                            required: true,
                            message: __('请选择统计周期'),
                        },
                    ]}
                >
                    <Select
                        options={CycleList}
                        placeholder={__('请选择统计周期')}
                        style={{ color: 'rgba(0, 0, 0, 0.65)' }}
                    />
                </Form.Item>

                <Form.Item
                    label={__('统计口径')}
                    name="statistical_caliber"
                    wrapperCol={{ span: 12 }}
                >
                    <Input.TextArea
                        style={{ height: 160, resize: `none` }}
                        placeholder={__('请输入统计口径')}
                        maxLength={800}
                    />
                </Form.Item>
            </Form>
            <FieldChoose
                mid={mId}
                visible={fieldVisible}
                onClose={() => setFieldVisible(false)}
                onSure={handleFieldSure}
            />
        </div>
    )
}

const CommonForm = forwardRef(InnerCommonForm)
CommonForm.displayName = 'CommonForm'

export default memo(CommonForm)
