import { useEffect, useMemo, useRef, useState } from 'react'
import { Graph } from '@antv/x6'
import {
    useDebounce,
    useGetState,
    useUnmount,
    useUpdate,
    useUpdateEffect,
} from 'ahooks'
import { AnyNaptrRecord } from 'dns'
import { instancingGraph, mindmapConnector } from '@/core/graph/graph-config'
import { X6PortalProvider } from '@/core/graph/helper'

import styles from './styles.module.less'
import __ from './locale'
import { BusinNode } from './nodes/BusinNode'
import FloatBar from '@/components/DataConsanguinity/FloatBar'
import {
    BusinessView,
    BusinNodeType,
    businViewNodeId,
    createNodeByDataInfo,
    EdgeConf,
    EdgeType,
    GraphConf,
    graphRenderByData,
    INode,
    NodeType,
    NodeTypeText,
} from './nodes/helper'
import {
    formatError,
    queryInfoResCatlgList,
    queryInfoResCatlgListFrontend,
} from '@/core'
import MindMapData from './nodes/MindMapData'
import BusinSearch from './BusinSearch'
import { ViewNode } from './nodes/ViewNode'
import DataCatlgContent from '../../DataCatlgContent'
import CatalogCard from '../../CatalogCard'
import { BusinViewProvider, useBusinViewContext } from './BusinViewProvider'
import {
    buildCompleteDepartmentTree,
    buildTreeWithBusinessDomain,
} from './helper'
import InfoCatlgCard from '../../InfoResourcesCatlg/InfoCatlgCard'
import InfoCatlgDetails from '../../InfoResourcesCatlg/InfoCatlgDetails'
import { defaultListSize } from '../../InfoResourcesCatlg'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

const BusinViewCont = () => {
    const { checkPermission } = useUserPermCtx()
    const {
        currentNodeData,
        setCurrentNodeData,
        // , businView, setBusinView
    } = useBusinViewContext()
    const [businView, setBusinView] = useState<BusinessView>(
        BusinessView.Organization,
    )

    const [loading, setLoading] = useState<boolean>(false)

    const graphCase = useRef<Graph>()
    const container = useRef<HTMLDivElement>(null)
    const [data, setData] = useState<INode>()
    const [graphSize, setGraphSize] = useState(100)
    const debouncedGraphSize = useDebounce(graphSize, { wait: 200 })
    // 所有的信息资源目录
    const [infoCatlgList, setInfoCatlgList] = useState<any[]>([])
    const [groups, setGroups] = useState<any[]>([])
    // 组织架构视角数据
    const [orgList, setOrgList] = useState<any[]>()
    // 业务领域视角数据
    const [businDomainList, setBusinDoaminList] = useState<any[]>()
    // 画布数据对象
    const [totalData, setTotalData, getTotalData] = useGetState<MindMapData>()

    // const [currentNodeData, setCurrentNodeData] = useState<INode>()
    const [detailSelNode, setDetailSelNode] = useState<any>({})
    const [searchSelectedNodeId, setSearchSelectedNodeId] = useState<string>('')
    const [isFirstPaint, setIsFirstPaint] = useState<boolean>(true)

    // 数据资源目录侧边卡片的显示/隐藏
    const [dataCatlgCardOpen, setDataCatlgCardOpen] = useState<boolean>(false)
    // 数据资源目录详情页抽屉的显示/隐藏
    const [dataCatlgDetailOpen, setDataCatlgDetailOpen] = useState(false)
    // 信息资源目录侧边卡片的显示/隐藏
    const [infoCatlgCardOpen, setInfoCatlgCardOpen] = useState<boolean>(false)
    // 数据资源目录详情页抽屉的显示/隐藏
    const [infoCatlgDetailOpen, setInfoCatlgDetailOpen] = useState(false)

    // 获取画布实例
    const getGraphInstance = () => graphCase

    const hasDataOperRole = useMemo(() => {
        return checkPermission('manageResourceCatalog') ?? false
    }, [checkPermission])

    const reqAction = useMemo(() => {
        return hasDataOperRole
            ? queryInfoResCatlgList
            : queryInfoResCatlgListFrontend
    }, [hasDataOperRole])
    // 获取所有信息资源目录
    const loadAllInfoCatlgList = async (params?: any) => {
        try {
            let reqParams: any = params
            let allInfoCatlgData: any[] = []
            let res: any

            do {
                // eslint-disable-next-line no-await-in-loop
                res = await reqAction({
                    ...reqParams,
                    // 这里假设接口用 keyword，实际可按需调整
                    keyword: '',
                })

                if (res?.entries && res.entries.length > 0) {
                    // TODO-530版本-主干业务中部门字段为可选值,之后会改成必填
                    // 所以先暂时过滤掉没有部门的主干业务及后续关联的信息目录,后续改为必填后可删除下面的filter
                    allInfoCatlgData = allInfoCatlgData.concat(
                        res.entries?.filter(
                            (item) => item?.main_business_departments?.[0].name,
                        ),
                    )
                    // 假设接口通过 next_flag 控制分页，实际按接口调整
                    reqParams = { ...reqParams, next_flag: res.next_flag }
                }
            } while ((res?.entries?.length || 0) > defaultListSize)
            setInfoCatlgList(allInfoCatlgData)
            return allInfoCatlgData
        } catch (e) {
            formatError(e)
            return []
        }
    }

    const onLoad = async () => {
        try {
            setLoading(true)

            let infoCatlgListRes: any = infoCatlgList || []
            if (!infoCatlgList?.length) {
                infoCatlgListRes = await loadAllInfoCatlgList({})
            }
            let treeData: any[]
            if (businView === BusinessView.Organization) {
                treeData = buildCompleteDepartmentTree(infoCatlgListRes) || []
            } else {
                treeData = buildTreeWithBusinessDomain(infoCatlgListRes) || []
            }
            setGroups(treeData)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (groups?.length) {
            setGroups([])
        }
        onLoad()
    }, [businView])

    // 注册连接器、边、节点
    Graph.registerConnector('mindmap', mindmapConnector, true)
    Graph.registerEdge(EdgeType, EdgeConf, true)
    // Graph.registerEdge('mindmap-edge', mindmapEdge, true)

    // 注册节点
    BusinNode([
        getGraphInstance,
        () => totalData,
        () => businView,
        () => {
            setBusinView(
                businView === BusinessView.BusinDomain
                    ? BusinessView.Organization
                    : BusinessView.BusinDomain,
            )
        },
        (nodeData: any) => {
            const { type } = nodeData || {}
            if (type === BusinNodeType.DataCatlg) {
                setDetailSelNode(nodeData || {})
                setInfoCatlgCardOpen(false)
                setDataCatlgCardOpen(true)
            } else if (type === BusinNodeType.InfoResourcesCatlg) {
                setDetailSelNode(nodeData || {})
                setDataCatlgCardOpen(false)
                setInfoCatlgCardOpen(true)
            }
            //  else {
            //     setDataCatlgCardOpen(false)
            //     setInfoCatlgCardOpen(false)
            // }
        },
        () => detailSelNode,
    ])
    ViewNode([
        getGraphInstance,
        () => totalData,
        () => businView,
        () => {
            setBusinView(
                businView === BusinessView.BusinDomain
                    ? BusinessView.Organization
                    : BusinessView.BusinDomain,
            )
        },
    ])

    const initGraph = () => {
        // 根节点
        const mapData = new MindMapData({
            // nodeType: businView,
            id: businViewNodeId[businView],
            type: businView,
            nodeType: NodeType.ViewNode,
            dataInfo: {
                id: businViewNodeId[businView],
                name: NodeTypeText[businView],
                type: businView,
                // note: 'aaa_note',
            },
            // children:
            //     businView === BusinessView.Organization
            //         ? orgList
            //         : businDomainList,
            children: createNodeByDataInfo(groups, businViewNodeId[businView]),
            // children: createNodeByDataInfo(
            //     businView === BusinessView.Organization
            //         ? orgList
            //         : businDomainList,
            //     businViewNodeId[businView],
            // ),
        })

        setTotalData(mapData)

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
            // graph.on('node:change:data', ({ node, previous, current }) => {
            //     // 监听属性改变 重绘布局
            //     if (['expand'].some((key) => previous[key] !== current[key])) {
            //         setData((prev) => toggleNode(prev, node.data))
            //     }
            // })
            graph.on('scale', ({ sx, sy }) => {
                const showSize = sx * 100
                setGraphSize(Math.floor(showSize))
            })

            graph.on('blank:click', () => {
                setCurrentNodeData(undefined)
            })

            graph.on('node:click', ({ node }) => {
                setCurrentNodeData(node.data?.dataInfo || node.data)
            })

            graph.on('node:mousedown', ({ node }) => {
                // if (
                //     ([NodeType.TextAreaNode].includes(node.shape as NodeType) &&
                //         !!node?.data?.dataInfo?.content) ||
                //     ([
                //         NodeType.MulSelectInputNode,
                //         NodeType.SelectInputNode,
                //     ].includes(node.shape as NodeType) &&
                //         !!node?.data?.dataInfo?.content?.comprehension)
                // ) {
                //     graph.togglePanning(false)
                // }
            })

            graph.on('node:mouseup', () => {
                graph.togglePanning(true)
            })
            graphRenderByData(graph, mapData)
            graph.centerContent()
        }
    }

    useUpdateEffect(() => {
        // graphCase.current?.removeCells?.(graphCase.current?.getCells?.())
        initGraph()
    }, [groups])

    useUnmount(() => {
        graphCase.current = undefined
    })

    const moveCenterByCellId = (id: string) => {
        const cells = graphCase.current?.getCells() || []
        const cell = cells.find((item) => item.data?.dataInfo?.id === id)
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

    return (
        // <BusinViewProvider>
        <div className={styles.businViewWrapper}>
            <div className={styles.graphWrapper}>
                <div className={styles.searchWrapper}>
                    <BusinSearch
                        businView={businView}
                        onSelect={(newNode) => {
                            const { type } = newNode || {}
                            setCurrentNodeData(newNode)
                            if (type === BusinNodeType.DataCatlg) {
                                setDetailSelNode(newNode || {})
                                setDataCatlgCardOpen(true)
                                setInfoCatlgCardOpen(false)
                            } else if (
                                type === BusinNodeType.InfoResourcesCatlg
                            ) {
                                setDetailSelNode(newNode || {})

                                setDataCatlgCardOpen(false)
                                setInfoCatlgCardOpen(true)
                            }
                            // else {
                            //     if (dataCatlgCardOpen) {
                            //         setDataCatlgCardOpen(false)
                            //     }

                            //     if (infoCatlgCardOpen) {
                            //         setInfoCatlgCardOpen(false)
                            //     }
                            // }
                            moveCenterByCellId(newNode?.id)
                        }}
                    />
                </div>
                <X6PortalProvider />
                <div
                    ref={container}
                    id="container"
                    className={styles.graphContainer}
                    onClick={() => {
                        setSearchSelectedNodeId('')
                    }}
                />
                <div className={styles.floatController}>
                    <FloatBar
                        onChangeGraphSize={changeGraphSize}
                        onShowAllGraphSize={showAllGraphSize}
                        graphSize={debouncedGraphSize}
                        onMovedToCenter={movedToCenter}
                    />
                </div>
            </div>
            <div
                className={styles.cardWrapper}
                hidden={!dataCatlgCardOpen && !infoCatlgCardOpen}
            >
                {dataCatlgCardOpen && (
                    <CatalogCard
                        open={dataCatlgCardOpen}
                        style={{
                            position: 'relative',
                            right: '0px',
                            height: '100%',
                            zIndex: '999',
                            width: '100%',
                        }}
                        onClose={() => {
                            setDataCatlgCardOpen(false)
                        }}
                        toOpenDetails={() => {
                            setDataCatlgDetailOpen(true)
                        }}
                        catalogId={detailSelNode.id}
                        info={{
                            ...detailSelNode,
                            raw_name: detailSelNode.name || '--',
                        }}
                    />
                )}

                {infoCatlgCardOpen && (
                    <InfoCatlgCard
                        catalogId={detailSelNode?.id}
                        info={{
                            ...detailSelNode,
                            raw_name: detailSelNode.name || '--',
                        }}
                        open={infoCatlgCardOpen}
                        style={{
                            position: 'relative',
                            right: '0px',
                            height: '100%',
                            zIndex: '999',
                            width: '100%',
                        }}
                        onClose={() => {
                            setInfoCatlgCardOpen(false)
                        }}
                        toOpenDetails={() => {
                            setInfoCatlgDetailOpen(true)
                        }}
                    />
                )}
            </div>

            {/* 数据资源目录详情页-全屏展示 */}
            {dataCatlgDetailOpen && (
                <DataCatlgContent
                    open={dataCatlgDetailOpen}
                    onClose={(dataCatlgCommonInfo) => {
                        setDataCatlgDetailOpen(false)
                    }}
                    assetsId={detailSelNode.id}
                    canChat
                    hasAsst
                />
            )}

            {/* 信息资源目录详情页-全屏展示 */}
            {infoCatlgDetailOpen && (
                <InfoCatlgDetails
                    open={infoCatlgDetailOpen}
                    onClose={() => {
                        setInfoCatlgDetailOpen(false)
                    }}
                    catalogId={detailSelNode?.id || ''}
                    name={detailSelNode?.name || ''}
                />
            )}
        </div>
        // </BusinViewProvider>
    )
}

const BusinView = () => {
    return (
        <BusinViewProvider>
            <BusinViewCont />
        </BusinViewProvider>
    )
}

export default BusinView
