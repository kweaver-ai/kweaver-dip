import {
    CloseOutlined,
    DownOutlined,
    InfoCircleFilled,
    UpOutlined,
} from '@ant-design/icons'
import { Graph, Node, Platform, StringExt } from '@antv/x6'
import { Spin, Table, Tooltip, message } from 'antd'
import React, {
    createContext,
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'

import { Dnd } from '@antv/x6-plugin-dnd'
import { Keyboard } from '@antv/x6-plugin-keyboard'
import { Selection } from '@antv/x6-plugin-selection'
import {
    useBoolean,
    useDebounce,
    useGetState,
    useSetState,
    useSize,
} from 'ahooks'
import lodash, { last, omit } from 'lodash'
import { useNavigate } from 'react-router-dom'
import dataEmpty from '@/assets/dataEmpty.svg'
import graphEmpty from '@/assets/graphEmpty2.svg'
import { stateType } from '@/components/DatasheetView/const'
import AiDialog from '@/components/SceneAnalysis/AiDialog'
import { CongSearchProvider } from '@/components/SceneAnalysis/AiSearchProvider'
import {
    IFormula,
    LogicViewType,
    formatError,
    getDatasheetViewDetails,
    getErrorMessage,
    getSubjectDomainDetail,
    getUserDatasheetViewDetails,
    messageError,
    postDataViewLogicView,
    postSceneDataView,
    putDataViewLogicView,
    putSceneDataView,
    querySceneAnalysisDetail,
    runSceneView,
    saveSceneCanvas,
} from '@/core'
import {
    instancingGraph,
    sceneConnector,
    sceneEdgeConfig,
} from '@/core/graph/graph-config'
import { X6PortalProvider } from '@/core/graph/helper'
import { Plugins, loadPlugins } from '@/core/graph/plugin'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
    ListDefaultPageSize,
    ListPageSizerOptions,
    ListType,
    Watermark,
} from '@/ui'
import Empty from '@/ui/Empty'
import { OperateType, getSource, useQuery } from '@/utils'
import { info as modalInfo } from '@/utils/modalHelper'
import { BusinessDomainType } from '../BusinessDomain/const'
import Confirm from '../Confirm'
import { ClassifyType } from '../DatasheetView/const'
import EditBasicInfoModal from '../DatasheetView/EditBasicInfoModal'
import DragVeticalBox from '../DragVeticalBox'
import { storeExampleData } from '../SCustomView/helper'
import AddBatchView from './AddBatchView'
import ComparisionResult from './ComparsionResult'
import {
    ExcutionType,
    FieldTypes,
    FormulaType,
    ModeType,
    ModuleType,
    NodeDataType,
    formulaInfo,
} from './const'
import EditNodeName from './EditNodeName'
import { FieldsData } from './FieldsData'
import GraphHeader from './GraphHeader'
import {
    changeTypeToLargeArea,
    createNodeInGraph,
    createNodeInGraphByAi,
    getNewNodePosition,
    getPortsByType,
    getPreorderNode,
    getRunViewParam,
    loopCalculationNodeData,
    sceneAlsDataType,
    sceneAnalFormatError,
    trackingCalculationAll,
    useSceneGraphContext,
} from './helper'
import __ from './locale'
import SceneNode from './SceneNode'
import styles from './styles.module.less'
import CatalogFormula from './UnitForm/CatalogFormula'
import CiteViewFormula from './UnitForm/CiteViewFormula'
import CompareFormula from './UnitForm/CompareFormula'
import DistinctFormula from './UnitForm/DistinctFormula'
import IndicatorFormula from './UnitForm/IndicatorFormula'
import JoinFormula from './UnitForm/JoinFormula'
import LogicalViewFormula from './UnitForm/LogicalViewFormula'
import MergeFormula from './UnitForm/MergeFormula'
import OutputViewFormula from './UnitForm/OutputViewFormula'
import SelectFormula from './UnitForm/SelectFormula'
import WhereFormula from './UnitForm/WhereFormula'
import './x6Style.less'

let waitForUnmount: Promise<any> = Promise.resolve()

export const SceneGraphContext = createContext({})
/**
 * @interface ISceneGraph
 * @param {any[]} moreData 更多属性中编辑的信息（分类分级、标准、码表）
 */
interface ISceneGraph {
    ref?: any
    mode?: ModeType
    setMode?: (mode: ModeType) => void
    moreData?: any[]
}
const SceneGraph: React.FC<ISceneGraph> = forwardRef((props: any, ref) => {
    const { mode, setMode, moreData } = props
    const { getDeletable, setDeletable } = useSceneGraphContext()
    const navigator = useNavigate()
    const query = useQuery()
    const operate = query.get('operate') || ''
    const module: ModuleType =
        (query.get('module') as ModuleType) || ModuleType.SceneAnalysis
    // 场景Id
    const sceneId = query.get('sceneId') || ''
    // 库表Id
    const viewId = query.get('viewId') || ''
    // 业务对象/活动Id
    const objId = query.get('objId') || ''
    // 逻辑实体Id
    const entityId = query.get('entityId') || ''
    const graphCase = useRef<Graph>()
    const dndCase = useRef<Dnd>()
    const graphBody = useRef<HTMLDivElement>(null)
    const container = useRef<HTMLDivElement>(null)
    const content = useRef<HTMLDivElement>(null)
    const dndContainer = useRef<HTMLDivElement>(null)
    const size = useSize(content)
    const [nodeAddPosition, setNodeAddPosition, getNodeAddPosition] =
        useGetState<{ x: number; y: number } | undefined>()
    const [loading, setLoading] = useState(true)
    const [isDrag, setIsDrag, getDrag] = useGetState(false)
    const [open, { setTrue, setFalse }] = useBoolean(false)

    // 拖拽添加节点
    const [currentDndNode, setCurrentDndNode, getCurrentDndNode] =
        useGetState<any>(null)
    // 画布缩放大小
    const [graphSize, setGraphSize] = useState(100)
    // 节点内操作类型
    const [optionType, setOptionType, getOptionType] = useGetState<FormulaType>(
        FormulaType.NONE,
    )
    const [dragExpand, setDragExpand] = useState<boolean>(false)
    // 分割大小
    const [defaultSize, setDefaultSize, getDefaultSize] = useGetState<
        Array<number>
    >([100, 0])
    // 页面存在状态 false-缺省图
    const [pageStatus, setPageStatus, getPageStatus] =
        useGetState<boolean>(true)
    // 场景信息
    const [sceneData, setSceneData] = useState<any>()

    // 编辑名称的节点
    const [editNameNode, setEditNameNode, getEditNameNode] =
        useGetState<Node<Node.Properties>>()
    // 操作的节点
    const [editNode, setEditNode, getEditNode] =
        useGetState<Node<Node.Properties>>()
    // 选中的算子
    const [selectedFormula, setSelectedFormula, getSelectedFormula] =
        useGetState<IFormula>()
    const [selectedIndex, setSelectedIndex, getSelectedIndex] =
        useGetState<number>(0)
    // 待删除节点
    const [deleteNode, setDeleteNode] = useState<Node<Node.Properties>>()
    const [fetching, setFetching] = useState(false)
    const [tableFetching, setTableFetching] = useState(false)
    // 执行节点
    const [runNode, setRunNode, getRunNode] = useGetState<Node>()
    // 执行分页
    const [runOffset, setRunOffset] = useState<number>(1)
    // 执行limit
    const [runPageSize, setRunPageSize] = useState<number>(20)
    // 执行结果表头
    const [runColumns, setRunColumns] = useState<any[]>([])
    // 执行结果数据
    const [runList, setRunList] = useState<any[]>([])
    // 执行结果总数
    const [runTotal, setRunTotal] = useState<number>()
    // 执行结果错误
    const [errorMsg, setErrorMsg] = useState<any>()
    // 节点移动中
    const [nodeMoved, setNodeMoved] = useState(false)
    // 画布是否能保存
    const [canSave, setCanSave] = useState<boolean>(
        module === ModuleType.SceneAnalysis,
    )
    // 库表完善信息
    const [logicViewBasicInfoVisible, setLogicViewBasicInfoVisible] =
        useState<boolean>(false)
    // 库表信息
    const [viewData, setViewData] = useState<any>()

    const [aiOpen, setAiOpen] = useState(false)
    const [isDialogClick, setIsDialogClick] = useState(false)

    const [userInfo] = useCurrentUser()
    // 输出字段列表
    const [outFields, setOutFields] = useState<any[]>([])

    // 字段数据
    const fieldsData = useMemo(() => {
        return new FieldsData()
    }, [])

    // 执行类型
    const [excutionType, setExcutionType] = useState<ExcutionType>()
    // 数据对比算子执行参数
    const [compareProps, setCompareProps] = useSetState<Record<string, any>>({})

    useEffect(() => {
        if (
            canSave &&
            operate === 'edit' &&
            (module === ModuleType.CustomView ||
                module === ModuleType.LogicEntityView)
        ) {
            setMode(ModeType.More)
        }
    }, [canSave])

    useMemo(() => {
        const promise = new Promise((resolve) => {
            waitForUnmount.then(() => {
                // 注册链接器
                Graph.registerConnector('curveConnector', sceneConnector, true)
                // 注册边的样式
                Graph.registerEdge(
                    'data-scene-edge',
                    { ...sceneEdgeConfig },
                    true,
                )
                return () => {
                    unRegistryPort()
                }
            })
        })
        waitForUnmount = promise
    }, [])

    const contextValue = useMemo(() => {
        return { setAiOpen, setIsDialogClick }
    }, [])

    useImperativeHandle(ref, () => ({
        getData: () => {
            let outputFields
            if (graphCase.current) {
                graphCase.current.getNodes().forEach((info) => {
                    const { formula } = info.data
                    const formulaItem = formula.find(
                        (item) => item.type === FormulaType.OUTPUTVIEW,
                    )
                    if (formulaItem) {
                        outputFields = formulaItem?.config.config_fields
                    }
                })
            }
            outputFields = outputFields.map((a) => {
                const findItem = fieldsData.data.find((b) => b.id === a.id)
                // 编辑时查找输出字段信息
                const editItem = outFields.find((item) => item.id === a.outId)
                const fieldInfos = operate === 'edit' ? editItem : {}
                const type =
                    module === ModuleType.LogicEntityView ? a.data_type : a.type
                return {
                    ...a,
                    ...findItem,
                    id: a.outId,
                    business_name: a.alias,
                    data_type: type,
                    technical_name: a.name_en,
                    classfity_type: ClassifyType.Manual,
                    ...fieldInfos,
                }
            })
            return outputFields
        },
        sceneData,
    }))

    // 注销画布注册的桩
    const unRegistryPort = () => {
        Graph.unregisterConnector('curveConnector')
        Graph.unregisterEdge('data-scene-edge')
    }

    // 注册场景节点
    SceneNode([
        () => optionGraphData,
        () => showAllGraphSize,
        () => editFormName,
        () => runGraph,
        () => refreshOptionGraphData,
        () => handleDeleteCells,
        () => runCompareGraph,
    ])

    const debouncedGraphSize = useDebounce(graphSize, { wait: 400 })

    useEffect(() => {
        getEnumConfig()
        setDragExpand(false)
        const graph = instancingGraph(container.current, {
            background: {
                color: '#F6F9FB',
            },
            embedding: false,
            interacting: true,
            scaling: {
                min: 0.2,
                max: 4,
            },
            connecting: {
                allowBlank: false,
                allowLoop: false,
                allowNode: false,
                allowEdge: false,
                highlight: true,
                connectionPoint: 'anchor',
                snap: true,
                sourceAnchor: {
                    name: 'left',
                    args: {
                        dx: (Platform.IS_SAFARI ? 4 : 8) + 4,
                    },
                },
                targetAnchor: {
                    name: 'right',
                    args: {
                        dx: (Platform.IS_SAFARI ? 4 : -8) - 8,
                    },
                },
                createEdge() {
                    return graph?.createEdge({
                        shape: 'data-scene-edge',
                        zIndex: -1,
                    })
                },
                // 连接桩校验
                validateConnection({ targetPort, sourcePort }) {
                    // 只能从输出链接桩创建连接
                    if (!sourcePort || !sourcePort.includes('out')) {
                        return false
                    }
                    // 只能连接到输入链接桩
                    if (!targetPort || !targetPort.includes('in')) {
                        return false
                    }
                    return true
                },
            },
            highlighting: {
                magnetAdsorbed: {
                    name: 'className',
                    args: {
                        className: 'x6-highlighted',
                    },
                },
            },
            mousewheel: {
                enabled: true,
                modifiers: ['ctrl', 'meta'],
                guard(this: any, e) {
                    const wheelEvent = this
                    if (graph) {
                        const showSize = graph.zoom() * 100
                        if (showSize <= 20 && wheelEvent.wheelDelta < 0) {
                            return false
                        }
                        if (showSize >= 400 && wheelEvent.wheelDelta > 0) {
                            return false
                        }
                        return true
                    }
                    return false
                },
            },
        })
        if (graph) {
            loadPlugins(graph, [Plugins.Scroller, Plugins.Export])
            graph.use(
                new Selection({
                    enabled: true,
                    multiple: false,
                }),
            )
            graph.use(
                new Keyboard({
                    enabled: true,
                    global: true,
                }),
            )
            graphCase.current = graph
            dndCase.current = new Dnd({
                target: graph,
                scaled: false,
                dndContainer: dndContainer.current || undefined,
                getDragNode: (node) => node.clone({ keepId: true }),
                getDropNode: (node) => node.clone({ keepId: true }),
            })

            // 画布缩放
            graph.on('scale', ({ sx, sy, ox, oy }) => {
                setGraphSize(graph.zoom() * 100)
            })

            // 边鼠标移入
            graph.on('edge:mouseover', ({ edge }) => {
                edge.attr('line/stroke', 'rgba(18,110,227,0.65)')
            })

            // 边鼠标移出
            graph.on('edge:mouseleave', ({ edge }) => {
                const cells = graph.getSelectedCells()
                if (cells.length > 0 && cells[0].id === edge.id) {
                    return
                }
                edge.attr('line/stroke', '#BFBFBF')
            })

            // 边选中
            graph.on('edge:selected', ({ edge }) => {
                edge.addTools([
                    {
                        name: 'button-remove', // 工具名称
                        args: {
                            // 工具对应的参数
                            x: 0,
                            y: 0,
                        },
                    },
                ])
                edge.attr('line/stroke', 'rgba(18,110,227,0.65)')
            })

            // 边取消选中
            graph.on('edge:unselected', ({ edge }) => {
                edge.removeTools()
                edge.attr('line/stroke', '#BFBFBF')
            })

            // 连线变更
            graph.on('edge:connected', async ({ isNew, edge }) => {
                const sourceNode = edge.getSourceNode()
                const targetNode = edge.getTargetNode()
                const { type } = targetNode?.data?.formula[0] || ''
                // 根据算子类型规范线
                switch (type) {
                    case FormulaType.FORM:
                        messageError(__('引用库表算子不能接入连线'))
                        graph.removeCell(edge.id)
                        return
                    case FormulaType.JOIN:
                        if (targetNode?.data.src.length >= 2) {
                            messageError(
                                __('数据关联算子前仅存在两个节点的数据输入'),
                            )
                            graph.removeCell(edge.id)
                            return
                        }
                        break
                    case FormulaType.WHERE:
                    case FormulaType.INDICATOR:
                    case FormulaType.SELECT:
                    case FormulaType.DISTINCT:
                        if (targetNode?.data.src.length >= 1) {
                            messageError(
                                `${formulaInfo[type].name}${__(
                                    '算子前只能存在一个节点的数据输入',
                                )}`,
                            )
                            graph.removeCell(edge.id)
                            return
                        }
                        break
                    default:
                        // if (targetNode?.data.src.length >= 2) {
                        //     messageError(__('最多存在两个节点的数据输入'))
                        //     graph.removeCell(edge.id)
                        //     return
                        // }
                        break
                }
                if (sourceNode && targetNode) {
                    // 检查环
                    const preSor: Node[] = getPreorderNode(
                        graph.getNodes(),
                        sourceNode,
                    )
                    const preTag: Node[] = getPreorderNode(
                        graph.getNodes(),
                        targetNode,
                    )
                    const isRepeat = !preSor.every(
                        (info) => !preTag.includes(info),
                    )
                    if (isRepeat) {
                        messageError(
                            __('一个节点不能通过多条路径连接到同一个节点'),
                        )
                        graph.removeCell(edge.id)
                        return
                    }
                    let srcArr = targetNode.data.src
                    const { id } = sourceNode
                    if (srcArr.indexOf(id) === -1) {
                        srcArr = [...srcArr, id]
                    }
                    const nodes = graph.getNodes().map((info) => {
                        if (info.id === targetNode.id) {
                            const nodeInfo = targetNode.toJSON()
                            return {
                                ...nodeInfo,
                                data: { ...nodeInfo.data, src: srcArr },
                            }
                        }
                        return info.toJSON()
                    })
                    const isRing = !nodes
                        .map((info) => getPreorderNode(nodes, info))
                        .every((info) => {
                            const temp = info.filter(
                                (a, idx) => info.indexOf(a) === idx,
                            )
                            return temp.length === info.length
                        })
                    if (isRing) {
                        messageError(
                            __('一个节点不能通过多条路径连接到自身节点'),
                        )
                        graph.removeCell(edge.id)
                        return
                    }
                    const preSorFormId = preSor
                        .map(
                            (info) => info?.data?.formula?.[0]?.config?.form_id,
                        )
                        .filter((info) => !!info)
                    const preTagFormId = preTag
                        .map(
                            (info) => info?.data?.formula?.[0]?.config?.form_id,
                        )
                        .filter((info) => !!info)
                    if (
                        preSorFormId.some((info) =>
                            preTagFormId.includes(info),
                        ) &&
                        type === FormulaType.MERGE
                    ) {
                        messageError(
                            __('数据合并算子不能同时关联两个来源相同的库表'),
                        )
                        graph.removeCell(edge.id)
                        return
                    }

                    // 添加src
                    targetNode.replaceData({
                        ...targetNode.data,
                        src: srcArr,
                    })
                    refreshOptionGraphData(targetNode, getSelectedIndex())
                    // 连接桩填充
                    const rightPort = sourceNode.getPorts().find((port) => {
                        return port?.group === 'out'
                    })
                    if (rightPort && rightPort.id) {
                        sourceNode.setPortProp(rightPort.id, 'attrs/point', {
                            fill: '#BFBFBF',
                            stroke: '#BFBFBF',
                            magnet: true,
                        })
                    }
                    const leftport = targetNode.getPorts().find((port) => {
                        return port?.group === 'in'
                    })
                    if (leftport && leftport.id) {
                        targetNode.setPortProp(leftport.id, 'attrs/point', {
                            fill: '#BFBFBF',
                            stroke: '#BFBFBF',
                            magnet: true,
                        })
                    }
                }
            })

            // 连线删除
            graph.on('edge:removed', async ({ edge }) => {
                const sourceNodeId: any = (edge.getSource() as any).cell
                const targetNode: any = graph.getCellById(
                    (edge.getTarget() as any).cell,
                )
                const edges = graph.getEdges()
                if (
                    edges.find(
                        (e: any) =>
                            e.source?.port === (edge as any).source.port &&
                            e.target.port === (edge as any).target.port &&
                            e.id !== edge.id,
                    )
                ) {
                    return
                }
                if (targetNode) {
                    // 去掉src
                    targetNode.replaceData({
                        ...targetNode.data,
                        src: targetNode.data.src.filter(
                            (item) => item !== sourceNodeId,
                        ),
                    })
                    refreshOptionGraphData(targetNode, getSelectedIndex())
                }
                // 连接桩空心
                const sourceNode = graph.getCellById(sourceNodeId) as Node
                const rightPort = sourceNode?.getPorts().find((port) => {
                    return port?.group === 'out'
                })
                const leftport = targetNode?.getPorts().find((port) => {
                    return port?.group === 'in'
                })
                if (
                    rightPort &&
                    rightPort.id &&
                    !edges.find((e: any) => e.source.port === rightPort.id)
                ) {
                    sourceNode.setPortProp(rightPort.id, 'attrs/point', {
                        fill: '#fff',
                        stroke: '#BFBFBF',
                        magnet: true,
                    })
                }
                if (
                    leftport &&
                    leftport.id &&
                    !edges.find((e: any) => e.target.port === leftport.id)
                ) {
                    const { formula } = targetNode.data
                    if (formula[0]?.type === FormulaType.FORM) {
                        return
                    }
                    targetNode.setPortProp(leftport.id, 'attrs/point', {
                        fill: '#fff',
                        stroke: '#BFBFBF',
                        magnet: true,
                    })
                }
            })

            // 节点添加
            graph.on('node:added', ({ node }) => {
                if (!getPageStatus()) {
                    setPageStatus(true)
                }
                if (getDrag()) {
                    const sceneNodes = graphCase.current?.getNodes() || []
                    optionGraphData(
                        node,
                        sceneNodes.length - 1,
                        node.data.formula[0],
                    )
                }
                if (node.shape === 'scene-analysis-node') {
                    if (getCurrentDndNode()) {
                        node.removePorts()
                        node.addPorts(
                            getPortsByType(node.id, NodeDataType.JOIN),
                        )
                        setCurrentDndNode(null)
                    } else {
                        const { formula } = node.data
                        // 第一个算子是业务表 去掉左边连接点
                        const ports = node.getPorts() || []
                        const leftport = ports.find((port) => {
                            return port?.group === 'in'
                        })
                        if (leftport && leftport.id) {
                            if (
                                formula &&
                                formula[0] &&
                                formula[0].type === FormulaType.FORM
                            ) {
                                node.setPortProp(leftport.id, 'attrs/wrap', {
                                    fill: 'none',
                                    magnet: false,
                                })
                                node.setPortProp(leftport.id, 'attrs/point', {
                                    fill: 'none',
                                    stroke: 'none',
                                    magnet: true,
                                })
                            } else {
                                node.setPortProp(leftport.id, 'attrs/wrap', {
                                    fill: 'transparent',
                                    magnet: true,
                                })
                                node.setPortProp(leftport.id, 'attrs/point', {
                                    fill: '#fff',
                                    stroke: '#BFBFBF',
                                    magnet: true,
                                })
                            }
                        }
                        // 最后一个算子是输出库表 去掉右边连接点
                        const rightport = ports.find((port) => {
                            return port?.group === 'out'
                        })
                        if (rightport && rightport.id) {
                            if (
                                formula &&
                                formula.length > 0 &&
                                formula[formula.length - 1].type ===
                                    FormulaType.OUTPUTVIEW
                            ) {
                                node.setPortProp(rightport.id, 'attrs/wrap', {
                                    fill: 'none',
                                    magnet: false,
                                })
                                node.setPortProp(rightport.id, 'attrs/point', {
                                    fill: 'none',
                                    stroke: 'none',
                                    magnet: true,
                                })
                            } else {
                                node.setPortProp(rightport.id, 'attrs/wrap', {
                                    fill: 'transparent',
                                    magnet: true,
                                })
                                node.setPortProp(rightport.id, 'attrs/point', {
                                    fill: '#fff',
                                    stroke: '#BFBFBF',
                                    magnet: true,
                                })
                            }
                        }
                    }
                    container.current?.focus()
                    graph.select(node)
                }
            })

            // 节点删除
            graph.on('node:removed', ({ node }) => {
                if (graph.getNodes().length === 0) {
                    setPageStatus(false)
                }
            })

            graph.on('node:mousemove', (ev) => {
                setNodeMoved(true)
            })

            graph.on('node:mouseup', (ev) => {
                setTimeout(() => {
                    setNodeMoved(false)
                }, 200)
            })

            graph.on('node:selected', ({ node }) => {
                graph.getNodes().forEach((n) => {
                    if (node.id !== n.id) {
                        n.replaceData({ ...n.data, selected: false })
                    } else {
                        n.replaceData({ ...n.data, selected: true })
                    }
                })
                if (getEditNode() && node.id !== getEditNode()?.id) {
                    handleOptionClose(false)
                }
            })

            // 键盘删除选中节点
            graph.bindKey('backspace', () => {
                handleDeleteCells()
            })

            // 键盘删除选中节点
            graph.bindKey('delete', () => {
                handleDeleteCells()
            })
        }

        getContent()
        // movedToCenter()
        // graphCase.current?.zoomTo(100)
        // showAllGraphSize()
    }, [])

    // 删除节点
    const handleDeleteCells = (n?: Node) => {
        if (!graphCase.current || getEditNameNode()) return
        if (!getDeletable()) return
        const cells = n ? [n] : graphCase.current.getSelectedCells()
        if (cells.length > 0) {
            if (cells[0].isNode()) {
                if (cells[0]?.data?.formula.length === 0) {
                    handleDeleteNodeOk(cells[0])
                } else {
                    if (
                        last(cells[0]?.data?.formula as IFormula[])?.type ===
                        FormulaType.OUTPUTVIEW
                    ) {
                        return
                    }
                    setDeleteNode(cells[0])
                }
            } else {
                graphCase.current.removeCells(cells)
            }
        } else {
            const node = graphCase.current
                .getNodes()
                .find((info) => info?.data?.selected)
            if (node?.data?.formula.length === 0) {
                handleDeleteNodeOk(node)
            } else {
                if (
                    last(cells[0]?.data?.formula as IFormula[])?.type ===
                    FormulaType.OUTPUTVIEW
                ) {
                    return
                }
                setDeleteNode(node)
            }
        }
    }

    // 删除节点后处理
    const handleDeleteNodeOk = (node?: Node) => {
        if (!graphCase?.current) {
            return
        }
        const tempDel = node || deleteNode
        if (tempDel) {
            if (tempDel.id === editNode?.id) {
                handleOptionClose(false)
            }
            if (tempDel.id === runNode?.id) {
                setRunNode(undefined)
            }
            graphCase.current?.removeNode(tempDel)
        }
        setDeleteNode(undefined)
    }

    // 获取枚举值
    const getEnumConfig = () => {
        fieldsData.dataType = sceneAlsDataType
    }

    // 获取库表字段
    const getLogicViewFields = async (): Promise<any> => {
        try {
            const details = await getDatasheetViewDetails(viewId)
            setOutFields(details?.fields || [])
            // TODO 类型调整
            const fields =
                details?.fields
                    ?.filter(
                        (item) =>
                            changeTypeToLargeArea(item.data_type) !==
                                FieldTypes.BINARY &&
                            item.data_type !== null &&
                            item.data_type !== '',
                    )
                    ?.map((item) => ({
                        outId: item.id,
                        primary_key: item?.primary_key ?? false,
                        alias: item.business_name,
                        name_en: item.technical_name,
                        type:
                            sceneAlsDataType.find(
                                (t) => `${t.id}` === item?.standard_type,
                            )?.value_en ||
                            changeTypeToLargeArea(item.data_type),
                        dict_id: item?.code_table_id || undefined,
                        dict_name: item?.code_table || undefined,
                        dict_deleted: item?.code_table_status === 'deleted',
                        dict_state:
                            item?.code_table_status === 'disable'
                                ? 'disable'
                                : 'enable',
                        standard_code: item?.standard_code || undefined,
                        standard_name: item?.standard || undefined,
                        standard_deleted: item?.standard_status === 'deleted',
                        standard_state:
                            item?.standard_status === 'disable'
                                ? 'disable'
                                : 'enable',
                        editError: [],
                        // attribute_id: item.attribute_id,
                        // attribute_name: item.attribute_name,
                        // attribute_path: item.attribute_path,
                        // label_id: item.label_id,
                        // label_name: item.label_name,
                        // label_icon: item.label_icon,
                        // label_path: item.label_path,
                        // classfity_type: ClassifyType.Manual,
                        // business_timestamp: item.business_timestamp,
                    })) || []
            return Promise.resolve(fields)
        } catch (err) {
            formatError(err)
            return Promise.resolve(undefined)
        }
    }

    // 获取场景分析内容
    const getContent = async () => {
        if (!graphCase || !graphCase.current) {
            setLoading(false)
            return
        }
        try {
            setLoading(true)
            if (module === ModuleType.SceneAnalysis && !sceneId) {
                setPageStatus(false)
            } else {
                // let outViewData: any[] = []
                // let attrsData: any[] = []
                let res: any = {}
                if (module === ModuleType.SceneAnalysis) {
                    res = await querySceneAnalysisDetail(sceneId)
                } else if (operate === OperateType.EDIT) {
                    const [
                        // { value: fieldsRes },
                        { value: sceneRes },
                    ]: // { value: viewRes },
                    // { value: attrsRes },
                    any = await Promise.allSettled([
                        // getLogicViewFields(),
                        querySceneAnalysisDetail(sceneId),
                        // getDataViewBaseInfo(viewId),
                        // module === ModuleType.LogicEntityView
                        //     ? getLogicalData(objId, entityId)
                        //     : null,
                    ])
                    // outViewData = fieldsRes
                    // attrsData = attrsRes
                    res = {
                        ...sceneRes,
                        // name: viewRes?.business_name,
                        // technical_name: viewRes?.technical_name,
                    }
                }
                setSceneData(res)
                const { canvas, config } = res
                if (!canvas && operate === OperateType.CREATE) {
                    initGraph()
                } else {
                    if (!canvas || canvas === '[]' || !config) {
                        if (!canvas || canvas === '[]') {
                            setPageStatus(false)
                        }
                        const cellsData = JSON.parse(canvas || '[]')
                        await graphCase.current.fromJSON({ cells: cellsData })
                    } else {
                        const tempNodes = JSON.parse(config!)
                        const tempCanvas = JSON.parse(canvas!)
                        const nodes = tempNodes.map((a) => {
                            const findItem = tempCanvas.find(
                                (b) => b.id === a.id,
                            )
                            return {
                                ...findItem,
                                data: {
                                    name: a.name,
                                    src: a.src,
                                    formula: a.formula,
                                    // formula: a.formula.map((f) => {
                                    //     if (f.type === FormulaType.OUTPUTVIEW) {
                                    //         const { config_fields } = f.config
                                    //         if (
                                    //             module === ModuleType.CustomView
                                    //         ) {
                                    //             return {
                                    //                 ...f,
                                    //                 config: {
                                    //                     ...f.config,
                                    //                     config_fields:
                                    //                         config_fields.map(
                                    //                             (item) => {
                                    //                                 const fieldItem =
                                    //                                     outViewData.find(
                                    //                                         (
                                    //                                             c,
                                    //                                         ) =>
                                    //                                             c.outId ===
                                    //                                             item.outId,
                                    //                                     )
                                    //                                 if (
                                    //                                     fieldItem
                                    //                                 ) {
                                    //                                     return {
                                    //                                         ...item,
                                    //                                         ...fieldItem,
                                    //                                     }
                                    //                                 }
                                    //                                 return item
                                    //                             },
                                    //                         ),
                                    //                 },
                                    //             }
                                    //         }
                                    //         return {
                                    //             ...f,
                                    //             config: {
                                    //                 ...f.config,
                                    //                 config_fields:
                                    //                     attrsData.map(
                                    //                         (item) => {
                                    //                             const fieldItem =
                                    //                                 config_fields.find(
                                    //                                     (c) =>
                                    //                                         c.attrId ===
                                    //                                         item.attrId,
                                    //                                 )
                                    //                             if (fieldItem) {
                                    //                                 if (
                                    //                                     item.canChanged
                                    //                                 ) {
                                    //                                     const fieldItem2 =
                                    //                                         outViewData.find(
                                    //                                             (
                                    //                                                 c,
                                    //                                             ) =>
                                    //                                                 c.outId ===
                                    //                                                 fieldItem.outId,
                                    //                                         )
                                    //                                     return {
                                    //                                         ...fieldItem,
                                    //                                         ...omit(
                                    //                                             fieldItem2,
                                    //                                             'type',
                                    //                                         ),
                                    //                                         data_type:
                                    //                                             fieldItem2.type,
                                    //                                         ...item,
                                    //                                     }
                                    //                                 }
                                    //                                 return {
                                    //                                     ...fieldItem,
                                    //                                     ...omit(
                                    //                                         item,
                                    //                                         'name_en',
                                    //                                     ),
                                    //                                 }
                                    //                             }
                                    //                             return item
                                    //                         },
                                    //                     ),
                                    //             },
                                    //         }
                                    //     }
                                    //     return f
                                    // }),
                                    expand: findItem.data?.expand,
                                },
                            }
                        })
                        await graphCase.current.addNodes(nodes)
                        nodes.forEach((n) => {
                            const { src } = n.data
                            if (src.length > 0) {
                                src.forEach((info) => createEdge(info, n.id))
                            }
                        })
                        graphCase.current.getEdges().forEach((edge) => {
                            const sourceNode = edge.getSourceNode()
                            const targetNode = edge.getTargetNode()
                            const rightPort = sourceNode
                                ?.getPorts()
                                .find((port) => {
                                    return port?.group === 'out'
                                })
                            if (rightPort && rightPort.id) {
                                sourceNode?.setPortProp(
                                    rightPort.id,
                                    'attrs/point',
                                    {
                                        fill: '#BFBFBF',
                                        stroke: '#BFBFBF',
                                        magnet: true,
                                    },
                                )
                            }
                            const leftport = targetNode
                                ?.getPorts()
                                .find((port) => {
                                    return port?.group === 'in'
                                })
                            if (leftport && leftport.id) {
                                targetNode?.setPortProp(
                                    leftport.id,
                                    'attrs/point',
                                    {
                                        fill: '#BFBFBF',
                                        stroke: '#BFBFBF',
                                        magnet: true,
                                    },
                                )
                            }
                        })
                    }
                    deleteEdgeTool()
                }
            }
        } catch (e) {
            sceneAnalFormatError(module, navigator, e)
            setPageStatus(false)
        } finally {
            setLoading(false)
            movedToCenter()
            await trackingCalculationAll(
                graphCase.current,
                fieldsData,
                module,
                userInfo,
            )
            changSaveState()

            // 存储样例数据
            graphCase.current
                .getNodes()
                .filter(
                    (n) =>
                        n.data.executable &&
                        n.data.formula.find(
                            (f) => f.type === FormulaType.MERGE,
                        ),
                )
                .forEach((n) => {
                    const { formula } = n.data
                    const mergeItem = formula.find(
                        (f) => f.type === FormulaType.MERGE,
                    )
                    if (mergeItem) {
                        storeExampleData(
                            graphCase.current!,
                            n,
                            fieldsData,
                            mergeItem,
                        )
                    }
                })
        }
    }

    /**
     * 创建边
     * @sourceId 源节点id
     * @targetId 目标节点id
     */
    const createEdge = (sourceId: string, targetId: string) => {
        graphCase.current?.addEdge({
            id: StringExt.uuid(),
            shape: 'data-scene-edge',
            source: {
                cell: sourceId,
                port: `${sourceId}-out`,
            },
            target: {
                cell: targetId,
                port: `${targetId}-in`,
            },
            zIndex: -1,
        })
    }

    // 初始化画布内容
    const initGraph = () => {
        if (!graphCase.current) {
            return
        }
        const graphBodyDom = document.getElementById('graphBody')
        if (module === ModuleType.SceneAnalysis) {
            createNodeInGraph(
                graphCase.current!,
                {
                    x: ((graphBodyDom?.scrollWidth || 1280) - 140) / 2,
                    y: ((graphBodyDom?.scrollHeight || 720) - 130) / 2,
                },
                FormulaType.FORM,
            )
        } else {
            createNodeInGraph(
                graphCase.current!,
                {
                    x: ((graphBodyDom?.scrollWidth || 1280) - 140) / 2 - 150,
                    y: ((graphBodyDom?.scrollHeight || 720) - 130) / 2,
                },
                FormulaType.FORM,
            )
            createNodeInGraph(
                graphCase.current!,
                {
                    x: ((graphBodyDom?.scrollWidth || 1280) - 140) / 2 + 150,
                    y: ((graphBodyDom?.scrollHeight || 720) - 130) / 2,
                },
                FormulaType.OUTPUTVIEW,
                undefined,
            )
        }
        // movedToCenter()
    }

    // 保存场景分析画布内容
    const saveContent = async (values?: any) => {
        if (!graphCase.current) return
        graphCase.current.getNodes().forEach((n) => {
            n.replaceData({ ...n.data, selected: false })
        })
        if (getEditNode()) {
            handleOptionClose(false)
        }

        try {
            deleteEdgeTool()
            let configData: any[] = []
            const cellsData = graphCase
                .current!.toJSON()
                .cells.filter((info) => info.shape === 'scene-analysis-node')
                .map((info) => {
                    const { name, src, formula, expand, output_fields } =
                        info.data
                    configData = [
                        ...configData,
                        {
                            id: info.id,
                            name,
                            src,
                            formula: formula.map((f) => {
                                if (f.type === FormulaType.MERGE) {
                                    return {
                                        id: f.id,
                                        type: f.type,
                                        config: f.config
                                            ? {
                                                  ...f.config,
                                                  merge: {
                                                      ...f.config?.merge,
                                                      nodes: f.config?.merge?.nodes.map(
                                                          (b) => {
                                                              const { fields } =
                                                                  b
                                                              return {
                                                                  ...b,
                                                                  fields: fields.map(
                                                                      (c) => {
                                                                          const findItem =
                                                                              fieldsData.data.find(
                                                                                  (
                                                                                      d,
                                                                                  ) =>
                                                                                      c?.id ===
                                                                                      d.id,
                                                                              )
                                                                          return {
                                                                              ...c,
                                                                              id:
                                                                                  c?.id ||
                                                                                  findItem.id,
                                                                              name_en:
                                                                                  c?.name_en ||
                                                                                  findItem.name_en,
                                                                          }
                                                                      },
                                                                  ),
                                                              }
                                                          },
                                                      ),
                                                  },
                                              }
                                            : undefined,
                                        output_fields: f.output_fields.map(
                                            (a) => {
                                                const findItem =
                                                    fieldsData.data.find(
                                                        (b) => b.id === a.id,
                                                    )
                                                return {
                                                    ...a,
                                                    id: a?.id || findItem.id,
                                                    name_en:
                                                        findItem?.name_en ||
                                                        a?.name_en,
                                                    data_type:
                                                        findItem?.data_type ||
                                                        a?.data_type,
                                                }
                                            },
                                        ),
                                    }
                                }
                                return {
                                    id: f.id,
                                    type: f.type,
                                    config: f.config,
                                    output_fields: f.output_fields.map((a) => {
                                        const findItem = fieldsData.data.find(
                                            (b) => b.id === a.id,
                                        )
                                        // const findItem2 =
                                        //     preNode?.data?.output_fields.find(
                                        //         (b) => b.id === a.id,
                                        //     )
                                        return {
                                            ...a,
                                            id: a?.id || findItem.id,
                                            name_en:
                                                a?.name_en || findItem?.name_en,
                                            data_type:
                                                a?.data_type ||
                                                findItem?.data_type,
                                        }
                                    }),
                                }
                            }),
                            output_fields: output_fields.map((a) => {
                                const findItem = fieldsData.data.find(
                                    (b) => b.id === a.id,
                                )
                                return {
                                    ...a,
                                    id: a?.id || findItem.id,
                                    name_en: a?.name_en || findItem?.name_en,
                                    data_type:
                                        a?.data_type || findItem?.data_type,
                                }
                            }),
                        },
                    ]
                    return {
                        ...info,
                        data: {
                            expand,
                        },
                    }
                })
            if (module === ModuleType.SceneAnalysis) {
                await saveSceneCanvas({
                    id: sceneId,
                    canvas: JSON.stringify(cellsData),
                    config: JSON.stringify(configData),
                })
                setAiOpen(false)
                message.success(__('保存成功'))
            } else {
                let data: any = omit(values, ['form_view_id'])
                if (module === ModuleType.LogicEntityView) {
                    data = { ...data, subject_id: entityId }
                }
                let outputFields
                graphCase.current.getNodes().forEach((info) => {
                    const { formula } = info.data
                    const formulaItem = formula.find(
                        (item) => item.type === FormulaType.OUTPUTVIEW,
                    )
                    if (formulaItem) {
                        outputFields = formulaItem?.config.config_fields
                    }
                })

                outputFields = outputFields.map((a) => {
                    const findItem = fieldsData.data.find((b) => b.id === a.id)
                    const editItem = outFields.find(
                        (item) => item.id === a.outId,
                    )
                    const type =
                        module === ModuleType.LogicEntityView
                            ? a.data_type
                            : a.type
                    let moreInfoField
                    if (moreData) {
                        moreInfoField = moreData.find(
                            (item) => item.id === a.outId,
                        )
                    }
                    return {
                        id: a.outId,
                        business_name: a.alias,
                        // code_table_id: a.dict_id,
                        // reset_data_length存在即代表更改过数据长度
                        data_accuracy: findItem.reset_data_length
                            ? findItem?.reset_data_accuracy
                            : findItem?.data_accuracy,
                        data_length:
                            findItem.reset_data_length || findItem?.data_length,
                        data_type: type,
                        is_nullable: findItem?.is_nullable,
                        original_data_type: findItem?.original_data_type,
                        primary_key: a.primary_key,
                        // standard: a.standard_name,
                        // standard_code: a.standard_code,
                        technical_name: a.name_en,
                        attribute_id:
                            moreInfoField?.attribute_id || a.attribute_id,
                        code_table_id: moreInfoField?.code_table_id,
                        standard: moreInfoField?.standard,
                        standard_code: moreInfoField?.standard_code,
                        business_timestamp:
                            moreInfoField?.business_timestamp ||
                            a.business_timestamp,
                        classfity_type:
                            moreInfoField?.classfity_type ||
                            editItem?.classfity_type,
                    }
                })
                let backId = viewId
                if (operate === OperateType.CREATE) {
                    const { id, view_sql } = await postSceneDataView({
                        name: values.business_name,
                        canvas: JSON.stringify(cellsData),
                        config: JSON.stringify(configData),
                    })
                    if (view_sql) {
                        backId = await postDataViewLogicView({
                            ...data,
                            sql: view_sql,
                            type:
                                module === ModuleType.CustomView
                                    ? 'custom'
                                    : 'logic_entity',
                            logic_view_field: outputFields,
                            scene_analysis_id: id,
                            owners: data?.owners?.map((o) => ({ owner_id: o })),
                        })
                    }
                    message.success(__('发布成功'))
                } else {
                    const { view_sql } = await putSceneDataView({
                        id: sceneId,
                        canvas: JSON.stringify(cellsData),
                        config: JSON.stringify(configData),
                    })
                    if (view_sql) {
                        await putDataViewLogicView({
                            id: viewId,
                            sql: view_sql,
                            type:
                                module === ModuleType.CustomView
                                    ? 'custom'
                                    : 'logic_entity',
                            logic_view_field: outputFields,
                        })
                    }
                    message.success(__('更新库表成功'))
                }
                setLogicViewBasicInfoVisible(false)
                setDeletable(true)
                navigator(
                    `/datasheet-view/detail?id=${backId}&model=view&isCompleted=true&logic=${
                        module === ModuleType.CustomView
                            ? LogicViewType.Custom
                            : LogicViewType.LogicEntity
                    }`,
                )
            }
        } catch (err) {
            sceneAnalFormatError(module, navigator, err, undefined, '无法保存')
        }
    }

    const configLogicInfo = async () => {
        if (operate === OperateType.CREATE) {
            try {
                if (!viewData && module === ModuleType.LogicEntityView) {
                    const [{ value: objRes }, { value: entityRes }]: any =
                        await Promise.allSettled([
                            getSubjectDomainDetail(objId),
                            getSubjectDomainDetail(entityId),
                        ])
                    const viewDa = {
                        business_name: entityRes?.name,
                        subject_id: entityId,
                        subject: entityRes?.name,
                        owner_id: objRes?.owners?.user_id,
                        owner: objRes?.owners?.user_name,
                        subject_type: BusinessDomainType.logic_entity,
                    }
                    setViewData(viewDa)
                }
            } catch (err) {
                formatError(err)
            } finally {
                setDeletable(false)
                setLogicViewBasicInfoVisible(true)
            }
        } else {
            saveContent()
        }
    }

    // 批量去掉边工具
    const deleteEdgeTool = () => {
        const edges = graphCase.current?.getEdges()
        edges?.forEach((edge) => {
            edge.removeTools()
        })
    }

    /**
     * 缩放画布
     * @multiple  缩放大小
     */
    const changeGraphSize = (multiple: number) => {
        setGraphSize(multiple * 100)
        graphCase.current?.zoomTo(multiple)
    }

    // 画布总览全部
    const showAllGraphSize = () => {
        if (graphCase.current) {
            graphCase.current.zoomToFit({ padding: 24 })
            const multiple = graphCase.current.zoom()
            const showSize = Math.round(multiple * 100)
            if (showSize > 400) {
                graphCase.current.zoomTo(4)
                setGraphSize(400)
            } else {
                setGraphSize(showSize - (showSize % 5))
            }
            return multiple
        }
        return 100
    }

    // 画布定位到中心
    const movedToCenter = () => {
        graphCase.current?.centerContent()
    }

    // 拖拽添加节点
    const startDrag = async (
        e: React.MouseEvent<HTMLDivElement, MouseEvent>,
        item?: any,
        currentDndCase?: any,
    ) => {
        if (!graphCase.current) return
        const sceneNodes = graphCase.current?.getNodes()
        if (sceneNodes.length >= 20) {
            messageError(__('最多只能创建20个节点！'))
            return
        }
        try {
            let node: Node | null = null
            if (item) {
                // ai
                const nodeId = StringExt.uuid()
                const { id, title, business_name, fields } = item
                const fieldsArray = (fields || []).map((field) => ({
                    alias: field.business_name,
                    id: field.id,
                    name: field.business_name,
                    sourceId: nodeId,
                    originName: field.business_name,
                    checked: true,
                    beEditing: false,
                    data_type: field.data_type,
                }))
                const type = FormulaType.FORM
                node = createNodeInGraphByAi(
                    graphCase.current,
                    nodeId,
                    {
                        name: business_name || title,
                        executable: fieldsArray.length > 0,
                        formula: [
                            {
                                id: StringExt.uuid(),
                                type,
                                output_fields: fieldsArray,
                                config: {
                                    config_fields: fieldsArray,
                                    form_id: id,
                                    other: { catalogOptions: { ...item, id } },
                                },
                            },
                        ],
                    },
                    {
                        x: 100,
                        y: 100,
                    },
                )
                await loopCalculationNodeData(
                    graphCase.current!,
                    [node!],
                    fieldsData,
                    module,
                    userInfo,
                )
                setIsDrag(true)
                changSaveState()
                // refreshOptionGraphData(node, 0, undefined, 'add', FormulaType.FORM)
            } else {
                node = createNodeInGraph(
                    graphCase.current,
                    {
                        x: 100,
                        y: 100,
                    },
                    undefined,
                    undefined,
                    'create',
                )
                setIsDrag(false)
            }
            if (node) {
                if (currentDndCase) {
                    currentDndCase?.start(node, e.nativeEvent as any)
                } else {
                    dndCase?.current?.start(node, e.nativeEvent as any)
                }
                setCurrentDndNode(node)
            }
        } catch (err) {
            const errDesc = err?.data?.description
            if (errDesc) {
                messageError(errDesc)
            }
        }
    }

    // 点击添加节点
    const addNode = (
        operator: FormulaType,
        appendFormulaFn?: (id: string) => Record<string, any>,
    ) => {
        if (operator === FormulaType.NONE) {
            setTrue()
            return null
        }
        if (!graphCase.current) return null
        const center = {
            x: ((size?.width || 1600) - 240) / 2,
            y: ((size?.height || 800) - 52 - 44) / 2,
        }
        const centerLocal = graphCase.current.clientToLocal(center)
        const nodes = graphCase.current.getNodes()
        const pos = getNewNodePosition(nodes, centerLocal, getNodeAddPosition())
        setNodeAddPosition(pos)
        const node = createNodeInGraph(
            graphCase.current,
            pos,
            undefined,
            undefined,
        )
        const { data } = node
        const { formula } = data
        const formulas = Array.of(...formula)
        const id = StringExt.uuid()
        const appendFormula = appendFormulaFn ? appendFormulaFn(node.id) : {}
        const output_fields = appendFormula.output_fields
            ? appendFormula.output_fields
            : []
        const newFormula = {
            id,
            type: operator,
            output_fields: [],
            ...appendFormula,
        }
        node.replaceData({
            ...data,
            output_fields,
            // name:
            //     name ||
            //     (num > 0
            //         ? `${formulaInfo[type].name}_${num}`
            //         : formulaInfo[type].name),
            formula: [...formulas, newFormula],
        })
        if (operator === FormulaType.FORM) {
            const leftport = node.getPorts().find((port) => {
                return port?.group === 'in'
            })
            if (leftport && leftport.id) {
                node.setPortProp(leftport.id, 'attrs/wrap', {
                    fill: 'none',
                    magnet: false,
                })
                node.setPortProp(leftport.id, 'attrs/point', {
                    fill: 'none',
                    stroke: 'none',
                    magnet: true,
                })
            }
        }
        if (operator === FormulaType.COMPARE) {
            const rightport = node.getPorts().find((port) => {
                return port?.group === 'out'
            })
            if (rightport && rightport.id) {
                node.setPortProp(rightport.id, 'attrs/wrap', {
                    fill: 'none',
                    magnet: false,
                })
                node.setPortProp(rightport.id, 'attrs/point', {
                    fill: 'none',
                    stroke: 'none',
                    magnet: true,
                })
            }
        }
        return node
    }

    // 批量添加库表节点
    const onConfirmAdd = async (checkedItem: any[]) => {
        try {
            const results = await Promise.all(
                checkedItem.map((item) =>
                    getUserDatasheetViewDetails(item.id, {
                        enable_data_protection: true,
                    }).then((res) => {
                        const filterData =
                            res?.fields
                                ?.filter(
                                    // eslint-disable-next-line @typescript-eslint/no-shadow
                                    (item) =>
                                        changeTypeToLargeArea(
                                            item.data_type,
                                        ) !== FieldTypes.BINARY &&
                                        item.data_type !== null &&
                                        item.data_type !== '' &&
                                        item.status !== stateType.delete &&
                                        item.is_readable,
                                )
                                // eslint-disable-next-line @typescript-eslint/no-shadow
                                ?.map((item) => ({
                                    ...item,
                                    data_type: changeTypeToLargeArea(
                                        item.data_type,
                                    ),
                                    name_en: item.technical_name,
                                    form_view_id: item.id,
                                })) || []
                        fieldsData.addData(filterData)
                        // 过滤二进制字段
                        return {
                            fields:
                                // eslint-disable-next-line @typescript-eslint/no-shadow
                                filterData.map((item) => ({
                                    alias: item.business_name,
                                    id: item.id,
                                    name: item.business_name,
                                    sourceId: '',
                                    originName: item.business_name,
                                    checked: true,
                                })) || [],
                            id: item.id,
                            selectView: item,
                        }
                    }),
                ),
            )
            results.forEach(async (res) => {
                const node = addNode(FormulaType.FORM, (id) => {
                    const fields = res.fields.map((f) => ({
                        ...f,
                        sourceId: id,
                    }))
                    return {
                        config: {
                            form_id: res.id,
                            config_fields: fields,
                            other: {
                                catalogOptions: res.selectView,
                            },
                        },
                        output_fields: fields,
                    }
                })
                await loopCalculationNodeData(
                    graphCase.current!,
                    [node!],
                    fieldsData,
                    module,
                    userInfo,
                )
            })
        } catch (error) {
            formatError(error)
        }
        setFalse()
    }

    /**
     * 编辑节点名称
     * @node 当前节点
     */
    const editFormName = (node: Node) => {
        if (nodeMoved) {
            return
        }
        setEditNameNode(node)
    }

    /**
     * 操作触发事件
     * @node 当前算子所在的节点
     * @index 当前算子的索引
     * @item 当前算子
     */
    const optionGraphData = async (
        node: Node,
        index: number,
        item: IFormula,
    ) => {
        // cancelRunGraph()
        setRunNode(undefined)
        setEditNode(node)
        setSelectedIndex(index)
        setSelectedFormula(item)
        setOptionType(item.type as FormulaType)
        if (defaultSize[0] === 99 || defaultSize[0] === 100) {
            setDragExpand(true)
            setDefaultSize([40, 60])
        } else if (!dragExpand) {
            setDragExpand(true)
            setDefaultSize(defaultSize.map((info) => info + 0.001))
        }
    }

    /**
     * 操作结束
     * @bo 是否更新数据 true-更新
     */
    const handleOptionClose = async (bo: boolean = true) => {
        // const tempNodeId = editNode?.id
        if (bo) {
            await loopCalculationNodeData(
                graphCase.current!,
                [editNode!],
                fieldsData,
                module,
                userInfo,
            )
            changSaveState()

            // 存储样例数据
            if (selectedFormula?.type === FormulaType.MERGE) {
                storeExampleData(
                    graphCase.current!,
                    editNode!,
                    fieldsData,
                    selectedFormula,
                    undefined,
                    undefined,
                    true,
                )
            }
        }
        setOptionType(FormulaType.NONE)
        setSelectedFormula(undefined)
        setDefaultSize([100, 0])
        // if (getEditNode() && getEditNode()?.id !== tempNodeId) {
        //     return
        // }
        setEditNode(undefined)
    }

    // 检查输出算子节点是否可以执行
    const changSaveState = () => {
        if (!graphCase.current || module === ModuleType.SceneAnalysis) return
        let result = false
        graphCase.current.getNodes().forEach((info) => {
            const { formula } = info.data
            const formulaItem = formula.find(
                (item) => item.type === FormulaType.OUTPUTVIEW,
            )
            if (formulaItem) {
                result = info.data.executable
            }
        })
        setCanSave(result)
    }

    /**
     * 刷新操作算子
     * @node 操作算子所在的节点
     * @index 操作算子的索引
     * @item 操作算子
     * @flag 操作
     * @type 添加算子类型
     */
    const refreshOptionGraphData = async (
        node: Node,
        index: number,
        item?: IFormula,
        flag?: 'del' | 'add',
        type?: FormulaType,
    ) => {
        await loopCalculationNodeData(
            graphCase.current!,
            [node],
            fieldsData,
            module,
            userInfo,
        )
        changSaveState()
        if (flag === 'add') {
            container.current?.focus()
            graphCase.current?.select(node)
            let newIndex = 0
            const fl = node?.data?.formula?.find((info, idx) => {
                if (info.type === type) {
                    newIndex = idx
                }
                return info.type === type
            })
            if (fl) {
                optionGraphData(node, newIndex, fl)
            }
            return
        }
        if (getOptionType() !== FormulaType.NONE) {
            switch (flag) {
                case 'del': {
                    if (getSelectedFormula()?.id === item?.id) {
                        setOptionType(FormulaType.NONE)
                        setSelectedFormula(undefined)
                        setEditNode(undefined)
                        setDefaultSize([100, 0])
                        break
                    }
                    if (getEditNode()?.id === node.id) {
                        let newIndex = 0
                        const fl = getEditNode()?.data?.formula?.find(
                            (info, idx) => {
                                newIndex = idx
                                return info.id === getSelectedFormula()?.id
                            },
                        )
                        if (fl) {
                            optionGraphData(node, newIndex, fl)
                        }
                        break
                    }
                    const preNodes = getPreorderNode(
                        graphCase.current!.getNodes(),
                        getEditNode(),
                    )
                    if (preNodes.includes(node)) {
                        const fl =
                            getEditNode()?.data?.formula?.[getSelectedIndex()]
                        if (fl) {
                            optionGraphData(
                                getEditNode()!,
                                getSelectedIndex(),
                                fl,
                            )
                        }
                    }
                    break
                }
                // case 'add': {
                // if (getEditNode()?.id === node.id) {
                //     let newIndex = 0
                //     const fl = getEditNode()?.data?.formula?.find(
                //         (info, idx) => {
                //             newIndex = idx
                //             return info.id === getSelectedFormula()?.id
                //         },
                //     )
                //     if (fl) {
                //         optionGraphData(node, newIndex, fl)
                //     }
                //     break
                // }
                // const fl =
                //     getEditNode()?.data?.formula?.[getSelectedIndex()]
                // if (fl) {
                //     optionGraphData(getEditNode()!, getSelectedIndex(), fl)
                // }
                //     break
                // }
                default: {
                    const fl = getEditNode()?.data?.formula?.[index]
                    if (fl) {
                        optionGraphData(getEditNode()!, index, fl)
                    }
                    break
                }
            }
        }
    }

    // 取消执行请求
    const cancelRunGraph = () => {
        const sor = getSource()
        if (sor.length > 0) {
            sor.forEach((info) => {
                if (
                    info.config?.url?.includes(
                        '/api/scene-analysis/v1/scene/exec?',
                    )
                ) {
                    info.source.cancel()
                }
            })
        }
    }

    // 执行
    const runGraph = async (
        node?: Node,
        offset: number = 1,
        limit: number = 20,
        isFirst: boolean = true,
    ) => {
        setExcutionType(ExcutionType.NORMAL)
        setOptionType(FormulaType.NONE)
        // handleOptionClose(false)
        if (!graphCase.current || !node) {
            return
        }
        setRunNode(node)
        setRunOffset(offset)
        setRunPageSize(limit)
        const preNodes = getPreorderNode(graphCase.current.getNodes(), node)
        if (defaultSize[0] === 100 || defaultSize[0] === 99) {
            setDragExpand(true)
            setDefaultSize([40, 60])
        } else if (!dragExpand) {
            setDragExpand(true)
            setDefaultSize(defaultSize.map((info) => info + 0.001))
        }

        try {
            cancelRunGraph()

            if (isFirst) {
                setFetching(true)
                setRunTotal(undefined)
            }
            setTableFetching(true)
            setErrorMsg(undefined)
            const params = getRunViewParam(preNodes, fieldsData)
            const res = await runSceneView(
                limit,
                offset,
                params,
                isFirst,
                module === ModuleType.SceneAnalysis
                    ? 'scene-analysis'
                    : 'data-view',
            )

            if (getRunNode()) {
                const { columns, data, err, count } = res
                if (err && err.code) {
                    setErrorMsg(getErrorMessage({ error: { data: err } }))
                } else {
                    setRunColumns(
                        columns?.map((item, index) => {
                            return {
                                key: item.name,
                                dataIndex: item.name,
                                title: item.name,
                                ellipsis: true,
                                render: (_, record) => record[item.name],
                            }
                        }) || [],
                    )
                    setRunList(
                        data?.map((outItem, i) => {
                            const obj: any = {}
                            outItem.forEach((innerItem, j) => {
                                const value = columns?.[j].name
                                obj.key = i
                                if (lodash.isNull(innerItem)) {
                                    obj[value] = '--'
                                } else if (
                                    typeof innerItem === 'string' &&
                                    !innerItem
                                ) {
                                    obj[value] = '--'
                                } else if (typeof innerItem === 'boolean') {
                                    obj[value] = `${innerItem}`
                                } else {
                                    obj[value] = innerItem
                                }
                            })
                            return obj
                        }) || [],
                    )
                    if (isFirst) {
                        setRunTotal(count || 0)
                    }
                }
            }
            setFetching(false)
            setTableFetching(false)
        } catch (error) {
            if (error?.data?.code === 'ERR_CANCELED') {
                return
            }
            setFetching(false)
            setTableFetching(false)
            setRunColumns([])
            setRunList([])
            setRunTotal(undefined)
            // 无法进行数据预览
            if (error?.data?.code === 'SceneAnalysis.Scene.SceneNotExist') {
                modalInfo({
                    title: __('无法执行'),
                    icon: <InfoCircleFilled />,
                    content: __('场景分析已不存在'),
                    okText: __('确定'),
                    onOk() {
                        navigator('/dataProduct/sceneAnalysis')
                    },
                })
            } else {
                if (!runNode) return
                setErrorMsg(getErrorMessage({ error }))
            }
        }
    }

    // 执行数据对比算子
    const runCompareGraph = async (
        node?: Node,
        offset: number = 1,
        limit: number = 20,
        isFirst: boolean = true,
    ) => {
        setOptionType(FormulaType.NONE)
        setExcutionType(ExcutionType.COMPARE)
        if (!graphCase.current || !node) {
            return
        }
        if (defaultSize[0] === 100 || defaultSize[0] === 99) {
            setDragExpand(true)
            setDefaultSize([40, 60])
        } else if (!dragExpand) {
            setDragExpand(true)
            setDefaultSize(defaultSize.map((info) => info + 0.001))
        }
        const preNodes = getPreorderNode(graphCase.current.getNodes(), node)

        setCompareProps({
            graph: graphCase.current,
            node,
            preNodes,
            fieldsData,
        })

        // try {
        //     setFetching(true)

        //     setErrorMsg(undefined)
        //     const params = getRunViewParam(preNodes, fieldsData)
        //     const res = await runSceneView(
        //         limit,
        //         offset,
        //         params,
        //         isFirst,
        //         module === ModuleType.SceneAnalysis
        //             ? 'scene-analysis'
        //             : 'data-view',
        //     )
        // } catch (error) {
        //     setFetching(false)
        //     setErrorMsg(getErrorMessage({ error }))
        // }
    }

    /**
     * 底部栏切换展开状态
     * @closed 关闭
     */
    const handleChangeExpand = (closed: boolean = false) => {
        if (closed) {
            // cancelRunGraph()
            setDefaultSize([100, 0])
            handleOptionClose(false)
        } else {
            if (defaultSize[0] === 99) {
                setDefaultSize([40, 60])
            } else if (!dragExpand) {
                setDefaultSize(defaultSize.map((info) => info + 0.001))
            }
            setDragExpand(!dragExpand)
        }
    }

    const renderExcute = fetching ? (
        <div style={{ marginTop: 60 }}>
            <Spin className={styles.ldWrap} />
        </div>
    ) : errorMsg || runList.length === 0 ? (
        <div>
            <Empty
                iconSrc={dataEmpty}
                desc={
                    <div
                        style={{
                            textAlign: 'center',
                        }}
                    >
                        <div>{__('暂无数据')}</div>
                        <div hidden={!errorMsg}>{errorMsg}</div>
                    </div>
                }
            />
        </div>
    ) : (
        <Watermark
            content={`${userInfo?.VisionName || ''} ${userInfo?.Account || ''}`}
        >
            <Table
                className={styles.bottomList}
                columns={runColumns}
                dataSource={runList}
                scroll={{
                    x: runColumns.length * 200,
                    y:
                        (window.innerHeight - 52) *
                            (getDefaultSize()[1] / 100) -
                        161,
                    // ((runTotal || 0) <= 20 ? 114 : 161),
                }}
                loading={tableFetching}
                pagination={{
                    current: runOffset,
                    pageSize: runPageSize,
                    total: runTotal,
                    showSizeChanger:
                        (runTotal || 0) >
                        ListDefaultPageSize[ListType.NarrowList],
                    pageSizeOptions: ListPageSizerOptions[ListType.NarrowList],
                    showTotal(total, range) {
                        return `${__('总计')} ${runTotal} ${__('条数据')}`
                    },
                    onChange: (page, pageSize) => {
                        runGraph(
                            runNode,
                            pageSize !== runPageSize ? 1 : page,
                            pageSize,
                            false,
                        )
                    },
                }}
            />
        </Watermark>
    )

    return (
        <div className={styles.sceneGraphWrap} ref={content}>
            <div ref={dndContainer} className={styles.dndDrag}>
                <GraphHeader
                    onStartDrag={startDrag}
                    addNode={addNode}
                    onChangeGraphSize={changeGraphSize}
                    onShowAllGraphSize={showAllGraphSize}
                    onMovedToCenter={movedToCenter}
                    onSaveGraph={() => {
                        if (module === ModuleType.SceneAnalysis) {
                            saveContent()
                        } else {
                            configLogicInfo()
                        }
                    }}
                    graphSize={debouncedGraphSize}
                    data={sceneData}
                    canSave={canSave}
                    setAiOpen={setAiOpen}
                    setIsDialogClick={setIsDialogClick}
                    mode={mode}
                    setMode={setMode}
                    loading={loading}
                />
            </div>
            <div
                style={{
                    height: 'calc(100% - 52px)',
                    background: '#F6F9FB',
                }}
            >
                <DragVeticalBox
                    defaultSize={defaultSize}
                    minSize={defaultSize[0] === 100 ? 0 : 40}
                    onDragEnd={(rate) => {
                        const close = (window.innerHeight * rate[1]) / 100 < 48
                        setDragExpand(!close)
                        if (close) {
                            setDefaultSize([99, 1])
                        } else {
                            setDefaultSize(rate)
                        }
                    }}
                    hiddenElement={defaultSize[0] === 100 ? 'right' : ''}
                    collapsed={dragExpand ? undefined : 1}
                    gutterSize={8}
                    gutterStyle={() => ({
                        height: '8px',
                        background: '#FFF',
                        visibility:
                            defaultSize[0] === 100 ? 'hidden' : 'visible',
                    })}
                >
                    <div
                        ref={graphBody}
                        id="graphBody"
                        style={{
                            display: 'flex',
                            width: '100%',
                            height: '100%',
                            position: 'relative',
                        }}
                    >
                        <X6PortalProvider />
                        <div
                            ref={container}
                            id="container"
                            style={{
                                width: '100%',
                                height: '100%',
                            }}
                        />
                        <div className={styles.loadingGraph} hidden={!loading}>
                            <Spin />
                        </div>
                        <div
                            className={styles.emptyGraph}
                            hidden={getPageStatus()}
                        >
                            <Empty
                                iconSrc={graphEmpty}
                                desc={
                                    <>
                                        <div>
                                            {__(
                                                '您可拖拽顶部【添加节点】按钮至画布中',
                                            )}
                                        </div>
                                        <div>{__('开始配置场景')}</div>
                                    </>
                                }
                            />
                        </div>
                    </div>
                    <div style={{ height: '100%', width: '100%' }}>
                        <div
                            className={styles.bottom}
                            hidden={optionType !== FormulaType.NONE}
                        >
                            <div className={styles.bottomTit}>
                                <span className={styles.bottomDescWrap}>
                                    <span style={{ flexShrink: 0 }}>
                                        {__('输出数据')}
                                    </span>
                                    <span className={styles.bottomDesc}>
                                        <span style={{ flexShrink: 0 }}>
                                            （{__('来自节点：')}
                                        </span>
                                        <span
                                            className={styles.bottomDescName}
                                            title={
                                                runNode?.data?.name ||
                                                __('未命名')
                                            }
                                        >
                                            {runNode?.data?.name ||
                                                __('未命名')}
                                        </span>
                                        ）
                                    </span>
                                </span>
                                <div className={styles.btnWrap}>
                                    <Tooltip
                                        title={__('收起')}
                                        getPopupContainer={(n) =>
                                            n.parentElement!
                                        }
                                    >
                                        <div
                                            hidden={!dragExpand}
                                            className={styles.expandIcon}
                                            style={{ marginRight: 8 }}
                                            onClick={() => handleChangeExpand()}
                                        >
                                            <DownOutlined />
                                        </div>
                                    </Tooltip>
                                    <Tooltip
                                        title={__('展开')}
                                        getPopupContainer={(n) =>
                                            n.parentElement!
                                        }
                                    >
                                        <div
                                            hidden={dragExpand}
                                            className={styles.expandIcon}
                                            style={{ marginRight: 8 }}
                                            onClick={() => handleChangeExpand()}
                                        >
                                            <UpOutlined />
                                        </div>
                                    </Tooltip>
                                    <Tooltip
                                        title={__('关闭')}
                                        getPopupContainer={(n) =>
                                            n.parentElement!
                                        }
                                    >
                                        <div
                                            className={styles.expandIcon}
                                            onClick={() => {
                                                handleChangeExpand(true)
                                                setRunNode(undefined)
                                                setExcutionType(undefined)
                                            }}
                                        >
                                            <CloseOutlined />
                                        </div>
                                    </Tooltip>
                                </div>
                            </div>
                            {excutionType === ExcutionType.NORMAL &&
                                renderExcute}
                            {excutionType === ExcutionType.COMPARE && (
                                <Watermark
                                    content={`${userInfo?.VisionName || ''} ${
                                        userInfo?.Account || ''
                                    }`}
                                    style={{
                                        flex: 1,
                                    }}
                                >
                                    <ComparisionResult
                                        {...compareProps}
                                        scrollHeight={
                                            (window.innerHeight - 52) *
                                                (getDefaultSize()[1] / 100) -
                                            202
                                        }
                                    />
                                </Watermark>
                            )}
                        </div>
                        {optionType === FormulaType.FORM &&
                            (module === ModuleType.SceneAnalysis ? (
                                <SceneGraphContext.Provider
                                    value={contextValue}
                                >
                                    <CatalogFormula
                                        visible={
                                            optionType === FormulaType.FORM
                                        }
                                        node={editNode}
                                        formulaData={selectedFormula}
                                        fieldsData={fieldsData}
                                        viewSize={getDefaultSize()[1]}
                                        dragExpand={dragExpand}
                                        onChangeExpand={handleChangeExpand}
                                        onClose={handleOptionClose}
                                    />
                                </SceneGraphContext.Provider>
                            ) : (
                                <CiteViewFormula
                                    visible={optionType === FormulaType.FORM}
                                    node={editNode}
                                    formulaData={selectedFormula}
                                    fieldsData={fieldsData}
                                    viewSize={getDefaultSize()[1]}
                                    dragExpand={dragExpand}
                                    onChangeExpand={handleChangeExpand}
                                    onClose={handleOptionClose}
                                />
                            ))}
                        {optionType === FormulaType.INDICATOR && (
                            <IndicatorFormula
                                visible={optionType === FormulaType.INDICATOR}
                                graph={graphCase.current}
                                node={editNode}
                                formulaData={selectedFormula}
                                fieldsData={fieldsData}
                                viewSize={getDefaultSize()[1]}
                                dragExpand={dragExpand}
                                onChangeExpand={handleChangeExpand}
                                onClose={handleOptionClose}
                            />
                        )}
                        {optionType === FormulaType.WHERE && (
                            <WhereFormula
                                visible={optionType === FormulaType.WHERE}
                                graph={graphCase.current}
                                node={editNode}
                                formulaData={selectedFormula}
                                fieldsData={fieldsData}
                                viewSize={getDefaultSize()[1]}
                                dragExpand={dragExpand}
                                onChangeExpand={handleChangeExpand}
                                onClose={handleOptionClose}
                            />
                        )}
                        {optionType === FormulaType.JOIN && (
                            <JoinFormula
                                visible={optionType === FormulaType.JOIN}
                                graph={graphCase.current}
                                node={editNode}
                                formulaData={selectedFormula}
                                fieldsData={fieldsData}
                                viewSize={getDefaultSize()[1]}
                                dragExpand={dragExpand}
                                onChangeExpand={handleChangeExpand}
                                onClose={handleOptionClose}
                            />
                        )}
                        {optionType === FormulaType.MERGE && (
                            <MergeFormula
                                visible={optionType === FormulaType.MERGE}
                                graph={graphCase.current}
                                node={editNode}
                                formulaData={selectedFormula}
                                fieldsData={fieldsData}
                                viewSize={getDefaultSize()[1]}
                                dragExpand={dragExpand}
                                onChangeExpand={handleChangeExpand}
                                onClose={handleOptionClose}
                            />
                        )}
                        {optionType === FormulaType.DISTINCT && (
                            <DistinctFormula
                                visible={optionType === FormulaType.DISTINCT}
                                graph={graphCase.current}
                                node={editNode}
                                formulaData={selectedFormula}
                                fieldsData={fieldsData}
                                viewSize={getDefaultSize()[1]}
                                dragExpand={dragExpand}
                                onChangeExpand={handleChangeExpand}
                                onClose={handleOptionClose}
                            />
                        )}
                        {optionType === FormulaType.SELECT && (
                            <SelectFormula
                                visible={optionType === FormulaType.SELECT}
                                graph={graphCase.current}
                                node={editNode}
                                formulaData={selectedFormula}
                                fieldsData={fieldsData}
                                viewSize={getDefaultSize()[1]}
                                dragExpand={dragExpand}
                                onChangeExpand={handleChangeExpand}
                                onClose={handleOptionClose}
                            />
                        )}
                        {optionType === FormulaType.OUTPUTVIEW &&
                            (module === ModuleType.CustomView ? (
                                <OutputViewFormula
                                    visible={
                                        optionType === FormulaType.OUTPUTVIEW
                                    }
                                    graph={graphCase.current}
                                    node={editNode}
                                    formulaData={selectedFormula}
                                    fieldsData={fieldsData}
                                    viewSize={getDefaultSize()[1]}
                                    dragExpand={dragExpand}
                                    onChangeExpand={handleChangeExpand}
                                    onClose={handleOptionClose}
                                />
                            ) : (
                                <LogicalViewFormula
                                    visible={
                                        optionType === FormulaType.OUTPUTVIEW
                                    }
                                    graph={graphCase.current}
                                    node={editNode}
                                    formulaData={selectedFormula}
                                    fieldsData={fieldsData}
                                    viewSize={getDefaultSize()[1]}
                                    dragExpand={dragExpand}
                                    onChangeExpand={handleChangeExpand}
                                    onClose={handleOptionClose}
                                />
                            ))}
                        {optionType === FormulaType.COMPARE && (
                            <CompareFormula
                                visible={optionType === FormulaType.COMPARE}
                                graph={graphCase.current}
                                node={editNode}
                                formulaData={selectedFormula}
                                fieldsData={fieldsData}
                                viewSize={getDefaultSize()[1]}
                                dragExpand={dragExpand}
                                onChangeExpand={handleChangeExpand}
                                onClose={handleOptionClose}
                            />
                        )}
                    </div>
                </DragVeticalBox>
            </div>
            <EditNodeName
                visible={!!editNameNode}
                graph={graphCase.current}
                node={editNameNode}
                onClose={() => setEditNameNode(undefined)}
            />
            <Confirm
                open={!!deleteNode}
                title={__('确认要删除该节点吗？')}
                content={__('节点及其配置信息被删除后无法找回，请谨慎操作！')}
                okText={__('确定')}
                cancelText={__('取消')}
                onOk={() => handleDeleteNodeOk()}
                onCancel={() => setDeleteNode(undefined)}
            />
            {logicViewBasicInfoVisible && (
                <EditBasicInfoModal
                    formData={viewData}
                    onClose={() => {
                        setLogicViewBasicInfoVisible(false)
                        setDeletable(true)
                    }}
                    onOk={(_, values) => {
                        saveContent(values)
                    }}
                    open={logicViewBasicInfoVisible}
                    logic={
                        module === ModuleType.CustomView
                            ? LogicViewType.Custom
                            : LogicViewType.LogicEntity
                    }
                />
            )}
            {aiOpen && (
                <CongSearchProvider>
                    <AiDialog
                        onStartDrag={startDrag}
                        setAiOpen={setAiOpen}
                        aiOpen={aiOpen}
                        setIsDialogClick={setIsDialogClick}
                        isDialogClick={isDialogClick}
                        isUseData={false}
                        selectorId="graphAIIcon"
                        graphCase={graphCase.current}
                    />
                </CongSearchProvider>
            )}
            {/* {baseInfoData?.id && (
                <div
                    className={styles.dataViewDetailsBtn}
                    onClick={() => setOpenDataViewDetail(true)}
                >
                    <div className={styles.text}>{__('展开库表信息')}</div>
                    <span className={styles.icon}>{'<<'}</span>
                </div>
            )}
            {openDataViewDetail && (
                <DataViewDetail
                    onClose={() => setOpenDataViewDetail(false)}
                    logic={
                        module === ModuleType.CustomView
                            ? LogicViewType.Custom
                            : LogicViewType.LogicEntity
                    }
                    open={openDataViewDetail}
                    optionType="edit"
                    isDataView
                />
            )} */}
            {/* 批量添加库表 */}
            <AddBatchView
                open={open}
                checkedId=""
                onClose={() => {
                    setFalse()
                    // setDeletable(true)
                }}
                onSure={onConfirmAdd}
            />
        </div>
    )
})

export default SceneGraph
