import React, { useEffect, useMemo, useRef } from 'react'
import { Form, Input } from 'antd'
import type { InputRef } from 'antd'
import { trim } from 'lodash'
import { ErrorInfo, nameReg } from '@/utils'
import styles from './styles.module.less'

interface IEditAttribute {
    pId: string
    id: string
    value: string
    onFinish: (values: any, id: string, pId: string) => void
}
const EditAttribute: React.FC<IEditAttribute> = ({
    id,
    value,
    onFinish,
    pId,
}) => {
    const [form] = Form.useForm()
    const inputRef = useRef<InputRef>(null)

    useEffect(() => {
        form.setFieldsValue({ name: value })
        inputRef.current!.focus({
            cursor: 'end',
        })
    }, [value])

    return (
        <div className={styles['edit-attr-wrapper']}>
            <Form
                onFinish={(values) => onFinish(values.name, id, pId)}
                form={form}
                autoComplete="off"
            >
                <Form.Item
                    name="name"
                    validateTrigger={['onChange', 'onBlur']}
                    validateFirst
                    rules={[
                        {
                            required: true,
                            message: ErrorInfo.NOTNULL,
                        },
                        {
                            pattern: nameReg,
                            transform: (val) => trim(val),
                            message: ErrorInfo.ONLYSUP,
                        },
                    ]}
                >
                    <Input
                        maxLength={128}
                        onBlur={() => form.submit()}
                        ref={inputRef}
                    />
                </Form.Item>
            </Form>
        </div>
    )
}

export default EditAttribute
