import React, {
    forwardRef,
    memo,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'
import { Graph, Shape } from '@antv/x6'
import { useGetState, useUpdateEffect } from 'ahooks'
import CompoundedSpace from 'antd/lib/space'
import { message } from 'antd'
import {
    instancingGraph,
    mindmapConnector,
    mindmapEdge,
} from '@/core/graph/graph-config'
import { loadPlugins, Plugins } from '@/core/graph/plugin'
import BusinessActivityNode from './nodes/BusinessActivityNode'
import {
    IGradeLabel,
    formatError,
    getBusinessObjDefine,
    getDataGradeLabel,
} from '@/core'
import { BusinessDomainType, NodeType } from './const'
import { findNodeById, graphNodeCollapse, graphRenderByData } from './helper'
import MindMapData from './MindMapData'
import LogicEntityNode from './nodes/LogicEntityNode'
import AttributeNode from './nodes/AttributeNode'
import ReferenceNode from './nodes/ReferenceNode'
import FloatBar from '../DataConsanguinity/FloatBar'
import { useQuery } from '@/utils'
import TypeShow from './TypeShow'
import __ from './locale'
import { X6PortalProvider } from '@/core/graph/helper'
import { useGradeLabelState } from '@/hooks/useGradeLabelState'

interface IBusinessActivityGraph {
    currentData?: any
    toolBarPosition?: 'bottomLeft' | 'topCenter'
    mode?: 'view' | 'edit'
    ref?: any
}
const BusinessActivityGraph: React.FC<IBusinessActivityGraph> = forwardRef(
    (props: any, ref) => {
        const {
            currentData,
            toolBarPosition = 'bottomLeft',
            mode = 'edit',
        } = props

        const query = useQuery()
        const graphCase = useRef<Graph>()
        const container = useRef<HTMLDivElement>(null)
        const [graphSize, setGraphSize] = useState(100)
        const [viewMode, setViewMode] = useState('view')
        const [totalData, setTotalData, getTotalData] =
            useGetState<MindMapData>()
        const [isExistHighLight, setIsExistHightLight] = useState(false)
        const [isUpdate, setIsUpdate] = useState(false)
        const [isCanSaveInfo, setIsCanSaveInfo] = useState({})
        const [currentId, setCurrentId] = useState('')
        const [isStart] = useGradeLabelState()
        const [tags, setTags] = useState<IGradeLabel[]>([])

        const objId = query.get('objId')
        const objName = query.get('name')
        const objType = query.get('type')

        const getClassificationTag = async () => {
            try {
                const res = await getDataGradeLabel({ keyword: '' })
                setTags(res.entries)
            } catch (error) {
                formatError(error)
            }
        }

        useEffect(() => {
            getClassificationTag()
        }, [isStart])

        useImperativeHandle(ref, () => ({
            totalData,
            isUpdate,
            isCanSaveInfo,
        }))

        const cbNodeParams = useMemo(
            () => [
                () => graphCase, // 获取画布实例
                () => viewMode,
                () => totalData,
                () => mode,
            ],
            [graphCase, viewMode, totalData, mode],
        )

        useEffect(() => {
            ReferenceNode(cbNodeParams)
        }, [cbNodeParams])

        useEffect(() => {
            BusinessActivityNode([...cbNodeParams, () => setIsExistHightLight])
        }, [cbNodeParams, setIsExistHightLight])

        useEffect(() => {
            const cbParams = [
                ...cbNodeParams,
                () => setIsCanSaveInfo,
                () => isCanSaveInfo,
            ]
            LogicEntityNode(cbParams)
            AttributeNode([...cbParams, () => tags])
        }, [cbNodeParams, setIsCanSaveInfo, isCanSaveInfo, tags])

        // // 获取画布实例
        // const getGraphInstance = () => graphCase

        // ReferenceNode([
        //     getGraphInstance,
        //     () => viewMode,
        //     () => totalData,
        //     () => mode,
        // ])
        // BusinessActivityNode([
        //     getGraphInstance,
        //     () => viewMode,
        //     () => totalData,
        //     () => mode,
        //     () => setIsExistHightLight,
        // ])
        // LogicEntityNode([
        //     getGraphInstance,
        //     () => viewMode,
        //     () => totalData,
        //     () => mode,
        //     () => setIsCanSaveInfo,
        // ])
        // AttributeNode([
        //     getGraphInstance,
        //     () => viewMode,
        //     () => totalData,
        //     () => mode,
        //     () => setIsCanSaveInfo,
        // ])

        // 注册连接器、边、节点
        Graph.registerConnector('mindmap', mindmapConnector, true)
        Graph.registerEdge('mindmap-edge', mindmapEdge, true)

        const initData = async () => {
            try {
                const res = await getBusinessObjDefine(
                    mode === 'edit' ? objId : currentData?.id,
                )

                const data = new MindMapData({
                    // id: mode === 'edit' ? objId : currentData?.id,
                    nodeType: NodeType.Activity,
                    dataInfo: {
                        id: mode === 'edit' ? objId : currentData?.id,
                        name: mode === 'edit' ? objName : currentData?.name,
                        object_type:
                            mode === 'edit' ? objType : currentData?.type,
                    },
                    children: [
                        ...(res.ref_info.map(
                            (r) =>
                                new MindMapData({
                                    // id: r.id,
                                    nodeType: NodeType.ReferenceNode,
                                    dataInfo: {
                                        ...r,
                                    },
                                    children: [],
                                    width: 220,
                                    height: 86,
                                    parentId:
                                        mode === 'edit'
                                            ? objId
                                            : currentData?.id,
                                }),
                        ) || []),
                        ...(res.logic_entities.map(
                            (entity) =>
                                new MindMapData({
                                    // id: entity.id,
                                    nodeType: NodeType.LogicEntity,
                                    dataInfo: {
                                        ...entity,
                                    },
                                    children: [
                                        ...(entity.attributes.map(
                                            (attr) =>
                                                new MindMapData({
                                                    id: attr.id,
                                                    nodeType:
                                                        NodeType.Attribute,
                                                    dataInfo: {
                                                        ...attr,
                                                        tipOpen: false,
                                                    },
                                                    children: [],
                                                    width: 220,
                                                    height: 60,
                                                    parentId: entity.id,
                                                }),
                                        ) || []),
                                    ],
                                    width: 220,
                                    height: 60,
                                    parentId:
                                        mode === 'edit'
                                            ? objId
                                            : currentData?.id,
                                    collapsed: true,
                                }),
                        ) || []),
                    ],
                    width: 220,
                    height: 60,
                })
                setTotalData(data)
                setIsUpdate(res.logic_entities.length > 0)
                if (graphCase && graphCase.current) {
                    graphRenderByData(graphCase.current, data, true)
                    graphCase.current.centerContent()
                }
            } catch (error) {
                if (
                    error.data.code ===
                    'BusinessGrooming.Glossary.ObjectNotExist'
                ) {
                    message.error(
                        __('${name}被删除，请刷新后重试', {
                            name: mode === 'edit' ? objName : currentData?.name,
                        }),
                    )
                    return
                }
                formatError(error)
            }
        }

        useEffect(() => {
            // 创建画布
            const graph = instancingGraph(container.current, {
                background: {
                    color: '#F6F9FB',
                },
                panning: true,
                interacting: false,
                embedding: false,

                connecting: {
                    connectionPoint: 'anchor',
                },
                mousewheel: {
                    enabled: true,
                    modifiers: ['ctrl', 'meta'],
                    guard(this: any, e: WheelEvent) {
                        return false
                    },
                },
                // virtual: true,
            })
            if (graph) {
                graphCase.current = graph
                // loadPlugins(graph, [Plugins.Scroller, Plugins.Keyboard])
                initData()
                setCurrentId(currentData?.id)
            }
        }, [])

        useUpdateEffect(() => {
            if (graphCase && graphCase.current) {
                if (currentData.id === currentId) {
                    const currentNode = graphCase.current
                        .getNodes()
                        .find((n) => n.data?.dataInfo?.id === currentData.id)
                    currentNode?.replaceData({
                        ...currentNode.data,
                        dataInfo: {
                            ...currentNode.data.dataInfo,
                            name: currentData.name,
                            object_type: currentData.type,
                        },
                    })
                    // 展开收起后数据要保持变更后的
                    if (totalData) {
                        const data = findNodeById(totalData, currentData.id)
                        if (data) {
                            data.dataInfo = { ...data.dataInfo, ...currentData }
                        }
                    }
                } else {
                    graphCase.current.clearCells()
                    initData()
                }
                setCurrentId(currentData.id)
            }
        }, [currentData])

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

        // 一键收起
        const handlePuckUp = () => {
            if (graphCase.current && totalData) {
                const res: any = totalData.children?.map((child) => {
                    if (
                        [NodeType.ReferenceNode, NodeType.LogicEntity].includes(
                            child.nodeType,
                        )
                    ) {
                        child.setCollapse(true)
                    }
                    return child
                })
                totalData.children = res
                graphRenderByData(graphCase.current, totalData)
            }
        }

        const clearHighLight = () => {
            if (!totalData || !totalData?.children || !isExistHighLight) {
                return
            }

            const res: any =
                totalData.children.map((child) => {
                    if (
                        child.nodeType === NodeType.ReferenceNode &&
                        child.dataInfo &&
                        child.dataInfo?.isHighLight
                    ) {
                        return {
                            ...child,
                            dataInfo: {
                                ...child.dataInfo,
                                isHighLight: false,
                            },
                        }
                    }
                    return child
                }) || []
            totalData.children = res
            if (graphCase.current) {
                graphRenderByData(graphCase.current, totalData)
            }
            setIsExistHightLight(false)
        }

        return (
            <div
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
                        display: 'flex',
                        width: '100%',
                        height: '100%',
                    }}
                    onClick={() => clearHighLight()}
                />
                <div
                    style={
                        toolBarPosition === 'bottomLeft'
                            ? {
                                  position: 'absolute',
                                  right: 24,
                                  bottom: 24,
                              }
                            : { position: 'fixed', top: 6, left: '50%' }
                    }
                >
                    <FloatBar
                        onChangeGraphSize={changeGraphSize}
                        onShowAllGraphSize={showAllGraphSize}
                        graphSize={graphSize}
                        onMovedToCenter={movedToCenter}
                        onPackUp={handlePuckUp}
                    />
                </div>
                <div
                    style={{
                        position: 'absolute',
                        left: 30,
                        bottom: 24,
                    }}
                >
                    <TypeShow />
                </div>
            </div>
        )
    },
)

export default memo(BusinessActivityGraph)
