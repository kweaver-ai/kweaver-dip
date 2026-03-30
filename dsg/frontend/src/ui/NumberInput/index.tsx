import * as React from 'react'
import { useState, useEffect } from 'react'
import { Input, InputProps } from 'antd'
import { noop } from 'lodash'
import { NumberType } from './const'

interface ParamsType {
    value?: string // 值都是string类型，判断大小时要注意先转为数字再进行判断
    onChange?: (value: string | number) => void
    onBlur?: (value: string | number) => void
    placeholder?: string // 默认值：请输入数字
    maxLength?: number // 默认值：5
    type?: string // 类型，默认值：number
    max?: number | null
    min?: number | null
    addonAfter?: React.ReactNode
    style?: React.CSSProperties
    disabled?: boolean
    className?: string
    status?: any
    prefix?: React.ReactNode
}

const NumberInput = ({
    value = '',
    onChange = noop,
    onBlur = noop,
    type = NumberType.Number,
    max = null,
    min = null,
    className = '',
    status = '',
    prefix,
    ...restProps
}: ParamsType) => {
    let reg: RegExp
    switch (type) {
        case NumberType.Natural: // 自然数：0 1 2 3 ...
            reg = /^\d*?$/
            break
        case NumberType.Nonnegative: // 非负数（零、正数、小数）：0 0.1 1 1.5 2 ...
            reg = /^\d*(\.\d*)?$/
            break
        case NumberType.Integer:
            reg = /^-?\d*(\d*)?$/
            break
        case NumberType.PositiveInteger:
            reg = /^\d*?$/
            break
        case NumberType.IntegerOneToThousand:
            reg = /^$|^([1-9]\d{0,2}|1000)$/
            break
        case NumberType.IntegerZeroToHundred:
            reg = /^$|^([0-9]|[1-9]\d{0,1}|100)$/
            break
        default:
            reg = /^-?\d*(\.\d*)?$/
            break
    }

    const handleChange = (e) => {
        if (!Number.isNaN(e.target.value) && reg.test(e.target.value)) {
            onChange(e.target.value)
        }
    }

    return (
        <Input
            {...restProps}
            value={value}
            autoComplete="off"
            onChange={handleChange}
            onBlur={(e) => {
                const currentValue = Number(e.target.value)
                if (max && currentValue > max) {
                    onChange(max)
                    onBlur?.(max)
                } else if (min && currentValue < min) {
                    onChange(min)
                    onBlur?.(min)
                } else if (e.target.value) {
                    onChange(currentValue)
                    onBlur?.(currentValue)
                } else {
                    // onChange(currentValue)
                    onBlur?.(currentValue)
                }
            }}
            className={className}
            onPressEnter={(e) => {
                e.preventDefault()
                e.stopPropagation()
            }}
            status={status}
            prefix={prefix}
        />
    )
}

export default NumberInput
