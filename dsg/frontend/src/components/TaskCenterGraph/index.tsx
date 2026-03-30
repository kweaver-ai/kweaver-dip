import { Cell, Graph as GrapType, Node } from '@antv/x6'
import { Layout } from 'antd'
import { noop } from 'lodash'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { formatError } from '@/core'
import {
    getFlowChartByPid,
    getFlowChartRate,
} from '@/core/apis/taskCenter/index'
import StageNode from '@/core/graph/GraphNodes/stage'
import TaskNode from '@/core/graph/GraphNodes/taskNode'
import { instancingGraph } from '@/core/graph/graph-config'
import {
    X6PortalProvider,
    messageDebounce,
    shapeType,
} from '@/core/graph/helper'
import { Plugins, loadPlugins } from '@/core/graph/plugin'
import TaskManage from './TaskManage'
import './x6Style.less'

const { Header: AntdHeader } = Layout

// 注册阶段图形
StageNode([() => null, () => 'view'])

interface TaskCenterGraphType {
    onSetGraphCase: (graphCase: GrapType) => void
    onGetGraphSize: (graphSize: number) => void
}

const TaskCenterGraph = ({
    onSetGraphCase = noop,
    onGetGraphSize = noop,
}: TaskCenterGraphType) => {
    const graphCase = useRef<GrapType>()
    const container = useRef<HTMLDivElement>(null)
    const [selectedNode, setSelectedNode] = useState<Node | null>(null)
    const [selectedParent, setSelectedParent] = useState<Cell | null>(null)
    const messageDebounced = messageDebounce(3000)
    const { pathname } = useLocation()
    const projectId = pathname.split('/')[3]

    // 注册节点图形
    TaskNode()

    useEffect(() => {
        const graph = instancingGraph(container.current, {
            interacting: false,

            mousewheel: {
                enabled: true,
                modifiers: ['ctrl', 'meta'],
                guard(this: any, e: WheelEvent) {
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
            loadPlugins(graph, [Plugins.Selection, Plugins.Scroller], {
                [Plugins.Selection]: {
                    enabled: true,
                    multiple: false,
                    rubberEdge: false,
                    rubberNode: true,
                    rubberband: false,
                    showNodeSelectionBox: true,
                    pointerEvents: 'none',
                    className: 'graph-seleted',
                },
            })
            graphCase.current = graph
        }
        if (graph) {
            onSetGraphCase(graph)
        }
        graph?.on('node:selected', ({ node }) => {
            if (node.shape === shapeType.Stage) {
                graph.resetSelection()
            } else {
                setSelectedNode(node)
                setSelectedParent(node.getParent())
            }
        })

        graph?.on('node:unselected', ({ node }) => {
            setSelectedNode(null)
            setSelectedParent(null)
        })
        getContent()
    }, [])

    /**
     * 取消节点选中
     */
    const unselectedCell = () => {
        graphCase.current?.cleanSelection()
    }

    const getContent = async () => {
        if (!graphCase || !graphCase.current) {
            return
        }
        try {
            const data = await getFlowChartByPid(projectId)
            const rateData = await getFlowChartRate(projectId)

            const cellsData = JSON.parse(data.content).map((cell: any) => {
                if (cell.shape === shapeType.InputNode) {
                    return {
                        ...cell,
                        shape: shapeType.TaskNode,
                        data: {
                            ...cell.data,
                            ...rateData.filter(
                                (rate) => rate.node_id === cell.id,
                            )[0],
                        },
                    }
                }
                return cell
            })

            await graphCase.current.fromJSON({ cells: cellsData })
            // const allNodes = graphCase.current.getNodes()
            graphCase.current?.centerContent()
            graphCase.current?.zoomToFit({ padding: 24 })
            const multiple = graphCase.current.zoom()
            if (multiple > 1) {
                graphCase.current.zoomTo(1)
                onGetGraphSize(100)
            } else {
                const showSize = Math.round(multiple * 100)
                onGetGraphSize(showSize - (showSize % 5))
            }
        } catch (e) {
            messageDebounced(() => {
                formatError(e)
            })
        }
    }
    return (
        <div
            style={{
                position: 'relative',
                width: '100vw',
                height: '100vh',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    height: 'calc(100% - 76px)',
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
            <div>
                {selectedNode ? (
                    <TaskManage
                        nodeInfo={selectedNode}
                        stageInfo={selectedParent}
                        projectId={projectId}
                        onClose={unselectedCell}
                    />
                ) : null}
            </div>
        </div>
    )
}

export default TaskCenterGraph
