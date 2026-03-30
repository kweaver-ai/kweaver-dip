import { ExclamationCircleOutlined } from '@ant-design/icons'
import { useDebounceFn } from 'ahooks'
import {
    Button,
    Dropdown,
    message,
    Pagination,
    Space,
    Table,
    Tooltip,
} from 'antd'
import { ColumnsType } from 'antd/lib/table'
import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import lodash, { trim } from 'lodash'
import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import dataEmpty from '@/assets/dataEmpty.svg'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import {
    completeStdTask,
    formatError,
    messageError,
    SortDirection,
    TaskConfigStatus,
    TaskExecutableStatus,
    TaskPriority,
    TaskStatus,
    TaskType,
} from '@/core'
import { editTask, getTaskAllExecutors, getTasks } from '@/core/apis/taskCenter'
import {
    ExecutorInfo,
    TaskDetail,
    TaskInfos,
} from '@/core/apis/taskCenter/index.d'
import FiltersFilledOutlined from '@/icons/FiltersFilledOutlined'
import { SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import { formatTime, OperateType } from '@/utils'
import { TabKey } from '../../BusinessModeling/const'
import DropDownFilter from '../../DropDownFilter'
import { OrderType } from '../helper'
import CreateTask from '../WorkOrderTask/components/CreateTask'
import DeleteTask from '../WorkOrderTask/components/DeleteTask'
import {
    allTaskTypeList,
    checkBeforeJumpModel,
    noExecutorAssigned,
    TaskConfigStatusText,
    TaskExecutableStatusText,
    taskPriorityInfos,
} from '../WorkOrderTask/components/helper'
import { PriorityLabel } from '../WorkOrderTask/components/PrioritySelect'
import StatusSelect from '../WorkOrderTask/components/StatusSelect'
import TaskDetails from '../WorkOrderTask/components/TaskDetails'
import {
    defaultPriorityList,
    menus,
    MyTaskType,
    SortType,
    statusInfos,
    WorkOrderTypes,
} from '../WorkOrderTask/const'
import CreateTaskGuide from '../WorkOrderTask/CreateTaskGuide'
import {
    ExecutorFilter,
    PriorityFilter,
    StatusFilter,
    TaskTypeFilter,
} from '../WorkOrderTask/custom/filterDropdown'
import { StatusLabel } from '../WorkOrderTask/custom/StatusComponent'
import { TaskTypeContent } from '../WorkOrderTask/custom/taskTypeComponent'
import { getTaskSortHelpComponent } from '../WorkOrderTask/helper'
import __ from '../WorkOrderTask/locale'
import styles from '../WorkOrderTask/styles.module.less'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

const ExecuteTasks = ({ orderType }: { orderType: OrderType }) => {
    // load显示,【true】显示,【false】隐藏
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)
    const location = useLocation()
    // 路径参数
    const [searchParams] = useSearchParams()
    const navigator = useNavigate()

    const { checkPermission } = useUserPermCtx()

    // 我的任务分类
    const [taskType, setTaskType] = useState<string>(MyTaskType.PROCESSED)

    // 操作类型
    const [operate, setOperate] = useState(OperateType.CREATE)

    // 展开/收起
    const [expand, setExpand] = useState<boolean>(true)

    // 统计信息
    const [tsCount, setTsCount] = useState<TaskInfos>()
    // 任务集
    const [taskItems, setTaskItems] = useState<any[]>([])
    // 操作选中的任务
    const [taskItem, setTaskItem] = useState<TaskDetail>()

    // 弹框显示,【true】显示,【false】隐藏
    const [createVisible, setCreateVisible] = useState(false)
    const [detailVisible, setDetailVisible] = useState(false)
    const [delVisible, setDelVisible] = useState(false)
    const [guideVisible, setGuideVisible] = useState(false)
    // 创建任务的分类
    const [createTaskType, setCreateTaskType] = useState<string>()

    const [currentTab, setCurrentTab] = useState<any>(
        TaskExecutableStatus.EXECUTABLE,
    )

    // 不同状态下的任务状态集
    const defaultStatusList = (type) => {
        setTaskType(type)
        switch (type) {
            case TaskExecutableStatus.EXECUTABLE:
                return [TaskStatus.READY, TaskStatus.ONGOING]
            // case TaskExecutableStatus.BLOCKED:
            //     return [TaskStatus.READY]
            case TaskExecutableStatus.COMPLETED:
                return [TaskStatus.COMPLETED]
            default:
                return [
                    TaskStatus.READY,
                    TaskStatus.ONGOING,
                    // TaskStatus.COMPLETED,
                ]
        }
    }
    // 任务状态筛选项
    const [statusSelectedList, setStatusSelectedList] = useState<string[]>([])
    // 任务类型筛选项
    const [taskTypeSelectedList, setTaskTypeSelectedList] = useState<string[]>(
        [],
    )
    // 逾期筛选项
    const [deadlineSelectedList, setDeadlineSelectedList] = useState<string[]>(
        [],
    )
    // 任务优先级筛选项
    const [prioritySelectedList, setPrioritySelectedList] = useState<string[]>(
        [],
    )
    // 执行人筛选项
    const [executorSelectedList, setExecutorSelectedList] = useState<string[]>(
        [],
    )
    // 执行人集
    const [executors, setExecutors] = useState<ExecutorInfo[]>([])

    // 筛选窗是否打开
    const [statusSelectedOpen, setStatusSelectedOpen] = useState(false)
    const [taskTypeSelectedOpen, setTaskTypeSelectedOpen] = useState(false)
    const [deadlineSelectedOpen, setDeadlineSelectedOpen] = useState(false)
    const [prioritySelectedOpen, setPrioritySelectedOpen] = useState(false)
    const [executorSelectedOpen, setExecutorSelectedOpen] = useState(false)

    // 筛选菜单值
    const [menuValue, setMenuValue] = useState<any>(menus[0])

    // 搜索关键字
    const [searchKey, setSearchKey] = useState('')

    // 修改表头排序
    const [updateSortOrder, setUpdateSortOrder] = useState<SortOrder>(null)

    // 初始params
    const initialQueryParams = {
        offset: 1,
        limit: 10,
        keyword: '',
        status: statusSelectedList.join(','),
        task_type: WorkOrderTypes.join(','),
    }
    // 查询params
    const [queryParams, setQueryParams] = useState<any>(initialQueryParams)
    // 排序params
    const [sortDire, setSortDire] = useState<any>({
        direction: menus[0]?.sort,
        sort: menus[0]?.key,
    })
    // 是否为DropDownFilter控制的排序
    let sortWay: boolean = false

    // 显示/隐藏顶部区（选项，搜索，筛选...）
    const showSearch = useMemo(
        () =>
            ((tsCount?.total_processed_tasks || 0) > 0 &&
                taskType === MyTaskType.PROCESSED) ||
            ((tsCount?.total_created_tasks || 0) > 0 &&
                taskType === MyTaskType.CREATED) ||
            ((tsCount?.total_blocked_tasks || 0) > 0 &&
                taskType === TaskExecutableStatus.BLOCKED) ||
            ((tsCount?.total_completed_tasks || 0) > 0 &&
                taskType === TaskExecutableStatus.COMPLETED) ||
            ((tsCount?.total_executable_tasks || 0) > 0 &&
                taskType === TaskExecutableStatus.EXECUTABLE) ||
            ((tsCount?.total_invalid_tasks || 0) > 0 &&
                taskType === TaskExecutableStatus.INVALID),
        [tsCount, taskType],
    )

    const hasOprAccess = useMemo(() => {
        return checkPermission('manageDataUnderstandingWorkOrderAndTask')
    }, [checkPermission])

    useEffect(() => {
        // const state = searchParams.get('state')
        getExecutorsList()
    }, [])

    useEffect(() => {
        setLoading(true)
        getTableData(
            {
                ...initialQueryParams,
                status: defaultStatusList(currentTab).join(','),
            },
            MyTaskType.PROCESSED,
        )
    }, [currentTab])

    // 获取各个类型的数量
    const getTypeTotal = (type) => {
        switch (type) {
            case TaskExecutableStatus.EXECUTABLE:
                return tsCount?.total_executable_tasks || 0
            case TaskExecutableStatus.BLOCKED:
                return tsCount?.total_blocked_tasks || 0
            case TaskExecutableStatus.COMPLETED:
                return tsCount?.total_completed_tasks || 0
            case TaskExecutableStatus.INVALID:
                return tsCount?.total_invalid_tasks || 0
            case MyTaskType.PROCESSED:
                return tsCount?.total_processed_tasks || 0
            case MyTaskType.CREATED:
                return tsCount?.total_created_tasks || 0
            default:
                return 0
        }
    }

    // 获取表格数据
    const getTableData = async (params, type = taskType) => {
        setFetching(true)
        try {
            let tempParams = params
            if (type !== MyTaskType.PROCESSED && type !== MyTaskType.CREATED) {
                tempParams = { ...tempParams, executable_status: type }
            }
            const res = await getTasks({
                ...tempParams,
                is_create: type === MyTaskType.CREATED,
            })
            setQueryParams(params)
            setTsCount(res)
            setTaskItems(res.entries)
        } catch (e) {
            formatError(e)
            setTsCount(undefined)
            setTaskItems([])
        } finally {
            setLoading(false)
            setFetching(false)
            setMenuValue(undefined)
        }
    }

    // 搜索的防抖
    const { run } = useDebounceFn(getTableData, {
        wait: 400,
        leading: false,
        trailing: true,
    })

    // 搜索框enter
    const handleSearchPressEnter = (e: any) => {
        const keyword = typeof e === 'string' ? e : trim(e.target.value)
        setSearchKey(keyword)
        run({
            ...queryParams,
            keyword,
            offset: 1,
        })
    }

    // 排序方式改变
    const handleSortWayChange = (selectedMenu) => {
        if (showSearch) {
            sortWay = true
            const { key, sort } = selectedMenu
            // 默认排序不需要sort,direction
            if (key === SortType.DEFAULT) {
                setUpdateSortOrder(null)
                delete queryParams?.sort
                delete queryParams?.direction
                getTableData({
                    ...queryParams,
                    offset: 1,
                })
                return
            }
            setUpdateSortOrder(
                sort === SortDirection.DESC ? 'descend' : 'ascend',
            )
            getTableData({
                ...queryParams,
                sort: key,
                direction: sort,
                offset: 1,
            })
        }
    }

    const handleTableChange = (sorter) => {
        let sortFields = {}
        if (sorter.column) {
            setUpdateSortOrder(null)
            if (sorter.columnKey === 'updated_at') {
                setUpdateSortOrder(sorter.order || 'ascend')
            }
            sortFields = {
                direction:
                    sorter.order === 'descend'
                        ? SortDirection.DESC
                        : SortDirection.ASC,
                sort: sorter.columnKey,
            }
            setMenuValue({
                key: sorter.columnKey,
                sort:
                    sorter.order === 'descend'
                        ? SortDirection.DESC
                        : SortDirection.ASC,
            })
        } else {
            sortFields = sortDire
            if (sortDire.sort === 'updated_at') {
                setUpdateSortOrder('ascend')
                sortFields = { ...sortDire, direction: SortDirection.ASC }
                setMenuValue({
                    key: sorter.columnKey,
                    sort: SortDirection.ASC,
                })
            }
        }
        setSortDire(sortFields)
        getTableData({
            ...queryParams,
            sort: sorter.columnKey,
            direction:
                sorter.order === 'descend'
                    ? SortDirection.DESC
                    : SortDirection.ASC,
            offset: 1,
        })
    }

    // 刷新click
    const handleReload = (e: any) => {
        getTableData(queryParams)
    }
    const isWorkOrderTask = (task_type?: string) => {
        return [TaskType.DATACOMPREHENSIONWWORKORDER].includes(
            task_type as TaskType,
        )
    }
    // 任务相关操作处理
    const handleOperate = async (op: OperateType, item?: TaskDetail) => {
        setOperate(op)
        setTaskItem(item)
        // 跳转路径
        const backUrl = encodeURIComponent(location.pathname + location.search) // `/workOrderTask?state=${taskType}`
        const url =
            item?.task_type === TaskType.DATACOLLECTING
                ? `/dataDevelopment/dataSynchronization?projectId=${item?.project_id}&taskId=${item?.id}&backUrl=${backUrl}`
                : item?.task_type === TaskType.INDICATORPROCESSING
                ? `/dataDevelopment/indictorManage?projectId=${item?.project_id}&taskId=${item?.id}&backUrl=${backUrl}`
                : `/${
                      isWorkOrderTask(item?.task_type)
                          ? 'complete-work-order-task'
                          : 'complete-task'
                  }?projectId=${item?.project_id}&taskId=${
                      item?.id
                  }&backUrl=${backUrl}&targetTab=${
                      [
                          TaskType.DATACOLLECTING,
                          TaskType.DATAPROCESSING,
                      ].includes(item?.task_type as TaskType)
                          ? TabKey.FORM
                          : ''
                  }`
        // 操作

        switch (op) {
            case OperateType.CREATE:
                setGuideVisible(true)
                break
            case OperateType.DELETE:
                setDelVisible(true)
                break
            case OperateType.EDIT:
                setCreateVisible(true)
                break
            case OperateType.DETAIL:
                setDetailVisible(true)
                break
            case OperateType.PREVIEW:
                checkBeforeJumpModel(
                    false,
                    navigator,
                    url,
                    item?.id,
                    item?.project_id,
                    item?.name,
                    item?.status,
                    item?.task_type,
                    item?.executable_status,
                    item?.subject_domain_id,
                )
                break
            case OperateType.EXECUTE:
                checkBeforeJumpModel(
                    false,
                    navigator,
                    url,
                    item?.id,
                    item?.project_id,
                    item?.name,
                    item?.status,
                    item?.task_type,
                    item?.executable_status,
                    item?.subject_domain_id,
                )
                break
            default:
                break
        }
    }

    // 列表中改变任务状态
    const handleStatusChange = async (item: TaskDetail, changed?: string) => {
        try {
            if (changed === item.status) {
                return
            }
            if (item.task_type === TaskType.FIELDSTANDARD) {
                // 完成新建标准任务需要通知标准化后端
                await completeStdTask(item.id!)
            }
            await editTask(item.id!, {
                name: item.name,
                status: changed,
            })
            // 区分改变后的状态刷新
            if (changed === TaskStatus.COMPLETED) {
                message.success(__('任务已完成'))
                getTableData({
                    ...queryParams,
                    current:
                        taskItems.length === 1
                            ? queryParams.current! - 1 || 1
                            : queryParams.current!,
                })
            } else {
                message.info(__('任务进行中'))
                getTableData(queryParams)
            }
        } catch (e) {
            if (e?.data?.code === 'TaskCenter.Task.TaskDomainNotExist') {
                messageError(__('关联业务领域被删除'))
            } else {
                formatError(e)
            }
            getTableData(queryParams)
        }
    }

    // 获取执行人列表
    const getExecutorsList = async () => {
        const res = await getTaskAllExecutors()
        if (res) {
            setExecutors([noExecutorAssigned, ...res])
        }
    }

    // 任务状态筛选窗
    const statusFilterDropdown = () => {
        return (
            <StatusFilter
                list={defaultStatusList(taskType)}
                selectedList={statusSelectedList}
                onSure={(value) => {
                    setStatusSelectedOpen(false)
                    setStatusSelectedList(value)
                    getTableData({
                        ...queryParams,
                        status: value.join(','),
                        offset: 1,
                    })
                }}
            />
        )
    }

    // 任务类型筛选窗
    const taskTypeFilterDropdown = () => {
        return (
            <TaskTypeFilter
                list={allTaskTypeList}
                selectedList={taskTypeSelectedList}
                onSure={(value) => {
                    setTaskTypeSelectedOpen(false)
                    setTaskTypeSelectedList(value)
                    getTableData({
                        ...queryParams,
                        task_type: value.join(','),
                        offset: 1,
                    })
                }}
            />
        )
    }

    // 优先级筛选窗
    const priorityFilterDropdown = () => {
        return (
            <PriorityFilter
                list={defaultPriorityList}
                selectedList={prioritySelectedList}
                onSure={(value) => {
                    setPrioritySelectedOpen(false)
                    setPrioritySelectedList(value)
                    getTableData({
                        ...queryParams,
                        priority: value.join(','),
                        offset: 1,
                    })
                }}
            />
        )
    }

    // 执行人筛选窗
    const executorFilterDropdown = () => {
        return (
            <ExecutorFilter
                infoList={executors}
                selectedList={executorSelectedList}
                onSure={(value) => {
                    setExecutorSelectedOpen(false)
                    setExecutorSelectedList(value)
                    getTableData({
                        ...queryParams,
                        executor_id: value.join(','),
                        offset: 1,
                    })
                }}
            />
        )
    }

    // 操作栏宽度
    const operateWidth = () => {
        switch (taskType) {
            // 普通任务无执行
            // 执行任务、详细信息
            case TaskExecutableStatus.EXECUTABLE:
                return 176
            // 详细信息
            case TaskExecutableStatus.BLOCKED:
                return 96
            // 执行结果、详细信息
            case TaskExecutableStatus.COMPLETED:
                return 176
            // 详细信息
            case TaskExecutableStatus.INVALID:
                return 96
            // 执行结果（执行任务）、详细信息
            case MyTaskType.PROCESSED:
                return 176
            // 执行结果、详细信息、编辑、删除
            case MyTaskType.CREATED:
                return 220
            default:
                return 0
        }
    }

    // 表格项
    const columns = (): ColumnsType<TaskDetail> => {
        const cols: ColumnsType<TaskDetail> = [
            {
                title: (
                    <div>
                        <span>{__('任务名称')}</span>
                        <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                            {__('（描述）')}
                        </span>
                    </div>
                ),
                dataIndex: 'name',
                key: 'name',
                fixed: 'left',
                ellipsis: true,
                render: (_, record: any) => (
                    <>
                        <div className={styles.nameWrapper}>
                            <div
                                className={classnames({
                                    [styles.topInfo]: true,
                                    [styles.titleUnline]: [
                                        TaskConfigStatus.NORMAL,
                                    ].includes(record.config_status),
                                    [styles.nameDisable]: lodash
                                        .values(TaskConfigStatus)
                                        .filter(
                                            (v) =>
                                                v !== TaskConfigStatus.NORMAL,
                                        )
                                        .includes(record.config_status),
                                })}
                                title={record.name}
                                onClick={() =>
                                    handleOperate(OperateType.DETAIL, record)
                                }
                            >
                                {record.name || '--'}
                            </div>
                            {lodash
                                .values(TaskConfigStatus)
                                .filter((v) => v !== TaskConfigStatus.NORMAL)
                                .includes(record.config_status) && (
                                <Tooltip
                                    title={
                                        TaskConfigStatusText[
                                            record.config_status
                                        ]
                                    }
                                    placement="bottom"
                                >
                                    <ExclamationCircleOutlined
                                        className={styles.deleteIcon}
                                    />
                                </Tooltip>
                            )}
                        </div>
                        <div
                            className={styles.bottomInfo}
                            title={record.description}
                        >
                            {record.description || __('暂无描述')}
                        </div>
                    </>
                ),
            },
            {
                title: (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {__('任务状态')}
                        <Dropdown
                            trigger={['click']}
                            dropdownRender={statusFilterDropdown}
                            destroyPopupOnHide
                            onOpenChange={(flag) => setStatusSelectedOpen(flag)}
                            open={statusSelectedOpen}
                        >
                            <FiltersFilledOutlined
                                hidden={defaultStatusList.length === 1}
                                style={{
                                    marginLeft: 4,
                                    fontSize: 12,
                                    color:
                                        statusSelectedList.length > 0
                                            ? '#126EE3 '
                                            : 'rgba(0, 0, 0, 0.25)',
                                }}
                            />
                        </Dropdown>
                    </div>
                ),
                dataIndex: 'status',
                key: 'status',
                ellipsis: true,
                width: 140,
                render: (taskStatus, record: any) =>
                    statusInfos
                        .filter((info) => info.value === record.status)
                        .map((info) => {
                            if (
                                taskType !== MyTaskType.CREATED &&
                                record.executable_status ===
                                    TaskExecutableStatus.EXECUTABLE &&
                                !lodash
                                    .values(TaskConfigStatus)
                                    .filter(
                                        (v) => v !== TaskConfigStatus.NORMAL,
                                    )
                                    .includes(record.config_status)
                            ) {
                                return (
                                    <StatusSelect
                                        key={record.id}
                                        taskId={record.id}
                                        taskType={record.task_type}
                                        status={info.value}
                                        width="fit-content"
                                        dropPlacement="bottom"
                                        onChange={(status) =>
                                            handleStatusChange(record, status)
                                        }
                                    />
                                )
                            }
                            return (
                                <StatusLabel
                                    key={record.id}
                                    taskId={record.id}
                                    taskType={record.task_type}
                                    status={taskStatus}
                                    label={info.label}
                                    color={info.color}
                                    bgColor={info.backgroundColor}
                                />
                            )
                        }),
            },
            {
                title: (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {__('任务优先级')}
                        <Dropdown
                            trigger={['click']}
                            dropdownRender={priorityFilterDropdown}
                            destroyPopupOnHide
                            onOpenChange={(flag) =>
                                setPrioritySelectedOpen(flag)
                            }
                            open={prioritySelectedOpen}
                        >
                            <FiltersFilledOutlined
                                style={{
                                    marginLeft: 4,
                                    fontSize: 12,
                                    color:
                                        prioritySelectedList.length > 0
                                            ? '#126EE3 '
                                            : 'rgba(0, 0, 0, 0.25)',
                                }}
                            />
                        </Dropdown>
                    </div>
                ),
                dataIndex: 'priority',
                key: 'priority',
                ellipsis: true,
                width: 120,
                render: (_, record) => {
                    const pri =
                        taskPriorityInfos[
                            record?.priority || TaskPriority.COMMON
                        ]
                    return (
                        <PriorityLabel
                            key={record.id}
                            label={pri.label}
                            color={pri.color}
                        />
                    )
                },
            },
            {
                title: __('截止日期'),
                dataIndex: 'deadline',
                key: 'deadline',
                ellipsis: true,
                width: 120,
                render: (value) => {
                    const date =
                        value === 0
                            ? '--'
                            : moment(value * 1000).format('YYYY-MM-DD')
                    return (
                        <div className={styles.topInfo} title={date}>
                            {date}
                        </div>
                    )
                },
            },
            {
                title: (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {__('任务类型')}
                    </div>
                ),
                dataIndex: 'task_type',
                key: 'task_type',
                ellipsis: true,
                render: (value) => (
                    <TaskTypeContent label={value || TaskType.NORMAL} />
                ),
            },
            {
                title: __('所属工单'),
                dataIndex: 'work_order_name',
                key: 'work_order_name',
                ellipsis: true,
                render: (value) => (
                    <div className={styles.topInfo}>{value || '--'}</div>
                ),
            },
            {
                title: __('更新时间'),
                dataIndex: 'updated_at',
                key: 'updated_at',
                ellipsis: true,
                sorter: true,
                sortOrder: updateSortOrder,
                sortDirections: ['descend', 'ascend', 'descend'],
                showSorterTooltip: false,
                render: (_, record) =>
                    record?.updated_at ? formatTime(record.updated_at) : '--',
            },
            {
                title: __('操作'),
                key: 'action',
                fixed: 'right',
                width: operateWidth(),
                render: (_, record: any) => (
                    <Space size={24}>
                        {/* 普通任务操作 */}
                        {record.task_type === TaskType.NORMAL &&
                            record.executable_status ===
                                TaskExecutableStatus.EXECUTABLE &&
                            taskType !== MyTaskType.CREATED && (
                                <Button
                                    type="link"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleStatusChange(
                                            record,
                                            record.status === TaskStatus.READY
                                                ? TaskStatus.ONGOING
                                                : TaskStatus.COMPLETED,
                                        )
                                    }}
                                >
                                    {record.status === TaskStatus.READY
                                        ? __('执行任务')
                                        : __('完成任务')}
                                </Button>
                            )}
                        {record.task_type !== TaskType.NORMAL &&
                            !lodash
                                .values(TaskConfigStatus)
                                .filter((v) => v !== TaskConfigStatus.NORMAL)
                                .includes(record.config_status) &&
                            (record.status === TaskStatus.COMPLETED ? (
                                <Button
                                    type="link"
                                    key="preview"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleOperate(
                                            OperateType.PREVIEW,
                                            record,
                                        )
                                    }}
                                >
                                    {__('执行结果')}
                                </Button>
                            ) : (
                                record.executable_status ===
                                    TaskExecutableStatus.EXECUTABLE &&
                                taskType !== MyTaskType.CREATED &&
                                hasOprAccess && (
                                    <Button
                                        type="link"
                                        key="preview"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleOperate(
                                                OperateType.EXECUTE,
                                                record,
                                            )
                                        }}
                                    >
                                        {__('执行任务')}
                                    </Button>
                                )
                            ))}
                        {hasOprAccess &&
                            taskType === MyTaskType.CREATED &&
                            record.status !== TaskStatus.COMPLETED &&
                            !lodash
                                .values(TaskConfigStatus)
                                .filter(
                                    (v) =>
                                        v !== TaskConfigStatus.NORMAL &&
                                        v !== TaskConfigStatus.EXECUTORDELETE,
                                )
                                .includes(record.config_status) && (
                                <Button
                                    type="link"
                                    key="edit"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleOperate(OperateType.EDIT, record)
                                    }}
                                >
                                    {__('编辑任务')}
                                </Button>
                            )}
                        <Button
                            type="link"
                            key="detail"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleOperate(OperateType.DETAIL, record)
                            }}
                        >
                            {__('任务详情')}
                        </Button>
                        {hasOprAccess &&
                            taskType === MyTaskType.CREATED &&
                            record.status !== TaskStatus.COMPLETED && (
                                <Button
                                    type="link"
                                    key="delete"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleOperate(
                                            OperateType.DELETE,
                                            record,
                                        )
                                    }}
                                >
                                    {__('删除')}
                                </Button>
                            )}
                    </Space>
                ),
            },
        ]
        if (taskType === MyTaskType.CREATED) {
            cols.splice(6, 0, {
                title: (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {__('任务执行人')}
                        <Dropdown
                            trigger={['click']}
                            dropdownRender={executorFilterDropdown}
                            destroyPopupOnHide
                            onOpenChange={(flag) =>
                                setExecutorSelectedOpen(flag)
                            }
                            open={executorSelectedOpen}
                        >
                            <FiltersFilledOutlined
                                style={{
                                    marginLeft: 4,
                                    fontSize: 12,
                                    color:
                                        executorSelectedList.length > 0
                                            ? '#126EE3 '
                                            : 'rgba(0, 0, 0, 0.25)',
                                }}
                            />
                        </Dropdown>
                    </div>
                ),
                dataIndex: 'executor_name',
                key: 'executor_name',
                ellipsis: true,
                width: 120,
                render: (value, record) => (
                    <div
                        className={styles.topInfo}
                        title={value}
                        style={{
                            color:
                                record.status === TaskStatus.ONGOING && !value
                                    ? '#F44436FF'
                                    : '#000000D9',
                        }}
                    >
                        {value || __('未分配')}
                    </div>
                ),
            })
        }
        return cols
    }

    // 空库表
    const showEmpty = () => {
        const desc =
            taskType === MyTaskType.CREATED ? (
                <div style={{ height: 44 }}>
                    <div>{__('暂无数据')}</div>
                    {/* <div
                        hidden={
                            !getAccess(
                                `${ResourceType.task}.${RequestType.post}`,
                            )
                        }
                    >
                        {__('点击')}
                        <span
                            onClick={() => handleOperate(OperateType.CREATE)}
                            className={styles.link}
                        >
                            【{__('新建')}】
                        </span>
                        {__('按钮可新建任务')}
                    </div> */}
                </div>
            ) : (
                <span>
                    {__('暂无')}
                    {TaskExecutableStatusText[taskType] || __('我执行')}
                    {__('的任务')}
                </span>
            )
        // const icon =
        //     taskType === MyTaskType.CREATED &&
        //     getAccess(`${ResourceType.task}.${RequestType.post}`)
        //         ? empty
        //         : dataEmpty
        return <Empty desc={desc} iconSrc={dataEmpty} />
    }

    // 新建、编辑默认值
    const createEditData = () => {
        // 创建操作
        if (operate === OperateType.CREATE) {
            return [
                { name: 'main_biz', hidden: true },
                { name: 'biz_form', hidden: true },
                // { name: 'assets_cat', hidden: true },
            ]
        }

        // 编辑操作
        let arr: any[] = [
            { name: 'project_id', disabled: true },
            { name: 'stage_node', disabled: true },
        ]
        // 我执行的
        if (taskType === MyTaskType.PROCESSED) {
            arr = arr.concat([
                { name: 'name', disabled: true },
                { name: 'executor_id', disabled: true },
            ])
        }
        // 任务不存在为游离任务，不展示项目名称及阶段节点
        if (!taskItem?.project_id) {
            arr = [
                ...arr,
                { name: 'project_id', hidden: true },
                { name: 'stage_node', hidden: true },
            ]
        }
        // // 新建标准任务类型不准编辑
        // if (taskItem?.task_type === TaskType.FIELDSTANDARD) {
        //     arr = [
        //         ...arr,
        //         {
        //             name: 'task_type',
        //             disabled: true,
        //             value: {
        //                 key: TaskType.FIELDSTANDARD,
        //                 label: TaskTypeLabel[TaskType.FIELDSTANDARD],
        //             },
        //         },
        //     ]
        // }
        // 编辑【新建标准任务】隐藏阶段节点、关联业务域
        if (taskItem?.task_type === TaskType.FIELDSTANDARD) {
            arr = [
                ...arr,
                { name: 'stage_node', hidden: true },
                { name: 'domain_id', hidden: true },
            ]
        }
        return arr
    }

    const switchTab = (key?: string) => {
        setCurrentTab(key)
    }
    return (
        <div className={styles.myTaskWrapper}>
            {/* <div className={styles.mt_leftWrapper} hidden={!expand}>
                <div className={styles.mt_lTitle}>{__('工单任务')}</div>
                {taskClassification
                    .filter((t) => getAccesses(t?.access, false))
                    .map((t) => (
                        <TextNumLabel
                            key={t.type}
                            label={t.text}
                            selected={taskType === t.type}
                            total={getTypeTotal(t.type)}
                            icon={t.icon}
                            onSelected={() => changeTaskDivided(t.type)}
                        />
                    ))}
            </div> */}
            {/* <div className={styles.mt_expandWrapper}>
                <div
                    className={styles.mt_expand}
                    style={{ left: expand ? -6 : 0 }}
                    onClick={() => {
                        setExpand(!expand)
                    }}
                >
                    {expand ? <CaretLeftOutlined /> : <CaretRightOutlined />}
                </div>
            </div> */}
            <div
                className={styles.mt_rightWrapper}
                style={{
                    width: 'calc(100% - 20px)',
                    paddingLeft: '20px',
                }}
            >
                <div className={styles.topWrapper}>
                    <div className={styles.tlWrapper}>
                        <div className={styles['opt-tab']}>
                            <span
                                className={
                                    currentTab ===
                                    TaskExecutableStatus.EXECUTABLE
                                        ? styles['is-check']
                                        : undefined
                                }
                                onClick={() =>
                                    switchTab(TaskExecutableStatus.EXECUTABLE)
                                }
                            >
                                待办(
                                {getTypeTotal(TaskExecutableStatus.EXECUTABLE)})
                            </span>
                            <span
                                className={
                                    currentTab ===
                                    TaskExecutableStatus.COMPLETED
                                        ? styles['is-check']
                                        : undefined
                                }
                                onClick={() =>
                                    switchTab(TaskExecutableStatus.COMPLETED)
                                }
                            >
                                已办(
                                {getTypeTotal(TaskExecutableStatus.COMPLETED)})
                            </span>
                        </div>
                        {/* <div className={styles.mt_rTitle}>
                            {
                                taskClassification.find(
                                    (t) => t.type === taskType,
                                )?.text
                            }
                        </div> */}
                    </div>
                    <div
                        className={styles.selectedWrapper}
                        // hidden={!showSearch}
                    >
                        <Space size={12}>
                            <SearchInput
                                placeholder={__('搜索任务名称')}
                                value={searchKey}
                                onKeyChange={(kw: string) =>
                                    handleSearchPressEnter(kw)
                                }
                                onPressEnter={(e) => handleSearchPressEnter(e)}
                                style={{ width: 272 }}
                                maxLength={32}
                            />
                            <Space size={0}>
                                <SortBtn
                                    contentNode={
                                        <DropDownFilter
                                            menus={menus.map((current) =>
                                                current.key === SortType.DEFAULT
                                                    ? {
                                                          ...current,
                                                          label: getTaskSortHelpComponent(
                                                              current.label,
                                                          ),
                                                      }
                                                    : current,
                                            )}
                                            defaultMenu={menuValue || menus[0]}
                                            changeMenu={menuValue}
                                            menuChangeCb={handleSortWayChange}
                                            overlayStyle={{ minWidth: 128 }}
                                        />
                                    }
                                />
                                <RefreshBtn
                                    onClick={() => getTableData(queryParams)}
                                />
                            </Space>
                        </Space>
                    </div>
                </div>
                <div className={styles.empty} hidden={!loading}>
                    <Loader />
                </div>
                <div className={styles.empty} hidden={loading || showSearch}>
                    {showEmpty()}
                </div>
                <div
                    className={styles.tableWrapper}
                    hidden={loading || !showSearch}
                >
                    <Table
                        columns={columns()}
                        dataSource={taskItems}
                        loading={fetching}
                        rowClassName={styles.tableRow}
                        pagination={false}
                        scroll={{
                            x: 1280,
                            y:
                                tsCount?.total_count === 0
                                    ? undefined
                                    : MyTaskType.CREATED === taskType
                                    ? (tsCount?.total_count || 0) > 10
                                        ? 'calc(100vh - 288px)'
                                        : 'calc(100vh - 246px)'
                                    : (tsCount?.total_count || 0) > 10
                                    ? 'calc(100vh - 250px)'
                                    : 'calc(100vh - 208px)',
                        }}
                        locale={{
                            emptyText: <Empty />,
                        }}
                        rowKey="id"
                        // onRow={(record) => ({
                        //     onClick: () =>
                        //         handleOperate(OperateType.DETAIL, record),
                        // })}
                        onChange={(pagination, filters, sorter) =>
                            handleTableChange(sorter)
                        }
                    />
                    <Pagination
                        current={queryParams.offset}
                        pageSize={queryParams.limit}
                        onChange={(page) => {
                            getTableData({
                                ...queryParams,
                                offset: page,
                            })
                        }}
                        className={styles.pagination}
                        total={tsCount?.total_count || 0}
                        showSizeChanger={false}
                        hideOnSinglePage
                    />
                </div>
            </div>
            <CreateTaskGuide
                visible={guideVisible}
                onSure={(type) => {
                    setCreateTaskType(type)
                    setCreateVisible(true)
                    setGuideVisible(false)
                }}
                onClose={() => setGuideVisible(false)}
            />
            <CreateTask
                show={createVisible}
                operate={operate}
                title={`${
                    operate === OperateType.CREATE ? __('新建') : '编辑'
                }${__('任务')}`}
                pid={taskItem?.project_id}
                tid={taskItem?.id}
                defaultData={createEditData()}
                isSupportFreeTask={createTaskType === 'free'}
                onClose={(info) => {
                    setCreateTaskType(undefined)
                    setCreateVisible(false)
                    if (info) {
                        getTableData(queryParams)
                        setTaskItem(undefined)
                        getExecutorsList()
                    }
                }}
            />
            <TaskDetails
                visible={detailVisible}
                taskId={taskItem?.id || ''}
                projectId={taskItem?.project_id}
                onClose={() => setDetailVisible(false)}
            />
            {delVisible && (
                <DeleteTask
                    projectId={taskItem?.project_id || ''}
                    taskId={taskItem?.id || ''}
                    onClose={(data) => {
                        setDelVisible(false)
                        setTaskItem(undefined)
                        if (data && data.id) {
                            getTableData({
                                ...queryParams,
                                offset:
                                    taskItems.length === 1
                                        ? queryParams.offset! - 1 || 1
                                        : queryParams.offset!,
                            })
                        }
                    }}
                />
            )}
        </div>
    )
}

export default ExecuteTasks
