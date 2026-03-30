import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
    AutoComplete,
    Button,
    Form,
    InputNumber,
    Modal,
    Space,
    Spin,
    Tooltip,
} from 'antd'
import { trim } from 'lodash'
import classNames from 'classnames'
import __ from '../locale'
import styles from './styles.module.less'
import { Empty, Loader } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import {
    DateParseRuleExample,
    ParseRuleVar,
    TimeParseRuleExample,
} from '../const'
import TestFail from './TestFail'
import TestSuccess from './TestSuccess'
import { convertRuleVerify, formatError, IConvertRuleVerifyRes } from '@/core'
import { FontIcon } from '@/icons'
import { cancelRequest } from '@/utils'

interface Option {
    value: string | number
    label: React.ReactNode
    example?: string
    children?: Option[]
}

interface ConfigParseRuleProps {
    open: boolean
    onClose: () => void
    onCancel: () => void
    onOk: (vals: any) => void
    currentType: string
    targetType: string
    fieldData: any
}

const ConfigParseRule: React.FC<ConfigParseRuleProps> = ({
    open,
    onClose,
    onCancel,
    onOk,
    currentType,
    targetType,
    fieldData,
}) => {
    const [form] = Form.useForm()
    const [dateOptions, setDateOptions] = useState<any[]>([])
    const [isTested, setIsTested] = useState(false)
    const [isTestFailed, setIsTestFailed] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [testData, setTestData] = useState<IConvertRuleVerifyRes>()
    const [isEmptyRule, setIsEmptyRule] = useState(false)

    useEffect(() => {
        setIsEmptyRule(
            ['date', 'timestamp', 'decimal', 'time'].includes(targetType),
        )
    }, [targetType])

    useEffect(() => {
        if (!targetType || !currentType) return
        const parseRuleExample = ['date', 'timestamp'].includes(targetType)
            ? DateParseRuleExample
            : targetType === 'time'
            ? TimeParseRuleExample
            : []
        const isCustomRule = fieldData.reset_convert_rules
            ? !parseRuleExample.some((item) =>
                  item.children.some(
                      (child) => child.rule === fieldData.reset_convert_rules,
                  ),
              )
            : false

        const customRuleOption = isCustomRule
            ? [
                  {
                      label: '',
                      options: [
                          {
                              value: fieldData.reset_convert_rules,
                              label: (
                                  <div
                                      className={classNames(
                                          styles['var-item'],
                                          styles['custom-var-item'],
                                      )}
                                  >
                                      <span className={styles['var-rule']}>
                                          {fieldData.reset_convert_rules}
                                      </span>
                                      <span className={styles['var-example']}>
                                          {__('当前在使用自定义规则')}
                                      </span>
                                  </div>
                              ),
                          },
                      ],
                  },
              ]
            : []
        setDateOptions([
            ...customRuleOption,
            ...parseRuleExample.map((item) => {
                return {
                    label: (
                        <span className={styles['label-name']}>
                            {item.name}
                        </span>
                    ),
                    options: item.children.map((child) => {
                        return {
                            value: child.rule,
                            label: (
                                <div className={styles['var-item']}>
                                    <span className={styles['var-rule']}>
                                        {child.rule}
                                    </span>
                                    <span className={styles['var-example']}>
                                        {__('示例：')}
                                        {child.example}
                                    </span>
                                </div>
                            ),
                        }
                    }),
                }
            }),
        ])
    }, [targetType, currentType, fieldData])

    useEffect(() => {
        if (!targetType || !currentType) return
        if (open) {
            // 编辑高精度型
            if (
                fieldData.reset_data_length &&
                (fieldData.reset_data_accuracy ||
                    fieldData.reset_data_accuracy === 0)
            ) {
                form.setFieldsValue({
                    data_length: fieldData.reset_data_length,
                    data_accuracy: fieldData.reset_data_accuracy,
                })
            }
            // 编辑 日期 日期时间 时间
            else if (fieldData.reset_convert_rules) {
                form.setFieldsValue({
                    reset_convert_rules: fieldData.reset_convert_rules,
                })
                // 第一次转换为高精度型
            } else if (targetType === 'decimal') {
                form.setFieldsValue({
                    data_length:
                        fieldData.data_length > 38 ? 38 : fieldData.data_length,
                })
            }
        }
    }, [open, fieldData, targetType])

    useEffect(() => {
        if (!targetType || !currentType || currentType === targetType) return
        // 非日期、时间戳、高精度类型，自动测试
        if (
            open &&
            targetType &&
            !['date', 'timestamp', 'decimal', 'time'].includes(targetType)
        ) {
            onFinish({})
        }
    }, [open, targetType])

    const onFinish = async (values: any) => {
        try {
            setIsLoading(true)
            setIsTested(true)
            const params =
                targetType === 'decimal'
                    ? {
                          data_length: Number(values.data_length),
                          data_accuracy: Number(values.data_accuracy),
                      }
                    : ['date', 'time', 'timestamp'].includes(targetType)
                    ? {
                          convert_rules: values.reset_convert_rules,
                      }
                    : {}
            const res = await convertRuleVerify({
                ...params,
                field_id: fieldData.id,
                reset_data_type: targetType,
            })
            setIsTestFailed(false)
            setTestData(res)
        } catch (error) {
            // formatError(error)
            setIsTestFailed(true)
            setErrorMsg(error?.data?.description)
        } finally {
            setIsLoading(false)
        }
    }

    const validateDataLength = (
        value: string,
        min: number,
        max: number,
        errorInfo: string,
    ): Promise<void> => {
        const trimValue = Number(trim(value))
        if (Number.isNaN(trimValue) || trimValue < min || trimValue > max) {
            return Promise.reject(new Error(errorInfo))
        }
        return Promise.resolve()
    }

    const handleOk = () => {
        const values = form.getFieldsValue()
        onOk(values)
        onClose()
    }

    const dropdownRender = (menu: any) => {
        return (
            <div>
                <div className={styles['autocomplete-dropdown-render-title']}>
                    {__('可选择或输入规则')}
                </div>
                {menu}
            </div>
        )
    }

    const cancelReq = () => {
        cancelRequest('/api/data-view/v1/form-view/convert-rule/verify', 'post')
        setIsTested(false)
        setIsTestFailed(false)
    }

    const onFieldsChange = (changedFields) => {
        const fieldsToTest =
            targetType === 'decimal'
                ? ['data_length', 'data_accuracy']
                : ['date', 'timestamp', 'time'].includes(targetType)
                ? ['reset_convert_rules']
                : []

        const values = form.getFieldsValue()
        const isEmpty = fieldsToTest.every(
            (field) => values[field] || values[field] === 0,
        )
        setIsEmptyRule(!isEmpty)
    }

    const getFinishBtnTip = () => {
        if (!['date', 'timestamp', 'time', 'decimal'].includes(targetType)) {
            return isLoading ? __('正在解析数据，请稍候') : ''
        }

        return isEmptyRule
            ? ['date', 'timestamp', 'time'].includes(targetType)
                ? __('请先配置规则并进行测试')
                : __('请先输入数据长度和数据精度并进行测试')
            : isLoading
            ? __('正在解析数据，请稍候')
            : !isTested
            ? ['date', 'timestamp', 'time'].includes(targetType)
                ? __('请先配置规则并进行测试')
                : __('请先输入数据长度和数据精度并进行测试')
            : ''
    }

    return (
        <Modal
            title={
                ['date', 'timestamp', 'time'].includes(targetType) ? (
                    __('配置解析规则')
                ) : targetType === 'decimal' ? (
                    __('编辑数据长度和数据精度')
                ) : (
                    <div className={styles['test-result-title']}>
                        {__('测试结果')}
                        <span className={styles['test-result-title-desc']}>
                            {__('（最多展示10条数据作为参考）')}
                        </span>
                    </div>
                )
            }
            width={
                ['date', 'timestamp', 'decimal', 'time'].includes(targetType)
                    ? 1230
                    : 800
            }
            maskClosable={false}
            open={open}
            onCancel={onCancel}
            bodyStyle={{
                padding: 0,
                height: 'calc(100vh * 0.8 - 114px)',
                minHeight: 444,
            }}
            okButtonProps={{ disabled: isTestFailed }}
            centered
            footer={
                <Space size={8}>
                    <Button onClick={onCancel}>{__('取消')}</Button>
                    {!['date', 'timestamp', 'decimal', 'time'].includes(
                        targetType,
                    ) && isLoading ? null : (
                        <Tooltip title={getFinishBtnTip()}>
                            <Button
                                type="primary"
                                disabled={
                                    isEmptyRule ||
                                    !isTested ||
                                    isTestFailed ||
                                    isLoading
                                }
                                onClick={handleOk}
                            >
                                {__('完成')}
                            </Button>
                        </Tooltip>
                    )}
                </Space>
            }
        >
            <div className={styles['config-parse-rule']}>
                {['date', 'timestamp', 'decimal', 'time'].includes(
                    targetType,
                ) && (
                    <div className={styles['parse-rule']}>
                        <div className={styles['parse-rule-title']}>
                            {__('说明')}
                        </div>
                        <div className={styles['parse-rule-desc']}>
                            {['date', 'timestamp', 'time'].includes(
                                targetType,
                            ) ? (
                                <>
                                    <div className={styles['desc-row']}>
                                        {__(
                                            '1、转换字段的数据类型时，若将“预设”的类型转换为“date/timestamp/time”，则需要配置解析规则。',
                                        )}
                                    </div>
                                    <div className={styles['desc-row']}>
                                        {__('2、输入规则时，变量仅能用')}
                                        <Tooltip
                                            title={
                                                <div
                                                    className={
                                                        styles[
                                                            'parse-rule-var-tooltip'
                                                        ]
                                                    }
                                                >
                                                    {ParseRuleVar.map(
                                                        (item) => {
                                                            return (
                                                                <div
                                                                    key={
                                                                        item.name
                                                                    }
                                                                    className={
                                                                        styles[
                                                                            'var-item-ins'
                                                                        ]
                                                                    }
                                                                >
                                                                    <span
                                                                        className={
                                                                            styles[
                                                                                'var-name'
                                                                            ]
                                                                        }
                                                                    >
                                                                        {
                                                                            item.name
                                                                        }
                                                                        {__(
                                                                            '：',
                                                                        )}
                                                                    </span>
                                                                    <span
                                                                        className={
                                                                            styles[
                                                                                'var-desc'
                                                                            ]
                                                                        }
                                                                    >
                                                                        {
                                                                            item.desc
                                                                        }
                                                                    </span>
                                                                </div>
                                                            )
                                                        },
                                                    )}
                                                </div>
                                            }
                                            color="#fff"
                                            overlayInnerStyle={{
                                                width: 330,
                                            }}
                                            placement="bottomLeft"
                                            getPopupContainer={(triggerNode) =>
                                                triggerNode.parentElement as HTMLElement
                                            }
                                        >
                                            <span
                                                className={
                                                    styles[
                                                        'parse-rule-desc-var'
                                                    ]
                                                }
                                            >
                                                {__('定义好的变量')}
                                            </span>
                                        </Tooltip>
                                    </div>
                                    <div className={styles['desc-row']}>
                                        {__(
                                            '${num}、转换字段的数据类型时，下方的真实数据也会转换，若有数据无法解析，该值将显示为空。',
                                            { num: 3 },
                                        )}
                                    </div>
                                    <div className={styles['desc-row']}>
                                        {__(
                                            '${num}、若当前字段有启用字段级的探查规则，库表更新后建议进行探查规则检查。',
                                            { num: 4 },
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={styles['desc-row']}>
                                        {__(
                                            '1、转换字段的数据类型时，若将“预设”的类型转为“decimal”，则需要指定数据长度和数据精度。',
                                        )}
                                    </div>
                                    <div className={styles['desc-row']}>
                                        {__(
                                            '${num}、转换字段的数据类型时，下方的真实数据也会转换，若有数据无法解析，该值将显示为空。',
                                            { num: 2 },
                                        )}
                                    </div>
                                    <div className={styles['desc-row']}>
                                        {__(
                                            '${num}、若当前字段有启用字段级的探查规则，库表更新后建议进行探查规则检查。',
                                            { num: 3 },
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className={styles['change-type']}>
                            {__('转换类型：')} <span>{currentType}</span>
                            <FontIcon
                                name="icon-zhuanhuanjiantou"
                                className={styles['change-type-arrow']}
                            />
                            <span>{targetType}</span>
                        </div>
                        <Form
                            layout="vertical"
                            className={styles['parse-rule-form']}
                            form={form}
                            onFinish={onFinish}
                            style={{ position: 'relative' }}
                            autoComplete="off"
                            onFieldsChange={onFieldsChange}
                            validateTrigger={['onChange', 'onBlur']}
                        >
                            {!['date', 'timestamp', 'time'].includes(
                                targetType,
                            ) && (
                                <>
                                    <Form.Item
                                        label={
                                            <div>
                                                {__('数据长度')}
                                                <span
                                                    className={
                                                        styles['label-desc']
                                                    }
                                                >
                                                    {__(
                                                        '（只能输入1～38之间的整数）',
                                                    )}
                                                </span>
                                            </div>
                                        }
                                        name="data_length"
                                        validateTrigger={['onChange', 'onBlur']}
                                        validateFirst
                                        rules={[
                                            {
                                                required: true,
                                                message: __('数据长度不能为空'),
                                            },
                                        ]}
                                    >
                                        <InputNumber
                                            placeholder={__('请输入数据长度')}
                                            onChange={() => {
                                                form.validateFields()
                                                cancelReq()
                                            }}
                                            min={1}
                                            max={38}
                                            style={{ width: '100%' }}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        shouldUpdate={(pre, cur) =>
                                            pre.data_length !== cur.data_length
                                        }
                                    >
                                        {({ getFieldValue }) => {
                                            return (
                                                <Form.Item
                                                    label={
                                                        <div>
                                                            {__('数据精度')}
                                                            <span
                                                                className={
                                                                    styles[
                                                                        'label-desc'
                                                                    ]
                                                                }
                                                            >
                                                                {__(
                                                                    '（只能输入0～x之间的整数，x=上方设置的数据长度值）',
                                                                )}
                                                            </span>
                                                        </div>
                                                    }
                                                    name="data_accuracy"
                                                    validateTrigger={[
                                                        'onChange',
                                                        'onBlur',
                                                    ]}
                                                    validateFirst
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                __(
                                                                    '数据精度不能为空',
                                                                ),
                                                        },
                                                        {
                                                            validator: (
                                                                _,
                                                                value,
                                                            ) => {
                                                                if (
                                                                    value &&
                                                                    getFieldValue(
                                                                        'data_length',
                                                                    ) &&
                                                                    +value >
                                                                        +getFieldValue(
                                                                            'data_length',
                                                                        )
                                                                ) {
                                                                    return Promise.reject(
                                                                        new Error(
                                                                            __(
                                                                                '数据精度不能大于数据长度',
                                                                            ),
                                                                        ),
                                                                    )
                                                                }
                                                                return Promise.resolve()
                                                            },
                                                        },
                                                    ]}
                                                >
                                                    <InputNumber
                                                        placeholder={__(
                                                            '请先输入数据长度，再输入数据精度',
                                                        )}
                                                        style={{
                                                            width: '100%',
                                                        }}
                                                        min={0}
                                                        max={getFieldValue(
                                                            'data_length',
                                                        )}
                                                        onChange={() => {
                                                            cancelReq()
                                                        }}
                                                    />
                                                </Form.Item>
                                            )
                                        }}
                                    </Form.Item>
                                </>
                            )}

                            {['date', 'timestamp', 'time'].includes(
                                targetType,
                            ) && (
                                <Form.Item
                                    name="reset_convert_rules"
                                    label={__('配置规则')}
                                    required
                                    validateFirst
                                    validateTrigger={['onChange', 'onBlur']}
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请配置规则'),
                                        },
                                    ]}
                                >
                                    <AutoComplete
                                        options={dateOptions}
                                        dropdownRender={dropdownRender}
                                        placeholder={__('请配置规则')}
                                        getPopupContainer={(triggerNode) =>
                                            triggerNode.parentElement as HTMLElement
                                        }
                                        onChange={() => {
                                            cancelReq()
                                        }}
                                    />
                                </Form.Item>
                            )}
                        </Form>
                        <Button
                            className={styles['test-btn']}
                            onClick={() => form.submit()}
                        >
                            {__('测试')}
                        </Button>
                    </div>
                )}

                <div className={styles['parse-rule-test']}>
                    {!['date', 'timestamp', 'decimal', 'time'].includes(
                        targetType,
                    ) && (
                        <div
                            className={classNames(
                                styles['parse-rule'],
                                styles['parse-rule-test-desc'],
                            )}
                        >
                            <div className={styles['parse-rule-title']}>
                                {__('说明')}
                            </div>
                            <div className={styles['parse-rule-desc']}>
                                <div className={styles['desc-row']}>
                                    {__(
                                        '${num}、转换字段的数据类型时，下方的真实数据也会转换，若有数据无法解析，该值将显示为空。',
                                        { num: 1 },
                                    )}
                                </div>
                                <div className={styles['desc-row']}>
                                    {__(
                                        '${num}、若当前字段有启用字段级的探查规则，库表更新后建议进行探查规则检查。',
                                        { num: 2 },
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {isLoading ? (
                        <div className={styles['test-loading']}>
                            <Spin
                                tip={
                                    <>
                                        <div className={styles['loading-text']}>
                                            {__('正在解析数据...')}
                                        </div>
                                        <div className={styles['loading-type']}>
                                            <span>{currentType}</span>
                                            <FontIcon
                                                name="icon-zhuanhuanjiantou"
                                                className={
                                                    styles['change-type-arrow']
                                                }
                                            />
                                            <span>{targetType}</span>
                                        </div>
                                    </>
                                }
                            />
                        </div>
                    ) : isTested ? (
                        isTestFailed ? (
                            <TestFail errorInfo={errorMsg} />
                        ) : testData ? (
                            <TestSuccess testData={testData} />
                        ) : null
                    ) : (
                        <div className={styles['test-empty-container']}>
                            <Empty
                                iconSrc={dataEmpty}
                                desc={
                                    <div className={styles['empty-desc']}>
                                        <div>
                                            {['date', 'timestamp'].includes(
                                                targetType,
                                            )
                                                ? __(
                                                      '配置好左侧的解析规则后，可点击',
                                                  )
                                                : __(
                                                      '指定好左侧的数据长度和数据精度后，可点击',
                                                  )}
                                            <Button
                                                type="link"
                                                onClick={() => form.submit()}
                                            >
                                                【{__('测试')}】
                                            </Button>
                                            {__('预览数据')}
                                            {__('，')}
                                        </div>
                                        <div>
                                            {__('测试完成后方可更改配置')}
                                        </div>
                                    </div>
                                }
                            />
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    )
}

export default ConfigParseRule
