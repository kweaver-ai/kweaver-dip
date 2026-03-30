import React from 'react'
import __ from '../locale'

/**
 * 表单字段数据
 */
export interface FieldData {
    name: string | number | (string | number)[]
    value?: any
    touched?: boolean
    validating?: boolean
    errors?: string[]
}
/**
 *
 * 应用信息
 */
export const appInfo = [
    {
        key: 'name',
        label: __('应用名称'),
        value: '',
        span: 8,
    },
    {
        key: 'info_system_name',
        label: __('信息系统'),
        value: '',
        span: 8,
    },
    // {
    //     key: 'description',
    //     label: __('应用描述'),
    //     value: '',
    //     span: 8,
    // },
    {
        key: 'pass_id',
        label: __('应用passid'),
        value: '',
        span: 8,
    },
]

/**
 * 选择框无数据
 */
export const NotFoundContent: React.FC<{ text?: string }> = ({
    text = __('暂无数据'),
}) => <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>{text}</div>

export const resourceUtilizationOptions = [
    {
        label: __('30天'),
        value: 30,
    },
    {
        label: __('90天'),
        value: 90,
    },
    {
        label: __('180天'),
        value: 180,
    },
    {
        label: __('长期'),
        value: -1,
    },
    {
        label: __('自定义日期'),
        value: -2,
    },
]
