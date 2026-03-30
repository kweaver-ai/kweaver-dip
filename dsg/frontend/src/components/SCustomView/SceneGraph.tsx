import {
    CloseOutlined,
    DownOutlined,
    InfoCircleFilled,
    UpOutlined,
} from '@ant-design/icons'
import { Graph, Node, Platform, StringExt } from '@antv/x6'
import { Spin, Table, Tabs, Tooltip, message } from 'antd'
import React, {
    createContext,
    forwardRef,
    useContext,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'

import { Dnd } from '@antv/x6-plugin-dnd'
import { Keyboard } from '@antv/x6-plugin-keyboard'
import { Selection } from '@antv/x6-plugin-selection'
import { useDebounce, useGetState } from 'ahooks'
import { forIn, isNull, last, omit, pick } from 'lodash'
import { useNavigate } from 'react-router-dom'
import {
    IFormula,
    LogicViewType,
    formatError,
    getDataViewBaseInfo,
    getDatasheetViewDetails,
    getErrorMessage,
    getSubjectDomainDetail,
    messageError,
    postDataViewLogicView,
    postSceneDataView,
    putDataViewLogicView,
    putSceneDataView,
    querySceneAnalysisDetail,
    runSceneView,
    saveMultiViewRequest,
    saveSceneCanvas,
} from '@/core'
import {
    instancingGraph,
    sceneConnector,
    sceneEdgeConfig,
} from '@/core/graph/graph-config'
import { Plugins, loadPlugins } from '@/core/graph/plugin'
import { DatasheetViewColored, FontIcon } from '@/icons'
import { OperateType, cancelRequest, getSource, useQuery } from '@/utils'
import { info as modalInfo } from '@/utils/modalHelper'
import {
    changeTypeToLargeArea,
    createNodeInGraph,
    createNodeInGraphByAi,
    getFormulaItem,
    getLogicalData,
    getPortsByType,
    getPreorderNode,
    getRunViewParam,
    loopCalculationNodeData,
    sceneAlsDataType,
    sceneAnalFormatError,
    storeExampleData,
    trackingCalculationAll,
    useSceneGraphContext,
} from './helper'

import dataEmpty from '@/assets/dataEmpty.svg'
import graphEmpty from '@/assets/graphEmpty2.svg'
import DragBox from '@/components/DragBox'
import { X6PortalProvider } from '@/core/graph/helper'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
    ListDefaultPageSize,
    ListPageSizerOptions,
    ListType,
    Watermark,
} from '@/ui'
import Empty from '@/ui/Empty'
import { BusinessDomainType } from '../BusinessDomain/const'
import Confirm from '../Confirm'
import { useDataViewContext } from '../DatasheetView/DataViewProvider'
import { ClassifyType } from '../DatasheetView/const'
import DragVeticalBox from '../DragVeticalBox'
import {
    CHANGE_TAB_ACTIVE_KEY,
    CHANGE_TAB_ITEMS,
    CustomViewContext,
} from './CustomViewRedux'
import GraphHeader from './GraphHeader'
import LeftViewCont from './LeftViewCont'
import AllFormula from './RightViewCont/AllFormula'
import EditNodeName from './RightViewCont/EditNodeName'
import { FieldsData } from './RightViewCont/FieldsData'
import SceneNode from './RightViewCont/SceneNode'
import './RightViewCont/x6Style.less'
import FormulaSaveModal from './UnitForm/FormulaSaveModal'
import { useViewGraphContext } from './ViewGraphProvider'
import {
    FieldTypes,
    FormulaType,
    ModeType,
    ModuleType,
    NodeDataType,
    formulaInfo,
} from './const'
import __ from './locale'
import styles from './styles.module.less'

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
    onOpenDataViewDetails?: () => void
}
const SceneGraph: React.FC<ISceneGraph> = forwardRef((props: any, ref) => {
    const { mode, setMode, moreData, onOpenDataViewDetails } = props
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
    const [loading, setLoading] = useState(true)

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
    // 左右分割
    const [defaultHorizontalSize, setDefaultHorizontalSize] = useState<
        Array<number>
    >([18, 82])
    // 页面存在状态 false-缺省图
    const [pageStatus, setPageStatus, getPageStatus] =
        useGetState<boolean>(true)
    // 场景信息
    const [sceneData, setSceneData] = useState<any>()
    // 算子配置是否全屏
    const [fullScreen, setFullScreen] = useState(false)

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

    // 算子保存提示窗口
    const formulaRef = useRef<any>(null)
    const [saveFormulaModal, setSaveFormulaModal] = useState<boolean>(false)
    const { continueFn, setContinueFn } = useViewGraphContext()

    const { data: contextData, dispatch } = useContext(CustomViewContext)
    const { tabItems, activeKey, dataViewLists } = contextData.toJS()
    // 输出字段列表
    const [outFields, setOutFields] = useState<any[]>([])
    const [openDataViewDetail, setOpenDataViewDetail] = useState<boolean>(false)
    const {
        datasheetInfo,
        setDatasheetInfo,
        onValidateNameRepeat,
        onSubmitBasicInfo,
        setIsSubmitBasicInfoForm,
        fieldsTableData,
    } = useDataViewContext()
    const [userInfo] = useCurrentUser()

    // 字段数据
    const fieldsData = useMemo(() => {
        return new FieldsData()
    }, [])

    useEffect(() => {
        if (
            canSave &&
            operate === 'edit' &&
            (module === ModuleType.CustomView ||
                module === ModuleType.LogicEntityView)
        ) {
            handleOptionClose(false)
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

                const sheetFieldAttribute = pick(fieldInfos, [
                    'grade_type',
                    'label_id',
                    'label_name',
                    'label_icon',
                    'label_path',
                ])
                const type =
                    module === ModuleType.LogicEntityView ? a.data_type : a.type
                const attrInfo =
                    module === ModuleType.LogicEntityView
                        ? pick(a, [
                              'attribute_id',
                              'attribute_name',
                              'attribute_path',
                              'label_id',
                              'label_name',
                              'label_icon',
                              'label_path',
                          ])
                        : {}
                return {
                    ...findItem,
                    ...fieldInfos,
                    ...attrInfo,
                    ...sheetFieldAttribute,
                    id: a.outId,
                    business_name: a.alias,
                    data_type: type,
                    technical_name: a.name_en,
                    classfity_type: ClassifyType.Manual,
                    primary_key: a.primary_key,
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
    ])

    const debouncedGraphSize = useDebounce(graphSize, { wait: 400 })

    // step1. 初始化画布
    useEffect(() => {
        getEnumConfig()
        setDragExpand(false)
        const graph = instancingGraph(container.current, {
            background: {
                color: '#f0f2f6',
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
            // tips: 设置拖拽插件
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
                    case FormulaType.SQL:
                        if (sourceNode) {
                            let hasError = false
                            const preSor: Node[] = getPreorderNode(
                                graph.getNodes(),
                                sourceNode,
                            )
                            forIn(preSor, (n: any) => {
                                if (
                                    n?.data?.formula.find((f) =>
                                        [
                                            FormulaType.MERGE,
                                            // FormulaType.DISTINCT,
                                            // FormulaType.WHERE,
                                            FormulaType.JOIN,
                                        ].includes(f.type),
                                    )
                                ) {
                                    hasError = true
                                }
                            })
                            if (hasError) {
                                messageError(
                                    __('SQL算子前不能有数据合并、数据关联算子'),
                                )
                                graph.removeCell(edge.id)
                                return
                            }
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
                    // if (
                    //     preSor[0].data.formula[0]?.config?.form_id ===
                    //         preTag[0].data.formula[0]?.config?.form_id &&
                    //     type === FormulaType.JOIN
                    // ) {
                    //     messageError(
                    //         __('数据关联算子不能同时关联两个来源相同的库表'),
                    //     )
                    //     graph.removeCell(edge.id)
                    //     return
                    // }

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
                    const { formula } = sourceNode.data
                    if (formula[0]?.type === FormulaType.OUTPUTVIEW) {
                        return
                    }
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
            graph.on('node:added', async ({ node }) => {
                if (!getPageStatus()) {
                    setPageStatus(true)
                }
                if (node.shape === 'scene-analysis-node') {
                    if (getCurrentDndNode()) {
                        const { formula } = node.data
                        node.removePorts()
                        node.addPorts(
                            getPortsByType(node.id, NodeDataType.JOIN),
                        )
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
                        setCurrentDndNode(null)
                        loopCalculationNodeData(
                            graphCase.current!,
                            [node!],
                            fieldsData,
                            module,
                            userInfo,
                        )
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
                // if (getEditNode() && node.id !== getEditNode()?.id) {
                //     handleOptionClose(false, false)
                // }
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
                        type: changeTypeToLargeArea(item.data_type),
                        // dict_id: item?.code_table_id || undefined,
                        // dict_name: item?.code_table || undefined,
                        // dict_deleted: item?.code_table_status === 'deleted',
                        // dict_state:
                        //     item?.code_table_status === 'disable'
                        //         ? 'disable'
                        //         : 'enable',
                        // standard_code: item?.standard_code || undefined,
                        // standard_name: item?.standard || undefined,
                        // standard_deleted: item?.standard_status === 'deleted',
                        // standard_state:
                        //     item?.standard_status === 'disable'
                        //         ? 'disable'
                        //         : 'enable',
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
                let outViewData: any[] = []
                let attrsData: any[] = []
                let res: any = {}
                if (module === ModuleType.SceneAnalysis) {
                    res = await querySceneAnalysisDetail(sceneId)
                } else if (operate === OperateType.EDIT) {
                    const [
                        { value: fieldsRes },
                        { value: sceneRes },
                        { value: viewRes },
                        { value: attrsRes },
                    ]: any = await Promise.allSettled([
                        getLogicViewFields(),
                        querySceneAnalysisDetail(sceneId),
                        getDataViewBaseInfo(viewId),
                        module === ModuleType.LogicEntityView
                            ? getLogicalData(objId, entityId)
                            : null,
                    ])
                    outViewData = fieldsRes
                    attrsData = attrsRes
                    res = {
                        ...sceneRes,
                        name: viewRes?.business_name,
                        technical_name: viewRes?.technical_name,
                    }
                    setDatasheetInfo({
                        ...viewRes,
                        id: viewId,
                    })
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
                        // 编辑进来 重绘节点
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
                                    formula: a.formula.map((f) => {
                                        if (f.type === FormulaType.OUTPUTVIEW) {
                                            const { config_fields } = f.config
                                            if (
                                                module === ModuleType.CustomView
                                            ) {
                                                return {
                                                    ...f,
                                                    config: {
                                                        ...f.config,
                                                        config_fields:
                                                            config_fields.map(
                                                                (item) => {
                                                                    const fieldItem =
                                                                        outViewData.find(
                                                                            (
                                                                                c,
                                                                            ) =>
                                                                                c.outId ===
                                                                                item.outId,
                                                                        )
                                                                    if (
                                                                        fieldItem
                                                                    ) {
                                                                        return {
                                                                            ...item,
                                                                            ...fieldItem,
                                                                        }
                                                                    }
                                                                    return item
                                                                },
                                                            ),
                                                    },
                                                }
                                            }
                                            return {
                                                ...f,
                                                config: {
                                                    ...f.config,
                                                    config_fields:
                                                        attrsData.map(
                                                            (item) => {
                                                                const fieldItem =
                                                                    config_fields.find(
                                                                        (c) =>
                                                                            c.attrId ===
                                                                            item.attrId,
                                                                    )
                                                                if (fieldItem) {
                                                                    if (
                                                                        item.canChanged
                                                                    ) {
                                                                        const fieldItem2 =
                                                                            outViewData.find(
                                                                                (
                                                                                    c,
                                                                                ) =>
                                                                                    c.outId ===
                                                                                    fieldItem.outId,
                                                                            )
                                                                        return {
                                                                            ...fieldItem,
                                                                            ...item,
                                                                            ...omit(
                                                                                fieldItem2,
                                                                                'type',
                                                                            ),
                                                                            data_type:
                                                                                fieldItem2.type,
                                                                        }
                                                                    }
                                                                    return {
                                                                        ...fieldItem,
                                                                        ...omit(
                                                                            item,
                                                                            'name_en',
                                                                        ),
                                                                    }
                                                                }
                                                                return item
                                                            },
                                                        ),
                                                },
                                            }
                                        }
                                        return f
                                    }),
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
        } catch (e) {
            sceneAnalFormatError(module, navigator, e)
            setPageStatus(false)
        } finally {
            setLoading(false)
            movedToCenter()
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

    // step2.初始化画布内容, 创建节点
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
                undefined,
            )
        } else {
            createNodeInGraph(
                graphCase.current!,
                {
                    x: ((graphBodyDom?.scrollWidth || 1280) - 140) / 2 + 150,
                    y: ((graphBodyDom?.scrollHeight || 720) - 130) / 2,
                },
                FormulaType.OUTPUTVIEW,
                undefined,
                '输出库表',
            )
        }
        // movedToCenter()
    }

    const saveLeftViewIds = async (scene_id) => {
        const ids = dataViewLists.map((item) => item.id)
        const res = await saveMultiViewRequest({ ids, scene_id })
        return res
    }

    function extractNumbers(input) {
        const regex = /\((\d+)(?:,(\d+))?\)/ // 匹配括号中的一个或两个数字
        const match = input.match(regex)
        if (match) {
            const firstNumber = parseInt(match[1], 10)
            const secondNumber = match[2] ? parseInt(match[2], 10) : null // 如果存在第二个数字，则解析
            return [firstNumber, secondNumber] // 返回数字数组
        }
        return null // 如果没有匹配，返回 null
    }

    // 保存场景分析画布内容
    const saveContent = async () => {
        if (!graphCase.current) return
        graphCase.current.getNodes().forEach((n) => {
            n.replaceData({ ...n.data, selected: false })
        })
        if (getEditNode()) {
            handleOptionClose(false, false)
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
                                                      ...f.config.merge,
                                                      nodes: f.config.merge.nodes.map(
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
                let data: any = {
                    ...pick(datasheetInfo, [
                        'business_name',
                        'technical_name',
                        'description',
                        'subject_id',
                        'department_id',
                        'owners',
                    ]),
                }
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
                    const findItem2 = fieldsData.exampleData.find(
                        (b) => b.id === a.formulaId,
                    )
                    // 找到生成 输出字段的算子
                    const sourceFormulaItem = getFormulaItem(
                        graphCase.current,
                        a.formulaId,
                    )
                    const sourceFieldName =
                        sourceFormulaItem?.output_fields?.find(
                            (item) => item.id === a?.id,
                        )?.name
                    // 找到与样例数据name一样的数据类型
                    const sourceFieldTypeInfo = findItem2?.columns?.find(
                        (b) => b.name === sourceFieldName,
                    )?.type
                    // 经过sql 或 merge 生成的样例数据中 数据类型的长度和精度 eg: decimal(10,2)
                    let dataLen
                    let dataAccuracy
                    if (sourceFieldTypeInfo?.includes('(')) {
                        const res = extractNumbers(sourceFieldTypeInfo)
                        dataLen = res?.[0]
                        dataAccuracy = res?.[1]
                    }
                    const type =
                        module === ModuleType.LogicEntityView
                            ? a.data_type
                            : a.type
                    let moreInfoField
                    if (moreData.length > 0) {
                        moreInfoField = moreData.find(
                            (item) => item.id === a.outId,
                        )
                    } else {
                        moreInfoField = findItem
                    }
                    return {
                        id: a.outId,
                        business_name: a.alias,
                        technical_name: a.name_en,
                        primary_key: a.primary_key,
                        data_type: type,
                        // reset_data_length存在即代表更改过数据长度
                        data_accuracy:
                            dataAccuracy || dataAccuracy === 0
                                ? dataAccuracy
                                : findItem?.reset_data_length
                                ? findItem?.reset_data_accuracy
                                : findItem?.data_accuracy,
                        data_length:
                            dataLen ||
                            findItem?.reset_data_length ||
                            findItem?.data_length,
                        is_nullable: findItem?.is_nullable,
                        original_data_type: findItem?.original_data_type,
                        attribute_id:
                            module === ModuleType.LogicEntityView
                                ? a.attribute_id
                                : moreInfoField?.attribute_id,
                        label_id: moreInfoField?.label_id,
                        label_name: moreInfoField?.label_name,
                        grade_type: moreInfoField?.grade_type
                            ? moreInfoField?.grade_type?.toString()
                            : undefined,
                        code_table_id: moreInfoField?.code_table_id,
                        standard: moreInfoField?.standard,
                        standard_code: moreInfoField?.standard_code,
                        business_timestamp: moreInfoField?.business_timestamp,
                        clear_attribute_id: moreInfoField?.clear_attribute_id,
                    }
                })
                let backId = viewId
                if (operate === OperateType.CREATE) {
                    if (!data?.business_name || !data?.technical_name) return
                    // 检查库表信息
                    const businessNameError = await onValidateNameRepeat(
                        datasheetInfo?.business_name,
                        'business_name',
                    )
                    const technicalNameError = await onValidateNameRepeat(
                        datasheetInfo?.technical_name,
                        'technical_name',
                    )
                    if (
                        businessNameError !== false ||
                        technicalNameError !== false
                    ) {
                        return
                    }

                    const { id, view_sql } = await postSceneDataView({
                        name: data.business_name,
                        canvas: JSON.stringify(cellsData),
                        config: JSON.stringify(configData),
                        type: 'data-view',
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
                    // 保存一下左侧的库表ids
                    await saveLeftViewIds(id)
                    message.success(__('发布成功'))
                    setIsSubmitBasicInfoForm(false)
                } else {
                    // 检查库表信息
                    const businessNameError = await onValidateNameRepeat(
                        datasheetInfo?.business_name,
                        'business_name',
                    )
                    const technicalNameError = await onValidateNameRepeat(
                        datasheetInfo?.technical_name,
                        'technical_name',
                    )
                    if (
                        businessNameError !== false ||
                        technicalNameError !== false
                    ) {
                        return
                    }

                    const { view_sql, id } = await putSceneDataView({
                        id: sceneId,
                        canvas: JSON.stringify(cellsData),
                        config: JSON.stringify(configData),
                        type: 'data-view',
                    })
                    if (datasheetInfo?.id) {
                        // 提交库表基本信息
                        await onSubmitBasicInfo()
                    }
                    if (view_sql) {
                        const business_timestamp_id = outputFields.find(
                            (item) => item.business_timestamp,
                        )?.id
                        await putDataViewLogicView({
                            id: viewId,
                            sql: view_sql,
                            type:
                                module === ModuleType.CustomView
                                    ? 'custom'
                                    : 'logic_entity',
                            business_timestamp_id,
                            logic_view_field: outputFields,
                        })
                    }
                    // 保存一下左侧的库表ids
                    await saveLeftViewIds(id)
                    message.success(__('更新库表成功'))
                }
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
                setDatasheetInfo((prev) => ({ ...prev, ...viewDa }))
            }
            setMode(ModeType.More)
            onOpenDataViewDetails?.()
            // 新增库表走库表详情表单自带校验
            setIsSubmitBasicInfoForm(operate === OperateType.CREATE)
            saveContent()
        } catch (err) {
            formatError(err)
        } finally {
            // setDeletable(false)
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

    // step3.拖拽添加节点
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
                // 带库表拖拽
                const nodeId = StringExt.uuid()
                const { id, title, business_name = undefined, fields } = item
                const fieldsArray = (fields || []).map((field) => ({
                    alias: field.business_name,
                    id: field.id,
                    name: field.business_name,
                    sourceId: nodeId,
                    originName: field.business_name,
                    checked: true,
                    beEditing: false,
                    data_type: changeTypeToLargeArea(field.data_type),
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
                // await loopCalculationNodeData(
                //     graphCase.current!,
                //     [node!],
                //     fieldsData,
                //     module,
                //     userInfo,
                // )
                // changSaveState()
            } else {
                node = createNodeInGraph(
                    graphCase.current,
                    {
                        x: 100,
                        y: 100,
                    },
                    undefined,
                    undefined,
                    undefined,
                    'create',
                )
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
     * @exec 直接执行，跳过判断
     * @checkCurrent 是否检查当前算子
     */
    const optionGraphData = async (values: {
        node: Node
        index: number
        item: IFormula
        exec?: boolean
        checkCurrent?: boolean
    }) => {
        const { node, index, item, exec = false, checkCurrent = true } = values
        if (!checkCurrent && selectedFormula && selectedFormula.id === item?.id)
            return
        // cancelRunGraph()
        if (!exec && selectedFormula) {
            const hasChanged = await formulaRef?.current?.checkSaveChanged()
            if (hasChanged) {
                setSaveFormulaModal(true)
                graphCase.current?.resetSelection(editNode)
                setContinueFn({
                    flag: 'optionGraphData',
                    fn: optionGraphData,
                    params: { ...values, exec: true },
                })
                return
            }
        }
        graphCase.current?.resetSelection(node)
        setRunNode(undefined)
        setEditNode(node)
        setSelectedIndex(index)
        setOptionType(item.type as FormulaType)
        setSelectedFormula(item)
        if (defaultSize[0] === 99 || defaultSize[0] === 100) {
            setFullScreen(false)
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
    const handleOptionClose = async (
        bo: boolean = true,
        canClose: boolean = true,
    ) => {
        const tempNodeId = editNode?.id
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
        if (!continueFn) {
            setOptionType(FormulaType.NONE)
            setSelectedFormula(undefined)
            setDefaultSize([100, 0])
            setEditNode(undefined)
        }
        // cancelRunGraph()
        // if (getEditNode() && getEditNode()?.id !== tempNodeId) {
        //     return
        // }
        if (continueFn) {
            const { fn, params } = continueFn
            fn(params)
            setContinueFn(undefined)
            return
        }
        if (optionType === FormulaType.SQL) {
            cancelRequest(
                '/api/scene-analysis/v1/scene/exec-sql?type=data-view&need=true',
                'post',
            )
        }
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
                optionGraphData({ node, index: newIndex, item: fl })
            }
            // // 检查 sql 算子前序情况
            // const sqlNodes: Node[] =
            //     graphCase.current
            //         ?.getNodes()
            //         ?.filter((n) =>
            //             n?.data?.formula?.find(
            //                 (f) => f.type === FormulaType.SQL,
            //             ),
            //         ) || []
            // if (sqlNodes.length > 0) {
            //     sqlNodes.forEach((sourceNode) => {
            //         let hasError = false
            //         const preSor: Node[] = getPreorderNode(
            //             graphCase.current?.getNodes(),
            //             sourceNode,
            //         )
            //         forIn(preSor, (n: any) => {
            //             if (
            //                 n?.data?.formula.find((f) =>
            //                     [
            //                         FormulaType.MERGE,
            //                         FormulaType.DISTINCT,
            //                         FormulaType.WHERE,
            //                     ].includes(f.type),
            //                 )
            //             ) {
            //                 hasError = true
            //             }
            //         })
            //         if (hasError) {
            //             sourceNode.replaceData({
            //                 ...sourceNode.data,
            //                 formula: sourceNode.data.formula.map((info) => {
            //                     if (info.type === FormulaType.SQL) {
            //                         return {
            //                             ...info,
            //                             errorMsg: FormulaError.IndexError,
            //                         }
            //                     }
            //                     return info
            //                 }),
            //             })
            //         }
            //     })
            // }
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
                            optionGraphData({ node, index: newIndex, item: fl })
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
                            optionGraphData({
                                node: getEditNode()!,
                                index: getSelectedIndex(),
                                item: fl,
                            })
                        }
                    }
                    break
                }

                default: {
                    const fl = getEditNode()?.data?.formula?.[index]
                    if (fl) {
                        optionGraphData({
                            node: getEditNode()!,
                            index,
                            item: fl,
                        })
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
                    ) &&
                    info.config?.method === 'post'
                ) {
                    info.source.cancel()
                }
            })
        }
    }

    // 执行
    const runGraph = async (values: {
        exec?: boolean
        node?: Node
        offset: number
        limit: number
        isFirst: boolean
    }) => {
        const {
            exec = false,
            node,
            offset = 1,
            limit = 20,
            isFirst = true,
        } = values
        if (!exec && selectedFormula) {
            const hasChanged = await formulaRef?.current?.checkSaveChanged()
            if (hasChanged) {
                setSaveFormulaModal(true)
                graphCase.current?.resetSelection(editNode)
                setContinueFn({
                    flag: 'runGraph',
                    fn: runGraph,
                    params: { ...values, exec: true },
                })
                return
            }
        }
        setOptionType(FormulaType.NONE)
        setSelectedFormula(undefined)
        // handleOptionClose(false)
        if (!graphCase.current || !node) {
            return
        }
        graphCase.current?.resetSelection(node)
        setRunNode(node)
        setEditNode(node)
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
                                if (isNull(innerItem)) {
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

    /**
     * 底部栏切换展开状态
     * @closed 关闭
     */
    // eslint-disable-next-line
    const handleChangeExpand = (closed: boolean = false, openBox?: boolean) => {
        const isFull =
            ((window.innerHeight - 52 - 54) * defaultSize[0]) / 100 < 48
        if (openBox) {
            setFullScreen(isFull)
            setDragExpand(true)
            setDefaultSize(defaultSize.map((info) => info + 0.001))
            return false
        }
        if (closed) {
            // cancelRunGraph()
            setDefaultSize([100, 0])
            handleOptionClose(false)
        } else {
            if (defaultSize[0] === 99) {
                setDefaultSize([40, 60])
                setFullScreen(false)
            } else if (!dragExpand) {
                setDefaultSize(defaultSize.map((info) => info + 0.001))
                setFullScreen(isFull)
            } else {
                setFullScreen(false)
            }

            setDragExpand(!dragExpand)
        }
    }

    const handleFullScreen = (flag: boolean = true) => {
        setFullScreen(flag)
        if (flag) {
            if (defaultSize[0] === 0) {
                setDefaultSize(defaultSize.map((info) => info + 0.001))
            } else {
                setDefaultSize([0, 100])
            }
            setDragExpand(true)
        } else {
            setDefaultSize([40, 60])
        }
    }

    const onChange = (newActiveKey: string) => {
        dispatch({
            type: CHANGE_TAB_ACTIVE_KEY,
            data: newActiveKey,
        })
    }

    const remove = (targetKey: string) => {
        if (targetKey === 'all') {
            dispatch({
                type: CHANGE_TAB_ITEMS,
                data: [],
            })
            dispatch({
                type: CHANGE_TAB_ACTIVE_KEY,
                data: 'canvas',
            })
            return
        }
        let newActiveKey = targetKey
        let lastIndex = -1
        tabItems.forEach((item, i) => {
            if (item.key === targetKey) {
                lastIndex = i - 1
            }
        })
        const newPanes = tabItems.filter((item) => item.key !== targetKey)
        if (newPanes.length && newActiveKey === targetKey) {
            if (lastIndex >= 0) {
                newActiveKey = newPanes[lastIndex].key
            } else {
                newActiveKey = newPanes[0].key
            }
        }
        if (lastIndex === -1) {
            newActiveKey = 'canvas'
        }
        dispatch({
            type: CHANGE_TAB_ITEMS,
            data: newPanes,
        })
        dispatch({
            type: CHANGE_TAB_ACTIVE_KEY,
            data: newActiveKey,
        })
    }

    const onEdit = (targetKey: string, action: 'add' | 'remove') => {
        if (action === 'remove') {
            remove(targetKey)
        }
    }

    return (
        <div className={styles.sceneGraphWrap} ref={content}>
            <div ref={dndContainer} className={styles.dndDrag}>
                <GraphHeader
                    onStartDrag={startDrag}
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
            <div className={styles.loadingGraph} hidden={!loading}>
                <Spin />
            </div>
            <div
                className={styles.sceneGraphContainer}
                style={{ opacity: loading ? 0 : 100 }}
            >
                <DragBox
                    defaultSize={defaultHorizontalSize}
                    minSize={[280, 270]}
                    maxSize={[800, Infinity]}
                    expandCloseText="数据来源"
                    onDragEnd={(size) => {
                        setDefaultHorizontalSize(size)
                    }}
                    defaultExpand={mode === ModeType.Model}
                    showExpandBtn={mode === ModeType.Model}
                    gutterSize={4}
                    rightNodeStyle={{ padding: 0 }}
                >
                    <LeftViewCont
                        onStartDrag={startDrag}
                        graphCase={graphCase.current}
                        optionType={optionType}
                    />
                    <div className={styles.rightContainer}>
                        <Tabs
                            type="editable-card"
                            onChange={onChange}
                            activeKey={activeKey}
                            // @ts-ignore
                            onEdit={onEdit}
                            hideAdd
                            tabBarExtraContent={
                                tabItems?.length > 0 && (
                                    <div className={styles.rightExtra}>
                                        <Tooltip
                                            placement="bottomRight"
                                            title={__('【清理所有库表预览】')}
                                            arrowPointAtCenter
                                        >
                                            <div
                                                className={styles.cleanIcon}
                                                onClick={() => remove('all')}
                                            >
                                                <FontIcon
                                                    name="icon-qingli"
                                                    className={styles.icon}
                                                />
                                            </div>
                                        </Tooltip>
                                    </div>
                                )
                            }
                        >
                            <Tabs.TabPane
                                tab={
                                    <span
                                        className={styles.tabLabelContainer}
                                        title="模型画布"
                                    >
                                        <span className={styles.tabLabelText}>
                                            {__('模型画布')}
                                        </span>
                                    </span>
                                }
                                key="canvas"
                                closable={false}
                            >
                                <div
                                    style={{
                                        height: '100%',
                                        background: '#F6F9FB',
                                        display: 'flex',
                                    }}
                                    id="graphWrapper"
                                >
                                    <DragVeticalBox
                                        defaultSize={defaultSize}
                                        minSize={
                                            defaultSize[0] === 100 || fullScreen
                                                ? 0
                                                : 40
                                        }
                                        onDragEnd={(rate) => {
                                            const close =
                                                ((window.innerHeight -
                                                    52 -
                                                    54) *
                                                    rate[1]) /
                                                    100 <
                                                48
                                            setDragExpand(!close)
                                            if (close) {
                                                setDefaultSize([99, 1])
                                            } else {
                                                setDefaultSize(rate)
                                            }
                                        }}
                                        hiddenElement={
                                            defaultSize[0] === 100
                                                ? 'right'
                                                : ''
                                        }
                                        collapsed={dragExpand ? undefined : 1}
                                        gutterSize={8}
                                        gutterStyle={() => ({
                                            height: '8px',
                                            background: '#FFF',
                                            width: '100%',
                                            visibility:
                                                defaultSize[0] === 100
                                                    ? 'hidden'
                                                    : 'visible',
                                            pointerEvents: fullScreen
                                                ? 'none'
                                                : 'all',
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
                                            {/* <div
                                                className={styles.loadingGraph}
                                                hidden={!loading}
                                            >
                                                <Spin />
                                            </div> */}
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
                                                            <div>
                                                                {__(
                                                                    '开始配置场景',
                                                                )}
                                                            </div>
                                                        </>
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                height: '100%',
                                                width: '100%',
                                            }}
                                        >
                                            <div
                                                className={styles.bottom}
                                                hidden={
                                                    optionType !==
                                                    FormulaType.NONE
                                                }
                                            >
                                                <div
                                                    className={styles.bottomTit}
                                                >
                                                    <span
                                                        className={
                                                            styles.bottomDescWrap
                                                        }
                                                    >
                                                        <span
                                                            style={{
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            {__('输出数据')}
                                                        </span>
                                                        <span
                                                            className={
                                                                styles.bottomDesc
                                                            }
                                                        >
                                                            <span
                                                                style={{
                                                                    flexShrink: 0,
                                                                }}
                                                            >
                                                                （
                                                                {__(
                                                                    '来自节点：',
                                                                )}
                                                            </span>
                                                            <span
                                                                className={
                                                                    styles.bottomDescName
                                                                }
                                                                title={
                                                                    runNode
                                                                        ?.data
                                                                        ?.name ||
                                                                    __('未命名')
                                                                }
                                                            >
                                                                {runNode?.data
                                                                    ?.name ||
                                                                    __(
                                                                        '未命名',
                                                                    )}
                                                            </span>
                                                            ）
                                                        </span>
                                                    </span>
                                                    <div
                                                        className={
                                                            styles.btnWrap
                                                        }
                                                    >
                                                        <Tooltip
                                                            title={__('收起')}
                                                            getPopupContainer={(
                                                                n,
                                                            ) =>
                                                                n.parentElement!
                                                            }
                                                        >
                                                            <div
                                                                hidden={
                                                                    !dragExpand
                                                                }
                                                                className={
                                                                    styles.expandIcon
                                                                }
                                                                style={{
                                                                    marginRight: 8,
                                                                }}
                                                                onClick={() =>
                                                                    handleChangeExpand()
                                                                }
                                                            >
                                                                <DownOutlined />
                                                            </div>
                                                        </Tooltip>
                                                        <Tooltip
                                                            title={__('展开')}
                                                            getPopupContainer={(
                                                                n,
                                                            ) =>
                                                                n.parentElement!
                                                            }
                                                        >
                                                            <div
                                                                hidden={
                                                                    dragExpand
                                                                }
                                                                className={
                                                                    styles.expandIcon
                                                                }
                                                                style={{
                                                                    marginRight: 8,
                                                                }}
                                                                onClick={() =>
                                                                    handleChangeExpand()
                                                                }
                                                            >
                                                                <UpOutlined />
                                                            </div>
                                                        </Tooltip>
                                                        <Tooltip
                                                            title={__('关闭')}
                                                            getPopupContainer={(
                                                                n,
                                                            ) =>
                                                                n.parentElement!
                                                            }
                                                        >
                                                            <div
                                                                className={
                                                                    styles.expandIcon
                                                                }
                                                                onClick={() => {
                                                                    handleChangeExpand(
                                                                        true,
                                                                    )
                                                                    setRunNode(
                                                                        undefined,
                                                                    )
                                                                    setEditNode(
                                                                        undefined,
                                                                    )
                                                                }}
                                                            >
                                                                <CloseOutlined />
                                                            </div>
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                                {fetching ? (
                                                    <div
                                                        style={{
                                                            marginTop: 60,
                                                        }}
                                                    >
                                                        <Spin
                                                            className={
                                                                styles.ldWrap
                                                            }
                                                        />
                                                    </div>
                                                ) : errorMsg ||
                                                  runList.length === 0 ? (
                                                    <div>
                                                        <Empty
                                                            iconSrc={dataEmpty}
                                                            desc={
                                                                <div
                                                                    style={{
                                                                        textAlign:
                                                                            'center',
                                                                    }}
                                                                >
                                                                    <div>
                                                                        {__(
                                                                            '暂无数据',
                                                                        )}
                                                                    </div>
                                                                    <div
                                                                        hidden={
                                                                            !errorMsg
                                                                        }
                                                                    >
                                                                        {
                                                                            errorMsg
                                                                        }
                                                                    </div>
                                                                </div>
                                                            }
                                                        />
                                                    </div>
                                                ) : (
                                                    <Watermark
                                                        content={`${
                                                            userInfo?.VisionName ||
                                                            ''
                                                        } ${
                                                            userInfo?.Account ||
                                                            ''
                                                        }`}
                                                    >
                                                        <Table
                                                            className={
                                                                styles.bottomList
                                                            }
                                                            columns={runColumns}
                                                            dataSource={runList}
                                                            scroll={{
                                                                x:
                                                                    runColumns.length *
                                                                    200,
                                                                y:
                                                                    (window.innerHeight -
                                                                        52 -
                                                                        54) *
                                                                        (getDefaultSize()[1] /
                                                                            100) -
                                                                    161,
                                                                // ((runTotal || 0) <= 20 ? 114 : 161),
                                                            }}
                                                            loading={
                                                                tableFetching
                                                            }
                                                            pagination={{
                                                                current:
                                                                    runOffset,
                                                                pageSize:
                                                                    runPageSize,
                                                                total: runTotal,
                                                                showSizeChanger:
                                                                    (runTotal ||
                                                                        0) >
                                                                    ListDefaultPageSize[
                                                                        ListType
                                                                            .NarrowList
                                                                    ],
                                                                pageSizeOptions:
                                                                    ListPageSizerOptions[
                                                                        ListType
                                                                            .NarrowList
                                                                    ],
                                                                showTotal(
                                                                    total,
                                                                    range,
                                                                ) {
                                                                    return `${__(
                                                                        '总计',
                                                                    )} ${runTotal} ${__(
                                                                        '条数据',
                                                                    )}`
                                                                },
                                                                onChange: (
                                                                    page,
                                                                    pageSize,
                                                                ) => {
                                                                    runGraph({
                                                                        node: runNode,
                                                                        offset:
                                                                            pageSize !==
                                                                            runPageSize
                                                                                ? 1
                                                                                : page,
                                                                        limit: pageSize,
                                                                        isFirst:
                                                                            false,
                                                                    })
                                                                },
                                                            }}
                                                        />
                                                    </Watermark>
                                                )}
                                            </div>
                                            <AllFormula
                                                ref={formulaRef}
                                                editNode={editNode}
                                                selectedFormula={getSelectedFormula()}
                                                fieldsData={fieldsData}
                                                viewSize={getDefaultSize()[1]}
                                                dragExpand={dragExpand}
                                                handleChangeExpand={
                                                    handleChangeExpand
                                                }
                                                handleOptionClose={
                                                    handleOptionClose
                                                }
                                                graph={graphCase.current}
                                                module={module}
                                                fullScreen={fullScreen}
                                                handleFullScreen={
                                                    handleFullScreen
                                                }
                                            />
                                        </div>
                                    </DragVeticalBox>
                                </div>
                            </Tabs.TabPane>

                            {tabItems.map((tabI) => (
                                <Tabs.TabPane
                                    tab={
                                        <span
                                            className={styles.tabLabelContainer}
                                            title={tabI.label}
                                        >
                                            <DatasheetViewColored
                                                style={{ marginRight: 12 }}
                                            />
                                            <span
                                                className={styles.tabLabelText}
                                            >
                                                {tabI.label}
                                            </span>
                                        </span>
                                    }
                                    key={tabI.key}
                                >
                                    {tabI.children}
                                </Tabs.TabPane>
                            ))}
                        </Tabs>
                    </div>
                </DragBox>
            </div>

            <EditNodeName
                visible={!!editNameNode}
                graph={graphCase.current}
                node={editNameNode}
                onClose={(node?: any) => {
                    if (node) {
                        refreshOptionGraphData(node, 0)
                    }
                    setEditNameNode(undefined)
                }}
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
            {/* {logicViewBasicInfoVisible && (
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
            )} */}
            <FormulaSaveModal
                open={saveFormulaModal}
                formulaItem={selectedFormula}
                onCancel={() => {
                    setSaveFormulaModal(false)
                    if (continueFn) {
                        const { fn, params } = continueFn
                        fn(params)
                        setContinueFn(undefined)
                    }
                }}
                onContinue={() => {
                    setSaveFormulaModal(false)
                    setContinueFn(undefined)
                }}
                onSave={() => {
                    setSaveFormulaModal(false)
                    formulaRef?.current?.onSave()
                }}
            />
        </div>
    )
})

export default SceneGraph
