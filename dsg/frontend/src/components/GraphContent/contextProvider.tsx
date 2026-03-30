import { Graph, Node } from '@antv/x6'
import { noop } from 'lodash'
import { createContext, useContext } from 'react'

interface IGraphContext {
    // 画布实例
    graphCase: Graph | null

    // 选中的字段
    selectedFields: Array<{
        // 表id
        table_id: string
        // 字段id
        field_id: string
    }>

    // 已加载的表
    loadedForm: Array<string>

    // 更新已加载的表
    updateLoadedForm: (formId: string) => void

    // 展开的节点
    expandNode: Array<string>

    // 更新展开的节点
    updateExpandNode: (nodeId: string, operation: 'add' | 'remove') => void

    // 重新加载当前节点关系
    reloadNodeRelation: (node: Node) => void

    // 选中字段
    selectedField: (field: any, node: Node) => void
}
// 初始化组件通信
export const GraphContext = createContext<IGraphContext>({
    graphCase: null,
    selectedFields: [],
    loadedForm: [],
    expandNode: [],
    updateLoadedForm: noop,
    updateExpandNode: noop,
    reloadNodeRelation: noop,
    selectedField: noop,
})

// 获取context的方法
export const useGraphContext = () => useContext<IGraphContext>(GraphContext)
