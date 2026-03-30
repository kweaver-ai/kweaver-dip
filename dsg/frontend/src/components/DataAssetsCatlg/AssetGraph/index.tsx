import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Graph } from '@antv/x6'
import {
    useDebounce,
    useGetState,
    useSize,
    useUnmount,
    useUpdateEffect,
} from 'ahooks'
import styles from './styles.module.less'
import {
    EdgeConf,
    EdgeType,
    GraphConf,
    INode,
    graphRenderByData,
} from './helper'
import { CommonNode } from './CommonNode'
import { AssetNode } from './AssetNode'
import { instancingGraph } from '@/core/graph/graph-config'
import FloatBar from '@/components/DataConsanguinity/FloatBar'
import { X6PortalProvider } from '@/core/graph/helper'
import { SubjectNode } from './SubjectNode'
import BasicInfo from './BasicInfo'
import { IDataCatlgBasicInfo } from '@/core'
import { NodeTypes } from './const'
import { CatlgNode } from './CatlgNode'

function AssetGraph({ data }: { data: INode }) {
    const graphCase = useRef<Graph>()
    const container = useRef<HTMLDivElement>(null)
    const [graphSize, setGraphSize] = useState(100)
    const debouncedGraphSize = useDebounce(graphSize, { wait: 400 })
    const size = useSize(container)
    const [isExpandBasicInfo, setIsExpandBasicInfo] = useState(true)

    useMemo(() => {
        // 注册边
        Graph.registerEdge(EdgeType, EdgeConf, true)
        // 注册节点
        CommonNode()
        AssetNode()
        SubjectNode()
        CatlgNode()
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
        }
    }, [])

    useEffect(() => {
        if (graphCase?.current && data && size?.width) {
            graphRenderByData(graphCase.current, data as any)
            // onCenterCircle()
            graphCase.current?.centerContent()
        }
    }, [data, size])

    // useEffect(() => {
    //     if (size?.width) {
    //         graphCase.current?.centerContent()
    //     }
    // }, [size])

    useUnmount(() => {
        graphCase.current = undefined
    })

    // 调整画布位置
    const fitGraphView = () => {
        graphCase.current?.centerContent({ padding: 24 })
    }

    const onCenterCircle = () => {
        graphCase.current?.centerContent()
        if (data?.id && isExpandBasicInfo) {
            const circle = graphCase.current?.getCellById(data?.id)
            if (circle) {
                graphCase.current?.positionCell(circle, 'top')
                graphCase.current?.translateBy(380, 80)
            }
        }
    }

    const centerContentByIsExpand = () => {
        if (data?.id) {
            const circle = graphCase.current?.getCellById(data?.id)
            if (circle) {
                if (isExpandBasicInfo) {
                    graphCase.current?.positionCell(circle, 'top')
                    graphCase.current?.translateBy(-140, 80)
                } else {
                    graphCase.current?.positionCell(circle, 'top')
                    graphCase.current?.translateBy(140, 80)
                }
            }
        }
    }
    useUpdateEffect(() => {
        centerContentByIsExpand()
    }, [isExpandBasicInfo])
    /**
     * 缩放画布
     * @param multiple  缩放大小
     */
    const changeGraphSize = (multiple: number) => {
        setGraphSize(multiple * 100)
        graphCase.current?.zoomTo(multiple)
        centerContentByIsExpand()
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
        graphCase.current?.centerContent()
        // onCenterCircle()
        // centerContentByIsExpand()
    }

    return (
        <div className={styles['asset-wrapper']}>
            <X6PortalProvider />
            <div
                ref={container}
                id="container"
                className={styles['asset-wrapper-graph']}
            />
            <div className={styles['asset-wrapper-controller']}>
                <FloatBar
                    onChangeGraphSize={changeGraphSize}
                    onShowAllGraphSize={showAllGraphSize}
                    graphSize={graphSize}
                    onMovedToCenter={movedToCenter}
                />
            </div>
        </div>
    )
}

export default memo(AssetGraph)
