import React, { useEffect, useRef, useState } from 'react'
import { Input, InputProps, InputRef, Tooltip } from 'antd'
import __ from './locale'
import styles from './styles.module.less'

interface IInputWithValidator extends InputProps {
    validate?: (val: string) => string
    value: string
    onFinish: (val: string) => void
    onBlur: () => void
}
const InputWithValidator: React.FC<IInputWithValidator> = ({
    validate = () => {},
    value,
    onFinish,
    onBlur,
    ...rest
}) => {
    const [inputValue, setInputValue] = useState<string>('')
    const [error, setError] = useState('')
    const inputRef = useRef<InputRef>(null)

    useEffect(() => {
        if (value) {
            setInputValue(value)
        }
        inputRef.current!.focus({
            cursor: 'end',
        })
    }, [value])

    const handleChange = (e) => {
        const val = e.target.value
        setInputValue(val)
        onFinish(val)
        const errorMsg = validate(val)
        if (errorMsg) {
            setError(errorMsg)
        } else {
            setError('')
        }
    }

    const handleOnBlur = () => {
        if (error) return
        onBlur()
    }

    return (
        <div className={error && styles['input-validator-error-wrapper']}>
            <Tooltip
                title={<div style={{ color: '#F5222D' }}>{error}</div>}
                open={!!error}
                placement="topLeft"
                color="#fff"
                getPopupContainer={(node) => node.parentElement as HTMLElement}
            >
                <Input
                    value={inputValue}
                    ref={inputRef}
                    placeholder={__('请输入属性名称')}
                    onChange={handleChange}
                    onBlur={handleOnBlur}
                    className={error && styles['input-validator']}
                    {...rest}
                />
            </Tooltip>
        </div>
    )
}
export default InputWithValidator
