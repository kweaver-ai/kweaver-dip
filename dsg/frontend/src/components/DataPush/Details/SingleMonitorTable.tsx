import { Button, Space, Table, Tooltip } from 'antd'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDebounceFn, useUnmount, useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import { omit } from 'lodash'
import moment from 'moment'
import __ from '../locale'
import {
    DataPushTab,
    DataPushAction,
    jobStatusMap,
    DataPushStatus,
    JobStatus,
} from '../const'
import styles from './styles.module.less'
import {
    Empty,
    LightweightSearch,
    ListPagination,
    ListType,
    OptionMenuType,
} from '@/ui'
import {
    SortDirection,
    executeDataPush,
    formatError,
    getDataPushScheduleList,
} from '@/core'
import { formatTime } from '@/utils'
import {
    StatusDot,
    dataPushTabMap,
    renderEmpty,
    renderLoader,
    formatTotalTime,
} from '../helper'
import DropDownFilter from '@/components/DropDownFilter'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import JobDetails from './JobDetails'

const SingleMonitorTable: React.FC<{
    dataPushData?: any // 数据推送数据
}> = ({ dataPushData }) => {
    const menu = DataPushTab.MonitorSingle

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

    // load
    const [loading, setLoading] = useState<boolean>(false)
    const [fetching, setFetching] = useState<boolean>(true)
    // 弹窗显示
    const [showDetails, setShowDetails] = useState(false)

    // 正在执行
    const [executeLoading, setExecuteLoading] = useState<boolean>(false)
    // 执行定时器
    const executeTimer = useRef<any>()
    // 执行开始时间
    const executeStartTime = useRef<number>(0)
    // 下一次执行时间
    const [nextExecuteTime, setNextExecuteTime] = useState<number>(0)

    // 表格数据
    const [tableData, setTableData] = useState<any[]>([])
    // 总条数
    const [total, setTotal] = useState<number>(0)
    // 是否为空
    const [isEmpty, setIsEmpty] = useState<boolean>(false)
    // 当前操作项
    const [operateItem, setOperateItem] = useState<any>()
    // 第一次获取数据
    const [firstFetch, setFirstFetch] = useState<boolean>(true)

    useEffect(() => {
        if (dataPushData?.id) {
            setLoading(true)
            const config = dataPushTabMap[menu]
            const initSearch = {
                limit: 10,
                offset: 1,
                sort: config.defaultMenu?.key,
                direction: config.defaultMenu?.sort,
                step: 'INSERT',
                model_uuid: dataPushData?.id,
            }
            setSearchCondition(initSearch)
            setSelectedSort(dataPushTabMap[menu].defaultMenu)
            setTableSort(dataPushTabMap[menu].defaultTableSort)
            // getLatestExecuteData()
        }
    }, [dataPushData?.id])

    useUnmount(() => {
        clearTimeout(executeTimer.current)
    })

    // 是否有过滤值
    const isSearchStatus = useMemo(() => {
        const ignoreAttr = [
            'offset',
            'limit',
            'sort',
            'direction',
            'model_uuid',
            'step',
        ]
        return Object.values(omit(searchCondition, ignoreAttr)).some(
            (item) => item,
        )
    }, [searchCondition])

    useMemo(() => {
        if (!loading && total === 0) {
            setIsEmpty(true)
        } else {
            setIsEmpty(false)
        }
    }, [loading])

    // 根据条件请求数据
    useUpdateEffect(() => {
        if (searchCondition) {
            getTableList({ ...searchCondition })
        }
    }, [searchCondition])

    // 获取表格数据
    const getTableList = async (params: any) => {
        try {
            setFetching(true)
            const { entries, total_count, next_execute } =
                await getDataPushScheduleList(params)
            setNextExecuteTime(next_execute)
            setTableData(entries || [])
            setTotal(total_count || 0)
            if (firstFetch) {
                setFirstFetch(false)
                if (entries?.[0]) {
                    if (
                        ![JobStatus.Completed, JobStatus.Exception].includes(
                            entries?.[0]?.status as JobStatus,
                        )
                    ) {
                        setExecuteLoading(true)
                        installSyncTimer()
                    } else {
                        executeTimer.current = null
                        setExecuteLoading(false)
                    }
                }
            } else if (next_execute > 0 && next_execute <= Date.now()) {
                setExecuteLoading(true)
                installSyncTimer()
            }
        } catch (error) {
            formatError(error)
        } finally {
            setFetching(false)
            setLoading(false)
            setSelectedSort(undefined)
        }
    }

    // 刷新
    const handleRefresh = (refresh: boolean = true) => {
        setSearchCondition({
            ...searchCondition,
            offset: refresh ? 1 : searchCondition.offset,
        })
    }

    // 查询最新一条执行任务
    const getLatestExecuteData = async () => {
        try {
            const { entries, total_count } = await getDataPushScheduleList({
                limit: 1,
                model_uuid: dataPushData?.id,
                step: 'INSERT',
                sort: 'start_time',
                direction: SortDirection.DESC,
            })
            const [first] = entries || []
            if (first) {
                if (
                    ![JobStatus.Completed, JobStatus.Exception].includes(
                        first.status as JobStatus,
                    )
                ) {
                    setExecuteLoading(true)
                    installSyncTimer()
                } else {
                    executeTimer.current = null
                    setExecuteLoading(false)
                    executeStartTime.current = 0
                    handleRefresh()
                }
            }
        } catch (error) {
            // formatError(error)
            installSyncTimer()
        }
    }

    // 立即执行
    const { run: onToExecuteData } = useDebounceFn(
        async () => {
            try {
                setExecuteLoading(true)
                executeStartTime.current = Date.now()
                await executeDataPush(dataPushData?.id)
                installSyncTimer()
            } catch (err) {
                formatError(err)
                executeStartTime.current = 0
                setExecuteLoading(false)
            }
        },
        {
            wait: 400,
            leading: true,
            trailing: false,
        },
    )

    // 设置定时器，5秒轮询获取结果
    const installSyncTimer = () => {
        executeTimer.current = setTimeout(getLatestExecuteData, 5000)
    }

    // 表格操作事件
    const handleOptionTable = (key: string, record?: any) => {
        setOperateItem(record)
        switch (key) {
            case DataPushAction.Detail:
                setShowDetails(true)
                break
            default:
                break
        }
    }

    // 表格操作项
    const getTableOptions = () => {
        const optionMenus = [
            {
                key: DataPushAction.Detail,
                label: __('详情'),
                menuType: OptionMenuType.Menu,
            },
        ]
        return optionMenus
    }

    const columns: any = [
        {
            title: __('序号'),
            dataIndex: 'step_id',
            key: 'step_id',
            ellipsis: true,
            render: (value, record) => value || '--',
        },
        {
            title: __('状态'),
            dataIndex: 'status',
            key: 'status',
            ellipsis: true,
            render: (value, record) => (
                <StatusDot
                    data={jobStatusMap[value]}
                    tip={record?.error_message}
                />
            ),
        },
        {
            title: __('执行方式'),
            dataIndex: 'sync_method',
            key: 'sync_method',
            ellipsis: true,
            render: (value, record) =>
                value === '手动' ? __('手动') : __('自动'),
        },
        {
            title: __('耗时'),
            dataIndex: 'sync_time',
            key: 'sync_time',
            ellipsis: true,
            render: (value) => (value ? formatTotalTime(Number(value)) : '--'),
        },
        {
            title: __('请求时间'),
            dataIndex: 'start_time',
            key: 'start_time',
            sorter: !!tableSort,
            sortOrder: tableSort?.start_time,
            showSorterTooltip: false,
            sortDirections: ['descend', 'ascend', 'descend'],
            ellipsis: true,
            render: (value) => value || '--',
        },
        {
            title: __('完成时间'),
            dataIndex: 'end_time',
            key: 'end_time',
            ellipsis: true,
            render: (value) => value || '--',
        },
        {
            title: __('推送总数'),
            dataIndex: 'sync_count',
            key: 'sync_count',
            ellipsis: true,
            render: (value, record) => value || '--',
        },
        // {
        //     title: __('操作'),
        //     key: 'action',
        //     width: dataPushTabMap[menu].actionWidth,
        //     fixed: 'right',
        //     render: (_, record) => {
        //         return (
        //             <OptionBarTool
        //                 menus={getTableOptions()}
        //                 onClick={(key, e) => {
        //                     e.preventDefault()
        //                     e.stopPropagation()
        //                     handleOptionTable(key, record)
        //                 }}
        //             />
        //         )
        //     },
        // },
    ]

    const onChangeMenuToTableSort = (selectedMenu) => {
        switch (selectedMenu.key) {
            case 'start_time':
                setTableSort({
                    start_time:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                })
                break
            default:
                setTableSort({
                    start_time: null,
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
            if (sorter.columnKey === 'start_time') {
                setTableSort({
                    start_time: sorter.order || 'ascend',
                })
            } else {
                setTableSort({
                    start_time: null,
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
        if (searchCondition.sort === 'start_time') {
            setTableSort({
                start_time:
                    searchCondition.direction === SortDirection.ASC
                        ? 'descend'
                        : 'ascend',
            })
        } else {
            setTableSort({
                start_time: null,
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

    // 是否显示立即执行
    const showExecute = useMemo(
        () =>
            ![
                DataPushStatus.Pending,
                DataPushStatus.Ended,
                DataPushStatus.Stopped,
            ].includes(dataPushData?.push_status) &&
            !dataPushData?.auto_execute,
        [dataPushData],
    )

    const handleToExecute = async () => {
        if (isEmpty) {
            setLoading(true)
        }
        await onToExecuteData()
    }

    // 顶部左侧操作
    const leftOperate = (
        <div className={styles.leftOperate}>
            {/* 监控 - 单个 */}
            {showExecute && (
                <Tooltip
                    title={
                        executeLoading
                            ? __('当前数据推送作业正在执行，暂时无法再次执行')
                            : ''
                    }
                    placement="topRight"
                    arrowPointAtCenter
                >
                    <Button
                        type="primary"
                        onClick={handleToExecute}
                        className={styles['leftOperate-btn']}
                        disabled={executeLoading}
                        loading={executeLoading}
                    >
                        {__('立即执行')}
                    </Button>
                </Tooltip>
            )}
            {showExecute && (
                <span className={styles.time}>
                    {__('下次执行时间：${time}', {
                        time:
                            nextExecuteTime > 0
                                ? formatTime(nextExecuteTime)
                                : '--',
                    })}
                </span>
            )}
        </div>
    )

    // 顶部右侧操作
    const rightOperate = (
        <div className={styles.rightOperate}>
            <Space size={8}>
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
                                }))
                            } else {
                                setSearchCondition((prev) => ({
                                    ...prev,
                                    offset: 1,
                                    [key]: data[key],
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
                                    defaultMenu={
                                        dataPushTabMap[menu].defaultMenu
                                    }
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
            </Space>
        </div>
    )

    const emptyContent = (
        <div style={{ textAlign: 'center' }}>
            <p>
                {__('暂未产生作业记录')}
                <br />
                {showExecute &&
                    __('下次执行时间：${time}', {
                        time:
                            nextExecuteTime > 0
                                ? formatTime(nextExecuteTime)
                                : '--',
                    })}
            </p>
            {showExecute && (
                <Tooltip
                    title={
                        executeLoading
                            ? __('当前数据推送作业正在执行，暂时无法再次执行')
                            : ''
                    }
                >
                    <Button
                        type="primary"
                        onClick={handleToExecute}
                        loading={executeLoading}
                    >
                        {__('立即执行')}
                    </Button>
                </Tooltip>
            )}
        </div>
    )

    return (
        <div className={classnames(styles.singleMonitorTable)}>
            {loading ? (
                renderLoader(132)
            ) : isEmpty ? (
                renderEmpty(64, 144, emptyContent)
            ) : (
                <>
                    <div className={styles.top}>
                        {leftOperate}
                        {rightOperate}
                    </div>
                    <Table
                        columns={columns}
                        dataSource={tableData}
                        loading={fetching}
                        rowKey="step_id"
                        rowClassName={styles.tableRow}
                        onChange={(currentPagination, filters, sorter) => {
                            const selectedMenu = handleTableChange(sorter)
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
                            y: `calc(100vh - 285px)`,
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
                </>
            )}
            <JobDetails
                jobData={operateItem}
                open={showDetails}
                onClose={() => setShowDetails(false)}
            />
        </div>
    )
}

export default SingleMonitorTable
