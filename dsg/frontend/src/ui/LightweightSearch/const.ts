import React from 'react'

export enum SearchType {
    'Input',
    'Select',
    'Checkbox',
    'RangePicker',
    'TextArea',
    'Radio',
    'InputNumber',
    'MultipleSelect',
    'SelectThemeDomain',
    'DepartmentAndOrgSelect',
    'Customer',
    'Other',
}
export interface IOptions {
    value: string | number | boolean | Array<any> | undefined
    label: string
    isInit?: boolean
    icon?: React.ReactNode
}
export interface IformItem {
    label: string
    key: string
    options: IOptions[]
    type: SearchType
    initLabel?: string
    separator?: string
    show?: boolean
    Component?: React.ComponentType<{
        value?: any
        onChange: (value: any) => void
    }>
    componentProps?: Record<string, any> // 传递给自定义组件的额外属性
}

export interface ILightweightSearch {
    ref?: any
    formData: IformItem[]
    onChange: (data: any, key?: string) => void
    defaultValue: any
    width?: string
    // 筛选按钮显示
    filterTopNode?: any
    isButton?: boolean
    hiddenItemCb?: (params, item) => boolean
    showReset?: boolean // 是否显示重置按钮 ，默认formData > 1 显示
    placement?: any
    // 组件显示类名
    compClassName?: string
    getPopupContainer?: (node: HTMLElement) => HTMLElement
}
