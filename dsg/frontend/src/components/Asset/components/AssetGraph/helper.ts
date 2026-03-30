import { Graph, Path } from '@antv/x6'
import Hierarchy from '@antv/hierarchy'
import { LabelType } from '../Labels'

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

/**
 * 资产节点类型
 */
export enum AssetNodeType {
    ROOT = 'root', // 根节点-资产架构
    SUBJECTGROUP = 'subject_domain_group', // 主题域分组
    SUBJECTGDOMAIN = 'subject_domain', // 主题域
    BUSINESSOBJ = 'business_object', // 业务对象
    BUSINESSACT = 'business_activity', // 业务活动
}

/**
 * 资产节点颜色
 */
export const AssetTypeColor = {
    [AssetNodeType.ROOT]: '#3E75FF',
    [AssetNodeType.SUBJECTGROUP]: '#9E7ABB',
    [AssetNodeType.SUBJECTGDOMAIN]: '#DF9C19',
    [AssetNodeType.BUSINESSOBJ]: '#6EC472',
}

/**
 * 组织架构基础数据单元
 */
export type INode = {
    id: string
    name: string
    description: string
    type: string
    path_id: string
    path_name: string
    created_by: string
    created_at: number
    updated_by: string
    updated_at: number
    child_count: number
    children: INode[]
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

const NodeLayout = {
    width: 217,
    height: 60,
}

/**
 * 布局算法【compactBox】计算节点定位数据
 * @param {INode} tree 节点树数据
 * @returns
 */
export const calcLayoutPosition = (tree: INode): ILayoutResult => {
    const rootId = tree?.id
    return Hierarchy.compactBox(tree, {
        direction: 'TB',
        getId(d: INode) {
            return d.id
        },
        getHeight() {
            return NodeLayout.height // 固定高
        },
        getWidth() {
            return NodeLayout.width // 固定宽
        },
        getHGap(d: INode) {
            return 14
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
export const graphRenderByData = (
    graph: Graph,
    data: INode,
    isSnapshot = false,
) => {
    if (!graph || !data?.id) return
    const result: ILayoutResult = calcLayoutPosition(data)
    const nodes: any[] = []
    const edges: any[] = []

    const traverse = (layoutItem: ILayoutResult) => {
        if (layoutItem) {
            const { data: childItem, children } = layoutItem

            nodes.push(
                graph.createNode({
                    id: childItem.id,
                    shape: NodeType,
                    x: layoutItem.x,
                    y: layoutItem.y,
                    width: NodeLayout.width,
                    height: NodeLayout.height,
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
                if (!isSnapshot) {
                    children.forEach((item) => {
                        const { data: curData } = item
                        curData.parentId = current.id
                    })
                }
                children.forEach((item) => traverse(item))
            }
        }
    }
    traverse(result)

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
 * 数据转换
 * @param list 数据列表
 * @param firstLevel 一级type
 * @param secondLevel 二级type
 * @returns
 */
export const transformData = (
    list: INode[],
    firstLevel: string,
    secondLevel: string,
) => {
    const levelOne: INode[] = []
    const levelElse: INode[] = []

    list?.forEach((item) => {
        if (item?.type === firstLevel) {
            levelOne.push(item)
        } else if (item?.type === secondLevel) {
            levelElse.push(item)
        }
    })
    return levelOne.map((item) => {
        const childs = levelElse.filter((o) =>
            (o.path_id || '').endsWith(`${item.id}/${o.id}`),
        )
        return { ...item, children: convertListToLink(childs) }
    })
}

export const calcDataTypes = (list?: any[], rootType?: LabelType) => {
    const types = new Set()

    if (rootType) {
        types.add(rootType)
    }

    list?.forEach((item) => {
        const type = item?.type
        if (type === 'subject_domain_group') {
            types.add('L1')
        } else if (type === 'subject_domain') {
            types.add('L2')
        } else if (type === 'business_object') {
            if (item?.second_child_count || item?.child_count) {
                types.add('L3Attr')
            } else {
                types.add('L3')
            }
        }
    })

    return Array.from(types) as LabelType[]
}
