import * as React from 'react'
import { useState, useRef, useEffect, useMemo } from 'react'
import { Graph as GraphType, Node, Shape } from '@antv/x6'
import { last, noop, trim } from 'lodash'
import { useUnmount, useGetState } from 'ahooks'
import { instancingGraph } from '@/core/graph/graph-config'
import { loadPlugins, Plugins } from '@/core/graph/plugin'
import {
    DataShowSite,
    ExpandStatus,
    getCurrentShowData,
    getDataCurrentPageIndex,
    getDataShowSite,
    OptionType,
    wheellDebounce,
} from '../FormGraph/helper'
import styles from './styles.module.less'
import FormQuoteData from '../FormGraph/formDataQuoteData'
import {
    formatError,
    getLineageBase,
    getLineageFathers,
    reqCatlgBasicInfo,
} from '@/core'
import { ViewModel, ViewType, VisualType } from './const'
import __ from './locale'
import dataFormNode from './DataForm'
import { DataFormTemplate, searchFieldData, getPortByNode } from './helper'
import FloatBar from './FloatBar'
import Toolbar from './Toolbar'
import GraphFloatMenu from './GraphFloatMenu'
import { formatCatlgError } from '../DataAssetsCatlg/helper'
import { DataServiceType } from '../ResourcesDir/const'
import { X6PortalProvider } from '@/core/graph/helper'

let waitForUnmount: Promise<any> = Promise.resolve()
interface DataConsanguinityType {
    id: string
    dataServiceType?: DataServiceType
    isMarket?: boolean
    errorCallback?: (error?: any) => void
}

const DataConsanguinity = ({
    id,
    dataServiceType = DataServiceType.DataAssets,
    isMarket = false,
    errorCallback = noop,
}: DataConsanguinityType) => {
    const graphCase = useRef<GraphType>()
    const graphBody = useRef<HTMLDivElement>(null)
    const container = useRef<HTMLDivElement>(null)
    // const MetricRef = useRef<any>(null)
    const [model, setModel, getModel] = useGetState<ViewModel>(
        ViewModel.ModelEdit,
    )
    const [graphSize, setGraphSize] = useState(100)
    const [optionType, setOptionType] = useState<OptionType>(
        OptionType.NoOption,
    )
    const [editBusinessFormId, setEditBusinessFormId] = useState<string>('')
    const [viewBusinessField, setViewBusinessField] = useState<any>(null)
    const [modelIndicatorId, setModelIndicatorId] = useState<
        string | undefined
    >('')
    const [viewPerspective, setViewPerspective] = useState<VisualType>(
        VisualType.Technology,
    )
    const [allLineages, setAllLineage] = useState<Array<string>>([])
    const [viewManner, setViewManner, getViewManner] = useGetState<ViewType>(
        ViewType.Form,
    )
    const [searchKey, setSearchKey] = useState<string>('')

    const options = [
        { label: __('业务视角'), value: VisualType.Business },
        { label: __('技术视角'), value: VisualType.Technology },
    ]

    const businessNodesPortsData = useMemo(() => {
        return new FormQuoteData({})
    }, [])

    const edgeRelation = useMemo(() => {
        return new FormQuoteData({})
    }, [])

    const getYPosition = (site, index, length) => {
        if (site === 'top') {
            return 75
        }
        if (site === 'bottom') {
            return 75 + length * 40 + 14
        }
        return 75 + index * 40 + 18
    }

    useMemo(() => {
        const promise = new Promise((resolve) => {
            waitForUnmount.then(() => {
                GraphType.registerPortLayout(
                    'IFormItemLeftPosition',
                    (portsPositionArgs) => {
                        return portsPositionArgs.map((_, index) => {
                            return {
                                position: {
                                    x: -1,
                                    y:
                                        _.expand === ExpandStatus.Expand
                                            ? getYPosition(
                                                  _.site,
                                                  _.index,
                                                  _.length,
                                              )
                                            : 28,
                                },
                                zIndex: 10,
                                angle: 0,
                            }
                        })
                    },
                )
                GraphType.registerPortLayout(
                    'IFormItemRightPosition',
                    (portsPositionArgs) => {
                        return portsPositionArgs.map((_, index) => {
                            return {
                                position: {
                                    x: 300,
                                    y:
                                        _.expand === ExpandStatus.Expand
                                            ? getYPosition(
                                                  _.site,
                                                  _.index,
                                                  _.length,
                                              )
                                            : 28,
                                },
                                zIndex: 10,
                                angle: 0,
                            }
                        })
                    },
                )
                GraphType.registerPortLayout(
                    'IDefaultOriginLeftPosition',
                    (portsPositionArgs) => {
                        return portsPositionArgs.map((_, index) => {
                            return {
                                position: {
                                    x: 27,
                                    y: 40,
                                },
                                zIndex: 10,
                                angle: 0,
                            }
                        })
                    },
                )
                GraphType.registerPortLayout(
                    'IDefaultOriginRightPosition',
                    (portsPositionArgs) => {
                        return portsPositionArgs.map((_, index) => {
                            return {
                                position: {
                                    x: 83,
                                    y: 40,
                                },
                                zIndex: 10,
                                angle: 0,
                            }
                        })
                    },
                )
                return () => {
                    unRegistryPort()
                }
            })
        })
        waitForUnmount = promise
    }, [])

    const formBusinessNodeName = dataFormNode({
        graphCase,
        updateAllPortAndEdge: (node: Node) => {
            updateAllPortAndEdge()
        },
        getModel: () => getViewManner(),
        getEdgeRelation: () => edgeRelation,
        onLoadFatherNode: (node: Node) => {
            loadFatherTable(node)
        },
    })

    // 注册目标表节点
    useUnmount(() => {
        if (graphCase && graphCase.current) {
            graphCase.current.dispose()
        }
    })

    useEffect(() => {
        // initEditStatus()
        // getEnumConfig()
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
                        wheellDebounce(graph, wheelEvent, setGraphSize)
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
                            line: {
                                stroke: '#979797',
                                strokeWidth: 0.7,
                                targetMarker: {
                                    name: 'block',
                                    size: 0,
                                },
                                strokeDasharray: '5 5',
                            },
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
            loadOriginTable()

            // graph.on('resize', ({ width, height }) => {
            //     const position = graph.getContentBBox()
            //     graph.translate(position.x + 20, position.y)
            // })
        }
    }, [])

    useEffect(() => {
        updateNodeDataModel(viewManner)
    }, [viewManner])

    /**
     * 注销画布注册的桩
     */
    const unRegistryPort = () => {
        GraphType.unregisterPortLayout('IFormItemRightPosition')
        GraphType.unregisterPortLayout('IFormItemLeftPosition')
        GraphType.unregisterPortLayout('IDefaultOriginLeftPosition')
        GraphType.unregisterPortLayout('IDefaultOriginRightPosition')
    }

    /**
     * 加载目标表
     */
    const loadOriginTable = async () => {
        if (graphCase && graphCase.current) {
            try {
                let form_view_id: string = ''
                // 服务超市需要根据id查询库表id
                if (dataServiceType === DataServiceType.DataAssets) {
                    const res = await reqCatlgBasicInfo(id)
                    form_view_id = res?.form_view_id
                }
                const data = await getLineageBase(form_view_id || id)

                const { fields, ...formInfo } = data
                setAllLineage([...allLineages, data.vid])
                graphCase.current.addNode({
                    ...DataFormTemplate,
                    position: {
                        x: 600,
                        y: 200,
                    },
                    data: {
                        ...DataFormTemplate.data,
                        expand: ExpandStatus.Expand,
                        offset: 0,
                        fid: formInfo.vid,
                        items: fields,
                        isBase: true,
                        formInfo,
                    },
                })

                requestIdleCallback(async () => {
                    await showAllGraphSize()
                })
            } catch (ex) {
                formatCatlgError(ex, errorCallback)
            }
        }
    }

    /**
     * 加载父节点表
     * @param node
     */
    const loadFatherTable = async (node: Node) => {
        if (graphCase && graphCase.current) {
            const allNodes = graphCase.current.getNodes()
            const data = await getLineageFathers(node.data.formInfo.vid, {
                limit: 99,
                offset: 1,
            })
            const { entries } = data
            const lineages = entries.filter(
                (value) => !allLineages.includes(value.vid),
            )
            const existLineages = entries.filter((value) =>
                allLineages.includes(value.vid),
            )

            setAllLineage([
                ...allLineages,
                ...lineages.map((value) => value.vid),
            ])

            const { x, y } = node.position()
            if (lineages?.length) {
                const firstFatherPosition = allNodes.filter(
                    (currentNode) =>
                        currentNode.data.level === node.data.level + 1,
                )
                lineages.forEach((lineage, index) => {
                    addFatherNode(
                        { x: x - 400, y },
                        node,
                        lineage,
                        firstFatherPosition.length + index,
                    )
                })
                currentLevelSort(node.data.level + 1, { x: x - 400, y })
            } else if (existLineages?.length) {
                existLineages.forEach((existLineage) => {
                    const currentNode = allNodes.find(
                        (lineageNode) =>
                            lineageNode.data.formInfo.vid === existLineage.vid,
                    )
                    const currentSingleSelectedId = existLineage.fields.filter(
                        (fatherField) => {
                            if (
                                fatherField.target_field &&
                                fatherField.target_field[node.data.formInfo.vid]
                            ) {
                                return node.data.singleSelectedId.find(
                                    (currentSelectedId) =>
                                        fatherField.target_field[
                                            node.data.formInfo.vid
                                        ].includes(currentSelectedId),
                                )
                            }
                            return false
                        },
                    )
                    currentNode?.replaceData({
                        ...currentNode.data,
                        items: currentNode.data.items.map((itemFiled) => {
                            const currentField = existLineage.fields.find(
                                (field) => itemFiled.id === field.id,
                            )
                            return {
                                ...itemFiled,
                                target_field: {
                                    ...itemFiled.target_field,
                                    ...(currentField?.target_field || {}),
                                },
                            }
                        }),
                        singleSelectedId: currentSingleSelectedId.map(
                            (currentSingleField) => currentSingleField.id,
                        ),
                    })
                })
                node.replaceData({
                    ...node.data,
                    expandFather: true,
                })
            }
            updateAllPortAndEdge()
        }
    }

    /**
     * 加载父节点
     * @param position
     * @param node
     * @param data
     * @param index
     */
    const addFatherNode = (
        position: {
            x: number
            y: number
        },
        node: Node,
        data,
        index: number,
    ) => {
        if (graphCase && graphCase.current) {
            const { fields, ...formInfo } = data
            const currentSingleSelectedId = fields.filter((fatherField) => {
                if (
                    fatherField.target_field &&
                    fatherField.target_field[node.data.formInfo.vid]
                ) {
                    return node.data.singleSelectedId.find(
                        (currentSelectedId) =>
                            fatherField.target_field[
                                node.data.formInfo.vid
                            ].includes(currentSelectedId),
                    )
                }
                return false
            })
            graphCase.current.addNode({
                ...DataFormTemplate,
                position,
                data: {
                    expand: ExpandStatus.Expand,
                    offset: 0,
                    fid: formInfo.vid,
                    items: fields,
                    isBase: false,
                    formInfo,
                    index: index + 1,
                    fatherIndex: [node.data.index],
                    level: node.data.level + 1,
                    model: viewManner,
                    isSelected: searchKey
                        ? formInfo.name
                              .toLocaleLowerCase()
                              .includes(searchKey.toLocaleLowerCase())
                        : false,
                    hoverStatus: !!node.data.hoverStatus,
                    singleSelectedId: currentSingleSelectedId.map(
                        (currentSingleField) => currentSingleField.id,
                    ),
                },
            })

            node.replaceData({
                ...node.data,
                expandFather: true,
            })
        }
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
                    return x === position.x && currentNode.data.level === level
                })
                .sort((currentNode1, currentNode2) => {
                    return currentNode1.data.index - currentNode2.data.index
                })
            const currentFirstLevelNode = allNodes.find(
                (currentNode) =>
                    currentNode.data.index === 1 &&
                    currentNode.data.level === level - 1,
            )

            if (currentLevelNode.length && currentFirstLevelNode) {
                let initY = getInitYData(
                    currentLevelNode,
                    currentFirstLevelNode,
                )
                currentLevelNode.forEach((currentNode, index) => {
                    if (getViewManner() === ViewType.Field) {
                        const height = initTargetNode(currentNode.data.items)
                        const currentPosition = currentNode.position()
                        currentNode.position(
                            currentPosition.x,
                            initY + index * 10,
                        )
                        initY += height
                    } else {
                        const height = 75
                        const currentPosition = currentNode.position()
                        currentNode.position(
                            currentPosition.x,
                            initY + index * 20,
                        )
                        initY += height
                    }
                })
            }
        }
    }

    /**
     * 计算当前节点
     * @param items
     * @returns
     */
    const initTargetNode = (items) => {
        const headerHeight = 75
        if (getViewManner() === ViewType.Form) {
            return headerHeight
        }
        if (items.length <= 10) {
            return headerHeight + items.length * 40 + 24
        }
        return headerHeight + 10 * 40 + 24
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
            const height = initTargetNode(currentNode.data.items)
            allHeight += height
        })
        const { x, y } = firstFatherNode.position()
        const fatherHeight = initTargetNode(firstFatherNode.data.items)

        if (!allHeight || allHeight - fatherHeight <= 0) {
            return y
        }
        return y - (allHeight - fatherHeight) / 2
    }

    /**
     * 更新贴原表数据
     */
    const addPasteNodePortData = (portId, nodeId, fieldId, site) => {
        if (portId) {
            businessNodesPortsData.addData({
                [portId]: {
                    nodeId,
                    fieldId,
                    site,
                },
            })
        }
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
     * 组合节点更新的数据
     */
    const assemblyUpdataData = (allNodes: Array<Node>) => {
        if (allNodes?.length > 1) {
            const levels = allNodes.reduce((preData, currentNode) => {
                if (
                    Object.keys(preData).includes(`${currentNode.data.level}`)
                ) {
                    return {
                        ...preData,
                        [currentNode.data.level]: [
                            ...preData[currentNode.data.level],
                            currentNode,
                        ],
                    }
                }
                return {
                    ...preData,
                    [currentNode.data.level]: [currentNode],
                }
            }, {})
            return levels
        }
        return {}
    }

    /**
     * 更新所有表格port和连线
     */
    const updateAllPortAndEdge = (viewType?: ViewType) => {
        if (graphCase?.current) {
            const currentViewType = viewType || getViewManner()
            const allNodes = graphCase.current.getNodes()
            clearNodePorts(allNodes)
            const levelSortNodes = assemblyUpdataData(allNodes)
            edgeRelation.clearData()
            if (Object.keys(levelSortNodes).length > 1) {
                const levels = Object.keys(levelSortNodes).sort(
                    (a, b) => Number(a) - Number(b),
                )
                levels.forEach((key, index) => {
                    if (index < levels.length && allNodes.length > 1) {
                        levelSortNodes[Number(key)].forEach((currentNode) => {
                            const fatherNodes = getFatherNodes(
                                allNodes,
                                currentNode.data.formInfo.target_table,
                            )

                            if (fatherNodes.length) {
                                if (currentViewType === ViewType.Form) {
                                    createNodeRelation(currentNode, fatherNodes)
                                } else {
                                    createNodeRelation(currentNode, fatherNodes)
                                    setQuoteKeyRelative(
                                        fatherNodes,
                                        currentNode,
                                    )
                                }
                            }
                        })
                    }
                })
            }
        }
    }

    const getFatherNodes = (nodes: Array<Node>, relationsId: Array<string>) => {
        if (relationsId) {
            return nodes.filter((currentNode) =>
                relationsId.includes(currentNode.data.formInfo.vid),
            )
        }
        return []
    }

    /**
     * 清除所有连接桩
     * @param nodes
     */
    const clearNodePorts = (nodes) => {
        nodes.forEach((node) => {
            node.removePorts()
        })
    }

    /**
     * 查找目标字段
     */
    const setQuoteKeyRelative = (originNodes, targetNode) => {
        const targetSearchData = searchFieldData(
            targetNode.data.items,
            targetNode.data.keyWord,
        )
        targetSearchData.forEach((item, index) => {
            const relationDataVids = Object.keys(item?.target_field || {})
            const currentRelationsNodes = originNodes.filter((originNode) => {
                return relationDataVids.includes(originNode.data.formInfo.vid)
            })
            if (relationDataVids.length) {
                currentRelationsNodes.forEach((currentNode) => {
                    item.target_field[currentNode.data.formInfo.vid].forEach(
                        (fieldId) => {
                            createRelativeByNode(
                                currentNode,
                                targetNode,
                                item,
                                index,
                                fieldId,
                            )
                        },
                    )
                })
            }
        })
    }

    /**
     * 创建节点关系
     * @param originNode 源节点
     * @param targetNode 目标节点
     * @param item 数据项
     * @param index 数据项下标
     */
    const createRelativeByNode = (
        originNode,
        targetNode,
        item,
        index,
        source_id,
    ) => {
        // const { origin, target } = getOriginPosition(originNode, targetNode)
        let targetNodeItemPortInfo
        if (targetNode.data.expand === ExpandStatus.Retract) {
            const portId = getOriginNodeHeaderPorts(targetNode, 'rightPorts')
            if (portId) {
                targetNodeItemPortInfo = {
                    portId,
                    nodeId: targetNode.id,
                }
            } else {
                targetNode.addPort(
                    getPortByNode('rightPorts', -1, '', targetNode.data.expand),
                )
            }
        } else {
            targetNodeItemPortInfo = getNodeItemPortId(
                targetNode,
                index,
                'rightPorts',
                10,
                item,
            )
        }
        if (originNode.data.expand === ExpandStatus.Expand) {
            const pasteNodeItemPortInfo = getPasteNodePort(
                originNode,
                source_id,
                'leftPorts',
            )
            if (pasteNodeItemPortInfo) {
                addEdgeFromOriginToTarget(
                    source_id,
                    originNode,
                    pasteNodeItemPortInfo?.portId || '',
                    targetNode,
                    targetNodeItemPortInfo?.portId || '',
                )
            }
        } else {
            const portId = getOriginNodeHeaderPorts(originNode, 'leftPorts')

            if (portId) {
                addEdgeFromOriginToTarget(
                    source_id,
                    originNode,
                    portId,
                    targetNode,
                    targetNodeItemPortInfo?.portId,
                )
            } else {
                const originNodeItemPortId = getPasteNodePort(
                    originNode,
                    source_id,
                    'leftPorts',
                    ExpandStatus.Retract,
                )
                addEdgeFromOriginToTarget(
                    source_id,
                    originNode,
                    originNodeItemPortId,
                    targetNode,
                    targetNodeItemPortInfo?.portId,
                )
            }
        }
    }

    /**
     *  获取左右头的桩
     */
    const getOriginNodeHeaderPorts = (originNode: Node, position) => {
        const originNodePorts = originNode.getPorts()
        let portId
        originNodePorts.forEach((originNodePort) => {
            if (
                originNodePort.group === position &&
                originNodePort.args?.type !== 'form'
            ) {
                portId = originNodePort.id || ''
            } else {
                portId = ''
            }
        })
        return portId
    }

    /**
     * 设置原节点的桩
     */
    const getPasteNodePort = (
        originNode,
        refId: string,
        position: string,
        expand: ExpandStatus = ExpandStatus.Expand,
    ) => {
        let portInfo
        const searchData = searchFieldData(
            originNode.data.items,
            originNode.data.keyWord,
        )
        searchData.forEach((originItem, index) => {
            if (originItem.id === refId) {
                if (expand === ExpandStatus.Retract) {
                    originNode.addPort(getPortByNode(position, -1, '', expand))
                } else {
                    portInfo = getNodeItemPortId(
                        originNode,
                        index,
                        position,
                        10,
                        originItem,
                    )
                }
            }
        })
        return portInfo
    }

    /**
     * 获取当前节点的portId
     * @param node 节点
     * @param index 当前下标
     * @param group port位置
     * @param limit 每页大小
     * @returns portId 找到返回对应id ，没找到生成port并返回''
     */
    const getNodeItemPortId = (node: Node, index, group, limit, item) => {
        const itemSite = getDataShowSite(
            index,
            node.data.offset,
            limit,
            node.data.items.length,
        )
        if (itemSite === DataShowSite.CurrentPage) {
            const currentPageIndex = getDataCurrentPageIndex(
                index,
                node.data.offset,
                limit,
                node.data.items.length,
            )
            node.addPort(getPortByNode(group, currentPageIndex))
            const portId = last(node.getPorts())?.id
            if (portId) {
                addPasteNodePortData(portId, node.id, item.id, group)
                return {
                    portId,
                    nodeId: businessNodesPortsData.quoteData[portId],
                }
            }
        }
        if (itemSite === DataShowSite.UpPage) {
            const portId = getUpPortId(group, node)
            if (portId) {
                return {
                    portId,
                    nodeId: node.id,
                }
            }
            node.addPort(getPortByNode(group, -1, 'top'))
            const newUpPortId = last(node.getPorts())?.id
            return {
                portId: newUpPortId,
                nodeId: businessNodesPortsData.quoteData[portId],
            }
        }

        const portId = getDownPort(group, node)
        if (portId) {
            return {
                portId,
                nodeId: node.id,
            }
        }
        const showData = getCurrentShowData(
            node.data.offset,
            searchFieldData(node.data.items, node.data.keyWord),
            10,
        )
        node.addPort(
            getPortByNode(
                group,
                -1,
                'bottom',
                ExpandStatus.Expand,
                'field',
                showData.length,
            ),
        )
        const newDownPortId = last(node.getPorts())?.id
        return {
            portId: newDownPortId,
            nodeId: businessNodesPortsData.quoteData[portId],
        }
    }

    /**
     *
     */
    const createNodeRelation = (originNode, targetNodes) => {
        if (targetNodes.length) {
            const originNodeId = getFormNodePort(originNode, 'rightPorts')
            targetNodes.forEach((targetNode) => {
                const portId = getFormNodePort(targetNode, 'leftPorts')
                if (targetNode.data.expandFather === true) {
                    if (graphCase && graphCase.current) {
                        addFormNodeEdge(
                            targetNode,
                            portId,
                            originNode,
                            originNodeId,
                        )
                    }
                }
            })
        }
    }

    const getFormNodePort = (node: Node, position) => {
        // const portId = getOriginNodeHeaderPorts(node, position)
        // if (portId) {
        //     return portId
        // }
        node.addPort(getPortByNode(position, -1, '', ExpandStatus.Retract))
        const newPortId = last(node.getPorts())?.id
        return newPortId
    }

    const addFormNodeEdge = (
        targetNode,
        targetPortId,
        originNode,
        OriginPortId,
    ) => {
        const edge = new Shape.Edge({
            source: {
                cell: originNode.id,
                port: OriginPortId,
            },
            target: {
                cell: targetNode.id,
                port: targetPortId,
            },
            attrs: {
                line: {
                    stroke: '#979797',
                    strokeWidth: 0.7,
                    targetMarker: 'block',
                },
            },
        })
        if (graphCase && graphCase.current) {
            edgeRelation.addData({
                [originNode.data.formInfo.vid]: [
                    ...(edgeRelation.quoteData?.[
                        originNode.data.formInfo.vid
                    ] || []),
                    graphCase.current.addEdge(edge),
                ],
            })
        }
    }
    /**
     * 获取头部对应位置的坐标
     * @param group 位置
     * @param node 节点
     * @returns 坐标 找到返回对应节点 ，找不到返回头坐标
     */
    const getUpPortId = (group, node) => {
        const currentPort = node
            .getPorts()
            .filter((port) => port.args?.site === 'top' && port.group === group)
        if (currentPort && currentPort.length) {
            return currentPort[0].id
        }
        return ''
    }

    /**
     * 获取底部对应位置的坐标
     * @param group 位置
     * @param node 节点
     * @returns 坐标 找到返回对应节点 ，找不到返回头坐标
     */
    const getDownPort = (group, node) => {
        const currentPort = node
            .getPorts()
            .filter(
                (port) => port.args?.site === 'bottom' && port.group === group,
            )
        if (currentPort && currentPort.length) {
            return currentPort[0].id
        }
        return ''
    }

    /**
     * 添加连线
     * @param targetNode 目标节点
     * @param targetPortId 目标桩
     * @param originNode 源节点
     * @param OriginPortId 源桩
     */
    const addEdgeFromOriginToTarget = (
        originItemId,
        targetNode: Node,
        targetNodePortId: string,
        originNode: Node,
        originNodePortId: string = '',
    ) => {
        if (graphCase && graphCase.current) {
            const originNodePort = last(originNode.getPorts())
            const targetNodePort = last(targetNode.getPorts())
            if (
                originNodePort &&
                originNodePort.id &&
                targetNodePort &&
                targetNodePort.id
            ) {
                if (targetNode.data.singleSelectedId.includes(originItemId)) {
                    const edge = new Shape.Edge({
                        source: {
                            cell: originNode.id,
                            port: originNodePortId || originNodePort.id,
                        },
                        target: {
                            cell: targetNode.id,
                            port: targetNodePortId || targetNodePort.id,
                        },
                        attrs: {
                            line: {
                                stroke: '#126ee3',
                                strokeWidth: 0.7,
                                targetMarker: 'block',
                            },
                        },
                        zIndex: -1,
                    })

                    edgeRelation.addData({
                        [originItemId]: edgeRelation?.[originItemId]
                            ? [
                                  ...edgeRelation[originItemId],
                                  graphCase.current.addEdge(edge),
                              ]
                            : [graphCase.current.addEdge(edge)],
                    })
                } else {
                    const edge = new Shape.Edge({
                        source: {
                            cell: originNode.id,
                            port: originNodePortId || originNodePort.id,
                        },
                        target: {
                            cell: targetNode.id,
                            port: targetNodePortId || targetNodePort.id,
                        },
                        attrs: {
                            line: {
                                stroke: '#979797',
                                strokeWidth: 0.7,
                                targetMarker: 'block',
                            },
                        },
                        zIndex: -1,
                    })
                    edgeRelation.addData({
                        [originItemId]: edgeRelation?.[originItemId]
                            ? [
                                  ...edgeRelation[originItemId],
                                  graphCase.current.addEdge(edge),
                              ]
                            : [graphCase.current.addEdge(edge)],
                    })
                }
            } else if (model === ViewModel.ModelView) {
                if (originNodePortId) {
                    originNode.removePort(originNodePortId)
                    businessNodesPortsData.deleteData(originNodePortId)
                }
                if (targetNodePortId) {
                    targetNode.removePort(targetNodePortId)
                    businessNodesPortsData.deleteData(targetNodePortId)
                }
            }
        }
    }

    const updateNodeDataModel = (valueType: ViewType) => {
        if (graphCase.current) {
            const allNodes = graphCase.current.getNodes()
            if (allNodes.length > 1) {
                const levelSortNodes = assemblyUpdataData(allNodes)
                Object.keys(levelSortNodes).forEach((key) => {
                    if (Number(key) < Object.keys(levelSortNodes).length) {
                        levelSortNodes[key].forEach((currentNode) => {
                            const { x, y } = currentNode.position()
                            currentLevelSort(currentNode.data.level + 1, {
                                x: x - 400,
                                y,
                            })
                        })
                    }
                })
            }

            allNodes.forEach((currentNode) => {
                currentNode.replaceData({
                    ...currentNode.data,
                    model: valueType,
                })
            })
            updateAllPortAndEdge(valueType)
        }
    }

    return (
        <div className={styles.main}>
            <div className={styles.graphContent}>
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                    }}
                    ref={graphBody}
                    onClick={() => {
                        setModelIndicatorId('')
                        if (optionType !== OptionType.NoOption) {
                            setOptionType(OptionType.NoOption)
                            setEditBusinessFormId('')
                            setViewBusinessField(null)
                        }
                    }}
                >
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
                    <div
                        style={{
                            position: 'absolute',
                            right: '8px',
                            top: isMarket ? 0 : '16px',
                        }}
                    >
                        <GraphFloatMenu needExpand={false}>
                            <>
                                {viewPerspective === VisualType.Technology && (
                                    <Toolbar
                                        viewMode={viewManner}
                                        onViewModeChange={(value) => {
                                            setViewManner(value)
                                        }}
                                        onSearch={(value) => {
                                            setSearchKey(value)
                                            if (
                                                graphCase &&
                                                graphCase.current
                                            ) {
                                                const allNodes =
                                                    graphCase.current.getNodes()
                                                if (value) {
                                                    allNodes.forEach(
                                                        (currentNode) => {
                                                            if (
                                                                currentNode.data.formInfo.name
                                                                    .toLocaleLowerCase()
                                                                    .includes(
                                                                        trim(
                                                                            value,
                                                                        ).toLocaleLowerCase(),
                                                                    )
                                                            ) {
                                                                currentNode.replaceData(
                                                                    {
                                                                        ...currentNode.data,
                                                                        isSelected:
                                                                            true,
                                                                    },
                                                                )
                                                            } else {
                                                                currentNode.replaceData(
                                                                    {
                                                                        ...currentNode.data,
                                                                        isSelected:
                                                                            false,
                                                                    },
                                                                )
                                                            }
                                                        },
                                                    )
                                                } else {
                                                    allNodes.forEach(
                                                        (currentNode) => {
                                                            currentNode.replaceData(
                                                                {
                                                                    ...currentNode.data,
                                                                    isSelected:
                                                                        false,
                                                                },
                                                            )
                                                        },
                                                    )
                                                }
                                            }
                                        }}
                                    />
                                )}
                                {/* <div className={styles.toolbarContent}>
                                    <Radio.Group
                                        options={options}
                                        onChange={(e) => {
                                            setViewPerspective(e.target.value)
                                        }}
                                        value={viewPerspective}
                                        optionType="button"
                                    />
                                </div> */}
                            </>
                        </GraphFloatMenu>
                    </div>
                    {/* {viewPerspective === VisualType.Technology && (
                        <div
                            style={{
                                position: 'absolute',
                                right: '24px',
                                top: '50px',
                            }}
                        >
                            <GraphFloatMenu />
                        </div>
                    )} */}
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
        </div>
    )
}

export default DataConsanguinity
