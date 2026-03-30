import * as React from 'react'
import { useState } from 'react'
import { Form, Select, FormItemProps } from 'antd'
import { trim, slice, noop } from 'lodash'
import { ErrorInfo, keyboardCharactersReg } from '@/utils'
import __ from './locale'

interface TagInputParams {
    label: string
    fieldName: string
    maxTagLength?: number
    value?: Array<string>
    onChange?: (value, tags) => void
    placeholder?: string
    onSearch?: (value, string) => void
    disabled?: boolean
}

const TagInput = ({
    label,
    fieldName,
    maxTagLength = 100,
    value = [],
    onChange = noop,
    placeholder = '',
    onSearch = noop,
    disabled = false,
}: TagInputParams) => {
    // 输入标签值
    const [tagValue, setTagValue] = useState('')

    // 标签输入框FormItemProps
    const [formProps, setFormProps] = useState<FormItemProps | undefined>()

    const tagRepeat: FormItemProps = {
        validateStatus: 'error',
        help: __('该${name}重复，请重新输入', { name: label }),
    }

    const tagMax: FormItemProps = {
        validateStatus: 'error',
        help: __('仅支持创建${acount}个标签', { acount: maxTagLength }),
    }

    return (
        <Form.Item
            noStyle
            shouldUpdate={(prevValues, curValues) =>
                prevValues.resource_tag !== curValues.resource_tag
            }
        >
            {({ getFieldValue, setFieldValue }) => {
                const rbs: string[] = getFieldValue(fieldName)
                return (
                    <Form.Item
                        label={`${label}(${rbs?.length || 0}/${maxTagLength})`}
                        name={fieldName}
                        validateFirst
                        rules={[
                            {
                                type: 'array',
                                defaultField: {
                                    pattern: keyboardCharactersReg,
                                    message: ErrorInfo.EXCEPTEMOJI,
                                },
                            },
                        ]}
                        {...formProps}
                    >
                        <Select
                            mode="tags"
                            placeholder={placeholder}
                            open={false}
                            style={{ maxHeight: '100px', overflowY: 'auto' }}
                            maxTagTextLength={10}
                            disabled={disabled}
                            onChange={(e) => {
                                if (e.length >= (rbs?.length || 0)) {
                                    if (e.length > maxTagLength) {
                                        setFieldValue(
                                            fieldName,
                                            slice(e, 0, maxTagLength),
                                        )
                                    } else {
                                        setTagValue('')
                                    }
                                } else {
                                    setFormProps(
                                        e.includes(trim(tagValue))
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
                                } else if ((rbs?.length || 0) >= maxTagLength) {
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
    )
}

export default TagInput
