import React, { useEffect, useMemo, useState } from 'react'
import { Form, Input } from 'antd'
import { isEqual, isString } from 'lodash'
import { FormInstance } from 'antd/es/form/Form'
import styles from './styles.module.less'
import __ from '../locale'
import { useDataViewContext } from '../../DataViewProvider'
import { ErrorInfo } from '@/utils'
import NullRules from './NullRules'
import CodeAndStandard from './CodeAndStandard'
import RowRepeat from './RowRepeat'
import TimelinessRule from './TimelinessRule'
import RegRule from './RegRule'

interface IInternalRule {
    onFinish: (values) => void
    form: FormInstance<any>
    defaultValues?: any
    onDataChange?: (values) => void
    type: string
    isEdit?: boolean
    isStorage?: boolean
}

const InternalRule: React.FC<IInternalRule> = ({
    onFinish,
    form,
    defaultValues,
    onDataChange,
    type,
    isEdit,
    isStorage,
}) => {
    const { isTemplateConfig, explorationData } = useDataViewContext()
    const ruleFileds = ['rowRepeat', 'rowNull']
    const [showInternalRuleError, setShowInternalRuleError] =
        useState<boolean>(false)
    const [preRuleValue, setPreRuleValue] = useState<any>({})

    const activeField = useMemo(() => {
        return explorationData?.activeField
    }, [explorationData])

    const noLable = useMemo(() => {
        return type === 'rowNull' && isTemplateConfig
    }, [type, isTemplateConfig])

    useEffect(() => {
        if (type) {
            getDefaultValue(defaultValues)
        }
    }, [defaultValues, type])

    const getRuleComponents = () => {
        switch (type) {
            case 'null':
                return (
                    <NullRules
                        isStorage={isStorage}
                        showError={showInternalRuleError}
                        isEdit={isEdit}
                    />
                )
            case 'reg':
                return <RegRule />
            case 'code':
                return <CodeAndStandard isEdit={isEdit} type="code" />
            case 'standard':
                return <CodeAndStandard isEdit={isEdit} type="standard" />
            case 'rowRepeat':
                return <RowRepeat showError={showInternalRuleError} />
            case 'timeliness':
                return <TimelinessRule />
            case 'rowNull':
                return (
                    <RowRepeat
                        isRowNullRule
                        isEdit={isEdit}
                        showError={showInternalRuleError}
                    />
                )
            // 默认情况下返回null
            default:
                return null
        }
    }

    const getDefaultValue = (data: any) => {
        switch (type) {
            case 'null':
                form.setFieldValue('rule_config', data)
                break
            case 'reg':
                form.setFieldValue(
                    'rule_config',
                    data?.format?.regex || (isString(data) ? data : undefined),
                )
                break
            case 'code':
                form.setFieldValue('rule_config', data?.dict)
                break
            case 'standard':
                form.setFieldValue('rule_config', data)
                break
            case 'rowRepeat':
                form.setFieldValue('rule_config', data?.row_repeat)
                break
            case 'rowNull':
                form.setFieldValue('rule_config', data?.row_null)
                break
            case 'timeliness':
                form.setFieldValue('rule_config', data?.update_period)
                break
            default:
                break
        }
    }
    const validateRule = async (value: any): Promise<void> => {
        form.setFieldValue('rule_config', value)
        return Promise.resolve()
    }

    const onFormFinish = (values) => {
        const config = values
        const value = values?.rule_config
        let errText = ''
        switch (type) {
            case 'null':
                errText = value?.null?.some((item) => !item)
                    ? ErrorInfo.NOTNULL
                    : ''
                setShowInternalRuleError(true)
                break
            case 'code':
                errText = value?.dict?.data?.some(
                    (item) => !item.value || !item.code,
                )
                    ? ErrorInfo.NOTNULL
                    : ''
                break
            default:
                break
        }
        if (errText) {
            form.setFields([
                {
                    name: 'rule_config',
                    errors: [errText],
                    value,
                },
            ])
            return
        }
        if (
            type === 'rowNull' &&
            ((values?.rule_config?.row_null?.field_ids?.length < 2 &&
                !isTemplateConfig) ||
                !values?.rule_config?.row_null?.config?.length)
        ) {
            setShowInternalRuleError(true)
            return
        }
        if (
            type === 'rowRepeat' &&
            !values?.rule_config?.row_repeat?.field_ids?.length
        ) {
            setShowInternalRuleError(true)
            return
        }
        if (type === 'reg') {
            config.rule_config = {
                format: {
                    coding_rule_id: activeField?.standard_code || '',
                    regex: config.rule_config,
                },
            }
        }
        if (type === 'timeliness') {
            config.rule_config = {
                update_period: value,
            }
        }
        onFinish(config)
    }

    return (
        <div className={styles.internalRuleWrapper}>
            <Form
                form={form}
                layout="vertical"
                onFinish={onFormFinish}
                validateTrigger={['onChange', 'onBlur']}
                autoComplete="off"
                className={styles.form}
                onValuesChange={(changedValues) => {
                    if (!isEqual(changedValues, preRuleValue)) {
                        setPreRuleValue(changedValues)
                        onDataChange?.(changedValues)
                    }
                }}
            >
                <Form.Item
                    rules={[
                        {
                            required: true,
                            message:
                                type === 'code'
                                    ? __('请选择码表')
                                    : type === 'rowNull' || type === 'rowRepeat'
                                    ? ''
                                    : ErrorInfo.NOTNULL,
                        },
                        {
                            validateTrigger: ['onBlur', 'onChange'],
                            validator: (e, value) => validateRule(value),
                        },
                    ]}
                    label={
                        noLable
                            ? undefined
                            : ruleFileds.includes(type)
                            ? __('规则字段')
                            : __('规则配置')
                    }
                    name="rule_config"
                >
                    {getRuleComponents()}
                </Form.Item>
            </Form>
        </div>
    )
}

export default InternalRule
