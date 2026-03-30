import * as React from 'react'
import { useState, useEffect } from 'react'
import {
    Checkbox,
    Col,
    Form,
    Input,
    Radio,
    Row,
    Select,
    Switch,
    Tooltip,
} from 'antd'
import { noop, trim } from 'lodash'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { FormInstance } from 'antd/es/form/Form'
import FormTitle from './FormTitle'
import __ from './locale'
import styles from './styles.module.less'
import FilterRules from './FilterRuler'
import { splitRulerData } from './helper'
import NumberInput from '@/ui/NumberInput'
import { NumberType } from '@/ui/NumberInput/const'
import { keyboardReg, nameEnReg } from '@/utils'

interface ResponseResultType {
    defaultValues?: any
    form: FormInstance<any>
    onFinsh: (values) => void
    responseData: Array<string>
    onDataChange?: () => void
}
interface CustomerInputType {
    value?: Array<any>
    onChange?: (values) => void
}
const CustomerInput = ({ value = [], onChange = noop }: CustomerInputType) => {
    const [data, setData] = useState<string>('')

    useEffect(() => {
        setData(
            value
                .map(
                    (currentData) =>
                        `${currentData?.param} ${currentData?.operator} ${currentData?.value}`,
                )
                .join('\n'),
        )
    }, [value])
    return (
        <Input.TextArea
            placeholder={__('请输入')}
            onBlur={(e) => {
                const textContent: Array<string> = e.target.value.split('\n')
                const paramData = textContent
                    .map((currentData, currentIndex) => {
                        return splitRulerData(currentData)
                    })
                    .filter((currentData) => currentData !== '')

                onChange(paramData)
            }}
            onChange={(e) => {
                setData(e.target.value)
            }}
            value={data}
            className={styles.formCustomerInput}
            autoComplete="off"
        />
    )
}

const checkCustomRules = (rule, data) => {
    const params = data.map((currentRule) => currentRule.param)
    const values = data.map((currentRule) => currentRule.value)
    if (params.find((param) => param.length > 128)) {
        return Promise.reject(
            new Error('信息项名称长度不能超过128，请检查当前规则中的信息项！'),
        )
    }
    if (values.find((value) => value.length > 128)) {
        return Promise.reject(
            new Error('值长度不能超过128，请检查当前规则中的值！'),
        )
    }
    if (params.find((param) => !nameEnReg.test(param))) {
        return Promise.reject(
            new Error('存在信息项名称不合法，仅支持英文、数字、下划线及中划线'),
        )
    }
    if (values.find((value) => !keyboardReg.test(value))) {
        return Promise.reject(
            new Error('存在值不合法，仅支持中英文、数字、及键盘上的特殊字符'),
        )
    }
    return Promise.resolve()
}
const ResponseResult = ({
    defaultValues = {},
    form,
    onFinsh,
    responseData,
    onDataChange = noop,
}: ResponseResultType) => {
    const [ruleType, setRuleType] = useState<'general' | 'customer'>('general')
    const [errorMessage, setErrorMessage] = useState<string>('')
    return (
        <Form
            className={styles.responseResult}
            initialValues={
                ruleType === 'general'
                    ? {
                          ...defaultValues,
                          rules: defaultValues?.rules?.length
                              ? defaultValues?.rules
                              : [{}],
                      }
                    : defaultValues
            }
            form={form}
            onFinish={onFinsh}
            autoComplete="off"
            onValuesChange={() => {
                onDataChange()
            }}
        >
            <FormTitle title={__('分页设置')} />
            <div className={styles.formInfoContent}>
                <div className={styles.pageConfigTitle}>
                    {__(
                        '返回结果每页最多不超过1000条，不设置至多展示1000条数据',
                    )}
                </div>
                <div className={styles.pageConfigInfo}>
                    <span className={styles.label}>{__('每页')}</span>
                    <Form.Item name="page_size" noStyle>
                        <NumberInput
                            type={NumberType.Natural}
                            style={{ width: 114 }}
                            max={1000}
                            min={1}
                        />
                    </Form.Item>
                    <span className={styles.unit}>{__('条')}</span>
                </div>
            </div>
            <FormTitle title={__('过滤规则')} />
            <div className={styles.formInfoContent}>
                <div className={styles.pageConfigTitle}>
                    {__(
                        '设置规则，可获取指定条件的数据，条件之间均为“且”的关系',
                    )}
                </div>
                <div className={styles.pageRulerInfo}>
                    <div className={styles.rulerTypeRadio}>
                        <span className={styles.label}>{__('规则类型')}</span>
                        <Radio.Group
                            onChange={async (e) => {
                                await form.validateFields()

                                const rulesData = form.getFieldValue('rules')
                                if (rulesData?.length) {
                                    const newRules = rulesData.filter(
                                        (rule) => {
                                            return (
                                                rule?.param !== undefined &&
                                                rule?.param !== '' &&
                                                rule?.operator !== undefined &&
                                                rule?.operator !== '' &&
                                                rule?.value !== undefined &&
                                                rule?.value !== ''
                                            )
                                        },
                                    )
                                    form.setFieldValue(
                                        'rules',
                                        e.target.value === 'general' &&
                                            !newRules.length
                                            ? [{}]
                                            : newRules,
                                    )
                                } else {
                                    form.setFieldValue(
                                        'rules',
                                        e.target.value === 'general'
                                            ? [{}]
                                            : [],
                                    )
                                }
                                setRuleType(e.target.value)
                            }}
                            value={ruleType}
                        >
                            <Radio value="general">{__('常规')}</Radio>
                            <Radio value="customer">{__('自定义规则')}</Radio>
                        </Radio.Group>
                    </div>

                    {ruleType === 'general' ? (
                        <div className={styles.rulersConfig}>
                            <FilterRules responseData={responseData} />
                        </div>
                    ) : (
                        <div className={styles.rulersConfig}>
                            <Form.Item
                                name="rules"
                                rules={[
                                    {
                                        validateTrigger: ['onBlur', 'onChange'],
                                        validator: checkCustomRules,
                                    },
                                ]}
                            >
                                <CustomerInput />
                            </Form.Item>
                            <div className={styles.rulerBottomToolBar}>
                                <div className={styles.leftBar}>
                                    <div className={styles.errorInfo}>
                                        <div>{errorMessage}</div>
                                    </div>
                                </div>
                                <div className={styles.rightBar}>
                                    <div className={styles.label}>
                                        {__('脚本示例')}
                                    </div>
                                    <Tooltip
                                        placement="bottom"
                                        title={
                                            <div>
                                                <div>
                                                    {__('多个规则换行分隔')}
                                                </div>
                                                <div>a = 1</div>
                                                <div>{' b > 1'}</div>
                                                <div>c in (1,2,3)</div>
                                            </div>
                                        }
                                    >
                                        <QuestionCircleOutlined
                                            className={styles.titleHelper}
                                        />
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Form>
    )
}

export default ResponseResult
