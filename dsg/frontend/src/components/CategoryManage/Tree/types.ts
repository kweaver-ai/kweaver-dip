import type { MutableRefObject } from 'react'

export interface TreeItem {
    id: string
    children: TreeItem[]
    collapsed?: boolean
    [key: string]: any
}

export type TreeItems = TreeItem[]

export interface FlattenedItem extends TreeItem {
    parentId: string | null
    depth: number
    index: number
}

export type SensorContext = MutableRefObject<{
    items: FlattenedItem[]
    offset: number
}>
