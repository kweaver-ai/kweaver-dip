import { Graph, Node } from '@antv/x6'
import { noop } from 'lodash'
import React, { createContext, useContext } from 'react'
import { FormListTabType } from './const'
import FormQuoteData from './formDataQuoteData'
import { OptionType } from './helper'
import { FormTableKind } from '../Forms/const'

interface IGraphContext {
    /**
     * 图表实例
     */
    graphCase: Graph | null
    /**
     * 更新所有端口和边
     */
    updateAllPortAndEdge: () => void
    /**
     * 节点和关系
     */
    keyAndNodeRelation: FormQuoteData | null
    /**
     * 边关系
     */
    edgeRelation: FormQuoteData | null
    /**
     * 图表数据
     */
    optionGraphData: (
        currentOptionType: OptionType,
        data: any,
        dataNode: Node,
    ) => void
    /**
     * 删除原表
     */
    handleDeleteOriginForm: (originNode: Node) => void
    /**
     * 查看表字段
     */
    onViewFormField: (node: Node) => void

    /**
     * 设置字段
     */
    setHasField: (fieldsId: Array<string>) => void
    /**
     * 设置是否禁用关联对象
     */
    setIsDisabledRelateObj: (isDisabled: boolean) => void

    /**
     * 排序字段
     */
    onSortField: (node: Node) => void

    /**
     * 查看逻辑表字段
     */
    onVieLogicFormField: (id: string) => void
    /**
     * 数据表类型
     */
    tableKind: FormTableKind

    usedFieldIds: Array<string>

    updateUsedFieldIds: (ids: Array<string>) => void

    onOpenConvergenceRules: (fields, node: Node) => void

    configRulesInfo: any
}
// 初始化组件通信
const GraphContext = createContext<IGraphContext>({
    graphCase: null,
    updateAllPortAndEdge: noop,
    keyAndNodeRelation: null,
    edgeRelation: null,
    optionGraphData: noop,
    handleDeleteOriginForm: noop,
    onViewFormField: noop,
    setHasField: noop,
    setIsDisabledRelateObj: noop,
    onSortField: noop,
    onVieLogicFormField: noop,
    tableKind: FormTableKind.DATA_ORIGIN,

    usedFieldIds: [],

    updateUsedFieldIds: noop,

    onOpenConvergenceRules: noop,

    configRulesInfo: null,
})
// 获取context的方法
const useGraphContext = () => useContext<IGraphContext>(GraphContext)

// 提供context的组件
const GraphContextProvider = GraphContext.Provider

export { useGraphContext, GraphContextProvider }
