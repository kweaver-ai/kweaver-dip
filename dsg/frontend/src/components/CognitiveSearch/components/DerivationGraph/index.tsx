import { Graph } from '@antv/x6'
import { useUnmount } from 'ahooks'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { instancingGraph } from '@/core/graph/graph-config'
import { DimensionNode } from './DimensionNode'
import {
    EdgeConf,
    EdgeType,
    GraphConf,
    graphRenderByData,
    layoutRedraw,
} from './helper'
import styles from './styles.module.less'
import { X6PortalProvider } from '@/core/graph/helper'

function DerivationGraph({ data }: any) {
    const graphCase = useRef<Graph>()
    const container = useRef<HTMLDivElement>(null)
    useMemo(() => {
        // 注册边
        Graph.registerEdge(EdgeType, EdgeConf, true)
        // 注册节点
        DimensionNode()
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
                            return false
                        }
                        if (showSize >= 400 && wheelEvent.wheelDelta > 0) {
                            graph.zoomTo(4)
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
                // 监听这三个属性改变 重绘布局
                if (
                    ['isExpand'].some((key) => previous[key] !== current[key])
                ) {
                    layoutRedraw(graph, node)
                    fitGraphView()
                }
            })
        }
    }, [])

    // /**
    //  * 数据初始化
    //  */
    // const init = async () => {
    //     try {
    //         setData(GraphData)
    //     } catch (e) {
    //         formatError(e)
    //         // setPageStatus(false)
    //     } finally {
    //         // setLoading(false)
    //     }
    // }

    useEffect(() => {
        if (graphCase?.current && data) {
            graphRenderByData(graphCase.current, data as any)
            fitGraphView()
        }
    }, [data])

    useUnmount(() => {
        graphCase.current = undefined
    })

    // 调整画布位置
    const fitGraphView = () => {
        graphCase.current?.centerContent({ padding: 24 })
    }

    return (
        <>
            <X6PortalProvider />
            <div
                ref={container}
                id="container"
                className={styles['derivation-graph']}
            />
        </>
    )
}

export default memo(DerivationGraph)
