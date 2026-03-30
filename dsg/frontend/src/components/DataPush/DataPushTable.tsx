import { Button, message, Popconfirm, Popover, Table, Tooltip } from 'antd'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDebounceFn, useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import { isEmpty, isNil, omit } from 'lodash'
import {
    ExclamationCircleFilled,
    InfoCircleFilled,
    ReadOutlined,
} from '@ant-design/icons'
import moment from 'moment'
import __ from './locale'
import {
    AuditStatus,
    DataPushTab,
    auditTypeMap,
    DataPushAction,
    auditStatusMap,
    dataPushStatusMap,
    manageOperationMap,
    DataPushStatus,
    JobStatus,
    jobStatusMap,
    scheduleTypeMap,
} from './const'
import styles from './styles.module.less'
import {
    Empty,
    LightweightSearch,
    ListPagination,
    ListType,
    OptionBarTool,
    OptionMenuType,
    SearchInput,
} from '@/ui'
import DropDownFilter from '../DropDownFilter'
import {
    IPushListItem,
    SortDirection,
    deleteDataPush,
    executeDataPush,
    formatError,
    getAuditProcessFromConfCenter,
    getDataPushAuditList,
    getDataPushAuditRecall,
    getDataPushList,
    getDataPushMonitorList,
    putDataPushSwitch,
} from '@/core'
import { cancelRequest, formatTime, rewriteUrl, useQuery } from '@/utils'
import { RefreshBtn, SortBtn } from '../ToolbarComponents'
import {
    StatusDot,
    StatusView,
    changeUrlData,
    dataPushTabMap,
    formatTotalTime,
    renderEmpty,
    renderLoader,
    schedulePlanPopover,
} from './helper'
import DataPushDrawer from './DataPushDrawer'
import AuditDrawer from './Audit/AuditDrawer'
import SearchLayout from '../SearchLayout'
import SchedulePlanModal from './SchedulePlanForm/SchedulePlanModal'

interface IDataPushTable {
    menu: string
}

const DataPushTable: React.FC<IDataPushTable> = ({ menu }) => {
    const query = useQuery()
    const dataPushId = query.get('dataPushId')
    const operate = query.get('operate') || ''

    const searchRef = useRef<any>(null)
    const [searchCondition, setSearchCondition] = useState<any>()
    // 下拉排序
    const [selectedSort, setSelectedSort] = useState<any>(
        dataPushTabMap[menu].defaultMenu,
    )
    // 表头排序
    const [tableSort, setTableSort] = useState<any>(
        dataPushTabMap[menu].defaultTableSort,
    )
    // 搜索是否展开
    const [searchIsExpansion, setSearchIsExpansion] = useState<boolean>(false)

    // load
    const [loading, setLoading] = useState<boolean>(true)
    const [fetching, setFetching] = useState<boolean>(true)

    // 弹窗显示
    const [showDetails, setShowDetails] = useState(false)
    const [showAuditModal, setShowAuditModal] = useState(false)
    const [showSchedulePlanModal, setShowSchedulePlanModal] = useState(false)

    // 表格数据
    const [tableData, setTableData] = useState<IPushListItem[]>([])
    // 总条数
    const [total, setTotal] = useState<number>(0)
    // 是否为空
    const [isDataEmpty, setIsDataEmpty] = useState<boolean>(false)
    // 当前操作项
    const [operateItem, setOperateItem] = useState<any>()
    // 当前操作
    const [detailsOp, setDetailsOp] = useState<any>('view')
    // 是否配置审核策略
    const [existPermissionReq, setExistPermissionReq] = useState(true)

    useEffect(() => {
        setLoading(true)
        const config = dataPushTabMap[menu]
        const initSearch = {
            limit: 10,
            offset: 1,
            sort: config.defaultMenu?.key,
            direction: config.defaultMenu?.sort,
        }
        setSearchCondition(initSearch)
        setSelectedSort(dataPushTabMap[menu].defaultMenu)
        setTableSort(dataPushTabMap[menu].defaultTableSort)
    }, [])

    useEffect(() => {
        setDetailsOp(operate)
        if (operate && dataPushId) {
            setShowDetails(true)
        } else if (operate === DataPushAction.Create) {
            setShowDetails(true)
        }
    }, [operate])

    useMemo(() => {
        if (!loading && total === 0) {
            setIsDataEmpty(true)
        } else {
            setIsDataEmpty(false)
        }
    }, [loading])

    // 根据条件请求数据
    useUpdateEffect(() => {
        if (!isEmpty(searchCondition)) {
            getTableList({ ...searchCondition })
        }
    }, [searchCondition])

    // 是否有过滤值
    const isSearchStatus = useMemo(() => {
        const ignoreAttr = ['offset', 'limit', 'sort', 'direction']
        return Object.values(omit(searchCondition, ignoreAttr)).some(
            (item) => item,
        )
    }, [searchCondition])

    // 表格高度
    const tableHeight = useMemo(() => {
        const normalHeight = dataPushTabMap[menu].tableHeight
        if (menu !== DataPushTab.Monitor) {
            return normalHeight
        }
        let addHeight = 0
        if (searchIsExpansion) {
            addHeight += 110
        }
        const ignoreAttr = ['offset', 'limit', 'sort', 'direction', 'keyword']
        const hasCondition = Object.values(
            omit(searchCondition, ignoreAttr),
        ).some((item) => item)
        if (hasCondition) {
            addHeight += 42
        }
        return normalHeight + addHeight
    }, [searchIsExpansion, searchCondition])

    // 获取表格数据
    const getTableList = async (params: any) => {
        let tempParam = params
        try {
            setFetching(true)
            let req
            if (menu === DataPushTab.Monitor) {
                cancelRequest(`/api/data-catalog/v1/data-push/schedule`, 'get')
                req = getDataPushMonitorList
            } else if (menu === DataPushTab.Audit) {
                cancelRequest(`/api/data-catalog/v1/data-push/audit`, 'get')
                req = getDataPushAuditList
                tempParam = {
                    ...tempParam,
                    target: 'tasks',
                }
            } else {
                cancelRequest(`/api/data-catalog/v1/data-push`, 'get')
                req = getDataPushList
            }
            const res = await req(tempParam)
            if (menu === DataPushTab.Overview) {
                setTableData(res?.entries?.slice(0, 10) || [])
                setTotal(10)
            } else {
                setTableData(res?.entries || [])
                setTotal(res?.total_count || 0)
            }
        } catch (error) {
            formatError(error)
        } finally {
            setFetching(false)
            setLoading(false)
            setSelectedSort(undefined)
        }
    }

    // 获取是否配置权限申请审核策略
    const getAuditProcess = async () => {
        try {
            const res = await getAuditProcessFromConfCenter({
                audit_type: 'af-data-permission-request',
            })
            setExistPermissionReq(res.entries?.length > 0)
        } catch (error) {
            formatError(error)
        }
    }

    // 刷新
    const handleRefresh = (refresh: boolean = true) => {
        setSearchCondition((prev) => ({
            ...prev,
            offset: refresh ? 1 : prev.offset,
        }))
    }

    // 通用操作请求
    const commonOperationReq = async (
        commonReq: () => Promise<any>,
        callback?: () => void,
    ) => {
        try {
            await commonReq()
            callback?.()
        } catch (error) {
            formatError(error)
        }
    }

    // 表格操作事件
    const { run: handleOptionTable } = useDebounceFn(
        (key: string, record?: any) => {
            setOperateItem(record)
            switch (key) {
                case DataPushAction.Create:
                    rewriteUrl(
                        changeUrlData({
                            operate: key,
                        }),
                    )
                    break
                case DataPushAction.Detail:
                case DataPushAction.Monitor:
                case DataPushAction.Edit:
                    rewriteUrl(
                        changeUrlData({
                            operate: key,
                            dataPushId: record.id,
                        }),
                    )
                    break
                case DataPushAction.Delete:
                    commonOperationReq(
                        () => deleteDataPush(record.id),
                        () =>
                            setSearchCondition((prev) => ({
                                ...prev,
                                offset:
                                    tableData.length === 1
                                        ? prev.offset - 1 || 1
                                        : prev.offset,
                            })),
                    )
                    break
                case DataPushAction.Execute:
                    commonOperationReq(
                        () => executeDataPush(record.id),
                        () => message.success(__('已执行，详情看作业监控')),
                    )
                    break
                case DataPushAction.ModifySchedule:
                    setShowSchedulePlanModal(true)
                    break
                case DataPushAction.Start:
                    commonOperationReq(
                        () =>
                            putDataPushSwitch({
                                id: record.id,
                                schedule_status: 1,
                            }),
                        () => handleRefresh(false),
                    )
                    break
                case DataPushAction.Stop:
                    commonOperationReq(
                        () =>
                            putDataPushSwitch({
                                id: record.id,
                                schedule_status: 0,
                            }),
                        () => handleRefresh(false),
                    )
                    break
                case DataPushAction.Recall:
                    commonOperationReq(
                        () => getDataPushAuditRecall(record.id),
                        () => handleRefresh(false),
                    )
                    break
                case DataPushAction.Audit:
                    setShowAuditModal(true)
                    break
                default:
                    break
            }
        },
        {
            wait: 400,
            leading: true,
            trailing: false,
        },
    )

    const confirmText = (
        text: string,
        record: any,
        key: string,
        type: 'warn' | 'info' = 'warn',
    ) => (
        <Popconfirm
            icon={
                type === 'warn' ? (
                    <ExclamationCircleFilled style={{ color: '#faad14' }} />
                ) : (
                    <InfoCircleFilled style={{ color: '#1890ff' }} />
                )
            }
            title={__('确定要执行此操作吗？')}
            onConfirm={() => handleOptionTable(key, record)}
            okText={__('确定')}
            cancelText={__('取消')}
        >
            <span style={{ display: 'inline-block', width: '100%' }}>
                {text}
            </span>
        </Popconfirm>
    )

    // 表格操作项
    const getTableOptions = (record) => {
        const optionMenus = [
            {
                key: DataPushAction.Detail,
                label: __('详情'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: DataPushAction.Edit,
                label: __('编辑'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: DataPushAction.Delete,
                label: confirmText(__('删除'), record, DataPushAction.Delete),
                menuType: OptionMenuType.Menu,
            },
            {
                key: DataPushAction.Monitor,
                label: __('作业监控'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: DataPushAction.Execute,
                label: __('立即执行'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: DataPushAction.ModifySchedule,
                label: __('修改调度时间'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: DataPushAction.Start,
                label: confirmText(
                    __('启用'),
                    record,
                    DataPushAction.Start,
                    'info',
                ),
                menuType: OptionMenuType.Menu,
            },
            {
                key: DataPushAction.Stop,
                label: confirmText(__('停用'), record, DataPushAction.Stop),
                menuType: OptionMenuType.Menu,
            },
            {
                key: DataPushAction.Recall,
                label: confirmText(
                    __('撤回审核'),
                    record,
                    DataPushAction.Recall,
                ),
                menuType: OptionMenuType.Menu,
            },
            {
                key: DataPushAction.Audit,
                label: __('审核'),
                menuType: OptionMenuType.Menu,
            },
        ]
        let showOptionMenus: any[] = []

        if (menu === DataPushTab.Manage) {
            const { push_status, audit_state, operation } = record
            const statusOp =
                manageOperationMap[push_status]?.[audit_state]?.[operation] ||
                manageOperationMap[push_status]?.default
            const disabledMenus = [
                DataPushAction.Edit,
                DataPushAction.Delete,
                DataPushAction.ModifySchedule,
                DataPushAction.Start,
                DataPushAction.Stop,
            ]
            const disabledAuditStatus = [AuditStatus.Auditing]
            showOptionMenus = optionMenus
                .filter((item) => statusOp?.includes(item.key))
                .filter((item) => {
                    // 用户手动执行过一次，但还未到开始时间，会展示【作业监控】
                    if (
                        push_status === DataPushStatus.NotStarted &&
                        item.key === DataPushAction.Monitor &&
                        !record.recent_execute
                    ) {
                        return false
                    }
                    // 由资源上报触发的创建的数据推送任务，不走审核
                    // TODO 上报
                    if (
                        record.auto_execute &&
                        [
                            DataPushAction.Stop,
                            DataPushAction.Recall,
                            DataPushAction.ModifySchedule,
                        ].includes(item.key)
                    ) {
                        return false
                    }
                    return true
                })
                .map((item) => {
                    if (
                        disabledMenus.includes(item.key) &&
                        disabledAuditStatus.includes(audit_state)
                    ) {
                        return {
                            ...item,
                            title: __('${audit_state}，无法操作', {
                                audit_state:
                                    auditStatusMap[
                                        `${operation}_${audit_state}`
                                    ].text,
                            }),
                            disabled: true,
                        }
                    }
                    return item
                })
        } else {
            const { actionMap, actionKey } = dataPushTabMap[menu]
            const statusOp = actionMap[record[actionKey]]?.operation
            showOptionMenus = optionMenus
                .filter((item) => statusOp?.includes(item.key))
                .filter((item) => {
                    // 用户手动执行过一次，但还未到开始时间，会展示【作业监控】
                    if (
                        menu === DataPushTab.Overview &&
                        record.push_status === DataPushStatus.NotStarted &&
                        item.key === DataPushAction.Monitor &&
                        !record.recent_execute
                    ) {
                        return false
                    }
                    return true
                })
        }
        if (showOptionMenus.length > 4) {
            return showOptionMenus.map((op, idx) => {
                if (idx >= 3) {
                    return { ...op, menuType: OptionMenuType.More }
                }
                return op
            })
        }
        return showOptionMenus
    }

    const columns: any = useMemo(() => {
        const cols = [
            // ************* 管理 *************
            {
                title: __('数据推送名称/描述'),
                dataIndex: 'name_desc',
                key: 'name_desc',
                ellipsis: true,
                render: (value, record) => {
                    const {
                        name,
                        description,
                        audit_state,
                        audit_advice,
                        operation,
                    } = record
                    return (
                        <div className={styles.twoLine}>
                            <div className={styles.name_desc}>
                                <span
                                    className={classnames(
                                        styles.firstLine,
                                        styles.link,
                                    )}
                                    title={name}
                                    onClick={() => {
                                        handleOptionTable(
                                            DataPushAction.Detail,
                                            record,
                                        )
                                    }}
                                >
                                    {name}
                                </span>
                                {audit_state > 0 && (
                                    <StatusView
                                        data={
                                            auditStatusMap[
                                                `${operation}_${audit_state}`
                                            ]
                                        }
                                        tip={audit_advice}
                                    />
                                )}
                            </div>
                            <span
                                className={classnames(
                                    styles.secondLine,
                                    styles.gray,
                                )}
                                title={description}
                            >
                                {description || '--'}
                            </span>
                        </div>
                    )
                },
            },
            {
                title: __('状态'),
                dataIndex: 'push_status',
                key: 'push_status',
                width: 120,
                ellipsis: true,
                render: (value, record) => (
                    <StatusDot
                        data={dataPushStatusMap[value]}
                        tip={
                            // TODO 上报
                            record.status_error_message
                                ? __('由于资源已撤销上报，数据推送已停用')
                                : record.push_error
                        }
                    />
                ),
            },
            {
                title: __('责任人'),
                dataIndex: 'responsible_person_name',
                key: 'responsible_person_name',
                width: 150,
                ellipsis: true,
                render: (value, record) => value || '--',
            },
            {
                title: __('调度计划'),
                dataIndex: 'schedule_type',
                key: 'schedule_type',
                ellipsis: true,
                width: 120,
                render: (value, record) => (
                    <div className={styles.schedulePlan}>
                        {scheduleTypeMap[value]?.text || '--'}
                        <Popover content={schedulePlanPopover(record)}>
                            <ReadOutlined className={styles.planIcon} />
                        </Popover>
                    </div>
                ),
            },
            {
                title: __('作业时间'),
                dataIndex: 'job_time',
                key: 'job_time',
                ellipsis: true,
                render: (value, record) => {
                    const {
                        recent_execute,
                        next_execute,
                        recent_execute_status,
                    } = record
                    return (
                        <div className={styles.twoLine}>
                            <span className={styles.firstLine}>
                                <span className={styles.label_name}>
                                    {__('最近：')}
                                    {recent_execute_status ===
                                        JobStatus.Exception && (
                                        <Tooltip
                                            title={__(
                                                '最近一次作业请求结果异常',
                                            )}
                                        >
                                            <ExclamationCircleFilled
                                                style={{
                                                    color: '#F25D5D',
                                                    marginRight: 4,
                                                }}
                                            />
                                        </Tooltip>
                                    )}
                                </span>
                                {recent_execute || '--'}
                            </span>
                            <span className={styles.secondLine}>
                                <span className={styles.label_name}>
                                    {__('下一次：')}
                                </span>
                                {next_execute > 0
                                    ? formatTime(next_execute)
                                    : '--'}
                            </span>
                        </div>
                    )
                },
            },
            {
                title: __('创建时间'),
                dataIndex: 'created_at',
                key: 'created_at',
                sorter: !!tableSort,
                sortOrder: tableSort?.created_at,
                showSorterTooltip: false,
                sortDirections: ['descend', 'ascend', 'descend'],
                width: 200,
                ellipsis: true,
                render: (value, record) =>
                    record.create_time ? formatTime(record.create_time) : '--',
            },

            // ************* 监控 *************
            {
                title: __('所属数据推送'),
                dataIndex: 'data_push_name',
                key: 'data_push_name',
                ellipsis: true,
                render: (value, record) => (
                    <span
                        className={classnames(styles.firstLine, styles.link)}
                        title={record.name}
                        onClick={() => {
                            rewriteUrl(
                                changeUrlData({
                                    operate: DataPushAction.Detail,
                                    dataPushId: record.id,
                                }),
                            )
                        }}
                    >
                        {record.name || '--'}
                    </span>
                ),
            },
            {
                title: __('状态'),
                dataIndex: 'job_status',
                key: 'job_status',
                width: 120,
                ellipsis: true,
                render: (value, record) => (
                    <StatusDot
                        data={jobStatusMap[record.status]}
                        tip={record?.error_message}
                    />
                ),
            },
            {
                title: __('执行方式'),
                dataIndex: 'sync_method',
                key: 'sync_method',
                width: 120,
                ellipsis: true,
                render: (value, record) =>
                    value === '手动' ? __('手动') : __('自动'),
            },
            {
                title: __('耗时'),
                dataIndex: 'sync_time',
                key: 'sync_time',
                width: 120,
                ellipsis: true,
                render: (value) =>
                    value ? formatTotalTime(Number(value)) : '--',
            },
            {
                title: __('请求时间'),
                dataIndex: 'start_time',
                key: 'start_time',
                width: 200,
                ellipsis: true,
                render: (value, record) => value || '--',
            },
            {
                title: __('完成时间'),
                dataIndex: 'end_time',
                key: 'end_time',
                width: 200,
                ellipsis: true,
                render: (value, record) => value || '--',
            },
            {
                title: __('推送总数'),
                dataIndex: 'sync_count',
                key: 'sync_count',
                ellipsis: true,
                render: (value, record) =>
                    isNil(value) || !record.status ? '--' : value,
            },
            {
                title: __('推送成功数'),
                dataIndex: 'sync_success_count',
                key: 'sync_success_count',
                ellipsis: true,
                render: (value, record) =>
                    isNil(value) || !record.status ? '--' : value,
            },

            // *************  审核  *************
            {
                title: __('申请编号'),
                dataIndex: 'apply_code',
                key: 'apply_code',
                ellipsis: true,
                render: (value, record) => value || '--',
            },
            {
                title: __('数据推送名称'),
                dataIndex: 'name',
                key: 'name',
                ellipsis: true,
                render: (value, record) => (
                    <span
                        className={classnames(styles.firstLine, styles.link)}
                        title={record.data_push_name}
                        onClick={() => {
                            rewriteUrl(
                                changeUrlData({
                                    operate: DataPushAction.Detail,
                                    dataPushId: record.data_push_id,
                                }),
                            )
                        }}
                    >
                        {record.data_push_name || '--'}
                    </span>
                ),
            },
            {
                title: __('类型'),
                dataIndex: 'audit_operation',
                key: 'audit_operation',
                ellipsis: true,
                render: (value, record) => auditTypeMap[value]?.text || '--',
            },
            {
                title: __('申请人'),
                dataIndex: 'applier_name',
                key: 'applier_name',
                ellipsis: true,
                render: (value, record) => value || '--',
            },
            {
                title: __('申请时间'),
                dataIndex: 'apply_time',
                key: 'apply_time',
                sorter: !!tableSort,
                sortOrder: tableSort?.created_at,
                showSorterTooltip: false,
                sortDirections: ['descend', 'ascend', 'descend'],
                width: 200,
                ellipsis: true,
                render: (value, record) => (value ? formatTime(value) : '--'),
            },

            {
                title: __('操作'),
                key: 'action',
                width: dataPushTabMap[menu].actionWidth,
                fixed: 'right',
                render: (_, record) => {
                    return (
                        <OptionBarTool
                            menus={getTableOptions(record) as any[]}
                            onClick={(key, e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (
                                    [
                                        DataPushAction.Delete,
                                        DataPushAction.Start,
                                        DataPushAction.Stop,
                                        DataPushAction.Recall,
                                    ].includes(key as DataPushAction)
                                ) {
                                    return
                                }
                                handleOptionTable(key, record)
                            }}
                        />
                    )
                },
            },
        ]
        return cols.filter((col) =>
            dataPushTabMap[menu].columnKeys.includes(col.key),
        )
    }, [menu, tableSort])

    const onChangeMenuToTableSort = (selectedMenu) => {
        switch (selectedMenu.key) {
            case 'created_at':
                setTableSort({
                    created_at:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    start_time: null,
                    end_time: null,
                    apply_time: null,
                })
                break
            case 'start_time':
                setTableSort({
                    created_at: null,
                    start_time:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    end_time: null,
                    apply_time: null,
                })
                break
            case 'end_time':
                setTableSort({
                    created_at: null,
                    start_time: null,
                    end_time:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    apply_time: null,
                })
                break
            case 'apply_time':
                setTableSort({
                    created_at: null,
                    start_time: null,
                    end_time: null,
                    apply_time:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                })
                break
            default:
                setTableSort({
                    created_at: null,
                    start_time: null,
                    end_time: null,
                    apply_time: null,
                })
                break
        }
    }

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition((prev) => ({
            ...prev,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            offset: 1,
        }))
        onChangeMenuToTableSort(selectedMenu)
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            if (sorter.columnKey === 'created_at') {
                setTableSort({
                    created_at: sorter.order || 'ascend',
                    start_time: null,
                    end_time: null,
                })
            } else if (sorter.columnKey === 'start_time') {
                setTableSort({
                    created_at: null,
                    start_time: sorter.order || 'ascend',
                    end_time: null,
                })
            } else {
                setTableSort({
                    created_at: null,
                    start_time: null,
                    end_time: sorter.order || 'ascend',
                })
            }
            return {
                key: sorter.columnKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }
        if (searchCondition.sort === 'created_at') {
            setTableSort({
                created_at:
                    searchCondition.direction === SortDirection.ASC
                        ? 'descend'
                        : 'ascend',
                start_time: null,
                end_time: null,
            })
        } else if (searchCondition.sort === 'start_time') {
            setTableSort({
                created_at: null,
                start_time:
                    searchCondition.direction === SortDirection.ASC
                        ? 'descend'
                        : 'ascend',
                end_time: null,
            })
        } else {
            setTableSort({
                created_at: null,
                start_time: null,
                end_time:
                    searchCondition.direction === SortDirection.ASC
                        ? 'descend'
                        : 'ascend',
            })
        }
        return {
            key: searchCondition.sort,
            sort:
                searchCondition.direction === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC,
        }
    }

    // 顶部左侧操作
    const leftOperate = (
        <div className={styles.leftOperate}>
            {/* 管理 */}
            {[DataPushTab.Manage].includes(menu as DataPushTab) && (
                <Button
                    type="primary"
                    onClick={() => handleOptionTable(DataPushAction.Create)}
                    className={styles['leftOperate-btn']}
                >
                    {__('新建')}
                </Button>
            )}

            {/* 监控 - 整体 */}
            {[DataPushTab.Monitor].includes(menu as DataPushTab) && (
                <span
                    className={styles['leftOperate-title']}
                    style={{ fontWeight: 550 }}
                >
                    {__('数据推送监控')}
                </span>
            )}

            {/* 审核 */}
            {[DataPushTab.Audit].includes(menu as DataPushTab) && (
                <span className={styles['leftOperate-title']}>
                    {__('数据推送待审核列表')}
                </span>
            )}
        </div>
    )

    // 顶部右侧操作
    const rightOperate = (
        <div className={styles.rightOperate}>
            {dataPushTabMap[menu].searchPlaceholder && (
                <SearchInput
                    value={searchCondition?.keyword}
                    style={{ width: 280 }}
                    placeholder={dataPushTabMap[menu].searchPlaceholder}
                    onKeyChange={(kw: string) => {
                        if (kw === searchCondition?.keyword) return
                        setSearchCondition((prev) => ({
                            ...prev,
                            keyword: kw,
                            offset: 1,
                        }))
                    }}
                />
            )}
            {dataPushTabMap[menu].searchFormData && (
                <LightweightSearch
                    ref={searchRef}
                    formData={dataPushTabMap[menu].searchFormData}
                    onChange={(data, key) => {
                        if (!key) {
                            // 重置
                            setSearchCondition((prev) => ({
                                ...prev,
                                offset: 1,
                                ...data,
                                start_time: undefined,
                                end_time: undefined,
                            }))
                        } else if (key === 'created_at') {
                            setSearchCondition((prev) => ({
                                ...prev,
                                current: 1,
                                start_time:
                                    data.created_at?.[0] &&
                                    moment(data.created_at[0]).valueOf(),
                                end_time:
                                    data.created_at?.[1] &&
                                    moment(data.created_at[1]).valueOf(),
                            }))
                        } else if (key === 'status') {
                            setSearchCondition((prev) => ({
                                ...prev,
                                offset: 1,
                                [key]: data[key].includes('2')
                                    ? `${data[key]},1`
                                    : data[key],
                            }))
                        } else {
                            setSearchCondition((prev) => ({
                                ...prev,
                                offset: 1,
                                ...data,
                            }))
                        }
                    }}
                    defaultValue={dataPushTabMap[menu].defaultSearch}
                />
            )}
            <span>
                {dataPushTabMap[menu].sortMenus && (
                    <SortBtn
                        contentNode={
                            <DropDownFilter
                                menus={dataPushTabMap[menu].sortMenus}
                                defaultMenu={dataPushTabMap[menu].defaultMenu}
                                menuChangeCb={handleMenuChange}
                                changeMenu={selectedSort}
                            />
                        }
                    />
                )}
                {dataPushTabMap[menu].refresh && (
                    <RefreshBtn onClick={() => handleRefresh()} />
                )}
            </span>
        </div>
    )

    const emptyContent =
        menu === DataPushTab.Manage ? (
            <div style={{ textAlign: 'center' }}>
                {__('暂无数据')}
                <br />
                {__('点击【新建】可新建数据推送')}
            </div>
        ) : (
            __('暂无数据')
        )

    const timeStrToTimestamp = (searchObj: any) => {
        const obj: any = {}
        const timeFields = [
            'finish_begin_time',
            'finish_end_time',
            'start_time',
            'end_time',
        ]
        Object.keys(searchObj)
            .filter((item) => item !== 'created_at')
            .forEach((key) => {
                if (Object.prototype.hasOwnProperty.call(searchObj, key)) {
                    obj[key] = searchObj[key]
                        ? timeFields.includes(key)
                            ? moment(searchObj[key]).valueOf()
                            : searchObj[key]
                        : undefined
                }
            })
        return obj
    }

    return (
        <div className={classnames(styles.dataPushTable)}>
            {loading ? (
                renderLoader()
            ) : (
                <>
                    {dataPushTabMap[menu].searchLayoutFormData ? (
                        <SearchLayout
                            formData={
                                dataPushTabMap[menu]
                                    .searchLayoutFormData as any[]
                            }
                            prefixNode={leftOperate}
                            onSearch={(data) => {
                                const obj = timeStrToTimestamp(data)
                                setSearchCondition((prev) => ({
                                    ...prev,
                                    ...obj,
                                    offset: 1,
                                }))
                            }}
                            suffixNode={
                                dataPushTabMap[menu].sortMenus ? (
                                    <SortBtn
                                        contentNode={
                                            <DropDownFilter
                                                menus={
                                                    dataPushTabMap[menu]
                                                        .sortMenus
                                                }
                                                defaultMenu={
                                                    dataPushTabMap[menu]
                                                        .defaultMenu
                                                }
                                                menuChangeCb={handleMenuChange}
                                                changeMenu={selectedSort}
                                            />
                                        }
                                    />
                                ) : undefined
                            }
                            getExpansionStatus={setSearchIsExpansion}
                        />
                    ) : (
                        menu !== DataPushTab.Overview && (
                            <div className={styles.top}>
                                {leftOperate}
                                {rightOperate}
                            </div>
                        )
                    )}
                    {isDataEmpty ? (
                        renderEmpty(36, 144, emptyContent)
                    ) : (
                        <>
                            <Table
                                columns={columns}
                                dataSource={tableData}
                                loading={fetching}
                                rowKey={dataPushTabMap[menu].rowKey}
                                rowClassName={styles.tableRow}
                                onChange={(
                                    currentPagination,
                                    filters,
                                    sorter,
                                ) => {
                                    const selectedMenu =
                                        handleTableChange(sorter)
                                    setSelectedSort(selectedMenu)
                                    setSearchCondition((prev) => ({
                                        ...prev,
                                        sort: selectedMenu.key,
                                        direction: selectedMenu.sort,
                                        offset: 1,
                                    }))
                                }}
                                scroll={{
                                    x: dataPushTabMap[menu].tableWidth,
                                    y: `calc(100vh - ${tableHeight}px)`,
                                }}
                                pagination={false}
                                locale={{
                                    emptyText: isSearchStatus ? (
                                        <Empty />
                                    ) : (
                                        renderEmpty()
                                    ),
                                }}
                            />
                            {menu !== DataPushTab.Overview && (
                                <ListPagination
                                    listType={ListType.WideList}
                                    queryParams={searchCondition}
                                    totalCount={total}
                                    onChange={(page, pageSize) => {
                                        setSearchCondition((prev) => ({
                                            ...prev,
                                            offset: page || 1,
                                            limit: pageSize,
                                        }))
                                    }}
                                    hideOnSinglePage={false}
                                    className={styles.pagination}
                                />
                            )}
                        </>
                    )}
                </>
            )}

            {/* 详情 */}
            <DataPushDrawer
                open={showDetails}
                onClose={(refresh) => {
                    setShowDetails(false)
                    rewriteUrl(changeUrlData({}, ['operate', 'dataPushId']))
                    if (refresh) {
                        handleRefresh(false)
                    }
                }}
            />

            {/* 审核 */}
            <AuditDrawer
                auditData={operateItem}
                open={showAuditModal}
                onClose={(refresh) => {
                    setShowAuditModal(false)
                    if (refresh) {
                        handleRefresh(false)
                    }
                }}
            />

            {/* 调度计划 */}
            <SchedulePlanModal
                datapushData={operateItem}
                open={showSchedulePlanModal}
                onClose={(refresh) => {
                    setShowSchedulePlanModal(false)
                    if (refresh) {
                        handleRefresh(false)
                    }
                }}
            />
        </div>
    )
}

export default DataPushTable
