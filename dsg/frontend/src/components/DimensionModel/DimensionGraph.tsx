import { Graph } from '@antv/x6'
import { Selection } from '@antv/x6-plugin-selection'
import { useDebounce, useGetState, useSize } from 'ahooks'
import { Button, Result, message } from 'antd'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { instancingGraph } from '@/core/graph/graph-config'
import {
    IDimModelDetailResult,
    ShowType,
} from '@/core/apis/indicatorManagement/index.d'
import {
    createDimensionModel,
    formatError,
    getDimensionModelDetail,
    updateDimensionModelConfig,
} from '@/core'
import { GraphProvider, useGraphContext } from '@/context'
import notFound from '../../assets/notFound.svg'
import GraphHeader from './GraphHeader'
import {
    ConnecterType,
    DimSettingPanel,
    DimensionTableNode,
    EdgeType,
    FactTableNode,
    ModelConnectorFunc,
    ModelEdgeConf,
    TipLabels,
} from './components'
import { convertConf, graphRenderByData, layoutRedraw } from './helper'
import __ from './locale'
import styles from './styles.module.less'

import graphEmpty from '@/assets/graphEmpty.svg'
import { X6PortalProvider } from '@/core/graph/helper'
import { Empty, Loader } from '@/ui'
import DragVertical from './DragVertical'
import ChooseBizTable from './components/ChooseBizTable'
import { DimConfProvider } from './components/DimSettingPanel/DimConfProvider'
import { ViewMode } from './const'
import { addDimensionModelAlarm } from '@/core/apis/indicatorManagement'
import type { IDimModelAlarmItem } from '@/core/apis/indicatorManagement/index.d'

const DimensionGraph = memo(() => {
    const {
        meta,
        setMeta,
        config,
        setConfig,
        setLastConfig,
        transformData,
        mode,
        setMode,
        expand,
        setExpand,
        toggleExpand,
        operationRef,
        errorTypeFields,
        setDimModelId,
        addSubmittedAlarm,
        hasSubmittedAlarm,
    } = useGraphContext()
    const [searchParams, setSearchParams] = useSearchParams()
    const dimModelId = searchParams.get('dimModelId') || ''
    const dimItem = searchParams.get('item') || ''
    const curMode = searchParams.get('mode') || ViewMode.VIEW
    const navigator = useNavigate()

    const graphCase = useRef<Graph>()
    const container = useRef<HTMLDivElement>(null)
    const containerSize = useSize(container)

    // 画布缩放大小
    const [graphSize, setGraphSize] = useState(100)
    // 当前显示模式
    const [pageStatus, setPageStatus] = useState<boolean>(true)
    const [loading, setLoading] = useState<boolean>(false)
    const [bizChooseVisible, setBizChooseVisible] = useState<boolean>(false)
    const [dimModelData, setDimModelData] = useState<IDimModelDetailResult>()
    // const [cellsData, setCellsData] = useState<any>()
    const [defaultSize, setDefaultSize] = useGetState<Array<number>>([40, 60])
    const debouncedGraphSize = useDebounce(graphSize, { wait: 400 })
    const [headerData, setHeaderData] = useState<any>()
    useMemo(() => {
        // 注册连接器与边
        Graph.registerConnector(ConnecterType, ModelConnectorFunc, true)
        Graph.registerEdge(EdgeType, ModelEdgeConf, true)
        // 注册节点
        DimensionTableNode()
        FactTableNode()
    }, [])

    useEffect(() => {
        setMode(curMode as ViewMode)
    }, [curMode])

    useEffect(() => {
        setDimModelId(dimModelId)
    }, [dimModelId, setDimModelId])

    /**
     * 缩放画布
     * @param multiple  缩放大小
     */
    const changeGraphSize = (multiple: number) => {
        setGraphSize(multiple * 100)
        graphCase.current?.zoomTo(multiple)
    }

    useEffect(() => {
        const graph = instancingGraph(container.current, {
            background: {
                color: '#F6F9FB',
            },
            autoResize: true,
            panning: true,
            embedding: false,
            interacting: true,
            connecting: {
                allowBlank: false,
                allowLoop: false,
                allowNode: false,
                allowEdge: false,
                highlight: true,
                connectionPoint: 'anchor',
                snap: true,
                router: {
                    name: 'er',
                    args: {
                        offset: 25,
                        direction: 'H',
                    },
                },
            },

            mousewheel: {
                enabled: true,
                // modifiers: ['ctrl', 'meta'],
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
            graph.use(
                new Selection({
                    enabled: true,
                    multiple: false,
                }),
            )
            graph.on('scale', ({ sx, sy }) => {
                const showSize = sx * 100
                setGraphSize(Math.floor(showSize))
            })
            graph.on('blank:click', () => {
                setMeta([])
            })

            graph.on('node:change:data', ({ node, previous, current }) => {
                // 监听这三个属性改变 重绘布局
                if (
                    ['width', 'height', 'expand'].some(
                        (key) => previous[key] !== current[key],
                    )
                ) {
                    layoutRedraw(graph)
                }
            })

            // 边选中
            graph.on('edge:selected', ({ edge }) => {
                const { id } = edge.prop()
                if (id) {
                    setMeta(id?.split('::'))
                }
                edge.attr('line/stroke', 'rgba(18,110,227,0.65)')
            })

            // 边取消选中
            graph.on('edge:unselected', ({ edge }) => {
                setMeta([])
                edge.attr('line/stroke', '#D5D5D5')
            })
        }
    }, [])

    // 画布总览全部
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

    // 画布定位到中心
    const movedToCenter = () => {
        graphCase.current?.centerContent()
    }

    useEffect(() => {
        const edges = graphCase.current?.getEdges()
        if (edges) {
            if (meta) {
                edges.forEach((edge) => {
                    if (meta?.some((k) => edge.prop().id?.includes(k))) {
                        if (
                            errorTypeFields?.some((k) =>
                                edge.prop().id?.includes(k),
                            )
                        ) {
                            edge.attr('line/stroke', 'rgb(245, 34, 45)')
                        } else {
                            edge.attr('line/stroke', 'rgba(18,110,227,0.65)')
                        }
                    } else {
                        edge.attr('line/stroke', '#D5D5D5')
                    }
                })
            } else {
                edges.forEach((edge) => edge.attr('line/stroke', '#D5D5D5'))
            }
        }
    }, [meta, errorTypeFields])

    useEffect(() => {
        if (graphCase?.current && transformData) {
            graphRenderByData(graphCase.current, transformData as any)
            movedToCenter()
        }
    }, [transformData])

    useEffect(() => {
        if (mode === ViewMode.EDIT && errorTypeFields?.length) {
            setExpand(true)
        }
    }, [mode, errorTypeFields])

    // useEffect(() => {
    //     graphCase.current?.fromJSON({ cells: cellsData || [] })
    // }, [cellsData])

    /**
     * 数据初始化
     */
    const init = async () => {
        // if (!graphCase?.current) {
        //     return
        // }
        setLoading(true)
        try {
            // 编辑模型
            const res: any = await getDimensionModelDetail(dimModelId, {
                show_type: ShowType.All,
            })
            setDimModelData(res)
            const conf = {
                ...(res?.dim_model_config || {}),
            }
            if (!conf?.dim_field_config) {
                conf.dim_field_config = []
            }

            setConfig(conf)
            setLastConfig(conf)
            if (res?.canvas && !res?.dim_model_config) {
                message.error(__('事实表被删除，请重新选择'))
                // 提交事实表异常告警
                submitFactTableDeletionAlarm('')
            }

            if (!res.canvas && mode === ViewMode.EDIT) {
                // initGraph()
            } else {
                // const cells = JSON.parse(res?.canvas || '[]')
                // setCellsData(cells)
            }
        } catch (e) {
            formatError(e)
            setPageStatus(false)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (dimModelId) {
            init()
        }
    }, [dimModelId])

    // 保存画布内容
    const saveContent = async () => {
        if (!graphCase.current) return
        if (!config) {
            message.warning(__('请选择一张事实表创建维度模型'))
            return
        }
        try {
            const cells = graphCase.current?.toJSON().cells
            if (dimModelId) {
                // 更新
                await updateDimensionModelConfig(dimModelId, {
                    canvas: JSON.stringify(cells),
                    dim_model_config: config,
                })
            } else if (dimItem) {
                // 添加
                const item = JSON.parse(dimItem)
                const ret = await createDimensionModel({
                    ...item,
                    canvas: JSON.stringify(cells),
                    dim_model_config: config,
                })

                searchParams.set('dimModelId', ret.id)
                searchParams.delete('item')
                setSearchParams(searchParams, { replace: true })
            }
            setLastConfig(config)
            message.success(__('保存成功'))
        } catch (err) {
            formatError(err)
        }
    }

    // 返回列表
    const handleBack = () => {
        navigator('/dataService/dimensionModel')
    }

    operationRef.current = {
        graph: () => graphCase.current,
        fitGraphView: () => movedToCenter(),
    }

    // 切换编辑模式
    const switchModeToEdit = () => {
        setMode(ViewMode.EDIT)
        searchParams.set('mode', ViewMode.EDIT)
        setSearchParams(searchParams, { replace: true })
    }

    const emptyView = () => {
        const editEmpty = (
            <Empty
                iconSrc={graphEmpty}
                desc={
                    <div style={{ textAlign: 'center' }}>
                        <div>
                            {__('点击')}
                            <a onClick={() => setBizChooseVisible(true)}>
                                {__('【选择】')}
                            </a>
                            {__('按钮选择一个库表作为事实表')}
                        </div>
                        <div>
                            {__('设置其维度字段并关联维度表，形成维度模型')}
                        </div>
                    </div>
                }
            />
        )

        const viewEmpty = (
            <Empty
                iconSrc={graphEmpty}
                desc={
                    <div style={{ textAlign: 'center' }}>
                        {dimModelData?.canvas && (
                            <div>{__('事实表被删除')}</div>
                        )}
                        <div>
                            {__('可点击')}
                            <a onClick={() => switchModeToEdit()}>
                                {__('【编辑】')}
                            </a>
                            {__('按钮重新配置维度模型')}
                        </div>
                    </div>
                }
            />
        )

        return mode === ViewMode.EDIT ? editEmpty : viewEmpty
    }

    const handleCreateFact = (item) => {
        setConfig(convertConf(item, true))
        toggleExpand()
    }

    const handleChangeInfo = (item) => {
        searchParams.set('item', JSON.stringify(item))
        setSearchParams(searchParams, { replace: true })
    }

    /**
     * 提交事实表删除告警
     */
    const submitFactTableDeletionAlarm = async (factTableName: string) => {
        if (!dimModelId || mode !== ViewMode.VIEW) {
            return
        }

        const alarmKey = `fact_table_${factTableName}_deleted`

        // 检查是否已提交过相同告警
        if (hasSubmittedAlarm(alarmKey)) {
            return
        }
        try {
            const alarmItem: IDimModelAlarmItem = {
                alarm_type: 0, // 0:事实表
                alarm_table: factTableName,
                technical_name: factTableName,
                alarm_reason: 0, // 0:被删除
            }

            await addDimensionModelAlarm({
                model_id: dimModelId,
                save: [alarmItem],
            })
            addSubmittedAlarm(alarmKey)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        movedToCenter()
    }, [containerSize])

    useEffect(() => {
        setHeaderData(
            dimModelId
                ? {
                      id: dimModelId,
                      description: dimModelData?.description!,
                      name: dimModelData?.name!,
                      dim_module: dimModelData?.dim_module!,
                  }
                : JSON.parse(dimItem),
        )
    }, [dimModelId, dimItem, dimModelData])

    return pageStatus ? (
        <div className={styles['dimension-graph']}>
            <X6PortalProvider />
            <GraphHeader
                onChangeGraphSize={changeGraphSize}
                onShowAllGraphSize={showAllGraphSize}
                onMovedToCenter={movedToCenter}
                graphSize={debouncedGraphSize}
                onSaveGraph={saveContent}
                viewMode={mode}
                onEdit={switchModeToEdit}
                onChangeInfo={handleChangeInfo}
                data={headerData}
            />

            <div className={styles['dimension-graph-content']}>
                <DragVertical
                    defaultSize={defaultSize}
                    minSize={48}
                    collapsed={expand ? undefined : 1}
                    isHidden={
                        mode === ViewMode.VIEW || mode === ViewMode.ONLY_VIEW
                    }
                    onDragEnd={(size) => {
                        const close =
                            ((window.innerHeight - 70) * size[1]) / 100 < 70
                        setExpand(!close)
                        if (close) {
                            setDefaultSize([40, 60])
                        } else {
                            setDefaultSize(size)
                        }
                    }}
                    expand={expand}
                    gutterSize={1}
                >
                    <>
                        <div
                            ref={container}
                            id="container"
                            className={
                                styles['dimension-graph-content-container']
                            }
                            style={{
                                visibility: config ? 'visible' : 'hidden',
                            }}
                        />
                        {loading ? (
                            <Loader />
                        ) : (
                            !config && (
                                <div
                                    className={
                                        styles['dimension-graph-content-empty']
                                    }
                                >
                                    {emptyView()}
                                </div>
                            )
                        )}
                        <TipLabels
                            style={{
                                marginBottom:
                                    mode === ViewMode.EDIT ? '48px' : '0px',
                            }}
                        />
                    </>

                    {mode === ViewMode.EDIT && (
                        <div className={styles['panel-setting']}>
                            <DimConfProvider>
                                <DimSettingPanel />
                            </DimConfProvider>
                        </div>
                    )}
                </DragVertical>

                <ChooseBizTable
                    title={__('选择事实表')}
                    visible={bizChooseVisible}
                    onClose={() => setBizChooseVisible(false)}
                    onSure={(o) => {
                        handleCreateFact(o)
                        setBizChooseVisible(false)
                    }}
                />
            </div>
        </div>
    ) : (
        <div className={styles['not-found']}>
            <Result
                subTitle={__('未找到维度模型资源')}
                icon={<img src={notFound} alt="notFound" />}
                extra={
                    <Button type="primary" onClick={handleBack}>
                        {__('返回')}
                    </Button>
                }
            />
        </div>
    )
})

const DimensionGraphContainer = () => {
    return (
        <GraphProvider>
            <DimensionGraph />
        </GraphProvider>
    )
}

export default DimensionGraphContainer
