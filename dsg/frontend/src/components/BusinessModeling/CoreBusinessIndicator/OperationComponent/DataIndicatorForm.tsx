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
    getCoreBusinessIndicatorDetail,
    updateCoreBusinessIndicator,
} from '@/core'
import { CycleList } from '../../const'
import __ from '../../locale'
import styles from './styles.module.less'
import FormsSelectConfig from './FormsSelectConfig'
import { useBusinessModelContext } from '../../BusinessModelProvider'
import { LabelTitle } from '../../helper'

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
const InnerDataIndicatorForm = (
    { mId, item, operate }: ICommonForm,
    ref: Ref<any>,
) => {
    const [form] = Form.useForm()

    const [fieldVisible, setFieldVisible] = useState<boolean>(false)
    const { isDraft, selectedVersion } = useBusinessModelContext()

    useImperativeHandle(ref, () => ({
        checkIsChange,
        handleSubmit,
        setValues,
        resetFields,
    }))

    const setValues = () => {
        if (item && operate === OperateType.EDIT) {
            getIndicatorInfo(item.id)
        }
    }

    const resetFields = () => {
        form.resetFields()
    }

    /**
     * 获取指标信息
     * @param indicatorId 指标ID
     * @returns 指标信息
     */
    const getIndicatorInfo = async (indicatorId: string) => {
        try {
            const res = await getCoreBusinessIndicatorDetail(indicatorId, {
                is_draft: isDraft,
                version_id: selectedVersion,
            })
            form.setFieldsValue({
                name: res.name,
                description: res.description,
                source_table: res.source_table,
            })
        } catch (err) {
            formatError(err)
        }
    }

    const handleSubmit = async () => {
        try {
            await form.validateFields()

            const fields = form.getFieldsValue()

            let itemInfo
            if (operate === OperateType.CREATE) {
                itemInfo = await createCoreBusinessIndicator(mId || '', fields)

                message.success(__('新建成功'))
            } else {
                itemInfo = await updateCoreBusinessIndicator(item?.id!, {
                    ...fields,
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
            <div className={styles.commonFormContent}>
                <Form
                    className={styles.baseInfoForm}
                    autoComplete="off"
                    form={form}
                    layout="vertical"
                >
                    <LabelTitle
                        label={__('基本信息')}
                        id="component-indictor-base"
                    />

                    <Form.Item
                        label={
                            <div className={styles.labelItemWrapper}>
                                <span>{__('指标名称')}</span>
                                {operate === OperateType.EDIT && (
                                    <span className={styles.labelTitle}>
                                        {__('指标编号：')}
                                        <span>202310201630-0001</span>
                                    </span>
                                )}
                            </div>
                        }
                        name="name"
                        required
                        validateFirst
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                            {
                                required: true,
                                validateTrigger: 'onChange',
                                validator: validateEmpty(),
                            },
                            {
                                pattern: nameReg,
                                message:
                                    __('仅支持中英文、数字、下划线及中划线'),
                                transform: (value) => trim(value),
                            },
                            {
                                validateTrigger: 'onBlur',
                                validator: (e, value) =>
                                    checkNameRepeat(
                                        value,
                                        mId || '',
                                        item?.name,
                                    ),
                            },
                        ]}
                    >
                        <Input
                            placeholder={__('请输入指标名称')}
                            maxLength={128}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    <Form.Item label={__('描述')} name="description">
                        <Input.TextArea
                            style={{ height: 80, resize: `none` }}
                            placeholder={__('请输入描述')}
                            maxLength={300}
                        />
                    </Form.Item>

                    <LabelTitle
                        label={__('统计信息')}
                        id="component-indicator-statistics"
                    />
                    <FormsSelectConfig
                        modelId={mId || ''}
                        formInstance={form}
                    />
                </Form>
            </div>
        </div>
    )
}

const DataIndicatorForm = forwardRef(InnerDataIndicatorForm)
DataIndicatorForm.displayName = 'DataIndicatorForm'

export default memo(DataIndicatorForm)
