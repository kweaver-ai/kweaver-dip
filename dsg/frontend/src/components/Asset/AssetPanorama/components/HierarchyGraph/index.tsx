import { Graph } from '@antv/x6'
import { useDebounce, useUnmount } from 'ahooks'
import { Button } from 'antd'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import ReactJoyride, {
    CallBackProps,
    STATUS,
    TooltipRenderProps,
} from 'react-joyride'
import FloatBar from '@/components/DataConsanguinity/FloatBar'
import { formatError, getClassification } from '@/core'
import { instancingGraph } from '@/core/graph/graph-config'
import { X6PortalProvider } from '@/core/graph/helper'
import { AssetCardClickOutlined } from '@/icons'
import { usePanoramaContext } from '../../PanoramaProvider'
import __ from '../../locale'
import { HierarchyNode } from './HierarchyNode'
import {
    EdgeConf,
    EdgeType,
    GraphConf,
    INode,
    changeExpandIds,
    graphRenderByData,
    renderList,
    toggleAll,
    toggleNode,
    transformNodes,
} from './helper'
import styles from './styles.module.less'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const CustomToolTip = ({
    backProps,
    continuous,
    index,
    isLastStep,
    primaryProps,
    skipProps,
    step,
    tooltipProps,
}: TooltipRenderProps) => {
    return (
        <div {...tooltipProps} className={styles['guide-pop']}>
            <div className={styles.icon}>
                <AssetCardClickOutlined style={{ color: '#3E75FF' }} />
            </div>
            <div className={styles.content}>
                <div>{__('点击L1卡片')}</div>
                <div>{__('切换查看不同主题域分组下内容')}</div>
            </div>
            <Button
                type="primary"
                {...primaryProps}
                title=""
                className={styles.button}
            >
                {__('我知道了')}
            </Button>
        </div>
    )
}

interface IHierarchyGraph {
    groups: INode[]
}

function HierarchyGraph({ groups }: IHierarchyGraph) {
    const [userId] = useCurrentUser('ID')
    const graphCase = useRef<Graph>()
    const container = useRef<HTMLDivElement>(null)
    const [data, setData] = useState<INode>()
    const [runStart, setRunStart] = useState(false)
    const [graphSize, setGraphSize] = useState(100)
    const {
        currentNode,
        activeId,
        groupNodeMap,
        optGroupNodeMap,
        setCurrentNode,
        shrink,
        setSearchSelectedNodeId,
    } = usePanoramaContext()
    const debouncedGraphSize = useDebounce(graphSize, { wait: 200 })
    const [isFirstPaint, setIsFirstPaint] = useState<boolean>(true)

    useMemo(() => {
        // 注册边
        Graph.registerEdge(EdgeType, EdgeConf, true)
        // 注册节点
        HierarchyNode()
    }, [])

    useEffect(() => {
        const graph = instancingGraph(container.current, {
            ...GraphConf,
            mousewheel: {
                enabled: true,
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

                        return true
                    }
                    return false
                },
            },
        })
        if (graph) {
            graphCase.current = graph
            graph.on('node:change:data', ({ node, previous, current }) => {
                // 监听属性改变 重绘布局
                if (['expand'].some((key) => previous[key] !== current[key])) {
                    setData((prev) => toggleNode(prev, node.data))
                }
            })
            graph.on('scale', ({ sx, sy }) => {
                const showSize = sx * 100
                setGraphSize(Math.floor(showSize))
            })

            graph.on('blank:click', () => {
                setCurrentNode(undefined)
            })
        }
    }, [])

    const showJoyRide = () => {
        if (localStorage.getItem('userInfo') !== null) {
            if (
                localStorage.getItem('af_HierarchyGuide') === null ||
                !JSON.parse(localStorage.getItem('af_HierarchyGuide') || '')?.[
                    userId
                ]
            ) {
                setRunStart(true)
            }
        } else {
            setRunStart(true)
        }
    }

    const onLoad = async (id: string) => {
        const node = groupNodeMap[id]
        if (node) {
            setData(node)
            setCurrentNode({ ...currentNode })
            return
        }
        try {
            const res = await getClassification({
                id,
                display: 'tree',
                open_hierarchy: true,
            })
            const netNode = transformNodes(res?.entries?.[0] as any)
            if (netNode) {
                setData(netNode)
                optGroupNodeMap(id, netNode)
            }
        } catch (error) {
            formatError(error)
        } finally {
            setCurrentNode({ ...currentNode })
        }
    }

    useEffect(() => {
        if (
            data &&
            currentNode &&
            currentNode?.subject_id_path?.startsWith(data?.id)
        ) {
            const L3Id = currentNode.subject_id_path?.split('/')[2]
            const d = changeExpandIds(data, [L3Id])
            if (d) {
                setData(d)
            }
        }
    }, [currentNode])

    useEffect(() => {
        onLoad(activeId || groups[0].id)
    }, [groups, activeId])

    useEffect(() => {
        movedToCenter()
    }, [activeId])

    useEffect(() => {
        if (graphCase?.current && data) {
            graphRenderByData(graphCase.current, data as any)
            renderList(graphCase.current, groups, data.id)
            if (isFirstPaint) {
                onCenterCircle()
                setIsFirstPaint(false)
                setTimeout(() => {
                    showJoyRide()
                }, 200)
            }
            // 调整库表中心

            if (currentNode && !currentNode.keep) {
                moveCenterByCellId(currentNode.id)
            }
        }
    }, [data])

    useEffect(() => {
        if (shrink) {
            setData((prev) => toggleAll(prev))
        }
    }, [shrink])

    useUnmount(() => {
        graphCase.current = undefined
    })

    const moveCenterByCellId = (id: string) => {
        const cell = graphCase.current?.getCellById(id)
        if (cell) {
            graphCase.current?.centerCell(cell)
        }
    }

    const onCenterCircle = () => {
        if (data?.id) {
            const circle = graphCase.current?.getCellById(data?.id)
            if (circle) {
                graphCase.current?.positionCell(circle, 'top')
                graphCase.current?.translateBy(0, 20)
            }
        } else {
            graphCase.current?.centerContent()
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

    /**
     * 画布定位到中心
     */
    const movedToCenter = () => {
        onCenterCircle()
        // graphCase.current?.centerContent()
    }

    const handleJoyrideCallback = (cb: CallBackProps) => {
        const { status, type, action } = cb
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]
        if (finishedStatuses.includes(status) && action === 'close') {
            setRunStart(false)
            if (localStorage.getItem('af_HierarchyGuide') === null) {
                localStorage.setItem(
                    'af_HierarchyGuide',
                    JSON.stringify({
                        [userId]: true,
                    }),
                )
            } else {
                const guideInfo = JSON.parse(
                    localStorage.getItem('af_HierarchyGuide') || '',
                )
                localStorage.setItem(
                    'af_HierarchyGuide',
                    JSON.stringify({
                        ...guideInfo,
                        [userId]: true,
                    }),
                )
            }
        }
    }

    const steps: any = [
        {
            placement: 'bottom',
            disableBeacon: true,
            target: '.af_panorama',
        },
    ]
    return (
        <div className={styles['asset-wrapper']}>
            <X6PortalProvider />
            <div
                ref={container}
                id="container"
                className={styles['asset-wrapper-graph']}
                onClick={() => {
                    setSearchSelectedNodeId('')
                }}
            />
            <div className={styles['asset-wrapper-controller']}>
                <FloatBar
                    onChangeGraphSize={changeGraphSize}
                    onShowAllGraphSize={showAllGraphSize}
                    graphSize={debouncedGraphSize}
                    onMovedToCenter={movedToCenter}
                />
            </div>
            {runStart && (
                <ReactJoyride
                    callback={(e) => handleJoyrideCallback(e)}
                    hideCloseButton
                    run={runStart}
                    scrollToFirstStep
                    steps={steps}
                    tooltipComponent={CustomToolTip}
                    spotlightPadding={-1}
                    styles={{
                        options: {
                            zIndex: 10000,
                            arrowColor: 'transparent',
                        },
                        overlay: {
                            cursor: 'default',
                        },
                    }}
                />
            )}
        </div>
    )
}

export default memo(HierarchyGraph)
