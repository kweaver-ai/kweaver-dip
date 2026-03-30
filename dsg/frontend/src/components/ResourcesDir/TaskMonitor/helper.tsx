import { Graph } from '@antv/x6'
import Hierarchy from '@antv/hierarchy'
import { NodeConfig, NodeType, PortGroupType, TaskStatus } from './nodes'
import { NodeDataType } from './const'

// 布局配置
export const LayoutConfig = {
    startX: 0,
    startY: 0,
    horizontalSpacing: 142,
    verticalSpacing: 107,
    aggregationVSpacing: 78,
    fusionWidth: 40,
}

export const EdgeType = 'task-edge'

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
        excludeShapes: ['tag-node'],
        args: {
            padding: {
                left: 120,
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
            stroke: '#9BA0BA',
            strokeWidth: 1,
            targetMarker: {
                name: 'block',
                size: 8,
            },
        },
    },
    zIndex: -1,
}
// 画布配置
export const GraphConfig = {
    background: {
        color: '#f0f2f6',
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

// 根据状态更新节点数据
export const updateNodeStatus = (
    graph: Graph,
    nodeId: string,
    status: TaskStatus,
    progress?: number,
) => {
    const node = graph.getCellById(nodeId)
    if (node) {
        // 更新节点数据，React组件会自动响应
        node.setData({
            ...node.getData(),
            status,
            progress,
        })
    }
}

// 获取节点宽高
const getNodeWH = (type: NodeType): { width: number; height: number } => {
    return NodeConfig[type] || { width: 182, height: 84 }
}

// 获取端口配置
const getNodePorts = (type: NodeDataType) => {
    switch (type) {
        case NodeDataType.Catalog:
            return [
                { id: 'in', group: PortGroupType.Left },
                { id: 'out-right', group: PortGroupType.Right },
                { id: 'out-top', group: PortGroupType.Top },
                { id: 'out-bottom', group: PortGroupType.Bottom },
            ]
        case NodeDataType.Aggregation:
            return [{ id: 'out', group: PortGroupType.Right }]
        case NodeDataType.Fusion:
            return [
                { id: 'in', group: PortGroupType.Left },
                { id: 'out', group: PortGroupType.Right },
            ]
        case NodeDataType.Standardization:
            return [{ id: 'in', group: PortGroupType.Left }]
        case NodeDataType.Quality:
            return [{ id: 'in', group: PortGroupType.Bottom }]
        case NodeDataType.Comprehension:
            return [{ id: 'in', group: PortGroupType.Top }]
        default:
            return []
    }
}

export enum RecordType {
    // 信息系统
    Records = 'records',
    // 数据仓库
    Analytical = 'analytical',
    // 数据沙箱
    Sandbox = 'sandbox',
}

export const RecordTypeText = {
    [RecordType.Records]: '信息系统',
    [RecordType.Analytical]: '数据仓库',
    [RecordType.Sandbox]: '数据沙箱',
}

// 节点创建
export const createNode = (
    graph: Graph,
    type: NodeDataType,
    position: { x: number; y: number },
    data: any,
) => {
    const nodeType =
        type === NodeDataType.Catalog
            ? NodeType.Catalog
            : type === NodeDataType.Tag
            ? NodeType.Tag
            : NodeType.Task

    return graph.createNode({
        id: data?.id,
        shape: nodeType,
        ...position,
        ...getNodeWH(nodeType),
        data: {
            ...data,
            type,
        },
        ports: getNodePorts(type),
        zIndex: nodeType === NodeType.Tag ? 10 : 1,
    })
}

// 连线创建
export const createEdge = (
    graph: Graph,
    sourceId: string,
    sourcePort: string,
    targetId: string,
    targetPort: string,
) => {
    return graph.addEdge({
        source: { cell: sourceId, port: sourcePort },
        target: { cell: targetId, port: targetPort },
    })
}

export type INode = {
    id: string
    type: NodeDataType
    children?: INode[]
    hasBro?: boolean // 是否存在兄弟节点
    [key: string]: any
}

interface ILayoutResult {
    id: string
    x: number
    y: number
    data: INode
    children?: ILayoutResult[]
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
            return d.id
        },
        getHeight(d: INode) {
            const type =
                d.type === NodeDataType.Catalog
                    ? NodeType.Catalog
                    : NodeType.Task
            return getNodeWH(type).height
        },
        getWidth(d: INode) {
            const type =
                d.type === NodeDataType.Catalog
                    ? NodeType.Catalog
                    : NodeType.Task
            return getNodeWH(type).width
        },
        getHGap(d: INode) {
            return d.hasBro ? 80 : 66
        },
        getVGap() {
            return 39
        },
        getSide: () => {
            return 'left'
        },
    })
}

/**
 * 画布渲染
 */
export const renderGraph = (graph: Graph, data: any) => {
    // 清空画布
    graph.clearCells()
    const {
        tree, // 推导树结构 根目录为数据目录，由归集任务及融合信息树结构推导而来
        standardization, // 标准检测报告
        comprehension, // 数据理解报告
        quality, // 数据质量报告
    } = data

    const nodes: any[] = []
    const edges: any[] = []
    const labelNodes: any[] = []

    // 左侧树结构处理 根节点为目录节点
    const result: ILayoutResult = calcLayoutPosition(tree)

    // 根节点位置
    const OriginPos = {
        x: result.x + NodeConfig[NodeType.Catalog].width / 2,
        y: result.y + NodeConfig[NodeType.Catalog].height / 2,
    }
    const traverse = (layoutItem: ILayoutResult) => {
        if (layoutItem) {
            const { data: childItem, children } = layoutItem

            const parentNode = createNode(
                graph,
                childItem.type,
                {
                    x: layoutItem.x,
                    y: layoutItem.y,
                },
                childItem,
            )
            nodes.push(parentNode)
            childItem.id = parentNode.id

            // 判断是否添加tag节点
            if (childItem?.taskType) {
                const tagNode = createNode(
                    graph,
                    NodeDataType.Tag,
                    {
                        x: layoutItem.x - 6 - NodeConfig[NodeType.Tag].width,
                        y:
                            layoutItem.y +
                            (childItem.type === NodeDataType.Catalog ? 43 : 6),
                    },
                    {
                        ...childItem,
                        id: `${childItem.id}-tag`,
                    },
                )
                labelNodes.push(tagNode)
            }

            // 计算边
            children?.forEach((item: ILayoutResult) => {
                const edge = graph.createEdge({
                    id: `${item.id}::${parentNode.id}`,
                    shape: EdgeType,
                    source: {
                        cell: item.id,
                        port: `out`,
                    },
                    target: {
                        cell: parentNode.id,
                        port: `in`,
                    },
                    zIndex: -1,
                })
                edges.push(edge)
            })
            if (children?.length) {
                children.forEach((item) => traverse(item))
            }
        }
    }
    traverse(result)

    if (quality) {
        const pos = {
            x: OriginPos.x - NodeConfig[NodeType.Task].width / 2,
            y:
                OriginPos.y -
                LayoutConfig.verticalSpacing -
                NodeConfig[NodeType.Catalog].height / 2 -
                NodeConfig[NodeType.Task].height,
        }
        const qualityNode = createNode(
            graph,
            NodeDataType.Quality,
            pos,
            quality,
        )
        // 数据质量报告
        nodes.push(qualityNode)

        // 判断是否添加tag节点
        if (quality?.taskType) {
            const tagNode = createNode(
                graph,
                NodeDataType.Tag,
                {
                    x: pos.x + 31,
                    y: pos.y + NodeConfig[NodeType.Task].height + 30,
                },
                {
                    ...quality,
                    id: `quality-tag`,
                },
            )
            labelNodes.push(tagNode)
        }

        const qualityEdge = graph.createEdge({
            id: `${result.id}::${qualityNode.id}`,
            shape: EdgeType,
            source: {
                cell: result.id,
                port: `out-top`,
            },
            target: {
                cell: qualityNode.id,
                port: `in`,
            },
            zIndex: -1,
        })
        edges.push(qualityEdge)
    }

    if (standardization) {
        const pos = {
            x:
                OriginPos.x +
                LayoutConfig.horizontalSpacing +
                NodeConfig[NodeType.Catalog].width / 2,
            y: OriginPos.y - NodeConfig[NodeType.Task].height / 2,
        }
        const standardizationNode = createNode(
            graph,
            NodeDataType.Standardization,
            pos,
            standardization,
        )
        // 数据质量报告
        nodes.push(standardizationNode)
        // 判断是否添加tag节点
        if (standardization?.taskType) {
            const tagNode = createNode(
                graph,
                NodeDataType.Tag,
                {
                    x: pos.x - 6 - NodeConfig[NodeType.Tag].width,
                    y: pos.y + 6,
                },
                {
                    ...standardization,
                    id: `standardization-tag`,
                },
            )
            labelNodes.push(tagNode)
        }
        const standardizationEdge = graph.createEdge({
            id: `${result.id}::${standardizationNode.id}`,
            shape: EdgeType,
            source: {
                cell: result.id,
                port: `out-right`,
            },
            target: {
                cell: standardizationNode.id,
                port: `in`,
            },
            zIndex: -1,
        })
        edges.push(standardizationEdge)
    }

    if (comprehension) {
        const pos = {
            x: OriginPos.x - NodeConfig[NodeType.Task].width / 2,
            y:
                OriginPos.y +
                LayoutConfig.verticalSpacing +
                NodeConfig[NodeType.Catalog].height / 2,
        }
        const comprehensionNode = createNode(
            graph,
            NodeDataType.Comprehension,
            pos,
            comprehension,
        )

        nodes.push(comprehensionNode)

        // 判断是否添加tag节点
        if (comprehension?.taskType) {
            const tagNode = createNode(
                graph,
                NodeDataType.Tag,
                {
                    x: pos.x + 31,
                    y: pos.y - 30 - NodeConfig[NodeType.Task].height / 2,
                },
                {
                    ...comprehension,
                    id: `comprehension-tag`,
                },
            )
            labelNodes.push(tagNode)
        }

        const comprehensionEdge = graph.createEdge({
            id: `${result.id}::${comprehensionNode.id}`,
            shape: EdgeType,
            source: {
                cell: result.id,
                port: `out-bottom`,
            },
            target: {
                cell: comprehensionNode.id,
                port: `in`,
            },
            zIndex: -1,
        })
        edges.push(comprehensionEdge)
    }

    graph.resetCells([...nodes, ...edges])

    // 添加标签节点
    setTimeout(() => {
        labelNodes.forEach((item) => {
            graph.addNodes(labelNodes)
        })
    }, 180)
}
