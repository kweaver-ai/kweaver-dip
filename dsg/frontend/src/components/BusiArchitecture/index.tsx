import {
    Button,
    Dropdown,
    message,
    Pagination,
    Radio,
    Select,
    Space,
    Spin,
    Table,
    Tooltip,
} from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons'
import { useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import { AddOutlined, FiltersOutlined } from '@/icons'
import __ from './locale'
import {
    LightweightSearch,
    OptionBarTool,
    OptionMenuType,
    SearchInput,
} from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import { LevelTypeNameMap } from '../BusinessDomainLevel/const'
import {
    defaultSearchData,
    filters,
    searchData,
    UNGROUPED,
    ViewMode,
    viewModeItems,
} from './const'
import CreateArchitecture from './CreateArchitecture'
import { getPlatformNumber, OperateType } from '@/utils'
import Confirm from '../Confirm'
import Details from './Details'
import Move from './Move'
import DragBox from '../DragBox'
import BusinessDomainTree from './BusinessDomainTree'
import ArchitectureDirTree from '../BusinessArchitecture/ArchitectureDirTree'
import { Architecture } from '../BusinessArchitecture/const'
import {
    BusinessDomainLevelTypes,
    deleteBusinessDomainTreeNode,
    formatError,
    getBusinessDomainLevel,
    getBusinessDomainProcessList,
    getBusinessDomainProcessTree,
    getBusinessDomainTreeNodeDetails,
    getInfoSysProcessList,
    IBusinessDomainItem,
    IBusinessDomainProcessListParams,
    IBusinessDomainProcessTreeParams,
    LoginPlatform,
    TaskType,
    BusinessAuditStatus,
    cancelBusinessAreaAudit,
    BusinessAuditType,
} from '@/core'
import BusinessDomainLevelIcon from '../BusinessDomainLevel/BusinessDomainLevelIcon'
import CreateTask from '../TaskComponents/CreateTask'
import InfoSystem from '../DataSource/InfoSystem'
import { AuditStatusTag, getDisabledTooltip } from '../BusinessAudit/helper'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { ArchitectureProvider } from './ArchitectureProvider'
import { RefreshBtn } from '../ToolbarComponents'

export const addTreeData = (
    list: IBusinessDomainItem[],
    id: string,
    newChilds: IBusinessDomainItem[],
): IBusinessDomainItem[] =>
    list?.map((node) => {
        if (node.id === id) {
            return {
                ...node,
                children: [...(node.children || []), ...newChilds],
            }
        }
        if (node.children) {
            return {
                ...node,
                children: addTreeData(node.children, id, newChilds),
            }
        }
        return { ...node }
    })

/**
 * 移除指定节点
 * @param list 树
 * @param parentId 父节点ID
 * @param id 节点ID
 * @returns
 */
export const removeNode = (
    list: IBusinessDomainItem[],
    parentId: string,
    id: string,
): IBusinessDomainItem[] =>
    list?.map((node) => {
        if (node.id === parentId) {
            const childs = node?.children?.filter((o) => o?.id !== id) || []
            return {
                ...node,
                children: childs.length > 0 ? childs : undefined,
            }
        }
        if (node.children) {
            return {
                ...node,
                children: removeNode(node.children, parentId, id),
            }
        }
        return node
    })

/**
 * 获取父节点
 * @param list
 * @param id
 * @returns
 */
export const getParentNode = (
    list: IBusinessDomainItem[],
    id: string,
): IBusinessDomainItem => {
    let parentNode: IBusinessDomainItem
    list?.forEach((item) => {
        if (item.children) {
            if (item.children.some((it) => it.id === id)) {
                parentNode = item
            } else if (getParentNode(item.children, id)) {
                parentNode = getParentNode(item.children, id)
            }
        }
    })
    return parentNode!
}

export const replaceNode = (
    list: IBusinessDomainItem[],
    id: string,
    item: IBusinessDomainItem,
): IBusinessDomainItem[] =>
    list?.map((node) => {
        if (node.id === id) {
            return { ...node, ...item }
        }
        if (node.children) {
            return { ...node, children: replaceNode(node.children, id, item) }
        }
        return node
    })

const listDefaultSize = 10

const BusiArchitecture = () => {
    const { checkPermission } = useUserPermCtx()
    const [defaultSize, setDefaultSize] = useState<Array<number>>([12, 88])
    const [fetching, setFetching] = useState(false)
    const [data, setData] = useState<IBusinessDomainItem[]>([])
    const [expandedRowKeys, setExpandedRowKeys] = useState<any[]>([])
    const [searchExpandedKeys, setSearchExpandedKeys] = useState<any[]>([])
    const [open, setOpen] = useState(false)
    const [delOpen, setDelOpen] = useState(false)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [operateType, setOperateType] = useState<OperateType | TaskType>(
        OperateType.CREATE,
    )
    const [createType, setCreateType] = useState<BusinessDomainLevelTypes>(
        BusinessDomainLevelTypes.DomainGrouping,
    )
    const [operateData, setOperateData] = useState<IBusinessDomainItem>()
    const [moveOpen, setMoveOpen] = useState(false)
    const [selectedNode, setSelectedNode] = useState<IBusinessDomainItem | any>(
        {},
    )
    // 新建/编辑选中信息系统id
    const [newSelSysId, setNewSelSysId] = useState<any>(undefined)

    const treeRef: any = useRef()
    const aRef: any = useRef()
    const [isEmpty, setIsEmpty] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Domain)
    const [viewModeOpen, setViewModeOpen] = useState(false)
    const [searchCondition, setSearchCondition] = useState<
        Partial<
            IBusinessDomainProcessTreeParams & IBusinessDomainProcessListParams
        >
    >({
        keyword: '',
        parent_id: '',
        offset: 1,
        limit: listDefaultSize,
        department_id: '',
        getall: true,
        model_related: 0,
        info_related: 0,
    })
    const [total, setTotal] = useState(0)
    const [domainLevels, setDomainLevels] = useState<
        BusinessDomainLevelTypes[]
    >([])
    const [createTaskVisible, setCreateTaskVisible] = useState(false)

    const [extendNodesData, setExtendNodesData] = useState({
        id: UNGROUPED,
        title: __('未分组'),
        num: 0,
    })
    const platformNumber = getPlatformNumber()

    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('')
    const [isNeedRefresh, setIsNeedRefresh] = useState(false)

    // 新建任务默认值
    const createTaskData = [
        {
            name: 'task_type',
            value: TaskType.MODEL,
            disabled: true,
        },
        {
            name: 'task_type',
            value: TaskType.DATAMODELING,
            disabled: true,
        },
    ]
    const isSearch = useMemo(
        () =>
            !!(
                searchCondition.keyword ||
                searchCondition.model_related ||
                searchCondition.info_related ||
                searchCondition.data_model_related
            ),
        [searchCondition],
    )

    // 获取业务域层级模板
    const getDomainLevel = async () => {
        try {
            const res = await getBusinessDomainLevel()
            setDomainLevels(res)
        } catch (error) {
            formatError(error)
        }
    }

    // 获取业务流程树
    const getProcessTree = async () => {
        try {
            setFetching(true)
            const {
                parent_id,
                keyword,
                info_related,
                model_related,
                data_model_related,
            } = searchCondition
            const res = await getBusinessDomainProcessTree({
                parent_id,
                keyword,
                info_related,
                model_related,
                data_model_related,
                status: 'all',
            })
            setTotal(res.total_count)
            setData(
                res.entries.map((item) => {
                    if (item.expand) {
                        return { ...item, children: isSearch ? undefined : [] }
                    }
                    return item
                }),
            )
            setFetching(false)
        } catch (error) {
            formatError(error)
        } finally {
            setFetching(false)
        }
    }

    const getSubprocess = async (id: string) => {
        try {
            setFetching(true)
            const res = await getBusinessDomainProcessTree({
                parent_id: id,
                status: 'all',
            })

            setData((prev: IBusinessDomainItem[] | undefined) =>
                addTreeData(
                    prev!,
                    id!,
                    res.entries.map((child) => {
                        if (child.expand) {
                            return { ...child, children: [] }
                        }
                        return child
                    }),
                ),
            )
            setFetching(false)
        } catch (error) {
            formatError(error)
        } finally {
            setFetching(false)
        }
    }

    // 根据部门获取流程列表
    const getProcessList = async () => {
        try {
            setFetching(true)
            const { parent_id, ...rest } = searchCondition
            const res = await getBusinessDomainProcessList(rest)
            setData(res.entries)
            setTotal(res.total_count)
            setFetching(false)
        } catch (error) {
            formatError(error)
        } finally {
            setFetching(false)
        }
    }

    // 根据信息系统获取流程列表
    const getArchitechListByInfoSys = async () => {
        try {
            setFetching(true)
            const { parent_id, department_id, ...rest } = searchCondition
            const res = await getInfoSysProcessList(rest)
            setData(res.entries)
            setTotal(res.total_count)
            setFetching(false)
        } catch (error) {
            formatError(error)
        } finally {
            setFetching(false)
        }
    }

    useEffect(() => {
        getDomainLevel()
    }, [])

    useEffect(() => {
        if (viewMode === ViewMode.Domain) {
            getProcessTree()
            setExpandedRowKeys([])
        } else if (viewMode === ViewMode.Department) {
            getProcessList()
        } else if (viewMode === ViewMode.InfoSystem) {
            getArchitechListByInfoSys()
        }
    }, [searchCondition, viewMode])

    useUpdateEffect(() => {
        if (!selectedNode) return
        // getall=true,获取所有部门+未分组的
        // department_id 为""表示查询未分组的流程；不为空，查询部门下的流程
        setExpandedRowKeys([])

        const searchConditionTemp: any = {
            ...searchCondition,
            parent_id:
                viewMode === ViewMode.Domain ? selectedNode.id : undefined,
            getall:
                [ViewMode.Department, ViewMode.InfoSystem].includes(viewMode) &&
                !selectedNode.id,
            keyword: '',
            offset: 1,
        }
        const nodeId = selectedNode.id === UNGROUPED ? '' : selectedNode.id
        if (viewMode === ViewMode.Department) {
            searchConditionTemp.department_id = nodeId
        } else if (viewMode === ViewMode.InfoSystem) {
            searchConditionTemp.business_system_id = nodeId
        }

        setSearchCondition(searchConditionTemp)
    }, [selectedNode])

    const hasOprAccess = useMemo(
        () => checkPermission('manageBusinessArchitecture'),
        [checkPermission],
    )

    const renderEmpty = () => {
        return (
            <Spin spinning={fetching}>
                {fetching ? null : isSearch ? (
                    <Empty />
                ) : (
                    <Empty
                        desc={
                            viewMode === ViewMode.Department
                                ? __('暂无数据')
                                : [
                                      ViewMode.Domain,
                                      ViewMode.InfoSystem,
                                  ].includes(viewMode) && hasOprAccess
                                ? platformNumber === LoginPlatform.default
                                    ? __('暂无业务流程，点击上方按钮可新建')
                                    : __('暂无主干业务，点击上方按钮可新建')
                                : __('暂无数据')
                        }
                        iconSrc={dataEmpty}
                    />
                )}
            </Spin>
        )
    }

    /**
     * 业务域树操作统一处理方法
     * @param op 操作类型
     * @param od 操作数据
     * @param ct 创建类型
     */
    const handleOperate = (
        op: OperateType | TaskType,
        od?: IBusinessDomainItem,
        ct?: BusinessDomainLevelTypes,
    ) => {
        setOperateData(od)
        setOperateType(op)
        switch (op) {
            case OperateType.CREATE:
                setOpen(true)
                if (ct) {
                    setCreateType(ct)
                } else if (od) {
                    // TODO: 根据定义的层级 来判断要创建的类型 (业务域 | 子业务域)
                } else {
                    setCreateType(BusinessDomainLevelTypes.DomainGrouping)
                }
                break
            case OperateType.EDIT:
                if (od?.type) {
                    setCreateType(od?.type)
                }
                setOpen(true)
                break
            case OperateType.DELETE:
                setDelOpen(true)
                break
            case OperateType.DETAIL:
                setDetailsOpen(true)
                break
            case OperateType.MOVE:
                setMoveOpen(true)
                break
            case TaskType.MODEL:
                setCreateTaskVisible(true)
                break
            case TaskType.DATAMODELING:
                setCreateTaskVisible(true)
                break
            case OperateType.REVOCATION:
                handleRevocation(od)
                break
            default:
                break
        }
    }

    // 更新节点状态
    const updateNodeStatus = (
        nodes: IBusinessDomainItem[],
        targetId: string,
        newStatus: BusinessAuditStatus,
    ): IBusinessDomainItem[] => {
        return nodes.map((node) => {
            if (node.id === targetId) {
                // 使用展开运算符 ...node 保留节点的所有现有属性
                // 只更新 audit_status 属性为新状态
                return {
                    ...node,
                    audit_status: newStatus,
                }
            }
            if (node.children) {
                // 如果有子节点，递归处理子节点
                return {
                    ...node,
                    children: updateNodeStatus(
                        node.children,
                        targetId,
                        newStatus,
                    ),
                }
            }
            // 如果不是目标节点且没有子节点，直接返回原节点
            return node
        })
    }

    // 撤回
    const handleRevocation = async (item: any) => {
        try {
            await cancelBusinessAreaAudit(
                item?.id,
                BusinessAuditType.MainBusinessPublish,
            )
            message.success(__('撤回成功'))

            // 根据当前审核状态决定撤回后的状态
            let newStatus = BusinessAuditStatus.Unpublished
            if (item?.audit_status === BusinessAuditStatus.ChangeAuditing) {
                newStatus = BusinessAuditStatus.Published
            }

            // 使用 updateNodeStatus 更新审核状态
            setData((prev) => updateNodeStatus(prev, item.id, newStatus))
        } catch (e) {
            formatError(e)
        }
    }

    const handleDelete = async () => {
        if (!operateData) return
        try {
            await deleteBusinessDomainTreeNode(operateData.id)
            message.success(__('删除成功'))
            setDelOpen(false)
            if (operateData.type === BusinessDomainLevelTypes.Process) {
                // 如果删除的是第一层业务流程
                if (data.find((item) => item.id === operateData.id)) {
                    setData(data.filter((item) => item.id !== operateData.id))
                } else {
                    const parentNode = getParentNode(data, operateData.id)
                    // 移除时父级只有一个节点，则父级展开箭头去掉
                    if (parentNode.children?.length === 1) {
                        setExpandedRowKeys(
                            expandedRowKeys.filter(
                                (key) => key !== parentNode.id,
                            ),
                        )
                    }
                    setData((prev) =>
                        removeNode(prev, parentNode?.id, operateData.id),
                    )
                }

                // 更新架构树 数量
                await treeRef.current?.execNode(
                    OperateType.MINUS,
                    operateData.id,
                    undefined,
                    operateData.path_id?.split('/'),
                )
            } else {
                await treeRef.current?.execNode(
                    OperateType.DELETE,
                    operateData.id,
                )
            }
        } catch (error) {
            formatError(error)
        }
    }

    const getOptionMenus = (record: IBusinessDomainItem) => {
        const level = record.path_id.split('/').length

        const isUnpublished =
            record?.audit_status === BusinessAuditStatus.Unpublished

        const isAuditing = [
            BusinessAuditStatus.PubAuditing,
            BusinessAuditStatus.ChangeAuditing,
        ].includes(record?.audit_status)

        const isAuditRejected =
            record.audit_status === BusinessAuditStatus.PubReject

        const optionMenus: any[] = [
            {
                key: OperateType.REVOCATION,
                label: __('撤回'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: OperateType.CREATE,
                label: __('新建主干业务'),
                menuType: OptionMenuType.Menu,
                access: 'manageBusinessArchitecture',
                disabled: isUnpublished || isAuditing || isAuditRejected,
                title: isUnpublished
                    ? getDisabledTooltip(__('新建'), __('未提交'))
                    : isAuditing
                    ? getDisabledTooltip(__('新建'), __('审核中'))
                    : isAuditRejected
                    ? getDisabledTooltip(__('新建'), __('审核未通过'))
                    : undefined,
            },
            {
                key: OperateType.DETAIL,
                label: __('详情'),
                menuType: OptionMenuType.Menu,
                access: 'manageBusinessArchitecture',
            },
            {
                key: OperateType.MOVE,
                label: __('移动'),
                menuType: OptionMenuType.Menu,
                access: 'manageBusinessArchitecture',
                disabled: isUnpublished || isAuditing || isAuditRejected,
                title: isUnpublished
                    ? getDisabledTooltip(__('移动'), __('未提交'))
                    : isAuditing
                    ? getDisabledTooltip(__('移动'), __('审核中'))
                    : isAuditRejected
                    ? getDisabledTooltip(__('移动'), __('审核未通过'))
                    : undefined,
            },
            {
                key: OperateType.EDIT,
                label: __('编辑'),
                menuType: OptionMenuType.Menu,
                access: 'manageBusinessArchitecture',
                disabled: isAuditing,
                title: isAuditing
                    ? getDisabledTooltip(__('编辑'), __('审核中'))
                    : undefined,
            },
            {
                key: TaskType.MODEL,
                label: __('新建业务建模任务'),
                menuType: OptionMenuType.Menu,
                access: 'manageBusinessArchitecture',
                disabled: isUnpublished || isAuditing || isAuditRejected,
                title: isUnpublished
                    ? getDisabledTooltip(__('新建业务建模任务'), __('未提交'))
                    : isAuditing
                    ? getDisabledTooltip(__('新建业务建模任务'), __('审核中'))
                    : isAuditRejected
                    ? getDisabledTooltip(
                          __('新建业务建模任务'),
                          __('审核未通过'),
                      )
                    : undefined,
            },
            {
                key: TaskType.DATAMODELING,
                label: __('新建数据建模任务'),
                menuType: OptionMenuType.Menu,
                access: 'manageBusinessArchitecture',
                disabled: isUnpublished || isAuditing || isAuditRejected,
                title: isUnpublished
                    ? getDisabledTooltip(__('新建数据建模任务'), __('未提交'))
                    : isAuditing
                    ? getDisabledTooltip(__('新建数据建模任务'), __('审核中'))
                    : isAuditRejected
                    ? getDisabledTooltip(
                          __('新建数据建模任务'),
                          __('审核未通过'),
                      )
                    : undefined,
            },
            {
                key: OperateType.DELETE,
                label: __('删除'),
                menuType: OptionMenuType.Menu,
                access: 'manageBusinessArchitecture',
                disabled: isAuditing,
                title: isAuditing
                    ? getDisabledTooltip(__('删除'), __('审核中'))
                    : undefined,
            },
        ]

        return optionMenus
            .filter((op) => {
                if (!checkPermission(op.access)) return false

                if (op.key === OperateType.REVOCATION) {
                    return isAuditing
                }

                if (op.key === OperateType.CREATE) {
                    if (
                        level === domainLevels.length ||
                        domainLevels[level] !==
                            BusinessDomainLevelTypes.Process ||
                        [ViewMode.Department, ViewMode.InfoSystem].includes(
                            viewMode,
                        )
                    ) {
                        return false
                    }
                }

                if (
                    op.key === OperateType.MOVE &&
                    [ViewMode.Department, ViewMode.InfoSystem].includes(
                        viewMode,
                    )
                ) {
                    return false
                }

                return true
            })
            .map((menu, index, array) => ({
                ...menu,
                menuType:
                    array.length > 4 && index > 2
                        ? OptionMenuType.More
                        : OptionMenuType.Menu,
            }))
    }

    const columns = [
        {
            title:
                platformNumber === LoginPlatform.default
                    ? __('业务流程名称')
                    : __('主干业务名称'),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (_: string, record: IBusinessDomainItem) => (
                <span className={styles['name-container']}>
                    <BusinessDomainLevelIcon
                        isColored
                        type={record.type}
                        className={styles['architecture-type-icon']}
                    />
                    <span
                        title={record.name}
                        className={styles['process-name']}
                        onClick={() =>
                            handleOperate(
                                OperateType.DETAIL,
                                record,
                                BusinessDomainLevelTypes.Process,
                            )
                        }
                    >
                        {record.name}
                    </span>
                    <AuditStatusTag record={record} />
                </span>
            ),
        },
        {
            title: __('所属部门'),
            dataIndex: 'department_name',
            key: 'department_name',
            render: (val: string) => val || '--',
            ellipsis: true,
        },
        {
            title: __('所属信息系统'),
            dataIndex: 'business_system_name',
            key: 'business_system_name',
            render: (val: any) => val?.join?.() || '--',
            ellipsis: true,
        },
        {
            title: __('流程父级'),
            dataIndex: 'path',
            key: 'path',
            render: (val: string, record: IBusinessDomainItem) => {
                const pathArr = val.split('/')
                const parentPath = pathArr
                    .filter((item, index) => index !== pathArr.length - 1)
                    .join('/')
                return (
                    <span className={styles['name-container']}>
                        <BusinessDomainLevelIcon
                            isColored
                            type={record.parent_type}
                            className={styles['architecture-type-icon']}
                        />
                        <span
                            className={styles['parent-path']}
                            title={parentPath}
                        >
                            {record.parent_name}
                        </span>
                    </span>
                )
            },
            ellipsis: true,
        },
        {
            title: __('业务模型'),
            dataIndex: 'model_name',
            key: 'model_name',
            render: (val: string) => val || '--',
        },
        {
            title: __('数据模型'),
            dataIndex: 'data_model_name',
            key: 'data_model_name',
            render: (val: string) => val || '--',
        },
        {
            title: __('操作'),
            dataIndex: 'operate',
            key: 'operate',
            width: 260,
            render: (_, record) => {
                return (
                    <OptionBarTool
                        menus={getOptionMenus(record) as any[]}
                        onClick={(key, e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleOperate(
                                key as OperateType,
                                record,
                                BusinessDomainLevelTypes.Process,
                            )
                        }}
                    />
                )
            },
        },
    ]

    const searchChange = (d, dataKey) => {
        if (!dataKey) {
            // 清空筛选
            setSearchCondition({
                ...searchCondition,
                ...d,
            })
        } else {
            setSearchCondition({
                ...searchCondition,
                [dataKey]: d[dataKey],
            })
        }
    }

    const updateProecessTree = async (
        op: OperateType,
        nodeId: string,
        parentId: string,
    ) => {
        try {
            // 获取新创建节点或编辑节点的最新信息
            const res = await getBusinessDomainTreeNodeDetails(nodeId)
            if (op === OperateType.CREATE) {
                if (parentId) {
                    setData((prev: IBusinessDomainItem[] | undefined) =>
                        addTreeData(prev!, parentId!, [
                            res as IBusinessDomainItem,
                        ]),
                    )
                } else {
                    setData((prev: IBusinessDomainItem[] | undefined) => [
                        ...(prev || []),
                        res as IBusinessDomainItem,
                    ])
                }
            }
            if (op === OperateType.EDIT) {
                setData((prev) =>
                    replaceNode(prev, nodeId, res as IBusinessDomainItem),
                )
            }
            if (op === OperateType.CREATE) {
                // 更新架构树 数量
                await treeRef.current?.execNode(
                    OperateType.PLUS,
                    nodeId,
                    undefined,
                    res.path_id?.split('/'),
                )
            }
        } catch (error) {
            formatError(error)
        }
    }

    const onOk = async (
        type: OperateType,
        newData: any,
        currentData?: IBusinessDomainItem,
    ) => {
        const { business_system_id, department_id } = newData

        // 新建/编辑，当进选择一个信息系统提交时，左侧选择对应节点
        if (viewMode === ViewMode.InfoSystem) {
            // 如左侧为非全部节点
            if (selectedNode?.id) {
                // 未选信息系统，选择未分类节点
                if (!business_system_id?.length) {
                    setNewSelSysId(UNGROUPED)
                    setSelectedNode({
                        id: UNGROUPED,
                    })
                } else if (business_system_id?.length === 1) {
                    // 仅选择一个信息系统，选择对应系统节点
                    setNewSelSysId(business_system_id?.[0])
                    setSelectedNode({
                        id: business_system_id?.[0],
                    })
                } else {
                    // 选择多个信息系统，选择全部节点
                    setNewSelSysId('')
                    setSelectedNode({})
                }
            }
            // 设置信息系统新节点后清空，为了下次设置新节点触发useEffect
            setNewSelSysId(undefined)
        }
        if (viewMode === ViewMode.Department) {
            aRef.current?.setCurrentNode({ id: department_id })
        }
        if (type === OperateType.CREATE) {
            if (newData.type === BusinessDomainLevelTypes.Process) {
                // 更新流程树
                if (isNeedRefresh) {
                    setIsNeedRefresh(false)
                    setSearchCondition({ ...searchCondition })
                } else {
                    if (newData.id) {
                        updateProecessTree(type, newData.id, currentData?.id!)
                    }

                    setExpandedRowKeys(
                        Array.from(
                            new Set([...expandedRowKeys, currentData?.id]),
                        ),
                    )
                }
            } else {
                // 更新树
                await treeRef.current?.execNode(
                    OperateType.CREATE,
                    currentData?.id,
                    newData.id,
                )
            }
        }
        if (type === OperateType.EDIT) {
            if (currentData?.type === BusinessDomainLevelTypes.Process) {
                // 更新流程树
                updateProecessTree(type, newData.id, '')
            } else {
                // 更新树
                await treeRef.current?.execNode(
                    OperateType.EDIT,
                    currentData?.id,
                )
            }
        }
    }

    const onMove = async (
        moveData: IBusinessDomainItem,
        targetData: IBusinessDomainItem,
    ) => {
        if (moveData.type === BusinessDomainLevelTypes.Domain) {
            // const res = await getBusinessDomainTreeNodeDetails(moveData.id)
            await treeRef.current?.execNode(OperateType.DELETE, moveData.id)
            await treeRef.current?.execNode(
                OperateType.CREATE,
                targetData.id,
                moveData.id,
            )
        } else if (moveData.type === BusinessDomainLevelTypes.Process) {
            // TODO:
            getProcessTree()
        }
        // 移动后，收起所有节点
        setExpandedRowKeys([])
    }

    const onExpand = (expanded: boolean, record: IBusinessDomainItem) => {
        const d = expanded
            ? [...expandedRowKeys, record.id]
            : expandedRowKeys.filter((item) => item !== record.id)
        setExpandedRowKeys(d)
        if (expanded && !((record.children?.length || 0) > 0)) {
            getSubprocess(record.id)
        }
    }

    const handlePageChange = (page: number, pageSize: number) => {
        setSearchCondition({
            ...searchCondition,
            offset: page,
            limit: pageSize,
        })
    }

    //
    const architectureValue = useMemo(
        () => ({
            selectedDepartmentId,
        }),
        [selectedDepartmentId],
    )

    return (
        <ArchitectureProvider value={architectureValue}>
            <div className={styles['architecture-wrapper']}>
                <DragBox
                    defaultSize={defaultSize}
                    minSize={[280, 270]}
                    maxSize={[800, Infinity]}
                    onDragEnd={(size) => {
                        setDefaultSize(size)
                    }}
                >
                    <div className={styles.left}>
                        <div className={styles['mode-container']}>
                            {/* <Radio.Group
                            options={viewModeOptions}
                            onChange={(e) => setViewMode(e.target.value)}
                            value={viewMode}
                            optionType="button"
                        /> */}
                            <div className={styles.viewWrapper}>
                                {viewModeOpen ? (
                                    <CaretUpOutlined
                                        style={{ fontSize: 14, color: '#333' }}
                                        onClick={() => {
                                            setViewModeOpen(!viewModeOpen)
                                        }}
                                    />
                                ) : (
                                    <CaretDownOutlined
                                        style={{ fontSize: 14, color: '#333' }}
                                        onClick={() => {
                                            setViewModeOpen(!viewModeOpen)
                                        }}
                                    />
                                )}
                                <Select
                                    open={viewModeOpen}
                                    value={viewMode}
                                    bordered={false}
                                    options={viewModeItems}
                                    dropdownMatchSelectWidth={100}
                                    onChange={(option: ViewMode) => {
                                        setViewMode(option)
                                        setSelectedDepartmentId('')
                                    }}
                                    onDropdownVisibleChange={(o) => {
                                        setViewModeOpen(o)
                                    }}
                                    className={styles.viewSelect}
                                    showArrow={false}
                                    getPopupContainer={(n) => n}
                                />
                            </div>
                        </div>
                        {viewMode === ViewMode.Domain ? (
                            <div className={styles['tree-wrapper']}>
                                <BusinessDomainTree
                                    ref={treeRef}
                                    getSelectedKeys={setSelectedNode}
                                    // handleLoadOrEmpty={(loadState, emptyState) => {
                                    //     setIsLoading(loadState)
                                    //     setIsEmpty(emptyState)
                                    // }}
                                    // handleOperate={(op, od) =>
                                    //     handleOperate(
                                    //         op,
                                    //         od,
                                    //         od
                                    //             ? BusinessDomainLevelTypes.Domain
                                    //             : BusinessDomainLevelTypes.DomainGrouping,
                                    //     )
                                    // }
                                    domainLevels={domainLevels}
                                    // isShowCount
                                    showCountField="process_cnt"
                                />
                            </div>
                        ) : viewMode === ViewMode.Department ? (
                            <div className={styles.treeContainer}>
                                <ArchitectureDirTree
                                    ref={aRef}
                                    getSelectedNode={(node) => {
                                        setSelectedNode(node)
                                        setSelectedDepartmentId(node?.id || '')
                                    }}
                                    hiddenType={[
                                        Architecture.BMATTERS,
                                        Architecture.BSYSTEM,
                                        Architecture.COREBUSINESS,
                                    ]}
                                    filterType={[
                                        Architecture.ORGANIZATION,
                                        Architecture.DEPARTMENT,
                                    ].join(',')}
                                    handleLoadOrEmpty={(
                                        loadState,
                                        emptyState,
                                    ) => {
                                        setIsLoading(loadState)
                                        setIsEmpty(emptyState)
                                    }}
                                    extendNodesData={[extendNodesData]}
                                />
                            </div>
                        ) : viewMode === ViewMode.InfoSystem ? (
                            <div className={styles.technologyTree}>
                                <InfoSystem
                                    onSelectSysId={(val) => val}
                                    showTitle={false}
                                    showPath={false}
                                    newSelNodeId={newSelSysId}
                                    onSelectedNode={setSelectedNode}
                                    needUncategorized
                                    unCategorizedKey={UNGROUPED}
                                    unCategorizedName={__('未分组')}
                                />
                            </div>
                        ) : undefined}
                    </div>
                    <div className={styles.right}>
                        <div className={styles.title}>
                            {platformNumber === LoginPlatform.default
                                ? __('业务架构')
                                : __('主干业务')}
                        </div>
                        <div className={styles.content}>
                            <div className={styles['operate-row']}>
                                {/* {[ViewMode.Domain, ViewMode.InfoSystem].includes(
                                viewMode,
                            ) && */}
                                {hasOprAccess ? (
                                    <Button
                                        type="primary"
                                        icon={<AddOutlined />}
                                        onClick={() => {
                                            handleOperate(
                                                OperateType.CREATE,
                                                undefined,
                                                BusinessDomainLevelTypes.Process,
                                            )
                                            setIsNeedRefresh(true)
                                        }}
                                    >
                                        {platformNumber ===
                                        LoginPlatform.default
                                            ? __('新建业务流程')
                                            : __('新建主干业务')}
                                    </Button>
                                ) : (
                                    <div />
                                )}

                                <Space size={4}>
                                    <SearchInput
                                        placeholder={
                                            platformNumber ===
                                            LoginPlatform.default
                                                ? __('搜索业务流程')
                                                : __('搜索主干业务')
                                        }
                                        value={searchCondition.keyword}
                                        onKeyChange={(keyword: string) =>
                                            setSearchCondition({
                                                ...searchCondition,
                                                keyword,
                                                offset: 1,
                                            })
                                        }
                                        className={styles.searchInput}
                                        style={{ width: 282 }}
                                    />
                                    <LightweightSearch
                                        formData={searchData}
                                        onChange={(d, key) =>
                                            searchChange(d, key)
                                        }
                                        defaultValue={defaultSearchData}
                                    />
                                    <RefreshBtn
                                        onClick={() => {
                                            setSearchCondition({
                                                ...searchCondition,
                                                offset: 1,
                                            })
                                        }}
                                    />
                                </Space>
                            </div>
                            {!searchCondition.keyword && data.length === 0 ? (
                                <div className={styles.emptyWrapper}>
                                    {renderEmpty()}
                                </div>
                            ) : (
                                <>
                                    <Table
                                        columns={
                                            viewMode === ViewMode.Domain
                                                ? columns.filter(
                                                      (c) => c.key !== 'path',
                                                  )
                                                : viewMode ===
                                                  ViewMode.InfoSystem
                                                ? columns.filter(
                                                      (c) =>
                                                          c.key !==
                                                          'business_system_name',
                                                  )
                                                : columns
                                        }
                                        expandable={{
                                            expandedRowKeys:
                                                searchCondition.keyword
                                                    ? searchExpandedKeys
                                                    : expandedRowKeys,
                                            indentSize: 20,
                                            rowExpandable: (record) =>
                                                isSearch
                                                    ? false
                                                    : record.expand,
                                        }}
                                        onExpand={(
                                            expanded: boolean,
                                            record: IBusinessDomainItem,
                                        ) => onExpand(expanded, record)}
                                        dataSource={data}
                                        pagination={false}
                                        rowKey="id"
                                        loading={fetching}
                                        locale={{
                                            emptyText: <Empty />,
                                        }}
                                        scroll={{
                                            y:
                                                data.length === 0
                                                    ? undefined
                                                    : 'calc(100vh - 284px)',
                                        }}
                                    />
                                    {[
                                        ViewMode.Department,
                                        ViewMode.InfoSystem,
                                    ].includes(viewMode) && (
                                        <Pagination
                                            pageSize={searchCondition.limit}
                                            total={total}
                                            onChange={handlePageChange}
                                            showSizeChanger
                                            className={styles.pagination}
                                            current={searchCondition.offset}
                                            hideOnSinglePage={
                                                total <= listDefaultSize
                                            }
                                            showTotal={(t) =>
                                                __('共${num}条', { num: t })
                                            }
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </DragBox>

                {open && (
                    <CreateArchitecture
                        open={open}
                        levelType={createType}
                        operateType={operateType as OperateType}
                        viewMode={viewMode}
                        operateData={operateData}
                        onClose={() => {
                            setOpen(false)
                            setOperateData(undefined)
                        }}
                        onOk={onOk}
                        domainLevels={domainLevels}
                        selectedNode={selectedNode}
                        defaultData={{
                            business_system_id:
                                viewMode === ViewMode.InfoSystem &&
                                selectedNode?.id &&
                                selectedNode?.id !== UNGROUPED
                                    ? [selectedNode.id]
                                    : [],
                            department_id:
                                viewMode === ViewMode.Department &&
                                selectedNode?.id &&
                                selectedNode?.id !== UNGROUPED
                                    ? selectedNode.id
                                    : undefined,
                        }}
                    />
                )}
                <Confirm
                    onOk={handleDelete}
                    onCancel={() => setDelOpen(false)}
                    open={delOpen}
                    title={__('确认要删除${name}吗？', {
                        name: LevelTypeNameMap[
                            operateData?.type ||
                                BusinessDomainLevelTypes.DomainGrouping
                        ],
                    })}
                    content={__(
                        '删除后，本${name}下所有子节点将一并删除，子节点关联的业务模型和数据模型在业务架构下归为未分组',
                        {
                            name: LevelTypeNameMap[
                                operateData?.type ||
                                    BusinessDomainLevelTypes.DomainGrouping
                            ],
                        },
                    )}
                    width={432}
                    okText={__('确定')}
                    cancelText={__('取消')}
                />
                {operateData && (
                    <Details
                        open={detailsOpen}
                        data={operateData}
                        onClose={() => setDetailsOpen(false)}
                    />
                )}

                <Move
                    open={moveOpen}
                    data={operateData!}
                    onClose={() => setMoveOpen(false)}
                    domainLevels={domainLevels}
                    onOk={onMove}
                />

                <CreateTask
                    show={createTaskVisible}
                    operate={OperateType.CREATE}
                    title={__('新建任务')}
                    defaultData={[
                        operateType === TaskType.MODEL
                            ? createTaskData[0]
                            : createTaskData[1],
                        {
                            name: 'domain_id',
                            value: {
                                id: operateData?.id,
                                name: operateData?.name,
                            },
                            disabled: true,
                        },
                    ]}
                    isSupportFreeTask
                    onClose={() => {
                        setCreateTaskVisible(false)
                    }}
                />
            </div>
        </ArchitectureProvider>
    )
}

export default BusiArchitecture
