import * as React from 'react'
import { ReactNode, useState } from 'react'
import { Form } from 'antd'
import { DisplayInfoComponentType } from './helper'
import {
    BooleanText,
    GroupView,
    GroupView2,
    SelectTextView,
    TagTextView,
    TextAreaView,
    TextView,
    ViewConfig,
} from './baseViewComponents'
import styles from './styles.module.less'
import __ from './locale'

interface AutoFormViewType {
    data: {
        [key: string]: any
    }
    config: {
        [key: string]: ViewConfig
    }
}

const AutoFormView = ({ data, config }: AutoFormViewType) => {
    const [form] = Form.useForm()

    const formItemLayout = {
        labelCol: {
            xs: { span: 24 },
            sm: { span: 8 },
        },
        wrapperCol: {
            xs: { span: 24 },
            sm: { span: 16 },
        },
    }

    const getFormItemView = (currentConfig: ViewConfig, name, index) => {
        if (
            (currentConfig.type === DisplayInfoComponentType.GroupType ||
                currentConfig.type === DisplayInfoComponentType.GroupType2) &&
            currentConfig.children &&
            Object.keys(currentConfig.children).length
        ) {
            return currentConfig.type === DisplayInfoComponentType.GroupType ? (
                <GroupView
                    title={currentConfig.label}
                    expand={currentConfig?.expand || false}
                >
                    <div>
                        {currentConfig.children &&
                            Object.keys(currentConfig.children)?.map(
                                (cmp, currentIndex) =>
                                    currentConfig.children &&
                                    getFormItemView(
                                        currentConfig.children[cmp],
                                        cmp,
                                        currentIndex,
                                    ),
                            )}
                    </div>
                </GroupView>
            ) : (
                <GroupView2
                    title={currentConfig.label}
                    expand={currentConfig?.expand || false}
                >
                    {currentConfig.children &&
                        Object.keys(currentConfig.children)?.map(
                            (cmp, currentIndex) =>
                                currentConfig.children &&
                                getFormItemView(
                                    currentConfig.children[cmp],
                                    cmp,
                                    currentIndex,
                                ),
                        )}
                </GroupView2>
            )
        }
        switch (currentConfig.type) {
            case DisplayInfoComponentType.Text:
                return (
                    <Form.Item
                        name={name}
                        label={currentConfig.label || ''}
                        key={index}
                    >
                        {data && <TextView initValue={data[name] || ''} />}
                    </Form.Item>
                )
            case DisplayInfoComponentType.AreaText:
                return (
                    <Form.Item
                        name={name}
                        label={currentConfig.label || ''}
                        key={index}
                    >
                        {data && (
                            <TextAreaView initValue={data[name] || `--`} />
                        )}
                    </Form.Item>
                )

            case DisplayInfoComponentType.SelectText:
                return (
                    <Form.Item
                        name={name}
                        label={currentConfig.label || ''}
                        key={index}
                    >
                        {data && (
                            <SelectTextView
                                initValue={data[name] || ''}
                                options={currentConfig?.options || []}
                            />
                        )}
                    </Form.Item>
                )
            case DisplayInfoComponentType.TagText:
                return (
                    <Form.Item
                        name={name}
                        label={currentConfig.label || ''}
                        key={index}
                    >
                        {data && (
                            <TagTextView
                                initValue={data[name] || ''}
                                valueKey={currentConfig?.valueKey || ''}
                            />
                        )}
                    </Form.Item>
                )

            case DisplayInfoComponentType.BooleanText:
                return (
                    <Form.Item
                        name={name}
                        label={currentConfig.label || ''}
                        key={index}
                    >
                        {data && <BooleanText initValue={data[name] || 0} />}
                    </Form.Item>
                )

            case DisplayInfoComponentType.Custom:
                return (
                    <Form.Item
                        name={name}
                        label={currentConfig.label || ''}
                        key={index}
                    >
                        <div>{currentConfig.CustomComponent || null}</div>
                    </Form.Item>
                )

            default:
                return <div key={index} />
        }
    }
    return (
        <Form
            form={form}
            labelAlign="left"
            {...formItemLayout}
            className={styles.main}
        >
            {Object.keys(config)?.map((currentKey, index) =>
                getFormItemView(config[currentKey], currentKey, index),
            )}
        </Form>
    )
}

export default AutoFormView
