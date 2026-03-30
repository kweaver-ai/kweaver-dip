import { CloseOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import { Graph, Node, Platform, StringExt } from '@antv/x6'
import { register } from '@antv/x6-react-shape'
import { Spin, Table, Tooltip } from 'antd'
import React, {
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
import { useGetState, useSize } from 'ahooks'
import { forIn, isNull, last } from 'lodash'
import moment from 'moment'
import dataEmpty from '@/assets/dataEmpty.svg'
import graphEmpty from '@/assets/graphEmpty2.svg'
import Confirm from '@/components/Confirm'
import { DataType } from '@/components/DataEleManage/const'
import DragVeticalBox from '@/components/DragVeticalBox'
import {
    IFormula,
    formatError,
    getErrorMessage,
    messageError,
    postSceneDataView,
    putSceneDataView,
    querySceneAnalysisDetail,
    runSceneView,
} from '@/core'
import {
    instancingGraph,
    sceneConnector,
    sceneEdgeConfig,
} from '@/core/graph/graph-config'
import { X6PortalProvider } from '@/core/graph/helper'
import { Plugins, loadPlugins } from '@/core/graph/plugin'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Watermark } from '@/ui'
import Empty from '@/ui/Empty'
import { cancelRequest, getSource } from '@/utils'
import { FormulaType, NodeDataType, formulaInfo, portconfig } from './const'
import { CustomViewReduxWrapper } from './CustomViewRedux'
import { FieldsData } from './FieldsData'
import {
    createNodeInGraph,
    getPortsByType,
    getPreorderNode,
    getRunViewParam,
    loopCalculationNodeData,
    sceneAlsDataType,
    storeExampleData,
    trackingCalculationAll,
} from './helper'
import __ from './locale'
import EditNodeName from './Node/EditNodeName'
import SceneNodeComponent from './Node/SceneNode'
import styles from './styles.module.less'
import AllFormula from './UnitForm/AllFormula'
import FormulaSaveModal from './UnitForm/FormulaSaveModal'
import { useViewGraphContext } from './ViewGraphProvider'
import './x6Style.less'

/**
 * @interface IGraphContent
 * @param {any[]} moreData 更多属性中编辑的信息（分类分级、标准、码表）
 */
interface IGraphContent {
    ref?: any
    dndContainer?: React.RefObject<HTMLDivElement>
    setGraphSize?: (size: number) => void
    setCanSave?: (canSave: boolean) => void
    onReady?: () => void
    onSave?: (value: any) => void
}
const GraphContent: React.FC<IGraphContent> = forwardRef((props: any, ref) => {
    const { dndContainer, setGraphSize, setCanSave, onReady, onSave } = props
    const {
        setDeletable,
        getDeletable,
        graphSize,
        viewMode,
        viewHeight = window.innerHeight - 52,
        modelInfo,
        continueFn,
        setContinueFn,
        getContinueFn,
    } = useViewGraphContext()

    const [userInfo] = useCurrentUser()
    const graphCase = useRef<Graph>()
    const dndCase = useRef<Dnd>()
    const graphBody = useRef<HTMLDivElement>(null)
    const container = useRef<HTMLDivElement>(null)
    const content = useRef<HTMLDivElement>(null)
    const size = useSize(content)
    const [loading, setLoading] = useState(true)
    const [isDrag, setIsDrag, getDrag] = useGetState(false)

    // 拖拽添加节点
    const [currentDndNode, setCurrentDndNode, getCurrentDndNode] =
        useGetState<any>(null)
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

    // 算子保存提示窗口
    const formulaRef = useRef<any>(null)
    const [saveFormulaModal, setSaveFormulaModal] = useState<boolean>(false)

    // 字段数据
    const fieldsData = useMemo(() => {
        return new FieldsData()
    }, [])

    useEffect(() => {
        if (ref && typeof ref === 'object' && ref.current) {
            onReady?.()
        }
    }, [ref])

    const inViewMode = useMemo(() => viewMode === 'view', [viewMode])

    useMemo(() => {
        // 注册链接器
        Graph.registerConnector('curveConnector', sceneConnector, true)
        // 注册边的样式
        Graph.registerEdge('data-scene-edge', { ...sceneEdgeConfig }, true)

        register({
            shape: 'scene-analysis-node',
            effect: ['data'],
            component: SceneNodeComponent,
            ports: {
                ...(portconfig as any),
            },
        })
        return () => {
            unRegistryPort()
        }
    }, [])

    useImperativeHandle(ref, () => ({
        handleShowAll: showAllGraphSize,
        handleChangeGraphSize: changeGraphSize,
        handleMovedToCenter: movedToCenter,
        handleStartDrag: startDrag,
        handleSave: saveContent,
        handleRefresh: refreshGraph,
        handleOptionGraphData: optionGraphData,
        handleEditFormName: editFormName,
        handleRunGraph: runGraph,
        handleRefreshOptionGraphData: refreshOptionGraphData,
        handleDeleteCells,
        graphCase: graphCase.current,
    }))

    // 注销画布注册的桩
    const unRegistryPort = () => {
        Graph.unregisterConnector('curveConnector')
        Graph.unregisterEdge('data-scene-edge')
    }

    useEffect(() => {
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
                dndContainer: dndContainer?.current || undefined,
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
                if (!inViewMode) {
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
                }
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
                            __('数据合并算子不能同时关联两个来源相同的目录'),
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
                if (inViewMode) {
                    return
                }
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
                                    magnet: false,
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
                                    magnet: false,
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
                                    magnet: false,
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
                if (inViewMode) {
                    return
                }
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
                //     handleOptionClose(false)
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
        if (inViewMode) return
        if (!graphCase.current || getEditNameNode()) return
        if (!getDeletable?.()) return
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
            if (tempDel.id === getEditNode()?.id) {
                handleOptionClose(false)
            }
            if (tempDel.id === getRunNode()?.id) {
                setRunNode(undefined)
            }
            graphCase.current?.removeNode(tempDel)
        }
        setDeleteNode(undefined)
    }

    // 获取场景分析内容
    const getContent = async () => {
        if (!graphCase || !graphCase.current) {
            setLoading(false)
            return
        }
        try {
            setLoading(true)
            if (!modelInfo?.scene_analysis_id) {
                initGraph()
            } else {
                const res = await querySceneAnalysisDetail(
                    modelInfo.scene_analysis_id,
                )
                setSceneData(res)
                const { canvas, config } = res
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
                        const findItem = tempCanvas.find((b) => b.id === a.id)
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
                                expand: findItem?.data?.expand,
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
                    drawPortByEdge()
                    if (inViewMode) {
                        changeAllPortDisable()
                    }
                }
                deleteEdgeTool()
            }
        } catch (e) {
            // sceneAnalFormatError(module, navigator, e)
            formatError(e)
            setPageStatus(false)
        } finally {
            setLoading(false)
            movedToCenter()
            await trackingCalculationAll(
                graphCase.current,
                fieldsData,
                userInfo,
                inViewMode,
            )
            changSaveState()

            if (!inViewMode) {
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

    // 根据线绘制连接桩
    const drawPortByEdge = () => {
        graphCase?.current?.getEdges().forEach((edge) => {
            const sourceNode = edge.getSourceNode()
            const targetNode = edge.getTargetNode()
            const rightPort = sourceNode?.getPorts().find((port) => {
                return port?.group === 'out'
            })
            if (rightPort && rightPort.id) {
                sourceNode?.setPortProp(rightPort.id, 'attrs/wrap', {
                    fill: 'none',
                    magnet: true,
                })
                sourceNode?.setPortProp(rightPort.id, 'attrs/point', {
                    fill: '#BFBFBF',
                    stroke: '#BFBFBF',
                    magnet: true,
                })
            }
            const leftport = targetNode?.getPorts().find((port) => {
                return port?.group === 'in'
            })
            if (leftport && leftport.id) {
                targetNode?.setPortProp(leftport.id, 'attrs/wrap', {
                    fill: 'none',
                    magnet: true,
                })
                targetNode?.setPortProp(leftport.id, 'attrs/point', {
                    fill: '#BFBFBF',
                    stroke: '#BFBFBF',
                    magnet: true,
                })
            }
        })
    }

    // 设置所有连接桩禁用
    const changeAllPortDisable = () => {
        graphCase.current?.getNodes().forEach((n) => {
            const leftPort = n.getPorts().find((p) => p.group === 'in')
            const rightPort = n.getPorts().find((p) => p.group === 'out')
            if (leftPort && leftPort.id) {
                n.setPortProp(leftPort.id, 'attrs/wrap', {
                    magnet: false,
                })
                n.setPortProp(leftPort.id, 'attrs/point', {
                    magnet: false,
                })
            }
            if (rightPort && rightPort.id) {
                n.setPortProp(rightPort.id, 'attrs/wrap', {
                    magnet: false,
                })
                n.setPortProp(rightPort.id, 'attrs/point', {
                    magnet: false,
                })
            }
        })
    }

    // 初始化画布内容
    const initGraph = () => {
        if (!graphCase.current) {
            return
        }
        const graphBodyDom = document.getElementById('graphBody')

        const x = ((graphBodyDom?.scrollWidth || 1280) - 140) / 2
        const y = ((graphBodyDom?.scrollHeight || 720) - 130) / 2

        const node1 = createNodeInGraph(
            graphCase.current!,
            {
                x: x - 270,
                y: y - 105,
            },
            FormulaType.FORM,
            undefined,
            '库表1',
            'create',
        )
        const node2 = createNodeInGraph(
            graphCase.current!,
            {
                x: x - 270,
                y: y + 105,
            },
            FormulaType.FORM,
            undefined,
            '库表2',
            'create',
        )
        const node3 = createNodeInGraph(
            graphCase.current!,
            {
                x,
                y,
            },
            undefined,
            [node1, node2],
            '融合规则',
            'create',
        )
        const node4 = createNodeInGraph(
            graphCase.current!,
            {
                x: x + 270,
                y,
            },
            FormulaType.OUTPUTVIEW,
            [node3],
            '融合表',
            'create',
        )
        createEdge(node1.id, node3.id)
        createEdge(node2.id, node3.id)
        createEdge(node3.id, node4.id)
        graphCase.current?.addNodes([node1, node2, node3, node4])
        drawPortByEdge()
        if (inViewMode) {
            changeAllPortDisable()
        }
    }

    // 刷新画布
    const refreshGraph = async () => {
        if (!graphCase.current) {
            return
        }
        graphCase.current.removeCells(graphCase.current.getCells())
        fieldsData.clearData()
        setGraphSize(100)
        setTimeout(() => {
            getContent()
        }, 400)
    }

    // 保存场景分析画布内容
    const saveContent = async (values?: any) => {
        if (!graphCase.current) return Promise.reject(new Error(''))
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
                                                                                  findItem?.id,
                                                                              name_en:
                                                                                  c?.name_en ||
                                                                                  findItem?.name_en,
                                                                              original_name:
                                                                                  c?.original_name ||
                                                                                  findItem?.original_name,
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
                                                    id: a?.id || findItem?.id,
                                                    name_en:
                                                        findItem?.name_en ||
                                                        a?.name_en,
                                                    original_name:
                                                        findItem?.original_name ||
                                                        a?.original_name,
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
                                            id: a?.id || findItem?.id,
                                            name_en:
                                                a?.name_en || findItem?.name_en,
                                            original_name:
                                                a?.original_name ||
                                                findItem?.original_name,
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
                                    id: a?.id || findItem?.id,
                                    name_en: a?.name_en || findItem?.name_en,
                                    original_name:
                                        a?.original_name ||
                                        findItem?.original_name,
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

            outputFields = outputFields.map((a, idx) => {
                // const findItem = fieldsData.data.find((b) => b.id === a.id)
                // const editItem = modelInfo?.fields?.find(
                //     (item) => item.c_name === a.alias,
                // )
                return {
                    c_name: a?.alias,
                    code_rule_id: a?.code_rule_id,
                    code_table_id: a?.code_table_id,
                    data_accuracy: a?.data_accuracy,
                    data_length: a?.data_length,
                    data_type:
                        sceneAlsDataType.find((b) => b.value_en === a.data_type)
                            ?.id || DataType.TOTHER,
                    e_name: a?.name_en,
                    index: idx,
                    is_increment: a?.is_increment,
                    is_required: a?.is_required,
                    primary_key: a?.primary_key,
                    standard_id: a?.standard_id,
                }
            })
            let response = {}
            if (modelInfo?.scene_analysis_id) {
                const { view_sql } = await putSceneDataView({
                    id: modelInfo.scene_analysis_id,
                    canvas: JSON.stringify(cellsData),
                    config: JSON.stringify(configData),
                    type: 'data_fusion',
                })
                response = {
                    scene_analysis_id: modelInfo.scene_analysis_id,
                    scene_sql: view_sql,
                    fields: outputFields,
                }
            } else {
                const { id, view_sql } = await postSceneDataView({
                    name: `融合工单画布_${moment().valueOf()}`,
                    canvas: JSON.stringify(cellsData),
                    config: JSON.stringify(configData),
                    type: 'data_fusion',
                })
                response = {
                    scene_analysis_id: id,
                    scene_sql: view_sql,
                    fields: outputFields,
                }
            }
            setDeletable?.(true)
            onSave?.(response)
            return Promise.resolve('')
        } catch (err) {
            // sceneAnalFormatError(module, navigator, err, undefined, '无法保存')
            formatError(err)
            return Promise.reject(new Error(''))
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
        setGraphSize?.(multiple * 100)
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
                setGraphSize?.(400)
            } else {
                setGraphSize?.(showSize - (showSize % 5))
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
            const node = createNodeInGraph(
                graphCase.current,
                {
                    x: 100,
                    y: 100,
                },
                item,
                undefined,
                undefined,
                'create',
            )
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
     */
    const optionGraphData = async (values: {
        node: Node
        index: number
        item: IFormula
        exec?: boolean
        checkCurrent?: boolean
    }) => {
        const { node, index, item, exec = false, checkCurrent = true } = values
        if (
            !checkCurrent &&
            getSelectedFormula() &&
            getSelectedFormula()?.id === item?.id
        )
            return
        if (!exec && getSelectedFormula()) {
            const hasChanged = await formulaRef?.current?.checkSaveChanged()
            if (hasChanged) {
                setSaveFormulaModal(true)
                graphCase.current?.resetSelection(editNode)
                setContinueFn?.({
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
        if (getDefaultSize()[0] === 99 || getDefaultSize()[0] === 100) {
            setFullScreen(false)
            setDragExpand(true)
            setDefaultSize([40, 60])
        } else if (!dragExpand) {
            setDragExpand(true)
            setDefaultSize(getDefaultSize().map((info) => info + 0.001))
        }
    }

    /**
     * 操作结束
     * @bo 是否更新数据 true-更新
     */
    const handleOptionClose = async (bo: boolean = true) => {
        if (bo) {
            await loopCalculationNodeData(
                graphCase.current!,
                [getEditNode()!],
                fieldsData,
                userInfo,
                inViewMode,
            )
            changSaveState()

            // 存储样例数据
            if (
                getSelectedFormula()?.type === FormulaType.MERGE &&
                !inViewMode
            ) {
                storeExampleData(
                    graphCase.current!,
                    getEditNode()!,
                    fieldsData,
                    getSelectedFormula(),
                    undefined,
                    undefined,
                    true,
                )
            }
        }
        if (!getContinueFn?.()) {
            setOptionType(FormulaType.NONE)
            setSelectedFormula(undefined)
            setDefaultSize([100, 0])
            setEditNode(undefined)
        }
        // cancelRunGraph()
        // if (getEditNode() && getEditNode()?.id !== tempNodeId) {
        //     return
        // }
        if (getContinueFn?.()) {
            const { fn, params } = getContinueFn()
            fn(params)
            setContinueFn?.(undefined)
            return
        }
        if (getOptionType() === FormulaType.SQL) {
            cancelRequest(
                '/api/scene-analysis/v1/scene/exec-sql?type=data_fusion&need=true',
                'post',
            )
        }
    }

    // 检查输出算子节点是否可以执行
    const changSaveState = () => {
        if (!graphCase.current) return
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
        setCanSave?.(result)
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
            userInfo,
            inViewMode,
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
            limit = 50,
            isFirst = true,
        } = values
        if (!exec && getSelectedFormula()) {
            const hasChanged = await formulaRef?.current?.checkSaveChanged()
            if (hasChanged) {
                setSaveFormulaModal(true)
                graphCase.current?.resetSelection(getEditNode()!)
                setContinueFn?.({
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
        if (getDefaultSize()[0] === 100 || getDefaultSize()[0] === 99) {
            setDragExpand(true)
            setDefaultSize([40, 60])
        } else if (!dragExpand) {
            setDragExpand(true)
            setDefaultSize(getDefaultSize().map((info) => info + 0.001))
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
                false,
                'data_fusion',
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
                // info({
                //     title: __('无法执行'),
                //     icon: <InfoCircleFilled />,
                //     content: __('场景分析已不存在'),
                //     okText: __('确定'),
                //     onOk() {
                //         navigator('/dataProduct/sceneAnalysis')
                //     },
                // })
                setErrorMsg(getErrorMessage({ error }))
            } else {
                if (!getRunNode()) return
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
            ((window.innerHeight - 52 - 54) * getDefaultSize()[0]) / 100 < 48
        if (openBox) {
            setFullScreen(isFull)
            setDragExpand(true)
            setDefaultSize(getDefaultSize().map((info) => info + 0.001))
            return false
        }
        if (closed) {
            // cancelRunGraph()
            setDefaultSize([100, 0])
            handleOptionClose(false)
        } else {
            if (getDefaultSize()[0] === 99) {
                setDefaultSize([40, 60])
                setFullScreen(false)
            } else if (!dragExpand) {
                setDefaultSize(getDefaultSize().map((info) => info + 0.001))
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
            if (getDefaultSize()[0] === 0) {
                setDefaultSize(getDefaultSize().map((info) => info + 0.001))
            } else {
                setDefaultSize([0, 100])
            }
            setDragExpand(true)
        } else {
            setDefaultSize([40, 60])
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
                    y: viewHeight * (getDefaultSize()[1] / 100) - 114,
                }}
                loading={tableFetching}
                pagination={false}
            />
        </Watermark>
    )

    return (
        <CustomViewReduxWrapper>
            <div
                className={styles.graphContentWrap}
                ref={content}
                id="fusionGraphContent"
            >
                <DragVeticalBox
                    defaultSize={getDefaultSize()}
                    minSize={getDefaultSize()[0] === 100 || fullScreen ? 0 : 40}
                    onDragEnd={(rate) => {
                        const close = (window.innerHeight * rate[1]) / 100 < 48
                        setDragExpand(!close)
                        if (close) {
                            setDefaultSize([99, 1])
                        } else {
                            setDefaultSize(rate)
                        }
                    }}
                    hiddenElement={getDefaultSize()[0] === 100 ? 'right' : ''}
                    collapsed={dragExpand ? undefined : 1}
                    gutterSize={8}
                    gutterStyle={() => ({
                        height: '8px',
                        background: '#FFF',
                        width: '100%',
                        visibility:
                            getDefaultSize()[0] === 100 ? 'hidden' : 'visible',
                        pointerEvents: fullScreen ? 'none' : 'all',
                        zIndex: '999',
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
                            <Empty iconSrc={graphEmpty} desc={__('暂无数据')} />
                        </div>
                    </div>
                    <div
                        style={{
                            height: '100%',
                            width: '100%',
                            position: 'relative',
                            zIndex: 999,
                        }}
                    >
                        <div
                            className={styles.bottom}
                            hidden={getOptionType() !== FormulaType.NONE}
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
                                                getRunNode()?.data?.name ||
                                                __('未命名')
                                            }
                                        >
                                            {getRunNode()?.data?.name ||
                                                __('未命名')}
                                        </span>
                                        ）{__('仅展示50条样例数据')}
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
                                                setEditNode(undefined)
                                            }}
                                        >
                                            <CloseOutlined />
                                        </div>
                                    </Tooltip>
                                </div>
                            </div>
                            {renderExcute}
                        </div>
                        <AllFormula
                            ref={formulaRef}
                            editNode={getEditNode()}
                            selectedFormula={getSelectedFormula()}
                            fieldsData={fieldsData}
                            viewSize={getDefaultSize()[1]}
                            dragExpand={dragExpand}
                            handleChangeExpand={handleChangeExpand}
                            handleOptionClose={handleOptionClose}
                            graph={graphCase.current}
                            fullScreen={fullScreen}
                            handleFullScreen={handleFullScreen}
                        />
                    </div>
                </DragVeticalBox>
                <EditNodeName
                    visible={!!getEditNameNode()}
                    graph={graphCase.current}
                    node={getEditNameNode()}
                    onClose={() => setEditNameNode(undefined)}
                />
                <Confirm
                    open={!!deleteNode}
                    title={__('确认要删除该节点吗？')}
                    content={__(
                        '节点及其配置信息被删除后无法找回，请谨慎操作！',
                    )}
                    okText={__('确定')}
                    cancelText={__('取消')}
                    onOk={() => handleDeleteNodeOk()}
                    onCancel={() => setDeleteNode(undefined)}
                />
                <FormulaSaveModal
                    open={saveFormulaModal}
                    formulaItem={selectedFormula}
                    onCancel={() => {
                        setSaveFormulaModal(false)
                        if (getContinueFn?.()) {
                            const { fn, params } = getContinueFn()
                            fn(params)
                            setContinueFn?.(undefined)
                        }
                    }}
                    onContinue={() => {
                        setSaveFormulaModal(false)
                        setContinueFn?.(undefined)
                    }}
                    onSave={() => {
                        setSaveFormulaModal(false)
                        formulaRef?.current?.onSave()
                    }}
                />
            </div>
        </CustomViewReduxWrapper>
    )
})

export default GraphContent
