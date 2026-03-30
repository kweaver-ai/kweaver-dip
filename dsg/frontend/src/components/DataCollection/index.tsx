import { Graph as GraphType, Node, Shape } from '@antv/x6'
import { Dnd } from '@antv/x6-plugin-dnd'
import { useGetState, useSize, useUnmount } from 'ahooks'
import { message } from 'antd'
import { last, noop } from 'lodash'
import * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'

import { ExclamationCircleFilled } from '@ant-design/icons'
import {
    checkDataTables,
    completeCollectOrProcess,
    formatError,
    getCanvasCollecting,
    getFirstSourceTables,
    getFormQueryItem,
    getFormsFieldsList,
    getSourceTables,
    saveCollectingCanvas,
    saveCollectingDataTable,
    saveFirstCollectingDataTable,
    TaskStatus,
} from '@/core'
import { instancingGraph } from '@/core/graph/graph-config'
import { loadPlugins, Plugins } from '@/core/graph/plugin'
import { confirm } from '@/utils/modalHelper'
import DragBox from '../DragBox'
import FormQuoteData from '../FormGraph/formDataQuoteData'
import {
    combUrl,
    DataShowSite,
    ExpandStatus,
    getCurrentShowData,
    getDataShowSite,
    getQueryData,
    OptionType,
    searchFieldData,
    wheellDebounce,
} from '../FormGraph/helper'
import formOriginNode from './FormOriginNode'
import GraphToolBar from './GraphToolBar'
import {
    DataOriginTemplate,
    FormOriginNodeTemplate,
    FormPasteSourceTemplate,
    getNewPastePosition,
    getPortByNode,
} from './helper'
import styles from './styles.module.less'

import {
    CollectingTableDataParams,
    SourceFormInfo,
} from '@/core/apis/businessGrooming/index.d'
import { X6PortalProvider } from '@/core/graph/helper'
import FieldTableView from '../FormGraph/FieldTableView'
import ViewFieldDetail from '../FormGraph/ViewFieldDetail'
import ViewFormDetail from '../FormGraph/ViewFormDetail'
import AddPasteFormField from './AddPasteFormField'
import ConfigDataOrigin from './ConfigDataOrigin'
import DataForm from './DataForm'
import dataOriginNode from './DataOriginNode'
import DataSource from './DataSource'
import EditPasteField from './EditPasteField'
import formPasteNode from './FormPasteNode'
import SelectPasteSourceMenu from './SelectPasteSourceMenu'
import ViewPasteFieldDetail from './ViewPasteFieldDetail'
import ViewPasteFormDetail from './ViewPasteFormDetail'
import { addFormType, PasteSourceChecked, ViewModel } from './const'
import __ from './locale'

const DataCollection = () => {
    const graphCase = useRef<GraphType>()
    const dndCase = useRef<Dnd>()
    const graphBody = useRef<HTMLDivElement>(null)
    const bodySize = useSize(graphBody)
    const container = useRef<HTMLDivElement>(null)
    const dndContainer = useRef<HTMLDivElement>(null)
    const navigator = useNavigate()
    const [model, setModel, getModel] = useGetState<ViewModel>(
        ViewModel.ModelEdit,
    )
    const [defaultSize, setDefaultSize] = useState<Array<number>>([15, 85])
    const [formInfo, setFormInfo, getFormInfo] = useGetState<any>(null)
    const [graphSize, setGraphSize] = useState(100)
    const [searchParams, setSearchParams] = useSearchParams()
    const { search } = useLocation()
    const [queryData, setQueryData] = useState<any>(getQueryData(search))
    const fid = searchParams.get('fid') || ''
    const mid = searchParams.get('mid') || ''
    const redirect = searchParams.get('redirect')
    const taskId = searchParams.get('taskId') || ''
    const [originFormNode, setOriginFormNode, getOriginFormNode] =
        useGetState<Node | null>(null)
    const [selectFormType, setSelectFormType] = useState<addFormType | null>(
        null,
    )
    const [addFieldsNode, setAddFieldsNode] = useState<Node | null>(null)
    const [editField, setEditField] = useState<any>(null)
    const [editFieldNode, setEditFieldNode] = useState<Node | null>(null)
    const [deleteNode, setDeleteNode] = useState<Node | null>(null)
    const [editDataOriginNode, setEditDataOriginNode] = useState<Node | null>(
        null,
    )
    const [editPasteFormNode, setEditPasteFormNode] = useState<Node | null>(
        null,
    )
    const [optionType, setOptionType] = useState<OptionType>(
        OptionType.NoOption,
    )
    const [editBusinessFormId, setEditBusinessFormId] = useState<string>('')
    const [viewBusinessField, setViewBusinessField] = useState<any>(null)
    const [viewTableNode, setViewTableNode] = useState<Node | null>(null)
    const [pasteNodeIds, setPasteNodeIds, getPasteNodeIds] = useGetState<
        Array<string>
    >([])
    const [deletePasteField, setDeletePasteField] = useState<any>(null)
    const [hasSaved, setHasSaved] = useState<boolean>(false)
    const [defaultMetaForms, setDefaultMetaForms, getDefaultMetaForms] =
        useGetState<Array<SourceFormInfo>>([])
    const [isCompleted, setIsCompleted] = useState<boolean>(true)
    const [deletePasteFieldNode, setDeletePasteFieldNode] =
        useState<Node | null>(null)
    const [dataOriginConfigNode, setDataOriginConfigNode] =
        useState<Node | null>(null)
    const targetNodePortData = useMemo(() => {
        return new FormQuoteData({})
    }, [])
    const pasteNodesPortsData = useMemo(() => {
        return new FormQuoteData({})
    }, [])

    const edgeRelation = useMemo(() => {
        return new FormQuoteData({})
    }, [])
    const [currentDndNode, setCurrentDndNode, getCurrentDndNode] =
        useGetState<any>(null)

    const getYPosition = (site, index, length) => {
        if (site === 'top') {
            return 56
        }
        if (site === 'bottom') {
            return 56 + length * 40 + 14
        }
        return 56 + index * 40 + 18
    }
    useMemo(() => {
        GraphType.registerPortLayout(
            'formItemLeftPosition',
            (portsPositionArgs) => {
                return portsPositionArgs.map((_, index) => {
                    return {
                        position: {
                            x: 0,
                            y:
                                _.type === 'form'
                                    ? 15
                                    : _.expand === ExpandStatus.Expand
                                    ? getYPosition(_.site, _.index, _.length)
                                    : 28,
                        },
                        zIndex: 10,
                        angle: 0,
                    }
                })
            },
        )
    }, [])
    useMemo(() => {
        GraphType.registerPortLayout(
            'formItemRightPosition',
            (portsPositionArgs) => {
                return portsPositionArgs.map((_, index) => {
                    return {
                        position: {
                            x: 400,
                            y:
                                _.type === 'form'
                                    ? 15
                                    : _.expand === ExpandStatus.Expand
                                    ? getYPosition(_.site, _.index, _.length)
                                    : 28,
                        },
                        zIndex: 10,
                        angle: 0,
                    }
                })
            },
        )
    }, [])

    useMemo(() => {
        GraphType.registerPortLayout(
            'defaultOriginLeftPosition',
            (portsPositionArgs) => {
                return portsPositionArgs.map((_, index) => {
                    return {
                        position: {
                            x: 27,
                            y: 40,
                        },
                        zIndex: 10,
                        angle: 0,
                    }
                })
            },
        )
    }, [])

    useMemo(() => {
        GraphType.registerPortLayout(
            'defaultOriginRightPosition',
            (portsPositionArgs) => {
                return portsPositionArgs.map((_, index) => {
                    return {
                        position: {
                            x: 83,
                            y: 40,
                        },
                        zIndex: 10,
                        angle: 0,
                    }
                })
            },
        )
    }, [])

    // 注册目标表节点
    const formTargetNodeName = formOriginNode([
        () => graphCase,
        () => (node: Node) => {
            loadTargetPort(node)
            updateAllPortAndEdge()
        },
        () => optionGraphData,
        () => setViewTableNode,
        () => pasteNodesPortsData,
        () => loadPortsForPasteForm,
        () => getModel(),
        () => edgeRelation,
    ])

    const formPasteNodeName = formPasteNode([
        () => graphCase,
        () => getModel(),
        () => setAddFieldsNode,
        () => (field, node: Node) => {
            setEditField(field)
            if (model !== ViewModel.ModelEdit) {
                setOptionType(OptionType.ViewPasteFieldInfo)
            } else {
                setEditFieldNode(node)
            }
        },
        () => (node: Node, deleteField?) => {
            loadPortsForPasteForm(node)
            updateAllPortAndEdge()
            if (deleteField) {
                deleteFieldRelation([deleteField])
            }
        },
        () => (node) => {
            if (checkCurrentNodeExistRelation(node)) {
                setDeleteNode(node)
            } else {
                deletePasteForm(node)
            }
        },
        () => (node) => {
            setEditPasteFormNode(node)
            if (model !== ViewModel.ModelEdit) {
                setOptionType(OptionType.ViewPasteFormInfo)
            }
        },
        () => (node: Node, deleteField) => {
            if (node && deleteField) {
                setDeletePasteField(deleteField)
                setDeletePasteFieldNode(node)
            }
        },
        () => async (pasteNodes) => {
            const results = await refreshDataTables(pasteNodes)
            if (results && results.length) {
                message.error(
                    __('${formNames}未完成采集', {
                        formNames: pasteNodes[0].data.formInfo.name,
                    }),
                )
            }
        },
        () => edgeRelation,
        () => (node: Node) => {
            setDataOriginConfigNode(node)
        },
    ])

    const dataOrigin = dataOriginNode([
        () => graphCase,
        () => (node) => {
            deletePasteOriginInfo(node.data.dataInfo.id)
            graphCase?.current?.removeCell(node.id)
        },
        () => setEditDataOriginNode,
        () => getModel(),
    ])

    useUnmount(() => {
        if (graphCase && graphCase.current) {
            graphCase.current.dispose()
        }
        GraphType.unregisterPortLayout('formItemRightPosition')
        GraphType.unregisterPortLayout('formItemLeftPosition')
        GraphType.unregisterPortLayout('defaultOriginLeftPosition')
        GraphType.unregisterPortLayout('defaultOriginRightPosition')
    })

    useEffect(() => {
        initEditStatus()
        const graph = instancingGraph(container.current, {
            interacting: true,
            embedding: false,
            mousewheel: {
                enabled: true,
                modifiers: ['ctrl', 'meta'],
                guard(this: any, e: WheelEvent) {
                    const wheelEvent = this

                    if (graph) {
                        wheellDebounce(graph, wheelEvent, setGraphSize)
                        return true
                    }
                    return false
                },
            },
            connecting: {
                allowBlank: false,
                allowLoop: false,
                allowNode: false,
                allowEdge: false,
                highlight: true,
                connectionPoint: 'anchor',
                snap: {
                    radius: 30,
                },
                router: {
                    name: 'er',
                    args: {
                        offset: 25,
                        direction: 'H',
                    },
                },
                createEdge() {
                    return new Shape.Edge({
                        attrs: {
                            line: {
                                stroke: '#979797',
                                strokeWidth: 1,
                            },
                        },
                    })
                },
            },
        })
        if (graph) {
            loadPlugins(
                graph,
                [
                    Plugins.History,
                    Plugins.Keyboard,
                    Plugins.Selection,
                    Plugins.Clipboard,
                    Plugins.Export,
                    Plugins.Scroller,
                ],
                {
                    [Plugins.Selection]: {
                        enabled: true,
                        multiple: false,
                        rubberEdge: false,
                        rubberNode: true,
                        rubberband: false,
                        showNodeSelectionBox: true,
                        pointerEvents: 'none',
                        className: 'form-seleted',
                    },
                },
            )
            graphCase.current = graph
            loadOriginTable()
            dndCase.current = new Dnd({
                target: graph,
                scaled: false,
                dndContainer: dndContainer.current || undefined,
            })

            graph.on('edge:connected', ({ isNew, edge }) => {
                const sourcePortId = edge.getSourcePortId()
                const targetPortId = edge.getTargetPortId()
                const sourceCell = edge.getSourceNode()
                const targetCell = edge.getTargetNode()
                const sourcPort = sourceCell?.getPort(sourcePortId || '')
                const targetPort = targetCell?.getPort(targetPortId || '')
                if (
                    sourcPort &&
                    sourcPort.args &&
                    sourcPort.args.type === 'dataOrigin'
                ) {
                    if (
                        targetPort &&
                        targetPort.args &&
                        targetPort.args.type === 'form'
                    ) {
                        if (targetCell?.data.formInfo.info_system) {
                            message.error(
                                __('${name} 该业务表存在信息系统', {
                                    name: targetCell?.data.formInfo.name || '',
                                }),
                            )
                            graph.removeCell(edge.id)
                        } else {
                            targetCell?.replaceData({
                                ...targetCell.data,
                                formInfo: {
                                    ...targetCell.data.formInfo,
                                    info_system:
                                        sourceCell?.data.dataInfo.name || '',
                                },
                                infoId: sourceCell?.data.dataInfo.id || '',
                                errorStatus: false,
                            })
                            if (sourceCell) {
                                const sourceOtherPorts = sourceCell
                                    .getPorts()
                                    .filter(
                                        (singlePort) =>
                                            singlePort?.args?.site !==
                                            sourcPort?.args?.site,
                                    )
                                sourceCell.removePort(sourceOtherPorts[0])
                            }
                        }
                    } else {
                        message.error('信息系统只能连接无信息系统的数据表')
                        graph.removeCell(edge.id)
                    }
                } else if (
                    sourcPort &&
                    sourcPort.args &&
                    sourcPort.args.type === 'form'
                ) {
                    message.error('数据表只能由信息系统进行连接')
                    graph.removeCell(edge.id)
                } else if (sourceCell?.shape === formPasteNodeName) {
                    if (targetCell?.shape === formTargetNodeName) {
                        if (targetPortId && sourcePortId) {
                            addTargetSourceId(
                                pasteNodesPortsData.quoteData[sourcePortId]
                                    .fieldId,
                                targetNodePortData.quoteData[targetPortId]
                                    .fieldId,
                                edge,
                                sourceCell.data.items.find(
                                    (item) =>
                                        item.id ===
                                        pasteNodesPortsData.quoteData[
                                            sourcePortId
                                        ].fieldId,
                                ).type,
                                sourceCell.id,
                            )
                        }
                    } else {
                        message.error('数据表字段只能连接对应业务表字段')
                        graph.removeCell(edge.id)
                    }
                } else {
                    message.error('业务表字段只能通过数据表字段连接')
                    graph.removeCell(edge.id)
                }
            })

            graph.on('node:added', ({ node }) => {
                if (node.shape === 'table-paste-node') {
                    if (getCurrentDndNode()) {
                        if (
                            getCurrentDndNode().data.formInfo.id ===
                                node.data.formInfo.id &&
                            node.data.formInfo.info_system
                        ) {
                            createDataOriginByPaste(node)
                            updateDataOriginReletion(node)
                        }
                        setCurrentDndNode(null)
                    }
                    loadPortsForPasteForm(node)
                    if (!getPasteNodeIds().includes(node.data.formInfo.id)) {
                        setPasteNodeIds([
                            ...getPasteNodeIds(),
                            node.data.formInfo.id,
                        ])
                    }
                }
            })

            graph.on('node:removed', ({ node }) => {
                if (node.shape === 'table-paste-node') {
                    setPasteNodeIds(
                        getPasteNodeIds().filter(
                            (pasteId) => pasteId !== node.data.formInfo.id,
                        ),
                    )
                }
            })
        }
    }, [])

    useEffect(() => {
        if (deleteNode) {
            if (deleteNode.data.type === 'pasteSource') {
                confirm({
                    title: __('确认要移除数据表吗？'),
                    icon: (
                        <ExclamationCircleFilled style={{ color: '#F5222D' }} />
                    ),
                    content: __(
                        '移除后数据表中字段及其所有映射关系均被删除无法找回，请谨慎操作！',
                    ),
                    okText: __('确定'),
                    cancelText: __('取消'),
                    onOk: () => {
                        deletePasteForm(deleteNode)
                        setDeleteNode(null)
                    },
                    onCancel: () => {
                        setDeleteNode(null)
                    },
                })
            }
            // else if (deleteNode.data.type === 'dataOrigin') {
            //     confirm({
            //         title: __('确认要删除信息系统吗？'),
            //         icon: (
            //             <ExclamationCircleFilled style={{ color: '#F5222D' }} />
            //         ),
            //         content: __(
            //             '删除后信息系统与数据表之间的映射关系均被删除无法找回，请谨慎操作！',
            //         ),
            //         okText: __('确认'),
            //         cancelText: __('取消'),
            //         onOk: () => {
            //             deletePasteOriginInfo(deleteNode.data.dataInfo.id)
            //             graphCase?.current?.removeCell(deleteNode.id)
            //             setDeleteNode(null)
            //         },
            //         onCancel: () => {
            //             setDeleteNode(null)
            //         },
            //     })
            // }
        }
    }, [deleteNode])

    useEffect(() => {
        if (deletePasteField && deletePasteFieldNode) {
            confirm({
                title: __('确认要删除字段吗？'),
                icon: <ExclamationCircleFilled style={{ color: '#F5222D' }} />,
                content: __(
                    '删除已采集数据表中的字段，该数据表需重新采集，请谨慎操作！',
                ),
                okText: __('确认'),
                cancelText: __('取消'),
                onOk: () => {
                    deletePasteFieldNode.replaceData({
                        ...deletePasteFieldNode.data,
                        items: deletePasteFieldNode.data.items.filter(
                            (item) => item.id !== deletePasteField.id,
                        ),
                    })
                    deleteFieldRelation([deletePasteField])
                    reCreatePasteForm(deletePasteFieldNode)
                    loadPortsForPasteForm(deletePasteFieldNode)
                    updateAllPortAndEdge()
                    setDeletePasteField(null)
                    setDeletePasteFieldNode(null)
                },
                onCancel: () => {
                    setDeletePasteField(null)
                    setDeletePasteFieldNode(null)
                },
            })
        }
    }, [deletePasteField])

    const initEditStatus = () => {
        const querySearch = getQueryData(search)
        if (querySearch?.defaultModel === 'view') {
            if (
                querySearch.taskStatus &&
                querySearch.taskStatus === TaskStatus.COMPLETED
            ) {
                setModel(ViewModel.ModelView)
            } else {
                setModel(ViewModel.Collect)
            }
        } else {
            setModel(ViewModel.ModelEdit)
        }
        // if (querySearch && querySearch.taskId) {
        //     if (
        //         querySearch.taskType &&
        //         querySearch.taskType === TaskType.MODEL
        //     ) {
        //         if (
        //             querySearch.taskStatus &&
        //             querySearch.taskStatus === TaskStatus.COMPLETED
        //         ) {
        //             setModel(ViewModel.ModelView)
        //         } else {
        //             setModel(ViewModel.ModelEdit)
        //         }
        //     } else if (
        //         querySearch.taskType &&
        //         querySearch.taskType === TaskType.DATACOLLECTING
        //     ) {
        //         setModel(ViewModel.Collect)
        //     }
        // } else {
        //     setModel(ViewModel.ModelEdit)
        // }
    }

    const getCollectCompleteStatus = () => {
        if (graphCase && graphCase.current) {
            const pasteNodes = graphCase.current
                .getNodes()
                .filter((allNode) => allNode.shape === 'table-paste-node')

            const isExistUnCheckedNode = pasteNodes.find(
                (pasteNode) =>
                    pasteNode.data.formInfo.checked === PasteSourceChecked.New,
            )
            setIsCompleted(
                !isExistUnCheckedNode && !getFormInfo().collection_warn,
            )
        }
    }

    /**
     * 加载目标表
     */
    const loadOriginTable = async () => {
        try {
            if (graphCase?.current) {
                const info = await getFormQueryItem(fid)
                setFormInfo(info)
                const { content } = await getCanvasCollecting(fid, {
                    version:
                        getModel() === ViewModel.Collect
                            ? 'published'
                            : 'draft',
                })

                const { entries } = await getFormsFieldsList(fid, {
                    limit: 999,
                    version:
                        getModel() === ViewModel.Collect
                            ? 'published'
                            : 'draft',
                })
                if (content) {
                    setHasSaved(true)
                    const graphDatas = JSON.parse(content)
                    setPasteNodeIds(
                        graphDatas
                            .filter(
                                (graphData) =>
                                    graphData.data.type === 'pasteSource',
                            )
                            .map((graphData) => graphData.data.fid),
                    )
                    await Promise.all(
                        graphDatas.map((graphData) => {
                            if (graphData.data.type === 'origin') {
                                return initLoadTargetForm(
                                    graphData,
                                    entries,
                                    info,
                                )
                            }
                            if (graphData.data.type === 'pasteSource') {
                                return initLoadPasteForm(
                                    graphData,
                                    getModel() === ViewModel.Collect
                                        ? 'published'
                                        : 'draft',
                                )
                            }
                            if (graphData.data.type === 'dataOrigin') {
                                return loadDataOrginNode(graphData)
                            }
                            return noop
                        }),
                    )

                    if (graphDatas.length > 1) {
                        updateAllPortAndEdge()
                        getCollectCompleteStatus()
                        checkBusinessTypeStatus()
                        initDefaultMetaForm()
                    }
                } else {
                    setHasSaved(false)
                    initLoadTargetForm(
                        {
                            ...FormOriginNodeTemplate,
                            position: {
                                x: 600,
                                y: 200,
                            },
                        },
                        entries,
                        info,
                    )
                    if (entries.length) {
                        const { tables } = await getFirstSourceTables(info.id)
                        if (tables.length) {
                            let countHeight = 0
                            tables.forEach((pasteData, index) => {
                                initLoadQuotePasteForm(
                                    {
                                        ...FormPasteSourceTemplate,
                                        position: {
                                            x: 150,
                                            y: 50 + countHeight + 20,
                                        },
                                    },
                                    pasteData,
                                )
                                countHeight =
                                    pasteData.fields.length * 40 +
                                    56 +
                                    countHeight
                            })
                            setPasteNodeIds(
                                tables.map((tableData) => tableData.id),
                            )
                            updateAllPortAndEdge()
                            initDefaultMetaForm()
                        }
                    }
                }
                movedToCenter()
            }
        } catch (ex) {
            formatError(ex)
        }
    }
    /**
     * 初始化侧边的元数据平台数据表
     */
    const initDefaultMetaForm = () => {
        if (graphCase && graphCase.current) {
            const pasteMetaNodes = graphCase.current
                .getNodes()
                .filter(
                    (singlePasteNode) =>
                        singlePasteNode.shape === 'table-paste-node' &&
                        singlePasteNode.data.formInfo.checked ===
                            PasteSourceChecked.FromDW,
                )
            setDefaultMetaForms(
                pasteMetaNodes.map((pasteMetaNode) => ({
                    fields: pasteMetaNode.data.items,
                    ...pasteMetaNode.data.formInfo,
                })),
            )
        }
    }

    const checkBusinessTypeStatus = (): boolean => {
        if (graphCase && graphCase.current) {
            const allNodes = graphCase.current.getNodes()
            const allPasteNodes = allNodes.filter(
                (singleNode) => singleNode.shape === formPasteNodeName,
            )
            const businessNode = getOriginFormNode()
            const businessFieldList = businessNode?.data.items || []
            if (!businessFieldList.length) {
                return true
            }
            let pasteFieldMap = {}
            allPasteNodes.forEach((singlePasteNode) => {
                const pasteFieldList = singlePasteNode.data.items
                if (pasteFieldList.length) {
                    pasteFieldMap = {
                        ...pasteFieldMap,
                        ...pasteFieldList.reduce((preData, currentData) => {
                            return {
                                ...preData,
                                [currentData.id]: currentData,
                            }
                        }, {}),
                    }
                }
            })
            // const errorIds = businessFieldList
            //     .filter((businessField) => {
            //         if (!businessField.source_id) {
            //             return false
            //         }
            //         const currentData = pasteFieldMap[businessField.source_id]
            //         if (currentData) {
            //             return !checkTypeMatch(
            //                 currentData.type,
            //                 businessField.data_type,
            //             )
            //         }
            //         return false
            //     })
            //     .map((filterData) => filterData.id)
            const errorIds = []
            businessNode?.replaceData({
                ...businessNode.data,
                errorFieldsId: errorIds,
            })
            if (errorIds.length) {
                return false
            }
            return true
        }
        return true
    }

    /**
     * 加载引用表
     */
    const initLoadQuotePasteForm = (template, pasteForm) => {
        try {
            if (graphCase && graphCase.current) {
                const { fields, ...formInfos } = pasteForm
                const pasteNode = graphCase.current.addNode({
                    ...template,
                    data: {
                        ...template.data,
                        offset: 0,
                        expand: ExpandStatus.Expand,
                        items: pasteForm.fields || [],
                        formInfo: formInfos,
                        version:
                            formInfos.checked === PasteSourceChecked.Created
                                ? 'published'
                                : 'draft',
                    },
                })
                createDataOriginByPaste(pasteNode)
                loadPortsForPasteForm(pasteNode)
            }
        } catch (ex) {
            formatError(ex)
        }
    }
    /**
     * 加载信息系统
     */
    const loadDataOrginNode = (graphData) => {
        if (graphCase && graphCase.current) {
            const pasteNode = graphCase.current.addNode({
                ...graphData,
                data: {
                    ...graphData.data,
                    type: 'dataOrigin',
                    dataInfo: graphData.data.dataInfo,
                },
            })
            // pasteNode.removePorts()
        }
    }

    /**
     * 新建贴源表
     */
    const createPasteSource = (info) => {
        if (graphCase?.current) {
            const allNodes = graphCase.current.getNodes()
            const nodes = allNodes.filter(
                (allNode) => allNode.shape !== 'data-origin-node',
            )
            const center = {
                x: (bodySize?.width || 1300) / 2,
                y: ((bodySize?.height || 800) - 200) / 2,
            }
            const centerLocal = graphCase.current.clientToLocal(center)
            const pasteNode = graphCase.current.addNode({
                ...FormPasteSourceTemplate,
                position: getNewPastePosition(nodes, centerLocal),
                data: {
                    ...FormPasteSourceTemplate.data,
                    formInfo: info,
                },
            })
            addPasteNodeFormPort(pasteNode)
        }
    }

    /**
     * 新建信息系统
     */
    const createDataOrigin = (info) => {
        if (graphCase?.current) {
            const allNodes = graphCase.current.getNodes()
            const nodes = allNodes.filter(
                (allNode) => allNode.shape === 'data-origin-node',
            )
            const center = {
                x: (bodySize?.width || 1300) / 2,
                y: ((bodySize?.height || 800) - 200) / 2,
            }
            const centerLocal = graphCase.current.clientToLocal(center)
            const data = graphCase.current.addNode({
                ...DataOriginTemplate,
                position: getNewPastePosition(nodes, centerLocal),
                data: {
                    ...DataOriginTemplate.data,
                    dataInfo: info,
                    editStatus: true,
                },
            })
            data.addPort({
                group: 'leftPorts',
                args: {
                    type: 'dataOrigin',
                    site: 'left',
                },
                zIndex: 10,
            })
            data.addPort({
                group: 'rightPorts',
                args: {
                    type: 'dataOrigin',
                    site: 'right',
                },
                zIndex: 10,
            })
        }
    }

    /**
     * 加载贴原表
     */
    const initLoadPasteForm = async (graphData, version) => {
        try {
            if (graphCase && graphCase.current) {
                const { fields, ...formInfos } = await getSourceTables(
                    graphData.data.fid,
                    {
                        version: graphData.data.version || version,
                    },
                )
                const pasteNode = graphCase.current.addNode({
                    ...graphData,
                    data: {
                        ...graphData.data,
                        offset: 0,
                        expand: ExpandStatus.Expand,
                        items: fields || [],
                        formInfo: formInfos,
                        singleSelectedId: '',
                        errorStatus: false,
                    },
                })

                loadPortsForPasteForm(pasteNode)
            }
        } catch (ex) {
            formatError(ex)
        }
    }
    /**
     * 贴原表建桩
     */
    const loadPortsForPasteForm = (node: Node) => {
        node.removePorts()
        addPasteNodeFormPort(node)
        updateDataOriginReletion(node)
        clearPastePortRecord(node)
        const site = originFormNode
            ? getPastePosition(node, originFormNode)
            : 'rightPorts'
        const showData = getCurrentShowData(
            node.data.offset,
            node.data.items,
            10,
        )
        showData.forEach((item, index) => {
            if (node.data.expand === ExpandStatus.Retract) {
                const portId = getOriginNodeHeaderPorts(node, site)
                if (!portId) {
                    node.addPort(getPortByNode(site, -1, '', node.data.expand))
                    addPasteNodePortData(
                        last(node.getPorts())?.id,
                        node.id,
                        item.id,
                    )
                } else {
                    addPasteNodePortData(portId, node.id, item.id)
                }
            } else {
                node.addPort(getPortByNode(site, index))
                addPasteNodePortData(
                    last(node.getPorts())?.id,
                    node.id,
                    item.id,
                )
            }
        })
    }

    /**
     * 清除制定贴原表的数据
     */
    const clearPastePortRecord = (node: Node) => {
        Object.keys(pasteNodesPortsData.quoteData).forEach((portId) => {
            if (pasteNodesPortsData.quoteData[portId].nodeId === node.id) {
                pasteNodesPortsData.deleteData(portId)
            }
        })
    }

    /**
     *  更新信息系统的关系
     */
    const updateDataOriginReletion = (pasteNode: Node) => {
        if (pasteNode.data.infoId && graphCase.current) {
            const allNodes = graphCase.current.getNodes()
            const originNode = allNodes.find(
                (allNode) =>
                    allNode.data.type === 'dataOrigin' &&
                    allNode.data.dataInfo.id === pasteNode.data.infoId,
            )
            const site = originNode
                ? getPastePosition(originNode, pasteNode)
                : 'rightPorts'
            let originsPort: any = originNode
                ? originNode.getPorts().find((port) => port.group === site)
                : null

            if (!originsPort && originNode) {
                if (site === 'rightPorts') {
                    originNode.addPort({
                        group: 'rightPorts',
                        args: {
                            type: 'dataOrigin',
                            site: 'right',
                        },
                        zIndex: 10,
                    })
                } else {
                    originNode.addPort({
                        group: 'leftPorts',
                        args: {
                            type: 'dataOrigin',
                            site: 'left',
                        },
                        zIndex: 10,
                    })
                }
                const [firstPorts] = originNode.getPorts()
                if (firstPorts) {
                    originsPort = firstPorts
                }
            }
            const pastePort = pasteNode
                .getPorts()
                .find(
                    (port) => port.group !== site && port.args?.type === 'form',
                )
            if (originsPort && pastePort) {
                const edge = new Shape.Edge({
                    source: {
                        cell: originNode?.id,
                        port: originsPort.id,
                    },
                    target: {
                        cell: pasteNode.id,
                        port: pastePort.id,
                    },

                    attrs: {
                        line: {
                            stroke: '#979797',
                            strokeWidth: 1,
                        },
                    },
                })
                graphCase.current.addEdge(edge)
            }
        }
    }
    /**
     * 添加贴源表的头部桩
     */
    const addPasteNodeFormPort = (node) => {
        node.addPort(
            getPortByNode('leftPorts', -1, '', node.data.expand, 'form'),
        )
        node.addPort(
            getPortByNode('rightPorts', -1, '', node.data.expand, 'form'),
        )
    }

    /**
     * 当前贴原表基于目标表的位置
     */
    const getPastePosition = (node: Node, targetNode: Node) => {
        const { x, y } = node.getPosition()
        if (targetNode) {
            const targetNodeSite = targetNode.getPosition()
            if (x > targetNodeSite.x) {
                return 'leftPorts'
            }
        }
        return 'rightPorts'
    }

    /**
     * 更新贴原表数据
     */
    const addPasteNodePortData = (portId, nodeId, fieldId) => {
        if (portId) {
            pasteNodesPortsData.addData({
                [portId]: {
                    nodeId,
                    fieldId,
                },
            })
        }
    }

    /**
     * 加载目标表数据
     * @param targetNodeData 目标表
     * @param itemsData 数据
     */
    const initLoadTargetForm = (targetNodeData, itemsData, info) => {
        try {
            if (graphCase?.current) {
                const targetNode = graphCase.current.addNode({
                    ...targetNodeData,
                    data: {
                        ...targetNodeData.data,
                        expand: ExpandStatus.Expand,
                        fid,
                        mid,
                        offset: 0,
                        items: itemsData.map((itemData, index) => {
                            const {
                                created_at,
                                created_by,
                                updated_at,
                                updated_by,
                                ...restData
                            } = itemData
                            return {
                                ...itemData,
                                uniqueId: index + 1,
                            }
                        }),
                        formInfo: info,
                        singleSelectedId: '',
                        errorFieldsId: [],
                    },
                })
                setOriginFormNode(targetNode)
                targetNode.removePorts()
                loadTargetPort(targetNode)
            }
        } catch (ex) {
            formatError(ex)
        }
    }

    const loadTargetPort = (node: Node) => {
        node.removePorts()
        targetNodePortData.clearData()
        const showData = getCurrentShowData(
            node.data.offset,
            searchFieldData(node.data.items, node.data.keyWord),
            10,
        )

        showData.forEach((item, index) => {
            if (node.data.expand === ExpandStatus.Retract) {
                const portLeftId = getOriginNodeHeaderPorts(node, 'leftPorts')
                const portRightId = getOriginNodeHeaderPorts(node, 'rightPorts')
                if (!portLeftId) {
                    node.addPort(
                        getPortByNode('leftPorts', -1, '', node.data.expand),
                    )
                    addTargetNodePortData(
                        last(node.getPorts())?.id,
                        node.id,
                        item.id,
                        'leftPorts',
                    )
                } else {
                    addTargetNodePortData(
                        portLeftId,
                        node.id,
                        item.id,
                        'leftPorts',
                    )
                }
                if (!portRightId) {
                    node.addPort(
                        getPortByNode('rightPorts', -1, '', node.data.expand),
                    )
                    addTargetNodePortData(
                        last(node.getPorts())?.id,
                        node.id,
                        item.id,
                        'rightPorts',
                    )
                } else {
                    addTargetNodePortData(
                        portLeftId,
                        node.id,
                        item.id,
                        'rightPorts',
                    )
                }
            } else {
                node.addPort(getPortByNode('leftPorts', index))
                addTargetNodePortData(
                    last(node.getPorts())?.id,
                    node.id,
                    item.id,
                    'leftPorts',
                )
                node.addPort(getPortByNode('rightPorts', index))
                addTargetNodePortData(
                    last(node.getPorts())?.id,
                    node.id,
                    item.id,
                    'rightPorts',
                )
            }
        })
    }

    const addTargetNodePortData = (portId, nodeId, fieldId, site) => {
        if (portId) {
            targetNodePortData.addData({
                [portId]: {
                    nodeId,
                    fieldId,
                    site,
                },
            })
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
    /**
     * 增加原Id
     */
    const addTargetSourceId = (
        sourceId,
        targetId,
        edge,
        pasteType,
        pasteNodeId,
    ) => {
        let errorFieldsId = getOriginFormNode()?.data.errorFieldsId
        const newItems = getOriginFormNode()?.data.items.map((item) => {
            if (item.id === targetId) {
                if (!checkTypeMatch(pasteType, item.data_type)) {
                    message.error('字段类型不匹配')
                    graphCase?.current?.removeCell(edge.id)
                    return item
                }
                if (
                    item.is_standardization_required &&
                    item.standard_status !== 'normal'
                ) {
                    message.error('业务表字段未标准化')
                    graphCase?.current?.removeCell(edge.id)
                    return item
                }
                if (item.source_id && item.source_id !== sourceId) {
                    message.error('该业务表已存在连接的数据表字段')
                    graphCase?.current?.removeCell(edge.id)
                    return item
                }
                edgeRelation.addData({
                    [sourceId]: edge,
                })
                if (getOriginFormNode()?.data.errorFieldsId.length) {
                    errorFieldsId =
                        getOriginFormNode()?.data.errorFieldsId.filter(
                            (errorFieldId) => errorFieldId !== item.id,
                        )
                }
                return { ...item, source_id: sourceId }
            }
            return item
        })

        getOriginFormNode()?.replaceData({
            ...getOriginFormNode()?.data,
            items: newItems,
            errorFieldsId,
        })
    }

    /**
     * 校验类型是否匹配
     * @param pasteType
     * @param OriginType
     */
    const checkTypeMatch = (pasteType: string, originType: string) => {
        switch (pasteType) {
            case 'string':
                if (originType === 'char') {
                    return true
                }
                return false

            case 'char':
                if (originType === 'char') {
                    return true
                }
                return false

            case 'varchar':
                if (originType === 'char') {
                    return true
                }
                return false

            case 'tinyint':
                if (originType === 'number') {
                    return true
                }
                return false

            case 'smallint':
                if (originType === 'number') {
                    return true
                }
                return false

            case 'int':
                if (originType === 'number') {
                    return true
                }
                return false

            case 'bigint':
                if (originType === 'number') {
                    return true
                }
                return false

            case 'float':
                if (originType === 'number') {
                    return true
                }
                return false

            case 'double':
                if (originType === 'number') {
                    return true
                }
                return false

            case 'decimal':
                if (originType === 'number') {
                    return true
                }
                return false

            case 'boolean':
                if (originType === 'bool') {
                    return true
                }
                return false

            case 'date':
                if (originType === 'date') {
                    return true
                }
                return false

            case 'datetime':
                if (originType === 'datetime') {
                    return true
                }
                return false

            case 'timestamp':
                if (originType === 'timestamp') {
                    return true
                }
                return false

            case 'binary':
                if (originType === 'binary') {
                    return true
                }
                return false

            default:
                return false
        }
    }

    /**
     * 更新所有表格port和连线
     */
    const updateAllPortAndEdge = () => {
        if (graphCase?.current) {
            const allNodes = graphCase.current.getNodes()
            edgeRelation.clearData()
            if (allNodes.length > 1) {
                const targetNode = allNodes.filter(
                    (allNode) => allNode.data.type === 'origin',
                )[0]
                const originNodes = allNodes.filter((allNode) => {
                    return allNode.data.type === 'pasteSource'
                })
                setQuoteKeyRelative(originNodes, targetNode)
            }
        }
    }

    /**
     * 查找目标字段
     */
    const setQuoteKeyRelative = (originNodes, targetNode) => {
        const targetSearchData = searchFieldData(
            targetNode.data.items,
            targetNode.data.keyWord,
        )
        targetSearchData.forEach((item, index) => {
            if (item.source_id) {
                const pasteNodeFinded = originNodes.find((originNode) => {
                    return originNode.data.items.find((originItem) => {
                        if (originItem.id === item.source_id) {
                            return true
                        }
                        return false
                    })
                })
                if (pasteNodeFinded) {
                    createRelativeByNode(
                        pasteNodeFinded,
                        targetNode,
                        item,
                        index,
                    )
                }
            }
        })
    }

    /**
     * 创建节点关系
     * @param originNode 源节点
     * @param targetNode 目标节点
     * @param item 数据项
     * @param index 数据项下标
     */
    const createRelativeByNode = (originNode, targetNode, item, index) => {
        const { origin, target } = getOriginPosition(originNode, targetNode)
        let targetNodeItemPortInfo
        if (targetNode.data.expand === ExpandStatus.Retract) {
            const portId = getOriginNodeHeaderPorts(targetNode, target)
            if (portId) {
                targetNodeItemPortInfo = {
                    portId,
                    nodeId: targetNode.id,
                }
            } else {
                targetNode.addPort(
                    getPortByNode(target, -1, '', targetNode.data.expand),
                )
            }
        } else {
            targetNodeItemPortInfo = getNodeItemPortId(
                targetNode,
                index,
                target,
                10,
                item,
            )
        }

        if (originNode.data.expand === ExpandStatus.Expand) {
            const pasteNodeItemPortInfo = getPasteNodePort(
                originNode,
                item.source_id,
                origin,
            )
            addEdgeFromOriginToTarget(
                item.source_id,
                targetNode,
                targetNodeItemPortInfo?.portId || '',
                originNode,
                pasteNodeItemPortInfo?.portId || '',
            )
        } else {
            const portId = getOriginNodeHeaderPorts(originNode, origin)

            if (portId) {
                addEdgeFromOriginToTarget(
                    item.source_id,
                    targetNode,
                    targetNodeItemPortInfo?.portId,
                    originNode,
                    portId,
                )
            } else {
                const originNodeItemPortId = getPasteNodePort(
                    originNode,
                    item.source_id,
                    origin,
                    ExpandStatus.Retract,
                )
                addEdgeFromOriginToTarget(
                    item.source_id,
                    targetNode,
                    targetNodeItemPortInfo?.portId,
                    originNode,
                    originNodeItemPortId,
                )
            }
        }
        // selectOriginNodeQuoteField(originNode, item.ref_id)
    }

    /**
     *  获取左右头的桩
     */
    const getOriginNodeHeaderPorts = (originNode: Node, position) => {
        const originNodePorts = originNode.getPorts()
        let portId
        originNodePorts.forEach((originNodePort) => {
            if (
                originNodePort.group === position &&
                originNodePort.args?.type !== 'form'
            ) {
                portId = originNodePort.id || ''
            } else {
                portId = ''
            }
        })
        return portId
    }

    /**
     * 设置原节点的桩
     */
    const getPasteNodePort = (
        originNode,
        refId: string,
        position: string,
        expand: ExpandStatus = ExpandStatus.Expand,
    ) => {
        let portInfo
        const searchData = searchFieldData(
            originNode.data.items,
            originNode.data.keyWord,
        )
        originNode.data.items.forEach((originItem, index) => {
            if (originItem.id === refId) {
                if (expand === ExpandStatus.Retract) {
                    originNode.addPort(getPortByNode(position, -1, '', expand))
                } else {
                    portInfo = getNodeItemPortId(
                        originNode,
                        index,
                        position,
                        10,
                        originItem,
                    )
                }
            }
        })
        return portInfo
    }

    /**
     * 获取当前节点的portId
     * @param node 节点
     * @param index 当前下标
     * @param group port位置
     * @param limit 每页大小
     * @returns portId 找到返回对应id ，没找到生成port并返回''
     */
    const getNodeItemPortId = (node, index, group, limit, item) => {
        const itemSite = getDataShowSite(
            index,
            node.data.offset,
            limit,
            node.data.items.length,
        )
        if (itemSite === DataShowSite.CurrentPage) {
            if (node.data.type === 'origin') {
                return findOriginNodeAndPort(item.id, group)
            }
            return findPasteNodeAndPort(item.id)
        }
        if (itemSite === DataShowSite.UpPage) {
            const portId = getUpPortId(group, node)
            if (portId) {
                return {
                    portId,
                    nodeId: node.id,
                }
            }
            node.addPort(getPortByNode(group, -1, 'top'))
            return undefined
        }

        const portId = getDownPort(group, node)
        if (portId) {
            return {
                portId,
                nodeId: node.id,
            }
        }
        const showData = getCurrentShowData(
            node.data.offset,
            searchFieldData(node.data.items, node.data.keyWord),
            10,
        )
        node.addPort(
            getPortByNode(
                group,
                -1,
                'bottom',
                ExpandStatus.Expand,
                'field',
                showData.length,
            ),
        )
        return undefined
    }

    /**
     * 获取头部对应位置的坐标
     * @param group 位置
     * @param node 节点
     * @returns 坐标 找到返回对应节点 ，找不到返回头坐标
     */
    const getUpPortId = (group, node) => {
        const currentPort = node
            .getPorts()
            .filter((port) => port.args?.site === 'top' && port.group === group)
        if (currentPort && currentPort.length) {
            return currentPort[0].id
        }
        return ''
    }

    /**
     * 获取底部对应位置的坐标
     * @param group 位置
     * @param node 节点
     * @returns 坐标 找到返回对应节点 ，找不到返回头坐标
     */
    const getDownPort = (group, node) => {
        const currentPort = node
            .getPorts()
            .filter(
                (port) => port.args?.site === 'bottom' && port.group === group,
            )
        if (currentPort && currentPort.length) {
            return currentPort[0].id
        }
        return ''
    }
    /**
     * 获取原节点的方位
     */
    const getOriginPosition = (orginNode: Node, targetNode: Node) => {
        const orginNodePosition = orginNode.getPosition()
        const targetNodePosition = targetNode.getPosition()
        if (orginNodePosition.x > targetNodePosition.x) {
            return {
                origin: 'leftPorts',
                target: 'rightPorts',
            }
        }
        return {
            origin: 'rightPorts',
            target: 'leftPorts',
        }
    }
    /**
     * 查找当前标的节点ID 和portID
     * @param sourceId
     * @returns
     */
    const findPasteNodeAndPort = (sourceId: string) => {
        const portId = Object.keys(pasteNodesPortsData.quoteData).find(
            (value) => {
                return pasteNodesPortsData.quoteData[value].fieldId === sourceId
            },
        )
        if (portId) {
            return {
                portId,
                nodeId: pasteNodesPortsData.quoteData[portId],
            }
        }
        return undefined
    }

    /**
     * 查找当前目标表的节点ID 和portID
     * @param sourceId
     * @returns
     */
    const findOriginNodeAndPort = (sourceId: string, site: string) => {
        const portId = Object.keys(targetNodePortData.quoteData).find(
            (value) => {
                return (
                    targetNodePortData.quoteData[value].fieldId === sourceId &&
                    targetNodePortData.quoteData[value].site === site
                )
            },
        )
        if (portId) {
            return {
                portId,
                nodeId: targetNodePortData.quoteData[portId],
            }
        }
        return undefined
    }

    /**
     * 添加连线
     * @param targetNode 目标节点
     * @param targetPortId 目标桩
     * @param originNode 源节点
     * @param OriginPortId 源桩
     */
    const addEdgeFromOriginToTarget = (
        originItemId,
        targetNode: Node,
        targetNodePortId: string,
        originNode: Node,
        originNodePortId: string = '',
    ) => {
        if (graphCase && graphCase.current) {
            const originNodePort = last(originNode.getPorts())
            const targetNodePort = last(targetNode.getPorts())

            if (
                originNodePort &&
                originNodePort.id &&
                targetNodePort &&
                targetNodePort.id
            ) {
                if (
                    edgeRelation.selected &&
                    edgeRelation.selected === originItemId
                ) {
                    const edge = new Shape.Edge({
                        source: {
                            cell: originNode.id,
                            port: originNodePortId || originNodePort.id,
                        },
                        target: {
                            cell: targetNode.id,
                            port: targetNodePortId || targetNodePort.id,
                        },
                        attrs: {
                            line: {
                                stroke: '#126ee3',
                                strokeWidth: 1,
                            },
                        },
                    })

                    edgeRelation.addData({
                        [originItemId]: graphCase.current.addEdge(edge),
                    })
                } else {
                    const edge = new Shape.Edge({
                        source: {
                            cell: originNode.id,
                            port: originNodePortId || originNodePort.id,
                        },
                        target: {
                            cell: targetNode.id,
                            port: targetNodePortId || targetNodePort.id,
                        },
                        attrs: {
                            line: {
                                stroke: '#979797',
                                strokeWidth: 1,
                            },
                        },
                    })
                    edgeRelation.addData({
                        [originItemId]: graphCase.current.addEdge(edge),
                    })
                }
            }
        }
    }

    /**
     * 操作触发事件
     * @param optionType
     * @param data
     * @param dataNode
     */
    const optionGraphData = (currentOptionType: OptionType, data, dataNode) => {
        setOptionType(currentOptionType)
        switch (currentOptionType) {
            case OptionType.ViewOriginFormDetail:
                setEditBusinessFormId(dataNode.data.fid)
                break
            case OptionType.ViewOriginFieldDetail:
                setViewBusinessField(data)
                break

            default:
                break
        }
    }

    /**
     * 删除原表的字段关系
     */
    const deleteFieldRelation = (sourcesData) => {
        const formNode = getOriginFormNode()
        if (formNode) {
            const newItems = formNode.data.items.map((item) => {
                if (!item.source_id) {
                    return item
                }
                if (
                    sourcesData.find(
                        (sourceData) => sourceData.id === item.source_id,
                    )
                ) {
                    return {
                        ...item,
                        source_id: '',
                    }
                }
                return item
            })
            formNode.replaceData({
                ...formNode.data,
                items: newItems,
            })
        }
    }

    const deletePasteOriginInfo = (id) => {
        if (graphCase.current) {
            const allNodes = graphCase.current.getNodes()
            allNodes.forEach((allNode) => {
                if (allNode.data.infoId && allNode.data.infoId === id) {
                    allNode.replaceData({
                        ...allNode.data,
                        formInfo: {
                            ...allNode.data.formInfo,
                            info_system: '',
                        },
                        infoId: '',
                    })
                }
            })
        }
    }

    /**
     * 拖拽来源表
     * @param e 事件
     */
    const startDrag = async (
        e: React.MouseEvent<HTMLDivElement, MouseEvent>,
        pasteData: SourceFormInfo,
    ) => {
        const { fields, ...formInfos } = pasteData
        const node = graphCase?.current?.createNode({
            ...FormPasteSourceTemplate,
            height: 52 + (fields.length > 10 ? 400 : fields.length * 40) + 24,
            data: {
                ...FormPasteSourceTemplate.data,
                items: fields,
                formInfo: formInfos,
                version:
                    formInfos.checked === PasteSourceChecked.Created
                        ? 'published'
                        : 'draft',
            },
        })
        setCurrentDndNode(node)
        if (node) {
            dndCase?.current?.start(node, e.nativeEvent as any)
        }
    }

    /**
     * 画布中加入元数据平台贴源表
     * @param sourceForms
     */
    const addMetaDataSourceTable = (sourceForms: Array<SourceFormInfo>) => {
        if (graphCase && graphCase.current) {
            const allNodes = graphCase.current.getNodes()
            const nodes = allNodes.filter(
                (allNode) => allNode.shape !== 'data-origin-node',
            )
            const center = {
                x: (bodySize?.width || 1300) / 2,
                y: ((bodySize?.height || 800) - 200) / 2,
            }
            const centerLocal = graphCase.current.clientToLocal(center)
            let currentPosition
            sourceForms.forEach(({ fields, ...formInfos }, index) => {
                currentPosition = getNewPastePosition(
                    nodes,
                    centerLocal,
                    currentPosition,
                )
                if (graphCase && graphCase.current) {
                    graphCase.current.addNode({
                        ...FormPasteSourceTemplate,
                        position: currentPosition,
                        data: {
                            ...FormPasteSourceTemplate.data,
                            formInfo: formInfos,
                            items: fields,
                            expand: ExpandStatus.Retract,
                        },
                    })
                }
            })
            setPasteNodeIds([
                ...getPasteNodeIds(),
                ...sourceForms.map((sourceForm) => sourceForm.id),
            ])
        }
    }

    /**
     * 重新生成贴原表
     * @param node
     */
    const reCreatePasteForm = (node: Node) => {
        const newFormId = uuidv4()
        // 更新列表中的贴原表Id
        setPasteNodeIds([
            ...getPasteNodeIds().filter(
                (item) => item !== node.data.formInfo.id,
            ),
            newFormId,
        ])
        node.replaceData({
            ...node.data,
            formInfo: {
                ...node.data.formInfo,
                checked: PasteSourceChecked.New,
                id: newFormId,
            },
            items: node.data.items.map((item) => {
                const newId = uuidv4()
                updateTargetFieldSourceId(item.id, newId)
                return {
                    ...item,
                    id: newId,
                }
            }),
            version: 'draft',
        })
        deleteOrEditDataOriginStatus(node.data.infoId, 'edit')
    }
    /**
     *  更新业务表的贴原表关系id
     * @param originId 原id
     * @param newId 新id
     */
    const updateTargetFieldSourceId = (originId, newId) => {
        const updateNode = getOriginFormNode()
        if (updateNode) {
            updateNode.replaceData({
                ...updateNode.data,
                items: updateNode.data.items.map((item) =>
                    item.source_id === originId
                        ? {
                              ...item,
                              source_id: newId,
                          }
                        : item,
                ),
            })
        }
    }

    /**
     * 保存采集模型
     */
    const handleSaveGraph = async () => {
        if (graphCase && graphCase.current) {
            try {
                const allNodes = graphCase.current.getNodes()
                const graphData = graphCase.current.toJSON()
                const content = JSON.stringify(
                    graphData.cells
                        .filter((cell) => cell.shape !== 'edge')
                        .map((cell) => ({
                            ...cell,
                            data:
                                cell.data.type === 'dataOrigin'
                                    ? cell.data
                                    : cell.data.type === 'pasteSource'
                                    ? {
                                          fid:
                                              cell.data.formInfo?.id ||
                                              cell.data.formInfo?.fid,
                                          type: cell.data.type,
                                          infoId: cell.data.infoId,
                                          version: cell.data.version,
                                      }
                                    : {
                                          fid:
                                              cell.data.formInfo?.id ||
                                              cell.data.formInfo?.fid,
                                          type: cell.data.type,
                                      },
                        })),
                )
                const params: CollectingTableDataParams = {
                    action: 'saving',
                    business_table:
                        getOriginFormNode()?.data.items.map((item) => ({
                            field_id: item.id,
                            source_id: item.source_id,
                        })) || [],
                    source_tables: allNodes
                        .filter(
                            (allNode) => allNode.shape === 'table-paste-node',
                        )
                        .map((allNode) => ({
                            ...allNode.data.formInfo,
                            fields: allNode.data.items,
                        })),
                    task_id: taskId,
                }
                if (hasSaved) {
                    await saveCollectingDataTable(fid, params)
                } else {
                    await saveFirstCollectingDataTable(fid, params)
                }
                await saveCollectingCanvas(fid, {
                    action: 'saving',
                    content,
                    task_id: taskId,
                })
                navigator(combUrl(queryData))
                message.success(__('保存成功'))
            } catch (ex) {
                formatError(ex)
            }
        }
    }

    /**
     * 发布
     */
    const handlePublishGraph = async () => {
        if (graphCase && graphCase.current) {
            try {
                const allNodes = graphCase.current.getNodes()

                if (
                    !checkPublishContent(
                        allNodes.filter(
                            (allNode) => allNode.shape === 'table-paste-node',
                        ),
                    )
                ) {
                    return
                }
                const graphData = graphCase.current.toJSON()
                const content = JSON.stringify(
                    graphData.cells
                        .filter((cell) => cell.shape !== 'edge')
                        .map((cell) => ({
                            ...cell,
                            data:
                                cell.data.type === 'dataOrigin'
                                    ? cell.data
                                    : cell.data.type === 'pasteSource'
                                    ? {
                                          fid:
                                              cell.data.formInfo?.id ||
                                              cell.data.formInfo?.fid,
                                          type: cell.data.type,
                                          infoId: cell.data.infoId,
                                          version: 'published',
                                      }
                                    : {
                                          fid:
                                              cell.data.formInfo?.id ||
                                              cell.data.formInfo?.fid,
                                          type: cell.data.type,
                                      },
                        })),
                )
                const params: CollectingTableDataParams = {
                    action: 'publishing',
                    business_table:
                        getOriginFormNode()?.data.items.map((item) => ({
                            field_id: item.id,
                            source_id: item.source_id,
                        })) || [],
                    source_tables: allNodes
                        .filter(
                            (allNode) => allNode.shape === 'table-paste-node',
                        )
                        .map((allNode) => ({
                            ...allNode.data.formInfo,
                            fields: allNode.data.items,
                        })),
                    task_id: taskId,
                }
                if (formInfo.collection_published) {
                    await saveCollectingDataTable(fid, params)
                } else {
                    await saveFirstCollectingDataTable(fid, params)
                }
                await saveCollectingCanvas(fid, {
                    action: 'publishing',
                    content,
                    task_id: taskId,
                })
                navigator(combUrl(queryData))
                message.success(
                    formInfo.collection_published
                        ? __('更新成功')
                        : __('发布成功'),
                )
            } catch (ex) {
                formatError(ex)
            }
        }
    }

    const checkPublishContent = (allPasteNodes: Array<Node>) => {
        const bussinessNode = getOriginFormNode()
        const businessFormFields = bussinessNode?.data.items || []
        const unStanadardFields = businessFormFields.filter(
            (businessFormField) =>
                businessFormField.is_standardization_required &&
                businessFormField.standard_status !== 'normal',
        )
        const unCollectedFields = businessFormFields.filter(
            (businessFormField) => !businessFormField.source_id,
        )
        const allPasteNotSystemInfo = allPasteNodes.filter(
            (allPasteNode) => !allPasteNode.data.formInfo.info_system,
        )
        const usedFieldsId = businessFormFields.map(
            (currentBusinessField) => currentBusinessField.source_id,
        )
        const notUsedPasteForm = allPasteNodes.filter(
            (singleNodeForm) =>
                !singleNodeForm.data.items.find((singlePasteField) =>
                    usedFieldsId.includes(singlePasteField.id),
                ),
        )
        const pasteFormNotDataSource = allPasteNodes.filter(
            (allPasteNode) => !allPasteNode?.data.formInfo.datasource_id,
        )

        if (!checkBusinessTypeStatus()) {
            message.error(__('存在数据表数据和业务表数据类型不匹配的连接'))
            return false
        }
        if (unStanadardFields.length) {
            bussinessNode?.replaceData({
                ...bussinessNode.data,
                errorFieldsId: unStanadardFields.map(
                    (unStanadardField) => unStanadardField.id,
                ),
            })
            message.error('存在未标准化字段，请先进行标准化')
            return false
        }
        if (pasteFormNotDataSource.length) {
            message.error('存在数据表未配置数据源')
            return false
        }
        if (unCollectedFields.length) {
            bussinessNode?.replaceData({
                ...bussinessNode.data,
                errorFieldsId: unCollectedFields.map(
                    (unCollectedField) => unCollectedField.id,
                ),
            })
            message.error('业务表中存在字段未配置映射关系')
            return false
        }
        if (allPasteNotSystemInfo.length) {
            allPasteNotSystemInfo.forEach((pasteNode) => {
                pasteNode.replaceData({
                    ...pasteNode.data,
                    errorStatus: true,
                })
            })
            message.error('存在未配置信息系统与数据表间的映射关系')
            return false
        }
        if (notUsedPasteForm.length) {
            message.error(__('存在未使用的数据表'))
            notUsedPasteForm.forEach((pasteNode) => {
                pasteNode.replaceData({
                    ...pasteNode.data,
                    errorStatus: true,
                })
            })
            return false
        }
        return true
    }
    /**
     * 刷新图
     */
    const refreshDataTables = async (pasteNodes: Array<Node>) => {
        if (taskId) {
            try {
                const results = await checkDataTables({
                    ids: pasteNodes.map(
                        (pasteNode) => pasteNode.data.formInfo.id,
                    ),
                    task_id: taskId,
                })
                pasteNodes.forEach((pasteNode) => {
                    pasteNode.replaceData({
                        ...pasteNode.data,
                        formInfo: {
                            ...pasteNode.data.formInfo,
                            checked: results.find(
                                (result) =>
                                    result.id === pasteNode.data.formInfo.id,
                            )?.is_consistent
                                ? PasteSourceChecked.Created
                                : pasteNode.data.formInfo.checked,
                        },
                    })
                })
                getCollectCompleteStatus()
                return pasteNodes.filter((pasteNode) => {
                    return !results.find(
                        (result) => result.id === pasteNode.data.formInfo.id,
                    )?.is_consistent
                })
            } catch (ex) {
                formatError(ex)
                return null
            }
        }
        return null
    }

    /**
     * 完成采集
     */
    const handleCompeleteCollect = async () => {
        if (graphCase && graphCase.current) {
            const pasteNodes = graphCase.current
                .getNodes()
                .filter(
                    (allNode) =>
                        allNode.shape === 'table-paste-node' &&
                        allNode.data.formInfo.checked ===
                            PasteSourceChecked.New,
                )
            if (pasteNodes.length) {
                const resultNodes = await refreshDataTables(pasteNodes)
                if (resultNodes) {
                    if (resultNodes.length) {
                        message.error(
                            __('${formNames}未完成采集', {
                                formNames: resultNodes
                                    .map(
                                        (resultNode) =>
                                            resultNode.data.formInfo.name,
                                    )
                                    .join('、'),
                            }),
                        )
                    } else {
                        await completeCollectOrProcess(fid, {
                            task_id: taskId || '',
                        })
                        navigator(combUrl(queryData))
                    }
                }
            } else {
                await completeCollectOrProcess(fid, {
                    task_id: taskId || '',
                })
                navigator(combUrl(queryData))
            }
        }
    }

    const editDataOriginInfo = (values) => {
        if (graphCase && graphCase.current) {
            const allPasteNodes = graphCase.current
                .getNodes()
                .filter(
                    (currentNode) => currentNode.shape === 'table-paste-node',
                )
            allPasteNodes.forEach((currentNode) => {
                if (
                    editDataOriginNode &&
                    currentNode.data.infoId ===
                        editDataOriginNode.data.dataInfo.id
                ) {
                    currentNode.replaceData({
                        ...currentNode.data,
                        formInfo: {
                            ...currentNode.data.formInfo,
                            info_system: values.name,
                        },
                    })
                }
            })
            editDataOriginNode?.replaceData({
                ...editDataOriginNode?.data,
                dataInfo: {
                    ...editDataOriginNode?.data.dataInfo,
                    ...values,
                },
            })
            setEditDataOriginNode(null)
        }
    }

    /**
     * 更新或删除数据表
     */
    const deleteOrEditDataOriginStatus = (
        dataOriginId,
        status: 'del' | 'edit' | 'reCreatePorts',
    ) => {
        if (graphCase && graphCase.current) {
            const dataOriginNodes = graphCase.current
                .getNodes()
                .filter((allNode) => allNode.shape === 'data-origin-node')
            const currentFormDataOriginNode = dataOriginNodes.find(
                (singleDataNode) =>
                    singleDataNode.data.dataInfo.id === dataOriginId,
            )
            if (currentFormDataOriginNode) {
                if (status === 'del') {
                    graphCase.current.removeCell(currentFormDataOriginNode.id)
                } else if (status === 'reCreatePorts') {
                    currentFormDataOriginNode.removePorts()
                    currentFormDataOriginNode.addPort({
                        group: 'leftPorts',
                        args: {
                            type: 'dataOrigin',
                            site: 'left',
                        },
                        zIndex: 10,
                    })
                    currentFormDataOriginNode.addPort({
                        group: 'rightPorts',
                        args: {
                            type: 'dataOrigin',
                            site: 'right',
                        },
                        zIndex: 10,
                    })
                } else if (status === 'edit') {
                    currentFormDataOriginNode.replaceData({
                        ...currentFormDataOriginNode.data,
                        editStatus: true,
                    })
                }
            }
        }
    }
    const createDataOriginByPaste = (node: Node) => {
        if (graphCase && graphCase.current) {
            const { x, y } = node.getPosition()
            const newId = uuidv4()
            const newDataNode = graphCase.current.addNode({
                ...DataOriginTemplate,
                position: {
                    x: x - 160,
                    y,
                },
                data: {
                    type: 'dataOrigin',
                    dataInfo: {
                        name: node.data.formInfo.info_system,
                        id: newId,
                    },
                    editStatus:
                        model === ViewModel.ModelEdit &&
                        node.data.formInfo.checked !==
                            PasteSourceChecked.Created,
                },
            })
            newDataNode.addPort({
                group: 'rightPorts',
                args: {
                    type: 'dataOrigin',
                    site: 'right',
                },
                zIndex: 10,
            })
            node.setData({
                ...node.data,
                infoId: newId,
            })
        }
    }

    /**
     * 检查当前贴源表是否被使用
     * @param node 贴源表节点
     * @returns true 用到，false 未用到
     */
    const checkCurrentNodeExistRelation = (node) => {
        const businessNode = getOriginFormNode()
        const findData = businessNode?.data.items.find((fieldItem) =>
            node.data.items.find(
                (pasteFieldItem) => pasteFieldItem.id === fieldItem.source_id,
            ),
        )
        return !!findData
    }

    /**
     * 删除数据表
     * @param node
     */
    const deletePasteForm = (node) => {
        deleteFieldRelation(node.data.items)
        if (graphCase && graphCase.current) {
            if (node.data.formInfo.checked === PasteSourceChecked.Created) {
                deleteOrEditDataOriginStatus(node.data.infoId, 'del')
            } else {
                deleteOrEditDataOriginStatus(node.data.infoId, 'reCreatePorts')
            }
            graphCase.current.removeCell(node.id)
        }
    }
    return (
        <div className={styles.main}>
            <GraphToolBar
                targetFormInfo={formInfo}
                onSaveGraph={() => {
                    handleSaveGraph()
                }}
                onPublishGraph={() => {
                    handlePublishGraph()
                }}
                onChangeGraphSize={changeGraphSize}
                onShowAllGraphSize={showAllGraphSize}
                graphSize={graphSize}
                onUpdateFormInfo={(data) => {}}
                model={getModel()}
                originNode={originFormNode}
                queryData={{ ...queryData }}
                onMovedToCenter={movedToCenter}
                isShowEdit={false}
                infoStatus={formInfo?.collection_published}
                onSwitchModel={() => {
                    if (graphCase && graphCase.current) {
                        graphCase.current.getNodes().forEach((currentNode) => {
                            currentNode.replaceData({
                                ...currentNode.data,
                                switchStatus: true,
                            })
                        })
                    }
                }}
                onComplete={() => {
                    handleCompeleteCollect()
                }}
                isComplete={isCompleted}
            />
            <div
                className={styles.graphContent}
                style={{
                    height: 'calc(100% - 52px)',
                }}
            >
                <DragBox
                    defaultSize={
                        getModel() !== ViewModel.ModelEdit
                            ? [0, 100]
                            : defaultSize
                    }
                    minSize={
                        getModel() !== ViewModel.ModelEdit
                            ? [0, 500]
                            : [250, 500]
                    }
                    maxSize={[300, Infinity]}
                    onDragEnd={(size) => {
                        setDefaultSize(size)
                    }}
                    gutterStyles={{
                        background: '#EFF2F5',
                        width: getModel() !== ViewModel.ModelEdit ? 0 : '5px',
                        cursor: 'ew-resize',
                    }}
                    hiddenElement={
                        getModel() !== ViewModel.ModelEdit ? 'left' : ''
                    }
                    gutterSize={getModel() !== ViewModel.ModelEdit ? 1 : 5}
                    existPadding={false}
                >
                    {getModel() !== ViewModel.ModelEdit ? (
                        <div />
                    ) : (
                        <div
                            ref={dndContainer}
                            className={styles.dndDrag}
                            onClick={() => {
                                if (optionType !== OptionType.NoOption) {
                                    setOptionType(OptionType.NoOption)
                                    setEditBusinessFormId('')
                                    setViewBusinessField(null)
                                }
                            }}
                        >
                            <SelectPasteSourceMenu
                                onStartDrag={startDrag}
                                onClick={(type) => {
                                    setSelectFormType(type)
                                }}
                                onSelectMetaData={addMetaDataSourceTable}
                                existFormIds={getPasteNodeIds()}
                                defaultMetaForms={getDefaultMetaForms()}
                            />
                        </div>
                    )}
                    <div
                        style={{
                            display: 'flex',
                            width: '100%',
                            height: '100%',
                        }}
                        ref={graphBody}
                        onClick={() => {
                            if (optionType !== OptionType.NoOption) {
                                setOptionType(OptionType.NoOption)
                                setEditBusinessFormId('')
                                setViewBusinessField(null)
                            }
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
                        />
                    </div>
                </DragBox>
                {optionType === OptionType.ViewOriginFormDetail && (
                    <ViewFormDetail
                        formId={editBusinessFormId}
                        mid={mid}
                        onClose={() => {
                            setEditBusinessFormId('')
                            setOptionType(OptionType.NoOption)
                        }}
                    />
                )}
                {optionType === OptionType.ViewOriginFieldDetail && (
                    <ViewFieldDetail
                        data={{
                            ...viewBusinessField,
                            data_length:
                                viewBusinessField.data_length === 0
                                    ? '0'
                                    : viewBusinessField.data_length,
                            data_accuracy:
                                viewBusinessField.data_accuracy === 0
                                    ? '0'
                                    : viewBusinessField.data_accuracy,
                        }}
                        node={formOriginNode}
                        onClose={() => {
                            setViewBusinessField(null)
                            setOptionType(OptionType.NoOption)
                        }}
                    />
                )}

                {!!editPasteFormNode &&
                    optionType === OptionType.ViewPasteFormInfo && (
                        <ViewPasteFormDetail
                            formInfo={editPasteFormNode.data.formInfo}
                            onClose={() => {
                                setEditPasteFormNode(null)
                            }}
                        />
                    )}

                {!!editField &&
                    optionType === OptionType.ViewPasteFieldInfo && (
                        <ViewPasteFieldDetail
                            fieldInfo={editField}
                            onClose={() => {
                                setEditPasteFormNode(null)
                            }}
                        />
                    )}
            </div>
            <DataForm
                open={selectFormType === addFormType.FormData}
                onCancel={() => {
                    setSelectFormType(null)
                }}
                onConfirm={(values) => {
                    createPasteSource({
                        ...values,
                        id: uuidv4(),
                        checked: PasteSourceChecked.New,
                        info_system: '',
                    })

                    setSelectFormType(null)
                }}
            />
            <DataForm
                open={!!editPasteFormNode && model === ViewModel.ModelEdit}
                onCancel={() => {
                    setEditPasteFormNode(null)
                }}
                defaultData={editPasteFormNode?.data.formInfo}
                title={__('编辑数据表')}
                onConfirm={(values) => {
                    editPasteFormNode?.replaceData({
                        ...editPasteFormNode?.data,
                        formInfo: {
                            ...editPasteFormNode.data.formInfo,
                            ...values,
                        },
                        version: 'draft',
                    })
                    setEditPasteFormNode(null)
                }}
                node={editPasteFormNode}
            />

            <DataSource
                open={selectFormType === addFormType.DataSource}
                onCancel={() => {
                    setSelectFormType(null)
                }}
                onConfirm={(values) => {
                    createDataOrigin({
                        ...values,
                        id: uuidv4(),
                    })
                    setSelectFormType(null)
                }}
            />
            <DataSource
                open={!!editDataOriginNode}
                onCancel={() => {
                    setEditDataOriginNode(null)
                }}
                title={__('编辑信息系统')}
                defaultData={editDataOriginNode?.data.dataInfo}
                onConfirm={(values) => {
                    editDataOriginInfo(values)
                }}
            />
            <AddPasteFormField
                node={addFieldsNode}
                onCancel={() => {
                    setAddFieldsNode(null)
                }}
                onConfirm={() => {
                    if (addFieldsNode) {
                        loadPortsForPasteForm(addFieldsNode)
                        updateAllPortAndEdge()
                    }
                    setAddFieldsNode(null)
                }}
                onReCreateForm={reCreatePasteForm}
            />
            <EditPasteField
                open={!!editField && model === ViewModel.ModelEdit}
                node={editFieldNode}
                onCancel={() => {
                    setEditField(null)
                    setEditFieldNode(null)
                }}
                field={editField}
                onConfirm={(values) => {
                    if (editFieldNode) {
                        editFieldNode.replaceData({
                            ...editFieldNode.data,
                            items: editFieldNode.data.items.map((item) =>
                                item.id === editField.id
                                    ? {
                                          ...item,
                                          ...values,
                                      }
                                    : item,
                            ),
                            version: 'draft',
                        })
                        if (
                            editFieldNode.data.formInfo.checked !==
                            PasteSourceChecked.New
                        ) {
                            reCreatePasteForm(editFieldNode)
                            loadPortsForPasteForm(editFieldNode)
                            updateAllPortAndEdge()
                        }
                    }

                    setEditField(null)
                    setEditFieldNode(null)
                }}
            />
            {viewTableNode && (
                <FieldTableView
                    node={viewTableNode}
                    formId={viewTableNode?.data?.fid}
                    onClose={() => {
                        setViewTableNode(null)
                    }}
                    items={viewTableNode.data.items}
                    model="view"
                />
            )}

            {dataOriginConfigNode && (
                <ConfigDataOrigin
                    node={dataOriginConfigNode}
                    onClose={() => {
                        setDataOriginConfigNode(null)
                    }}
                    reCreatePasteForm={reCreatePasteForm}
                />
            )}
        </div>
    )
}

export default DataCollection
