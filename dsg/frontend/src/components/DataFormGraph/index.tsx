import React, {
    useState,
    useRef,
    useEffect,
    useMemo,
    FC,
    forwardRef,
    useImperativeHandle,
} from 'react'
import { useGetState } from 'ahooks'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { last } from 'lodash'
import { Graph as GraphType, Node, Shape } from '@antv/x6'
import { Dnd } from '@antv/x6-plugin-dnd'
import { ExclamationCircleFilled, InfoCircleFilled } from '@ant-design/icons'
import { Button, message, Modal, Space } from 'antd'
import { instancingGraph } from '@/core/graph/graph-config'
import { Plugins, loadPlugins } from '@/core/graph/plugin'
import formNode from './FormNode'
import formTargetNode from './FormTargetNode'
import {
    ExpandStatus,
    FormNodeTemplate,
    FormTargetNodeTemplate,
    getPortByNode,
    DataShowSite,
    getDataShowSite,
    getDataCurrentPageIndex,
    OptionType,
    DeleteMode,
    searchFieldData,
    getOriginDataRelation,
    getQueryData,
    combUrl,
    wheellDebounce,
    FORM_HEADER_HEIGHT,
    FORM_FIELD_HEIGHT,
    FORM_PAGING_HEIGHT,
    EditFormModel,
    generateFullPathData,
    getCurrentShowData,
    TARGET_LIMIT,
    getNewPortConfig,
    getPositSite,
    ORIGIN_LIMIT,
    removeTargetFormRelationByTable,
    defaultTargetPorts,
    sortFields,
    changeFieldIndexOrigin,
} from './helper'
import { X6PortalProvider } from '@/core/graph/helper'
import FormQuoteData from './formDataQuoteData'
import { FormFiled } from '@/core/apis/businessGrooming/index.d'
import FieldConfig from './FieldConfig'
import DragBox from '../DragBox'
import {
    getFormGraph,
    getFormQueryItem,
    getFormsFieldsList,
    saveFields,
    saveFormGraph,
    formatError,
    TaskExecutableStatus,
    TaskStatus,
    TaskType,
    IBusinTableField,
    addToPending,
    getDataGradeLabel,
    getDataGradeLabelStatus,
    GradeLabelStatusEnum,
    IGradeLabel,
    getDatasheetViewDetails,
    transformQuery,
} from '@/core'
import GraphToolBar from './GraphToolBar'
import styles from './styles.module.less'
import SelectFormList from './SelectFormList'
import __ from './locale'
import EditFormConfig from './EditFormConfig'
import ViewFormDetail from './ViewFormDetail'
import ViewFieldDetail from './ViewFieldDetail'
import FieldTableView from './FieldTableView'
import './x6Style.less'
import { getActualUrl } from '@/utils'
import TypeShow from './TypeShow'
import BusinessFormDefineObj from '../BusinessFormDefineObj'
import {
    FormTableKind,
    FormTableKindOptions,
    ToBeCreStdStatus,
} from '../Forms/const'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { DestRule } from './const'
import logicViewNode from './LogicViewNode'
import { GraphContextProvider } from './GraphContext'
import SortFields from './SortFields'
import FieldTableLogic from './FieldTableLogic'
import ConfigConvergenceRules from './ConfigConvergenceRules'
import { useBusinessModelContext } from '../BusinessModeling/BusinessModelProvider'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IFormGraphModel {
    ref: any
    initData?: any
    graphContent?: string
    errorFields?: any
    isStart: boolean
    tagData: IGradeLabel[]
}
const FormGraphModel: FC<IFormGraphModel> = forwardRef(
    ({ initData, graphContent, errorFields, isStart, tagData }: any, ref) => {
        const graphCase = useRef<GraphType>()
        const dndCase = useRef<Dnd>()
        const container = useRef<HTMLDivElement>(null)
        const dndContainer = useRef<HTMLDivElement>(null)
        const [editField, setEditField] = useState<FormFiled | null>(null)
        const [seletedNode, setSelectedNode] = useState<Node | null>(null)
        const [targetFormInfo, setTargetFormInfo, getTargetInfo] =
            useGetState<any>(null)
        const navigator = useNavigate()
        const [searchParams, setSearchParams] = useSearchParams()
        const [graphSize, setGraphSize] = useState(100)
        const [defaultSize, setDefaultSize] = useState<Array<number>>([15, 85])
        const [targetFormNode, setTargetFormNode] = useState<Node | null>(null)
        const keyAndNodeRelation = useMemo(() => {
            return new FormQuoteData({})
        }, [])
        const edgeRelation = useMemo(() => {
            return new FormQuoteData({})
        }, [])
        const fid = searchParams.get('fid') || ''
        const mid = searchParams.get('mid') || ''
        const redirect = searchParams.get('redirect')
        const taskId = searchParams.get('taskId') || ''
        const [model, setModel, getModel] = useGetState(
            searchParams.get('defaultModel') || 'view',
        )
        const [deleteFormNode, setDeleteFormNode] = useState<Node | null>(null)
        const [deleteMode, setDeleteMode] = useState<number>(DeleteMode.Copy)
        const [allOriginNodes, setAllOriginNodes, getAllOriginNodes] =
            useGetState<Array<Node>>([])
        const [editFormId, setEditFormId] = useState<string>('')
        const [optionType, setOptionType] = useState<OptionType>(
            OptionType.NoOption,
        )
        const [viewTableNode, setViewTableNode] = useState<Node | null>(null)
        const { search } = useLocation()
        const [queryData, setQueryData] = useState<any>(getQueryData(search))
        const [hasFileds, setHasField] = useState<Array<string>>([])
        const [isShowEdit, setIsShowEdit] = useState<boolean>(false)
        const [deleteTargetFields, setDeleteTargetFields] = useState<
            Array<any>
        >([])
        const [saveResultData, setSaveResultData] = useState<Array<string>>([])
        const [fieldsErrors, setFieldsError] = useState<any>(null)
        const { checkPermission } = useUserPermCtx()
        // 关联业务表对象/活动
        const [relateBusinessObject, setRelateBusinessObject] = useState(false)
        // 新建字段后，关联业务对象按钮置灰
        const [isDisabledRelateObj, setIsDisabledRelateObj] =
            useState<boolean>(false)
        const [userInfo] = useCurrentUser()

        const [sortFieldNode, setSortFieldNode] = useState<Node | null>(null)

        const sortFieldsContainerRef = useRef<any>(null)

        const [viewLogicFormId, setViewLogicFormId] = useState<string>('')

        const [fieldsMaps, setFieldsMaps, getFieldsMaps] = useGetState<
            Array<string>
        >([])

        const [usedFieldIds, setUsedFieldIds, getUsedFieldIds] = useGetState<
            Array<string>
        >([])

        const [configRulesInfo, setConfigRulesInfo] = useState<any>()
        const [configRulesNode, setConfigRulesNode] = useState<Node | null>(
            null,
        )
        const { isDraft, selectedVersion } = useBusinessModelContext()
        const versionParams = useMemo(() => {
            return transformQuery({ isDraft, selectedVersion })
        }, [isDraft, selectedVersion])

        useEffect(() => {
            setFieldsError(errorFields)
        }, [errorFields])

        // 注册表节点
        const formNodeName = formNode([
            () => graphCase,
            () => updateAllPortAndEdge,
            () => keyAndNodeRelation,
            () => edgeRelation,
            () => optionGraphData,
            () => handleDeleteOriginForm,
            () => onViewFormField,
            () => model,
            () => setHasField,
            () => setIsDisabledRelateObj,
        ])

        const logicViewNodeName = logicViewNode()

        // 注册目标表节点
        const formTargetNodeName = formTargetNode([
            () => graphCase,
            () => updateAllPortAndEdge,
            () => keyAndNodeRelation,
            () => edgeRelation,
            () => optionGraphData,
            () => onViewFormField,
            () => model,
            () => setDeleteTargetFields,
            () => setRelateBusinessObject,
            () => isDisabledRelateObj,
            () => fieldsErrors,
        ])

        const getBusinessFormFields = () => {
            return targetFormNode?.data?.items || []
        }

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
                loadTargetTable()
                dndCase.current = new Dnd({
                    target: graph,
                    scaled: false,
                    dndContainer: dndContainer.current || undefined,
                })

                graph.on('edge:mouseenter', ({ edge }) => {})

                graph.on('node:added', ({ node }) => {
                    setAllOriginNodes([...getAllOriginNodes(), node])
                    // graph.getNodes().forEach((currentNode) => {
                    //     if (currentNode.data.type !== 'target') {
                    //         setAllOriginNodes([...allOriginNodes, currentNode])
                    //     }
                    //     if (
                    //         currentNode.id !== node.id &&
                    //         currentNode.data.type !== 'target' &&
                    //         currentNode.data.expand === ExpandStatus.Expand
                    //     ) {
                    //         currentNode.setData({
                    //             ...currentNode.data,
                    //             expand: ExpandStatus.Retract,
                    //         })
                    //         updateAllPortAndEdge()
                    //     }
                    // })
                })
                graph.on('node:moved', ({ node }) => {
                    updateAllPortAndEdge()
                })

                graph.on('node:removed', ({ node }) => {
                    setAllOriginNodes(
                        getAllOriginNodes().filter(
                            (originNode) => node.id !== originNode.id,
                        ),
                    )
                })
                graph.on('edge:connected', ({ edge }) => {
                    const targetPortId = edge.getTargetPortId()
                    const targetNode = edge.getTargetNode()
                    const sourceNode = edge.getSourceNode()
                    const sourcePortId = edge.getSourcePortId()
                    if (getModel() === 'view') {
                        graph.removeEdge(edge)
                        return
                    }
                    if (targetNode?.data?.type !== 'target') {
                        graph.removeEdge(edge)
                        return
                    }
                    if (sourceNode?.data?.type !== 'origin') {
                        graph.removeEdge(edge)
                        return
                    }
                    if (
                        targetPortId &&
                        sourcePortId &&
                        sourceNode &&
                        targetNode
                    ) {
                        const targetPortInfo = targetNode?.getPort(targetPortId)
                        const sourcePortInfo = sourceNode?.getPort(sourcePortId)

                        if (
                            targetPortInfo?.args?.fieldInfo &&
                            sourcePortInfo?.args?.fieldInfo
                        ) {
                            addTargetFormFieldMaps(
                                targetNode,
                                targetPortInfo.args.fieldInfo,
                                sourceNode,
                                sourcePortInfo.args.fieldInfo,
                            )
                        }
                    }
                })
            }
        }, [isDraft, selectedVersion])

        const initEditStatus = () => {
            const querySearch = getQueryData(search)
            let res = true
            if (
                taskId &&
                querySearch &&
                ((querySearch.taskType &&
                    querySearch.taskType !== TaskType.MODEL &&
                    querySearch.taskType !== TaskType.DATAMODELING) ||
                    (querySearch.taskStatus &&
                        querySearch.taskStatus === TaskStatus.COMPLETED) ||
                    (querySearch.taskExecutableStatus &&
                        querySearch.taskExecutableStatus !==
                            TaskExecutableStatus.EXECUTABLE))
            ) {
                setModel('view')
                res = false
            }
            setIsShowEdit(
                res &&
                    !!checkPermission(
                        'manageBusinessModelAndBusinessDiagnosis',
                    ),
            )
        }
        /**
         * 加载目标表
         */
        const loadTargetTable = async () => {
            try {
                if (graphCase?.current) {
                    const [formInfo, { content }] = await Promise.all([
                        getFormQueryItem(fid, versionParams),
                        getFormGraph(mid, fid, versionParams),
                    ])

                    setTargetFormInfo(formInfo)
                    const { entries } = await getFormsFieldsList(fid, {
                        limit: 999,
                        ...versionParams,
                    })

                    if (entries.length && !content) {
                        initLoadTargetForm(
                            {
                                ...FormTargetNodeTemplate,
                                ports:
                                    formInfo.table_kind ===
                                    FormTableKind.DATA_ORIGIN
                                        ? FormTargetNodeTemplate.ports
                                        : defaultTargetPorts,
                                position: {
                                    x: 400,
                                    y: 200,
                                },
                            },
                            entries,
                            formInfo,
                        )
                        if (
                            formInfo.table_kind ===
                                FormTableKind.DATA_STANDARD &&
                            (formInfo as any)?.from_table_id
                        ) {
                            await loadDataStandardOriginForm(
                                {
                                    ...FormNodeTemplate,
                                    ports: FormTargetNodeTemplate.ports,
                                    position: {
                                        x: 40,
                                        y: 200,
                                    },
                                },
                                (formInfo as any)?.from_table_id,
                                // sortFields(entries).map(
                                //     (item) =>
                                //         item.field_map.source_field[0].field_id,
                                // ),
                            )
                        }
                    } else if (entries && content) {
                        const graphDatas = JSON.parse(content)
                        await graphDatas.forEach(async (graphData) => {
                            if (graphData.data.type === 'target') {
                                await initLoadTargetForm(
                                    {
                                        ...graphData,
                                        ports:
                                            formInfo.table_kind ===
                                            FormTableKind.DATA_ORIGIN
                                                ? FormTargetNodeTemplate.ports
                                                : defaultTargetPorts,
                                    },
                                    entries,
                                    formInfo,
                                )
                            } else if (graphData.data.type === 'origin') {
                                if (
                                    formInfo.table_kind ===
                                    FormTableKind.DATA_STANDARD
                                ) {
                                    await loadDataStandardOriginForm(
                                        {
                                            ...graphData,
                                            ports: FormTargetNodeTemplate.ports,
                                        },
                                        graphData.data.fid,
                                        // sortFields(entries).map(
                                        //     (item) =>
                                        //         item.field_map.source_field[0]
                                        //             .field_id,
                                        // ),
                                    )
                                } else {
                                    await initLoadOriginForm(
                                        {
                                            ...graphData,
                                            ports: FormTargetNodeTemplate.ports,
                                        },
                                        graphData.data.fid,
                                    )
                                }
                            } else if (graphData.data.type === 'logic-view') {
                                await initLoadOriginDataSheetForm(graphData)
                            }
                        })
                        if (entries.length) {
                            updateAllPortAndEdge()
                        }
                    } else {
                        await initLoadTargetForm(
                            {
                                ...FormTargetNodeTemplate,
                                ports:
                                    formInfo.table_kind ===
                                    FormTableKind.DATA_ORIGIN
                                        ? FormTargetNodeTemplate.ports
                                        : defaultTargetPorts,
                                position: {
                                    x: 400,
                                    y: 200,
                                },
                            },
                            [],
                            formInfo,
                        )
                    }
                    setTimeout(() => {
                        updateAllPortAndEdge()
                        movedToCenter()
                    }, 0)
                }
            } catch (ex) {
                formatError(ex)
            }
        }

        const initSetUsedFieldIds = (fieldsData: Array<any>) => {
            const initUsedFieldIds = fieldsData
                .map((item) => {
                    if (item?.field_map?.source_field?.length) {
                        return item?.field_map?.source_field?.map(
                            (sourceField) => sourceField.field_id,
                        )
                    }
                    return []
                })
                .flat()
            setUsedFieldIds(initUsedFieldIds)
        }

        /**
         * 加载目标表数据
         * @param targetNodeData 目标表
         * @param itemsData 数据
         */
        const initLoadTargetForm = (targetNodeData, itemsData, formInfo) => {
            try {
                if (graphCase?.current) {
                    initSetUsedFieldIds(itemsData)
                    const targetNode = graphCase.current.addNode({
                        ...targetNodeData,
                        data: {
                            ...targetNodeData.data,
                            fid,
                            mid,
                            offset: 0,
                            selectedFiledsId: [],
                            uniqueCount: itemsData.length + 1,
                            items: sortFields(
                                itemsData.map((itemData, index) => {
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
                            ),
                            formInfo,
                        },
                    })
                    setTargetFormNode(targetNode)
                }
            } catch (ex) {
                formatError(ex)
            }
        }

        const loadDataStandardOriginForm = async (
            originNodeData,
            tableId,
            // sortList: Array<string>,
        ) => {
            try {
                if (graphCase && graphCase.current) {
                    const [formInfo, { entries }] = await Promise.all([
                        getFormQueryItem(tableId, versionParams),
                        getFormsFieldsList(tableId, {
                            limit: 999,
                            ...versionParams,
                        }),
                    ])
                    graphCase.current.addNode({
                        ...originNodeData,
                        data: {
                            ...originNodeData.data,
                            // items: sortFields(
                            //     changeFieldIndexOrigin(
                            //         entries.map((itemData) => {
                            //             const {
                            //                 created_at,
                            //                 created_by,
                            //                 updated_at,
                            //                 updated_by,
                            //                 ...restData
                            //             } = itemData
                            //             return restData
                            //         }),
                            //         sortList,
                            //     ),
                            // ),
                            items: entries.map((itemData) => {
                                const {
                                    created_at,
                                    created_by,
                                    updated_at,
                                    updated_by,
                                    ...restData
                                } = itemData
                                return restData
                            }),
                            offset: 0,
                            selectedFiledsId: [],
                            fid: tableId,
                            mid: originNodeData.data.mid || mid,
                            type: 'origin',
                            formInfo,
                            expand: ExpandStatus.Expand,
                        },
                    })
                }
            } catch (ex) {
                if (ex.data.code === 'BusinessGrooming.Form.FormNotExist') {
                    return
                }
                formatError(ex)
            }
        }
        /**
         * 加载来源表
         */
        const initLoadOriginForm = async (originNodeData, tableId) => {
            try {
                if (graphCase && graphCase.current) {
                    const [formInfo, { entries }] = await Promise.all([
                        getFormQueryItem(tableId, versionParams),
                        getFormsFieldsList(tableId, {
                            limit: 999,
                            ...versionParams,
                        }),
                    ])
                    graphCase.current.addNode({
                        ...originNodeData,
                        data: {
                            ...originNodeData.data,
                            items: entries.map((itemData) => {
                                const {
                                    created_at,
                                    created_by,
                                    updated_at,
                                    updated_by,
                                    ...restData
                                } = itemData
                                return restData
                            }),
                            offset: 0,
                            selectedFiledsId: [],
                            fid: tableId,
                            mid: originNodeData.data.mid || mid,
                            type: 'origin',
                            formInfo,
                            expand: ExpandStatus.Expand,
                        },
                    })
                }
            } catch (ex) {
                if (ex.data.code === 'BusinessGrooming.Form.FormNotExist') {
                    return
                }
                formatError(ex)
            }
        }

        /**
         * 加载来源数据表
         */
        const initLoadOriginDataSheetForm = async (originNodeData) => {
            try {
                if (graphCase && graphCase.current) {
                    const { fields, ...dataSheetFormInfo } =
                        await getDatasheetViewDetails(originNodeData.data.fid)
                    graphCase.current.addNode({
                        ...originNodeData,
                        data: {
                            ...originNodeData.data,
                            items: fields.map((itemData) => {
                                const {
                                    business_name,
                                    technical_name,
                                    ...restData
                                } = itemData
                                return {
                                    name: business_name,
                                    name_en: technical_name,
                                    ...restData,
                                }
                            }),
                            formInfo: {
                                ...dataSheetFormInfo,
                                id: originNodeData.data.fid,
                            },
                            offset: 0,
                            selectedFiledsId: [],
                            fid: originNodeData.data.fid,
                            mid: originNodeData.data.mid,
                            expand: ExpandStatus.Expand,
                        },
                    })
                }
            } catch (ex) {
                if (ex.data.code === 'BusinessGrooming.Form.FormNotExist') {
                    return
                }
                formatError(ex)
            }
        }

        const addTargetFormFieldMaps = (
            targetNode,
            targetFieldInfo,
            sourceNode,
            sourceFieldInfo,
        ) => {
            const sourceFields = sourceNode.data.items.find((item) => {
                return item.id === sourceFieldInfo.fieldId
            })

            const newFieldMaps = {
                field_id: sourceFields.id,
                business_name: sourceFields.name,
                technical_name: sourceFields.name_en,
                data_type: sourceFields.data_type,
                table_type: sourceNode?.data?.formInfo?.table_kind,
                table_id:
                    sourceNode?.data?.fid || sourceNode?.data?.formInfo?.id,
                table_name: sourceNode.data.formInfo.name,
                value_rule_desc: '',
                sort: 0,
                value_rule: DestRule.UNIQUE,
                description: '',
            }
            const newTargetItems = targetNode.data.items.map((item) => {
                if (
                    item?.field_map?.source_field?.length &&
                    getTargetInfo()?.table_kind !== FormTableKind.DATA_FUSION
                ) {
                    return item
                }
                if (
                    item.id === targetFieldInfo.fieldId ||
                    item.uniqueId === targetFieldInfo.fieldId
                ) {
                    return {
                        ...item,
                        field_map: item?.field_map?.source_field?.length
                            ? {
                                  ...item.field_map,
                                  source_field: [
                                      ...item.field_map.source_field,
                                      newFieldMaps,
                                  ].map((sourceFieldsInfo, index) => ({
                                      ...sourceFieldsInfo,
                                      sort: index,
                                  })),
                              }
                            : {
                                  dest_rule: DestRule.UNIQUE,
                                  source_field: [newFieldMaps],
                                  descriptions: '',
                              },
                    }
                }

                return item
            })

            setUsedFieldIds([...getUsedFieldIds(), sourceFieldInfo.fieldId])
            targetNode.replaceData({
                ...targetNode.data,
                items: newTargetItems,
            })
            setFieldsMaps([...getFieldsMaps(), sourceFieldInfo.fieldId])
            keyAndNodeRelation.addData({
                [sourceFields.id]: sourceNode,
            })
            updateAllPortAndEdge()
        }

        /**
         * 拖拽来源表
         * @param e 事件
         */
        const startDrag = async (
            e: React.MouseEvent<HTMLDivElement, MouseEvent>,
            originMid: string,
            dataId: string,
            type: FormTableKind,
        ) => {
            dragBusinessForm(e, originMid, dataId)
        }

        /**
         * 拖拽业务表
         * @param e 事件
         * @param originMid 来源表mid
         * @param dataId 业务表id
         */
        const dragBusinessForm = async (
            e: React.MouseEvent<HTMLDivElement, MouseEvent>,
            originMid: string,
            dataId: string,
        ) => {
            try {
                const [{ entries }, formInfo] = await Promise.all([
                    getFormsFieldsList(dataId, {
                        limit: 999,
                        ...versionParams,
                    }),
                    getFormQueryItem(dataId, versionParams),
                ])
                const node = graphCase?.current?.createNode({
                    ...FormNodeTemplate,

                    height:
                        entries.length > 10
                            ? 520
                            : entries.length === 0
                            ? 166
                            : FORM_HEADER_HEIGHT +
                              (entries.length + 1) * FORM_FIELD_HEIGHT +
                              FORM_PAGING_HEIGHT,
                    data: {
                        ...FormNodeTemplate.data,
                        items: entries.map((itemData) => {
                            const {
                                created_at,
                                created_by,
                                updated_at,
                                updated_by,
                                ...restData
                            } = itemData
                            return restData
                        }),
                        fid: dataId,
                        formInfo,
                        mid: originMid,
                    },
                })

                if (node) {
                    const currentShowFields = getCurrentShowData(
                        node.data.offset,
                        searchFieldData(node?.data.items, node?.data.keyWord),
                        ORIGIN_LIMIT,
                    )
                    addPortForFields(
                        node,
                        currentShowFields,
                        'origin',
                        targetFormInfo?.table_kind || FormTableKind.DATA_ORIGIN,
                    )
                    dndCase?.current?.start(node, e.nativeEvent as any)
                }
            } catch (err) {
                formatError(err)
            }
        }

        const addPortForFields = (node: Node, fields, nodeType, tableKind) => {
            fields.forEach((field, index) => {
                const position = getPositSite(
                    nodeType === 'target' ? 'leftPorts' : 'rightPorts',
                    index,
                    ExpandStatus.Expand,
                    getModel(),
                    tableKind,
                )
                node.addPort(
                    getNewPortConfig(
                        position,
                        nodeType === 'target' ? 'leftPorts' : 'rightPorts',
                        {
                            fieldId: field.id,
                            tableId:
                                node?.data?.fid || node?.data?.formInfo?.id,
                        },
                    ),
                )
            })
        }

        const addPortsForNodes = (nodes: Array<Node>) => {
            const tableKind =
                nodes.find((item) => item.data.type === 'target')?.data
                    ?.formInfo?.table_kind || FormTableKind.DATA_ORIGIN
            nodes.forEach((item) => {
                if (item.data.type === 'target') {
                    const currentShowFields = getCurrentShowData(
                        item.data.offset,
                        searchFieldData(item.data.items, item.data.keyWord),
                        TARGET_LIMIT,
                    )
                    addPortForFields(
                        item,
                        currentShowFields,
                        'target',
                        tableKind,
                    )
                } else if (item.data.expand === ExpandStatus.Expand) {
                    const currentShowFields = getCurrentShowData(
                        item.data.offset,
                        searchFieldData(item.data.items, item.data.keyWord),
                        ORIGIN_LIMIT,
                    )
                    addPortForFields(
                        item,
                        currentShowFields,
                        'origin',
                        tableKind,
                    )
                }
            })
        }

        /**
         * 更新所有表格port和连线
         */
        const updateAllPortAndEdge = () => {
            if (graphCase?.current) {
                const allNodes = graphCase.current.getNodes()
                clearNodePorts(allNodes)
                keyAndNodeRelation.clearData()
                edgeRelation.clearData()
                addPortsForNodes(allNodes)
                if (allNodes.length > 1) {
                    const targetNode = allNodes.filter(
                        (allNode) => allNode.data.type === 'target',
                    )[0]
                    const originNodes = allNodes.filter(
                        (allNode) => allNode.data.type === 'origin',
                    )
                    setQuoteKeyRelative(originNodes, targetNode)
                }
            }
        }

        /**
         * 清除所有连接桩
         * @param nodes
         */
        const clearNodePorts = (nodes) => {
            nodes.forEach((node) => {
                node.removePorts()
            })
        }

        useImperativeHandle(ref, () => ({
            getTargetData: () => {
                return {
                    ...targetFormInfo,
                    fields: targetFormNode?.data?.items || [],
                }
            },
            getGraphContent: (callback: (content: string) => void) => {
                if (graphCase?.current) {
                    const graphData = graphCase.current.toJSON()
                    if (graphData.cells.length) {
                        const currentContent = JSON.stringify(
                            graphData.cells
                                .filter((cell) => cell.shape !== 'edge')
                                .map((cell) => ({
                                    ...cell,
                                    data: {
                                        fid: cell.data.fid,
                                        mid: cell.data.mid,
                                        type: cell.data.type,
                                    },
                                })),
                        )
                        callback(currentContent)
                    }
                }
            },
        }))

        /**
         * 查找目标字段
         */
        const setQuoteKeyRelative = (originNodes, targetNode) => {
            const targetSearchData = searchFieldData(
                targetNode.data.items,
                targetNode.data.keyWord,
            )
            targetSearchData.forEach((item, index) => {
                if (item?.field_map?.source_field?.length) {
                    item.field_map?.source_field?.forEach((sourceItem) => {
                        if (keyAndNodeRelation.quoteData[sourceItem.field_id]) {
                            createRelativeByNode(
                                keyAndNodeRelation.quoteData[
                                    sourceItem.field_id
                                ],
                                targetNode,
                                sourceItem.field_id,
                                index,
                                item.id || item.uniqueId,
                            )
                        } else {
                            const originNodeFinded = originNodes.find(
                                (originNode) => {
                                    const searchOriginData = searchFieldData(
                                        originNode.data.items,
                                        originNode.data.keyWord,
                                    )
                                    return searchOriginData.find(
                                        (originItem) => {
                                            if (
                                                originItem.id ===
                                                sourceItem.field_id
                                            ) {
                                                keyAndNodeRelation.addData({
                                                    [originItem.id]: originNode,
                                                })
                                                return true
                                            }
                                            return false
                                        },
                                    )
                                },
                            )
                            if (originNodeFinded) {
                                createRelativeByNode(
                                    originNodeFinded,
                                    targetNode,
                                    sourceItem.field_id,
                                    index,
                                    item.id || item.uniqueId,
                                )
                            }
                        }
                    })
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
        const createRelativeByNode = (
            originNode,
            targetNode,
            targetId,
            index,
            targetFieldId,
        ) => {
            const { origin, target } = getOriginPosition(originNode, targetNode)

            const targetNodeItemPortId = getNodeItemPortId(
                targetNode,
                index,
                target,
                10,
                targetFieldId,
            )
            if (originNode.data.expand === ExpandStatus.Expand) {
                const originNodeItemPortId = getOriginNodePort(
                    originNode,
                    targetId,
                    origin,
                )
                addEdgeFromOriginToTarget(
                    targetId,
                    targetNode,
                    targetNodeItemPortId,
                    originNode,
                    originNodeItemPortId,
                )
            } else {
                const portId = getOriginNodeHeaderPorts(originNode, origin)
                if (portId) {
                    addEdgeFromOriginToTarget(
                        targetId,
                        targetNode,
                        targetNodeItemPortId,
                        originNode,
                        portId,
                    )
                } else {
                    const originNodeItemPortId = getOriginNodePort(
                        originNode,
                        targetId,
                        origin,
                        ExpandStatus.Retract,
                    )
                    addEdgeFromOriginToTarget(
                        targetId,
                        targetNode,
                        targetNodeItemPortId,
                        originNode,
                        originNodeItemPortId,
                    )
                }
            }
            selectOriginNodeQuoteField(originNode, targetId)
        }

        /**
         * 获取当前节点的portId
         * @param node 节点
         * @param index 当前下标
         * @param group port位置
         * @param limit 每页大小
         * @returns portId 找到返回对应id ，没找到生成port并返回''
         */
        const getNodeItemPortId = (node, index, group, limit, fieldId) => {
            const itemSite = getDataShowSite(
                index,
                node.data.offset,
                limit,
                node.data.items.length,
            )
            if (itemSite === DataShowSite.CurrentPage) {
                const currentPageIndex = getDataCurrentPageIndex(
                    index,
                    node.data.offset,
                    limit,
                    node.data.items.length,
                )
                return getPortIdFormField(fieldId, node)
            }
            if (itemSite === DataShowSite.UpPage) {
                const portId = getUpPortId(group, node)
                if (portId) {
                    return portId
                }
                if (node.data.type === 'target') {
                    setTargetNodePort(node, -1, group, 'top')
                } else {
                    setOriginNodePort(
                        node,
                        -1,
                        group,
                        ExpandStatus.Expand,
                        'top',
                    )
                }
                return ''
            }

            const portId = getDownPort(group, node)
            if (portId) {
                return portId
            }
            if (node.data.type === 'target') {
                setTargetNodePort(node, -1, group, 'bottom')
            } else {
                setOriginNodePort(
                    node,
                    -1,
                    group,
                    ExpandStatus.Expand,
                    'bottom',
                )
            }
            return ''
        }
        const getPortIdFormField = (fieldId, node) => {
            const currentPort = node
                .getPorts()
                .filter((port) => port.args?.fieldInfo?.fieldId === fieldId)
            if (currentPort && currentPort.length) {
                return currentPort[0].id
            }
            return ''
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
                .filter(
                    (port) => port.args?.site === 'top' && port.group === group,
                )
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
                    (port) =>
                        port.args?.site === 'bottom' && port.group === group,
                )
            if (currentPort && currentPort.length) {
                return currentPort[0].id
            }
            return ''
        }

        /**
         * 设置原节点的桩
         */
        const getOriginNodePort = (
            originNode,
            refId: string,
            position: string,
            expand?: ExpandStatus,
        ) => {
            let portId = ''
            const searchData = searchFieldData(
                originNode.data.items,
                originNode.data.keyWord,
            )
            searchData.forEach((originItem, index) => {
                if (originItem.id === refId) {
                    if (expand === ExpandStatus.Retract) {
                        setOriginNodePort(
                            originNode,
                            index,
                            position,
                            expand,
                            '',
                        )
                    } else {
                        portId = getNodeItemPortId(
                            originNode,
                            index,
                            position,
                            10,
                            originItem.id,
                        )
                    }
                }
            })
            return portId
        }

        /**
         *  获取左右头的桩
         */
        const getOriginNodeHeaderPorts = (originNode: Node, position) => {
            const originNodePorts = originNode.getPorts()
            let portId
            originNodePorts.forEach((originNodePort) => {
                if (originNodePort.group === position) {
                    portId = originNodePort.id || ''
                } else {
                    portId = ''
                }
            })
            return portId
        }

        /**
         * 设置目标节点的桩
         * @param targetNode 目标节点
         * @param index 下标
         * @param position 左右位置
         * @param site 顶部位置
         */
        const setTargetNodePort = (targetNode, index, position, site?) => {
            targetNode.addPort(
                getPortByNode(
                    position,
                    index,
                    'target',
                    ExpandStatus.Expand,
                    site || '',
                    getModel(),
                ),
            )
        }

        /**
         * 设置目标节点的桩
         * @param targetNode 目标节点
         * @param index 下标
         * @param position 左右位置
         * @param site 顶部位置
         */
        const setOriginNodePort = (
            originNode,
            index,
            position,
            expand,
            site?,
        ) => {
            originNode.addPort(
                getPortByNode(
                    position,
                    index,
                    'origin',
                    expand,
                    site || '',
                    getModel(),
                ),
            )
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
        const optionGraphData = (
            currentOptionType: OptionType,
            data,
            dataNode,
        ) => {
            // if (
            //     [
            //         OptionType.CreateTargetNewField,
            //         OptionType.EditTargetField,
            //         OptionType.EditTargetForm,
            //     ].includes(optionType) &&
            //     model === 'edit'
            // ) {
            //     return
            // }
            setOptionType(currentOptionType)
            switch (currentOptionType) {
                case OptionType.CreateTargetNewField:
                case OptionType.EditTargetField:
                case OptionType.ViewTargetQuoteField:
                case OptionType.ViewTargetField:
                    setEditField(data)
                    setSelectedNode(dataNode)
                    break
                case OptionType.EditTargetForm:
                case OptionType.ViewTargetForm:
                case OptionType.ViewOriginFormDetail:
                    setEditFormId(dataNode.data.fid)
                    break
                case OptionType.ViewOriginFieldDetail:
                    setSelectedNode(dataNode)
                    setEditField(data)
                    break

                default:
                    break
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
                graphCase.current.zoomToFit({ padding: FORM_PAGING_HEIGHT })
                const multiple = graphCase.current.zoom()
                const showSize = Math.round(multiple * 100)
                setGraphSize(showSize - (showSize % 5))
                return multiple
            }
            return 100
        }

        /**
         * 保存数据
         */
        const saveAllData = async () => {
            if (graphCase && graphCase.current) {
                try {
                    if (fieldsErrors) {
                        message.error(__('信息不完整，请完善后再保存'))
                        return
                    }
                    // const allNodes = graphCase.current.getNodes()
                    const fieldData = targetFormNode?.data.items || []
                    const { unquoted_fields } = await saveFields(mid, fid, {
                        fields: fieldData,
                        task_id: taskId,
                    })
                    updateReqAddStandard()

                    const graphData = graphCase.current.toJSON()
                    if (graphData.cells.length) {
                        saveFormGraph(mid, fid || '', {
                            task_id: taskId,
                            content: JSON.stringify(
                                graphData.cells
                                    .filter((cell) => cell.shape !== 'edge')
                                    .map((cell) => ({
                                        ...cell,
                                        data: {
                                            fid: cell.data.fid,
                                            mid: cell.data.mid,
                                            type: cell.data.type,
                                        },
                                    })),
                            ),
                        })
                    }
                    if (unquoted_fields.length) {
                        setSaveResultData(
                            unquoted_fields.map((unquoted) => unquoted.name),
                        )
                    } else {
                        if (searchParams.get('jumpMode') !== 'win') {
                            navigator(combUrl(queryData))
                            return
                        }
                        window.open(getActualUrl(combUrl(queryData)), '_self')
                    }
                    message.success('保存成功')
                } catch (ex) {
                    formatError(ex)
                }
            }
        }

        // 修改字段信息时，需同步修改 标准化-待新建 原始字段信息
        const updateReqAddStandard = async () => {
            try {
                const fieldData = targetFormNode?.data.items || []

                const selFields: Array<IBusinTableField> =
                    fieldData
                        ?.filter(
                            (item) =>
                                item?.id &&
                                [ToBeCreStdStatus?.WAITING].includes(
                                    item?.standard_create_status,
                                ),
                        )
                        ?.map((fItem) => ({
                            id: fItem?.id || '',
                            business_table_name: targetFormInfo?.name,
                            business_table_id: fid || '',
                            business_table_type:
                                targetFormInfo?.form_type || '',
                            create_user: userInfo?.VisionName || '',
                            business_table_field_id: fItem?.id || '',
                            business_table_field_current_name:
                                fItem?.changedField?.name || fItem?.name || '',
                            business_table_field_origin_name: fItem?.name || '',
                            business_table_field_current_name_en:
                                fItem?.changedField?.name_en ||
                                fItem?.name_en ||
                                '',
                            business_table_field_origin_name_en:
                                fItem?.name_en || '',
                            business_table_field_current_std_type:
                                fItem?.changedField?.formulate_basis ||
                                fItem?.formulate_basis,
                            business_table_field_origin_std_type:
                                fItem?.formulate_basis,
                            business_table_field_data_type: fItem?.data_type,
                            business_table_field_data_length:
                                fItem?.data_length,
                            business_table_field_data_precision:
                                fItem?.data_accuracy,

                            business_table_field_dict_name: '',
                            business_table_field_description:
                                fItem?.description || '',
                            data_element_id: '',
                        })) || []

                if (selFields?.length) {
                    // 修改 待发起 中字段信息
                    await addToPending(mid, selFields)
                }
            } catch (error) {
                formatError(error)
            }
        }

        /**
         * 将引用节点选中
         */
        const selectOriginNodeQuoteField = (originNode, ref_id) => {
            if (!originNode.data.selectedFiledsId.includes(ref_id)) {
                originNode.setData({
                    ...originNode.data,
                    selectedFiledsId: [
                        ...originNode.data.selectedFiledsId,
                        ref_id,
                    ],
                })
            }
        }

        /**
         * 触发删除来源表
         * @param originNode
         */
        const handleDeleteOriginForm = (originNode) => {
            const relationsData = getOriginDataRelation(
                targetFormNode?.data.items,
                originNode.data.items,
            )
            if (relationsData.length) {
                setDeleteFormNode(originNode)
            } else {
                graphCase?.current?.removeCell(originNode.id)
            }
        }
        /**
         * 删除带有引用的来源表
         */
        const handleDeleteConfirm = (deletedModel: DeleteMode) => {
            const relationsData = getOriginDataRelation(
                targetFormNode?.data.items,
                deleteFormNode?.data.items,
            )
            const newItems = removeTargetFormRelationByTable(
                targetFormNode?.data.items,
                deleteFormNode?.data?.formInfo?.id,
            )
            targetFormNode?.replaceData({
                ...targetFormNode.data,
                items: newItems,
            })
            if (deleteFormNode && graphCase?.current) {
                graphCase.current.removeCell(deleteFormNode.id)
            }
            setDeleteFormNode(null)
            updateAllPortAndEdge()
        }

        const onViewFormField = (node: Node) => {
            setViewTableNode(node)
        }
        /**
         * 查看逻辑表字段
         * @param node
         */
        const onVieLogicFormField = (logicViewId: string) => {
            setViewLogicFormId(logicViewId)
        }

        /**
         * 画布定位到中心
         */
        const movedToCenter = () => {
            graphCase.current?.centerContent()
        }

        /**
         * 删除字段后的更新
         */
        const cancelOriginFormFiledSelected = (sourceFields) => {
            const originNodes = sourceFields.map(
                (item) => keyAndNodeRelation.quoteData[item?.field_id],
            )
            const fields = sourceFields?.map((item) => item?.field_id)
            originNodes.forEach((originNode) => {
                originNode?.replaceData({
                    ...originNode.data,
                    selectedFiledsId: originNode.data.selectedFiledsId.filter(
                        (id) => fields?.includes(id),
                    ),
                })
            })
            setUsedFieldIds(
                usedFieldIds.filter(
                    (it) =>
                        !sourceFields
                            .map((item) => item?.field_id || '')
                            .includes(it),
                ),
            )
            fields?.forEach((id) => {
                keyAndNodeRelation.deleteData(id)
            })
        }

        /**
         * 排序字段
         * @param node
         */
        const handleSortField = (node: Node) => {
            setSortFieldNode(node)
        }

        const contextValue = useMemo(() => {
            return {
                graphCase: graphCase?.current || null,
                updateAllPortAndEdge,
                keyAndNodeRelation,
                edgeRelation,
                optionGraphData,
                handleDeleteOriginForm,
                onViewFormField,
                setHasField,
                setIsDisabledRelateObj,
                onSortField: handleSortField,
                onVieLogicFormField,
                tableKind:
                    targetFormInfo?.table_kind || FormTableKind.DATA_ORIGIN,
                usedFieldIds,
                updateUsedFieldIds: setUsedFieldIds,
                onOpenConvergenceRules: (fields, node) => {
                    setConfigRulesInfo(fields)
                    setConfigRulesNode(node)
                },
                configRulesInfo,
            }
        }, [
            graphCase,
            updateAllPortAndEdge,
            keyAndNodeRelation,
            edgeRelation,
            optionGraphData,
            handleDeleteOriginForm,
            onViewFormField,
            setHasField,
            setIsDisabledRelateObj,
            handleSortField,
            onVieLogicFormField,
            targetFormInfo,
            usedFieldIds,
            setUsedFieldIds,
            configRulesInfo,
        ])

        return (
            <div className={styles.main}>
                <GraphToolBar
                    mid={mid}
                    targetFormInfo={targetFormInfo}
                    onSaveGraph={() => {
                        saveAllData()
                    }}
                    onChangeGraphSize={changeGraphSize}
                    onShowAllGraphSize={showAllGraphSize}
                    graphSize={graphSize}
                    onUpdateFormInfo={(data) => {
                        setTargetFormInfo(data)
                    }}
                    saveDisabled={
                        [
                            OptionType.CreateTargetNewField,
                            OptionType.EditTargetField,
                            OptionType.EditTargetForm,
                        ].includes(optionType) || relateBusinessObject
                    }
                    model={model}
                    queryData={queryData}
                    onMovedToCenter={movedToCenter}
                    isShowEdit={isShowEdit}
                    onSwitchModel={() => {
                        const locationUrl = window.location.href
                        const regx = /defaultModel=view/i

                        window.history.replaceState(
                            {},
                            'title',
                            locationUrl.replace(regx, 'defaultModel=edit'),
                        )
                        setModel('edit')
                        if (graphCase && graphCase.current) {
                            graphCase.current
                                .getNodes()
                                .forEach((currentNode) => {
                                    currentNode.replaceData({
                                        ...currentNode.data,
                                        switchStatus: true,
                                    })
                                })
                        }
                    }}
                />
                <div
                    className={styles.graphContent}
                    style={{
                        height: 'calc(100% - 52px)',
                    }}
                    ref={sortFieldsContainerRef}
                >
                    <DragBox
                        defaultSize={
                            model === 'view' ||
                            targetFormInfo?.table_kind ===
                                FormTableKind.DATA_STANDARD ||
                            targetFormInfo?.table_kind ===
                                FormTableKind.DATA_ORIGIN
                                ? [0, 100]
                                : defaultSize
                        }
                        minSize={
                            model === 'view' ||
                            targetFormInfo?.table_kind ===
                                FormTableKind.DATA_STANDARD ||
                            targetFormInfo?.table_kind ===
                                FormTableKind.DATA_ORIGIN
                                ? [0, 500]
                                : [120, 500]
                        }
                        maxSize={[300, Infinity]}
                        onDragEnd={(size) => {
                            setDefaultSize(size)
                        }}
                        gutterStyles={{
                            background: '#EFF2F5',
                            width:
                                model === 'view' ||
                                targetFormInfo?.table_kind ===
                                    FormTableKind.DATA_STANDARD ||
                                targetFormInfo?.table_kind ===
                                    FormTableKind.DATA_ORIGIN
                                    ? 0
                                    : '5px',
                            cursor: 'ew-resize',
                        }}
                        hiddenElement={
                            model === 'view' ||
                            targetFormInfo?.table_kind ===
                                FormTableKind.DATA_STANDARD ||
                            targetFormInfo?.table_kind ===
                                FormTableKind.DATA_ORIGIN
                                ? 'left'
                                : ''
                        }
                        gutterSize={
                            model === 'view' ||
                            targetFormInfo?.table_kind ===
                                FormTableKind.DATA_STANDARD ||
                            targetFormInfo?.table_kind ===
                                FormTableKind.DATA_ORIGIN
                                ? 1
                                : 5
                        }
                        existPadding={false}
                    >
                        {model === 'view' ||
                        targetFormInfo?.table_kind ===
                            FormTableKind.DATA_STANDARD ||
                        targetFormInfo?.table_kind ===
                            FormTableKind.DATA_ORIGIN ? (
                            <div />
                        ) : (
                            <div
                                ref={dndContainer}
                                className={styles.dndDrag}
                                onClick={() => {
                                    if (
                                        [
                                            OptionType.CreateTargetNewField,
                                            OptionType.EditTargetField,
                                            OptionType.EditTargetForm,
                                        ].includes(optionType) &&
                                        model === 'edit'
                                    ) {
                                        return
                                    }
                                    if (optionType !== OptionType.NoOption) {
                                        setOptionType(OptionType.NoOption)
                                        setEditFormId('')
                                        setEditField(null)
                                    }
                                }}
                            >
                                {/* <div data-id="123" onMouseDown={startDrag}>
                            节点1
                        </div> */}
                                <SelectFormList
                                    formInfo={targetFormInfo}
                                    targetNode={targetFormNode}
                                    mid={mid}
                                    onStartDrag={startDrag}
                                    allOriginNodes={allOriginNodes}
                                />
                            </div>
                        )}

                        <div
                            style={{
                                display: 'flex',
                                position: 'relative',
                                width: '100%',
                                height: '100%',
                            }}
                            onClick={() => {
                                if (
                                    [
                                        OptionType.CreateTargetNewField,
                                        OptionType.EditTargetField,
                                        OptionType.EditTargetForm,
                                    ].includes(optionType) &&
                                    model === 'edit'
                                ) {
                                    return
                                }
                                if (optionType !== OptionType.NoOption) {
                                    setOptionType(OptionType.NoOption)
                                    setEditFormId('')
                                    setEditField(null)
                                }
                            }}
                        >
                            <GraphContextProvider value={contextValue}>
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
                            </GraphContextProvider>

                            <div className={styles.titleTip}>
                                {__('数据表图表')}
                            </div>
                            <div
                                style={{
                                    position: 'absolute',
                                    left: 30,
                                    bottom: 24,
                                }}
                            >
                                <TypeShow type={targetFormInfo?.table_kind} />
                            </div>
                        </div>
                    </DragBox>

                    {[
                        OptionType.CreateTargetNewField,
                        OptionType.EditTargetField,
                        OptionType.ViewTargetQuoteField,
                    ].includes(optionType) &&
                        editField && (
                            <FieldConfig
                                data={editField}
                                node={seletedNode}
                                model={model}
                                onClose={() => {
                                    setEditField(null)
                                    setOptionType(OptionType.NoOption)
                                }}
                                isStart={isStart}
                                tagData={tagData}
                                onUpdateGraph={(isDisabled?: boolean) => {
                                    // 有新建 即设置不能关联业务对象
                                    if (isDisabled) {
                                        const items =
                                            seletedNode?.data.items || []
                                        // 新建字段后更新分页
                                        seletedNode?.replaceData({
                                            ...seletedNode?.data,
                                            items,
                                            offset:
                                                Math.ceil(items.length / 10) -
                                                1,
                                            disabledRelateObj: true,
                                        })
                                    }

                                    updateAllPortAndEdge()
                                }}
                                taskId={taskId}
                                updateErrorFields={(id) => {
                                    if (
                                        fieldsErrors &&
                                        Object.keys(fieldsErrors).includes(
                                            id.toString(),
                                        )
                                    ) {
                                        const newFieldsErrors = fieldsErrors
                                        delete newFieldsErrors[id]
                                        if (
                                            Object.keys(newFieldsErrors).length
                                        ) {
                                            setFieldsError(newFieldsErrors)
                                        } else {
                                            setFieldsError(null)
                                        }
                                    }
                                }}
                                dataKind={
                                    targetFormInfo?.table_kind ||
                                    FormTableKind.DATA_ORIGIN
                                }
                            />
                        )}

                    {optionType === OptionType.EditTargetForm && (
                        <EditFormConfig
                            formId={editFormId}
                            mid={mid}
                            model={model}
                            taskId={taskId}
                            onClose={() => {
                                setEditFormId('')
                                setOptionType(OptionType.NoOption)
                            }}
                            onUpdate={(info) => {
                                targetFormNode?.replaceData({
                                    ...targetFormNode.data,
                                    formInfo: { ...targetFormInfo, ...info },
                                })
                                setTargetFormInfo({
                                    ...targetFormInfo,
                                    ...info,
                                })
                            }}
                        />
                    )}

                    {(optionType === OptionType.ViewOriginFormDetail ||
                        optionType === OptionType.ViewTargetForm) && (
                        <ViewFormDetail
                            formId={editFormId}
                            mid={mid}
                            onClose={() => {
                                setEditFormId('')
                                setOptionType(OptionType.NoOption)
                            }}
                        />
                    )}
                    {(optionType === OptionType.ViewOriginFieldDetail ||
                        optionType === OptionType.ViewTargetField) && (
                        <ViewFieldDetail
                            data={editField}
                            node={seletedNode}
                            onClose={() => {
                                setEditField(null)
                                setOptionType(OptionType.NoOption)
                            }}
                            tableKind={
                                seletedNode?.data?.formInfo?.table_kind ||
                                FormTableKind.DATA_ORIGIN
                            }
                        />
                    )}

                    {deleteFormNode && (
                        <Modal
                            open
                            width={480}
                            title={null}
                            getContainer={false}
                            // onOk={handleDeleteConfirm}
                            footer={
                                <Space size={8}>
                                    <Button
                                        onClick={() => {
                                            setDeleteFormNode(null)
                                        }}
                                    >
                                        {__('取消')}
                                    </Button>
                                    {/* <Button
                                        onClick={() => {
                                            handleDeleteConfirm(DeleteMode.Copy)
                                        }}
                                    >
                                        {__('仅保留字段')}
                                    </Button> */}
                                    <Button
                                        onClick={() => {
                                            handleDeleteConfirm(
                                                DeleteMode.Delete,
                                            )
                                        }}
                                        type="primary"
                                    >
                                        {__('确定')}
                                    </Button>
                                </Space>
                            }
                        >
                            <div>
                                <ExclamationCircleFilled
                                    style={{
                                        color: '#e60012',
                                        marginRight: 16,
                                        fontSize: 22,
                                    }}
                                />
                                <span
                                    style={{
                                        fontWeight: 550,
                                        fontSize: '16px',
                                        lineHeight: 1.4,
                                    }}
                                >
                                    {deleteFormNode.data.formInfo
                                        ?.table_kind === FormTableKind.STANDARD
                                        ? __('确定要删除${name}吗？', {
                                              name: FormTableKindOptions.find(
                                                  (it) =>
                                                      deleteFormNode?.data
                                                          ?.formInfo
                                                          ?.table_kind ===
                                                      it.value,
                                              )?.label,
                                          })
                                        : __('确认要删除该数据表吗？')}
                                </span>
                            </div>
                            <div style={{ marginLeft: 38, marginTop: 8 }}>
                                {deleteFormNode.data.formInfo?.table_kind ===
                                FormTableKind.DATA_FUSION
                                    ? __(
                                          '删除后映射到数据融合表的字段将自动删除映射，请谨慎操作',
                                      )
                                    : __(
                                          '删除后字段关联关系将自动解除，请谨慎操作！',
                                      )}
                            </div>
                        </Modal>
                    )}
                    {hasFileds.length ? (
                        <Modal
                            open
                            width={480}
                            onCancel={() => {
                                setDeleteFormNode(null)
                            }}
                            title={null}
                            closable={false}
                            maskClosable={false}
                            getContainer={false}
                            footer={
                                <div>
                                    <Button
                                        type="primary"
                                        onClick={() => {
                                            setHasField([])
                                        }}
                                    >
                                        {__('知道了')}
                                    </Button>
                                </div>
                            }
                            className={styles.tipMessage}
                        >
                            <div className={styles.dupBody}>
                                <div>
                                    <span className={styles.dupInfoIcon}>
                                        <InfoCircleFilled />
                                    </span>
                                </div>
                                <div className={styles.dupContent}>
                                    <div className={styles.dupTitle}>
                                        {__('字段已在目标中不可重复映射')}
                                    </div>
                                    <div className={styles.dupNamelist}>
                                        <Space wrap>
                                            {hasFileds.map(
                                                (hasFiled, index) => {
                                                    return (
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                            }}
                                                        >
                                                            <div
                                                                className={
                                                                    styles.dupNameItem
                                                                }
                                                                title={hasFiled}
                                                            >
                                                                {hasFiled}
                                                            </div>
                                                            {index + 1 ===
                                                            hasFileds.length
                                                                ? ''
                                                                : '、'}
                                                        </div>
                                                    )
                                                },
                                            )}
                                        </Space>
                                    </div>
                                </div>
                            </div>
                        </Modal>
                    ) : null}
                    {/* 点击画布详情出现的详情弹窗 */}
                    {viewTableNode && (
                        <FieldTableView
                            node={viewTableNode}
                            formId={viewTableNode?.data?.fid}
                            onClose={() => {
                                setViewTableNode(null)
                            }}
                            items={viewTableNode.data.items}
                            model={model}
                            quoteKeys={
                                viewTableNode.data.type === 'origin'
                                    ? getOriginDataRelation(
                                          targetFormNode?.data.items || [],
                                          viewTableNode.data.items || [],
                                      )
                                    : null
                            }
                        />
                    )}

                    {viewLogicFormId && (
                        <FieldTableLogic
                            id={viewLogicFormId}
                            visible={!!viewLogicFormId}
                            onClose={() => {
                                setViewLogicFormId('')
                            }}
                        />
                    )}

                    {!!deleteTargetFields.length && (
                        <Modal
                            open
                            width={480}
                            onCancel={() => {
                                setDeleteTargetFields([])
                            }}
                            title={null}
                            className={styles.tipMessage}
                            closable={false}
                            maskClosable={false}
                            getContainer={false}
                            onOk={() => {
                                if (targetFormNode) {
                                    const newAllOffset = Math.ceil(
                                        (targetFormNode.data.items.length -
                                            deleteTargetFields.length) /
                                            10,
                                    )
                                    targetFormNode.replaceData({
                                        ...targetFormNode.data,
                                        items: targetFormNode.data.items.filter(
                                            (targetItem) => {
                                                if (
                                                    deleteTargetFields.find(
                                                        (item) =>
                                                            item.id ===
                                                            targetItem.id,
                                                    )
                                                ) {
                                                    if (
                                                        targetItem?.field_map
                                                            ?.source_field
                                                            ?.length
                                                    ) {
                                                        cancelOriginFormFiledSelected(
                                                            targetItem.field_map
                                                                ?.source_field,
                                                        )
                                                    }
                                                    return false
                                                }
                                                return true
                                            },
                                        ),
                                        offset:
                                            newAllOffset !== 0 &&
                                            newAllOffset <
                                                targetFormNode.data.offset + 1
                                                ? newAllOffset - 1
                                                : targetFormNode.data.offset,
                                        disabledRelateObj: true,
                                    })
                                    if (fieldsErrors) {
                                        const newErrorsFields = fieldsErrors
                                        deleteTargetFields.forEach(
                                            (currentField) => {
                                                if (
                                                    Object.keys(
                                                        newErrorsFields,
                                                    ).includes(
                                                        currentField.uniqueId.toString(),
                                                    )
                                                ) {
                                                    delete newErrorsFields[
                                                        currentField.uniqueId
                                                    ]
                                                }
                                            },
                                        )
                                        if (
                                            Object.keys(newErrorsFields).length
                                        ) {
                                            setFieldsError(newErrorsFields)
                                        } else {
                                            setFieldsError(null)
                                        }
                                    }
                                    // editField,表示当前点击选中的行数据，deleteTargetFields表示当前需要删除的数据
                                    if (editField) {
                                        if (
                                            deleteTargetFields.find(
                                                (item) =>
                                                    item.id === editField.id,
                                            )
                                        ) {
                                            setEditField(null)
                                            setOptionType(OptionType.NoOption)
                                        }
                                    }

                                    const deleteUseFieldIds = deleteTargetFields
                                        .map((it) =>
                                            it.field_map?.source_field?.map(
                                                (field) => field.field_id,
                                            ),
                                        )
                                        .flat()
                                    setUsedFieldIds(
                                        usedFieldIds.filter(
                                            (it) =>
                                                !deleteUseFieldIds.includes(it),
                                        ),
                                    )
                                    setDeleteTargetFields([])
                                    updateAllPortAndEdge()
                                }
                            }}
                        >
                            <div className={styles.dupBody}>
                                <div>
                                    <span className={styles.deleteInfoIcon}>
                                        <ExclamationCircleFilled />
                                    </span>
                                </div>
                                <div className={styles.dupContent}>
                                    <div className={styles.dupTitle}>
                                        {__('确认要删除字段吗？')}
                                    </div>
                                    <div className={styles.deleteInfo}>
                                        {__(
                                            '字段及其字段信息被删除后无法找回，请谨慎操作！',
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Modal>
                    )}

                    {saveResultData.length ? (
                        <Modal
                            open
                            width={480}
                            onCancel={() => {
                                setDeleteFormNode(null)
                            }}
                            title={null}
                            closable={false}
                            maskClosable={false}
                            getContainer={false}
                            className={styles.tipMessage}
                            footer={
                                <div>
                                    <Button
                                        type="primary"
                                        onClick={() => {
                                            navigator(combUrl(queryData))
                                            setSaveResultData([])
                                        }}
                                    >
                                        {__('知道了')}
                                    </Button>
                                </div>
                            }
                        >
                            <div className={styles.dupBody}>
                                <div>
                                    <span className={styles.dupInfoIcon}>
                                        <InfoCircleFilled />
                                    </span>
                                </div>
                                <div className={styles.dupContent}>
                                    <div className={styles.dupTitle}>
                                        {__(
                                            '引用的字段可能已被删除，系统已将其变更为复制',
                                        )}
                                    </div>
                                    <div className={styles.dupNamelist}>
                                        <Space wrap>
                                            {saveResultData.map(
                                                (hasFiled, index) => {
                                                    return (
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                            }}
                                                        >
                                                            <div
                                                                className={
                                                                    styles.dupNameItem
                                                                }
                                                                title={hasFiled}
                                                            >
                                                                {hasFiled}
                                                            </div>
                                                            {index + 1 ===
                                                            saveResultData.length
                                                                ? ''
                                                                : '、'}
                                                        </div>
                                                    )
                                                },
                                            )}
                                        </Space>
                                    </div>
                                </div>
                            </div>
                        </Modal>
                    ) : null}

                    {relateBusinessObject && (
                        <BusinessFormDefineObj
                            open={relateBusinessObject}
                            onClose={() => setRelateBusinessObject(false)}
                            getBusinessFormFields={getBusinessFormFields}
                            formId={fid}
                            formName={targetFormInfo.name}
                            mode={model as any}
                        />
                    )}
                    {sortFieldNode && (
                        <div>
                            <SortFields
                                node={sortFieldNode}
                                onClose={() => {
                                    setSortFieldNode(null)
                                    updateAllPortAndEdge()
                                }}
                                onConfirm={(sortList) => {
                                    // if (
                                    //     targetFormInfo.table_kind ===
                                    //         FormTableKind.DATA_STANDARD &&
                                    //     graphCase.current
                                    // ) {
                                    //     const nodes =
                                    //         graphCase.current.getNodes()
                                    //     const originNode = nodes.find(
                                    //         (node) =>
                                    //             node.data.type === 'origin',
                                    //     )
                                    //     if (originNode) {
                                    //         originNode.replaceData({
                                    //             ...originNode.data,
                                    //             items: sortFields(
                                    //                 changeFieldIndexOrigin(
                                    //                     originNode.data.items,
                                    //                     sortList,
                                    //                 ),
                                    //             ),
                                    //         })
                                    //     }
                                    // }
                                    setSortFieldNode(null)
                                    updateAllPortAndEdge()
                                }}
                                getContainer={sortFieldsContainerRef.current}
                            />
                        </div>
                    )}
                    {configRulesInfo && configRulesNode && (
                        <ConfigConvergenceRules
                            open={!!configRulesInfo}
                            onClose={() => {
                                setConfigRulesInfo(null)
                                setConfigRulesNode(null)
                            }}
                            data={configRulesInfo}
                            node={configRulesNode}
                            model={model as any}
                        />
                    )}
                </div>
            </div>
        )
    },
)

interface IDataFormGraph {}
const DataFormGraph: FC<IDataFormGraph> = () => {
    const [editModel, setEditModel] = useState<EditFormModel>(
        EditFormModel.GraphModel,
    )

    // 图内方法
    const graphRef: any = useRef()
    // 表内方法
    const tableRef: any = useRef()
    // 业务表数据
    const [formData, setFormDatas] = useState<any>()

    const [changeBtnStatus, setChangeBtnStatus] = useState<boolean>(false)
    // 图数据
    const [graphContent, setGraphContent] = useState<string>('')

    const [fromTableErrors, setFromTableErrors] = useState<any>(null)

    // 是否开启数据分级
    const [isStart, setIsStart] = useState(false)
    const [tagData, setTagData] = useState<IGradeLabel[]>([])

    const getClassificationTag = async () => {
        try {
            const res = await getDataGradeLabel({ keyword: '' })
            generateFullPathData(res?.entries || [], [])
            setTagData(res?.entries || [])
        } catch (error) {
            formatError(error)
        }
    }

    const getTagStatus = async () => {
        try {
            const res = await getDataGradeLabelStatus()
            setIsStart(res === GradeLabelStatusEnum.Open)
            if (res === GradeLabelStatusEnum.Open) {
                getClassificationTag()
            }
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getTagStatus()
    }, [])

    return (
        <div className={styles.formGraphWrapper}>
            <FormGraphModel
                ref={graphRef}
                initData={formData}
                graphContent={graphContent}
                errorFields={fromTableErrors}
                isStart={isStart}
                tagData={tagData}
            />
        </div>
    )
}
export default DataFormGraph
