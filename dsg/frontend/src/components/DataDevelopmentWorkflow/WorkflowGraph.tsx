import React, { useRef, useEffect, useState, useMemo } from 'react'
import { Graph, Node, StringExt } from '@antv/x6'
import {
    CloseOutlined,
    DownOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    RightOutlined,
    UpOutlined,
} from '@ant-design/icons'
import { Tooltip, Tabs, List, Spin, Input } from 'antd'
import { useGetState, useDebounceFn, useSize } from 'ahooks'
import { Selection } from '@antv/x6-plugin-selection'
import { Dnd } from '@antv/x6-plugin-dnd'
import { Keyboard } from '@antv/x6-plugin-keyboard'
import classnames from 'classnames'
import { trim } from 'lodash'
import InfiniteScroll from 'react-infinite-scroll-component'
import { instancingGraph, sceneConnector } from '@/core/graph/graph-config'
import { Plugins, loadPlugins } from '@/core/graph/plugin'
import {
    createWorkFlow,
    editWorkFlowGraph,
    formatError,
    getDataBaseDetails,
    getProcessDataList,
    getProcessModelDetail,
    getSyncDataList,
    getSyncModelDetail,
    messageError,
} from '@/core'
import DragVeticalBox from '../DragVeticalBox'
import styles from './styles.module.less'
import __ from './locale'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import graphEmpty from '@/assets/graphEmpty.svg'
import WorkflowNode from './WorkflowNode'
import { OperateType, ModelType, wfNodeTemplate, modelTypeInfo } from './const'
import {
    HeaderItem,
    ListItem,
    XScroll,
    getPreorderNode,
    handleExecuteWf,
} from './helper'
import { RecycleBinOutlined } from '@/icons'
import LogsList from './LogsList'
import DraggableList from '@/ui/DraggableList'
import { X6PortalProvider } from '@/core/graph/helper'

const defaultQueryParams = {
    keyword: '',
    limit: 50,
    offset: 1,
}

let waitForUnmount: Promise<any> = Promise.resolve()

interface IWorkflowGraph {
    data: any
    operate?: OperateType
    needSave: boolean
    taskId?: string
    logsItems: any[]
    onSetGraphCase: (graphCase: Graph) => void
    onGetGraphSize: (graphSize: number) => void
    onSetLogsList: (info: any[]) => void
    onReturn: () => void
    onSave: (info?) => void
    // onExecute: () => void
}

/**
 * 工作流画布
 * @param data 工作流数据
 * @param operate 操作类型
 * @param needSave 是否保存
 * @param onSetGraphCase 画布实例
 * @param onGetGraphSize 调整画布大小
 * @param onSetLogsList 调整日志列表
 * @param onReturn 返回
 * @param onSave 保存状态变更
 * @param onExecute 执行
 */
const WorkflowGraph: React.FC<IWorkflowGraph> = ({
    data,
    operate,
    needSave,
    taskId,
    logsItems,
    onSetLogsList,
    onSetGraphCase,
    onGetGraphSize,
    onReturn,
    onSave,
    // onExecute,
}) => {
    const graphCase = useRef<Graph>()
    const dndCase = useRef<Dnd>()
    const graphBody = useRef<HTMLDivElement>(null)
    const container = useRef<HTMLDivElement>(null)
    const content = useRef<HTMLDivElement>(null)
    const dndContainer = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const listSize = useSize(listRef)

    const [loading, setLoading] = useState(true)
    const [syncFetching, setSyncFetching] = useState(false)
    const [procFetching, setProcFetching] = useState(false)
    // 左侧宽度
    const [leftSize, setLeftSize] = useState(0)
    // tab键
    const [activeKey, setActiveKey] = useState(ModelType.PROC)
    // 同步列表
    const [syncList, setSyncList] = useState<any[]>([])
    // 加工列表
    const [procList, setProcList] = useState<any[]>([])
    const [syncTotal, setSyncTotal] = useState<number>(0)
    const [procTotal, setProcTotal] = useState<number>(0)
    const [syncQueryParams, setSyncQueryParams] =
        useState<any>(defaultQueryParams)
    const [procQueryParams, setProcQueryParams] =
        useState<any>(defaultQueryParams)
    // 搜索关键字
    const [searchKey, setSearchKey] = useState('')
    // 左侧树折叠
    const [syncExpand, setSyncExpand] = useState<boolean>(true)
    const [procExpand, setProcExpand] = useState<boolean>(true)
    // 已添加的id集
    const [addedIds, setAddedIds, getAddedIds] = useGetState<string[]>([])
    // 垂直分割展开收起
    const [dragExpand, setDragExpand] = useState<boolean>(false)
    // 分割大小
    const [defaultSize, setDefaultSize, getDefaultSize] = useGetState<
        Array<number>
    >([100, 0])
    // 页面存在状态
    const [pageStatus, setPageStatus, getPageStatus] =
        useGetState<boolean>(true)

    // 左侧显示模块集
    const tabItems = [
        {
            key: ModelType.SYNC,
            label: modelTypeInfo[ModelType.SYNC].text,
        },
        {
            key: ModelType.PROC,
            label: modelTypeInfo[ModelType.PROC].text,
        },
    ]

    useMemo(() => {
        const promise = new Promise((resolve) => {
            waitForUnmount.then(() => {
                // 注册链接器
                Graph.registerConnector('curveConnector', sceneConnector, true)
                return () => {
                    unRegistryPort()
                }
            })
        })
        waitForUnmount = promise
    }, [])

    // 注销画布注册的桩
    const unRegistryPort = () => {
        Graph.unregisterConnector('curveConnector')
    }

    // 注册节点
    WorkflowNode([() => operate, () => optionNode])

    useEffect(() => {
        setLeftSize(operate === OperateType.PREVIEW ? 0 : 220)
        setDragExpand(
            operate === OperateType.PREVIEW ? logsItems.length > 0 : false,
        )
        setDefaultSize(
            operate === OperateType.PREVIEW
                ? logsItems.length > 0
                    ? [60, 40]
                    : [100, 0]
                : [100, 0],
        )
    }, [operate])

    useEffect(() => {
        if (graphCase.current) {
            graphCase.current.dispose()
        }
        const graph = instancingGraph(container.current, {
            interacting: operate !== OperateType.PREVIEW,
            background: {
                color: '#F6F9FB',
            },
            embedding: false,
            connecting: {
                allowBlank: false,
                allowLoop: false,
                allowNode: false,
                allowEdge: false,
                highlight: true,
                connectionPoint: 'anchor',
                snap: {
                    radius: 30,
                },
                createEdge: () => {
                    if (operate === OperateType.PREVIEW) {
                        return graph?.addEdge({
                            shape: 'workflow_edge_non_interaction',
                        })
                    }
                    return graph?.addEdge({ shape: 'workflow_edge' })
                },
                // 连接桩校验
                validateConnection({ sourceMagnet, targetMagnet }) {
                    // 只能从输出链接桩创建连接
                    if (
                        !sourceMagnet ||
                        sourceMagnet.getAttribute('port-group') === 'left'
                    ) {
                        return false
                    }
                    // 只能连接到输入链接桩
                    if (
                        !targetMagnet ||
                        targetMagnet.getAttribute('port-group') === 'right'
                    ) {
                        return false
                    }
                    return true
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
                            onGetGraphSize(20)
                            return false
                        }
                        if (showSize >= 400 && wheelEvent.wheelDelta > 0) {
                            graph.zoomTo(4)
                            onGetGraphSize(400)
                            return false
                        }
                        onGetGraphSize(showSize - (showSize % 5))
                        return true
                    }
                    return false
                },
            },
        })
        if (graph) {
            graphCase.current = graph
            onSetGraphCase(graph)
            loadPlugins(graph, [Plugins.Scroller])
            graph.use(
                new Selection({
                    enabled: true,
                    multiple: false,
                }),
            )
            if (operate !== OperateType.PREVIEW) {
                graph.use(
                    new Keyboard({
                        enabled: true,
                        global: true,
                    }),
                )
            }
            dndCase.current = new Dnd({
                target: graph,
                scaled: false,
                dndContainer: dndContainer.current || undefined,
                getDragNode: (node) => node.clone({ keepId: true }),
                getDropNode: (node) => node.clone({ keepId: true }),
            })

            graph.on('edge:mouseover', ({ edge }) => {
                if (operate === OperateType.PREVIEW) {
                    const markup = (edge.markup as any[]).find(
                        (info) => info.selector === 'wrap',
                    )
                    // edge.getMarkup()
                    return
                }
                if (!edge.hasTool('edge_delete_btn')) {
                    edge.addTools(['edge_delete_btn'])
                }
                edge.attr('line/stroke', 'rgba(18,110,227,0.65)')
            })
            graph.on('edge:mouseleave', ({ edge }) => {
                const cells = graph.getSelectedCells()
                if (cells.length > 0 && cells[0].id === edge.id) {
                    return
                }
                edge.removeTools()
                edge.attr('line/stroke', '#BFBFBF')
            })

            graph.on('edge:selected', ({ edge }) => {
                if (operate === OperateType.PREVIEW) {
                    return
                }
                if (!edge.hasTool('edge_delete_btn')) {
                    edge.addTools(['edge_delete_btn'])
                }
                edge.attr('line/stroke', 'rgba(18,110,227,0.65)')
            })
            graph.on('edge:unselected', ({ edge }) => {
                edge.removeTools()
                edge.attr('line/stroke', '#BFBFBF')
            })

            graph.on('edge:connected', async ({ edge }) => {
                const sourceNode = edge.getSourceNode()
                const targetNode = edge.getTargetNode()
                if (sourceNode && targetNode) {
                    const preNodes: Node[] = getPreorderNode(
                        graph.getNodes(),
                        sourceNode,
                    )
                    if (!preNodes.every((info) => info.id !== targetNode.id)) {
                        messageError(
                            __('不支持通过多条路径后再次连接回起始节点'),
                        )
                        graph.removeCell(edge.id)
                        return
                    }
                    const { id } = sourceNode
                    targetNode.replaceData({
                        ...targetNode.data,
                        pre_node_id: [...targetNode.data.pre_node_id, id],
                    })
                }
            })

            graph.on('edge:removed', async ({ edge }) => {
                const sourceNodeId: any = (edge.getSource() as any).cell
                const targetNode: any = graph.getCellById(
                    (edge.getTarget() as any).cell,
                )
                if (targetNode) {
                    // 去掉存储的源节点
                    targetNode.replaceData({
                        ...targetNode.data,
                        pre_node_id: targetNode.data.pre_node_id.filter(
                            (item) => item !== sourceNodeId,
                        ),
                    })
                }
            })

            graph.on('node:selected', ({ node }) => {
                graph.getNodes().forEach((n) => {
                    if (node.id !== n.id) {
                        n.replaceData({ ...n.data, selected: false })
                    } else {
                        n.replaceData({ ...n.data, selected: true })
                    }
                })
            })
            graph.on('node:unselected', ({ node }) => {
                node.replaceData({ ...node.data, selected: false })
            })

            graph.on('node:mouseenter', ({ node }) => {
                showPorts(true)
            })
            graph.on('node:mouseleave', ({ node }) => {
                showPorts(false)
            })

            graph.on('node:added', ({ node }) => {
                if (!getPageStatus()) {
                    setPageStatus(true)
                }
                setAddedIds([...getAddedIds(), node.data.model_id])
                container.current?.focus()
                graph.select(node)
            })

            graph.bindKey('backspace', () => {
                handleDeleteCells()
            })
            graph.bindKey('delete', () => {
                handleDeleteCells()
            })
        }
        getContent()
    }, [operate])

    const getSyncModelDetails = async (id) => {
        try {
            const res = await getSyncModelDetail(id)
            if (res) {
                let sourceInfo
                let targetInfo
                if (res.source?.datasource_id) {
                    sourceInfo = await getDataBaseDetails(
                        res.source.datasource_id,
                    )
                }
                if (res.target?.datasource_id) {
                    targetInfo = await getDataBaseDetails(
                        res.target.datasource_id,
                    )
                }
                return Promise.resolve({
                    id,
                    name: res.name,
                    description: res.description,
                    source: {
                        table_id: res.source?.id,
                        table_name: res.source?.name,
                        info_system: sourceInfo?.info_system_name,
                        info_system_id: sourceInfo?.info_system_id,
                        datasource_name: sourceInfo?.name,
                        datasource_type: res.source?.datasource_type,
                        source_type: sourceInfo?.source_type,
                    },
                    target: {
                        table_id: res.target?.id,
                        table_name: res.target?.name,
                        info_system: targetInfo?.info_system_name,
                        info_system_id: targetInfo?.info_system_id,
                        datasource_name: targetInfo?.name,
                        datasource_type: res.target?.datasource_type,
                        source_type: targetInfo?.source_type,
                    },
                })
            }
            return Promise.resolve({ id })
        } catch (err) {
            return Promise.resolve({ id })
        }
    }

    const getProcModelDetails = async (id) => {
        try {
            const res = await getProcessModelDetail(id)
            if (res) {
                let targetInfo
                if (res.target?.datasource_id) {
                    targetInfo = await getDataBaseDetails(
                        res.target.datasource_id,
                    )
                }
                return Promise.resolve({
                    id,
                    name: res.name,
                    description: res.description,
                    target: {
                        table_id: res.target?.id,
                        table_name: res.target?.name,
                        info_system: targetInfo?.info_system_name,
                        info_system_id: targetInfo?.info_system_id,
                        datasource_name: targetInfo?.name,
                        datasource_type: res.target?.datasource_type,
                        source_type: targetInfo?.source_type,
                    },
                })
            }
            return Promise.resolve({ id })
        } catch (err) {
            return Promise.resolve({ id })
        }
    }

    // 获取内容
    const getContent = async () => {
        setLoading(true)
        if (!graphCase || !graphCase.current) {
            setLoading(false)
            return
        }
        try {
            if (data?.nodes?.length > 0) {
                setAddedIds(data?.nodes.map((info) => info.model_id))
                const { canvas } = data
                const otherInfo = JSON.parse(canvas).filter((a) =>
                    data.nodes.find((b) => b.node_id === a.id),
                )
                const details: any[] = await Promise.all(
                    data.nodes.map((n) => {
                        if (n.model_type === ModelType.SYNC) {
                            return getSyncModelDetails(n.model_id)
                        }
                        return getProcModelDetails(n.model_id)
                    }),
                )
                const nodes = data.nodes.map((a) => {
                    const modelData = details.find((b) => b.id === a.model_id)
                    return {
                        ...wfNodeTemplate,
                        id: a.node_id,
                        data: {
                            name: otherInfo.find((b) => b.id === a.node_id)
                                .name,
                            ...modelData,
                            model_id: a.model_id,
                            model_type: a.model_type,
                            pre_node_id: a.pre_node_id.filter((b) =>
                                data.nodes.find((c) => c.node_id === b),
                            ),
                        },
                        position: otherInfo.find((b) => b.id === a.node_id)
                            .position,
                        ports: [
                            {
                                id: `${a.node_id}-left`,
                                group: 'left',
                            },
                            {
                                id: `${a.node_id}-right`,
                                group: 'right',
                            },
                        ],
                    }
                })
                await graphCase.current.addNodes(nodes)
                nodes.forEach((n) => {
                    const { pre_node_id } = n.data
                    if (pre_node_id.length > 0) {
                        pre_node_id.forEach((info) => createEdge(info, n.id))
                    }
                })
                graphCase.current.resetSelection()
            } else {
                setPageStatus(false)
            }
        } catch (e) {
            formatError(e)
            setPageStatus(false)
        } finally {
            setLoading(false)
            movedToCenter()
        }
    }

    /**
     * 创建边
     * @param sourceId 源节点id
     * @param targetId 目标节点id
     */
    const createEdge = (sourceId: string, targetId: string) => {
        graphCase.current?.addEdge({
            id: StringExt.uuid(),
            shape:
                operate === OperateType.PREVIEW
                    ? 'workflow_edge_non_interaction'
                    : 'workflow_edge',
            source: {
                cell: sourceId,
                port: `${sourceId}-right`,
            },
            target: {
                cell: targetId,
                port: `${targetId}-left`,
            },
            zIndex: -1,
        })
    }

    useEffect(() => {
        if (needSave) {
            saveContent()
        }
    }, [needSave])

    // 保存画布内容
    const saveContent = async () => {
        if (!graphCase.current) {
            onSave()
            return
        }
        const cellsJson = graphCase.current!.toJSON().cells
        if (cellsJson.length === 0) {
            messageError(__('请至少拖拽一个节点'))
            onSave()
            return
        }
        deleteEdgeTool()
        try {
            const otherInfo: any[] = []
            const nodesData = cellsJson
                .filter((info) => info.shape === 'workflow_node')
                .map((info) => {
                    otherInfo.push({
                        id: info.id,
                        position: info.position,
                        name: info.data.name,
                    })
                    return {
                        node_id: info.id,
                        model_id: info.data.model_id,
                        model_type: info.data.model_type,
                        pre_node_id: info.data.pre_node_id,
                    }
                })
            let res
            if (operate === OperateType.CREATE) {
                res = await createWorkFlow({
                    name: data.name,
                    description: data.description,
                    nodes: nodesData,
                    canvas: JSON.stringify(otherInfo),
                    task_id: taskId,
                })
            } else if (operate !== OperateType.PREVIEW) {
                res = await editWorkFlowGraph(data?.id, {
                    nodes: nodesData,
                    canvas: JSON.stringify(otherInfo),
                    task_id: taskId,
                })
            }
            // setSaveSuccess(true)
            onSave(res)
        } catch (err) {
            formatError(err)
            onSave()
        }
    }

    // 批量去掉边工具
    const deleteEdgeTool = () => {
        const edges = graphCase.current?.getEdges()
        edges?.forEach((edge) => {
            edge.removeTools()
        })
    }

    // 画布定位到中心
    const movedToCenter = () => {
        graphCase.current?.centerContent()
    }

    // 桩的显示状态
    const showPorts = (show: boolean) => {
        if (!container.current || operate === OperateType.PREVIEW) {
            return
        }
        const ports = container.current.querySelectorAll('.x6-port-body')

        for (let i = 0, len = ports.length; i < len; i += 1) {
            ports[i].setAttribute(
                'style',
                show ? `visibility:visible` : `visibility:hidden`,
            )
        }
    }

    // 删除节点、连线
    const handleDeleteCells = () => {
        if (!graphCase.current) return
        const cells = graphCase.current.getSelectedCells()
        if (cells?.[0]?.isNode()) {
            setAddedIds([
                ...getAddedIds().filter(
                    (info) => info !== cells[0].data.model_id,
                ),
            ])
        }
        graphCase.current.removeCells(cells)
    }

    // 拖拽添加节点
    const startDrag = async (
        e: React.MouseEvent<HTMLDivElement, MouseEvent>,
        item: any,
    ) => {
        if (!graphCase.current) return
        const newId = StringExt.uuid()
        const node = graphCase.current.createNode({
            ...wfNodeTemplate,
            id: newId,
            position: { x: 100, y: 100 },
            data: {
                ...wfNodeTemplate.data,
                ...item,
                model_id: item?.id,
            },
            ports: [
                {
                    id: `${newId}-left`,
                    group: 'left',
                },
                {
                    id: `${newId}-right`,
                    group: 'right',
                },
            ],
        })
        if (node) {
            dndCase?.current?.start(node, e.nativeEvent as any)
        }
    }

    /**
     * 节点相关操作
     * @param node 节点
     * @param option 操作
     * @returns
     */
    const optionNode = (node: Node, option: OperateType) => {
        if (defaultSize[0] === 99 || defaultSize[0] === 100) {
            setDragExpand(true)
            setDefaultSize([60, 40])
        } else if (!dragExpand) {
            setDragExpand(true)
            setDefaultSize(defaultSize.map((info) => info + 0.001))
        }
        const { model_id, model_type } = node.data
        let tempList = logsItems.slice()
        if (!logsItems.find((info) => info.model_id === model_id)) {
            tempList = [...logsItems, { ...node.data, choose: true }]
        }
        onSetLogsList(
            tempList.map((info) => {
                if (info.model_id === model_id) {
                    return {
                        ...info,
                        choose: true,
                    }
                }
                return {
                    ...info,
                    choose: false,
                }
            }),
        )
        switch (option) {
            case OperateType.EXECUTE:
                handleExecuteWf(
                    model_id,
                    model_type === ModelType.PROC ? 'proc' : 'sync',
                )
                break
            case OperateType.LOGS:
                break
            default:
                break
        }
    }

    // 更新节点数据
    const updateNodeData = (list) => {
        const nodes = graphCase.current?.getNodes()
        if (nodes && nodes.length > 0 && list?.entries?.length > 0) {
            nodes.forEach((info) => {
                const findItem = list.entries.find(
                    (a) => a.id === info.data.model_id,
                )
                if (findItem) {
                    info.replaceData({
                        ...info.data,
                        ...findItem,
                    })
                    setAddedIds([
                        ...getAddedIds().filter((a) => a !== findItem.id),
                        findItem.id,
                    ])
                }
            })
        }
    }

    useEffect(() => {
        if (syncQueryParams.offset === 1) {
            getListForSync([])
        } else {
            getListForSync(syncList)
        }
    }, [syncQueryParams])

    // 获取同步列表
    const getListForSync = async (value: any[]) => {
        try {
            setSyncFetching(true)
            const res = await getSyncDataList({
                ...syncQueryParams,
                with_path: true,
            })
            setSyncList([
                ...value,
                ...(res?.entries?.map((info) => ({
                    ...info,
                    model_type: ModelType.SYNC,
                })) || []),
            ])
            setSyncTotal(res.total_count)
            updateNodeData(res)
            if (syncQueryParams?.keyword) {
                setSyncExpand(res?.entries?.length > 0)
            }
        } catch (e) {
            formatError(e)
        } finally {
            setSyncFetching(false)
        }
    }

    useEffect(() => {
        if (procQueryParams.offset === 1) {
            getListForProc([])
        } else {
            getListForProc(procList)
        }
    }, [procQueryParams])

    // 获取加工列表
    const getListForProc = async (value: any[]) => {
        try {
            setProcFetching(true)
            const res = await getProcessDataList({
                ...procQueryParams,
                with_path: true,
            })
            setProcList([
                ...value,
                ...(res?.entries?.map((info) => ({
                    ...info,
                    model_type: ModelType.PROC,
                })) || []),
            ])
            setProcTotal(res.total_count)
            updateNodeData(res)
            if (procQueryParams?.keyword) {
                setProcExpand(res?.entries?.length > 0)
            }
        } catch (e) {
            formatError(e)
        } finally {
            setProcFetching(false)
        }
    }

    // 搜索框搜索
    const handleSearchPressEnter = async (e: any) => {
        const keyword = typeof e === 'string' ? e : trim(e.target.value)
        setSearchKey(keyword)
        setSyncQueryParams({ ...syncQueryParams, offset: 1, keyword })
        setProcQueryParams({ ...syncQueryParams, offset: 1, keyword })
    }
    const { run: debounceSearch } = useDebounceFn(handleSearchPressEnter, {
        wait: 400,
    })

    useEffect(() => {
        if (activeKey === ModelType.SYNC) {
            const el = document.getElementById('scrollableDivSync')
            if (el) {
                el.scrollTop = 0
            }
            setSyncQueryParams({ ...syncQueryParams, offset: 1 })
        }
        if (activeKey === ModelType.PROC) {
            const el = document.getElementById('scrollableDivProc')
            if (el) {
                el.scrollTop = 0
            }
            setProcQueryParams({ ...procQueryParams, offset: 1 })
        }
    }, [activeKey])

    // tab切换
    const handleTabChange = (key: string) => {
        setActiveKey(key as ModelType)
    }

    const searchSyncListView = () => (
        <div
            style={{
                maxHeight: 'calc(50% - 32px)',
            }}
        >
            <div
                className={styles.searchTitleWrap}
                onClick={() => {
                    setSyncExpand(!syncExpand)
                }}
            >
                <RightOutlined
                    className={classnames(
                        styles.arrow,
                        syncExpand && styles.expandArrow,
                    )}
                />
                {modelTypeInfo[ModelType.SYNC].text}
                {`（${syncTotal}）`}
            </div>
            <div
                hidden={!syncExpand}
                className={styles.wfg_listWrap}
                style={{
                    overflow: 'auto',
                    height: 'calc(100% - 32px)',
                }}
                id="scrollableDivSearchSync"
            >
                <InfiniteScroll
                    hasMore={syncList.length < syncTotal}
                    endMessage={
                        syncList.length === 0 ? (
                            <div className={styles.listEmpty}>
                                {__('暂无数据')}
                            </div>
                        ) : (
                            ''
                        )
                    }
                    loader={
                        <div className={styles.ldWrap}>
                            <Spin />
                        </div>
                    }
                    next={() => {
                        setSyncQueryParams({
                            ...syncQueryParams,
                            offset: syncQueryParams.offset + 1,
                        })
                    }}
                    dataLength={syncList.length}
                    scrollableTarget="scrollableDivSearchSync"
                >
                    <List
                        split={false}
                        dataSource={syncList}
                        renderItem={(item) => (
                            <List.Item key={item?.id}>
                                <ListItem
                                    data={item}
                                    type={ModelType.SYNC}
                                    selected={getAddedIds().includes(item?.id)}
                                    onStartDrag={startDrag}
                                />
                            </List.Item>
                        )}
                        locale={{
                            emptyText: <div />,
                        }}
                    />
                </InfiniteScroll>
            </div>
        </div>
    )

    const searchProcListView = () => (
        <div
            style={{
                maxHeight: 'calc(50% - 32px)',
            }}
        >
            <div
                className={styles.searchTitleWrap}
                onClick={() => {
                    setProcExpand(!procExpand)
                }}
            >
                <RightOutlined
                    className={classnames(
                        styles.arrow,
                        procExpand && styles.expandArrow,
                    )}
                />
                {modelTypeInfo[ModelType.PROC].text}
                {`（${procTotal}）`}
            </div>
            <div
                hidden={!procExpand}
                className={styles.wfg_listWrap}
                style={{
                    overflow: 'auto',
                    height: 'calc(100% - 32px)',
                }}
                id="scrollableDivSearchProc"
            >
                <InfiniteScroll
                    hasMore={procList.length < procTotal}
                    endMessage={
                        procList.length === 0 ? (
                            <div className={styles.listEmpty}>
                                {__('暂无数据')}
                            </div>
                        ) : (
                            ''
                        )
                    }
                    loader={
                        <div className={styles.ldWrap}>
                            <Spin />
                        </div>
                    }
                    next={() => {
                        setProcQueryParams({
                            ...procQueryParams,
                            offset: procQueryParams.offset + 1,
                        })
                    }}
                    dataLength={procList.length}
                    scrollableTarget="scrollableDivSearchProc"
                >
                    <List
                        split={false}
                        dataSource={procList}
                        renderItem={(item) => (
                            <List.Item key={item?.id}>
                                <ListItem
                                    data={item}
                                    type={ModelType.PROC}
                                    selected={getAddedIds().includes(item?.id)}
                                    onStartDrag={startDrag}
                                />
                            </List.Item>
                        )}
                        locale={{
                            emptyText: <div />,
                        }}
                    />
                </InfiniteScroll>
            </div>
        </div>
    )

    return (
        <div className={styles.wfGraphWrap} ref={content}>
            <div
                ref={dndContainer}
                className={styles.wfg_leftWrap}
                style={{ width: leftSize }}
                hidden={leftSize === 0}
            >
                {leftSize === 220 ? (
                    <>
                        <div
                            className={styles.lw_topWrap}
                            style={{ marginBottom: searchKey ? 16 : 4 }}
                        >
                            <Input
                                placeholder={__('搜索名称')}
                                allowClear
                                onChange={(ev) => {
                                    if (!trim(ev.target.value)) {
                                        handleSearchPressEnter(ev.target.value)
                                    } else {
                                        debounceSearch(ev.target.value)
                                    }
                                }}
                                onPressEnter={debounceSearch}
                                style={{ width: 156 }}
                            />
                            <Tooltip title={__('收起')} placement="right">
                                <MenuFoldOutlined
                                    className={styles.leftExpandIcon}
                                    onClick={() => setLeftSize(40)}
                                />
                            </Tooltip>
                        </div>
                        {searchKey ? (
                            (syncFetching && syncQueryParams.offset === 1) ||
                            (procFetching && procQueryParams.offset === 1) ? (
                                <div className={styles.ldWrap}>
                                    <Spin />
                                </div>
                            ) : (
                                <>
                                    {searchSyncListView()}
                                    {searchProcListView()}
                                </>
                            )
                        ) : (
                            <>
                                <Tabs
                                    activeKey={activeKey}
                                    onChange={handleTabChange}
                                    items={tabItems}
                                    tabBarStyle={{
                                        width: '100%',
                                        paddingLeft: 38,
                                        margin: '0 0 12px 0',
                                    }}
                                />
                                {activeKey === ModelType.SYNC ? (
                                    <div
                                        id="scrollableDivSync"
                                        className={styles.wfg_listWrap}
                                    >
                                        {syncFetching &&
                                        syncQueryParams.offset === 1 ? (
                                            <div className={styles.ldWrap}>
                                                <Spin />
                                            </div>
                                        ) : (
                                            <InfiniteScroll
                                                hasMore={
                                                    syncList.length < syncTotal
                                                }
                                                endMessage={
                                                    syncList.length === 0 ? (
                                                        <Empty
                                                            iconSrc={dataEmpty}
                                                            desc={__(
                                                                '暂无数据',
                                                            )}
                                                        />
                                                    ) : (
                                                        ''
                                                    )
                                                }
                                                loader={
                                                    <div
                                                        className={
                                                            styles.ldWrap
                                                        }
                                                    >
                                                        <Spin />
                                                    </div>
                                                }
                                                next={() => {
                                                    setSyncQueryParams({
                                                        ...syncQueryParams,
                                                        offset:
                                                            syncQueryParams.offset +
                                                            1,
                                                    })
                                                }}
                                                dataLength={syncList.length}
                                                scrollableTarget="scrollableDivSync"
                                            >
                                                <List
                                                    split={false}
                                                    dataSource={syncList}
                                                    renderItem={(item) => (
                                                        <List.Item
                                                            key={item?.id}
                                                        >
                                                            <ListItem
                                                                data={item}
                                                                type={activeKey}
                                                                selected={getAddedIds().includes(
                                                                    item?.id,
                                                                )}
                                                                onStartDrag={
                                                                    startDrag
                                                                }
                                                            />
                                                        </List.Item>
                                                    )}
                                                    locale={{
                                                        emptyText: <div />,
                                                    }}
                                                />
                                            </InfiniteScroll>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        id="scrollableDivProc"
                                        className={styles.wfg_listWrap}
                                    >
                                        {procFetching &&
                                        procQueryParams.offset === 1 ? (
                                            <div className={styles.ldWrap}>
                                                <Spin />
                                            </div>
                                        ) : (
                                            <InfiniteScroll
                                                hasMore={
                                                    procList.length < procTotal
                                                }
                                                endMessage={
                                                    procList.length === 0 ? (
                                                        <Empty
                                                            iconSrc={dataEmpty}
                                                            desc={__(
                                                                '暂无数据',
                                                            )}
                                                        />
                                                    ) : (
                                                        ''
                                                    )
                                                }
                                                loader={
                                                    <div
                                                        className={
                                                            styles.ldWrap
                                                        }
                                                    >
                                                        <Spin />
                                                    </div>
                                                }
                                                next={() => {
                                                    setProcQueryParams({
                                                        ...procQueryParams,
                                                        offset:
                                                            procQueryParams.offset +
                                                            1,
                                                    })
                                                }}
                                                dataLength={procList.length}
                                                scrollableTarget="scrollableDivProc"
                                            >
                                                <List
                                                    split={false}
                                                    dataSource={procList}
                                                    renderItem={(item) => (
                                                        <List.Item
                                                            key={item?.id}
                                                        >
                                                            <ListItem
                                                                data={item}
                                                                type={activeKey}
                                                                selected={getAddedIds().includes(
                                                                    item?.id,
                                                                )}
                                                                onStartDrag={
                                                                    startDrag
                                                                }
                                                            />
                                                        </List.Item>
                                                    )}
                                                    locale={{
                                                        emptyText: <div />,
                                                    }}
                                                />
                                            </InfiniteScroll>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </>
                ) : (
                    <div className={styles.lw_packUpWrap}>
                        <Tooltip title={__('展开')} placement="right">
                            <MenuUnfoldOutlined
                                className={styles.leftExpandIcon}
                                onClick={() => setLeftSize(220)}
                            />
                        </Tooltip>
                        <div
                            style={{
                                textAlign: 'center',
                                marginTop: 8,
                                fontWeight: 550,
                            }}
                        >
                            {__('资源')}
                        </div>
                    </div>
                )}
            </div>
            <div
                style={{
                    width: `calc(100% - ${leftSize}px)`,
                    background: '#F6F9FB',
                }}
            >
                <DragVeticalBox
                    defaultSize={defaultSize}
                    minSize={defaultSize[0] === 100 ? 0 : 32}
                    onDragEnd={(rate) => {
                        const close = (window.innerHeight * rate[1]) / 100 < 40
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
                        background: '#F0F0F3',
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
                            hidden={!!getPageStatus()}
                        >
                            <Empty
                                iconSrc={graphEmpty}
                                desc={
                                    <>
                                        <div>
                                            {__(
                                                '您可拖拽左侧「数据加工」或「数据同步」中任意数据',
                                            )}
                                        </div>
                                        <div>{__('开始绘制工作流')}</div>
                                    </>
                                }
                            />
                        </div>
                    </div>
                    <div className={styles.bottom}>
                        <div className={styles.bottomTitWrap} ref={listRef}>
                            {logsItems.length > 0 ? (
                                <XScroll
                                    contentWi={(listSize?.width || 1280) - 100}
                                    contentHi={32}
                                >
                                    <DraggableList
                                        style={{
                                            paddingLeft: 8,
                                            overflow: 'hidden',
                                        }}
                                        items={logsItems.map((item, i) => {
                                            let showLine = true
                                            if (item.choose) {
                                                showLine = false
                                            } else if (
                                                i ===
                                                logsItems.length - 1
                                            ) {
                                                showLine = false
                                            } else {
                                                showLine =
                                                    !logsItems[i + 1].choose
                                            }
                                            return {
                                                label: (
                                                    <HeaderItem
                                                        key={item.model_id}
                                                        item={item}
                                                        selected={item.choose}
                                                        showLine={showLine}
                                                        onClick={() => {
                                                            onSetLogsList(
                                                                logsItems.map(
                                                                    (info) => {
                                                                        if (
                                                                            info.model_id ===
                                                                            item.model_id
                                                                        ) {
                                                                            return {
                                                                                ...info,
                                                                                choose: true,
                                                                            }
                                                                        }
                                                                        return {
                                                                            ...info,
                                                                            choose: false,
                                                                        }
                                                                    },
                                                                ),
                                                            )
                                                        }}
                                                        onClose={() => {
                                                            const res =
                                                                logsItems.filter(
                                                                    (info) =>
                                                                        info.model_id !==
                                                                        item.model_id,
                                                                )
                                                            if (item.choose) {
                                                                onSetLogsList(
                                                                    res.map(
                                                                        (
                                                                            info,
                                                                            idx,
                                                                        ) => {
                                                                            if (
                                                                                idx ===
                                                                                0
                                                                            ) {
                                                                                return {
                                                                                    ...info,
                                                                                    choose: true,
                                                                                }
                                                                            }
                                                                            return {
                                                                                ...info,
                                                                                choose: false,
                                                                            }
                                                                        },
                                                                    ),
                                                                )
                                                            } else {
                                                                onSetLogsList(
                                                                    res,
                                                                )
                                                            }
                                                        }}
                                                    />
                                                ),
                                                key: item.model_id,
                                            }
                                        })}
                                        onDragEnd={(arr) =>
                                            onSetLogsList([
                                                ...arr.map((info) =>
                                                    logsItems.find(
                                                        (a) =>
                                                            a.model_id ===
                                                            info.key,
                                                    ),
                                                ),
                                            ])
                                        }
                                    />
                                </XScroll>
                            ) : (
                                <div className={styles.emptyName}>
                                    {__('日志列表')}
                                </div>
                            )}

                            <div className={styles.bottomBtnWrap}>
                                <Tooltip
                                    title={dragExpand ? __('收起') : __('展开')}
                                    getPopupContainer={(n) => n.parentElement!}
                                >
                                    <div
                                        className={styles.expandIcon}
                                        onClick={() => {
                                            if (defaultSize[0] === 99) {
                                                setDefaultSize([60, 40])
                                            } else if (!dragExpand) {
                                                setDefaultSize(
                                                    defaultSize.map(
                                                        (info) => info + 0.001,
                                                    ),
                                                )
                                            }
                                            setDragExpand(!dragExpand)
                                        }}
                                    >
                                        {dragExpand ? (
                                            <DownOutlined />
                                        ) : (
                                            <UpOutlined />
                                        )}
                                    </div>
                                </Tooltip>
                                <Tooltip
                                    title={__('清空')}
                                    getPopupContainer={(n) => n.parentElement!}
                                >
                                    <div
                                        className={classnames(
                                            styles.expandIcon,
                                            logsItems.length === 0 &&
                                                styles.expandIconDisabled,
                                        )}
                                        onClick={() => {
                                            if (logsItems.length === 0) {
                                                return
                                            }
                                            onSetLogsList([])
                                        }}
                                    >
                                        <RecycleBinOutlined />
                                    </div>
                                </Tooltip>
                                <Tooltip
                                    title={__('关闭')}
                                    getPopupContainer={(n) => n.parentElement!}
                                >
                                    <div
                                        className={styles.expandIcon}
                                        onClick={() => setDefaultSize([100, 0])}
                                    >
                                        <CloseOutlined />
                                    </div>
                                </Tooltip>
                            </div>
                        </div>
                        <div className={styles.bottomContent}>
                            {logsItems.length > 0 ? (
                                <LogsList
                                    pageType="graph"
                                    model={
                                        logsItems.find((info) => info.choose)
                                            ?.model_type === ModelType.SYNC
                                            ? 'sync'
                                            : 'proc'
                                    }
                                    id={
                                        logsItems.find((info) => info.choose)
                                            ?.model_id
                                    }
                                    hi={
                                        52 +
                                        ((window.innerHeight - 52) *
                                            getDefaultSize()[0]) /
                                            100 +
                                        164
                                    }
                                    pageSize={20}
                                />
                            ) : (
                                <div className={styles.bottomEmpty}>
                                    <Empty
                                        desc={
                                            <div>
                                                <div>{__('暂无数据')}</div>
                                                <div>
                                                    {__(
                                                        '可点击任意节点查看其日志',
                                                    )}
                                                </div>
                                            </div>
                                        }
                                        iconSrc={dataEmpty}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </DragVeticalBox>
            </div>
        </div>
    )
}
export default WorkflowGraph
