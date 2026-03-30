import React, { useEffect, useMemo, useRef } from 'react'
import { Form, Input } from 'antd'
import type { InputRef } from 'antd'
import { Rule } from 'antd/lib/form'
import { trim } from 'lodash'
import { IPropertyInfo } from './const'

interface IEditProperty {
    index: number
    property: IPropertyInfo
    value: string
    onFinish: (values: any, index: number) => void
}
const EditProperty: React.FC<IEditProperty> = ({
    index,
    property,
    value,
    onFinish,
}) => {
    const [form] = Form.useForm()
    const inputRef = useRef<InputRef>(null)

    useEffect(() => {
        form.setFieldsValue({ [property.key]: value })
        inputRef.current!.focus({
            cursor: 'end',
        })
    }, [value])

    const rules: Rule[] = useMemo(() => {
        return [
            {
                pattern: property.reg,
                transform: (val) => trim(val),
                message: property.message,
            },
        ]
    }, [property])

    return (
        <Form
            onFinish={(values) => onFinish(values, index)}
            form={form}
            autoComplete="off"
        >
            <Form.Item name={property.key} rules={rules}>
                <Input
                    maxLength={property.max || 128}
                    onBlur={() => form.submit()}
                    ref={inputRef}
                />
            </Form.Item>
        </Form>
    )
}

export default EditProperty
