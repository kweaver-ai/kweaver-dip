import enUS from 'antd/lib/locale/en_US'
import zhCN from 'antd/lib/locale/zh_CN'
import zhTW from 'antd/lib/locale/zh_TW'
import { Cell, Edge, Graph, Node } from '@antv/x6'
import Hierarchy from '@antv/hierarchy'
import { v4 as uuidv4 } from 'uuid'

import MindMapData from './MindMapData'
import { getLanguage } from '@/utils'
import { NodeType } from './const'

const getAntdLocal = () => {
    const language: string = getLanguage() || 'zh-cn'
    switch (language) {
        case 'zh-cn':
            return zhCN

        case 'zh-tw':
            return zhTW

        default:
            return enUS
    }
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
                    shape: itemData.nodeType,
                    x: hierarchyItem.x,
                    y: hierarchyItem.y,
                    width: itemData.width,
                    height: itemData.height,
                    data: JSON.parse(JSON.stringify(itemData)),
                }),
            )
            const current = nodes[nodes.length - 1]
            itemData.id = current.id

            const argsLeft =
                itemData.nodeType === NodeType.ReferenceNode
                    ? {
                          dx: '90',
                          dy: '-30',
                      }
                    : {}

            if (itemData.parentId) {
                edges.push(
                    graph.createEdge({
                        shape: 'mindmap-edge',
                        source: {
                            cell: itemData.parentId,
                            anchor: {
                                name: 'right',
                                args: {
                                    dx: [
                                        NodeType.LogicEntity,
                                        NodeType.ReferenceNode,
                                    ].includes(itemData.nodeType)
                                        ? '-6'
                                        : '6',
                                    dy: '0',
                                },
                            },
                        },
                        target: {
                            cell: current.id,
                            anchor: {
                                name: 'left',
                                args: {},
                            },
                        },
                        attrs: {
                            line: {
                                stroke: '#E0E6E9',
                                strokeWidth: 2,
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

/**
 * 添加节点
 * @param graph 画布
 * @param data 总数据
 * @param nodeId 当前节点
 * @returns
 */
const graphAddNode = (
    graph: Graph,
    data: MindMapData,
    nodeId: string,
    newChildren?: MindMapData[],
) => {
    const cur = findNodeById(data, nodeId)
    if (!cur) return
    if (cur.collapsed) {
        cur.toggleCollapse()
    }
    if (newChildren) {
        cur.children = [...newChildren, ...(cur.children || [])]
    } else {
        const id = uuidv4()
        cur.children!.push(
            cur.nodeType === NodeType.Activity
                ? new MindMapData({
                      id,
                      nodeType: NodeType.LogicEntity,
                      dataInfo: {
                          name: '',
                          id,
                      },
                      children: [],
                      width: 220,
                      height: 60,
                      parentId: nodeId,
                  })
                : new MindMapData({
                      id,
                      nodeType: NodeType.Attribute,
                      dataInfo: {
                          name: '',
                          id,
                      },
                      children: [],
                      width: 220,
                      height: 60,
                      parentId: nodeId,
                  }),
        )
    }

    graphRenderByData(graph, data)
}

/**
 * 删除节点
 * @param graph 画布
 * @param data 总数据
 * @param nodeId 当前节点ID
 * @param onSave 保存状态
 * @returns
 */
const graphDeleteNode = (graph: Graph, data: MindMapData, nodeId: string) => {
    const cur = findNodeById(data, nodeId)
    if (!cur) return
    const parentNode = findNodeById(data, cur.parentId)
    if (parentNode?.children) {
        parentNode!.children = parentNode?.children?.filter(
            (c) => c.id !== nodeId,
        )
    }
    graphRenderByData(graph, data)
}

/**
 * 更新节点的数据
 * @param data 数据
 * @param node 要更新的节点
 */
const updataNodeData = (data: MindMapData, node: Node) => {
    const cur = findNodeById(data, node.id)
    node.setData(JSON.parse(JSON.stringify(cur)))
}

export {
    getAntdLocal,
    graphRenderByData,
    graphAddNode,
    graphNodeCollapse,
    findNodeById,
    graphDeleteNode,
    updataNodeData,
}
