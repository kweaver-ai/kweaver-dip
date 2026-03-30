import { CloseOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import { Graph, Node, Platform, StringExt } from '@antv/x6'
import { Spin, Table, Tooltip, message } from 'antd'
import React, { forwardRef, useEffect, useMemo, useRef, useState } from 'react'

import { Dnd } from '@antv/x6-plugin-dnd'
import { Keyboard } from '@antv/x6-plugin-keyboard'
import { Selection } from '@antv/x6-plugin-selection'
import { useGetState } from 'ahooks'
import { isNull } from 'lodash'
import { useNavigate } from 'react-router-dom'
import dataEmpty from '@/assets/dataEmpty.svg'
import graphEmpty from '@/assets/graphEmpty2.svg'
import Icons from '@/components/BussinessConfigure/Icons'
import {
    IFormula,
    formatError,
    getErrorMessage,
    querySceneAnalysisDetail,
    runSceneView,
} from '@/core'
import {
    createAtomicIndicator,
    createDerivedIndicator,
    editAtomicIndicator,
    editDerivedIndicator,
    getIndicatorDetail,
    saveCanvas,
} from '@/core/apis/indicatorManagement'
import {
    instancingGraph,
    sceneConnector,
    sceneEdgeConfig,
} from '@/core/graph/graph-config'
import { X6PortalProvider } from '@/core/graph/helper'
import { Plugins, loadPlugins } from '@/core/graph/plugin'
import Empty from '@/ui/Empty'
import { OperateType, getSource, useQuery } from '@/utils'
import Confirm from '../Confirm'
import DragVeticalBox from '../DragVeticalBox'
import {
    FormulaType,
    IndicatorType,
    ModeType,
    ModuleType,
    NodeDataType,
} from './const'
import EditNodeName from './EditNodeName'
import { FieldsData } from './FieldsData'
import GraphHeader from './GraphHeader'
import {
    checkUpdatedSycn,
    createNodesInGraphByType,
    getOutputFields,
    getPortsByType,
    getPreorderNode,
    loopCalculationNodeData,
    resetNodeFormula,
    sceneAlsDataType,
    sceneAnalFormatError,
    storeExampleData,
    trackingCalculationAll,
} from './helper'
import { useIndicatorContext } from './IndicatorProvider'
import __ from './locale'
import SceneNode from './SceneNode'
import { SqlExplainProvider } from './SqlExplainProvider'
import styles from './styles.module.less'
import AtomFormula from './UnitForm/AtomFormula'
import CalculateFormula from './UnitForm/CalculateFormula'
import CiteViewFormula from './UnitForm/CiteViewFormula'
import DeAtomFormula from './UnitForm/DeAtomFormula'
import DerivedFormula from './UnitForm/DerivedFormula'
import DeWhereFormula from './UnitForm/DeWhereFormula'
import WhereFormula from './UnitForm/WhereFormula'
import './x6Style.less'

let waitForUnmount: Promise<any> = Promise.resolve()

/**
 * @interface GraphType
 * @param {any[]} moreData 更多属性中编辑的信息（分类分级、标准、码表）
 */
interface GraphType {
    ref?: any
    moreData?: any[]
    onValidateMore?: () => void
    mode?: ModeType
    setMode?: (mode: ModeType) => void
}
const SceneGraph: React.FC<GraphType> = forwardRef((props: any, ref) => {
    const { mode, setMode, moreData, onValidateMore } = props
    const { getDataById } = useIndicatorContext()
    const navigator = useNavigate()
    const query = useQuery()
    const operate = query.get('operate') || ''
    const indicatorType = (query.get('type') ||
        IndicatorType.ATOM) as IndicatorType
    const indicatorId = query.get('indicatorId') || ''
    const module: ModuleType =
        (query.get('module') as ModuleType) || ModuleType.SceneAnalysis
    const taskId = query.get('taskId') || ''
    // 场景Id
    const sceneId = query.get('sceneId') || ''
    // 库表Id
    const viewId = query.get('viewId') || ''
    const graphCase = useRef<Graph>()
    const dndCase = useRef<Dnd>()
    const graphBody = useRef<HTMLDivElement>(null)
    const container = useRef<HTMLDivElement>(null)
    const content = useRef<HTMLDivElement>(null)
    const dndContainer = useRef<HTMLDivElement>(null)
    const [loading, setLoading] = useState(true)
    const [saveLoading, setSaveLoading] = useState(false)
    const [moreFlag, setMoreFlag] = useState(false)

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
    const [runNode, setRunNode] = useState<Node>()
    // 执行分页
    const [runOffset, setRunOffset] = useState<number>(1)
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
        operate === OperateType.EDIT,
    )
    // 能否切换
    const [canChange, setCanChange] = useState<boolean>(
        operate === OperateType.EDIT,
    )

    // 字段数据
    const fieldsData = useMemo(() => {
        return new FieldsData()
    }, [])

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
    ])

    useEffect(() => {
        getEnumConfig()
        setDragExpand(false)
        const graph = instancingGraph(container.current, {
            background: {
                color: '#F6F9FB',
            },
            embedding: false,
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
                            graph.zoomTo(0.2)
                            setGraphSize(20)
                            return false
                        }
                        if (showSize >= 400 && wheelEvent.wheelDelta > 0) {
                            graph.zoomTo(4)
                            setGraphSize(400)
                            return false
                        }
                        setGraphSize(showSize - (showSize % 5))
                        return true
                    }
                    return false
                },
            },
            interacting: () => {
                return { nodeMovable: false }
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

            // // 边鼠标移入
            // graph.on('edge:mouseover', ({ edge }) => {
            //     edge.attr('line/stroke', 'rgba(18,110,227,0.65)')
            // })

            // // 边鼠标移出
            // graph.on('edge:mouseleave', ({ edge }) => {
            //     const cells = graph.getSelectedCells()
            //     if (cells.length > 0 && cells[0].id === edge.id) {
            //         return
            //     }
            //     edge.attr('line/stroke', '#BFBFBF')
            // })

            // // 边选中
            // graph.on('edge:selected', ({ edge }) => {
            //     edge.attr('line/stroke', 'rgba(18,110,227,0.65)')
            // })

            // // 边取消选中
            // graph.on('edge:unselected', ({ edge }) => {
            //     edge.removeTools()
            //     edge.attr('line/stroke', '#BFBFBF')
            // })

            // 节点添加
            graph.on('node:added', ({ node }) => {
                if (!getPageStatus()) {
                    setPageStatus(true)
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
                        // 去掉右边连接点
                        const rightport = ports.find((port) => {
                            return port?.group === 'out'
                        })
                        if (rightport && rightport.id) {
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
        }

        getContent()
    }, [])

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
            graphCase.current?.removeNode(tempDel)
        }
        setDeleteNode(undefined)
    }

    // 获取枚举值
    const getEnumConfig = () => {
        fieldsData.dataType = sceneAlsDataType
    }

    const getSceneInfo = async (id: string) => {
        if (!id) return false
        try {
            const res = await querySceneAnalysisDetail(id)
            return res
        } catch (error) {
            sceneAnalFormatError(navigator, error)
            return false
        }
    }

    // 获取详情
    const getContent = async () => {
        if (!graphCase?.current) {
            return
        }
        let hasSceneData: boolean = false
        try {
            if (operate === OperateType.EDIT) {
                setLoading(true)
                let res: any = {}

                const [{ value: sceneRes }, { value: indicatorRes }]: any =
                    await Promise.allSettled([
                        getSceneInfo(sceneId),
                        indicatorId
                            ? getIndicatorDetail(indicatorId)
                            : Promise.resolve(),
                    ])

                res = {
                    ...(sceneRes || {}),
                    name: indicatorRes?.name,
                }
                setSceneData(res)
                hasSceneData = !!res
                if (!sceneId) {
                    setPageStatus(true)
                    setCanChange(false)
                    setCanSave(false)
                    createNodesInGraphByType(graphCase.current, indicatorType)
                    return
                }
                if (sceneRes) {
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
                        let nodes = tempNodes.map((a) => {
                            const findItem = tempCanvas.find(
                                (b) => b.id === a.id,
                            )
                            return {
                                ...findItem,
                                data: {
                                    name: a.name,
                                    src: a.src,
                                    formula: a.formula,
                                    expand: findItem.data?.expand,
                                },
                            }
                        })
                        // 编辑场景 加载校验
                        nodes = await checkUpdatedSycn(
                            nodes,
                            indicatorType,
                            getDataById,
                        )

                        await graphCase.current.addNodes(nodes)

                        nodes.forEach((n) => {
                            const { src } = n.data
                            if (src.length > 0) {
                                src.forEach((info) => createEdge(info, n.id))
                            }
                        })
                        if (nodes?.length) {
                            // 加载样例数据
                            const nodeItem = nodes[0]?.data?.formula.find((o) =>
                                [FormulaType.FORM, FormulaType.ATOM].includes(
                                    o.type,
                                ),
                            )
                            const tableId = nodeItem?.config?.form_id
                            if (tableId) {
                                fieldsData.formId = tableId

                                const data_view = await getDataById(tableId)
                                storeExampleData(fieldsData, undefined, {
                                    ...data_view,
                                    id: tableId,
                                })
                            }
                        }
                    }
                    deleteEdgeTool()
                    await trackingCalculationAll(
                        graphCase.current,
                        fieldsData,
                        indicatorType,
                        getDataById,
                    )
                    changSaveState()
                }
            } else if (operate === OperateType.CREATE) {
                setPageStatus(true)
                createNodesInGraphByType(graphCase.current, indicatorType)
            }
        } catch (e) {
            formatError(e)
            if (!hasSceneData) {
                setPageStatus(false)
            }
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

    const handlePublish = async (scene_analysis_id: string) => {
        try {
            const params = {
                scene_analysis_id,
                ...moreData,
                owners: moreData?.owners?.map((id) => ({ owner_id: id })),
            }

            if (indicatorType === IndicatorType.ATOM) {
                if (operate === OperateType.EDIT) {
                    await editAtomicIndicator(indicatorId, params)
                    message.success(__('更新成功'))
                } else {
                    await createAtomicIndicator(params)
                    message.success(__('发布成功'))
                }
            } else if (indicatorType === IndicatorType.DERIVED) {
                if (operate === OperateType.EDIT) {
                    await editDerivedIndicator(indicatorId, params)
                    message.success(__('更新成功'))
                } else {
                    await createDerivedIndicator(params)
                    message.success(__('发布成功'))
                }
            }
            if (taskId) {
                navigator(-1)
            } else {
                navigator('/business/indicatorManage')
            }
        } catch (error) {
            formatError(error)
        } finally {
            setSaveLoading(false)
        }
    }

    // 保存画布内容
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
                                return {
                                    id: f.id,
                                    type: f.type,
                                    config: f.config,
                                    output_fields: getOutputFields(
                                        f.output_fields,
                                        fieldsData,
                                    ),
                                }
                            }),
                            output_fields: getOutputFields(
                                output_fields,
                                fieldsData,
                            ),
                        },
                    ]
                    return {
                        ...info,
                        data: {
                            expand,
                        },
                    }
                })
            const ret = await saveCanvas({
                id:
                    operate === OperateType.CREATE ||
                    (operate === OperateType.EDIT && !sceneId)
                        ? undefined
                        : sceneId,
                canvas: JSON.stringify(cellsData),
                config: JSON.stringify(configData),
                type: 'indicator',
                name: `name_${Date.now()}`,
            })
            if (ret?.id) {
                handlePublish(ret?.id)
            }
        } catch (err) {
            formatError(err)
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
    // const changeGraphSize = (multiple: number) => {
    //     setGraphSize(multiple * 100)
    //     graphCase.current?.zoomTo(multiple)
    // }

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
        cancelRunGraph()
        setEditNode(node)
        setSelectedIndex(index)
        setSelectedFormula(item)
        setOptionType(item.type as FormulaType)
        if (defaultSize[0] === 99 || defaultSize[0] === 100) {
            setDragExpand(true)
            setDefaultSize([30, 70])
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
        if (selectedFormula?.errorMsg && !bo) {
            const node = editNode!
            node.replaceData({
                ...node.data,
                // eslint-disable-next-line no-loop-func
                formula: node.data.formula.map((info: IFormula) => {
                    if (info.type === optionType) {
                        return {
                            ...info,
                            errorMsg: selectedFormula?.errorMsg,
                        }
                    }
                    return info
                }),
            })
        }

        setSelectedFormula(undefined)
        setDefaultSize([100, 0])
        setOptionType(FormulaType.NONE)
        if (bo) {
            await loopCalculationNodeData(
                graphCase.current!,
                [editNode!],
                fieldsData,
                indicatorType,
                getDataById,
            )
            changSaveState()

            const curView = editNode?.data?.formula?.find((o) =>
                [FormulaType.FORM, FormulaType.ATOM].includes(o.type),
            )

            const tableId = curView?.config?.form_id
            if (tableId) {
                fieldsData.formId = tableId
                const data_view = await getDataById(tableId)
                storeExampleData(fieldsData, undefined, {
                    ...data_view,
                    id: tableId,
                })
            }
        }

        setEditNode(undefined)
    }

    // 检查是否可以保存
    const changSaveState = () => {
        if (!graphCase.current) return
        const nodes = graphCase.current.getNodes()
        const l = nodes.length
        const bool =
            nodes[l - 1].data?.executable &&
            getOptionType() === FormulaType.NONE

        const hasError = nodes?.some((o) =>
            o.data?.formula?.some((f) => f.errorMsg),
        )

        const canOpt = bool && !hasError
        setCanChange(canOpt)
        setCanSave(canOpt)
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
            indicatorType,
            getDataById,
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
                    info.config?.url?.includes('/scene-analysis/v1/scene/exec')
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
        isFirst: boolean = true,
        close: boolean = true,
    ) => {
        if (close || optionType !== FormulaType.NONE) {
            setOptionType(FormulaType.NONE)
            handleOptionClose(false)
        }

        if (optionType !== FormulaType.NONE) {
            setTimeout(() => {
                setDragExpand(true)
                setDefaultSize([30, 70])
            }, 100)
        }

        if (!graphCase.current || !node) {
            return
        }
        setRunNode(node)
        setRunOffset(offset)
        const preNodes = getPreorderNode(graphCase.current.getNodes(), node)
        if (defaultSize[0] === 100 || defaultSize[0] === 99) {
            setDragExpand(true)
            setDefaultSize([30, 70])
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
            const params = {
                canvas: preNodes.map((info) => ({
                    id: info.id,
                    name: info.data.name,
                    formula: info.data.formula,
                    output_fields: getOutputFields(
                        info.data.output_fields,
                        fieldsData,
                    ),
                    src: info.data.src,
                })),
            }
            const res = await runSceneView(
                20,
                offset,
                params,
                isFirst,
                'indicator',
            )

            const { columns, data, err, count } = res
            if (err && err.code) {
                setErrorMsg(getErrorMessage({ error: { data: err } }))
            } else {
                setRunColumns(
                    columns?.map((item, index) => {
                        const o = fieldsData?.data?.find(
                            (k) => k.technical_name === item?.name,
                        )

                        return {
                            key: item.name,
                            dataIndex: item.name,
                            title: o ? (
                                <span className={styles.runResult}>
                                    <div className={styles.tableName}>
                                        <Icons type={o.data_type} />
                                        <span
                                            title={o.business_name}
                                            className={styles.text}
                                        >
                                            {o.business_name}
                                        </span>
                                    </div>
                                    <div className={styles.tableNameEn}>
                                        {o.technical_name}
                                    </div>
                                </span>
                            ) : (
                                item.name
                            ),
                            ellipsis: true,
                            render: (text, record) => record[item.name],
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
            // if (error?.data?.code === 'SceneAnalysis.Scene.SceneNotExist') {
            //     info({
            //         title: __('无法执行'),
            //         icon: <InfoCircleFilled />,
            //         content: __('场景分析已不存在'),
            //         okText: __('确定'),
            //         onOk() {
            //             navigator('/dataProduct/sceneAnalysis')
            //         },
            //     })
            // } else {
            setErrorMsg(getErrorMessage({ error }))
            // }
        }
    }

    /**
     * 底部栏切换展开状态
     * @closed 关闭
     */
    const handleChangeExpand = (closed: boolean = false) => {
        if (selectedFormula?.errorMsg) {
            const node = editNode!
            node.replaceData({
                ...node.data,
                // eslint-disable-next-line no-loop-func
                formula: node.data.formula.map((info: IFormula) => {
                    if (info.type === optionType) {
                        return {
                            ...info,
                            errorMsg: selectedFormula?.errorMsg,
                        }
                    }
                    return info
                }),
            })
        }

        if (closed) {
            cancelRunGraph()
            setDefaultSize([100, 0])
            handleOptionClose(false)
        } else {
            if (defaultSize[0] === 99) {
                setDefaultSize([30, 70])
            } else if (!dragExpand) {
                setDefaultSize(defaultSize.map((info) => info + 0.001))
            }
            setDragExpand(!dragExpand)
        }
    }

    useEffect(() => {
        if (moreFlag && moreData) {
            setSaveLoading(true)
            // 保存画布内容
            saveContent()
        }
    }, [moreData, moreFlag])

    // 保存指标
    const saveIndicator = async () => {
        // 校验表单是否正确
        const flag = await onValidateMore?.()

        if (!flag && mode === ModeType.Definition) {
            setMode(ModeType.More)

            return
        }
        setMoreFlag(flag)
    }

    const handleOptionChange = (type: FormulaType, isChange: boolean) => {
        // 内容有变更
        if (isChange) {
            resetNodeFormula(graphCase.current, type, indicatorType)
        }
    }

    return (
        <div className={styles.indicatorGraphWrap} ref={content}>
            <SqlExplainProvider>
                <div ref={dndContainer} className={styles.dndDrag}>
                    <GraphHeader
                        onSaveGraph={() => {
                            saveIndicator()
                        }}
                        data={sceneData}
                        canSave={canSave}
                        canChange={canChange}
                        mode={mode}
                        setMode={setMode}
                        loading={loading}
                        saveLoading={saveLoading}
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
                        minSize={defaultSize[0] === 100 ? 0 : 30}
                        onDragEnd={(rate) => {
                            const close =
                                (window.innerHeight * rate[1]) / 100 < 48
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
                            id="inGraphBody"
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
                            <div
                                className={styles.loadingGraph}
                                hidden={!loading}
                            >
                                <Spin />
                            </div>
                            <div
                                className={styles.emptyGraph}
                                hidden={getPageStatus()}
                            >
                                <Empty iconSrc={graphEmpty} />
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
                                                className={
                                                    styles.bottomDescName
                                                }
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
                                                onClick={() =>
                                                    handleChangeExpand()
                                                }
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
                                                onClick={() =>
                                                    handleChangeExpand()
                                                }
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
                                                onClick={() =>
                                                    handleChangeExpand(true)
                                                }
                                            >
                                                <CloseOutlined />
                                            </div>
                                        </Tooltip>
                                    </div>
                                </div>
                                {fetching ? (
                                    <div
                                        style={{
                                            height: '100%',
                                            display: 'flex',
                                        }}
                                    >
                                        <Spin
                                            style={{
                                                margin: 'auto',
                                            }}
                                            className={styles.ldWrap}
                                        />
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
                                                    <div hidden={!errorMsg}>
                                                        {errorMsg}
                                                    </div>
                                                </div>
                                            }
                                        />
                                    </div>
                                ) : (
                                    <Table
                                        className={styles.bottomList}
                                        columns={runColumns}
                                        dataSource={runList}
                                        scroll={{
                                            x: runColumns.length * 200,
                                            y:
                                                (window.innerHeight - 52) *
                                                    (getDefaultSize()[1] /
                                                        100) -
                                                161,
                                        }}
                                        loading={tableFetching}
                                        pagination={
                                            !runTotal || runTotal <= 20
                                                ? false
                                                : {
                                                      current: runOffset,
                                                      pageSize: 20,
                                                      total: runTotal,
                                                      showSizeChanger: false,
                                                      showTotal(total, range) {
                                                          return `${__(
                                                              '总计',
                                                          )} ${runTotal} ${__(
                                                              '条数据',
                                                          )}`
                                                      },
                                                      onChange: (page) => {
                                                          runGraph(
                                                              runNode,
                                                              page,
                                                              false,
                                                              false,
                                                          )
                                                      },
                                                  }
                                        }
                                    />
                                )}
                            </div>
                            {optionType === FormulaType.FORM && (
                                <CiteViewFormula
                                    visible={optionType === FormulaType.FORM}
                                    node={editNode}
                                    formulaData={selectedFormula}
                                    fieldsData={fieldsData}
                                    viewSize={getDefaultSize()[1]}
                                    dragExpand={dragExpand}
                                    onChangeExpand={handleChangeExpand}
                                    onClose={handleOptionClose}
                                    onOperate={handleOptionChange}
                                />
                            )}
                            {optionType === FormulaType.WHERE && (
                                <>
                                    {indicatorType === IndicatorType.ATOM && (
                                        <WhereFormula
                                            visible={
                                                optionType === FormulaType.WHERE
                                            }
                                            graph={graphCase.current}
                                            node={editNode}
                                            formulaData={selectedFormula}
                                            fieldsData={fieldsData}
                                            viewSize={getDefaultSize()[1]}
                                            dragExpand={dragExpand}
                                            onChangeExpand={handleChangeExpand}
                                            onClose={handleOptionClose}
                                            onOperate={handleOptionChange}
                                        />
                                    )}
                                    {indicatorType ===
                                        IndicatorType.DERIVED && (
                                        <DeWhereFormula
                                            visible={
                                                optionType === FormulaType.WHERE
                                            }
                                            graph={graphCase.current}
                                            node={editNode}
                                            formulaData={selectedFormula}
                                            fieldsData={fieldsData}
                                            viewSize={getDefaultSize()[1]}
                                            dragExpand={dragExpand}
                                            onChangeExpand={handleChangeExpand}
                                            onClose={handleOptionClose}
                                            onOperate={handleOptionChange}
                                        />
                                    )}
                                </>
                            )}
                            {optionType === FormulaType.INDICATOR_MEASURE && (
                                <CalculateFormula
                                    visible={
                                        optionType ===
                                        FormulaType.INDICATOR_MEASURE
                                    }
                                    graph={graphCase.current}
                                    node={editNode}
                                    formulaData={selectedFormula}
                                    fieldsData={fieldsData}
                                    viewSize={getDefaultSize()[1]}
                                    dragExpand={dragExpand}
                                    onChangeExpand={handleChangeExpand}
                                    onClose={handleOptionClose}
                                    onOperate={handleOptionChange}
                                />
                            )}
                            {optionType === FormulaType.ATOM && (
                                <>
                                    {indicatorType === IndicatorType.ATOM && (
                                        <AtomFormula
                                            visible={
                                                optionType === FormulaType.ATOM
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
                                    )}
                                    {indicatorType ===
                                        IndicatorType.DERIVED && (
                                        <DeAtomFormula
                                            visible={
                                                optionType === FormulaType.ATOM
                                            }
                                            node={editNode}
                                            formulaData={selectedFormula}
                                            fieldsData={fieldsData}
                                            viewSize={getDefaultSize()[1]}
                                            dragExpand={dragExpand}
                                            onChangeExpand={handleChangeExpand}
                                            onClose={handleOptionClose}
                                            onOperate={handleOptionChange}
                                        />
                                    )}
                                </>
                            )}
                            {optionType === FormulaType.DERIVED && (
                                <DerivedFormula
                                    visible={optionType === FormulaType.DERIVED}
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
                    content={__(
                        '节点及其配置信息被删除后无法找回，请谨慎操作！',
                    )}
                    okText={__('确定')}
                    cancelText={__('取消')}
                    onOk={() => handleDeleteNodeOk()}
                    onCancel={() => setDeleteNode(undefined)}
                />
            </SqlExplainProvider>
        </div>
    )
})

export default SceneGraph
