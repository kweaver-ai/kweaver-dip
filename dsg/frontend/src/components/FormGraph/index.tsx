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
import { Button, message, Modal, Radio, Space, Tooltip } from 'antd'
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
    LogicViewNodeTemplate,
    sortFields,
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
    transformQuery,
    getDatasheetViewDetails,
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
import FormTableMode from '../FormTableMode'
import { FormTableKind, NewFormType, ToBeCreStdStatus } from '../Forms/const'
import { FormListModelOutlined, FormTableModelOutlined } from '@/icons'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getErrorDatas } from '../FormTableMode/const'
import { FormListTabType } from './const'
import logicViewNode from './LogicViewNode'
import { GraphContextProvider } from './GraphContext'
import SortFields from './SortFields'
import FieldTableLogic from './FieldTableLogic'
import { useBusinessModelContext } from '../BusinessModeling/BusinessModelProvider'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IFormGraphModel {
    ref: any
    initData?: any
    graphContent?: string
    errorFields?: any
    isStart: boolean
    tagData: IGradeLabel[]
    initDepartmentId?: string
}
const FormGraphModel: FC<IFormGraphModel> = forwardRef(
    (
        {
            initData,
            graphContent,
            errorFields,
            isStart,
            tagData,
            initDepartmentId,
        }: any,
        ref,
    ) => {
        const graphCase = useRef<GraphType>()
        const dndCase = useRef<Dnd>()
        const container = useRef<HTMLDivElement>(null)
        const dndContainer = useRef<HTMLDivElement>(null)
        const [editField, setEditField] = useState<FormFiled | null>(null)
        const [seletedNode, setSelectedNode] = useState<Node | null>(null)
        const [targetFormInfo, setTargetFormInfo] = useState<any>(null)
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

        const { isDraft, selectedVersion, refreshDragData, getDragData } =
            useBusinessModelContext()
        const [departmentId, setDepartmentId] = useState<string>('')

        const versionParams = useMemo(() => {
            // 优先使用拖拽数据中的 is_draft，如果没有则使用全局的 isDraft
            const dragData = getDragData ? getDragData(fid) : {}
            const currentIsDraft =
                dragData?.is_draft !== undefined ? dragData.is_draft : isDraft
            return transformQuery({ isDraft: currentIsDraft, selectedVersion })
        }, [isDraft, selectedVersion, getDragData, fid])

        useEffect(() => {
            setFieldsError(errorFields)
        }, [errorFields])

        useEffect(() => {
            setDepartmentId(initDepartmentId)
        }, [initDepartmentId])

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
                    graph.getNodes().forEach((currentNode) => {
                        // if (currentNode.data.type !== 'target') {
                        //     setAllOriginNodes([...allOriginNodes, currentNode])
                        // }
                        if (
                            currentNode.id !== node.id &&
                            currentNode.data.type !== 'target' &&
                            currentNode.data.expand === ExpandStatus.Expand
                        ) {
                            currentNode.setData({
                                ...currentNode.data,
                                expand: ExpandStatus.Retract,
                            })
                            updateAllPortAndEdge()
                        }
                    })
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
                    if (graphContent && initData) {
                        const content = graphContent
                        const { fields: entries, ...formInfo } = initData
                        setTargetFormInfo(formInfo)
                        if (entries.length && !content) {
                            initLoadTargetForm(
                                {
                                    ...FormTargetNodeTemplate,
                                    position: {
                                        x: 400,
                                        y: 200,
                                    },
                                },
                                entries,
                                formInfo,
                            )
                        } else if (entries && content) {
                            const graphDatas = JSON.parse(content)
                            await graphDatas.forEach(async (graphData) => {
                                if (graphData.data.type === 'target') {
                                    await initLoadTargetForm(
                                        graphData,
                                        entries,
                                        formInfo,
                                    )
                                } else if (graphData.data.type === 'origin') {
                                    await initLoadOriginForm(graphData)
                                } else if (
                                    graphData.data.type === 'logic-view'
                                ) {
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
                                    position: {
                                        x: 400,
                                        y: 200,
                                    },
                                },
                                [],
                                formInfo,
                            )
                        }
                    } else {
                        const [formInfo, { content }] = await Promise.all([
                            getFormQueryItem(fid, {
                                ...versionParams,
                            }),
                            getFormGraph(mid, fid, {
                                ...versionParams,
                            }),
                        ])
                        setTargetFormInfo(formInfo)
                        const { entries, department_id } =
                            await getFormsFieldsList(fid, {
                                limit: 999,
                                ...versionParams,
                            })
                        setDepartmentId(department_id)
                        if (entries.length && !content) {
                            initLoadTargetForm(
                                {
                                    ...FormTargetNodeTemplate,
                                    position: {
                                        x: 400,
                                        y: 200,
                                    },
                                },
                                entries,
                                formInfo,
                            )
                        } else if (entries && content) {
                            const graphDatas = JSON.parse(content)
                            await graphDatas.forEach(async (graphData) => {
                                if (graphData.data.type === 'target') {
                                    await initLoadTargetForm(
                                        {
                                            ...graphData,
                                            ports: FormTargetNodeTemplate.ports,
                                        },
                                        entries,
                                        formInfo,
                                    )
                                } else if (graphData.data.type === 'origin') {
                                    await initLoadOriginForm({
                                        ...graphData,
                                        ports: FormTargetNodeTemplate.ports,
                                    })
                                } else if (
                                    graphData.data.type === 'logic-view'
                                ) {
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
                                    position: {
                                        x: 400,
                                        y: 200,
                                    },
                                },
                                [],
                                formInfo,
                            )
                        }
                    }
                    setTimeout(() => {
                        movedToCenter()
                    }, 0)
                }
            } catch (ex) {
                formatError(ex)
            }
        }

        /**
         * 加载目标表数据
         * @param targetNodeData 目标表
         * @param itemsData 数据
         */
        const initLoadTargetForm = (targetNodeData, itemsData, formInfo) => {
            try {
                if (graphCase?.current) {
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
                                        index: itemData?.index || index + 1,
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

        /**
         * 加载来源表
         */
        const initLoadOriginForm = async (originNodeData) => {
            try {
                if (graphCase && graphCase.current) {
                    const { entries } = await getFormsFieldsList(
                        originNodeData.data.fid,
                        {
                            limit: 999,
                            ...versionParams,
                        },
                    )
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
                            fid: originNodeData.data.fid,
                            mid: originNodeData.data.mid,
                            type: 'origin',
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

        /**
         * 拖拽来源表
         * @param e 事件
         */
        const startDrag = async (
            e: React.MouseEvent<HTMLDivElement, MouseEvent>,
            originMid: string,
            dataId: string,
            type: FormListTabType,
            data?: any,
        ) => {
            if (type === FormListTabType.BusinessForm) {
                dragBusinessForm(e, originMid, dataId, data)
            } else {
                dragLogicView(e, dataId)
            }
        }

        /**
         * 拖拽业务表
         * @param e 事件
         * @param originMid 来源表mid
         * @param dataId 业务表id
         * @param data 额外数据
         */
        const dragBusinessForm = async (
            e: React.MouseEvent<HTMLDivElement, MouseEvent>,
            originMid: string,
            dataId: string,
            data?: any,
        ) => {
            try {
                // 将拖拽数据存储到 BusinessModelContext 中
                if (data && refreshDragData) {
                    refreshDragData(data)
                }

                const { entries } = await getFormsFieldsList(dataId, {
                    limit: 999,
                    is_draft: transformQuery({ isDraft: data?.is_draft })
                        ?.is_draft,
                })
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
                        mid: originMid,
                    },
                })
                if (node) {
                    dndCase?.current?.start(node, e.nativeEvent as any)
                }
            } catch (err) {
                formatError(err)
            }
        }

        /**
         * 拖拽库表
         * @param e 事件
         * @param dataId 库表id
         */
        const dragLogicView = async (
            e: React.MouseEvent<HTMLDivElement, MouseEvent>,
            dataId: string,
        ) => {
            try {
                const { fields, ...dataSheetFormInfo } =
                    await getDatasheetViewDetails(dataId)
                const node = graphCase?.current?.createNode({
                    ...LogicViewNodeTemplate,
                    height:
                        fields.length > 10
                            ? 520
                            : fields.length === 0
                            ? 166
                            : FORM_HEADER_HEIGHT +
                              (fields.length + 1) * FORM_FIELD_HEIGHT +
                              FORM_PAGING_HEIGHT,
                    data: {
                        ...LogicViewNodeTemplate.data,
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
                            id: dataId,
                        },
                        formType: FormListTabType.LogicView,
                        fid: dataId,
                        mid: '',
                    },
                })
                if (node) {
                    dndCase?.current?.start(node, e.nativeEvent as any)
                }
            } catch (err) {
                formatError(err)
            }
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
            getDepartmentId: () => {
                return departmentId
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
                if (item.ref_id) {
                    if (keyAndNodeRelation.quoteData[item.ref_id]) {
                        createRelativeByNode(
                            keyAndNodeRelation.quoteData[item.ref_id],
                            targetNode,
                            item,
                            index,
                        )
                    } else {
                        const originNodeFinded = originNodes.find(
                            (originNode) => {
                                const searchOriginData = searchFieldData(
                                    originNode.data.items,
                                    originNode.data.keyWord,
                                )
                                return searchOriginData.find((originItem) => {
                                    if (originItem.id === item.ref_id) {
                                        keyAndNodeRelation.addData({
                                            [originItem.id]: originNode,
                                        })
                                        return true
                                    }
                                    return false
                                })
                            },
                        )
                        if (originNodeFinded) {
                            createRelativeByNode(
                                originNodeFinded,
                                targetNode,
                                item,
                                index,
                            )
                        }
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

            const targetNodeItemPortId = getNodeItemPortId(
                targetNode,
                index,
                target,
                10,
            )
            if (originNode.data.expand === ExpandStatus.Expand) {
                const originNodeItemPortId = getOriginNodePort(
                    originNode,
                    item.ref_id,
                    origin,
                )
                addEdgeFromOriginToTarget(
                    item.ref_id,
                    targetNode,
                    targetNodeItemPortId,
                    originNode,
                    originNodeItemPortId,
                )
            } else {
                const portId = getOriginNodeHeaderPorts(originNode, origin)
                if (portId) {
                    addEdgeFromOriginToTarget(
                        item.ref_id,
                        targetNode,
                        targetNodeItemPortId,
                        originNode,
                        portId,
                    )
                } else {
                    const originNodeItemPortId = getOriginNodePort(
                        originNode,
                        item.ref_id,
                        origin,
                        ExpandStatus.Retract,
                    )
                    addEdgeFromOriginToTarget(
                        item.ref_id,
                        targetNode,
                        targetNodeItemPortId,
                        originNode,
                        originNodeItemPortId,
                    )
                }
            }
            selectOriginNodeQuoteField(originNode, item.ref_id)
        }

        /**
         * 获取当前节点的portId
         * @param node 节点
         * @param index 当前下标
         * @param group port位置
         * @param limit 每页大小
         * @returns portId 找到返回对应id ，没找到生成port并返回''
         */
        const getNodeItemPortId = (node, index, group, limit) => {
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
                if (node.data.type === 'target') {
                    setTargetNodePort(node, currentPageIndex, group)
                } else {
                    setOriginNodePort(
                        node,
                        currentPageIndex,
                        group,
                        ExpandStatus.Expand,
                        '',
                    )
                }

                return ''
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
                    let fieldData = targetFormNode?.data.items || []
                    fieldData = fieldData.map((item) => ({
                        ...item,
                        ...versionParams,
                    }))
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
            if (deletedModel === DeleteMode.Copy) {
                targetFormNode?.replaceData({
                    ...targetFormNode.data,
                    items: targetFormNode.data.items.map((item) =>
                        item.ref_id && relationsData.includes(item.ref_id)
                            ? {
                                  ...item,
                                  ref_id: '',
                              }
                            : item,
                    ),
                })
            } else {
                targetFormNode?.replaceData({
                    ...targetFormNode.data,
                    items: targetFormNode.data.items.filter(
                        (item) =>
                            !(
                                item.ref_id &&
                                relationsData.includes(item.ref_id)
                            ),
                    ),
                })
            }
            if (deleteFormNode?.id) {
                graphCase?.current?.removeCell(deleteFormNode.id)
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
        const cancelOriginFormFiledSelected = (refId) => {
            const originNode = keyAndNodeRelation.quoteData[refId]
            originNode?.replaceData({
                ...originNode.data,
                selectedFiledsId: originNode.data.selectedFiledsId.filter(
                    (id) => id !== refId,
                ),
            })
            keyAndNodeRelation.deleteData(refId)
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
                        ].includes(optionType) ||
                        relateBusinessObject ||
                        !!sortFieldNode
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
                        defaultSize={model === 'view' ? [0, 100] : defaultSize}
                        minSize={model === 'view' ? [0, 500] : [120, 500]}
                        maxSize={[300, Infinity]}
                        onDragEnd={(size) => {
                            setDefaultSize(size)
                        }}
                        gutterStyles={{
                            background: '#EFF2F5',
                            width: model === 'view' ? 0 : '5px',
                            cursor: 'ew-resize',
                        }}
                        hiddenElement={model === 'view' ? 'left' : ''}
                        gutterSize={model === 'view' ? 1 : 5}
                        existPadding={false}
                    >
                        {model === 'view' ? (
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
                                    departmentId={departmentId}
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
                                {__('业务表图表')}
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
                                    FormTableKind.BUSINESS
                                }
                                departmentId={departmentId}
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
                                    <Button
                                        onClick={() => {
                                            handleDeleteConfirm(DeleteMode.Copy)
                                        }}
                                    >
                                        {__('仅保留字段')}
                                    </Button>
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
                                        color: '#faac14',
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
                                    {__('确定要移除业务表吗？')}
                                </span>
                            </div>
                            <div style={{ marginLeft: 38, marginTop: 8 }}>
                                {__('移除业务表将导致引用字段被删除。')}
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
                                        {__(
                                            '字段已在业务表中不可重复引用/复制',
                                        )}
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
                                                            item.uniqueId ===
                                                            targetItem.uniqueId,
                                                    )
                                                ) {
                                                    if (targetItem.ref_id) {
                                                        cancelOriginFormFiledSelected(
                                                            targetItem.ref_id,
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
                                onClose={() => setSortFieldNode(null)}
                                getContainer={sortFieldsContainerRef.current}
                            />
                        </div>
                    )}
                </div>
            </div>
        )
    },
)

interface IFormGraph {}
const FormGraph: FC<IFormGraph> = () => {
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

    const [departmentId, setDepartmentId] = useState<string>('')

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
            {editModel === EditFormModel.GraphModel ? (
                <FormGraphModel
                    ref={graphRef}
                    initData={formData}
                    graphContent={graphContent}
                    errorFields={fromTableErrors}
                    isStart={isStart}
                    tagData={tagData}
                    initDepartmentId={departmentId}
                />
            ) : (
                <FormTableMode
                    ref={tableRef}
                    initData={formData}
                    formType={NewFormType.BLANK}
                    graphContent={graphContent}
                    updateChangeBtn={setChangeBtnStatus}
                    isStart={isStart}
                    tagData={tagData}
                    initDepartmentId={departmentId}
                />
            )}
            <Tooltip
                title={changeBtnStatus ? __('请先完成或取消批量配置属性') : ''}
                placement="bottom"
            >
                <Radio.Group
                    defaultValue={EditFormModel.GraphModel}
                    value={editModel}
                    onChange={async (e) => {
                        if (e?.target?.value === EditFormModel.TableModel) {
                            const targetData =
                                graphRef?.current?.getTargetData()
                            if (targetData) {
                                setFormDatas({
                                    ...targetData,
                                    fields: targetData.fields.map((field) => ({
                                        ...field,
                                        data_type:
                                            field.data_type === 'number'
                                                ? __('数字型')
                                                : field.data_type,
                                    })),
                                })
                                setDepartmentId(
                                    graphRef.current?.getDepartmentId(),
                                )
                                console.log(
                                    'departmentId',
                                    graphRef.current?.getDepartmentId(),
                                )
                                setEditModel(EditFormModel.TableModel)
                                graphRef?.current.getGraphContent(
                                    setGraphContent,
                                )

                                graphRef.current = null
                            }
                        } else {
                            let errorInfo = {}
                            try {
                                const res =
                                    await tableRef.current?.validateFields()
                            } catch (err) {
                                errorInfo = getErrorDatas(
                                    err?.values?.fields || [],
                                    err?.errorFields || [],
                                    'uniqueId',
                                )
                                setFromTableErrors(errorInfo)
                            }

                            if (tableRef.current?.getTargetData) {
                                let targetData =
                                    tableRef.current?.getTargetData()
                                targetData = {
                                    ...targetData,
                                    fields: targetData.fields.map((field) => ({
                                        ...field,
                                        label_id: Array.isArray(field.label_id)
                                            ? field.label_id[
                                                  field.label_id.length - 1
                                              ]
                                            : field.label_id,
                                        data_type:
                                            field.data_type === 'number'
                                                ? __('数字型')
                                                : field.data_type,
                                    })),
                                }
                                setFormDatas(targetData)
                                setDepartmentId(
                                    tableRef.current?.getDepartmentId(),
                                )
                            }
                            setEditModel(EditFormModel.GraphModel)
                        }
                    }}
                    buttonStyle="solid"
                    className={styles.switchButton}
                    disabled={changeBtnStatus}
                >
                    <Tooltip
                        title={changeBtnStatus ? '' : __('切换为图表模式')}
                        placement="bottom"
                    >
                        <Radio.Button value={EditFormModel.GraphModel}>
                            <FormTableModelOutlined />
                        </Radio.Button>
                    </Tooltip>
                    <Tooltip
                        title={changeBtnStatus ? '' : __('切换为列表模式')}
                        placement="bottom"
                    >
                        <Radio.Button value={EditFormModel.TableModel}>
                            <FormListModelOutlined />
                        </Radio.Button>
                    </Tooltip>
                </Radio.Group>
            </Tooltip>
        </div>
    )
}
export default FormGraph
