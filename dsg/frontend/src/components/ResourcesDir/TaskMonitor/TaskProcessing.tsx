import { Graph } from '@antv/x6'
import { useDebounce, useSize } from 'ahooks'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import FloatBar from '@/components/DataConsanguinity/FloatBar'
import { instancingGraph } from '@/core/graph/graph-config'
import { X6PortalProvider } from '@/core/graph/helper'
import { EdgeConf, EdgeType, GraphConfig, renderGraph } from './helper'
import styles from './styles.module.less'
import { TaskNode } from './nodes/TaskNode'
import { CatalogNode } from './nodes/CatalogNode'
import { TagNode } from './nodes/TagNode'
import { NodeContext } from './NodeContext'
import QualityReportDetail from '@/components/WorkOrder/QualityReport/ReportDetail'
import { TabKey } from '../const'
import { DataViewProvider } from '@/components/DatasheetView/DataViewProvider'

function TaskProcessing({
    data,
    viewItem,
    catalogId,
    updateActiveKey,
}: {
    data: any
    viewItem?: any
    catalogId: string
    updateActiveKey?: (key: TabKey) => void
}) {
    const graphCase = useRef<Graph>()
    const container = useRef<HTMLDivElement>(null)

    const [graphSize, setGraphSize] = useState(100)
    const debouncedGraphSize = useDebounce(graphSize, { wait: 200 })
    const [reportDetailVisible, setReportDetailVisible] = useState(false)
    useMemo(() => {
        // 注册边
        Graph.registerEdge(EdgeType, EdgeConf, true)
        // 注册节点
        CatalogNode()
        TaskNode()
        TagNode()
    }, [])

    useEffect(() => {
        // 创建画布
        const graph = instancingGraph(container.current, {
            ...GraphConfig,
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

            graph.on('scale', ({ sx, sy }) => {
                const showSize = sx * 100
                setGraphSize(Math.floor(showSize))
            })

            // 渲染数据
            if (data) {
                renderGraph(graph, data)
            }
        }

        return () => {
            graph?.dispose()
            graphCase.current = undefined
        }
    }, [])

    // 当数据变化时重新渲染
    useEffect(() => {
        if (graphCase.current && data) {
            renderGraph(graphCase.current, data)
            // 数据渲染完成后，重置缩放为100%并居中
            setTimeout(() => {
                if (graphCase.current) {
                    graphCase.current.zoomTo(1) // 重置为100%缩放
                    graphCase.current.centerContent() // 居中显示
                    setGraphSize(100) // 更新缩放状态
                }
            }, 200) // 延迟执行，确保渲染完成
        }
    }, [data])

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
            graphCase.current.zoomToFit({ padding: 16 })
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
        graphCase.current?.centerContent()
    }

    const handleReportDetailClick = useCallback(() => {
        setReportDetailVisible(true)
    }, [])

    const contextValue = useMemo(
        () => ({
            onShowQualityReport: handleReportDetailClick,
            updateActiveKey,
        }),
        [handleReportDetailClick, updateActiveKey],
    )
    return (
        <NodeContext.Provider value={contextValue}>
            <div className={styles['monitor-canvas']}>
                <X6PortalProvider />
                <div
                    ref={container}
                    id="container"
                    style={{
                        width: '100%',
                        height: '100%',
                        overflow: 'hidden',
                    }}
                />
                <div className={styles['monitor-canvas-controller']}>
                    <FloatBar
                        onChangeGraphSize={changeGraphSize}
                        onShowAllGraphSize={showAllGraphSize}
                        graphSize={debouncedGraphSize}
                        onMovedToCenter={movedToCenter}
                    />
                </div>

                {reportDetailVisible && viewItem && (
                    <DataViewProvider>
                        <QualityReportDetail
                            item={viewItem}
                            visible={reportDetailVisible}
                            onClose={() => setReportDetailVisible(false)}
                            showCorrection={false}
                        />
                    </DataViewProvider>
                )}
            </div>
        </NodeContext.Provider>
    )
}

export default memo(TaskProcessing)
