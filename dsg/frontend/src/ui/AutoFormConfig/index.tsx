import React, { useState, useEffect, useMemo } from 'react'
import classnames from 'classnames'
import { Form, Input, Select } from 'antd'
import styles from './styles.module.less'
import { validateName } from '@/utils/validate'
import { ComponentType } from '../const'
import { AutoFormConfigType, FormItemConfig } from './index.d'
import { checkNormalInput } from './validate'
import LoyoutGroupView from './LoyoutGroupView'

interface GetFormItemConfigType {
    formItemConfig: FormItemConfig
    name: string
    index: number
}
const GetFormItemConfig = ({
    formItemConfig,
    name,
    index,
}: GetFormItemConfigType) => {
    const getRules = useMemo(() => formItemConfig.rules, [formItemConfig])
    switch (formItemConfig.type) {
        case ComponentType.LayoutGroup:
            if (
                formItemConfig.children &&
                Object.keys(formItemConfig.children.config).length
            ) {
                const { config, widths } = formItemConfig.children
                return (
                    <LoyoutGroupView widths={widths}>
                        {Object.keys(config)?.map((currentKey, dataIndex) => (
                            <GetFormItemConfig
                                formItemConfig={config[currentKey]}
                                name={currentKey}
                                index={index + dataIndex}
                            />
                        ))}
                    </LoyoutGroupView>
                )
            }
            return <div />

        case ComponentType.Input:
            return (
                <Form.Item
                    name={name}
                    label={formItemConfig.label}
                    validateFirst
                    validateTrigger={['onBlur']}
                    rules={
                        formItemConfig.disabled
                            ? []
                            : formItemConfig.rules || [
                                  {
                                      required: true,
                                      validator: validateName(),
                                  },
                              ]
                    }
                    key={index}
                >
                    <Input
                        placeholder={formItemConfig.placeholder || ''}
                        className={formItemConfig.className || ''}
                        maxLength={formItemConfig.maxLength || 128}
                        {...formItemConfig.others}
                        disabled={formItemConfig.disabled}
                        autoComplete="off"
                    />
                </Form.Item>
            )
        case ComponentType.Select:
            return (
                <Form.Item
                    name={name}
                    label={formItemConfig.label}
                    validateFirst
                    rules={
                        formItemConfig.disabled
                            ? []
                            : formItemConfig.rules || [
                                  {
                                      required: true,
                                  },
                              ]
                    }
                    key={index}
                >
                    <Select
                        options={formItemConfig.options || []}
                        className={formItemConfig.className || ''}
                        placeholder={formItemConfig.placeholder || ''}
                        {...formItemConfig.others}
                        disabled={formItemConfig.disabled}
                    />
                </Form.Item>
            )
        case ComponentType.TextArea:
            return (
                <Form.Item
                    name={name}
                    label={formItemConfig.label}
                    validateFirst
                    rules={
                        formItemConfig.disabled
                            ? []
                            : formItemConfig.rules || [
                                  {
                                      validateTrigger: ['onBlur'],
                                      validator: (e, value) =>
                                          checkNormalInput(e, value),
                                  },
                              ]
                    }
                    key={index}
                >
                    <Input.TextArea
                        placeholder={formItemConfig.placeholder || ''}
                        className={classnames(
                            styles.inputArea,
                            formItemConfig.className || '',
                        )}
                        disabled={formItemConfig.disabled}
                        maxLength={formItemConfig.maxLength || 255}
                        autoComplete="off"
                        {...formItemConfig.others}
                    />
                </Form.Item>
            )
        case ComponentType.InputNumber:
            return (
                <Form.Item
                    name={name}
                    label={formItemConfig.label}
                    validateFirst
                    rules={formItemConfig.disabled ? [] : getRules}
                    key={index}
                >
                    <Input
                        placeholder={formItemConfig.placeholder || ''}
                        type="number"
                        className={classnames(
                            styles.inputNumber,
                            formItemConfig.className || '',
                        )}
                        {...formItemConfig.others}
                        disabled={formItemConfig.disabled}
                        autoComplete="off"
                    />
                </Form.Item>
            )
        default:
            return <div />
    }
}

const AutoFormConfig = ({
    config,
    onFinsh,
    onChange,
    defaultData = {},
    layout = 'horizontal',
    form,
}: AutoFormConfigType) => {
    const [formConfig, setFormConfig] = useState(config)
    useEffect(() => {
        setFormConfig(config)
    }, [config])

    return (
        <Form
            initialValues={defaultData}
            onFinish={onFinsh}
            onValuesChange={onChange}
            form={form}
            layout={layout}
        >
            {Object.keys(formConfig)?.map(
                (currentKey, index) => (
                    <GetFormItemConfig
                        formItemConfig={formConfig[currentKey]}
                        name={currentKey}
                        index={index}
                    />
                ),
                // GetFormItemConfig(formConfig[currentKey], currentKey, index),
            )}
        </Form>
    )
}
export default AutoFormConfig
