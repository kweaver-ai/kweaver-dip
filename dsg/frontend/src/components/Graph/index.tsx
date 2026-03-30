import * as React from 'react'
import { useRef, useEffect, useState, useMemo } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
    Cell,
    Graph as GrapType,
    CellView,
    Node,
    Shape,
    DataUri,
    Edge,
} from '@antv/x6'
import { message, Dropdown, Button, Result } from 'antd'
import { useSize, useMap, useThrottleFn, useUnmount, useGetState } from 'ahooks'
import { every } from 'lodash'
import {
    EdgeMetadata,
    instancingGraph,
    lineConfigCollection,
    LineType,
} from '@/core/graph/graph-config'
import { Plugins, loadPlugins } from '@/core/graph/plugin'
import GraphToolBar from './graphToolBar'
import NodeConfigInfo from './NodeConfigInfo'
import { debounceToUpdate, Throttler } from '@/utils/debounce'
import {
    IgnoreHistoryAction,
    StageDataTemplate,
    getNewStagePosition,
    getNodesByShape,
    shapeType,
    SaveStatus,
    ContextMenu,
    DefaultItems,
    InputNodeTemplate,
    ValidateResult,
    checkNodeWithShape,
    getNodeChildren,
    getNewNodePosition,
    checkRepeatStageName,
    changeStageSize,
    messageDebounce,
    getNodeParent,
    checkNodesNoEdges,
    getContainerNodes,
    setStageIsParents,
    getNodeContainer,
    checkRepeatNodeName,
    X6PortalProvider,
} from '@/core/graph/helper'
import {
    assemblyLineGetContent,
    assemblyLineGetRoles,
    assemblyLineSaveContent,
} from '@/core/apis/assemblyLine'
import { IAssemblyLineRoleItem } from '@/core/apis/assemblyLine/index.d'
import { roleIconInfo } from '@/core/apis/configurationCenter/index.d'
import styles from './styles.module.less'
import StageNode from '@/core/graph/GraphNodes/stage'
import InputNode from '@/core/graph/GraphNodes/node'
import { formatError, getRoleIcons, messageError } from '@/core'
import PublishResult from './PublishResult'
import ConfirmModal from './ConfirmModal'
import './x6Style.less'
import Confirm from '../Confirm'
import { getActualUrl, rewriteUrl, useQuery } from '@/utils'
import CustomDrawer from '../CustomDrawer'
import __ from './locale'

/**
 * 工作流程保存类型
 * @param TEMP 临时保存
 * @param FINAL 最终保存
 */
enum SaveType {
    TEMP = 'temp',
    FINAL = 'final',
}
let lineType = LineType.POLY

interface IGraph {
    gid?: string
    open: boolean
    model: string
    operate: string
    onClose: () => void
}

const Graph: React.FC<IGraph> = ({
    gid = '',
    model,
    open,
    operate,
    onClose,
}) => {
    const graphCase = useRef<GrapType>()
    const container = useRef<HTMLDivElement>(null)
    const content = useRef<HTMLDivElement>(null)
    const size = useSize(content)
    const count = 0
    const ThrottleFn = useMemo(() => new Throttler(5000), [])
    const messageDebounced = messageDebounce(3000)

    // 角色信息
    const [roles, setRoles] = useState<IAssemblyLineRoleItem[]>()
    // 编辑的节点
    const [editNode, setEditNode] = useState<
        Node<Node.Properties> | undefined
    >()
    // 页面存在状态
    const [pageStatus, setPageStatus] = useState(true)

    const query = useQuery()
    const graphId = query.get('id') || ''
    const isPublished = query.get('state')
    const [graphModel, setGraphModel] = useState<string>(model)
    const [contextMenuItems, setContextMenuItems] = useState<Array<any>>([])

    const [graphModelId, setGraphModelId, getGraphModelId] =
        useGetState<string>('')

    const [isRedo, setIsRedo] = useState(false)
    const [isUndo, setIsUndo] = useState(false)
    const [addStageStatus, setAddStageStatus] = useState(true)
    const [addInputNodeStatus, setAddInputNodeStatus] = useState(true)
    const [saveStatus, setSaveStatus] = useState(SaveStatus.Normal)
    const [publishStatus, setPublishStatus] = useState(false)
    const [deleteCellsData, setDeleteCellsData] = useState<Array<Cell>>([])
    const [graphSize, setGraphSize] = useState(100)
    const [nodeAddPosition, setNodeAddPosition] = useState<
        { x: number; y: number } | undefined
    >()

    const [roleIcons, setRoleIcons] = useState<Array<roleIconInfo>>([])

    useMemo(() => {
        if (model) {
            setGraphModel(model)
        } else {
            setGraphModel(query?.get('viewKey') || '')
        }
    }, [model])

    /**
     * 获取画布实例
     * @returns Graph
     */
    const getGraphInstance = () => {
        return graphCase
    }
    // 注册阶段图形
    StageNode([getGraphInstance, () => graphModel])

    // 注册节点图形
    InputNode([() => graphModel, () => setEditNode, () => roleIcons])

    const getLineType = () => {
        return lineType
    }
    window.addEventListener(
        'mousewheel',
        (e: any) => {
            if (e.ctrlKey === true || e.metaKey) {
                e.preventDefault()
            }
        },
        { passive: false },
    )

    useEffect(() => {
        if (!gid) {
            ThrottleFn.cancel()
        }
        setGraphModelId(gid)
    }, [gid])
    useEffect(() => {
        if (!open) return
        if (graphCase.current) {
            graphCase.current.dispose()
        }
        // 获取所有图标
        getRoleIconInfo()
        const graph = instancingGraph(container.current, {
            interacting: graphModel !== 'view',
            highlighting: {
                magnetAdsorbed: {
                    name: 'className',
                    args: {
                        className: 'x6-highlighted',
                    },
                },
            },
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
                    const line = getLineType()
                    return new Shape.Edge({
                        ...EdgeMetadata,
                        ...lineConfigCollection[line],
                    })
                },
            },
            mousewheel: {
                enabled: true,
                modifiers: ['ctrl', 'meta'],
                guard(this: any, e: WheelEvent) {
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
        })
        if (graph) {
            if (graphModel === 'resumedraft') {
                loadPlugins(graph, [
                    Plugins.Transform,
                    Plugins.History,
                    Plugins.Keyboard,
                    Plugins.Selection,
                    Plugins.Clipboard,
                    Plugins.Export,
                    Plugins.Scroller,
                ])
            } else {
                loadPlugins(graph, [Plugins.Scroller])
            }
            graphCase.current = graph

            // 连线变更
            graph.on('edge:connected', ({ isNew, edge }) => {
                if (isNew) {
                    const source = edge.getSourceNode()
                    const target = edge.getTargetNode()
                    if (
                        source?.getData().status === ValidateResult.NodeNoEdge
                    ) {
                        source?.setData({
                            ...source.data,
                            status: ValidateResult.Normal,
                        })
                    }
                    if (
                        target?.getData().status === ValidateResult.NodeNoEdge
                    ) {
                        target?.setData({
                            ...target.data,
                            status: ValidateResult.Normal,
                        })
                    }
                }
            })

            graph.on('node:resize', ({ e, x, y, node }) => {
                const { width, height } = node.getSize()
            })

            // 节点绑定
            graph.on('node:embedded', ({ node }) => {
                if (node.getData().status === ValidateResult.NodeNoStage) {
                    node.setData({
                        ...node.data,
                        status: ValidateResult.Normal,
                    })
                }
            })

            // 节点变更
            graph.on('node:changed', ({ node, options }) => {
                ThrottleFn.execute(async () => {
                    if (getGraphModelId()) {
                        try {
                            setSaveStatus(SaveStatus.Saving)
                            await autoSaveData()
                            setSaveStatus(SaveStatus.Saved)
                            const timer = setTimeout(() => {
                                setSaveStatus(SaveStatus.Normal)
                            }, 3000)
                        } catch (e) {
                            messageDebounced(() => formatError(e))
                        }
                    }
                })
            })

            // 添加节点完成事件
            graph.on('node:added', () => {
                const nodes = graph.getNodes()
                const stages = getNodesByShape(nodes, shapeType.Stage)
                const inputNodes = getNodesByShape(nodes, shapeType.InputNode)
                if (stages.length >= 50) {
                    setAddStageStatus(false)
                }
                if (inputNodes.length >= 200) {
                    setAddInputNodeStatus(false)
                }
            })

            // 移除节点完成
            graph.on('node:removed', () => {
                setAddStageStatus(true)
                setAddInputNodeStatus(true)
            })

            // 改变节点大小
            graph.on('node:change:size', ({ node }) => {
                if (node.shape === shapeType.Stage) {
                    const stageNodes = getNodesByShape(
                        graph.getNodes(),
                        shapeType.Stage,
                    )
                    changeStageSize(node, stageNodes, graph.getNodes())
                    setStageIsParents(
                        node,
                        getContainerNodes(node, graph.getNodes()),
                    )
                }
            })

            // 节点mouseenter
            graph.on('node:mouseenter', ({ node }) => {
                if (checkNodeWithShape(node, shapeType.InputNode)) {
                    showPorts(true, graphModel)
                }
            })

            // 节点mouseleave
            graph.on('node:mouseleave', ({ node }) => {
                if (checkNodeWithShape(node, shapeType.InputNode)) {
                    showPorts(false, graphModel)
                }
            })

            graph.on('node:moved', ({ node }) => {
                if (node.shape === shapeType.Stage) {
                    setStageIsParents(
                        node,
                        getContainerNodes(node, graph.getNodes()),
                    )
                }
            })

            // 鼠标移入
            graph.on('edge:mouseenter', ({ edge }) => {
                const cells: Array<Cell> = graph.getSelectedCells()
                if (!cells.find((cell) => cell.id === edge.id)) {
                    edge.attr('line/stroke', '#126EE3')
                }
            })

            // 鼠标移出
            graph.on('edge:mouseleave', ({ edge }) => {
                edge.attr('line/stroke', 'rgba(0,0,0,0.65)')
            })

            // 节点选中
            graph.on('node:selected', ({ node }) => {
                const cells: Array<Cell> = graph.getSelectedCells()

                if (node.shape === shapeType.Stage) {
                    loadPlugins(graph, [Plugins.Transform], {
                        [Plugins.Transform]: {
                            resizing: {
                                enabled: true,
                                minHeight: 420,
                                minWidth: 220,
                            },
                        },
                    })
                } else if (node.shape === shapeType.InputNode) {
                    loadPlugins(graph, [Plugins.Transform], {
                        [Plugins.Transform]: {
                            resizing: {
                                enabled: true,
                                minHeight: 44,
                                minWidth: 170,
                            },
                        },
                    })
                }
                const nodes: Array<Node> = cells.reduce(
                    (preData: any, value, index, array) => {
                        const currentNode = getNodesById(value.id)
                        return currentNode ? [...preData, currentNode] : preData
                    },
                    [],
                )
                if (cells.length === 1) {
                    if (cells[0].shape === shapeType.Stage) {
                        setContextMenuItems([DefaultItems[ContextMenu.Delete]])
                    } else if (cells[0].shape === shapeType.InputNode) {
                        setContextMenuItems([
                            DefaultItems[ContextMenu.Edit],
                            DefaultItems[ContextMenu.Copy],
                            DefaultItems[ContextMenu.Delete],
                        ])
                    }
                } else if (cells.length === 0) {
                    setContextMenuItems([])
                } else if (
                    nodes.length &&
                    getNodesByShape(nodes, shapeType.InputNode).length
                ) {
                    setContextMenuItems([
                        DefaultItems[ContextMenu.Copy],
                        DefaultItems[ContextMenu.Delete],
                    ])
                } else {
                    setContextMenuItems([DefaultItems[ContextMenu.Delete]])
                }
            })

            // 节点取消选中
            graph.on('node:unselected', ({ cell, node }) => {
                const cells: Array<Cell> = graph.getSelectedCells()
                if (cells.length === 1) {
                    if (cells[0].shape === shapeType.Stage) {
                        setContextMenuItems([DefaultItems[ContextMenu.Delete]])
                    } else if (cells[0].shape === shapeType.InputNode) {
                        setContextMenuItems([
                            DefaultItems[ContextMenu.Edit],
                            DefaultItems[ContextMenu.Copy],
                            DefaultItems[ContextMenu.Delete],
                        ])
                    }
                } else {
                    setContextMenuItems([])
                }
            })

            graph.on('edge:selected', ({ edge }) => {
                edge.addTools([
                    'vertices',
                    'segments',
                    {
                        name: 'button-remove', // 工具名称
                        args: {
                            // 工具对应的参数
                            x: 0,
                            y: 0,
                        },
                    },
                ])
                edge.attr('line/stroke', 'rgba(0,0,0,0.65)')
            })

            graph.on('edge:unselected', ({ edge }) => {
                edge.removeTools()
                edge.attr('line/stroke', 'rgba(0,0,0,0.65)')
            })

            // 键盘删除选中节点
            graph.bindKey('backspace', () => {
                deleteCells()
            })
            // 键盘删除选中节点
            graph.bindKey('delete', () => {
                deleteCells()
            })

            // 复制
            graph.bindKey(['meta+c', 'ctrl+c'], () => {
                copyCells()
            })

            // 粘贴
            graph.bindKey(['meta+v', 'ctrl+v'], () => {
                if (!graph.isClipboardEmpty()) {
                    const cells = graph.paste({ offset: 32 })
                    graph.cleanSelection()
                    graph.select(cells)
                }
            })

            // 撤销
            graph.bindKey(['meta+z', 'ctrl+z'], () => {
                if (graph.canUndo()) {
                    graph.undo()
                }
            })

            // 重做
            graph.bindKey(['meta+shift+z', 'ctrl+shift+z'], () => {
                if (graph.canRedo()) {
                    graph.redo()
                }
            })

            /**
             * 历史堆栈变更 （IgnoreHistoryAction里面包含的操作，不进入历史堆栈）
             */
            graph.on('history:change', async ({ cmds, options }) => {
                const { propertyPath } = options
                if (IgnoreHistoryAction.indexOf(propertyPath) > -1) return
                setIsUndo(graph.canUndo())
                setIsRedo(graph.canRedo())
                ThrottleFn.execute(async () => {
                    if (getGraphModelId()) {
                        try {
                            setSaveStatus(SaveStatus.Saving)
                            await autoSaveData()
                            setSaveStatus(SaveStatus.Saved)
                            const timer = setTimeout(() => {
                                setSaveStatus(SaveStatus.Normal)
                            }, 3000)
                        } catch (e) {
                            messageDebounced(() => formatError(e))
                        }
                    }
                })
            })
        }
        getRolesList()
        getContent()
        setNodeAddPosition(undefined)
    }, [open, graphModel])

    /**
     * 获取所有角色图标
     */
    const getRoleIconInfo = async () => {
        const icons = await getRoleIcons()
        setRoleIcons(icons)
    }
    /**
     * 桩的显示状态
     * @param show
     * @returns
     */
    const showPorts = (show: boolean, modelType: string) => {
        if (!container.current || modelType === 'view' || !graphCase.current) {
            return
        }
        const nodes = getNodesByShape(
            graphCase.current.getNodes(),
            shapeType.InputNode,
        )
        nodes.forEach((n) => {
            const ports = n.getPorts()
            ports.forEach((p) => {
                if (p?.id) {
                    n.setPortProp(p.id, 'attrs/rect', {
                        fill: show ? 'transparent' : 'none',
                        magnet: show,
                    })
                    n.setPortProp(p.id, 'attrs/circle', {
                        fill: show ? '#fff' : 'none',
                        stroke: show ? '#126EE3' : 'none',
                        magnet: show,
                    })
                }
            })
        })
    }
    /**
     * 获取角色列表
     */
    const getRolesList = async () => {
        const res = await assemblyLineGetRoles()
        setRoles(res.entries)
    }

    /**
     * 自动保存
     */

    const autoSaveData = async () => {
        if (graphCase.current) {
            await getImage(async (image) => {
                try {
                    deleteEdgeTool()

                    await assemblyLineSaveContent(getGraphModelId() as string, {
                        content: JSON.stringify(
                            graphCase.current?.toJSON().cells,
                        ),
                        type: 'temp',
                        image,
                    })
                } catch (e) {
                    if (
                        e.data.code ===
                        'ConfigurationCenter.Flowchart.NodeExecutorRoleNotExist'
                    ) {
                        getContent()
                    }
                    messageDebounced(() => {
                        formatError(e)
                    })
                }
            })
        }
    }

    /**
     * 新建阶段
     */
    const addStage = () => {
        if (!graphCase.current) {
            return
        }
        const stageNodes = getNodesByShape(
            graphCase.current.getNodes(),
            shapeType.Stage,
        )
        if (!stageNodes.length) {
            const position = graphCase.current.clientToLocal({
                x: ((size?.width || 1600) - 300) / 2,
                y: ((size?.height || 800) - 52 - 500) / 2,
            })
            const node = graphCase.current.addNode({
                ...StageDataTemplate,
                position: {
                    x: Math.round(position.x),
                    y: Math.round(position.y),
                },
            })
            setStageIsParents(
                node,
                getContainerNodes(node, graphCase.current.getNodes()),
            )
        } else {
            const node = graphCase.current.addNode({
                ...StageDataTemplate,
                position: getNewStagePosition(stageNodes),
            })
            setStageIsParents(
                node,
                getContainerNodes(node, graphCase.current.getNodes()),
            )
        }
    }

    /**
     * 新建节点
     */
    const addCustomNode = () => {
        if (!graphCase.current) {
            return
        }
        const nodes = getNodesByShape(
            graphCase.current.getNodes(),
            shapeType.InputNode,
        )
        const center = {
            x: ((size?.width || 1600) - 240) / 2,
            y: ((size?.height || 800) - 52 - 44) / 2,
        }
        const centerLocal = graphCase.current.clientToLocal(center)
        const pos = getNewNodePosition(nodes, centerLocal, nodeAddPosition)
        const node = graphCase.current?.addNode({
            ...InputNodeTemplate,
            position: pos,
        })
        const stages = getNodeContainer(node, graphCase.current.getNodes())
        if (stages.length) {
            setStageIsParents(stages[0], [node])
        }
        setNodeAddPosition(pos)
    }

    /**
     * 撤销回退
     */
    const onUndoGraph = () => {
        if (graphCase.current && graphCase.current.canUndo()) {
            graphCase.current.undo()
        }
    }

    /**
     * 重做
     */
    const onRedoGraph = () => {
        if (graphCase.current && graphCase.current.canRedo()) {
            graphCase.current.redo()
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
            graphCase.current.zoomToFit({ padding: 24 })
            const multiple = graphCase.current.zoom()
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
     * 标红错误节点
     */
    const showErrorNodesRed = (nodes: Array<Node>, err: ValidateResult) => {
        nodes.forEach((n) => {
            n.setData({
                ...n.data,
                status: err,
            })
        })
    }

    /**
     * 检查节点信息是否完整
     * @param nodes Array<Node> 节点集合
     * @returns 不符合的节点集合
     */
    const checkNodesConfig = (nodes: Array<Node>): Array<Node> => {
        return nodes.filter((n) => {
            if (!n.data) {
                return false
            }
            const { name, node_config, task_config } = n.data
            const { start_mode, completion_mode } = node_config
            return !name || !start_mode
        })
    }

    /**
     * 发布
     */
    const publish = async () => {
        if (!graphCase.current || !graphId) {
            return
        }
        // 取消节流函数 保存数据
        ThrottleFn.cancel()
        const allNodes = graphCase.current.getNodes()
        const nodes = getNodesByShape(allNodes, shapeType.InputNode)
        const stages = getNodesByShape(allNodes, shapeType.Stage)
        // 节点信息
        const infoMissNodes = checkNodesConfig(nodes)
        // 节点无阶段
        const noParentNodes = nodes.filter((n) => getNodeParent(n) === null)
        // 节点游离
        const noEdgeNodes = checkNodesNoEdges(
            nodes,
            graphCase.current.getEdges(),
        )
        // 节点同名
        const nodesNameRepeat = checkRepeatNodeName(nodes)

        // 阶段无节点 TODO
        const freeStages = stages.filter((s) => getNodeChildren(s).length === 0)

        switch (true) {
            case allNodes.length === 0:
                // 工作流程空白
                messageDebounced(() => {
                    messageError(__('请绘制工作流程后再点击发布'))
                })
                break
            case infoMissNodes.length > 0:
                // 存在未配置的节点数据
                showErrorNodesRed(
                    infoMissNodes,
                    ValidateResult.NodeConfigInfoIsNone,
                )
                messageDebounced(() => {
                    messageError(__('工作流程中存在节点未配置信息，请检查'))
                })
                break
            case noEdgeNodes.length > 0:
                // 存在游离节点
                showErrorNodesRed(noEdgeNodes, ValidateResult.NodeNoEdge)
                messageDebounced(() =>
                    messageError(
                        __('工作流程中存在未产生任何连接的节点，请检查'),
                    ),
                )
                break
            case noParentNodes.length > 0 && stages.length > 0:
                //  有阶段情况下，节点无阶段
                showErrorNodesRed(noParentNodes, ValidateResult.NodeNoStage)
                messageDebounced(() =>
                    messageError(
                        __('工作流程中存在未设置任何阶段的节点，请检查'),
                    ),
                )
                break
            case nodesNameRepeat.length > 0:
                // 存在同名节点
                showErrorNodesRed(
                    nodesNameRepeat,
                    ValidateResult.NodeNameRepeat,
                )
                messageDebounced(() => messageError(__('存在同名节点')))
                break
            case checkRepeatStageName(stages):
                // 存在同名阶段
                messageDebounced(() => messageError(__('存在同名阶段')))
                break
            case freeStages.length > 0:
                // 存在没有节点的阶段
                messageDebounced(() =>
                    messageError(
                        __('工作流程中存在未设置任何节点的阶段，请检查'),
                    ),
                )
                break
            default:
                // 去掉自动保存延时函数
                await graphCase.current.centerContent()
                await getImage(async (image) => {
                    try {
                        deleteEdgeTool()
                        await assemblyLineSaveContent(graphId, {
                            content: JSON.stringify(
                                graphCase.current?.toJSON().cells,
                            ),
                            type: 'final',
                            image,
                        })
                        setPublishStatus(true)
                    } catch (e) {
                        if (
                            e.data.code ===
                            'ConfigurationCenter.Flowchart.NodeExecutorRoleNotExist'
                        ) {
                            getContent()
                        }
                        messageDebounced(() => {
                            formatError(e)
                        })
                    }
                })

                break
        }
    }

    /**
     * 获取工作流程内容
     */
    const getContent = async () => {
        if (!graphCase || !graphCase.current) {
            return
        }
        try {
            if (graphId) {
                const data = await assemblyLineGetContent(graphId, {})
                if (!data.content) {
                    return
                }
                const cellsData = JSON.parse(data.content)
                await graphCase.current.fromJSON({ cells: cellsData })
                const allNodes = graphCase.current.getNodes()
                const nodes = getNodesByShape(allNodes, shapeType.InputNode)
                graphCase.current?.zoomToFit({ padding: 20 })
                const multiple = graphCase.current.zoom()
                if (multiple > 1) {
                    graphCase.current.zoomTo(1)
                    setGraphSize(100)
                } else {
                    const showSize = Math.round(multiple * 100)
                    setGraphSize(showSize - (showSize % 5))
                }
                await nodes.forEach((n) => {
                    n.setData({
                        ...n.data,
                        status: ValidateResult.Normal,
                    })
                })
                deleteEdgeTool()
            } else {
                setPageStatus(false)
            }
            ThrottleFn.cancel()
        } catch (e) {
            messageDebounced(() => {
                formatError(e)
            })
        }
    }

    /**
     * 保存工作流程内容
     */
    const saveContent = async (): Promise<void> => {
        if (graphId && graphCase.current) {
            const allNodes = graphCase.current.getNodes()
            const nodes = getNodesByShape(allNodes, shapeType.InputNode)
            await nodes.forEach((n) => {
                n.setData({
                    ...n.data,
                    status: ValidateResult.Normal,
                })
            })
            deleteEdgeTool()
            await graphCase.current.centerContent()
            await getImage(async (image) => {
                try {
                    messageDebounced(async () => {
                        await assemblyLineSaveContent(graphId, {
                            content: JSON.stringify(
                                graphCase.current?.toJSON().cells,
                            ),
                            type: 'temp',
                            image,
                        })
                        message.success(__('保存草稿成功'))
                        // navigator(
                        //     getActualUrl(
                        //         `/systemConfig/assemblyLineConfig?state=${query.get(
                        //             'state',
                        //         )}`,
                        //     ),
                        // )
                        rewriteUrl(
                            `${window.location.pathname}?state=${
                                operate === 'create'
                                    ? 'unreleased'
                                    : query.get('state')
                            }`,
                        )
                        onClose()
                    })
                } catch (e) {
                    messageDebounced(() => {
                        formatError(e)
                    })
                }
            })
        }
    }

    /** *
     * 批量去掉边工具
     */
    const deleteEdgeTool = () => {
        const edges = graphCase.current?.getEdges()
        edges?.forEach((edge) => {
            edge.removeTools()
        })
    }

    /**
     * 右键菜单事件
     * @param key 事件类型
     * @returns 无
     */
    const onClickContextMenu = async (key: string) => {
        if (!graphCase.current) {
            return
        }
        const cells = graphCase.current.getSelectedCells()
        const node = getNodesById(cells[0].id)
        switch (true) {
            case key === 'edit':
                if (node) {
                    setEditNode(node)
                }
                break
            case key === 'copy':
                await copyCells()
                await pasteCells()
                break
            case key === 'delete':
                deleteCells()
                break
            default:
                break
        }
    }

    /**
     * 根据id获取节点信息
     * @param id 节点id
     * @returns 返回找到的节点，若没找到返回undefined
     */
    const getNodesById = (id: string): Node | undefined => {
        if (graphCase.current) {
            return graphCase.current.getNodes().filter((node) => {
                return node.id === id
            })[0]
        }
        return undefined
    }

    const deleteCells = () => {
        if (graphCase.current) {
            const cells = graphCase.current.getSelectedCells()
            if (cells.length) {
                cells.forEach((c) => {
                    const node = getNodesById(c.id)
                    if (node && checkNodeWithShape(node, shapeType.Stage)) {
                        getNodeChildren(node)?.forEach((child) => {
                            node.unembed(child)
                        })
                    }
                })
                setContextMenuItems([])
                if (
                    !cells.find((info) => {
                        const { data } = info
                        return (
                            data?.node_config?.start_mode &&
                            data?.task_config?.task_type
                        )
                    })
                ) {
                    graphCase.current.removeCells(cells)
                    return
                }
                if (cells.length > 1) {
                    setDeleteCellsData(cells)
                } else if (
                    cells.length === 1 &&
                    cells[0].shape === shapeType.InputNode
                ) {
                    setDeleteCellsData(cells)
                } else {
                    graphCase.current.removeCells(cells)
                }
            }
        }
    }

    /**
     * 获取图片
     * @returns base64
     */
    // const getImage = async () => {
    //     let imageData = ''
    //     await graphCase.current?.toSVG(
    //         (dataUri) => {
    //             imageData = DataUri.svgToDataUrl(dataUri)
    //         },
    //         {
    //             preserveDimensions: true,
    //             copyStyles: true,
    //             serializeImages: true,
    //         },
    //     )
    //     return imageData
    // }

    const getImage = async (setImage: (image: string) => void) => {
        if (graphCase.current) {
            requestIdleCallback(async () => {
                await graphCase.current!.toPNG(
                    async (dataUri: string) => {
                        // 下载
                        await DataUri.imageToDataUri(
                            dataUri,
                            async (err, data) => {
                                if (!err && data) {
                                    await setImage(data)
                                }
                            },
                        )
                    },
                    {
                        // 画布间距
                        padding: {
                            top: 20,
                            right: 30,
                            bottom: 40,
                            left: 50,
                        },

                        width: 400, // 画布高度
                        height: 220, // 画布宽度
                        backgroundColor: '#EFF2F5', // 画布背景颜色
                        quality: 0, // 画布质量 0和1区间
                        copyStyles: false,
                    },
                )
            })
        }
    }

    /**
     * 返回工作流程列表
     */
    const handleBackGrapList = () => {
        // navigator(getActualUrl('/systemConfig/assemblyLineConfig'))
        onClose()
        rewriteUrl(`${window.location.pathname}`)
    }

    /**
     * 复制Cells
     */
    const copyCells = () => {
        if (!graphCase.current) {
            return
        }
        const cells = graphCase.current.getSelectedCells().filter((cell) => {
            return cell.shape !== shapeType.Stage
        })
        if (cells.length) {
            graphCase.current.copy(cells)
        }
    }
    /**
     * 粘贴
     */
    const pasteCells = () => {
        if (!graphCase.current) {
            return
        }
        if (!graphCase.current.isClipboardEmpty()) {
            const cells = graphCase.current.paste({ offset: 32 })
            graphCase.current.cleanSelection()
            graphCase.current.select(cells)
        }
    }

    return pageStatus ? (
        <CustomDrawer
            open={open}
            isShowFooter={false}
            bodyStyle={{
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
            destroyOnClose
            push={{ distance: 0 }}
            customHeaderStyle={{ display: 'none' }}
            customBodyStyle={{ height: '100%' }}
            contentWrapperStyle={{
                width: '100%',
                boxShadow: 'none',
                // transform: 'none',
            }}
            style={{
                position: 'fixed',
                width: '100vw',
                height: '100vh',
                top: '0',
            }}
        >
            <div className={styles.content} ref={content}>
                <GraphToolBar
                    gid={graphId}
                    model={graphModel}
                    undoDisabled={!isUndo}
                    redoDisabled={!isRedo}
                    onAddStage={addStage}
                    onAddNode={addCustomNode}
                    onUndoGraph={onUndoGraph}
                    onRedoGraph={onRedoGraph}
                    onChangeGraphSize={changeGraphSize}
                    onShowAllGraphSize={showAllGraphSize}
                    onMovedToCenter={movedToCenter}
                    onPublish={publish}
                    onLineTypeChange={(t) => {
                        lineType = t
                    }}
                    onSaveGraph={saveContent}
                    onClose={onClose}
                    onGraphModelChange={(info) => setGraphModel(info)}
                    addStageDisabled={!addStageStatus}
                    addInputNodeDisabled={!addInputNodeStatus}
                    saveStatus={saveStatus}
                    graphSize={graphSize}
                />
                <Dropdown
                    menu={{
                        items: contextMenuItems,
                        onClick: ({ key }) => {
                            onClickContextMenu(key)
                        },
                    }}
                    disabled={!contextMenuItems.length}
                    trigger={['contextMenu']}
                    overlayStyle={{
                        width: contextMenuItems.length > 0 ? 118 : 0,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            width: '100%',
                            height: 'calc(100% - 52px)',
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
                    </div>
                </Dropdown>

                <NodeConfigInfo
                    open={editNode !== undefined}
                    node={editNode}
                    graph={graphCase}
                    graphModel={graphModel}
                    onClose={() => setEditNode(undefined)}
                    roleIcons={roleIcons}
                />
                {publishStatus ? (
                    <PublishResult
                        returnAssemblyLine={onClose}
                        onModelClose={() => {
                            setPublishStatus(false)
                        }}
                        publishedStatus={isPublished}
                    />
                ) : null}
                <Confirm
                    open={!!deleteCellsData.length}
                    title={
                        deleteCellsData.length === 1
                            ? __('确认要删除该节点吗？')
                            : __('确定删除已选中的内容吗')
                    }
                    content={
                        deleteCellsData.length === 1
                            ? __(
                                  '节点及其配置信息被删除后无法找回，请谨慎操作！',
                              )
                            : __(
                                  '阶段/节点/连接线及节点配置信息被删除后，将无法找回，请谨慎操作！',
                              )
                    }
                    onOk={() => {
                        setDeleteCellsData([])
                        graphCase.current?.removeCells(deleteCellsData)
                    }}
                    onCancel={() => {
                        setDeleteCellsData([])
                    }}
                />
            </div>
        </CustomDrawer>
    ) : (
        <div className={styles.notFoundWraper}>
            <Result
                status="404"
                title="404"
                subTitle={__('未找到工作流程资源')}
                extra={
                    <Button type="primary" onClick={handleBackGrapList}>
                        {__('返回工作流程列表')}
                    </Button>
                }
            />
        </div>
    )
}
export default Graph
