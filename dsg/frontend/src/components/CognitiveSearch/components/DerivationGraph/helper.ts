import { forEach } from 'lodash'
import { Graph, Path } from '@antv/x6'
import Hierarchy from '@antv/hierarchy'

export const EdgeType = 'dn-edge'
export const NodeType = 'dn-node'

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
        args: {
            padding: {
                left: 16,
            },
        },
    },
    connector: { name: 'rounded' },
    attrs: {
        wrap: {
            connection: true,
            strokeWidth: 4,
            strokeLinejoin: 'round',
        },
        line: {
            connection: true,
            stroke: DEFAULT_THEME,
            strokeWidth: 1,
            targetMarker: {
                name: 'block',
                size: 8,
            },
        },
    },
    defaultLabel: {
        markup: [
            {
                tagName: 'rect',
                selector: 'body',
            },
            {
                tagName: 'text',
                selector: 'label',
            },
        ],
        attrs: {
            text: {
                fill: 'rgba(0,0,0,0.65)',
                fontSize: 14,
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
                pointerEvents: 'none',
            },
            rect: {
                ref: 'label',
                fill: '#F6F9FB',
                rx: 3,
                ry: 3,
                refWidth: 2,
                refHeight: 2,
                refX: 0,
                refY: 0,
            },
        },
        position: {
            distance: 54,
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

// 桩配置
export const PortConf: any = {
    groups: {
        [PortGroupType.Out]: {
            position: {
                name: 'right',
                dy: '50%',
            },
            attrs: {
                circle: PortCircle,
            },
        },
        [PortGroupType.In]: {
            position: {
                name: 'left',
                dy: '50%',
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
    connecting: {
        allowBlank: false,
        allowLoop: false,
        allowNode: false,
        allowEdge: false,
        highlight: true,
        connectionPoint: 'anchor',
        snap: true,
        router: {
            name: 'er',
            args: {
                offset: 25,
                direction: 'H',
            },
        },
    },
}

// 推导节点类型
export enum NodePortsType {
    START = 'START', //  推导起始维度
    CENTER = 'CENTER', // 推导中间维度
    END = 'END', // 推导结果
}

// 根据节点类型获取ports
export const getPortsByType = (type: NodePortsType, nodeId: string) => {
    let ports: any[] = []
    switch (type) {
        case NodePortsType.START:
            ports = [
                {
                    id: `${nodeId}-out`,
                    group: PortGroupType.Out,
                },
            ]
            break
        case NodePortsType.END:
            ports = [
                {
                    id: `${nodeId}-in`,
                    group: PortGroupType.In,
                },
            ]
            break
        default:
            ports = [
                {
                    id: `${nodeId}-in`,
                    group: PortGroupType.In,
                },
                {
                    id: `${nodeId}-out`,
                    group: PortGroupType.Out,
                },
            ]
            break
    }
    return ports
}

export type INode = {
    name: string
    vid: string
    color: string
    entity_type: string
    raw_name: string
    relation: string
    children?: INode[]
    width?: number
    height?: number
    parentId?: string
    isExpand?: boolean
    tempChild?: INode[]
    extra?: Record<string, any>
}

interface ILayoutResult {
    id: string
    x: number
    y: number
    data: INode
    children?: ILayoutResult[]
}

/**
 * 动态计算表名及描述额外高度
 * @param extra
 * @returns
 */
const getExtraHeight = (extra: Record<string, any> | undefined) => {
    return extra
        ? (extra.table_name ? 18 : 0) + (extra.description ? 36 : 0)
        : 0
}

/**
 * 布局算法【mindmap】计算节点定位数据
 * @param {INode} tree 节点树数据
 * @returns
 */
export const calcLayoutPosition = (tree: INode): ILayoutResult => {
    return Hierarchy.mindmap(tree, {
        direction: 'H',
        getId(d: INode) {
            return d.vid
        },
        getHeight(d: INode) {
            const extraHeight = getExtraHeight(d?.extra)
            return extraHeight + (d.height || 0)
        },
        getWidth(d: INode) {
            return d.width
        },
        getHGap(d: INode) {
            return 65
        },
        getVGap() {
            return 20 // 垂直间距
        },
        getSide: () => {
            return 'left'
        },
    })
}

const layoutExtra = {
    height: 114,
    width: 210,
}
/**
 * 根据数据渲染画布
 * @param graph 画布
 * @param data 数据
 */
export const graphRenderByData = (graph: Graph, data: INode) => {
    if (!graph || !data?.vid) return
    const result: ILayoutResult = calcLayoutPosition(data)
    const nodes: any[] = []
    const edges: any[] = []

    const traverse = (layoutItem: ILayoutResult) => {
        if (layoutItem) {
            const { data: childItem, children } = layoutItem
            // 获取节点桩类型
            const portType = childItem.parentId
                ? children?.length
                    ? NodePortsType.CENTER
                    : NodePortsType.START
                : NodePortsType.END

            const extraHeight = getExtraHeight(childItem.extra)

            nodes.push(
                graph.createNode({
                    id: childItem.vid,
                    shape: NodeType,
                    x: layoutItem.x,
                    y: layoutItem.y,
                    width: childItem.width,
                    height: extraHeight + (childItem.height ?? 60),
                    ports: getPortsByType(portType, childItem.vid),
                    data: childItem,
                }),
            )

            const current = nodes[nodes.length - 1]
            childItem.vid = current.id
            // 计算边
            children?.forEach((item) => {
                const edge = graph.createEdge({
                    id: `${current.id}::${item.id}`,
                    shape: EdgeType,
                    source: {
                        cell: item.id,
                        port: `${item.id}-out`,
                    },
                    target: {
                        cell: current.id,
                        port: `${current.id}-in`,
                    },
                    zIndex: -1,
                    label: item.data.relation,
                })
                edges.push(edge)
            })
            if (children) {
                children.forEach((item) => {
                    const { data: curData } = item
                    curData.parentId = current.id
                })
                children.forEach((item) => traverse(item))
            }
        }
    }
    traverse(result)

    graph.resetCells([...nodes, ...edges])
}

const getNodeData = (node) => node.data

const arrayToTree = (arr: any[], pid: string) => {
    const obj = {}
    const result: any[] = []
    arr.forEach((o) => {
        const item = getNodeData(o)
        if (item.isExpand) {
            if (!item.children) {
                item.children = item.tempChild
            }
        } else {
            if (item.children) {
                item.tempChild = item.children
            }
            item.children = undefined
        }

        obj[item.vid] = item
    })

    arr.forEach((o) => {
        const item = getNodeData(o)
        const id = item.parentId

        if (id === pid) {
            result.push(item)
        } else if (obj[id].isExpand) {
            if (
                obj[id].children?.length < obj[id].tempChild?.length &&
                obj[id].children
            ) {
                obj[id].children.push(item)
            } else {
                obj[id].children = [item]
            }
        } else {
            obj[id].children = undefined
        }
    })

    return result
}

const treeToArray = (tree: any) => {
    const result: any = []

    const { children, ...item } = tree
    result.push(item)

    const maxWidth = children?.reduce((prev, cur) => {
        return Math.max(prev, cur.data.width)
    }, 0)
    children?.forEach((obj) => {
        const it = {
            ...obj,
            data: {
                ...obj.data,
                width: maxWidth,
            },
        }
        const ret = treeToArray(it)
        result.push(...(ret || []))
    })
    return result
}

/**
 * 布局重绘
 * @param graph 画布
 * @returns
 */
export const layoutRedraw = (graph: Graph, optNode: any) => {
    if (!graph) return
    // 绘节点布局
    const currentNodes: any[] = graph.getNodes()

    const nodes = currentNodes?.map((o) => (o.id === optNode?.id ? optNode : o))
    const layoutNodeTree = arrayToTree(nodes, 'root')
    graphRenderByData(graph, layoutNodeTree?.[0])
}

/**
 * 匹配关键字上色
 * @param keys 关键字列表
 * @param text 文本
 */
export const matchColorText = (keys: string[], text: string) => {
    let ret = text

    if (keys?.length) {
        const regex = new RegExp(keys.join('|'), 'gi')
        ret = text?.replace(regex, (item) => {
            return `<span style="color: #FF6304">${item}</span>`
        })
    }

    return ret
}
