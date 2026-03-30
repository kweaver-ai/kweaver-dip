import { Children, FC, useEffect, useMemo, useRef, useState } from 'react'
import { Graph as GraphType, Node, Shape } from '@antv/x6'
import { useGetState, useUnmount } from 'ahooks'
import { noop } from 'lodash'
import { X6PortalProvider } from '@/core/graph/helper'
import styles from './styles.module.less'
import FloatBar from './FloatBar'
import { GraphContext } from './contextProvider'
import { instancingGraph } from '@/core/graph/graph-config'
import {
    DataNodeTemplate,
    getPortByNode,
    getPortYSite,
    groupByLevel,
    IndicatorNodeTemplate,
    sortAllData,
    wheelDebounce,
} from './helper'
import { NodeDataType } from '@/core/consanguinity/index.d'
import dataFormNode from './DataFormNode'
import {
    calculateAtomicNodeHeight,
    calculateFormNodeHeight,
    DATA_TABLE_LINE_HEIGHT,
    ExpandStatus,
    FORM_NODE_HEADER_HEIGHT,
    getChildrenData,
    getCurrentData,
    getDataCurrentPageIndex,
    LineLightStyle,
    LineNormalStyle,
    LOGIC_LINE_HEIGHT,
    NODE_SPACE,
    NODE_WIDTH,
    NORMAL_COLOR,
    OFFSET_HEIGHT,
    PortSite,
    SELECT_COLOR,
    TABLE_LIMIT,
} from './const'
import { NodeType } from '@/core/consanguinity'
import PortAndEdgeStruct, { EdgeDataType } from './portAndEdgeStruct'
import { PriorityDom } from '../TaskCenterGraph/helper'
import { loadPlugins, Plugins } from '@/core/graph/plugin'
import indicatorNode from './IndicatorNode'

/**
 * 血缘图谱
 */
interface GraphContentProps {
    graphData: Array<NodeDataType>
    // 主表id
    IngressId: string

    // 加载数据
    onLoadData?: (id: string) => Promise<Array<NodeDataType>>

    expandDirection?: string
}

/**
 * 血缘图谱
 * @param props
 * @returns
 */
const GraphContent: FC<GraphContentProps> = ({
    graphData,
    IngressId,
    onLoadData = () => Promise.resolve([]),
    expandDirection = 'parent',
}) => {
    // 图谱实例
    const graphCase = useRef<GraphType>()
    // 图谱容器
    const graphBody = useRef<HTMLDivElement>(null)
    // 画布容器
    const container = useRef<HTMLDivElement>(null)
    // 图谱缩放大小
    const [graphSize, setGraphSize] = useState(100)

    // 已加载的表
    const [loadedForm, setLoadedForm] = useState<Array<string>>([])

    // 展开的节点
    const [expandNode, setExpandNode] = useState<Array<string>>([])

    // 分组数据
    const [groupData, setGroupData] = useState<Array<Array<any>>>([])

    // 选中的字段
    const [selectedFields, setSelectedFields] = useState<
        Array<{
            table_id: string
            field_id: string
        }>
    >([])

    // 注册目标表节点
    useUnmount(() => {
        if (graphCase && graphCase.current) {
            graphCase.current.dispose()
        }
    })

    // 桩和边数据结构
    const portAndEdgeStruct = useMemo(() => {
        return new PortAndEdgeStruct()
    }, [IngressId])

    // 注册数据表节点
    const dataFormNodeName = useMemo(() => dataFormNode(), [])

    const indicatorNodeName = useMemo(() => indicatorNode(), [])

    // 初始化图谱
    useEffect(() => {
        const graph = instancingGraph(container.current, {
            interacting: true,
            embedding: false,
            panning: {
                enabled: true,
            },
            mousewheel: {
                enabled: true,
                modifiers: ['ctrl', 'meta'],
                guard(this: any, e: WheelEvent) {
                    const wheelEvent = this

                    if (graph) {
                        wheelDebounce(graph, wheelEvent, setGraphSize)
                        return true
                    }
                    return false
                },
            },
            connecting: {
                allowBlank: false,
                allowLoop: false,
                allowNode: false,
                allowEdge: false,
                highlight: true,
                connectionPoint: 'anchor',
                connector: {
                    name: 'smooth',
                    args: {
                        direction: 'H',
                    },
                },
                targetAnchor: {
                    name: 'right',
                    args: {},
                },
                snap: true,
                router: {
                    name: 'normal',
                },
                createEdge() {
                    return new Shape.Edge({
                        attrs: {
                            line: LineNormalStyle,
                        },
                        zIndex: -1,
                    })
                },
            },
        })
        if (graph) {
            loadPlugins(graph, [
                Plugins.History,
                Plugins.Keyboard,
                Plugins.Clipboard,
                Plugins.Export,
            ])
            graphCase.current = graph
        }
    }, [])

    useEffect(() => {
        if (graphData.length > 0 && IngressId && expandDirection) {
            allDataLoad()
        }
    }, [graphData, IngressId, expandDirection])

    /**
     * 加载所有数据
     */
    const allDataLoad = () => {
        if (graphCase.current) {
            const newData = groupByLevel(
                sortAllData(
                    graphData,
                    IngressId,
                    0,
                    expandDirection === 'parent' ? 'left' : 'right',
                ),
                expandDirection === 'parent' ? 'left' : 'right',
            )
            setGroupData(newData)
            const expandNodeIds = graphData.map((item) => item.id)
            newData.forEach((item) => {
                addNodesFromGroupData(item)
            })
            const allExpandedNode = graphData
                .filter((item) =>
                    expandDirection === 'parent'
                        ? item?.parentNodeId?.length &&
                          checkParentNodeHasLoad(
                              item.parentNodeId,
                              expandNodeIds,
                          )
                        : item?.childrenNodeId?.length &&
                          checkChildNodeHasLoad(
                              item.childrenNodeId,
                              expandNodeIds,
                          ),
                )
                .map((item) => item.id)
            setExpandNode(allExpandedNode)
            setLoadedForm(expandNodeIds)
            loadAllNodeRelation(IngressId, allExpandedNode)
            setTimeout(() => {
                movedToCenter()
            }, 100)
        }
    }

    /**
     * 从分组数据中添加节点
     * @param data 分组数据
     */
    const addNodesFromGroupData = (data: Array<any>) => {
        // let defaultHeight = 0

        data.forEach((item, index) => {
            const CurrentTemplate =
                item.type === NodeType.INDICATOR
                    ? IndicatorNodeTemplate
                    : DataNodeTemplate
            graphCase.current?.addNode({
                ...CurrentTemplate,
                position: {
                    x:
                        CurrentTemplate.position.x +
                        item.level * (NODE_WIDTH + NODE_SPACE),
                    y: 0,
                },
                data: {
                    ...CurrentTemplate.data,
                    ...item,
                    index,
                },
            })
        })
        currentLevelSort(data[0].level, {
            x:
                DataNodeTemplate.position.x -
                data[0].level * (NODE_WIDTH + NODE_SPACE),
            y: 0,
        })
    }

    /**
     * 父节点重新排序
     * @param level
     * @param position
     */
    const currentLevelSort = (level, position) => {
        if (graphCase && graphCase.current) {
            const allNodes = graphCase.current.getNodes()
            const currentLevelNode = allNodes
                .filter((currentNode) => {
                    const { x, y } = currentNode.position()
                    return currentNode.data.level === level
                })
                .sort((currentNode1, currentNode2) => {
                    return currentNode1.data.index - currentNode2.data.index
                })
            const lastLevel =
                expandDirection === 'parent' ? level + 1 : level - 1
            const currentFirstLevelNode = allNodes.find(
                (currentNode) =>
                    currentNode.data.index === 0 &&
                    currentNode.data.level === lastLevel,
            )

            if (currentLevelNode.length && currentFirstLevelNode) {
                let initY = getInitYData(
                    currentLevelNode,
                    currentFirstLevelNode,
                )

                currentLevelNode.forEach((currentNode, index) => {
                    const height = getNodeHeight(currentNode) || 0
                    const currentPosition = currentNode.position()
                    currentNode.position(currentPosition.x, initY + index * 42)
                    initY += height
                })
            }
        }
    }

    /**
     * 获取节点高度
     * @param node 节点
     * @returns 节点高度
     */
    const getNodeHeight = (node: Node) => {
        if (node?.data?.type) {
            switch (node.data.type) {
                case NodeType.DATA_TABLE:
                case NodeType.CUSTOM_VIEW:
                case NodeType.LOGIC_VIEW:
                case NodeType.FORM_VIEW:
                    return calculateFormNodeHeight(
                        node.data.fields.length,
                        0,
                        node.data.type === NodeType.DATA_TABLE
                            ? DATA_TABLE_LINE_HEIGHT
                            : LOGIC_LINE_HEIGHT,
                    )
                case NodeType.INDICATOR:
                    return calculateAtomicNodeHeight(120)
                default:
                    return 0
            }
        }
        return 0
    }
    /**
     * 获取初始化位置
     * @param currentLevelNode
     * @param firstFatherNode
     * @returns
     */
    const getInitYData = (
        currentLevelNode: Array<Node>,
        firstFatherNode: Node,
    ) => {
        let allHeight = (currentLevelNode.length - 1) * 20
        currentLevelNode.forEach((currentNode) => {
            const height = getNodeHeight(currentNode) || 0
            allHeight += height
        })
        const { x, y } = firstFatherNode.position()
        const fatherHeight = getNodeHeight(firstFatherNode) || 0

        if (!allHeight || allHeight - fatherHeight <= 0) {
            return y
        }
        return y - (allHeight - fatherHeight) / 2
    }

    /**
     * 检查父节点是否已加载
     * @param parentNodeIds 父节点id
     * @param loadedTableIds 已加载的表id
     * @returns 是否已加载
     */
    const checkParentNodeHasLoad = (
        parentNodeIds: Array<string>,
        loadedTableIds: Array<string>,
    ): boolean => {
        let isHasLoad = true
        parentNodeIds.forEach((item) => {
            if (!loadedTableIds.includes(item)) {
                isHasLoad = false
            }
        })
        return isHasLoad
    }

    const checkChildNodeHasLoad = (
        childNodeIds: Array<string>,
        loadedTableIds: Array<string>,
    ): boolean => {
        let isHasLoad = true
        childNodeIds.forEach((item) => {
            if (!loadedTableIds.includes(item)) {
                isHasLoad = false
            }
        })
        return isHasLoad
    }
    /**
     * 加载所有节点关系
     * @param ingressId 主表id
     */
    const loadAllNodeRelation = (
        ingressId: string,
        expandedNode: Array<string>,
    ) => {
        const allNode = graphCase.current?.getNodes()
        if (allNode?.length) {
            const currentNode = allNode?.find(
                (item) => item.data.id === ingressId,
            )
            if (currentNode && expandedNode.includes(ingressId)) {
                loadNodeRelation(currentNode, allNode)
            }
        }
    }

    /**
     * 加载节点关系
     * @param currentNode 当前节点
     * @param allNode 所有节点
     */
    const loadNodeRelation = (currentNode: Node, allNode: Array<Node>) => {
        if (expandDirection === 'parent') {
            loadParentNodeRelation(currentNode, allNode)
        } else {
            loadChildNodeRelation(currentNode, allNode)
        }
    }

    /**
     * 加载父节点关系
     * @param currentNode 当前节点
     * @param allNode 所有节点
     */
    const loadParentNodeRelation = (
        currentNode: Node,
        allNode: Array<Node>,
    ) => {
        const parentId = currentNode.data.parentNodeId
        if (parentId.length) {
            parentId.forEach((item) => {
                const parentNode = allNode?.find((it) => it.data.id === item)
                if (parentNode) {
                    addRelation(parentNode, currentNode)
                    loadParentNodeRelation(parentNode, allNode)
                }
            })
        }
    }

    /**
     * 加载子节点关系
     * @param currentNode 当前节点
     * @param allNode 所有节点
     */
    const loadChildNodeRelation = (currentNode: Node, allNode: Array<Node>) => {
        const childIds = currentNode.data.childrenNodeId
        if (childIds.length) {
            childIds.forEach((item) => {
                const childNode = allNode?.find((it) => it.data.id === item)
                if (childNode) {
                    addRelation(currentNode, childNode)
                    loadChildNodeRelation(childNode, allNode)
                }
            })
        }
    }

    /**
     * 添加节点关系
     * @param parentNode 父节点
     * @param currentNode 当前节点
     */
    const addRelation = (parentNode: Node, currentNode: Node) => {
        if (expandDirection === 'parent') {
            parentFieldRelation(parentNode, currentNode)
        } else {
            childFieldRelation(currentNode, parentNode)
        }
    }

    /**
     * 子节点关系
     * @param childNode 子节点
     * @param currentNode 当前节点
     */
    const childFieldRelation = (childNode: Node, currentNode: Node) => {
        const fields = currentNode?.data?.fields
        const childDataId = childNode?.data?.id
        if (childNode?.data?.type === NodeType.INDICATOR && childDataId) {
            const childId = getHeaderPort(childNode, 'left')
            const currentId = getHeaderPort(currentNode, 'right')
            addEdge(currentId, childId, currentNode, childNode, {
                targetPortId: childId,
                sourcePortId: currentId,
                targetNodeId: childNode.id,
                sourceNodeId: currentNode.id,
            })
        } else if (fields?.length && childDataId) {
            fields
                .filter((item) =>
                    item?.childrenField
                        ?.map((it) => it.tableId)
                        .includes(childDataId),
                )
                .forEach((field) => {
                    const selected = currentNode.data.selectedFields.includes(
                        field.id,
                    )

                    const currentFieldPortId = getCurrentFieldPortId(
                        field.id,
                        currentNode,
                        'right',
                        false,
                    )
                    field.childrenField
                        .filter((it) => it.tableId === childNode.data.id)
                        .forEach((it) => {
                            const childField = childNode.data.fields.find(
                                (item) => item.id === it.id,
                            )
                            const childrenFieldPortId = getCurrentFieldPortId(
                                it.id,
                                childNode,
                                'left',
                                !!childField?.tool?.left?.label,
                            )
                            addEdge(
                                currentFieldPortId,
                                childrenFieldPortId,
                                currentNode,
                                childNode,
                                {
                                    targetPortId: childrenFieldPortId,
                                    sourcePortId: currentFieldPortId,
                                    targetNodeId: childNode.id,
                                    sourceNodeId: currentNode.id,
                                    targetDataId: it.id,
                                    sourceDataId: field.id,
                                },
                                selected,
                            )
                        })
                })
        }
    }

    /**
     * 父节点关系
     * @param parentNode 父节点
     * @param currentNode 当前节点
     */
    const parentFieldRelation = (parentNode: Node, currentNode: Node) => {
        const fields = currentNode?.data?.fields
        const parentDataId = parentNode?.data?.id

        if (fields?.length && parentDataId) {
            fields
                .filter((item) =>
                    item.parentField
                        .map((it) => it.tableId)
                        .includes(parentDataId),
                )
                .forEach((field) => {
                    const selected = currentNode.data.selectedFields.includes(
                        field.id,
                    )
                    const currentFieldPortId = getCurrentFieldPortId(
                        field.id,
                        currentNode,
                        'left',
                        !!field.tool?.left?.label,
                    )
                    field.parentField
                        .filter((it) => it.tableId === parentNode.data.id)
                        .forEach((it) => {
                            const parentFieldPortId = getCurrentFieldPortId(
                                it.id,
                                parentNode,
                                'right',
                                false,
                            )
                            addEdge(
                                parentFieldPortId,
                                currentFieldPortId,
                                parentNode,
                                currentNode,
                                {
                                    targetPortId: currentFieldPortId,
                                    sourcePortId: parentFieldPortId,
                                    targetNodeId: currentNode.id,
                                    sourceNodeId: parentNode.id,
                                    targetDataId: field.id,
                                    sourceDataId: it.id,
                                },
                                selected,
                            )
                        })
                })
        }
    }

    /**
     * 获取头节点桩
     * @param node 节点
     * @param direction 方向
     * @returns 头节点桩id
     */
    const getHeaderPort = (node: Node, direction: 'left' | 'right') => {
        let headerPortId = portAndEdgeStruct.getPortIdBySite(
            PortSite.HEADER,
            direction,
            node.id,
        )

        if (!headerPortId) {
            headerPortId = addHeaderPort(node, direction)
        }
        return headerPortId
    }

    /**
     * 获取当前字段桩id
     * @param fieldId 字段id
     * @param node 节点
     * @returns 当前字段桩id
     */
    const getCurrentFieldPortId = (fieldId, node, direction, hasLeftTool) => {
        const currentPageIndex = getDataCurrentPageIndex(
            fieldId,
            TABLE_LIMIT,
            node.data.offset,
            node.data.fields,
        )
        const currentNodePortId = getPortId(
            node,
            currentPageIndex,
            node.data.expand,
            direction,
            fieldId,
            hasLeftTool,
        )
        return currentNodePortId
    }

    /**
     * 获取桩id
     * @param node 节点
     * @param index 索引
     * @param expand 是否展开
     * @param direction 方向
     * @param fieldId 字段id
     * @returns 桩id
     */
    const getPortId = (
        node: Node,
        index: number,
        expand: ExpandStatus,
        direction: 'left' | 'right',
        fieldId: string,
        hasLeftTool: boolean,
    ): string => {
        const portId = portAndEdgeStruct.getPortIdByDataId(fieldId, direction)

        if (portId) return portId
        if (index === -1 || expand === ExpandStatus.FOLD) {
            let headerPortId = portAndEdgeStruct.getPortIdBySite(
                PortSite.HEADER,
                direction,
                node.id,
            )

            if (!headerPortId) {
                headerPortId = addHeaderPort(node, direction)
            }

            portAndEdgeStruct.updatePortInfo(
                {
                    nodeId: node.id,
                    dataIds: [fieldId],
                    direction,
                    portId: headerPortId,
                    site: PortSite.HEADER,
                },
                fieldId,
                headerPortId,
            )
            if (headerPortId) return headerPortId
        }

        if (index === -2) {
            let bottomPortId = portAndEdgeStruct.getPortIdBySite(
                PortSite.BOTTOM,
                direction,
                node.id,
            )

            if (!bottomPortId) {
                bottomPortId = addBottomPort(node, direction)
            }
            portAndEdgeStruct.updatePortInfo(
                {
                    nodeId: node.id,
                    dataIds: [fieldId],
                    direction,
                    portId: bottomPortId,
                    site: PortSite.BOTTOM,
                },
                fieldId,
                bottomPortId,
            )
            if (bottomPortId) return bottomPortId
        }
        const portXSite =
            direction === 'left' ? (hasLeftTool ? -20 : 0) : NODE_WIDTH
        const portYSite = getPortYSite(
            index,
            node?.data?.type === NodeType.DATA_TABLE
                ? DATA_TABLE_LINE_HEIGHT
                : LOGIC_LINE_HEIGHT,
            direction,
        )
        node.addPort(
            getPortByNode(direction === 'left' ? 'leftPorts' : 'rightPorts', {
                x: portXSite,
                y: portYSite,
            }),
        )

        const port = node.getPorts().pop()
        if (port?.id) {
            portAndEdgeStruct.updatePortInfo(
                {
                    nodeId: node.id,
                    dataIds: [fieldId],
                    direction,
                    portId: port.id,
                    site: PortSite.PAGE,
                },
                fieldId,
                port.id,
            )
        }
        return port?.id || ''
    }

    /**
     * 添加头节点桩
     * @param node 节点
     * @param direction 方向
     * @returns 桩id
     */
    const addHeaderPort = (node, direction: 'left' | 'right') => {
        const leftPortSite = expandDirection === 'parent' ? -12 : 0
        // TODO 后续需要做右侧展开
        const rightPortSite =
            expandDirection === 'parent' ? NODE_WIDTH : NODE_WIDTH

        const portXSite = direction === 'left' ? leftPortSite : rightPortSite
        const portYSite = FORM_NODE_HEADER_HEIGHT / 2
        node.addPort(
            getPortByNode(direction === 'left' ? 'leftPorts' : 'rightPorts', {
                x: portXSite,
                y: portYSite,
            }),
        )
        const port = node.getPorts().pop()
        return port?.id || ''
    }

    /**
     * 添加头节点桩
     * @param node 节点
     * @param direction 方向
     * @returns 桩id
     */
    const addBottomPort = (node, direction: 'left' | 'right') => {
        const portXSite = direction === 'left' ? 0 : NODE_WIDTH
        const portYSite =
            FORM_NODE_HEADER_HEIGHT +
            (node?.data?.type === NodeType.DATA_TABLE
                ? DATA_TABLE_LINE_HEIGHT
                : LOGIC_LINE_HEIGHT) *
                TABLE_LIMIT +
            OFFSET_HEIGHT / 2

        node.addPort(
            getPortByNode(direction === 'left' ? 'leftPorts' : 'rightPorts', {
                x: portXSite,
                y: portYSite,
            }),
        )
        const port = node.getPorts().pop()
        return port?.id || ''
    }
    /**
     * 缩放画布
     * @param multiple  缩放大小
     */
    const changeGraphSize = (multiple: number) => {
        setGraphSize(multiple * 100)
        graphCase.current?.zoomTo(multiple)
    }

    /**
     * 展示所有画布内容
     */
    const showAllGraphSize = () => {
        if (graphCase.current) {
            graphCase.current?.zoomToFit({ padding: 70 })
            const multiple = graphCase.current.zoom()
            if (multiple > 1) {
                graphCase.current.zoomTo(1)
                setGraphSize(100)
                return 100
            }
            const showSize = Math.round(multiple * 100)
            setGraphSize(showSize - (showSize % 5))
            return multiple
        }
        return 100
    }

    /**
     * 画布定位到中心
     */
    const movedToCenter = () => {
        graphCase.current?.centerContent()
    }

    /**
     * 更新已加载的表
     * @param formId 表id
     */
    const updateLoadedForm = (formId: string) => {
        setLoadedForm((prev) => [...prev, formId])
    }

    /**
     * 更新展开的节点
     * @param nodeId 节点id
     */
    const updateExpandNode = async (
        nodeId: string,
        operation: 'add' | 'remove' = 'add',
    ) => {
        if (operation === 'add') {
            setExpandNode((prev) => [...prev, nodeId])
            const currentData = getCurrentData(groupData, nodeId)
            if (checkParentNodeHasLoad(currentData.parentNodeId, loadedForm)) {
                currentData.parentNodeId.forEach((item) => {
                    addParentNode(nodeId, item, groupData)
                })
            } else {
                const loadedData = await onLoadData(currentData.id)
                const newLoadedData = (loadedData || [])?.filter(
                    (item) => !loadedForm.includes(item.id),
                )
                if (newLoadedData?.length) {
                    const newGroupData = [...groupData]
                    newLoadedData.forEach((item) => {
                        newGroupData[currentData.level + 1].push(item)
                    })
                    currentData.parentNodeId.forEach((item) => {
                        addParentNode(nodeId, item, newGroupData)
                    })
                    setGroupData(newGroupData)
                    setLoadedForm([
                        ...loadedForm,
                        ...newLoadedData.map((item) => item.id),
                    ])
                } else {
                    currentData.parentNodeId.forEach((item) => {
                        addParentNode(nodeId, item, groupData)
                    })
                }
            }

            loadAllNodeRelation(currentData.id, [...expandNode, nodeId])
        } else {
            setExpandNode((prev) => prev.filter((item) => item !== nodeId))
            const currentData = getCurrentData(groupData, nodeId)
            currentData.parentNodeId.forEach((item) => {
                removeParentNode(currentData.id, item)
            })
        }
    }

    /**
     * 添加父节点
     * @param nodeId 节点id
     * @param parentNodeId 父节点id
     */
    const addParentNode = (
        nodeId: string,
        parentNodeId: string,
        loadedGroupData: Array<Array<any>>,
    ) => {
        const currentData = getCurrentData(loadedGroupData, parentNodeId)

        if (currentData) {
            const currentGroupData = loadedGroupData.find((item) =>
                item?.find((it) => it.level === currentData.level),
            )
            if (currentGroupData) {
                addNodeFromGroupData(currentGroupData, parentNodeId)
                if (
                    expandNode.includes(parentNodeId) &&
                    currentData?.parentNodeId?.length
                ) {
                    currentData.parentNodeId.forEach((item) => {
                        addParentNode(currentData.id, item, loadedGroupData)
                    })
                }
            }
        }
    }

    /**
     * 添加节点
     * @param parentNodeId 父节点id
     * @param dataId 节点数据id
     */
    const addNode = (nodeData, height) => {
        // 获取上次加载节点的状态
        const currentNodeLastConfig = portAndEdgeStruct.getRemoveNodeByDataId(
            nodeData.id,
        )
        // 节点位置
        const position = currentNodeLastConfig?.position || {
            x: DataNodeTemplate.position.x - nodeData.level * 322,
            y: DataNodeTemplate.position.y + height,
        }
        // 节点数据
        const data = currentNodeLastConfig?.data || {
            ...DataNodeTemplate.data,
            ...nodeData,
        }
        // 添加节点
        graphCase.current?.addNode({
            ...DataNodeTemplate,
            position,
            data,
        })
    }

    /**
     * 从分组数据中添加节点
     * @param data 分组数据
     * @param addId 添加的节点id
     */
    const addNodeFromGroupData = (data: Array<any>, addId: string) => {
        const allNode = graphCase.current?.getNodes()
        let defaultHeight = 0
        data?.forEach((item) => {
            const currentNode = allNode?.find((it) => it.data.id === item.id)
            if (!currentNode) {
                if (addId === item.id) {
                    addNode(item, defaultHeight)
                    const lineHeight =
                        item.type === NodeType.DATA_TABLE
                            ? DATA_TABLE_LINE_HEIGHT
                            : LOGIC_LINE_HEIGHT
                    defaultHeight =
                        item.fields.length * lineHeight +
                        FORM_NODE_HEADER_HEIGHT +
                        30
                }
            } else {
                const currentPosition = currentNode.position()
                currentNode.position(
                    currentPosition.x,
                    currentPosition.y + defaultHeight,
                )
                const lineHeight =
                    item.type === NodeType.DATA_TABLE
                        ? DATA_TABLE_LINE_HEIGHT
                        : LOGIC_LINE_HEIGHT
                defaultHeight =
                    item.fields.length * lineHeight +
                    FORM_NODE_HEADER_HEIGHT +
                    30
            }
        })
    }

    /**
     * 移除父节点
     * @param nodeId 节点id
     * @param parentNodeId 父节点id
     */
    const removeParentNode = (nodeId: string, parentNodeId: string) => {
        const currentData = getCurrentData(groupData, parentNodeId)
        if (currentData) {
            const childrenData = getChildrenData(groupData, parentNodeId)
            if (childrenData.length === 1) {
                removeNode(parentNodeId)
                currentData.parentNodeId.forEach((item) => {
                    removeParentNode(currentData.id, item)
                })
            }
        }
    }

    /**
     * 移除节点
     * @param dataId 节点数据id
     */
    const removeNode = (dataId: string) => {
        const allNode = graphCase.current?.getNodes()
        const currentNode = allNode?.find((item) => item.data.id === dataId)
        if (currentNode) {
            // 更新已移除节点
            portAndEdgeStruct.updateRemovedNodes(currentNode)
            // 移除节点
            graphCase.current?.removeNode(currentNode.id)
            // 移除边
            portAndEdgeStruct
                .getEdgesBySourceNodeId(currentNode.id)
                .forEach((item) => {
                    portAndEdgeStruct.deleteEdges(item.edge.id)
                    graphCase.current?.removeEdge(item.edge.id)
                })
            portAndEdgeStruct.deletePortsBySourceNodeId(currentNode.id)
        }
    }

    /**
     * 增加边
     * @param outPortId 出桩id
     * @param inPortId 入桩id
     * @param outNodeId 出节点id
     * @param inNodeId 入节点id
     */
    const addEdge = (
        outPortId,
        inPortId,
        outNodeId,
        inNodeId,
        info: any,
        selected = false,
    ) => {
        const edge = new Shape.Edge({
            source: {
                cell: outNodeId,
                port: outPortId,
            },
            target: {
                cell: inNodeId,
                port: inPortId,
            },
            attrs: {
                line: selected ? LineLightStyle : LineNormalStyle,
            },
            zIndex: 10,
        })
        graphCase?.current?.addEdge(edge)
        portAndEdgeStruct.addEdgeInfo({
            ...info,
            edge,
        })
    }

    /**
     * 重新加载节点关系
     * @param node
     */
    const reloadNodeRelation = (node: Node) => {
        if (graphCase?.current) {
            const nodePorts = node.getPorts()
            nodePorts.forEach((item) => {
                if (item?.id) {
                    const edgeIds = portAndEdgeStruct.removeEdgeByPortId(
                        item.id,
                    )
                    edgeIds.forEach((edgeId) => {
                        graphCase.current?.removeEdge(edgeId)
                    })
                    portAndEdgeStruct.deletePorts(item.id, node)
                }
            })

            loadSingleNodeRelation(node)
        }
    }

    /**
     * 加载单个节点的关系
     * @param node
     */
    const loadSingleNodeRelation = (node: Node) => {
        if (graphCase?.current) {
            const allNode = graphCase.current.getNodes()
            const relationIds =
                expandDirection === 'parent'
                    ? node.data?.parentNodeId
                    : node.data?.childrenNodeId
            // 获取父节点
            const relationNodes = allNode.filter((item) =>
                relationIds?.includes(item.data.id),
            )
            // 更新父节点关系
            if (relationNodes.length) {
                relationNodes.forEach((item) => {
                    if (expandDirection === 'parent') {
                        addRelation(item, node)
                    } else {
                        addRelation(node, item)
                    }
                })
            }
            // 获取子节点
            const childNodes = allNode.filter((item) => {
                const itemRelationIds =
                    expandDirection === 'parent'
                        ? item.data?.parentNodeId
                        : item.data?.childrenNodeId
                return itemRelationIds?.includes(node.data.id)
            })
            if (childNodes.length) {
                childNodes.forEach((item) => {
                    if (expandDirection === 'parent') {
                        addRelation(node, item)
                    } else {
                        addRelation(item, node)
                    }
                })
            }
        }
    }

    /**
     * 获取当前选中的字段
     * @param groupData 分组数据
     * @param dataId 字段id
     * @returns 当前选中的字段
     */
    const selectedField = (field, node) => {
        if (graphCase.current) {
            const allNode = graphCase.current.getNodes()
            const selectFieldsAndNode = getSelectedFieldAndNode(
                field,
                node,
                allNode,
            )

            // 获取节点选中的字段
            const nodeSelectedFields = selectFieldsAndNode.reduce(
                (acc, item) => {
                    if (acc[item.nodeId]) {
                        acc[item.nodeId].push(item.fieldId)
                    } else {
                        acc[item.nodeId] = [item.fieldId]
                    }
                    return acc
                },
                {},
            )
            // 添加选中边
            addEdgeSelected(
                Object.keys(nodeSelectedFields)
                    .map((item) => nodeSelectedFields[item])
                    .flat(),
            )
            // 更新节点选中的字段
            allNode.forEach((item) => {
                if (nodeSelectedFields[item.id]) {
                    item.replaceData({
                        ...item.data,
                        selectedFields: nodeSelectedFields[item.id] || [],
                    })
                } else {
                    item.replaceData({
                        ...item.data,
                        selectedFields: [],
                    })
                }
            })
        }
    }

    /**
     * 添加选中边
     * @param fields 选中的字段
     */
    const addEdgeSelected = (fields) => {
        portAndEdgeStruct.edgesData.forEach((item) => {
            if (
                fields.includes(
                    expandDirection === 'parent'
                        ? item.targetDataId
                        : item.sourceDataId,
                )
            ) {
                item.edge.attr('line', LineLightStyle)
            } else {
                item.edge.attr('line', LineNormalStyle)
            }
        })
    }

    /**
     * 获取字段和节点的关系
     * @param field 字段
     * @param node 节点
     * @param allNode 所有节点
     * @returns 字段和节点的关系
     */
    const getSelectedFieldAndNode = (
        field: any,
        node: Node,
        allNode: Array<Node>,
    ) => {
        const relationFields =
            expandDirection === 'parent'
                ? field.parentField
                : field.childrenField
        const parentFieldNodeRelations = relationFields?.reduce((acc, item) => {
            const currentNode = allNode.find(
                (it) => it.data.id === item.tableId,
            )

            const currentField = currentNode?.data?.fields.find(
                (it) => it.id === item.id,
            )

            if (currentNode && currentField) {
                const currentFieldNodeRelation = getSelectedFieldAndNode(
                    currentField,
                    currentNode,
                    allNode,
                )
                return [...acc, ...currentFieldNodeRelation]
            }
            return acc
        }, [])
        return [
            {
                nodeId: node.id,
                fieldId: field.id,
            },
            ...parentFieldNodeRelations,
        ]
    }
    /**
     * 上下文更新
     */
    const contextValue = useMemo(
        () => ({
            graphCase: graphCase.current || null,
            selectedFields,
            loadedForm,
            expandNode,
            updateLoadedForm,
            updateExpandNode,
            reloadNodeRelation,
            selectedField,
        }),
        [
            graphCase.current,
            selectedFields,
            loadedForm,
            expandNode,
            updateLoadedForm,
            updateExpandNode,
            reloadNodeRelation,
            selectedField,
        ],
    )

    return (
        <div className={styles.graphContent}>
            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                }}
                ref={graphBody}
            >
                <GraphContext.Provider value={contextValue}>
                    <X6PortalProvider />
                    <div
                        ref={container}
                        id="container"
                        style={{
                            display: 'flex',
                            width: '100%',
                            height: '100%',
                        }}
                    />
                </GraphContext.Provider>

                <div
                    style={{
                        position: 'absolute',
                        right: '24px',
                        bottom: '24px',
                    }}
                >
                    <FloatBar
                        onChangeGraphSize={changeGraphSize}
                        onShowAllGraphSize={showAllGraphSize}
                        graphSize={graphSize}
                        onMovedToCenter={movedToCenter}
                    />
                </div>
            </div>
        </div>
    )
}

export default GraphContent
