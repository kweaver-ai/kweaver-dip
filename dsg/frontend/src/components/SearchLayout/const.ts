import type { FormProps } from 'antd/es/form'
import { ReactNode } from 'react'

export const typeAll = 0

export enum SearchType {
    'Input',
    'Select',
    'Checkbox',
    'DatePicker',
    'RangePicker',
    'TextArea',
    'Radio',
    'InputNumber',
    'MultipleSelect',
    'SelectThemeDomain',
    'SelectThemeDomainTree',
    'DepartmentAndOrgSelect',
    'InfoSystem',
    'Other',
}

/**
 * @param IFormData form属性,继承antd form
 * @param formData 表单项列表数据，遍历生成查询条件
 * @param onSearch 查询事件
 * @param getExpansionStatus 获取是否是展开状态，可用于计算页面或者表格高度
 * @param getMoreExpansionStatus 超过8个搜索条件，是否展开更多
 * @param prefixNode 搜索栏前缀组件，例如：新增按钮、状态切换
 * @param suffixNode 搜索栏后缀组件，例如：排序
 * @param lastNode 搜索栏最后面的节点，例如：展开按钮
 * @param itemValueChange 单个值变化
 * @param onReset 重置事件
 * @param isShowRefreshBtn 是否显示刷新按钮
 */
export interface IFormData extends FormProps {
    formData: IFormItem[]
    // isRefresh-为true表示刷新按触发的搜索
    onSearch: (value?: any, isRefresh?: boolean) => void
    getExpansionStatus?: (value?: any) => void
    getMoreExpansionStatus?: (value?: any) => void
    itemValueChange?: (value?: any) => void
    onReset?: (value?: any) => void
    isShowRefreshBtn?: boolean
    expansion?: boolean
    ref?: any
    prefixNode?: ReactNode
    suffixNode?: ReactNode
    beforeSearchInputNode?: ReactNode
}

/**
 * 查询参数
 * @param label 显示中文名称
 * @param key 传入后台字段
 * @param type 类型目前支持input、select、RangePicker和自定义组件
 * @param defaultValue 默认值
 * @param selectOptions 类型为select才有
 * @param formItemProps Form.item的antd属性
 * @param span 栅格布局,默认值：大于1440分辨率 6;大于1280,小于1440分辨率8; 1280显示2个
 * @param itemProps 单个表单元素如：Input 的antd属性
 * @param startTime type为RangePicker时,开始时间字段,默认start_time
 * @param endTime type为RangePicker时,结束时间字段,默认end_time
 * @param isTimestamp 值是否为时间戳
 * @param isAlone 是否单独作为查询条件
 */
export interface IFormItem {
    label: string | ReactNode
    key: string
    type: SearchType
    defaultValue?: any
    selectOptions?: any[]
    formItemProps?: any
    span?: string | number
    offset?: number
    hidden?: boolean
    itemProps?: any
    startTime?: any
    endTime?: any
    isTimestamp?: boolean
    render?: (item?: IFormItem) => void
    isAlone?: boolean
}
