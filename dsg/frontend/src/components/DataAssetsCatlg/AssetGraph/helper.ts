import { Graph } from '@antv/x6'
import Hierarchy from '@antv/hierarchy'
import { NodeTypes } from './const'

export const EdgeType = 'an-edge'
export enum NodeCompType {
    common_node = 'common',
    business_obj = 'business_obj',
    asset_node = 'asset_node',
    catalog = 'catalog',
}
// 默认主题
export const DEFAULT_THEME = '#D5D5D5'

const NodeLayout = {
    [NodeCompType.common_node]: {
        width: 180,
        height: 60,
    },
    [NodeCompType.business_obj]: {
        width: 300,
        height: 84,
    },
    [NodeCompType.asset_node]: {
        width: 400,
        height: 60,
    },
    [NodeCompType.catalog]: {
        width: 180,
        height: 84,
    },
}

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
                top: 28,
            },
        },
    },
    // connector: { name: 'rounded' },
    attrs: {
        wrap: {
            connection: true,
            strokeWidth: 4,
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

// 桩样式配置
const PortCircle = {
    r: 4,
    // magnet: true,
    strokeWidth: 1,
    fill: 'transparent',
    stroke: 'transparent',
}

// 桩分组
export enum PortGroupType {
    Out = 'out',
    In = 'in',
}

// 桩配置
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

export type INode = {
    id?: string
    name: string
    catlgName?: string
    type: string
    rescType?: string
    path_id?: string
    path_name?: string
    // 是否为当前资源node
    isCurDir?: boolean
    children?: INode[]
    parentId?: string
    owners?: Record<string, string>
}

interface ILayoutResult {
    id: string
    x: number
    y: number
    data: INode
    children?: ILayoutResult[]
}

/**
 * 布局算法【compactBox】计算节点定位数据
 * @param {INode} tree 节点树数据
 * @returns
 */
export const calcLayoutPosition = (tree: INode): ILayoutResult => {
    const rootId = tree?.id
    const isExistSubjectNode = tree.children?.find(
        (item) => item.type === NodeTypes.business_obj,
    )
    return Hierarchy.compactBox(tree, {
        direction: 'TB',
        getId(d: INode) {
            return d.id
        },
        getHeight(d: INode) {
            const nodeType =
                d.type === NodeTypes.data_asset
                    ? NodeCompType.asset_node
                    : d.type === NodeTypes.catalog
                    ? NodeCompType.catalog
                    : d.type === NodeTypes.business_obj
                    ? NodeCompType.business_obj
                    : NodeCompType.common_node
            return NodeLayout[nodeType].height // 固定高
        },
        getWidth(d: INode) {
            const nodeType =
                d.type === NodeTypes.data_asset
                    ? NodeCompType.asset_node
                    : d.type === NodeTypes.catalog
                    ? NodeCompType.catalog
                    : d.type === NodeTypes.business_obj ||
                      (d.type === NodeTypes.schema && isExistSubjectNode)
                    ? NodeCompType.business_obj
                    : NodeCompType.common_node
            return NodeLayout[nodeType].width // 固定高
        },
        getHGap(d: INode) {
            return 7
        },
        getVGap(d: INode) {
            return d?.id === rootId && d.children?.length !== 1 ? 36 : 14
        },
        getSide: () => {
            return 'bottom'
        },
    })
}

/**
 * 根据数据渲染画布
 * @param graph 画布
 * @param data 数据
 */
export const graphRenderByData = (graph: Graph, data: INode) => {
    if (!graph || !data?.id) return

    const result: ILayoutResult = calcLayoutPosition(data)

    const nodes: any[] = []
    const edges: any[] = []
    const traverse = (layoutItem: ILayoutResult) => {
        if (layoutItem) {
            const { data: childItem, children } = layoutItem

            const nodeType =
                childItem.type === NodeTypes.data_asset
                    ? NodeCompType.asset_node
                    : childItem.type === NodeTypes.business_obj
                    ? NodeCompType.business_obj
                    : NodeCompType.common_node
            nodes.push(
                graph.createNode({
                    id: childItem.id,
                    shape: nodeType,
                    // childItem.type === NodeTypes.schema
                    //     ? NodeCompType.common_node
                    //     : nodeType,
                    x: layoutItem.x,
                    y: layoutItem.y,
                    width: NodeLayout[nodeType].width,
                    height: NodeLayout[nodeType].height,
                    data: childItem,
                    ports: [
                        {
                            id: `${childItem.id}-in`,
                            group: PortGroupType.In,
                        },
                        {
                            id: `${childItem.id}-out`,
                            group: PortGroupType.Out,
                        },
                    ],
                }),
            )

            const current = nodes[nodes.length - 1]
            childItem.id = current.id
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
                    router:
                        childItem.id !== data.id || children?.length === 1
                            ? { name: 'normal' }
                            : undefined,
                    zIndex: -1,
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
