import { TableProps, ColumnsType } from 'antd/es/table'
import React, { ReactNode } from 'react'

export enum FixedType {
    LEFT = 'left',
    RIGHT = 'right',
}
export enum AlignType {
    LEFT = 'left',
    RIGHT = 'right',
    CENTER = 'right',
}
/**
 *  查询请求的接口
 */
interface queryActionType {
    (arg: any): void
}
/**
 *  字段
 */
interface IlistName {
    entries: string
    total: number | string
}
/**
 * @param queryAction 查询请求的接口
 * @param params 查询参数
 * @param baseProps antd属性
 * @param listName 后端返回数据list字段，默认{entries: entries,total: total_count}
 * @param mockData 测试数据 无接口时,前端渲染数据
 * @param emptyDesc 无数据时显示内容
 * @param emptyIcon 无数据时显示图标
 * @param emptyStyle 无数据时空状态样式
 * @param isReplace 是否替换请求参数
 * @param getEmptyFlag 是否为空
 * @param useDefaultPageChange 是否使用组件自带分页方法
 */
export interface ITableData {
    queryAction: queryActionType
    params: any
    baseProps?: TableProps<any>
    listName?: IlistName
    mockData?: any[]
    emptyExcludeField?: string[]
    ref?: any
    emptyDesc?: React.ReactElement | string
    emptyIcon?: any
    emptyStyle?: any
    isReplace?: boolean
    useDefaultPageChange?: boolean
    getEmptyFlag?: (flag: boolean) => void
    onChange?: (pagination, filters, sorter) => void
    onTableListUpdated?: () => void
    getTableList?: (data: any) => void
    dataProcessor?: (data: any) => any
    scrollY?: number | string
}
