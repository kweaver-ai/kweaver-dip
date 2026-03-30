import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Graph } from '@antv/x6'
import { useGetState, useSize } from 'ahooks'
import { LoadingOutlined } from '@ant-design/icons'
import { Selection } from '@antv/x6-plugin-selection'
import { message } from 'antd'
import {
    instancingGraph,
    mindmapConnector,
    mindmapEdge,
} from '@/core/graph/graph-config'
import { Plugins, loadPlugins } from '@/core/graph/plugin'
import {
    formatError,
    getInfoItems,
    getRescCatlgList,
    IdimensionModel,
    IFormEnumConfigModel,
    messageError,
    messageInfo,
    updateDataComprehension,
} from '@/core'
import { NodeType, SaveType, ViewMode } from './const'
import FirstLeNode from './nodes/FirstLeNode'
import PopGraphFieldsView from './PopGraphFieldsView'
import FixedGraphFieldsView from './FixedGraphFieldsView'
import SecondLeNode from './nodes/SecondLeNode'
import {
    graphRenderByData,
    createNodeByDataInfo,
    findNodeByType,
    flatTreeData,
    getEmptyObjectByType,
    graphRecommendNode,
    graphStopRecommendNode,
    findNodeById,
    graphAddNode,
    filterDimension,
    checkDimensionRecommend,
} from './helper'
import ThirdLeNode from './nodes/ThirdLeNode'
import TimeNode from './nodes/TimeNode'
import SelectInputNode from './nodes/SelectInputNode'
import MulSelectInputNode from './nodes/MulSelectInputNode'
import TextAreaNode from './nodes/TextAreaNode'
import MulSelectNode from './nodes/MulSelectNode'
import CommonIcon from '@/components/CommonIcon'
import { ReactComponent as aiUnderstandingColored } from '@/icons/svg/colored/aiUnderstandingColored.svg'
import __ from './locale'
import styles from './styles.module.less'
import { wheellDebounce } from '../FormGraph/helper'
import MindMapData from './MindMapData'
import { FieldUndsData } from './FieldUndsData'
import AiIntervalData from './AiIntervalData'
import { clearSource } from '@/utils'
import { X6PortalProvider } from '@/core/graph/helper'
import { useUndsGraphContext } from '@/context/UndsGraphProvider'

interface IDataUndsGraph {
    catalogId: string
    taskId: string
    details: IdimensionModel
    // viewMode: ViewMode
    saveType?: SaveType
    enumConfigs?: IFormEnumConfigModel
    onSetGraphCase: (graphCase: Graph) => void
    onGetGraphSize: (graphSize: number) => void
    onReturn: () => void
    onSave: (type: any) => void
}

/**
 * 理解画布
 * @param catalogId 目录ID
 * @param taskId 任务ID
 * @param details 理解详情
 * @param viewMode 当前的查看模式
 * @param saveType 当前的保存模式
 * @param enumConfigs 配置信息枚举
 * @param onSetGraphCase 画布实例
 * @param onGetGraphSize 调整画布大小
 * @param onReturn 返回
 * @param onSave 保存状态变更
 */
const DataUndsGraph: React.FC<IDataUndsGraph> = ({
    catalogId,
    taskId,
    details,
    // viewMode,
    saveType,
    enumConfigs,
    onSetGraphCase,
    onGetGraphSize,
    onReturn,
    onSave,
}) => {
    const { viewMode } = useUndsGraphContext()
    const graphCase = useRef<Graph>()
    const container = useRef<HTMLDivElement>(null)
    const content = useRef<HTMLDivElement>(null)
    const size = useSize(content)
    // 字段弹窗显示/隐藏
    const [popVisable, setPopVisable] = useState<boolean>(false)
    // 整体Ai中
    const [isAiIng, setIsAiIng] = useState<boolean>(false)
    // 画布数据对象
    const [totalData, setTotalData, getTotalData] = useGetState<MindMapData>()
    // ai加载计时器
    const [timer, setTimer] = useState<any>()
    // ai进行中的节点
    const [aiItem, setAiItem, getAiItem] = useGetState<MindMapData>()
    // 字段理解数据
    const [fieldsData, setFieldsData] = useState<FieldUndsData>(
        new FieldUndsData(),
    )
    const [aiIntervalData, setAiIntervalData] = useState<AiIntervalData>(
        new AiIntervalData(),
    )
    // 获取画布实例
    const getGraphInstance = () => graphCase

    // 注册连接器、边、节点
    Graph.registerConnector('mindmap', mindmapConnector, true)
    Graph.registerEdge('mindmap-edge', mindmapEdge, true)
    FirstLeNode()
    SecondLeNode([
        getGraphInstance,
        () => viewMode,
        () => totalData,
        () => aiIntervalData,
        () => onSave,
    ])
    ThirdLeNode([
        getGraphInstance,
        () => viewMode,
        () => totalData,
        () => aiIntervalData,
        () => onSave,
    ])
    TimeNode([
        getGraphInstance,
        () => viewMode,
        () => totalData,
        () => aiIntervalData,
        () => onSave,
    ])
    SelectInputNode([
        getGraphInstance,
        () => viewMode,
        () => totalData,
        () => aiIntervalData,
        () => onSave,
    ])
    MulSelectInputNode([
        getGraphInstance,
        () => viewMode,
        () => totalData,
        () => aiIntervalData,
        () => onSave,
    ])
    TextAreaNode([
        getGraphInstance,
        () => viewMode,
        () => totalData,
        () => aiIntervalData,
        () => onSave,
    ])
    MulSelectNode([
        getGraphInstance,
        () => viewMode,
        () => totalData,
        () => aiIntervalData,
        () => onSave,
    ])

    // 查看模式改变，刷新数据
    // useUpdateEffect(() => {
    //     const data = new MindMapData({
    //         nodeType: NodeType.FirstLeNode,
    //         dataInfo: {
    //             id: catalogId,
    //             name: details.catalog_info.name,
    //             note: details.note,
    //         },
    //         children: createNodeByDataInfo(
    //             viewMode,
    //             details.comprehension_dimensions,
    //             details.choices,
    //             2,
    //         ),
    //     })
    //     setTotalData(data)
    //     graphRenderByData(graphCase.current!, data, true)
    //     graphCase.current!.centerContent()
    //     getCatalogData(data)
    //     getCatalogColumnData(data)
    //     graphCase.current!.use(
    //         new Selection({
    //             enabled: true,
    //             multiple: false,
    //             rubberband: false,
    //         }),
    //     )
    //     // 清空请求数组
    //     clearSource()
    // }, [viewMode])

    useEffect(() => {
        setPopVisable(false)
        setIsAiIng(false)
        fieldsData.data = details?.column_comments || []
        fieldsData.dataType = enumConfigs?.data_type || []
    }, [])

    // 获取数据目录列表
    const getCatalogData = async (data?) => {
        try {
            const res = await getRescCatlgList({
                limit: 0,
                need_org_paths: true,
                // online_status: 'online',
                exclude_ids: [catalogId],
            })
            if (res?.entries) {
                const nodeData = findNodeByType(data || getTotalData()!, 5)
                nodeData.forEach((info) => {
                    const temp = info
                    temp.dataInfo!.choices = res.entries.map((e: any) => {
                        const { id, name, department_path } = e
                        return { id, title: name, path: department_path }
                    })
                })
                if (graphCase.current) {
                    graphRenderByData(
                        graphCase.current,
                        data || getTotalData()!,
                    )
                }
            }
        } catch (error) {
            formatError(error)
        }
    }

    // 获取数据目录信息项列表
    const getCatalogColumnData = async (data?) => {
        try {
            const res = await getInfoItems(catalogId, {
                limit: 0,
            })
            if (res?.columns) {
                const nodeData = findNodeByType(data || getTotalData()!, 4)
                nodeData.forEach((info) => {
                    const temp = info
                    temp.dataInfo!.choices = res.columns.map((e) => {
                        const { id, business_name, technical_name, data_type } =
                            e
                        return {
                            id,
                            column_name: technical_name,
                            name_cn: business_name,
                            data_format: data_type,
                        }
                    })
                })
                if (graphCase.current) {
                    graphRenderByData(graphCase.current, data || getTotalData())
                }
            }
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        const data = new MindMapData({
            nodeType: NodeType.FirstLeNode,
            dataInfo: {
                id: catalogId,
                name: details.catalog_info.name,
                note: details.note,
            },
            children: createNodeByDataInfo(
                viewMode,
                details.comprehension_dimensions,
                details.choices,
                2,
            ),
        })
        setTotalData(data)

        // 创建画布
        const graph = instancingGraph(container.current, {
            background: {
                color: '#F6F9FB',
            },
            interacting: false,
            connecting: {
                connectionPoint: 'anchor',
            },
            mousewheel: {
                enabled: true,
                modifiers: ['ctrl', 'meta'],
                guard(this: any, e: WheelEvent) {
                    const wheelEvent = this
                    if (graph) {
                        wheellDebounce(graph, wheelEvent, onGetGraphSize)
                        return true
                    }
                    return false
                },
            },
        })

        if (graph) {
            graphCase.current = graph
            onSetGraphCase(graph)
            if (viewMode === ViewMode.EDIT) {
                graph.use(
                    new Selection({
                        enabled: true,
                        multiple: false,
                        rubberband: false,
                    }),
                )
            }
            loadPlugins(graph, [Plugins.Scroller, Plugins.Keyboard])

            graph.on('node:click', ({ node }) => {
                // 根节点点击
                if (node.shape === NodeType.FirstLeNode) {
                    setPopVisable(true)
                }
            })

            graph.on('node:mousedown', ({ node }) => {
                if (
                    ([NodeType.TextAreaNode].includes(node.shape as NodeType) &&
                        !!node?.data?.dataInfo?.content) ||
                    ([
                        NodeType.MulSelectInputNode,
                        NodeType.SelectInputNode,
                    ].includes(node.shape as NodeType) &&
                        !!node?.data?.dataInfo?.content?.comprehension)
                ) {
                    graph.togglePanning(false)
                }
            })

            graph.on('node:mouseup', () => {
                graph.togglePanning(true)
            })

            // tab添加节点
            graph.bindKey('tab', () => {
                const cells = graph.getSelectedCells()
                if (
                    cells.length === 1 &&
                    ![
                        NodeType.FirstLeNode,
                        NodeType.SecondLeNode,
                        NodeType.ThirdLeNode,
                    ].includes(cells[0].getData().nodeType)
                ) {
                    const { parentId } = cells[cells.length - 1].getData()
                    graphAddNode(graph, getTotalData() || data, parentId)
                }
                return false
            })

            graphRenderByData(graph, data)
            graph.centerContent()
        }
        getCatalogData(data)
        getCatalogColumnData(data)
        // 清空请求数组
        clearSource()
    }, [])

    // 维度必填项校验
    const verifyDataRequired = (data: MindMapData[]) =>
        new Promise((resolve, reject) => {
            const failed: MindMapData[] = []
            data.filter(
                (info) =>
                    [NodeType.SecondLeNode, NodeType.ThirdLeNode].includes(
                        info.nodeType,
                    ) &&
                    info.children?.[0]?.nodeType !== NodeType.ThirdLeNode &&
                    info.dataInfo?.required,
            ).forEach((info) => {
                if (!info.children || info.children.length === 0) {
                    failed.push(info)
                } else {
                    let hasChild = false
                    for (let i = 0; i < info.children.length; i += 1) {
                        if (info.children[i].dataInfo?.content) {
                            hasChild = true
                            return
                        }
                    }
                    if (!hasChild) {
                        failed.push(info)
                    }
                }
            })
            if (failed.length > 0) {
                failed.forEach((info) => {
                    const temp = info
                    temp.collapsed = false
                    temp.dataInfo!.error = __('存在必填维度未填写，请检查')
                })
                messageError(__('存在必填维度未填写，请检查'))
                reject(new Error('error'))
            }
            resolve(true)
        })

    // 数据完整性校验
    const verifyDataIntegrity = (data: MindMapData[]) =>
        new Promise((resolve, reject) => {
            const failed: MindMapData[] = []
            data.filter(
                (info) =>
                    ![
                        NodeType.FirstLeNode,
                        NodeType.SecondLeNode,
                        NodeType.ThirdLeNode,
                    ].includes(info.nodeType) && info.dataInfo?.content,
            ).forEach((info) => {
                if (info.dataInfo!.content_type === 4) {
                    if (
                        !info.dataInfo!.content?.column_info ||
                        !info.dataInfo!.content?.comprehension
                    ) {
                        failed.push(info)
                    }
                }
                if (info.dataInfo!.content_type === 5) {
                    if (
                        !info.dataInfo!.content?.catalog_infos ||
                        !info.dataInfo!.content?.comprehension
                    ) {
                        failed.push(info)
                    }
                }
            })
            if (failed.length > 0) {
                failed.forEach((info) => {
                    const temp = info
                    const parent = findNodeById(totalData!, temp.parentId)
                    parent!.collapsed = false
                    temp.dataInfo!.content_errors =
                        __('理解内容不完整，请填写完整')
                })
                reject(new Error('error'))
            }
            resolve(true)
        })

    // 发布前的数据校验
    const publishWithVerifyData = async () => {
        if (!totalData) return
        const flatData = flatTreeData([totalData]).filter(
            (info) => info?.dataInfo,
        )
        try {
            await verifyDataRequired(flatData)
            await verifyDataIntegrity(flatData)
            publish()
        } catch (err) {
            graphRenderByData(graphCase.current!, totalData)
            onSave(undefined)
        }
    }

    // 保存组装接口数据
    const assemblyData = (data: MindMapData[]) => {
        return data
            .filter((info) => info.nodeType === NodeType.SecondLeNode)
            .map((info) => {
                if (info.children?.[0].nodeType === NodeType.ThirdLeNode) {
                    return {
                        id: info.dataInfo!.configId,
                        children: flatSubByConfigId(
                            data,
                            info.dataInfo!.configId,
                        ),
                    }
                }
                return {
                    id: info.dataInfo!.configId,
                    ...flatDataByConfigId(data, info.dataInfo!.configId),
                }
            })
    }
    const flatSubByConfigId = (data: MindMapData[], id: string) => {
        return data
            .filter((info) => info.dataInfo!.configParentId === id)
            .map((info) => ({
                id: info.dataInfo!.configId,
                ...flatDataByConfigId(data, info.dataInfo!.configId),
            }))
    }
    const flatDataByConfigId = (data: MindMapData[], id: string) => {
        const temp = data.filter(
            (info) =>
                info.dataInfo!.configId === id &&
                ![
                    NodeType.FirstLeNode,
                    NodeType.SecondLeNode,
                    NodeType.ThirdLeNode,
                ].includes(info.nodeType) &&
                info.dataInfo?.content,
        )
        return {
            content: temp.map((info) => info.dataInfo!.content),
            ai_content: temp.map((info) =>
                info.dataInfo?.ai_content
                    ? info.dataInfo?.ai_content
                    : getEmptyObjectByType(info.dataInfo?.content_type),
            ),
        }
    }

    // 保存/发布
    const publish = async () => {
        if (!totalData) return
        const flatData = flatTreeData([totalData]).filter(
            (info) => info?.dataInfo,
        )
        try {
            await updateDataComprehension(catalogId, {
                catalog_code: details.catalog_code,
                catalog_id: catalogId,
                dimension_configs: assemblyData(flatData),
                column_comments: fieldsData?.data,
                operation: saveType === SaveType.PUBLISH ? 'upsert' : 'save',
                task_id: taskId,
            })
            message.success(
                saveType === SaveType.PUBLISH ? __('发布成功') : __('保存成功'),
            )
            onReturn()
        } catch (err) {
            if (err?.data?.comprehension_dimensions) {
                // 信息错误重置数据
                const data = new MindMapData({
                    nodeType: NodeType.FirstLeNode,
                    dataInfo: {
                        id: err.data.catalog_id,
                        name: err.data.catalog_info.name,
                        note: err.data.comprehension_dimensions.note,
                    },
                    children: createNodeByDataInfo(
                        viewMode,
                        err.data.comprehension_dimensions,
                        err.data.choices,
                        2,
                    ),
                })
                setTotalData(data)
                graphRenderByData(graphCase.current!, data, true)
                graphCase.current!.centerContent()
                getCatalogData(data)
                getCatalogColumnData(data)
            } else {
                formatError(err)
            }
        } finally {
            onSave(undefined)
        }
    }

    useMemo(() => {
        if (saveType && saveType !== SaveType.BAN) {
            if (saveType === SaveType.PUBLISH) {
                publishWithVerifyData()
            } else {
                publish()
            }
        }
    }, [saveType])

    // 智能理解 true-开始 false-结束
    const handleAiRecommend = (bo: boolean) => {
        if (!totalData || !graphCase.current) return
        if (bo && !checkDimensionRecommend(totalData)) {
            messageInfo(__('当前存在维度正在理解，请稍后再试'))
            return
        }
        onSave(bo ? SaveType.BAN : undefined)
        setIsAiIng(bo)
        const flatData = filterDimension(totalData)
        flatData.forEach((info) => {
            const temp = info
            temp.recommendedAll = bo
        })

        if (bo) {
            let count = 0
            // 单个维度的ai理解
            const aiRecommendItem = () => {
                if (!aiIntervalData.isClear() || !aiIntervalData.reqEnd) return
                if (count === flatData.length) {
                    clearInterval(interval)
                    handleAiRecommend(false)
                } else {
                    const item = flatData[count]
                    setAiItem(item)
                    graphRecommendNode(
                        graphCase.current!,
                        totalData!,
                        item.id!,
                        aiIntervalData,
                    )
                    count += 1
                }
            }
            aiRecommendItem()
            const interval = setInterval(aiRecommendItem, 1000)
            setTimer(interval)
        } else {
            clearInterval(timer)
            graphStopRecommendNode(
                graphCase.current!,
                totalData,
                aiIntervalData,
                aiItem?.id,
                onSave,
            )
        }
    }

    return (
        <div
            style={{
                position: 'relative',
                width: '100vw',
                height: '100vh',
            }}
            ref={content}
            className={styles.dataUndsGraphWrap}
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
            <FixedGraphFieldsView
                data={details?.catalog_info}
                enumConfigs={enumConfigs}
            />
            <PopGraphFieldsView
                visible={popVisable}
                showHeight={(size?.height || 0) * 0.5}
                catalogId={catalogId}
                title={details.catalog_info.name}
                // viewMode={viewMode}
                fieldsData={fieldsData}
                onClose={() => setPopVisable(false)}
                onUpdateData={(data) => {
                    const temp = new FieldUndsData(data, fieldsData.dataType)
                    setFieldsData(temp)
                }}
            />
            <div
                className={styles.dug_aiBtnWrap}
                hidden={viewMode === ViewMode.VIEW}
            >
                <div
                    hidden={isAiIng}
                    className={styles.dug_Ai}
                    onClick={() => handleAiRecommend(true)}
                >
                    <CommonIcon
                        icon={aiUnderstandingColored}
                        className={styles.aiBtnIcon}
                    />
                    <div className={styles.aiBtnTitle}>{__('智能理解')}</div>
                </div>
                <div hidden={!isAiIng} className={styles.dug_AiIng}>
                    <LoadingOutlined style={{ color: '#fff' }} />
                    <div className={styles.aiBtnTitle}>{__('正在理解...')}</div>
                    <div className={styles.aiBtnDivid} />
                    <div
                        className={styles.aiBtnStopWrap}
                        onClick={() => handleAiRecommend(false)}
                    >
                        <div className={styles.aiBtnStop} />
                    </div>
                </div>
            </div>
        </div>
    )
}
export default DataUndsGraph
