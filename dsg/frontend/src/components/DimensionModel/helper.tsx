/* eslint-disable no-await-in-loop */
import { message } from 'antd'
import Hierarchy from '@antv/hierarchy'
import { Cell, Edge, Graph, Node, ObjectExt, StringExt } from '@antv/x6'
import { trim } from 'lodash'
import { useRef, useState } from 'react'
import __ from './locale'
import { useGraphContext } from '@/context'

import {
    formatError,
    getDatasheetViewDetails,
    velidateDimensionModelName,
} from '@/core'
import ModelData from './ModelData'
import {
    EdgeType,
    NodeParams,
    NodeType,
    PortGroupType,
    PortPositionEnum,
} from './components'
import { stateType } from '@/components/DatasheetView/const'

type C = Node | Edge
type T = C | Record<string, any>
type U = T[]
type Metadata = Node.Metadata | Edge.Metadata | any
type CellType = 'node' | 'edge'
interface IDiffCellResult {
    create: C[]
    update: U[]
    remove: string[]
}
/**
 * 绘图更新 diff 操作
 * @param {Graph} graph 画布
 * @param {Metadata[]} cells 基类(Node/Edge)
 * @param {CellType} type
 * @returns
 */
export const diffCells = (
    graph: Graph | null,
    cells: Metadata[] = [],
    type: CellType = 'node',
): IDiffCellResult => {
    const create: C[] = []
    const update: U[] = []
    const remove: string[] = []
    if (graph) {
        const Ctor = type === 'node' ? Node.create : Edge.create
        cells.forEach((c) => {
            const cell = graph.getCellById(c.id)
            if (cell) {
                const t = Ctor(c)
                const prop = t.getProp()
                t.dispose()
                // 为边时直接触发触发更新操作
                if (
                    !ObjectExt.isEqual(cell.getProp(), prop) ||
                    type !== 'node'
                ) {
                    update.push([cell, prop])
                }
            } else {
                create.push(Ctor(c))
            }
        })
        const cellIds = new Set(cells.map((c) => c.id))
        const items = type === 'node' ? graph.getNodes() : graph.getEdges()
        items.forEach((cell) => {
            if (!cellIds.has(cell.id)) {
                remove.push(cell.id)
            }
        })
    }
    return { create, update, remove }
}

/**
 * 绘图数据批量更新
 * @param graph
 * @param data
 */
export const patch = (
    graph: Graph | null,
    data: ReturnType<typeof diffCells>,
) => {
    const { create = [], update = [], remove = [] } = data
    if (graph) {
        graph.batchUpdate(
            'update',
            () => {
                graph.addCell(create)
                update.forEach(([cell, prop]) => {
                    // 直接一次性更新全部的prop可能导致部分属性更新不成功 cell.setProp(prop)
                    Object.keys(prop).forEach((key: string) =>
                        cell.setProp(key, prop[key]),
                    )
                })
                remove.forEach((item) => graph.removeCell(item))
            },
            data,
        )
    }
}

/**
 * ID检测，没有ID则自动生成一个
 * @param {Metadata} metadata
 * @returns
 */
export const checkId = (metadata: Metadata) =>
    ({ ...metadata, id: metadata.id || StringExt.uuid() } as Metadata)

type PortPosType = number | string
type IPortArgsReResult = Record<'x' | 'y', PortPosType>

/**
 * 获取节点桩位置参数
 * @param arr // 节点中展现的列表数组
 * @param key // 关联ID
 * @param PortPosition   // 桩生成位置 左 or 右
 * @returns
 */
export const calcPortArgs = (
    arr: any[],
    key: string | number,
    pos: PortPositionEnum,
): IPortArgsReResult => {
    const { topBarHeight, headerHeight, lineHeight } = NodeParams
    const idx = (arr || []).findIndex((o) => o.id === key)
    return {
        x: pos === PortPositionEnum.Left ? 0 : '100%',
        // eslint-disable-next-line no-bitwise
        y: !~idx
            ? topBarHeight + headerHeight / 2
            : topBarHeight + headerHeight + idx * lineHeight + lineHeight / 2,
    }
}

interface ILayoutResult {
    id: string
    x: number
    y: number
    data: ModelData
    children?: ILayoutResult[]
}

/**
 * 布局算法【compactBox】计算节点定位数据
 * @param {ModelData} tree 节点树数据
 * @returns
 */
export const calcLayoutPosition = (tree: ModelData): ILayoutResult => {
    return Hierarchy.compactBox(tree, {
        direction: 'H',
        getId(d: ModelData) {
            return d.id
        },
        getHeight(d: ModelData) {
            return d.height
        },
        getWidth(d: ModelData) {
            return d.width
        },
        getHGap() {
            return 80 // 水平间距
        },
        getVGap() {
            return 10 // 垂直间距
        },
        getSide: (node: any) => {
            return node.data.side // 节点分边
        },
    })
}

/**
 * 布局重绘
 * @param graph 画布
 * @returns
 */
export const layoutRedraw = (graph: Graph) => {
    if (!graph) return
    // 绘节点布局
    const currentNodes: Node<Node.Properties>[] = graph.getNodes()

    const layoutNodes = currentNodes.map((n) => {
        const { children, dataInfo, ...rest } = n.data
        return rest
    })
    // 目前只涉及事实表-维度表，仅两层
    const factNode = layoutNodes.find((o) => o.nodeType === NodeType.Fact)
    const dimensionNodes = layoutNodes.filter(
        (o) => o.nodeType === NodeType.Dimension,
    )
    const layoutNodeTree = {
        ...factNode,
        children: dimensionNodes,
    }
    const factPos = calcLayoutPosition(layoutNodeTree)

    const nodesPos = [factPos, ...(factPos.children || [])]

    currentNodes?.forEach((node) => {
        const n = nodesPos.find((o) => o.id === node.id)
        if (n) {
            node.setPosition({ x: n.x, y: n.y })
            // const { width, height } = node.getData()
            // node.resize(width, height)
        }
    })

    // 更新边
    // const currentEdges: any[] = graph.getEdges()
    // const edgeDiff = diffCells(graph, currentEdges, 'edge')
    // patch(graph, edgeDiff)
}

const patchNodeAttrs = (graph, data) => {
    const currentNodes = graph.getNodes()
    const layoutNodes = currentNodes.map((n) => {
        const { children, dataInfo, ...rest } = n.data
        return rest
    })
    const factNode = layoutNodes.find((o) => o.nodeType === NodeType.Fact)
    const dimensionNodes = layoutNodes.filter(
        (o) => o.nodeType === NodeType.Dimension,
    )

    const { children: dimensionDatas, ...factData } = data
    let factAttr = {
        width: NodeParams.width,
        height: NodeParams.headerHeight + NodeParams.topBarHeight,
        expand: true,
    }

    if (factNode) {
        factAttr = {
            width: factNode?.width,
            height: factNode?.height,
            expand: factNode?.expand,
        }
    }

    const fact = {
        ...factData,
        ...factAttr,
    }

    const dimensions = (dimensionDatas || []).map((o) => {
        const item = dimensionNodes?.find((cur) => o.id === cur.id)

        let dimensionAttr = {
            width: NodeParams.width,
            height:
                NodeParams.headerHeight +
                NodeParams.topBarHeight +
                NodeParams.lineHeight,
            expand: false,
        }

        if (item) {
            dimensionAttr = {
                width: item?.width,
                height: item?.height,
                expand: item?.expand,
            }
        }

        const it = {
            ...o,
            ...dimensionAttr,
        }
        return it
    })

    return { ...fact, children: dimensions }
}

/**
 * 根据数据渲染画布
 * @param graph 画布
 * @param data 数据
 */
export const graphRenderByData = (graph: Graph, data: ModelData) => {
    if (!graph || !data?.id) return
    const ret = patchNodeAttrs(graph, data)
    const result: ILayoutResult = calcLayoutPosition(ret)

    const nodes: Metadata[] = []
    const edges: Metadata[] = []

    const traverse = (layoutItem: ILayoutResult) => {
        if (layoutItem) {
            const { data: childItem, children } = layoutItem
            nodes.push(
                graph.createNode({
                    id: childItem.id,
                    shape: childItem.nodeType,
                    x: layoutItem.x,
                    y: layoutItem.y,
                    width: childItem.width,
                    height: childItem.height,
                    data: childItem,
                }),
            )

            const current = nodes[nodes.length - 1]
            childItem.id = current.id

            if (childItem.parentId) {
                const edgeKV: Record<string, string> = childItem?.linkMap ?? {}

                if (childItem.nodeType === NodeType.Dimension) {
                    Object.keys(edgeKV).forEach((link) => {
                        const sourceId: string = edgeKV?.[link]
                        const targetId: string = link
                        edges.push(
                            graph.createEdge({
                                id: `${sourceId}::${targetId}`,
                                shape: EdgeType,
                                source: {
                                    cell: childItem.parentId!,
                                    port: sourceId,
                                },
                                target: {
                                    cell: current.id,
                                    port: targetId,
                                },
                                zIndex: -1,
                            }),
                        )
                    })
                }
            }
            if (children) {
                children.forEach((item: ILayoutResult) => {
                    const { data: curData } = item
                    curData.parentId = current.id
                })
                children.forEach((item: ILayoutResult) => traverse(item))
            }
        }
    }
    traverse(result)

    graph.resetCells([...nodes, ...edges])

    // const nodeDiff = diffCells(graph, nodes, 'node')
    // const edgeDiff = diffCells(graph, edges, 'edge')

    // patch(graph, nodeDiff)
    // patch(graph, edgeDiff)
}

export const refreshEdges = (
    graph: Graph,
    nodeType: NodeType,
    linkMap: Record<string, string>,
) => {
    const edges: any[] = []
    const edgeKV = linkMap ?? {}
    Object.keys(edgeKV).forEach((link) => {
        let sourceId: string = edgeKV?.[link]
        let targetId: string = link

        ;[sourceId, targetId] =
            nodeType === NodeType.Dimension
                ? [targetId, sourceId]
                : [sourceId, targetId]

        edges.push({
            id: `${sourceId}::${targetId}`,
            shape: EdgeType,
            source: {
                cell: sourceId?.split(':')[0],
                port: sourceId,
            },
            target: {
                cell: targetId?.split(':')[0],
                port: targetId,
            },
            zIndex: -1,
        })
    })

    const edgeDiff = diffCells(graph, edges, 'edge')
    patch(graph, edgeDiff)
}

/**
 * 检查名称重复
 * @param {string} name 输入值
 * @param {string} oldName 旧名称
 */
export const checkNameRepeat = async (name: string, oldName?: string) => {
    try {
        if (trim(name) === oldName) {
            return Promise.resolve()
        }
        const res = await velidateDimensionModelName(name)
        if (res?.repeat) {
            return Promise.reject(
                new Error(__('该维度模型名称已存在，请重新输入')),
            )
        }
        return Promise.resolve()
    } catch (ex) {
        formatError(ex)
        return Promise.resolve()
    }
}

export const labelText = (text: string, defaultTxt: string = '--') => {
    return (
        text || <span style={{ color: 'rgba(0,0,0,0.45)' }}>{defaultTxt}</span>
    )
}

/**
 * 按指定数据重排字段，维度关联字段靠前
 * @param list 列表
 * @param keyFields 字段数组
 * @param sortKey 排序字段
 */
export const reSortFields = (
    list: any[] | undefined,
    keyFields: string[],
    sortKey: string = 'id',
) => {
    const priorityFields: any[] = []
    const unPriorityFields: any[] = []
    ;(list || []).forEach((it) => {
        const idx = (keyFields || []).findIndex((s) => s === it[sortKey])
        if (idx > -1) {
            priorityFields[idx] = it
        } else {
            unPriorityFields.push(it)
        }
    })
    return [...priorityFields, ...unPriorityFields]
}

// 字段属性转换方法
export const convertColumn = (item) => ({
    id: item.id,
    title: item.business_name,
    type: item.data_type,
})

// 事实表数据转换方法
export const convertConf = (item, isFact?: boolean) =>
    isFact
        ? {
              fact_table_cn_name: item.business_name,
              fact_table_en_name: item.technical_name,
              fact_table_full_path: `${item.view_source_catalog_name}.${item.technical_name}`,
              fact_table_id: item.id,
              dim_field_config: [],
          }
        : {
              dim_table_cn_name: item.business_name,
              dim_table_en_name: item.technical_name,
              dim_table_full_path: `${item.view_source_catalog_name}.${item.technical_name}`,
              dim_table_id: item.id,
          }

const transferDim = (item) => ({
    dim_table_cn_name: item.cnName,
    dim_table_en_name: item.enName,
    dim_table_full_path: item.path,
    dim_table_id: item.id,
    dim_table_join_field_cn_name: item.dimFieldCNName,
    dim_table_join_field_en_name: item.dimFieldENName,
    dim_table_join_field_id: item.dimFieldId,
    dim_table_join_field_data_format: item.dimFieldType,
    fact_table_join_field_cn_name: item.factFieldCNName,
    fact_table_join_field_en_name: item.factFieldENName,
    fact_table_join_field_id: item.factFieldId,
    fact_table_join_field_data_format: item.factFieldType,
})

// 转换本地配置为表配置
export const transferConf = (factConf, dimConf) => ({
    dim_field_config: dimConf?.map(transferDim),
    fact_table_cn_name: factConf.cnName,
    fact_table_en_name: factConf.enName,
    fact_table_full_path: factConf.path,
    fact_table_id: factConf.id,
})

/**
 * 获取字段属性列表
 * @param enable_data_protection 是否过滤开启数据保护的字段
 * @returns
 */
export const useCatalogColumn = (enable_data_protection?: boolean) => {
    const { tableMap } = useGraphContext()
    const [loading, setLoading] = useState<boolean>(false)

    const getColumnsById = async (tableId: string) => {
        if (Object.keys(tableMap).includes(tableId))
            return {
                state: true,
                data: tableMap[tableId],
                view_source_catalog_name:
                    tableMap[`${tableId}view_source_catalog_name`],
                technical_name: tableMap[`${tableId}technical_name`],
            }

        const result = {
            state: true,
            data: [],
            view_source_catalog_name: '',
            technical_name: '',
        }
        try {
            setLoading(true)
            const res: any = await getDatasheetViewDetails(tableId, {
                enable_data_protection,
            })
            if (res?.fields) {
                // 过滤已删除字段
                // .filter(
                //     (item) => item.status !== stateType.delete,
                // )
                const ret = res?.fields
                // tableMap[tableId] = ret
                result.data = ret
            }

            if (res?.status === stateType.delete) {
                result.state = false
            }
            result.view_source_catalog_name = res.view_source_catalog_name
            // tableMap[`${tableId}view_source_catalog_name`] =
            //     res.view_source_catalog_name
            result.technical_name = res.technical_name
            // tableMap[`${tableId}technical_name`] = res.technical_name
        } catch (error) {
            if (error?.data?.code === 'DataView.FormView.FormViewIdNotExist') {
                message.error(__('库表不存在，请重新选择'))
            } else {
                formatError(error)
            }
            const offlineOrNotExisted = [
                'DataCatalog.Public.ResourceNotExisted',
                'DataCatalog.Public.AssetOfflineError',
                'DataView.FormView.FormViewIdNotExist',
            ]?.includes(error?.data?.code)
            result.state = !offlineOrNotExisted
        } finally {
            setLoading(false)
        }

        return result
    }

    return { loading, getColumnsById }
}
