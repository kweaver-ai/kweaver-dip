import * as React from 'react'
import { useState, useRef, useEffect, useMemo, createContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Graph, Graph as GraphType, Node, Shape } from '@antv/x6'
import { last, noop, trim, uniq } from 'lodash'
import { LeftOutlined } from '@ant-design/icons'
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
import './x6Style.css'
import FormQuoteData from '../FormGraph/formDataQuoteData'
import {
    formatError,
    getDatasheetViewDetails,
    getIndicatorDetail,
    getLineageBase,
    getLineageFathers,
} from '@/core'
import {
    getRestrictList,
    IndicatorNodeType,
    TypeAssociateIndicatorNodeType,
    ViewModel,
    ViewType,
    VisualType,
    getPortByNode,
    calculateCompositePort,
    calculateDerivePort,
    NODEWIDTH,
    NODEHEADERY,
    getDisplayIndex,
    FORMNODEHEADEHEIGHT,
    calculateFormNodeHeight,
    OFFSETHEIGHT,
    LINEHEIGHT,
    NODEDEFAULTGAP,
    INDICATORNODEHEADEHEIGHT,
    INDICATORNODETITLEHEIGHT,
} from './const'
import __ from './locale'
import dataFormNode from './DataForm'
import {
    DataFormTemplate,
    searchFieldData,
    IndicatorNodeTemplate,
    IndicatorContext,
    getCurrentNodeHeight,
    getExpressIndictors,
    getExpressFields,
    addDataFormPorts,
    addGraphEdge,
} from './helper'
import { useQuery } from '@/utils'

import FloatBar from './FloatBar'
import Toolbar from './Toolbar'
import GraphFloatMenu from './GraphFloatMenu'
import { formatCatlgError, ServiceType } from '../DataAssetsCatlg/helper'
import { DataServiceType } from '../ResourcesDir/const'
import { X6PortalProvider } from '@/core/graph/helper'
import automicNode from './AutomicNode'
import compositeNode from './CompositeNode'
import derivedNode from './DerivedNode'
import { TabsKey } from '../IndicatorManage/const'
import DataStruct from './dataStruct'
import IndicatorView from '../IndicatorManage/IndicatorView'
import ConventionalSigns from './ConventionalSigns'
import LogicDetailView from '../DatasheetView/LogicDetailView'

interface DataConsanguinityType {
    id: string
    detailStyle?: React.CSSProperties
}

const IndicatorConsanguinity = ({ id, detailStyle }: DataConsanguinityType) => {
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

    const [detailVisible, setDetailVisible] = useState<boolean>(false)
    const [indictorDetail, setIndictorDetail] = useState<any>(null)
    const [logicViewId, setLogicViewId] = useState<any>(null)

    const query = useQuery()

    const navigate = useNavigate()

    const businessNodesPortsData = useMemo(() => {
        return new FormQuoteData({})
    }, [])

    const edgeRelation = useMemo(() => {
        return new FormQuoteData({})
    }, [])

    const relationStruct = useMemo(() => {
        return new DataStruct()
    }, [id])

    const formBusinessNodeName = useMemo(() => dataFormNode({ graphCase }), [])

    // 初始化节点
    const AutomicNodeName = useMemo(
        () =>
            automicNode({
                graphCase,
            }),
        [],
    )

    // 初始化衍生指标
    const DerivedNodeName = useMemo(() => derivedNode({ graphCase }), [])

    // 初始化复合指标
    const CompositeNodeName = useMemo(() => compositeNode({ graphCase }), [])

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
            loadOriginIndicator()

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
     * 更新节点数据
     */
    const updateNodes = () => {
        if (graphCase?.current) {
            const allNodes = graphCase.current.getNodes()
            relationStruct.updateNodes(allNodes)
        }
    }

    /**
     * 加载目标表
     */
    const loadOriginIndicator = async () => {
        if (graphCase && graphCase.current) {
            try {
                const indicatorInfo = await getIndicatorDetail(id)

                await graphCase.current.addNode({
                    ...IndicatorNodeTemplate,
                    shape: TypeAssociateIndicatorNodeType?.[
                        indicatorInfo?.indicator_type
                    ],
                    position: {
                        x: 600,
                        y: 200,
                    },
                    data: {
                        ...IndicatorNodeTemplate.data,
                        type: indicatorInfo?.indicator_type,
                        indicatorInfo,
                        isBase: true,
                    },
                })

                setIndictorDetail(indicatorInfo)

                requestIdleCallback(async () => {
                    await showAllGraphSize()
                })
            } catch (ex) {
                formatError(ex)
            }
        }
    }

    /**
     * 增加连线
     * @param originId
     * @param targetId
     */
    const addEdge = (targetId, originId, isLight: boolean = false) => {
        if (graphCase.current) {
            addGraphEdge(
                graphCase.current,
                targetId,
                originId,
                relationStruct,
                isLight,
            )
        }
    }
    /**
     * 加载数据表节点
     */
    const loadDataFormNode = async (
        tableId: string,
        level,
        position: {
            x: number
            y: number
        },
        index: number,
        fatherIndex: number,
        connectFields: Array<string>,
        targetId = '',
        selectedIds: Array<string> = [],
    ) => {
        if (graphCase?.current) {
            try {
                const dataFormInfo = await getDatasheetViewDetails(tableId)
                const newNode = graphCase.current.addNode({
                    ...DataFormTemplate,
                    position,
                    data: {
                        ...DataFormTemplate.data,
                        offset: 0,
                        formData: {
                            ...dataFormInfo,
                            id: tableId,
                        },
                        isBase: false,
                        index: index + 1,
                        fatherIndex: [fatherIndex],
                        selectedIds,
                        level,

                        // hoverStatus: !!node.data.hoverStatus,
                        // singleSelectedId: currentSingleSelectedId.map(
                        //     (currentSingleField) => currentSingleField.id,
                        // ),
                    },
                })
                addNextNodePort(
                    newNode,
                    IndicatorNodeType.DATAFORMNODE,
                    connectFields,
                )

                if (!connectFields?.length) {
                    addEdge(targetId, tableId, !!selectedIds.includes(tableId))
                } else {
                    connectFields.forEach((item) => {
                        addEdge(targetId, item, !!selectedIds.includes(item))
                    })
                }

                updateNodes()
                currentLevelSort(level, position)
            } catch (err) {
                formatError(err)
            }
        }
    }

    /**
     *  加载指标节点
     */
    const loadIndicatorNode = async (
        indictaorId,
        level,
        position: {
            x: number
            y: number
        },
        index: number,
        fatherIndex: number,
        targetId,
        selectedIds: Array<string> = [],
    ) => {
        if (graphCase?.current) {
            try {
                const indicatorInfo = await getIndicatorDetail(indictaorId)

                const newNode = graphCase.current.addNode({
                    ...IndicatorNodeTemplate,
                    shape: TypeAssociateIndicatorNodeType?.[
                        indicatorInfo?.indicator_type
                    ],
                    position,
                    data: {
                        ...IndicatorNodeTemplate.data,
                        type: indicatorInfo?.indicator_type,
                        indicatorInfo,
                        isBase: false,
                        index: index + 1,
                        fatherIndex: [fatherIndex],
                        level,
                        selectedIds,
                    },
                })
                addNextNodePort(newNode, indicatorInfo.indicator_type)
                addEdge(targetId, indictaorId, !!selectedIds.length)
                updateNodes()
                currentLevelSort(level, position)
            } catch (err) {
                formatError(err)
            }
        }
    }

    /**
     * 检查当前数据是否已存在在画布
     * @param dataId 数据id
     * @param type 数据类型
     * @param allNodes 所有节点
     * @returns
     */

    const checkCurrentNodeExist = (dataId, allNodes: Array<Node>) => {
        const nodeTypeData = allNodes.map((currentNode) => {
            const { type, indicatorInfo, formData } = currentNode.data
            return indicatorInfo?.id || formData?.id
        })
        return nodeTypeData.includes(dataId)
    }

    /**
     * 指标限定表的id
     * @param indicatorInfo
     * @returns
     */
    const getRestrictTableIds = (indicatorInfo) => {
        const { where_info } = indicatorInfo
        const isSql = where_info.sub_type === 'sql'
        if (isSql) return []
        return indicatorInfo?.refer_view_id
            ? [indicatorInfo?.refer_view_id]
            : []
        // const time_restrict = where_info.date_where
        // const biz_restrict = where_info.where
        // const bizData = getRestrictList(biz_restrict)
        // const timeData = getRestrictList(time_restrict)
        // return uniq([...bizData, ...timeData].map((item) => item.field_id))
    }

    /**
     * 指标限定表的id
     * @param indicatorInfo
     * @returns
     */
    const getTableFieldsIds = (indicatorInfo) => {
        const { where_info } = indicatorInfo
        const isSql = where_info.sub_type === 'sql'
        if (isSql) return {}

        const biz_restrict = where_info.where
        const time_restrict = where_info.date_where
        const bizData = getRestrictList(biz_restrict)
        const timeData = getRestrictList(time_restrict)
        const fieldIds = uniq(
            [...bizData, ...timeData].map((item) => item.field_id),
        )

        return indicatorInfo?.refer_view_id
            ? {
                  [indicatorInfo?.refer_view_id]: fieldIds,
              }
            : {}
    }

    /**
     *  移动相关数据节点的位置
     * @param dataId
     * @param allNodes
     * @param level
     */
    const returningNode = (dataId, allNodes, level) => {
        const connnectNodeIds = relationStruct.findConnectNodeIds(dataId)
        const connnectNodes = allNodes.filter((currentNode) =>
            connnectNodeIds.includes(currentNode.id),
        )
        connnectNodes.forEach((connectNode) => {
            if (level >= connectNode.data.level) {
                moveNodeLevelToNext(connectNode, level - connectNode.data.level)
            }
        })
    }

    /**
     * 展开衍生指标
     * @param indicatorInfo ：指标信息
     * @param level 层级
     * @param position 位置
     * @param index 当前列的第几个
     * @param fatherIndex 父节点的第几个
     */
    const loadDeriveFatherNode = async (
        indicatorInfo,
        level,
        position: {
            x: number
            y: number
        },
        index: number,
        fatherIndex: number,
        allNodes,
        selectedIds: Array<string>,
    ) => {
        const tableFieldsData = getTableFieldsIds(indicatorInfo)

        if (
            checkCurrentNodeExist(indicatorInfo?.atomic_indicator_id, allNodes)
        ) {
            addEdge(
                indicatorInfo.id,
                indicatorInfo?.atomic_indicator_id,
                !!(
                    selectedIds.includes(indicatorInfo.id) ||
                    selectedIds.includes(indicatorInfo?.atomic_indicator_id)
                ),
            )
            const connnectFormNode = allNodes.find(
                (currentNode) =>
                    currentNode?.data?.indicatorInfo?.id ===
                    indicatorInfo?.atomic_indicator_id,
            )
            if (level >= connnectFormNode.data.level) {
                moveNodeLevelToNext(
                    connnectFormNode,
                    level - connnectFormNode.data.level,
                )
                returningNode(
                    indicatorInfo?.atomic_indicator_id,
                    allNodes,
                    level + 1,
                )
            }
            if (
                selectedIds.includes(indicatorInfo.id) ||
                selectedIds.includes(indicatorInfo?.atomic_indicator_id)
            ) {
                connnectFormNode.replaceData({
                    ...connnectFormNode.data,
                    selectedIds: [indicatorInfo?.atomic_indicator_id],
                })
            }
        } else {
            await loadIndicatorNode(
                indicatorInfo?.atomic_indicator_id,
                level,
                position,
                index,
                fatherIndex,
                indicatorInfo.id,
                selectedIds.includes(indicatorInfo.id) ||
                    selectedIds.includes(indicatorInfo?.atomic_indicator_id)
                    ? [indicatorInfo?.atomic_indicator_id]
                    : [],
            )
        }
        await Promise.all(
            getRestrictTableIds(indicatorInfo).map(async (item, innerIndex) => {
                const currentTableSelectedIds = selectedIds.includes(
                    indicatorInfo.id,
                )
                    ? tableFieldsData[item]
                    : selectedIds.filter((currentSelected) =>
                          tableFieldsData[item]?.includes(currentSelected),
                      )
                if (checkCurrentNodeExist(item, allNodes)) {
                    // 已加载的节点只需要更新连线
                    const connnectFormNode = allNodes.find(
                        (currentNode) =>
                            currentNode?.data?.formData?.id === item,
                    )
                    addDataFormPort(connnectFormNode, tableFieldsData[item])

                    tableFieldsData[item]?.forEach((field) => {
                        addEdge(
                            indicatorInfo.id,
                            field,
                            !!currentTableSelectedIds.includes(field),
                        )
                    })
                    connnectFormNode.replaceData({
                        ...connnectFormNode.data,
                        selectedIds: [
                            ...connnectFormNode.data.selectedIds,
                            ...currentTableSelectedIds,
                        ],
                    })

                    if (level >= connnectFormNode.data.level) {
                        moveNodeLevelToNext(
                            connnectFormNode,
                            level - connnectFormNode.data.level,
                        )
                    }
                } else {
                    await loadDataFormNode(
                        indicatorInfo.refer_view_id,
                        level,
                        position,
                        index + innerIndex + 1,
                        fatherIndex,
                        tableFieldsData[item],
                        indicatorInfo.id,
                        currentTableSelectedIds,
                    )
                }
                return null
            }),
        )
    }

    /**
     * 展开复合指标
     * @param indicatorInfo
     * @param level
     * @param position
     * @param index
     * @param fatherIndex
     */
    const loadCompositeFatherNode = async (
        indicatorInfo,
        level,
        position: {
            x: number
            y: number
        },
        index: number,
        fatherIndex: number,
        allNodes,
        selectedIds: Array<string>,
    ) => {
        const indicatorIds = getExpressIndictors(indicatorInfo.expression)
        await Promise.all(
            indicatorIds.map(async (indicatorId) => {
                if (checkCurrentNodeExist(indicatorId, allNodes)) {
                    const connnectindicatorNode = allNodes.find(
                        (currentNode) =>
                            currentNode?.data?.indicatorInfo?.id ===
                            indicatorId,
                    )
                    if (
                        selectedIds.includes(indicatorInfo.id) ||
                        selectedIds.includes(indicatorId)
                    ) {
                        connnectindicatorNode.replaceData({
                            ...connnectindicatorNode.data,
                            selectedIds: [indicatorId],
                        })
                        addEdge(indicatorInfo.id, indicatorId, true)
                    } else {
                        addEdge(indicatorInfo.id, indicatorId, false)
                    }
                    if (level >= connnectindicatorNode.data.level) {
                        moveNodeLevelToNext(
                            connnectindicatorNode,
                            level - connnectindicatorNode.data.level,
                        )
                        returningNode(indicatorId, allNodes, level + 1)
                    }
                    currentLevelSort(level, position)
                } else {
                    await loadIndicatorNode(
                        indicatorId,
                        level,
                        position,
                        index,
                        fatherIndex,
                        indicatorInfo.id,
                        selectedIds.includes(indicatorInfo.id) ||
                            selectedIds.includes(indicatorId)
                            ? [indicatorId]
                            : [],
                    )
                }
                return null
            }),
        )
    }

    /**
     * 移动到下一个位置
     * @param node
     */
    const moveNodeLevelToNext = (node: Node, count = 1) => {
        const { x, y } = node.position()

        node.position(x - count * (NODEDEFAULTGAP + NODEWIDTH), y)
        node.replaceData({
            ...node.data,
            level: node.data.level + count,
        })
        currentLevelSort(node.data.level + count, {
            x: x - count * (NODEDEFAULTGAP + NODEWIDTH),
            y,
        })
    }

    const loadAutomicFatherNode = async (
        indicatorInfo,
        level,
        position: {
            x: number
            y: number
        },
        index: number,
        fatherIndex: number,
        allNodes,
        selectedIds,
    ) => {
        if (checkCurrentNodeExist(indicatorInfo.refer_view_id, allNodes)) {
            // 已加载的节点只需要更新连线
            const connnectFormNode = allNodes.find(
                (currentNode) =>
                    currentNode?.data?.formData?.id ===
                    indicatorInfo.refer_view_id,
            )

            // 原子指标直接绑定库表表头
            addDataFormPort(connnectFormNode, undefined)
            addEdge(
                indicatorInfo.id,
                indicatorInfo.refer_view_id,
                !!selectedIds.length,
            )
            if (level >= connnectFormNode.data.level) {
                moveNodeLevelToNext(
                    connnectFormNode,
                    level - connnectFormNode.data.level,
                )
            }
            connnectFormNode.replaceData({
                ...connnectFormNode.data,
                selectedIds: selectedIds.includes(indicatorInfo.id)
                    ? [indicatorInfo.id]
                    : selectedIds,
            })
            return
        }
        if (indicatorInfo?.refer_view_id) {
            // 加载事实表
            await loadDataFormNode(
                indicatorInfo.refer_view_id,
                level,
                position,
                index,
                fatherIndex,
                [],
                indicatorInfo.id,
                selectedIds.includes(indicatorInfo.id) ? [] : selectedIds,
            )
        }
    }

    /**
     * 增加复合指标桩
     * @param node
     */
    const addCompositeOutPorts = (node: Node) => {
        const indictorIdList = getExpressIndictors(
            node.data?.indicatorInfo?.expression || '',
        )
        indictorIdList?.forEach((item, index) => {
            node.addPort(
                getPortByNode('leftPorts', calculateCompositePort(index)),
            )
            const port = node.getPorts().pop()
            relationStruct.addPorts({
                nodeId: node.id,
                portId: port?.id || '',
                data: node?.data?.indicatorInfo,
                correlationIds: [item],
                edgeIds: [],
                ids: [node?.data?.indicatorInfo?.id],
            })
        })
    }

    /**
     * 增加衍生指标桩
     * @param node
     */
    const addDeriveOutPorts = (node: Node) => {
        const { where_info } = node.data.indicatorInfo
        const time_restrict = where_info.date_where
        const biz_restrict = where_info.where
        const isSqlMode = where_info.sub_type === 'sql'

        const timeData = isSqlMode ? [] : getRestrictList(time_restrict)

        const bizData = isSqlMode ? [] : getRestrictList(biz_restrict)
        // 连接原子指标的桩
        node.addPort(getPortByNode('leftPorts', calculateDerivePort(0, 1)))
        const indicatorPort = node.getPorts().pop()
        relationStruct.addPorts({
            nodeId: node.id,
            portId: indicatorPort?.id || '',
            data: node?.data?.indicatorInfo,
            correlationIds: [node.data.indicatorInfo.atomic_indicator_id],
            edgeIds: [],
            ids: [node?.data?.indicatorInfo?.id],
        })

        // 时间限定加桩
        timeData?.forEach((item, index) => {
            node.addPort(
                getPortByNode('leftPorts', calculateDerivePort(index + 1, 2)),
            )
            const port = node.getPorts().pop()
            relationStruct.addPorts({
                nodeId: node.id,
                portId: port?.id || '',
                data: node?.data?.indicatorInfo,
                correlationIds: [item.field_id],
                edgeIds: [],
                ids: [node?.data?.indicatorInfo.id],
                type: 'time',
            })
        })
        // 业务限定加桩
        bizData?.forEach((item, index) => {
            node.addPort(
                getPortByNode(
                    'leftPorts',
                    calculateDerivePort(index + timeData.length + 1, 3),
                ),
            )
            const port = node.getPorts().pop()
            relationStruct.addPorts({
                nodeId: node.id,
                portId: port?.id || '',
                data: node?.data?.indicatorInfo,
                correlationIds: [item.field_id],
                edgeIds: [],
                ids: [node?.data?.indicatorInfo.id],
                type: 'biz',
            })
        })
    }

    /**
     * 原子指标加桩
     * @param node
     */
    const addAutomicOutPorts = (node) => {
        // 链接库表的桩
        node.addPort(
            getPortByNode('leftPorts', {
                x: 0,
                y: NODEHEADERY,
            }),
        )
        const port = node.getPorts().pop()
        relationStruct.addPorts({
            nodeId: node.id,
            portId: port.id,
            data: node?.data?.indicatorInfo,
            correlationIds: [node.data?.indicatorInfo.refer_view_id],
            edgeIds: [],
            ids: [node.data?.indicatorInfo.id],
        })
    }
    /**
     * 给上级加桩
     * @param node
     */
    const addLastNodePort = (node: Node) => {
        switch (node.data.type) {
            case TabsKey.ATOMS:
                addAutomicOutPorts(node)
                return []
            case TabsKey.DERIVE:
                addDeriveOutPorts(node)
                return []
            case TabsKey.RECOMBINATION:
                addCompositeOutPorts(node)
                return []
            default:
                return []
        }
    }

    /**
     * 给上级加桩
     * @param node
     */
    const addNextNodePort = (
        node: Node,
        type,
        fieldIds: Array<string> = [],
    ) => {
        if (type === IndicatorNodeType.DATAFORMNODE) {
            // 字段加桩
            addDataFormPort(node, fieldIds)
        } else {
            node.addPort(
                getPortByNode('rightPorts', {
                    x: NODEWIDTH,
                    y: NODEHEADERY,
                }),
            )
            const port = node.getPorts().pop()
            relationStruct.addPorts({
                nodeId: node.id,
                portId: port?.id || '',
                data: node?.data?.indicatorInfo,
                correlationIds: [],
                ids: [node?.data?.indicatorInfo.id],
                edgeIds: [],
            })
        }
    }

    /**
     * 加载数据表桩
     * @param node
     * @param fieldIds
     */
    const addDataFormPort = (node: Node, fieldIds) => {
        addDataFormPorts(node, fieldIds, 0, relationStruct)
    }
    /**
     * 加载父节点表
     * @param node
     */
    const loadFatherNode = async (node: Node) => {
        if (graphCase && graphCase.current) {
            const allNodes = relationStruct.nodes
            const currentNodeType = node.data.type
            const { indicatorInfo, level, index } = node.data
            const { x, y } = node.position()
            const firstFatherPosition = allNodes.filter(
                (currentNode) => currentNode.data.level === node.data.level + 1,
            )
            addLastNodePort(node)

            switch (currentNodeType) {
                // 展开原子指标
                case TabsKey.ATOMS:
                    await loadAutomicFatherNode(
                        indicatorInfo,
                        level + 1,
                        {
                            x: x - (NODEDEFAULTGAP + NODEWIDTH),
                            y,
                        },
                        firstFatherPosition.length,
                        index,
                        allNodes,
                        node.data.selectedIds,
                    )
                    break
                // 展开衍生指标
                case TabsKey.DERIVE:
                    await loadDeriveFatherNode(
                        indicatorInfo,
                        level + 1,
                        {
                            x: x - (NODEDEFAULTGAP + NODEWIDTH),
                            y,
                        },
                        firstFatherPosition.length,
                        index,
                        allNodes,
                        node.data.selectedIds,
                    )
                    break
                // 展开复合指标
                case TabsKey.RECOMBINATION:
                    await loadCompositeFatherNode(
                        indicatorInfo,
                        level + 1,
                        {
                            x: x - (NODEDEFAULTGAP + NODEWIDTH),
                            y,
                        },
                        firstFatherPosition.length,
                        index,
                        allNodes,
                        node.data.selectedIds,
                    )
                    break
                default:
                    break
            }
        }
    }

    /**
     *  初始化context
     */
    const conTextvalue = useMemo(
        () => ({
            graphCase: graphCase.current || null,
            relationStruct,
            loadFatherNode,
            onSelectedIndictor: (indicatorDetail: any) => {
                setIndictorDetail(indicatorDetail)
                setLogicViewId('')
                setDetailVisible(true)
            },
            onSelectedDataView: (dataViewId: string) => {
                setIndictorDetail(null)
                setLogicViewId(dataViewId)
                setDetailVisible(true)
            },
        }),
        [graphCase.current],
    )

    /**
     * 父节点重新排序
     * @param level
     * @param position
     */
    const currentLevelSort = (level, position) => {
        if (graphCase && graphCase.current) {
            const allNodes = relationStruct.nodes
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
                    const height = getCurrentNodeHeight(
                        currentNode.data,
                        currentNode.data.type,
                    )
                    const currentPosition = currentNode.position()
                    currentNode.position(currentPosition.x, initY + index * 42)
                    initY += height
                })
            }
        }
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
            const height = getCurrentNodeHeight(
                currentNode.data,
                currentNode.data.type,
            )
            allHeight += height
        })
        const { x, y } = firstFatherNode.position()
        const fatherHeight = getCurrentNodeHeight(
            firstFatherNode.data,
            firstFatherNode.data.type,
        )

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
            const allNodes = relationStruct.nodes
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
                // targetNode.addPort(
                //     getPortByNode('rightPorts', -1, '', targetNode.data.expand),
                // )
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
                    // originNode.addPort(getPortByNode(position, -1, '', expand))
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
            // node.addPort(getPortByNode(group, currentPageIndex))
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
            // node.addPort(getPortByNode(group, -1, 'top'))
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
        // node.addPort(
        //     getPortByNode(
        //         group,
        //         -1,
        //         'bottom',
        //         ExpandStatus.Expand,
        //         'field',
        //         showData.length,
        //     ),
        // )
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
        // node.addPort(getPortByNode(position, -1, '', ExpandStatus.Retract))
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
            const allNodes = relationStruct.nodes
            if (allNodes.length > 1) {
                const levelSortNodes = assemblyUpdataData(allNodes)
                Object.keys(levelSortNodes).forEach((key) => {
                    if (Number(key) < Object.keys(levelSortNodes).length) {
                        levelSortNodes[key].forEach((currentNode) => {
                            const { x, y } = currentNode.position()
                            currentLevelSort(currentNode.data.level + 1, {
                                x: x - (NODEDEFAULTGAP + NODEWIDTH),
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
                        setDetailVisible(false)
                        if (optionType !== OptionType.NoOption) {
                            setOptionType(OptionType.NoOption)
                            setEditBusinessFormId('')
                            setViewBusinessField(null)
                        }
                    }}
                >
                    <IndicatorContext.Provider value={conTextvalue}>
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
                    </IndicatorContext.Provider>

                    <div
                        style={{
                            position: 'absolute',
                            right: detailVisible ? '664px' : '24px',
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
                    <div
                        style={{
                            position: 'absolute',
                            left: '30px',
                            bottom: '24px',
                        }}
                    >
                        <ConventionalSigns />
                    </div>
                </div>
            </div>
            <div>
                {detailVisible ? (
                    indictorDetail ? (
                        <IndicatorView
                            IndicatorId={indictorDetail.id}
                            type={indictorDetail.indicator_type}
                            onClose={() => {
                                setDetailVisible(false)
                            }}
                            isConsanguinity
                            style={detailStyle}
                        />
                    ) : (
                        <LogicDetailView
                            id={logicViewId}
                            onClose={() => {
                                setDetailVisible(false)
                            }}
                            isConsanguinity
                            style={detailStyle}
                        />
                    )
                ) : (
                    <div className={styles.detailBtnWrapper}>
                        <span
                            onClick={() => {
                                setDetailVisible(true)
                            }}
                            className={styles.icon}
                        >
                            <LeftOutlined />
                        </span>
                        <span>
                            {indictorDetail
                                ? __('查看指标详情')
                                : __('查看元数据库表详情')}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default IndicatorConsanguinity
