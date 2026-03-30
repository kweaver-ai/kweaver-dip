import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Graph } from '@antv/x6'
import { useDebounce, useUnmount } from 'ahooks'
import styles from './styles.module.less'
import {
    EdgeConf,
    EdgeType,
    GraphConf,
    INode,
    calcDataTypes,
    graphRenderByData,
} from './helper'
import { AssetNode } from './AssetNode'
import { instancingGraph } from '@/core/graph/graph-config'
import FloatBar from '@/components/DataConsanguinity/FloatBar'
import Labels, { LabelType } from '../Labels'
import { X6PortalProvider } from '@/core/graph/helper'

function AssetGraph({
    data,
    listTypes,
    isSnapshot,
}: {
    data: INode
    listTypes?: LabelType[]
    isSnapshot?: boolean
}) {
    const graphCase = useRef<Graph>()
    const container = useRef<HTMLDivElement>(null)
    const [graphSize, setGraphSize] = useState(100)
    const debouncedGraphSize = useDebounce(graphSize, { wait: 400 })
    useMemo(() => {
        // 注册边
        Graph.registerEdge(EdgeType, EdgeConf, true)
        // 注册节点
        AssetNode()
    }, [])

    useEffect(() => {
        const graph = instancingGraph(container.current, {
            ...GraphConf,
            mousewheel: {
                enabled: !isSnapshot,
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
        }
    }, [])

    useEffect(() => {
        if (graphCase?.current && data) {
            graphRenderByData(graphCase.current, data as any, isSnapshot)
            // fitGraphView()
            onCenterCircle()
        }
    }, [data])

    useUnmount(() => {
        graphCase.current = undefined
    })

    // 调整画布位置
    const fitGraphView = () => {
        graphCase.current?.centerContent({ padding: 24 })
    }

    const onCenterCircle = () => {
        if (data?.id) {
            const circle = graphCase.current?.getCellById(data?.id)
            if (circle) {
                graphCase.current?.positionCell(circle, 'top')
                graphCase.current?.translateBy(0, 80)
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

    return (
        <div className={styles['asset-wrapper']}>
            <X6PortalProvider />
            <div
                ref={container}
                id="container"
                className={styles['asset-wrapper-graph']}
            />
            <div
                className={styles['asset-wrapper-controller']}
                hidden={isSnapshot}
            >
                <FloatBar
                    onChangeGraphSize={changeGraphSize}
                    onShowAllGraphSize={showAllGraphSize}
                    graphSize={debouncedGraphSize}
                    onMovedToCenter={movedToCenter}
                />
            </div>

            <div className={styles['asset-wrapper-label']}>
                <Labels types={listTypes} />
            </div>
        </div>
    )
}

export default memo(AssetGraph)
