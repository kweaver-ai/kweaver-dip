import { ReactNode } from 'react'

/**
 * 节点数据
 */
export interface NodeDataType {
    // 节点id
    id: string
    // 节点标签
    label: string | ReactNode
    // 节点类型
    type: string
    // 节点数据字段
    fields: Array<DataFieldType>
    // 父节点id
    parentNodeId?: Array<string>
    // 子节点id
    childrenNodeId?: Array<string>
    // 原始数据
    originData?: any

    mainNode?: boolean
}

/**
 * 数据字段
 */
export interface DataFieldType {
    // 字段id
    id: string
    // 字段标签
    label: string | ReactNode
    // 父字段
    parentField?: Array<{
        id: string
        tableId?: string
    }>
    // 子字段
    childrenField?: Array<{
        id: string
        tableId?: string
    }>

    tool?: {
        left?: {
            label: string | ReactNode
        }
        right?: {
            label: string | ReactNode
        }
    }
}
