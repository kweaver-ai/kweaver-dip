import { Form, Tooltip, FormItemProps } from 'antd'
import { Rule } from 'antd/lib/form'
import { FC, ReactNode, useEffect, useState } from 'react'
import classnames from 'classnames'
import styles from './styles.module.less'

interface IFormItemContainer extends FormItemProps {
    children: ReactNode
    name: string | Array<string | number>
    id?: string
    parentNode?: any
}
const FormItemContainer: FC<IFormItemContainer> = ({
    children,
    name,
    id,
    parentNode,
    ...props
}) => {
    const [errorText, setErrorText] = useState<string>('')

    /**
     * 方便增加ToolTips的提示钩子
     * @param rules
     * @returns
     */
    const changeRules = (rules: Rule[]) => {
        let isError = false
        const newRlues = rules.map((currentRule: any) => {
            const { required, pattern, validator, ...rest } = currentRule
            switch (true) {
                case !!validator:
                    return {
                        ...rest,
                        validator: (_, value) => {
                            return validator(_, value).then(
                                (re) => {
                                    if (!isError) {
                                        setErrorText('')
                                    }
                                    return re
                                },
                                (ex) => {
                                    setErrorText(ex.message || '')
                                    isError = true
                                    return Promise.reject(ex)
                                },
                            )
                        },
                    }
                case !!required:
                    return {
                        ...rest,
                        validator: (_, value) => {
                            if (value || value === 0 || value === false) {
                                if (!isError) {
                                    setErrorText('')
                                }
                                return Promise.resolve()
                            }
                            isError = true
                            setErrorText(rest.message || '')
                            return Promise.reject(new Error(rest.message || ''))
                        },
                    }
                case !!pattern:
                    return {
                        ...rest,
                        validator: (_, value) => {
                            if (pattern.test(value)) {
                                if (!isError) {
                                    setErrorText('')
                                }
                                return Promise.resolve()
                            }
                            isError = true
                            setErrorText(rest.message || '')
                            return Promise.reject(new Error(rest.message || ''))
                        },
                    }
                default:
                    return currentRule
            }
        })

        return newRlues
    }

    return (
        <Tooltip
            title={errorText}
            placement="topLeft"
            color="#fff"
            overlayInnerStyle={{
                color: '#e60012',
            }}
            getPopupContainer={(element) => parentNode || element}
            zIndex={99}
        >
            <div id={id}>
                <Form.Item
                    {...props}
                    name={name}
                    className={classnames(
                        styles.formItemContainer,
                        props.className,
                    )}
                    rules={props?.rules?.length ? changeRules(props.rules) : []}
                >
                    {children}
                </Form.Item>
            </div>
        </Tooltip>
    )
}

export default FormItemContainer
