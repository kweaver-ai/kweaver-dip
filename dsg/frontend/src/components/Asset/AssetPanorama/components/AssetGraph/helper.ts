import { Graph, Path } from '@antv/x6'
import Hierarchy from '@antv/hierarchy'
import __ from '../../locale'

export const EdgeType = 'an-edge'
export const NodeType = 'an-node'
// 默认主题
export const DEFAULT_THEME = '#D5D5D5'

// 边配置
export const EdgeConf = {
    markup: [
        {
            tagName: 'path',
            selector: 'wrap',
            attrs: {
                fill: 'none',
                cursor: 'pointer',
                stroke: 'transparent',
                strokeLinecap: 'round',
            },
        },
        {
            tagName: 'path',
            selector: 'line',
            attrs: {
                fill: 'none',
                pointerEvents: 'none',
            },
        },
    ],
    router: {
        name: 'manhattan',
    },
    // connector: { name: 'normal' },
    attrs: {
        wrap: {
            connection: true,
            strokeWidth: 1,
            strokeLinejoin: 'round',
        },
        line: {
            connection: true,
            stroke: '#D9D9D9',
            strokeWidth: 1,
            targetMarker: null,
        },
    },
    zIndex: -1,
}

// 桩分组
export enum PortGroupType {
    Out = 'out',
    In = 'in',
}

// 桩样式配置
const PortCircle = {
    r: 4,
    // magnet: true,
    strokeWidth: 1,
    fill: 'transparent',
    stroke: 'transparent',
}

// L1桩配置
export const PortConf: any = {
    groups: {
        [PortGroupType.Out]: {
            position: 'bottom',
            attrs: {
                circle: PortCircle,
            },
        },
        [PortGroupType.In]: {
            position: 'top',
            attrs: {
                circle: PortCircle,
            },
        },
    },
}

// L2桩配置
export const PortConfL2: any = {
    groups: {
        [PortGroupType.Out]: {
            position: {
                name: 'absolute',
                args: { x: 12, y: '100%' },
            },
            attrs: {
                circle: PortCircle,
            },
        },
        [PortGroupType.In]: {
            position: {
                name: 'absolute',
                args: {
                    y: 0,
                    x: '50%',
                },
            },
            attrs: {
                circle: PortCircle,
            },
        },
    },
}

// L3桩配置
export const PortConfL3: any = {
    groups: {
        [PortGroupType.Out]: {
            position: {
                name: 'absolute',
                args: { x: 12, y: '100%' },
            },
            attrs: {
                circle: PortCircle,
            },
        },
        [PortGroupType.In]: {
            position: {
                name: 'absolute',
                args: {
                    x: 0,
                    y: '50%',
                },
            },
            attrs: {
                circle: PortCircle,
            },
        },
    },
}

// 画布初始默认配置
export const GraphConf = {
    background: {
        color: '#F6F9FB',
    },
    autoResize: true,
    panning: true,
    embedding: false,
    interacting: false,
    grid: { size: 3 },
    connecting: {
        allowBlank: false,
        allowLoop: false,
        allowNode: false,
        allowEdge: false,
        highlight: true,
        connectionPoint: 'anchor',
        snap: true,
        // router: {
        //     name: 'er',
        //     args: {
        //         direction: 'H',
        //     },
        // },
    },
}

/**
 * 资产节点类型
 */
export enum AssetNodeType {
    SUBJECTGROUP = 'subject_domain_group', // 主题域分组
    SUBJECTGDOMAIN = 'subject_domain', // 主题域
    BUSINESSOBJ = 'business_object', // 业务对象
    BUSINESSACT = 'business_activity', // 业务活动
    LOGICENTITY = 'logic_entity', // 逻辑实体
    DATAVIEW = 'data_view', // 库表
}

/**
 * 组织架构基础数据单元
 */
export type INode = {
    id: string
    name: string
    path_id: string
    path_name: string
    type: string
    child?: INode[]
    parent_id?: string
    view_business_name?: string
    view_id?: string
    view_technical_name?: string
    [key: string]: any
}

interface ILayoutResult {
    id: string
    x: number
    y: number
    data: INode
    children?: ILayoutResult[]
}

const ElseSize = {
    width: 220,
    height: 72,
}

export const NodeTypeText = {
    [AssetNodeType.SUBJECTGROUP]: __('主题域分组'),
    [AssetNodeType.SUBJECTGDOMAIN]: __('主题域'),
    [AssetNodeType.BUSINESSOBJ]: __('业务对象'),
    [AssetNodeType.BUSINESSACT]: __('业务活动'),
    [AssetNodeType.LOGICENTITY]: __('逻辑实体'),
}

const NodeSize = {
    [AssetNodeType.SUBJECTGROUP]: { width: 240, height: 94 },
    [AssetNodeType.SUBJECTGDOMAIN]: { width: 234, height: 72 },
    [AssetNodeType.BUSINESSOBJ]: { width: 206, height: 72 },
    [AssetNodeType.BUSINESSACT]: { width: 206, height: 72 },
    [AssetNodeType.LOGICENTITY]: { width: 178, height: 72 },
}

/**
 * 布局算法 紧凑树【compactBox】计算节点定位数据
 * @param {INode} tree 节点树数据
 * @returns
 */
export const calcLayoutPosition = (tree: INode): ILayoutResult => {
    return Hierarchy.compactBox(tree, {
        direction: 'TB',
        getId(d: INode) {
            return d.id
        },
        getHeight(d: INode) {
            return NodeSize[d.type].height
        },
        getWidth(d: INode) {
            return NodeSize[d.type].width
        },
        getHGap(d: INode) {
            return 8
        },
        getVGap(d: INode) {
            return 9
        },
        getSide: (d: INode) => {
            return d.type === AssetNodeType.SUBJECTGROUP ? 'bottom' : 'right'
        },
    })
}

/**
 * 布局算法 缩进树【Indented】计算节点定位数据
 * @param {INode} tree 节点树数据
 * @returns
 */
export const calcLayoutPositionIndented = (tree: INode): ILayoutResult => {
    return Hierarchy.indented(tree, {
        direction: 'LR',
        getId(d: INode) {
            return d.id
        },
        getHeight(d: INode) {
            return NodeSize[d.type].height
        },
        getWidth(d: INode) {
            return NodeSize[d.type].width
        },
        getHGap(d: INode) {
            return 8
        },
        getVGap(d: INode) {
            return 4
        },
        getSide: (d: INode) => {
            return 'right'
        },
        indent: (d) => {
            return d.data.type !== AssetNodeType.SUBJECTGDOMAIN
                ? d.parent.x + 28
                : 0
        },
    })
}

export const getGroupsByType = (type: AssetNodeType) => {
    if (type === AssetNodeType.SUBJECTGROUP) {
        return PortConf
    }
    if (type === AssetNodeType.SUBJECTGDOMAIN) {
        return PortConfL2
    }

    return PortConfL3
}

const getNodeItem = (data: INode, pos: { x: number; y: number }) => {
    return {
        id: data.id,
        shape: NodeType,
        ...pos,
        width: NodeSize[data.type].width,
        height: NodeSize[data.type].height,
        data,
        ports: {
            groups: getGroupsByType(data.type as AssetNodeType).groups,
            items: [
                {
                    id: `${data.id}-in`,
                    group: PortGroupType.In,
                },
                {
                    id: `${data.id}-out`,
                    group: PortGroupType.Out,
                },
            ],
        },
    }
}

const calcL2ChildPosition = (
    graph: Graph,
    rootNode: INode,
    offset: { x: number; y: number } = { x: 0, y: 0 },
) => {
    // 缩进树计算节点位置
    const indentedLayout: ILayoutResult = calcLayoutPositionIndented(rootNode)
    const nodes: any[] = []
    const edges: any[] = []

    const traverse = (item: ILayoutResult) => {
        const { data, children } = item
        nodes.push(
            graph.createNode(
                getNodeItem(data, {
                    x: item.x + offset.x,
                    y: item.y + offset.y,
                }),
            ),
        )

        const current = nodes[nodes.length - 1]
        data.id = current.id
        // 计算边
        children?.forEach((e) => {
            const edge = graph.createEdge({
                id: `${current.id}::${e.id}`,
                shape: EdgeType,
                source: {
                    cell: current.id,
                    port: `${current.id}-out`,
                },
                target: {
                    cell: e.id,
                    port: `${e.id}-in`,
                },
                zIndex: -1,
            })
            edges.push(edge)
        })
        if (children) {
            children.forEach((n) => {
                const { data: curData } = n
                curData.parent_id = current.id
            })
            children.forEach((n) => traverse(n))
        }
    }

    traverse(indentedLayout)

    return {
        L2Node: nodes,
        L2Edge: edges,
    }
}

/**
 * 根据数据渲染画布
 * @param graph 画布
 * @param root 数据
 */
export const graphRenderByData = (graph: Graph, root: INode) => {
    if (!graph || !root?.id) return
    if (root.type !== AssetNodeType.SUBJECTGROUP) return

    const L2 = root.children
    const child = L2?.map((o) => ({ ...o, children: null }))
    const L1 = { ...root, children: child }
    const L1Layout: ILayoutResult = calcLayoutPosition(L1)
    const nodes: any[] = []
    const edges: any[] = []
    const traverse = (layoutItem: ILayoutResult) => {
        if (layoutItem) {
            const { data, children } = layoutItem
            if (data.type === AssetNodeType.SUBJECTGDOMAIN) {
                const obj = L2.find((o) => o.id === data.id)
                const offset = {
                    x: layoutItem.x,
                    y: layoutItem.y,
                }
                const { L2Node, L2Edge } = calcL2ChildPosition(
                    graph,
                    obj,
                    offset,
                )
                nodes.push(...L2Node)
                edges.push(...L2Edge)
            } else {
                nodes.push(
                    graph.createNode(
                        getNodeItem(data, {
                            x: layoutItem.x,
                            y: layoutItem.y,
                        }),
                    ),
                )
                const current = nodes[nodes.length - 1]
                data.id = current.id
                // 计算边
                children?.forEach((item) => {
                    const edge = graph.createEdge({
                        id: `${current.id}::${item.id}`,
                        shape: EdgeType,
                        source: {
                            cell: current.id,
                            port: `${current.id}-out`,
                        },
                        target: {
                            cell: item.id,
                            port: `${item.id}-in`,
                        },
                        zIndex: -1,
                        router: {
                            name: 'manhattan',
                            args: {
                                step: 2,
                                padding: 3,
                            },
                        },
                    })
                    edges.push(edge)
                })
                if (children) {
                    children.forEach((item) => {
                        const { data: curData } = item
                        curData.parent_id = current.id
                    })
                    children.forEach((item) => traverse(item))
                }
            }
        }
    }
    traverse(L1Layout)
    graph.resetCells([...nodes, ...edges])
}

/**
 * 列表转单链树(便于绘图)
 * @param arr 同层二级列表
 * @returns
 */
export const convertListToLink = (arr: INode[]) => {
    return arr?.reduceRight((prev: INode[], cur: INode) => {
        return [
            {
                ...cur,
                children: prev,
            },
        ]
    }, [])
}

/**
 * 节点格式转换
 */
export const transformNodes = (node: INode) => {
    if (!node) return null
    const { child, ...rest } = node
    return {
        ...rest,
        expand: ![
            AssetNodeType.BUSINESSACT,
            AssetNodeType.BUSINESSOBJ,
        ].includes(node.type as any),
        tempChild: [
            AssetNodeType.BUSINESSACT,
            AssetNodeType.BUSINESSOBJ,
        ].includes(node.type as any)
            ? child?.map((c) => transformNodes(c))
            : undefined,
        hasChild: !!child?.length,
        children:
            node.type === AssetNodeType.LOGICENTITY // 限定仅显示到逻辑实体
                ? null
                : ![
                      AssetNodeType.BUSINESSACT,
                      AssetNodeType.BUSINESSOBJ,
                  ].includes(node.type as any)
                ? child?.map((c) => transformNodes(c))
                : undefined,
    }
}

function updateDeepChildren(obj: any, updateFunc: any) {
    if (obj.children) {
        // eslint-disable-next-line no-param-reassign
        obj.children = obj.children?.map((child) =>
            updateDeepChildren(child, updateFunc),
        )
    }
    return updateFunc(obj)
}

export const changeExpandIds = (root: any, ids: string[]) => {
    if (!root) return undefined
    let isChange = false

    updateDeepChildren(root, (obj) => {
        if (ids.includes(obj.id)) {
            if (!obj.expand) {
                isChange = true
            }
            // eslint-disable-next-line no-param-reassign
            obj = { ...obj, expand: true, children: obj.tempChild }
        }
        return obj
    })
    return isChange ? { ...root } : undefined
}

export const toggleNode = (root: any, curNode: INode) => {
    if (!root) return undefined
    const curExpand = curNode.expand
    const node = {
        ...curNode,
        children: curExpand ? curNode.tempChild : undefined,
    }

    updateDeepChildren(root, (obj) => {
        if (obj.id === curNode.id) {
            // eslint-disable-next-line no-param-reassign
            obj = node
        }
        return obj
    })

    return { ...root }
}

export const toggleAll = (root: any) => {
    if (!root) return undefined

    updateDeepChildren(root, (obj) => {
        if (
            [AssetNodeType.BUSINESSACT, AssetNodeType.BUSINESSOBJ].includes(
                obj.type,
            )
        ) {
            // eslint-disable-next-line no-param-reassign
            obj = { ...obj, expand: false, children: undefined }
        }
        return obj
    })

    return { ...root }
}

export const renderList = (graph: any, groups: any[], curId: string) => {
    const left: any[] = []
    const right: any[] = []
    let curArr = left
    groups.forEach((item: any) => {
        if (item.id === curId) {
            curArr = right
        } else {
            curArr.push(item)
        }
    })

    const elesNode = graph
        .getCells()
        ?.filter((o) => !groups.some((it) => it.id === o.id))
    const node = graph.getCellById(curId)
    const offset = node.getBBox()

    const LeftNodes = left.map((o, idx) => {
        const pos = {
            x: offset.x - (left.length - idx) * 236,
            y: offset.y + 12,
        }
        return graph.createNode({
            id: o.id,
            shape: NodeType,
            ...pos,
            width: ElseSize.width,
            height: ElseSize.height,
            data: o,
        })
    })

    const RightNodes = right.map((o, idx) => {
        const pos = {
            x: offset.x + 256 + idx * 236,
            y: offset.y + 12,
        }
        return graph.createNode({
            id: o.id,
            shape: NodeType,
            ...pos,
            width: ElseSize.width,
            height: ElseSize.height,
            data: o,
        })
    })

    graph.resetCells([...elesNode, node, ...LeftNodes, ...RightNodes])
}
