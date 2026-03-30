import { Form, Input, Modal, Select, Switch, message } from 'antd'
import { trim } from 'lodash'
import React, { useEffect, useState } from 'react'
import {
    ICCRuleItem,
    checkCodeRuleRepeatPrefix,
    formatError,
    updateCodeGenerationRuleByID,
} from '@/core'
import {
    DigitalWidthOptions,
    SeparatorOptions,
    DefaultPrefix,
    getCodeExample,
    getCodeRule,
} from './helper'

import __ from './locale'
import styles from './styles.module.less'

interface IEditRuleModal {
    visible: boolean
    data: ICCRuleItem | undefined
    onClose: () => void
    onSure: (any) => void
}

const EditRuleModal: React.FC<IEditRuleModal> = ({
    data,
    visible,
    onClose,
    onSure,
}) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState<boolean>(false)
    const [canPrefix, setCanPrefix] = useState<boolean>(false)
    const [canSeparator, setCanSeparator] = useState<boolean>(false)
    const [canRuleCode, setCanRuleCode] = useState<boolean>(false)
    const [digitalLen, setDigitalLen] = useState<number>(6)
    const [codeRule, setCodeRule] = useState<string>()
    const [codeExample, setCodeExample] = useState<string>()
    const [prefixDisabled, setPrefixDisabled] = useState<boolean>(false)

    // 更新编码示例
    const updateCodeExample = async () => {
        const curData = form.getFieldsValue()
        const startValue = new RegExp(
            `^[0-9]{${curData?.digital_code_width}}`,
            'g',
        ).test(curData?.digital_code_starting)
            ? curData?.digital_code_starting
            : data?.digital_code_starting
        const prefix = /^[A-Z]{2,6}$/g.test(curData?.prefix)
            ? curData?.prefix
            : data?.prefix
        const example = getCodeExample({
            ...curData,
            prefix,
            digital_code_starting: startValue,
            updated_at: data?.updated_at,
        })
        setCodeExample(example)
    }

    useEffect(() => {
        setCodeRule(
            getCodeRule({
                prefix_enabled: canPrefix,
                rule_code_enabled: canRuleCode,
                code_separator_enabled: canSeparator,
            }),
        )
        updateCodeExample()
    }, [form, canPrefix, canSeparator, canRuleCode])

    useEffect(() => {
        form.setFieldValue(
            'digital_code_ending',
            Number('9'.padEnd(digitalLen, '9')),
        )
    }, [form, digitalLen])

    useEffect(() => {
        if (data) {
            const {
                name,
                type,
                prefix,
                prefix_enabled,
                // rule_code,
                rule_code_enabled,
                code_separator,
                code_separator_enabled,
                digital_code_width,
                digital_code_starting,
                updated_at,
            } = data
            const init_width = digital_code_width || 6

            form.setFieldsValue({
                name,
                prefix,
                prefix_enabled,
                rule_code: 'YYYYMMDD', // 规则码暂固定
                rule_code_enabled,
                code_separator,
                code_separator_enabled,
                digital_code_width: init_width,
                digital_code_starting: `${digital_code_starting || 1}`.padStart(
                    init_width,
                    '0',
                ),
                digital_code_ending: Number('9'.padEnd(init_width, '9')), // 默认6位
                updated_at,
            })

            setDigitalLen(init_width)
            if (!prefix) {
                // 默认前缀填充
                form.setFieldValue('prefix', DefaultPrefix[type])
            }
            setCanPrefix(prefix_enabled)
            setCanSeparator(code_separator_enabled)
            setCanRuleCode(rule_code_enabled)
            updateCodeExample()
        } else {
            setPrefixDisabled(false)
        }
    }, [data])

    if (!visible) {
        return null
    }

    // 对话框onCancel
    const handleModalCancel = () => {
        onClose()
        form.resetFields()
    }

    // 对话框onOk
    const handleModalOk = async (values) => {
        try {
            setLoading(true)
            const params = {
                ...values,
                digital_code_starting: Number(
                    trim(values.digital_code_starting),
                ),
                prefix: trim(values.prefix),
            }
            const itemInfo = await updateCodeGenerationRuleByID(
                data?.id || '',
                params,
            )
            message.success(__('编辑成功'))
            handleModalCancel()
            onSure(itemInfo)
        } catch (e) {
            if (e.errorFields) {
                return
            }
            formatError(e)
        } finally {
            setLoading(false)
        }
    }

    const validateAndUpdateCode = async (ruleProps: string) => {
        try {
            await form.validateFields([ruleProps])
            updateCodeExample()
        } catch (e) {
            if (e.errorFields) {
                return
            }
            formatError(e)
        }
    }

    const handleDigitalWidthChange = async (len: number) => {
        setDigitalLen(len)
        form.setFieldValue('digital_code_starting', '1'.padStart(len, '0'))
        await validateAndUpdateCode('digital_code_starting')
    }

    const handleSeparatorChange = () => {
        updateCodeExample()
    }

    const validatePrefixName = async (name: string, oldName?: string) => {
        const newName = trim(name)
        try {
            if (!newName) {
                setPrefixDisabled(true)
                return Promise.reject(new Error(__('输入不能为空')))
            }

            if (!/^[A-Z]{2,6}$/.test(newName)) {
                setPrefixDisabled(true)
                return Promise.reject(new Error(__('仅支持2-6位大写英文字母')))
            }

            if (newName === oldName) {
                updateCodeExample()
                setPrefixDisabled(false)
                return Promise.resolve()
            }
            const { existence: isRepeat } = await checkCodeRuleRepeatPrefix(
                name,
            )
            const isNormal = /^[A-Z]{2,6}$/.test(name)

            if (isRepeat) {
                setPrefixDisabled(true)
                return Promise.reject(new Error(__('名称已存在，请重新输入')))
            }
            if (isNormal) {
                updateCodeExample()
            }

            setPrefixDisabled(false)
            return Promise.resolve()
        } catch (error) {
            formatError(error)
            setPrefixDisabled(true)
            return Promise.reject()
        }
    }

    const validateDigitalStart = async (start: string) => {
        const newValue = trim(start)

        try {
            if (!newValue) {
                return Promise.reject(new Error(__('输入不能为空')))
            }

            if (!new RegExp(`^[0-9]{${digitalLen}}`, 'g').test(newValue)) {
                return Promise.reject(
                    new Error(__('仅支持') + digitalLen + __('位数字')),
                )
            }
            if (newValue === '0'.padEnd(digitalLen, '0')) {
                form.setFieldValue(
                    'digital_code_starting',
                    '1'.padStart(digitalLen, '0'),
                )
            }
            updateCodeExample()
            return Promise.resolve()
        } catch (error) {
            formatError(error)
            return Promise.reject()
        }
    }

    return (
        <Modal
            title={__('编辑编码生成规则')}
            width={440}
            maskClosable={false}
            open={visible}
            destroyOnClose
            getContainer={false}
            className={styles['edit-rule']}
            okButtonProps={{ loading }}
            onCancel={handleModalCancel}
            onOk={() => {
                form.submit()
            }}
            bodyStyle={{ padding: '16px 24px' }}
        >
            <Form form={form} layout="vertical" onFinish={handleModalOk}>
                <div className={styles['edit-rule-tip']}>
                    <div>
                        <span>{__('编码类型')}:</span>
                        <span>{data?.name}</span>
                    </div>
                    <div>
                        <span>{__('编码示例')}:</span>
                        <span>{codeExample}</span>
                    </div>
                    <div>
                        <span>{__('编码规则')}:</span>
                        <span>{codeRule}</span>
                    </div>
                </div>

                <div className={styles['title-line']}>
                    <div className={styles['title-line-left']}>
                        <span className={styles['icon-require']}>*</span>
                        {__('前缀')}
                    </div>
                    <div className={styles['title-line-right']}>
                        {__('是否启用')}
                        <Form.Item
                            name="prefix_enabled"
                            valuePropName="checked"
                            noStyle
                        >
                            <Switch
                                onChange={(isON: boolean) => setCanPrefix(isON)}
                                disabled={prefixDisabled}
                            />
                        </Form.Item>
                    </div>
                </div>

                <Form.Item
                    name="prefix"
                    validateTrigger={['onBlur']}
                    rules={[
                        {
                            validator: (e, value) =>
                                validatePrefixName(value, data?.prefix),
                        },
                    ]}
                >
                    <Input
                        placeholder={__('请输入前缀')}
                        disabled={!canPrefix}
                        maxLength={6}
                        allowClear
                    />
                </Form.Item>
                <div className={styles['title-line']}>
                    <div className={styles['title-line-left']}>
                        {__('规则码')}
                    </div>
                    <div className={styles['title-line-right']}>
                        {__('是否启用')}
                        <Form.Item
                            name="rule_code_enabled"
                            valuePropName="checked"
                            noStyle
                        >
                            <Switch onChange={(isON) => setCanRuleCode(isON)} />
                        </Form.Item>
                    </div>
                </div>
                <Form.Item name="rule_code" initialValue="YYYYMMDD">
                    <Input
                        placeholder={__('请输入规则码')}
                        allowClear
                        disabled
                    />
                </Form.Item>
                <div className={styles['title-line']}>
                    <div className={styles['title-line-left']}>
                        {__('分隔符')}
                    </div>
                    <div className={styles['title-line-right']}>
                        {__('是否启用')}
                        <Form.Item
                            name="code_separator_enabled"
                            valuePropName="checked"
                            noStyle
                        >
                            <Switch
                                onChange={(isON) => setCanSeparator(isON)}
                            />
                        </Form.Item>
                    </div>
                </div>
                <Form.Item name="code_separator">
                    <Select
                        options={SeparatorOptions}
                        disabled={!canSeparator}
                        onChange={handleSeparatorChange}
                    />
                </Form.Item>
                <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                    <Form.Item
                        style={{ width: '22%' }}
                        label={__('数字码位数')}
                        name="digital_code_width"
                        initialValue={6}
                    >
                        <Select
                            options={DigitalWidthOptions}
                            onChange={handleDigitalWidthChange}
                        />
                    </Form.Item>
                    <span className={styles['digital-separator']}>—</span>
                    <Form.Item
                        style={{ width: '32%' }}
                        label={__('数字码起始值')}
                        name="digital_code_starting"
                        validateTrigger={['onBlur']}
                        rules={[
                            {
                                validator: (e, value) =>
                                    validateDigitalStart(value),
                            },
                        ]}
                        required
                    >
                        <Input
                            placeholder={__('请输入数字码起始值')}
                            maxLength={digitalLen}
                            allowClear
                        />
                    </Form.Item>
                    <span className={styles['digital-separator']}>—</span>
                    <Form.Item
                        style={{ width: '32%' }}
                        label={__('数字码终止值')}
                        name="digital_code_ending"
                        tooltip={__('根据数字码位数自动生成')}
                    >
                        <Input disabled min={0} />
                    </Form.Item>
                </div>
            </Form>
        </Modal>
    )
}

export default EditRuleModal
