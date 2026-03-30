import { Graph as GraphType, Node, Shape } from '@antv/x6'
import { Dnd } from '@antv/x6-plugin-dnd'
import { useGetState, useSize, useUnmount } from 'ahooks'
import { Button, Form, message, Modal } from 'antd'
import { last, noop } from 'lodash'
import * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { ExclamationCircleFilled } from '@ant-design/icons'
import {
    formatError,
    formsEnumConfig,
    getFormQueryItem,
    getFormsFieldsList,
    getIndicatorModel,
    saveIndicatorModelCanvas,
    updateIndicatorModel,
} from '@/core'
import { SourceFormInfo } from '@/core/apis/businessGrooming/index.d'
import { instancingGraph } from '@/core/graph/graph-config'
import { X6PortalProvider } from '@/core/graph/helper'
import { loadPlugins, Plugins } from '@/core/graph/plugin'
import { getActualUrl } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import ConfigDetail from '../BussinessConfigure/ConfigDetail'
import ViewConfigDetail from '../BussinessConfigure/ViewConfigDetail'
import { checkNameRepeat } from '../BussinessConfigure/helper'
import formOriginNode from '../DataCollection/FormOriginNode'
import ViewPasteFieldDetail from '../DataCollection/ViewPasteFieldDetail'
import ViewPasteFormDetail from '../DataCollection/ViewPasteFormDetail'
import { getNewPastePosition, getPortByNode } from '../DataCollection/helper'
import DragBox from '../DragBox'
import FieldTableView from '../FormGraph/FieldTableView'
import ViewFieldDetail from '../FormGraph/ViewFieldDetail'
import ViewFormDetail from '../FormGraph/ViewFormDetail'
import FormQuoteData from '../FormGraph/formDataQuoteData'
import {
    combUrl,
    DataShowSite,
    ExpandStatus,
    getCurrentShowData,
    getDataCurrentPageIndex,
    getDataShowSite,
    getQueryData,
    OptionType,
    searchFieldData,
    wheellDebounce,
} from '../FormGraph/helper'
import businessFormNode from './BusinessForm'
import FloatBar from './FloatBar'
import GraphToolBar from './GraphToolBar'
import SelectPasteSourceMenu from './SelectPasteSourceMenu'
import { NodeAttribute, OptionModel, ViewModel } from './const'
import {
    checkCurrentFormOutFields,
    defaultPorts,
    FormBusinessNodeTemplate,
    viewPorts,
} from './helper'
import __ from './locale'
import styles from './styles.module.less'

let waitForUnmount: Promise<any> = Promise.resolve()

interface MetricModelType {
    optionModel?: OptionModel
    modelId?: string
    metricModelId?: string
    metricId?: string
    getUnregisterGraph?: (unRegistryFunc: Function) => void
    onModelFormError?: (modelId) => void
}

const MetricModel = ({
    optionModel,
    modelId = '',
    metricModelId = '',
    metricId,
    getUnregisterGraph = noop,
    onModelFormError = noop,
}: MetricModelType) => {
    const graphCase = useRef<GraphType>()
    const dndCase = useRef<Dnd>()
    const graphBody = useRef<HTMLDivElement>(null)
    const bodySize = useSize(graphBody)
    const container = useRef<HTMLDivElement>(null)
    // const MetricRef = useRef<any>(null)
    const MetricForm = Form.useForm()[0]
    const dndContainer = useRef<HTMLDivElement>(null)
    const navigator = useNavigate()
    const [model, setModel, getModel] = useGetState<ViewModel>(
        ViewModel.ModelEdit,
    )
    const [optionStatus, setOptionStatus] = useState<string>(
        OptionModel.MetricDetail,
    )
    const [defaultSize, setDefaultSize] = useState<Array<number>>([15, 85])
    const [graphSize, setGraphSize] = useState(100)
    const [searchParams, setSearchParams] = useSearchParams()
    const { search } = useLocation()
    const [queryData, setQueryData] = useState<any>(getQueryData(search))
    const mid = searchParams.get('mid') || ''
    const defaultOption = searchParams.get('optionModel') || ''
    const redirect = searchParams.get('redirect')
    const taskId = searchParams.get('taskId') || ''
    const iid = searchParams.get('iid') || ''
    const indicatorId = searchParams.get('indicatorId') || ''
    const [formNodeOfBusiness, setFormNodeOfBusiness, getFormNodeOfBusiness] =
        useGetState<Node | null>(null)

    const [deleteNode, setDeleteNode] = useState<Node | null>(null)
    const [editPasteFormNode, setEditPasteFormNode] = useState<Node | null>(
        null,
    )
    const [usedFormsId, setUsedFormsId, getUsedFormsId] = useGetState<
        Array<string>
    >([])
    const [viewDataField, setViewDataField] = useState<any>(null)
    const [optionType, setOptionType] = useState<OptionType>(
        OptionType.NoOption,
    )
    const [editBusinessFormId, setEditBusinessFormId] = useState<string>('')
    const [viewBusinessField, setViewBusinessField] = useState<any>(null)
    const [viewTableId, setViewTableId] = useState<string>('')
    const [viewTableFields, setViewTableFields] = useState<any>(null)
    const [pasteNodeIds, setPasteNodeIds, getPasteNodeIds] = useGetState<
        Array<string>
    >([])
    const [defaultMetaForms, setDefaultMetaForms] = useState<
        Array<SourceFormInfo>
    >([])
    const [showconfigDetail, setShowconfigDetail] = useState<boolean>(false)
    const [modelIndicatorId, setModelIndicatorId] = useState<
        string | undefined
    >('')
    const [stage, setStage] = useState<number>(0)
    const [editingMetricId, setEditingMetricId] = useState<string>('')
    const [editingModelId, setEditingModelId, getEditingModelId] =
        useGetState<string>(iid || '')
    const [metricModelInfo, setMetricModelInfo] = useState<any>({})
    const [dataTypeOptions, setDataTypeOptions] = useState<Array<any>>([])
    const targetNodePortData = useMemo(() => {
        return new FormQuoteData({})
    }, [])
    const businessNodesPortsData = useMemo(() => {
        return new FormQuoteData({})
    }, [])

    const edgeRelation = useMemo(() => {
        return new FormQuoteData({})
    }, [])
    const [noneDataStatus, setNoneDataStatus] = useState<boolean>(false)

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
        const promise = new Promise((resolve) => {
            waitForUnmount.then(() => {
                GraphType.registerPortLayout(
                    'IFormItemLeftPosition',
                    (portsPositionArgs) => {
                        return portsPositionArgs.map((_, index) => {
                            return {
                                position: {
                                    x: 0,
                                    y:
                                        _.expand === ExpandStatus.Expand
                                            ? getYPosition(
                                                  _.site,
                                                  _.index,
                                                  _.length,
                                              )
                                            : 28,
                                },
                                zIndex: 99,
                                angle: 0,
                            }
                        })
                    },
                )
                GraphType.registerPortLayout(
                    'IFormItemRightPosition',
                    (portsPositionArgs) => {
                        return portsPositionArgs.map((_, index) => {
                            return {
                                position: {
                                    x: 400,
                                    y:
                                        _.expand === ExpandStatus.Expand
                                            ? getYPosition(
                                                  _.site,
                                                  _.index,
                                                  _.length,
                                              )
                                            : 28,
                                },
                                zIndex: 99,
                                angle: 0,
                            }
                        })
                    },
                )
                GraphType.registerPortLayout(
                    'IDefaultOriginLeftPosition',
                    (portsPositionArgs) => {
                        return portsPositionArgs.map((_, index) => {
                            return {
                                position: {
                                    x: 27,
                                    y: 40,
                                },
                                zIndex: 99,
                                angle: 0,
                            }
                        })
                    },
                )
                GraphType.registerPortLayout(
                    'IDefaultOriginRightPosition',
                    (portsPositionArgs) => {
                        return portsPositionArgs.map((_, index) => {
                            return {
                                position: {
                                    x: 83,
                                    y: 40,
                                },
                                zIndex: 99,
                                angle: 0,
                            }
                        })
                    },
                )
                return () => {
                    unRegistryPort()
                }
            })
        })
        waitForUnmount = promise
    }, [])

    const formBusinessNodeName = businessFormNode([
        () => graphCase,
        () => (node: Node) => {
            if (getModel() === ViewModel.ModelEdit) {
                loadPortsForBusinessForm(node)
            } else {
                clearAllNodePorts()
            }
            updateAllPortAndEdge()
        },
        () => optionGraphData,
        () => (node) => {
            setViewTableId(node.data.fid)
            setViewTableFields(node.data.items)
        },
        () => (node) => {
            if (graphCase && graphCase.current) {
                if (node.data.formAttr === NodeAttribute.InForm) {
                    if (node.data.relationData.relations.length) {
                        setDeleteNode(node)
                    } else {
                        graphCase.current.removeNode(node)
                    }
                } else {
                    setDeleteNode(node)
                }
            }
        },
        () => loadPortsForBusinessForm,
        () => model,
        () => edgeRelation,
        () => dataTypeOptions,
    ])
    // 注册目标表节点
    useUnmount(() => {
        if (graphCase && graphCase.current) {
            graphCase.current.dispose()
        }
    })

    useEffect(() => {
        initEditStatus()
        getEnumConfig()
        const graph = instancingGraph(container.current, {
            panning: true,
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
                snap: true,
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
                        zIndex: -1,
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
            if (iid) {
                loadOriginTable(iid)
            }
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
                if (sourcePortId && targetPortId) {
                    if (
                        sourceCell?.data.formAttr === NodeAttribute.InForm &&
                        sourceCell?.data.relationData?.relations?.length
                    ) {
                        message.error(__('当前表已经作为输入源不能作为输出源'))
                        graph.removeCell(edge.id)
                    } else if (
                        targetCell?.data.formAttr === NodeAttribute.outForm
                    ) {
                        message.error(__('当前表已经作为输出源不能作为输入源'))
                        graph.removeCell(edge.id)
                    } else if (targetCell && sourceCell) {
                        const sourceField = sourceCell.data.items.find(
                            (field) =>
                                field.id ===
                                businessNodesPortsData.quoteData[sourcePortId]
                                    ?.fieldId,
                        )
                        const target_field = targetCell.data.items.find(
                            (field) =>
                                field.id ===
                                businessNodesPortsData.quoteData[targetPortId]
                                    ?.fieldId,
                        )
                        const relationSrcFields =
                            targetCell.data.relationData.relations.map(
                                (relation) => relation.src_field,
                            )

                        if (sourceField && target_field) {
                            if (
                                sourceCell.data.items.find((srcField) =>
                                    relationSrcFields.includes(srcField.id),
                                )
                            ) {
                                message.error(
                                    __(
                                        '两张业务表已建立关系，请删除之前关系后再重新建立关系！',
                                    ),
                                )
                                graph.removeCell(edge.id)
                            } else if (
                                targetCell.data.relationData.relations.find(
                                    (currentRelation) =>
                                        currentRelation.target_field ===
                                        target_field.id,
                                )
                            ) {
                                message.error(
                                    __(
                                        '当前字段已经被关联，请删除之前关系后再重新建立关系！',
                                    ),
                                )
                                graph.removeCell(edge.id)
                            } else if (
                                target_field.data_type &&
                                sourceField.data_type &&
                                target_field.data_type === sourceField.data_type
                            ) {
                                if (
                                    sourceCell.data.formAttr ===
                                    NodeAttribute.InForm
                                ) {
                                    sourceCell.replaceData({
                                        ...sourceCell.data,
                                        formAttr: NodeAttribute.outForm,
                                        relationData: null,
                                    })
                                }
                                targetCell.replaceData({
                                    ...targetCell.data,
                                    relationData: {
                                        ...targetCell.data.relationData,
                                        relations: [
                                            ...targetCell.data.relationData
                                                .relations,
                                            {
                                                src_field: sourceField.id,
                                                target_field: target_field.id,
                                            },
                                        ],
                                    },
                                })
                                edgeRelation.addData({
                                    [sourceField.id]: edge,
                                })
                            } else {
                                message.error(
                                    __('数据类型一致的字段才能相互连接'),
                                )
                                graph.removeCell(edge.id)
                            }
                        } else {
                            graph.removeCell(edge.id)
                        }
                    } else {
                        graph.removeCell(edge.id)
                    }
                }
            })

            graph.on('node:added', ({ node }) => {
                if (getModel() === ViewModel.ModelEdit) {
                    loadPortsForBusinessForm(node)
                }
                setUsedFormsId([...getUsedFormsId(), node.data.fid])
            })

            graph.on('node:removed', ({ node }) => {
                setUsedFormsId(
                    getUsedFormsId().filter(
                        (usedFormId) => usedFormId !== node.data.fid,
                    ),
                )
            })
        }
    }, [])

    useEffect(() => {
        if (graphCase && graphCase.current && metricModelId) {
            setEditingModelId(metricModelId)
            graphCase.current.clearCells()
            businessNodesPortsData.clearData()
            loadOriginTable(metricModelId)
        }
    }, [metricModelId])

    useEffect(() => {
        // 重新指标数据
        setModelIndicatorId(metricId?.split(',')[0])
    }, [metricId])

    useEffect(() => {
        if (deleteNode) {
            confirm({
                title: __('确认要移除业务表吗？'),
                icon: <ExclamationCircleFilled style={{ color: '#F5222D' }} />,
                content: __(
                    '移除后该业务表与其他业务表间的连接线均被删除无法找回，请谨慎操作！',
                ),
                okText: __('确认'),
                cancelText: __('取消'),
                onOk: () => {
                    deleteFieldRelation(deleteNode)
                },
                onCancel: () => {
                    setDeleteNode(null)
                },
            })
        }
    }, [deleteNode])

    /**
     * 注销画布注册的桩
     */
    const unRegistryPort = () => {
        GraphType.unregisterPortLayout('IFormItemRightPosition')
        GraphType.unregisterPortLayout('IFormItemLeftPosition')
        GraphType.unregisterPortLayout('IDefaultOriginLeftPosition')
        GraphType.unregisterPortLayout('IDefaultOriginRightPosition')
    }

    const initEditStatus = () => {
        const querySearch = getQueryData(search)
        if (iid) {
            setEditingModelId(iid)
        }
        if (optionModel) {
            if (
                optionModel === OptionModel.CreateModel ||
                optionModel === OptionModel.EditModel
            ) {
                setModel(ViewModel.ModelEdit)
            } else {
                setModel(ViewModel.ModelView)
            }
            setOptionStatus(optionModel)
        } else if (defaultOption) {
            if (
                defaultOption === OptionModel.CreateModel ||
                defaultOption === OptionModel.EditModel
            ) {
                setModel(ViewModel.ModelEdit)
            } else {
                setModel(ViewModel.ModelView)
            }
            setOptionStatus(defaultOption)
        }
    }

    /**
     * 加载目标表
     */
    const loadOriginTable = async (dataId) => {
        try {
            const { canvas, name, id, description } = await getIndicatorModel(
                mid || modelId,
                dataId,
            )
            setMetricModelInfo({
                name,
                id,
                description,
            })
            if (canvas) {
                if (graphCase && graphCase.current) {
                    const graphDatas = JSON.parse(canvas)
                    const formIds = graphDatas.map(
                        (graphData) => graphData.data.fid,
                    )

                    const [formsField, formsInfo] = await Promise.all([
                        Promise.all(
                            formIds.map((formId) =>
                                getFormsFieldsList(formId, {
                                    limit: 999,
                                }).catch((error) => {
                                    if (
                                        error?.data?.code ===
                                        'BusinessGrooming.Form.FormNotExist'
                                    ) {
                                        return Promise.resolve(null)
                                    }
                                    return Promise.reject(error)
                                }),
                            ),
                        ),
                        Promise.all(
                            formIds.map((formId) =>
                                getFormQueryItem(formId).catch((error) => {
                                    if (
                                        error?.data?.code ===
                                        'BusinessGrooming.Form.FormNotExist'
                                    ) {
                                        message.error(
                                            __(
                                                '模型中存在业务表被删除，请检查',
                                            ),
                                        )
                                        onModelFormError(dataId)
                                        return Promise.resolve(null)
                                    }
                                    return Promise.reject(error)
                                }),
                            ),
                        ),
                    ])
                    graphDatas.forEach((graphData, index) => {
                        if (formsField[index] && formsInfo[index]) {
                            initLoadBusinessForm(
                                graphData,
                                formsField[index].entries,
                                formsInfo[index],
                            )
                        }
                    })
                    if (graphDatas.length > 1) {
                        checkFormRelations()
                        updateAllPortAndEdge()
                    }
                    const multiple = graphCase.current.zoom()
                    if (multiple > 1) {
                        graphCase.current.zoomTo(1)
                        setGraphSize(100)
                    } else {
                        const showSize = Math.round(multiple * 100)
                        setGraphSize(showSize - (showSize % 5))
                    }
                    movedToCenter()
                    setUsedFormsId(formIds)
                    if (getModel() === ViewModel.ModelView) {
                        setShowconfigDetail(true)
                    }
                }
            } else if (defaultOption === OptionModel.CreateMetric) {
                setNoneDataStatus(true)
            }
        } catch (ex) {
            formatError(ex)
        }
    }

    const checkFormRelations = () => {
        if (graphCase && graphCase.current) {
            const allNodes = graphCase.current.getNodes()
            let errorStatus = false
            const inFormNodes = allNodes.filter(
                (allNode) => allNode.data.formAttr === NodeAttribute.InForm,
            )
            const outFormNodes = allNodes.filter(
                (allNode) => allNode.data.formAttr === NodeAttribute.outForm,
            )
            inFormNodes.forEach((inFormNode) => {
                const relationDatas = inFormNode.data.relationData.relations
                let newRelations = relationDatas
                let errorDataIds: Array<any> = []
                if (relationDatas && relationDatas.length) {
                    relationDatas.forEach((relation) => {
                        const targetField = inFormNode.data.items.find(
                            (field) => field.id === relation.target_field,
                        )
                        let srcField
                        const srcNode = outFormNodes.find((outFormNode) => {
                            const findedSrcField = outFormNode.data.items.find(
                                (field) => field.id === relation.src_field,
                            )
                            if (findedSrcField) {
                                srcField = findedSrcField
                            }
                            return !!findedSrcField
                        })
                        if (!targetField) {
                            newRelations = newRelations.filter(
                                (newRelation) =>
                                    newRelation.target_field !==
                                    relation.target_field,
                            )
                            errorStatus = true
                        } else if (!srcNode) {
                            newRelations = newRelations.filter(
                                (newRelation) =>
                                    newRelation.src_field !==
                                    relation.src_field,
                            )
                            errorStatus = true
                        } else if (
                            srcNode &&
                            srcField &&
                            targetField &&
                            srcField.data_type !== targetField.data_type
                        ) {
                            errorDataIds = errorDataIds.includes(targetField.id)
                                ? errorDataIds
                                : [...errorDataIds, targetField.id]
                            srcNode.replaceData(
                                {
                                    ...srcNode.data,
                                    errorDataIds:
                                        srcNode.data.errorDataIds.includes(
                                            srcField.id,
                                        )
                                            ? srcNode.data.errorDataIds
                                            : [
                                                  ...srcNode.data.errorDataIds,
                                                  srcField.id,
                                              ],
                                },
                                { silent: true },
                            )
                        }
                    })
                    inFormNode.replaceData(
                        {
                            ...inFormNode.data,
                            relationData: {
                                ...inFormNode.data.relationData,
                                relations: newRelations,
                            },
                            errorDataIds,
                        },
                        { silent: true },
                    )
                }
            })
            if (errorStatus) {
                message.error('节点被删除或者节点字段被删除')
            }
        }
    }
    /**
     * 加载目标表数据
     * @param targetNodeData 目标表
     * @param itemsData 数据
     */
    const initLoadBusinessForm = (targetNodeData, itemsData, info) => {
        try {
            if (graphCase?.current) {
                const targetNode = graphCase.current.addNode({
                    ...targetNodeData,
                    ports:
                        getModel() === ViewModel.ModelEdit
                            ? defaultPorts
                            : viewPorts,
                    data: {
                        ...targetNodeData.data,
                        expand: ExpandStatus.Expand,
                        fid: info.id,
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
                                ...restData,
                            }
                        }),
                        formInfo: info,
                        singleSelectedId: '',
                        keyWord: '',
                        errorDataIds: [],
                    },
                })
                if (getModel() === ViewModel.ModelEdit) {
                    loadPortsForBusinessForm(targetNode)
                }
            }
        } catch (ex) {
            formatError(ex)
        }
    }
    // 获取枚举值
    const getEnumConfig = async () => {
        const enumConfig = await formsEnumConfig()
        setDataTypeOptions(enumConfig?.data_type)
    }

    /**
     * 业务表建桩
     */
    const loadPortsForBusinessForm = (node: Node) => {
        node.removePorts()
        clearPastePortRecord(node)
        const site = formNodeOfBusiness
            ? getPastePosition(node, formNodeOfBusiness)
            : 'rightPorts'
        const showData = getCurrentShowData(
            node.data.offset,
            searchFieldData(node.data.items, node.data.keyWord),
            10,
        )
        showData.forEach((item, index) => {
            if (node.data.expand === ExpandStatus.Retract) {
                const leftPortId = getOriginNodeHeaderPorts(node, 'leftPorts')
                const rightPortId = getOriginNodeHeaderPorts(node, 'rightPorts')
                if (!leftPortId) {
                    node.addPort(getPortByNode(site, -1, '', node.data.expand))
                    addPasteNodePortData(
                        last(node.getPorts())?.id,
                        node.id,
                        item.id,
                        'leftPorts',
                    )
                } else {
                    addPasteNodePortData(
                        leftPortId,
                        node.id,
                        item.id,
                        'leftPorts',
                    )
                }
                if (!rightPortId) {
                    node.addPort(getPortByNode(site, -1, '', node.data.expand))
                    addPasteNodePortData(
                        last(node.getPorts())?.id,
                        node.id,
                        item.id,
                        'rightPorts',
                    )
                } else {
                    addPasteNodePortData(
                        rightPortId,
                        node.id,
                        item.id,
                        'rightPorts',
                    )
                }
            } else if (
                !(item.is_standardization_required && !item.standard_id)
            ) {
                node.addPort(getPortByNode('rightPorts', index))
                addPasteNodePortData(
                    last(node.getPorts())?.id,
                    node.id,
                    item.id,
                    'rightPorts',
                )
                node.addPort(getPortByNode('leftPorts', index))
                addPasteNodePortData(
                    last(node.getPorts())?.id,
                    node.id,
                    item.id,
                    'leftPorts',
                )
            }
        })
    }

    /**
     * 清除制定贴原表的数据
     */
    const clearPastePortRecord = (node: Node) => {
        Object.keys(businessNodesPortsData.quoteData).forEach((portId) => {
            if (businessNodesPortsData.quoteData[portId].nodeId === node.id) {
                businessNodesPortsData.deleteData(portId)
            }
        })
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
    const addPasteNodePortData = (portId, nodeId, fieldId, site) => {
        if (portId) {
            businessNodesPortsData.addData({
                [portId]: {
                    nodeId,
                    fieldId,
                    site,
                },
            })
        }
    }

    const clearAllNodePorts = () => {
        if (graphCase && graphCase.current) {
            const allNodes = graphCase.current.getNodes()
            if (
                allNodes.length > 1 &&
                Object.keys(businessNodesPortsData.quoteData).length
            ) {
                allNodes.forEach((currentNode) => {
                    currentNode.removePorts()
                    clearPastePortRecord(currentNode)
                })
            }
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
     * 更新所有表格port和连线
     */
    const updateAllPortAndEdge = () => {
        if (graphCase?.current) {
            const allNodes = graphCase.current.getNodes()
            edgeRelation.clearData()
            if (allNodes.length > 1) {
                const businessInFormNodes = allNodes.filter(
                    (allNode) => allNode.data.formAttr === NodeAttribute.InForm,
                )
                const businessOutFormNodes = allNodes.filter((allNode) => {
                    return allNode.data.formAttr === NodeAttribute.outForm
                })
                businessInFormNodes.forEach((businessInFormNode) => {
                    if (businessInFormNode.data.relationData.relations.length) {
                        setQuoteKeyRelative(
                            businessOutFormNodes,
                            businessInFormNode,
                        )
                    }
                })
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
        if (targetNode) {
            targetSearchData.forEach((item, index) => {
                const fieldRelations =
                    targetNode.data.relationData.relations.find(
                        (relation) => relation.target_field === item.id,
                    )
                if (fieldRelations) {
                    const relationOriginNode = originNodes.find((originNode) =>
                        originNode.data.items.find(
                            (field) => field.id === fieldRelations.src_field,
                        ),
                    )
                    if (relationOriginNode) {
                        createRelativeByNode(
                            relationOriginNode,
                            targetNode,
                            item,
                            index,
                            fieldRelations.src_field,
                        )
                    }
                }
            })
        }
    }

    /**
     * 创建节点关系
     * @param originNode 源节点
     * @param targetNode 目标节点
     * @param item 数据项
     * @param index 数据项下标
     */
    const createRelativeByNode = (
        originNode,
        targetNode,
        item,
        index,
        source_id,
    ) => {
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
                source_id,
                origin,
            )
            addEdgeFromOriginToTarget(
                source_id,
                targetNode,
                targetNodeItemPortInfo?.portId || '',
                originNode,
                pasteNodeItemPortInfo?.portId || '',
            )
        } else {
            const portId = getOriginNodeHeaderPorts(originNode, origin)

            if (portId) {
                addEdgeFromOriginToTarget(
                    source_id,
                    targetNode,
                    targetNodeItemPortInfo?.portId,
                    originNode,
                    portId,
                )
            } else {
                const originNodeItemPortId = getPasteNodePort(
                    originNode,
                    source_id,
                    origin,
                    ExpandStatus.Retract,
                )
                addEdgeFromOriginToTarget(
                    source_id,
                    targetNode,
                    targetNodeItemPortInfo?.portId,
                    originNode,
                    originNodeItemPortId,
                )
            }
        }
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
        searchData.forEach((originItem, index) => {
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
    const getNodeItemPortId = (node: Node, index, group, limit, item) => {
        const itemSite = getDataShowSite(
            index,
            node.data.offset,
            limit,
            node.data.items.length,
        )
        if (itemSite === DataShowSite.CurrentPage) {
            const portsData = findBusinessNodeAndPort(item.id, group)
            if (portsData) {
                return portsData
            }
            const currnentSearchData = searchFieldData(
                node.data.items,
                node.data.keyWord,
            )
            const currentShowDataIndex = getDataCurrentPageIndex(
                index,
                node.data.offset,
                10,
                currnentSearchData.length,
            )
            node.addPort(getPortByNode(group, currentShowDataIndex))
            const portId = last(node.getPorts())?.id
            if (portId) {
                addPasteNodePortData(portId, node.id, item.id, group)
                return {
                    portId,
                    nodeId: businessNodesPortsData.quoteData[portId],
                }
            }
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
     * 设置业务表节点的桩
     * @param targetNode 目标节点
     * @param index 下标
     * @param position 左右位置
     * @param site 顶部位置
     */
    const setBusinessNodePort = (targetNode, index, position, site?) => {
        targetNode.addPort(
            getPortByNode(
                position,
                index,
                'target',
                ExpandStatus.Expand,
                site || '',
            ),
        )
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
    const findBusinessNodeAndPort = (sourceId: string, position: string) => {
        const portId = Object.keys(businessNodesPortsData.quoteData).find(
            (value) => {
                return (
                    businessNodesPortsData.quoteData[value].fieldId ===
                        sourceId &&
                    businessNodesPortsData.quoteData[value].site === position
                )
            },
        )
        if (portId) {
            return {
                portId,
                nodeId: businessNodesPortsData.quoteData[portId],
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
                        zIndex: -1,
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
                        zIndex: -1,
                    })
                    edgeRelation.addData({
                        [originItemId]: graphCase.current.addEdge(edge),
                    })
                }
            } else if (model === ViewModel.ModelView) {
                if (originNodePortId) {
                    originNode.removePort(originNodePortId)
                    businessNodesPortsData.deleteData(originNodePortId)
                }
                if (targetNodePortId) {
                    targetNode.removePort(targetNodePortId)
                    businessNodesPortsData.deleteData(targetNodePortId)
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
        if (model === ViewModel.ModelView) {
            return
        }
        setOptionType(currentOptionType)
        switch (currentOptionType) {
            case OptionType.ViewOriginFormDetail:
                setEditBusinessFormId(dataNode.data.formInfo.id)
                break
            case OptionType.ViewOriginFieldDetail:
                setViewBusinessField(data)
                break
            case OptionType.ViewPasteFieldInfo:
                setViewDataField(data)
                break

            default:
                break
        }
    }

    /**
     * 删除原表的字段关系
     */
    const deleteFieldRelation = (deleteData) => {
        if (graphCase && graphCase.current) {
            const inFormNodes = graphCase.current
                .getNodes()
                .filter(
                    (currentNode) =>
                        currentNode.data.formAttr === NodeAttribute.InForm &&
                        currentNode.data.relationData?.relations.length,
                )
            if (deleteData.data.formAttr === NodeAttribute.InForm) {
                const relationSrcData =
                    deleteData.data.relationData.relations.map(
                        (relation) => relation.src_field,
                    )
                const outFormNodes = graphCase.current
                    .getNodes()
                    .filter(
                        (currentNode) =>
                            currentNode.data.formAttr === NodeAttribute.outForm,
                    )

                relationSrcData.forEach((relationSrc) => {
                    const currentOutFormNode = outFormNodes.find(
                        (outFormNode) =>
                            outFormNode.data.items.find(
                                (field) => field.id === relationSrc,
                            ),
                    )
                    if (
                        currentOutFormNode &&
                        !checkCurrentFormOutFields(
                            currentOutFormNode,
                            inFormNodes.filter(
                                (inFormNode) => inFormNode.id !== deleteData.id,
                            ),
                        )
                    ) {
                        currentOutFormNode.replaceData({
                            ...currentOutFormNode.data,
                            formAttr: NodeAttribute.InForm,
                            relationData: {
                                ...currentOutFormNode.data.relationData,
                                id: currentOutFormNode.data.fid,
                                relations: [],
                            },
                        })
                    }
                })
            } else {
                const fieldsId = deleteData.data.items.map((field) => field.id)
                inFormNodes.forEach((inFormNode) => {
                    inFormNode.replaceData({
                        ...inFormNode.data,
                        relationData: {
                            ...inFormNode.data.relationData,
                            relations:
                                inFormNode.data.relationData.relations.filter(
                                    (relation) =>
                                        !fieldsId.includes(relation.src_field),
                                ),
                        },
                    })
                })
            }
            graphCase.current.removeCell(deleteData.id)
            setDeleteNode(null)
            updateAllPortAndEdge()
        }
    }

    /**
     * 拖拽来源表
     * @param e 事件
     */
    const startDrag = async (
        e: React.MouseEvent<HTMLDivElement, MouseEvent>,
        formData: any,
    ) => {
        const { entries } = await getFormsFieldsList(formData?.id, {
            limit: 999,
        })
        const node = graphCase?.current?.createNode({
            ...FormBusinessNodeTemplate,
            height: 52 + (entries.length > 10 ? 400 : entries.length * 40) + 24,
            data: {
                ...FormBusinessNodeTemplate.data,
                fid: formData.id,
                items: entries,
                formInfo: formData,
                relationData: {
                    id: formData.id,
                    relations: [],
                },
            },
        })
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
                        ...FormBusinessNodeTemplate,
                        position: currentPosition,
                        data: {
                            ...FormBusinessNodeTemplate.data,
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
     * 保存指标模型
     */
    const handleSaveMetricModel = async (
        acting: 'step' | 'leave' | 'onlySave' = 'leave',
    ) => {
        if (graphCase && graphCase.current) {
            try {
                const allNodes = graphCase.current.getNodes()
                const graphData = graphCase.current.toJSON()
                if (!graphData?.cells?.length) {
                    message.error('当前模型不存在任何业务表，请添加业务表!')
                    return
                }
                const content = JSON.stringify(
                    graphData.cells
                        .filter((cell) => cell.shape !== 'edge')
                        .map((cell) => ({
                            ...cell,
                            data: {
                                fid: cell.data.formInfo?.id,
                                formAttr: cell.data.formAttr,
                                relationData: cell.data.relationData,
                            },
                        })),
                )
                const params = {
                    canvas: content,
                    data: allNodes
                        .filter(
                            (currentNode) =>
                                currentNode.data.formAttr ===
                                NodeAttribute.InForm,
                        )
                        .map((currentNode) => currentNode.data.relationData),

                    task_id: taskId,
                }
                await saveIndicatorModelCanvas(mid, editingModelId, params)
                if (acting === 'onlySave') {
                    message.success(__('保存成功'))
                } else if (acting === 'leave') {
                    message.success(__('保存成功'))
                    if (searchParams.get('jumpMode') === 'win') {
                        window.open(getActualUrl(combUrl(queryData)), '_self')
                        return
                    }
                    navigator(combUrl(queryData))
                } else {
                    if (optionType !== OptionType.NoOption) {
                        setOptionType(OptionType.NoOption)
                        setEditBusinessFormId('')
                        setViewBusinessField(null)
                    }
                    setModel(ViewModel.ModelView)

                    graphCase.current.clearCells()
                    businessNodesPortsData.clearData()
                    loadOriginTable(iid)
                    setStage(1)
                }
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
                // handleSaveMetricModel('publishing')
            } catch (ex) {
                formatError(ex)
            }
        }
    }
    // 指标详情的完成事件
    const onFinishFn = () => {
        MetricForm.submit()
    }
    return (
        <div className={styles.main}>
            <GraphToolBar
                targetMetricInfo={metricModelInfo}
                onSaveModel={(acting) => {
                    handleSaveMetricModel(acting)
                }}
                onPublishGraph={() => {
                    handlePublishGraph()
                }}
                onFinish={onFinishFn}
                onUpdateMetricInfo={async (data) => {
                    try {
                        await updateIndicatorModel(mid, editingModelId, {
                            ...data,
                            task_id: taskId,
                        })
                        setMetricModelInfo({
                            ...metricModelInfo,
                            ...data,
                        })
                        message.success(__('编辑成功'))
                    } catch (ex) {
                        formatError(ex)
                    }
                }}
                model={optionStatus}
                queryData={{ ...queryData }}
                stage={stage}
                hasSelectedFormId={usedFormsId}
                checkNameRepeat={(value) => {
                    return checkNameRepeat(mid, value, editingModelId)
                }}
                onUpdateStage={(value) => {
                    setStage(value)
                    if (value) {
                        if (optionType !== OptionType.NoOption) {
                            setOptionType(OptionType.NoOption)
                            setEditBusinessFormId('')
                            setViewBusinessField(null)
                        }
                        setModel(ViewModel.ModelView)
                    } else {
                        setModel(ViewModel.ModelEdit)
                        setShowconfigDetail(false)
                        if (graphCase && graphCase.current) {
                            graphCase.current.clearCells()
                            businessNodesPortsData.clearData()
                            loadOriginTable(iid)
                        }
                    }
                }}
            />
            <div
                className={styles.graphContent}
                style={{
                    height: 'calc(100% - 48px)',
                }}
            >
                <DragBox
                    defaultSize={
                        model !== ViewModel.ModelEdit ? [0, 100] : defaultSize
                    }
                    minSize={
                        model !== ViewModel.ModelEdit ? [0, 500] : [120, 500]
                    }
                    maxSize={[300, Infinity]}
                    onDragEnd={(size) => {
                        setDefaultSize(size)
                    }}
                    gutterStyles={{
                        background: '#EFF2F5',
                        width: model !== ViewModel.ModelEdit ? 0 : '5px',
                        cursor: 'ew-resize',
                        border: 'none',
                    }}
                    hiddenElement={model !== ViewModel.ModelEdit ? 'left' : ''}
                    gutterSize={model !== ViewModel.ModelEdit ? 1 : 5}
                    existPadding={false}
                >
                    {model !== ViewModel.ModelEdit ? (
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
                                onClick={() => {
                                    // setSelectFormType()
                                }}
                                onSelectMetaData={addMetaDataSourceTable}
                                existFormIds={pasteNodeIds}
                                defaultMetaForms={defaultMetaForms}
                                mid={mid || modelId}
                                onOpenViewTable={(formId, fields) => {
                                    setViewTableId(formId)
                                    setViewTableFields(fields)
                                }}
                                hasSelectedFormId={usedFormsId}
                            />
                        </div>
                    )}
                    <div
                        style={{
                            display: 'flex',
                            width: '100%',
                            height: '100%',
                            position: 'relative',
                        }}
                        ref={graphBody}
                        onClick={() => {
                            setModelIndicatorId('')
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
                        <div
                            style={{
                                position: 'absolute',
                                left: '24px',
                                bottom: '24px',
                            }}
                        >
                            <FloatBar
                                onChangeGraphSize={changeGraphSize}
                                onShowAllGraphSize={showAllGraphSize}
                                graphSize={graphSize}
                                onMovedToCenter={movedToCenter}
                            />
                        </div>
                    </div>
                </DragBox>
                {
                    // 新建或者编辑指标
                    (optionStatus === OptionModel.CreateModel && stage === 1) ||
                    optionStatus === OptionModel.CreateMetric ||
                    optionStatus === OptionModel.EditMetric
                        ? showconfigDetail && (
                              <ConfigDetail
                                  graphData={graphCase?.current?.getNodes()}
                                  mode={optionStatus as OptionModel} /*  */
                                  modelId={metricModelInfo.id}
                                  indicatorId={indicatorId}
                                  form={MetricForm}
                                  dataTypeOptions={dataTypeOptions}
                              />
                          )
                        : null
                }
                {
                    // 预览指标详情组件
                    optionStatus === OptionModel.MetricDetail &&
                    modelIndicatorId
                        ? showconfigDetail && (
                              <ViewConfigDetail
                                  graphData={graphCase?.current?.getNodes()}
                                  mode={optionStatus as OptionModel}
                                  modelId={metricModelInfo.id}
                                  indicatorId={modelIndicatorId}
                                  onClose={() => {
                                      setModelIndicatorId('')
                                  }}
                                  dataTypeOptions={dataTypeOptions}
                              />
                          )
                        : null
                }
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
                optionType === OptionType.ViewPasteFormInfo ? (
                    <ViewPasteFormDetail
                        formInfo={editPasteFormNode.data.formInfo}
                        onClose={() => {
                            setOptionType(OptionType.NoOption)
                            setEditPasteFormNode(null)
                        }}
                    />
                ) : null}

                {!!viewDataField &&
                optionType === OptionType.ViewPasteFieldInfo ? (
                    <ViewPasteFieldDetail
                        fieldInfo={viewDataField}
                        onClose={() => {
                            setOptionType(OptionType.NoOption)
                            setViewDataField(null)
                        }}
                    />
                ) : null}
            </div>
            {viewTableFields && (
                <FieldTableView
                    formId={viewTableId}
                    onClose={() => {
                        setViewTableFields(null)
                        setViewTableId('')
                    }}
                    items={viewTableFields}
                    model="view"
                />
            )}
            {noneDataStatus && (
                <Modal
                    open
                    footer={null}
                    closable={false}
                    maskClosable={false}
                    width={484}
                >
                    <div className={styles.resultContainer}>
                        <div className={styles.resultContent}>
                            <div className={styles.content}>
                                {__(
                                    '当前模型还没有任何业务表, 请先添加业务表！',
                                )}
                            </div>
                        </div>
                        <div className={styles.resultbButton}>
                            <Button
                                type="primary"
                                onClick={() => {
                                    setOptionStatus(OptionModel.CreateModel)
                                    setModel(ViewModel.ModelEdit)
                                    setNoneDataStatus(false)
                                }}
                            >
                                {__('知道了')}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}

export default MetricModel
