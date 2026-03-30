/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
import Hierarchy from '@antv/hierarchy'
import { Graph, Edge, Cell, Node } from '@antv/x6'
import classnames from 'classnames'
import { isArray } from 'lodash'
import { Architecture } from '@/components/BusinessArchitecture/const'
import {
    AppDataContentColored,
    BusinDomainColored,
    FontIcon,
    OrganizationColored,
} from '@/icons'
import { IconType } from '@/icons/const'
import MindMapData from './MindMapData'
import styles from './styles.module.less'
import __ from './locale'
import { messageError } from '@/core'

export enum BusinessView {
    // 组织架构
    Organization = 'organizationView',
    // 业务领域
    BusinDomain = 'businessDomainView',
}

export const businViewNodeId = {
    [BusinessView.Organization]: 'organizationId',
    [BusinessView.BusinDomain]: 'businessDomainId',
}

export const EdgeType = 'view-edge'
// export const NodeType = 'an-node'
export enum NodeType {
    // 视角节点
    ViewNode = 'viewNode',
    // 业务节点
    BusinNode = 'businNode',
}
// 默认主题
export const DEFAULT_THEME = '#D5D5D5'

// 边配置
export const EdgeConf = {
    inherit: 'edge',
    connector: {
        name: 'mindmap',
    },
    attrs: {
        line: {
            targetMarker: '',
            stroke: '#D7E3ED',
            strokeWidth: 2,
        },
    },
    zIndex: 0,
}

// 节点配置
export const NodeConf = {
    zIndex: 2,
    markup: [
        {
            tagName: 'g',
            selector: 'buttonGroup',
            children: [
                {
                    tagName: 'rect',
                    selector: 'button',
                    attrs: {
                        'pointer-events': 'visiblePainted',
                    },
                },
                {
                    tagName: 'path',
                    selector: 'buttonSign',
                    attrs: {
                        fill: 'none',
                        'pointer-events': 'none',
                    },
                },
            ],
        },
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
        body: {
            refWidth: '100%',
            refHeight: '100%',
            strokeWidth: 1,
            fill: '#EFF4FF',
            stroke: '#5F95FF',
        },
        label: {
            textWrap: {
                ellipsis: true,
                width: -10,
            },
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            refX: '50%',
            refY: '50%',
            fontSize: 12,
        },
        buttonGroup: {
            refX: '100%',
            refY: '50%',
        },
        button: {
            fill: '#5F95FF',
            stroke: 'none',
            x: -10,
            y: -10,
            height: 20,
            width: 30,
            rx: 10,
            ry: 10,
            cursor: 'pointer',
            event: 'node:collapse',
        },
        buttonSign: {
            refX: 5,
            refY: -5,
            stroke: '#FFFFFF',
            strokeWidth: 1.6,
        },
    },
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

// 画布初始默认配置
export const GraphConf = {
    background: {
        color: '#F6F9FB',
    },
    grid: {
        visible: true,
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
        // snap: true,
        // router: {
        //     name: 'er',
        //     args: {
        //         direction: 'H',
        //     },
        // },
    },
}

/**
 * 业务视角基础数据单元
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

export enum BusinNodeType {
    // 组织架构视角
    OrganizationView = BusinessView.Organization,
    // 业务领域视角
    BusinDomainView = BusinessView.BusinDomain,
    // 组织
    Organization = Architecture.ORGANIZATION,
    // 部门
    Department = Architecture.DEPARTMENT,
    // 主干业务
    Process = 'process',
    // 业务模型
    BusinessModel = 'business',
    // 信息资源目录
    InfoResourcesCatlg = 'infoResourcesCatlg',
    // 数据资源目录
    DataCatlg = 'dataCatlg',
    // 业务领域
    BusinDomain = 'domain',
}

export const NodeTypeText = {
    [BusinNodeType.OrganizationView]: __('按组织架构'),
    [BusinNodeType.BusinDomainView]: __('按业务领域'),
    [BusinNodeType.Organization]: __('组织'),
    [BusinNodeType.Department]: __('部门'),
    [BusinNodeType.Process]: __('主干业务'),
    [BusinNodeType.BusinessModel]: __('业务模型'),
    [BusinNodeType.InfoResourcesCatlg]: __('信息目录'),
    [BusinNodeType.DataCatlg]: __('数据目录'),
    [BusinNodeType.BusinDomain]: __('业务领域'),
}

const commonNodeStyleInfo = {
    width: 192,
    height: 64,
}

const viewNodeInfo = {
    width: 96,
    height: 80,
}

// 节点类型对应register节点的类型
export const businNodeTypeToNodeType = {
    [BusinNodeType.OrganizationView]: {
        nodeType: NodeType.ViewNode,
        nodeStyle: viewNodeInfo,
    },
    [BusinNodeType.BusinDomainView]: {
        nodeType: NodeType.ViewNode,
        nodeStyle: viewNodeInfo,
    },
    [BusinNodeType.Organization]: {
        nodeType: NodeType.BusinNode,
        nodeStyle: commonNodeStyleInfo,
    },
    [BusinNodeType.Department]: {
        nodeType: NodeType.BusinNode,
        nodeStyle: commonNodeStyleInfo,
    },
    [BusinNodeType.Process]: {
        nodeType: NodeType.BusinNode,
        nodeStyle: commonNodeStyleInfo,
    },
    [BusinNodeType.BusinessModel]: {
        nodeType: NodeType.BusinNode,
        nodeStyle: commonNodeStyleInfo,
    },
    [BusinNodeType.InfoResourcesCatlg]: {
        nodeType: NodeType.BusinNode,
        nodeStyle: commonNodeStyleInfo,
    },
    [BusinNodeType.DataCatlg]: {
        nodeType: NodeType.BusinNode,
        nodeStyle: commonNodeStyleInfo,
    },
    [BusinNodeType.BusinDomain]: {
        nodeType: NodeType.BusinNode,
        nodeStyle: commonNodeStyleInfo,
    },
}

export const BusinNodeIcon = ({
    type,
    className,
}: {
    type: BusinNodeType
    className?: string
}) => {
    let icon: any = null
    switch (type) {
        case BusinNodeType.OrganizationView:
            icon = (
                <OrganizationColored
                    className={classnames(styles.nodeIcon, className)}
                />
            )
            break
        case BusinNodeType.BusinDomainView:
            icon = (
                <BusinDomainColored
                    className={classnames(styles.nodeIcon, className)}
                />
            )
            break
        case BusinNodeType.Organization:
            icon = (
                <FontIcon
                    type={IconType.COLOREDICON}
                    name="icon-zuzhifenlei"
                    className={styles.nodeIcon}
                />
            )
            break
        case BusinNodeType.Department:
            icon = (
                <FontIcon
                    type={IconType.COLOREDICON}
                    name="icon-bumen"
                    className={styles.nodeIcon}
                />
            )
            break
        case BusinNodeType.Process:
            icon = (
                <FontIcon
                    type={IconType.COLOREDICON}
                    name="icon-zhuganyewuicon"
                    className={styles.nodeIcon}
                />
            )
            break
        case BusinNodeType.BusinessModel:
            icon = (
                <FontIcon
                    type={IconType.COLOREDICON}
                    name="icon-yewumoxing3"
                    className={styles.nodeIcon}
                />
            )
            break
        case BusinNodeType.InfoResourcesCatlg:
            icon = (
                <FontIcon
                    type={IconType.COLOREDICON}
                    name="icon-xinximulu1"
                    className={styles.nodeIcon}
                />
            )
            break
        case BusinNodeType.DataCatlg:
            icon = <AppDataContentColored className={styles.nodeIcon} />
            break
        case BusinNodeType.BusinDomain:
            icon = (
                <FontIcon
                    type={IconType.COLOREDICON}
                    name="icon-yewulingyu"
                    className={styles.nodeIcon}
                />
            )
            break
        default:
            break
    }

    return icon
}

interface IHierarchyResult {
    id: string
    x: number
    y: number
    data: MindMapData
    children?: IHierarchyResult[]
}

/**
 * 根据数据渲染画布
 * @param graph 画布
 * @param data 数据
 */
const graphRenderByData = (graph: Graph, data: any, reset: boolean = false) => {
    const result: IHierarchyResult = Hierarchy.mindmap(data, {
        direction: 'H',
        getHeight(d: any) {
            return d.height
        },
        getWidth(d: any) {
            return d.width
        },
        getHGap() {
            return 40
        },
        getVGap() {
            return 24
        },
        getSide: () => {
            return 'right'
        },
    })

    const nodes: Node[] = []
    const edges: Edge[] = []
    const traverse = (hierarchyItem: IHierarchyResult) => {
        if (hierarchyItem) {
            const { data: itemData, children } = hierarchyItem

            nodes.push(
                graph.createNode({
                    id: itemData.id,
                    shape:
                        businNodeTypeToNodeType[itemData.dataInfo?.type]
                            ?.nodeType || data.nodeType,
                    x: hierarchyItem.x,
                    y: hierarchyItem.y,
                    width: itemData.width,
                    height: itemData.height,
                    data: JSON.parse(JSON.stringify(itemData)),
                }),
            )
            const current = nodes[nodes.length - 1]
            itemData.id = current.id

            if (itemData.parentId) {
                edges.push(
                    graph.createEdge({
                        shape: EdgeType,
                        source: {
                            cell: itemData.parentId,
                            anchor: {
                                name: 'right',
                                args: {
                                    dx: '-15%',
                                },
                            },
                        },
                        target: {
                            cell: current.id,
                            anchor: {
                                name: 'left',
                                args: {
                                    dy: 'center',
                                },
                            },
                        },
                    }),
                )
            }

            if (children && !itemData.collapsed) {
                children.forEach((item: IHierarchyResult) => {
                    const { data: cData } = item
                    cData.parentId = current.id
                })
                children.forEach((item: IHierarchyResult) => traverse(item))
            }
        }
    }
    traverse(result)

    if (reset) {
        graph.removeCells(graph.getCells())
    }

    const oldNodes = graph.getNodes()
    if (oldNodes.length === 0) {
        graph.addCell(nodes)
    } else {
        oldNodes.forEach((node) => {
            const item = nodes.find((n) => n.id === node.id)
            if (item) {
                node.setData(item.getData(), { overwrite: true })
                node.position(item.position().x, item.position().y, {
                    deep: true,
                })
                node.size(item.size().width, item.size().height, {
                    deep: true,
                })
            }
        })
        if (nodes.length > oldNodes.length) {
            const items = nodes.reduce((res: Cell[], cur) => {
                const item = oldNodes.find((info) => info.id === cur.id)
                if (item) return res
                return res.concat([cur])
            }, [])
            graph.addCell(items)
        } else if (nodes.length < oldNodes.length) {
            const items = oldNodes.reduce((res: Cell[], cur) => {
                const item = nodes.find((info) => info.id === cur.id)
                if (item) return res
                return res.concat([cur])
            }, [])
            graph.removeCells(items)
        }
    }

    const oldEdges = graph.getEdges()
    graph.removeCells(oldEdges)
    graph.addCell(edges)
}

/**
 * 通过id查找数据对象
 * @param data 数据
 * @param id 节点id
 * @returns
 */
const findNodeById = (
    data: MindMapData,
    id?: string,
): MindMapData | undefined => {
    if (!id) return undefined
    const getData = (tree: MindMapData[]) => {
        // eslint-disable-next-line
        for (const node of tree) {
            if (node.id === id) return node
            if (node.children) {
                const res = getData(node.children)
                if (res) return res
            }
        }
        return undefined
    }
    return getData([data])
}

/**
 * 根据理解内容配置生成节点
 * @param data 数据
 * @param level 层级
 * @returns MindMapData[]
 */
const createNodeByDataInfo = (
    data: any[],
    // choices: any,
    // level: number,
    parentId?: string,
): MindMapData[] => {
    return data.map((d) => {
        const { path_id } = d
        // const ids = path_id.split('/')

        if (d.detail?.error) {
            messageError(d.detail?.error)
        }
        const temp = new MindMapData({
            ...commonNodeStyleInfo,
            type: d.type,
            nodeType: businNodeTypeToNodeType[d.dataInfo?.type],
            dataInfo: {
                ...d,
                parentId,
                // id: d.id,
                // name: d.name,
                // choices: choices?.[d.id],
            },
            children: d.children
                ? createNodeByDataInfo(d.children, d.id)
                : undefined,
        })
        return temp
    })
}

/**
 * 根据理解内容生成节点
 * @param mmData 父对象
 * @param data 理解内容数据
 * @param choices 理解内容数据配置
 * @returns
 */
const createDataNodeWithData = (
    mmData: MindMapData,
    data: any,
    // choices: any,
): MindMapData => {
    const temp = mmData
    if (data.detail?.content && data.detail?.content.length > 0) {
        temp.children = data.detail.content.map((c, idx) => {
            const content: any = c
            return new MindMapData({
                ...commonNodeStyleInfo,
                // nodeType: data.type,
                type: data.type,
                nodeType: NodeType.BusinNode,
                dataInfo: {
                    configId: data.id,
                    name: data.name,
                    ...data.detail,
                    // choices: choices?.[data.id],
                    content,
                    // ai_content:
                    //     data.detail?.ai_content?.[idx] &&
                    //     JSON.stringify(data.detail?.ai_content?.[idx]) !==
                    //         '[]' &&
                    //     JSON.stringify(data.detail?.ai_content?.[idx]) !== '{}'
                    //         ? data.detail?.ai_content?.[idx]
                    //         : undefined,
                    // content_errors:
                    //     viewMode === ViewMode.EDIT
                    //         ? data.detail?.content_errors?.[idx]
                    //         : undefined,
                },
            })
        })
    } else {
        temp.children = [
            new MindMapData({
                ...commonNodeStyleInfo,
                type: data.type,
                nodeType: NodeType.BusinNode,
                dataInfo: {
                    configId: data.id,
                    name: data.name,
                    ...data,
                    // choices: choices?.[data.id],
                    content: undefined,
                    ai_content: undefined,
                    content_errors: undefined,
                },
            }),
        ]
    }
    return temp
}

/**
 * 折叠节点
 * @param graph 画布
 * @param data 总数据
 * @param node 当前节点
 * @returns
 */
const graphNodeCollapse = (graph: Graph, data: MindMapData, node: Node) => {
    findNodeById(data, node.id)?.toggleCollapse()
    graphRenderByData(graph, data)
}

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
}

function flatten(
    items: TreeItems,
    parentId: string | null = null,
    depth = 0,
): FlattenedItem[] {
    return items.reduce<FlattenedItem[]>((acc, item) => {
        return [
            ...acc,
            { ...item, parentId, depth },
            ...flatten(item.children, item.id, depth + 1),
        ]
    }, [])
}

export function flattenTree(items: TreeItems): FlattenedItem[] {
    return flatten(items)
}

export function buildTree(items: any[]): TreeItems {
    const currentData = items
        .map((department) => ({
            ...department,
            path_id: department?.path_id?.split('/') || [department.id],
        }))
        .reduce((preData, department) => {
            if (preData?.[department.path_id.length]) {
                return {
                    ...preData,
                    [department.path_id.length]: [
                        ...preData[department.path_id.length],
                        department,
                    ],
                }
            }
            return {
                ...preData,
                [department.path_id.length]: [department],
            }
        }, {})
    return buildTreeLevel(currentData, 1, '')
}

function buildTreeLevel(items, level: number, fatherId) {
    if (fatherId) {
        const currentDepartments = items[level].filter((department) => {
            return department?.path_id?.includes(fatherId)
        })
        if (currentDepartments.length) {
            return currentDepartments.map((department) => ({
                ...department,
                children: items[level + 1]?.length
                    ? department.children?.length
                        ? department.children
                        : buildTreeLevel(
                              items,
                              Number(level) + 1,
                              department.id,
                          )
                    : [],
            }))
        }
        return []
    }
    return (
        items[level]?.map((department) => ({
            ...department,
            children: items[level + 1]?.length
                ? buildTreeLevel(items, Number(level) + 1, department.id)
                : [],
        })) || []
    )
}

export function findItem(items: TreeItem[], itemId: string) {
    return items.find(({ id }) => id === itemId)
}

export function findItemDeep(
    items: TreeItems,
    itemId: string,
): TreeItem | undefined {
    for (const item of items) {
        const { id, children } = item

        if (id === itemId) {
            return item
        }

        if (children.length) {
            const child = findItemDeep(children, itemId)

            if (child) {
                return child
            }
        }
    }

    return undefined
}

export function removeItem(items: TreeItems, id: string) {
    const newItems: any[] = []

    for (const item of items) {
        if (item.id === id) {
            continue
        }

        if (item.children.length) {
            item.children = removeItem(item.children, id)
        }

        newItems.push(item)
    }

    return newItems
}

export function setProperty<T extends keyof TreeItem>(
    items: TreeItems,
    id: string,
    property: T,
    setter: (value: TreeItem[T]) => TreeItem[T],
) {
    for (const item of items) {
        if (item.id === id) {
            item[property] = setter(item[property])
            continue
        }

        if (item.children.length) {
            item.children = setProperty(item.children, id, property, setter)
        }
    }

    return [...items]
}

export function removeChildrenOf(items: FlattenedItem[], ids: string[]) {
    const excludeParentIds = [...ids]

    return items.filter((item) => {
        if (item.parentId && excludeParentIds.includes(item.parentId)) {
            if (item.children.length) {
                excludeParentIds.push(item.id)
            }
            return false
        }

        return true
    })
}

export function collapsedAll(items: TreeItems, collapsed: boolean): TreeItems {
    return items.map((item) => {
        if (item.children.length > 0) {
            return {
                ...item,
                collapsed,
                children: collapsedAll(item.children, collapsed),
            }
        }
        return {
            ...item,
            collapsed,
        }
    })
}

export function searchChildOf(outItems: TreeItems, outName: string) {
    let hasResult: boolean = false
    function loopCheck(items: TreeItems, name: string) {
        return items.reduce((res: any[], item) => {
            if (item.children.length > 0) {
                const child = loopCheck(item.children, name)
                if (child.length > 0) {
                    setProperty(items, item.id, 'collapsed', (value) => {
                        return false
                    })
                    hasResult = true
                    return [...res, item]
                }
            }
            if (
                item.name.includes(name) ||
                item.name.match(
                    new RegExp(
                        name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                        'gi',
                    ),
                )
            ) {
                hasResult = true
                return [...res, item]
            }
            return [...res]
        }, [])
    }
    loopCheck(outItems, outName)
    return hasResult
}

export function findItemChild(items: TreeItems, id: string): string[] {
    const temp = findItemDeep(items, id)
    if (temp) {
        return flattenTree([temp]).map((item) => item.id)
    }
    return []
}

export {
    commonNodeStyleInfo,
    viewNodeInfo,
    graphRenderByData,
    findNodeById,
    createNodeByDataInfo,
    createDataNodeWithData,
    graphNodeCollapse,
}
