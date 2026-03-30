import React, { useEffect, useMemo, useState } from 'react'
import { Button, Modal, Pagination, Select, Space, Table, Tooltip } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import { SortOrder } from 'antd/lib/table/interface'
import { useDebounceFn, useUnmount } from 'ahooks'
import styles from './styles.module.less'
import {
    formatError,
    getDataProcessHistoryList,
    getDataSyncHistoryList,
    getDetailLogs,
    queryWorkFlowLogsList,
    SortDirection,
} from '@/core'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import { formatTime } from '@/utils'
import Loader from '@/ui/Loader'
import __ from './locale'
import { LabelSelect, RefreshBtn } from '@/components/ToolbarComponents'
import {
    ExecuteState,
    defaultLogsMenu,
    executeStateList,
    executeWayList,
} from './const'
import {
    StateLabel,
    changeExecuteType,
    formatTotalTime,
    formatWfTotalTime,
    handleExecuteWf,
    updateExecStatus,
} from './helper'
import { SyncSearchParams } from '@/core/apis/dataSync/index.d'
import LogsFailView from './LogsFailView'

/**
 * 查询参数
//  */
// interface IQueryParams {
//     current?: number
//     pageSize?: number
//     direction?: SortDirection
//     keyword?: string
//     sort?: string
//     scheduleExecute?: string
//     status?: string
//     rate?: number
// }

// 初始params
const initialQueryParams: SyncSearchParams = {
    offset: 1,
    limit: 10,
    direction: defaultLogsMenu.sort,
    sort: defaultLogsMenu.key,
    model_uuid: '',
    step: 'INSERT',
}

/**
 * 日志列表
 * @param pageType 页面模式
 * @param id 数据id
 */
const LogsList: React.FC<{
    pageType: 'whole' | 'inlay' | 'graph'
    model: 'sync' | 'proc' | 'wf'
    id?: string
    dataInfo?: any
    hi: number
    pageSize?: number
    isNeedUpdate?: boolean
}> = ({
    pageType,
    model,
    id,
    dataInfo,
    hi,
    pageSize = 10,
    isNeedUpdate = false,
}) => {
    const [loading, setLoading] = useState(true)
    const [fetching, setFetching] = useState(false)
    const [failVisible, setFailVisible] = useState(false)
    const [errorDetailVisible, setErrorDetailVisible] = useState<boolean>(false)
    const [errorDetail, setErrorDetail] = useState<string>('')
    // 总数
    const [total, setTotal] = useState(0)
    // 日志列表
    const [items, setItems] = useState<any[]>([])
    // 操作的日志
    const [operateItem, setOperateItem] = useState<any>()
    // 筛选值
    const [selectValue, setSelectValue] = useState<string>('')
    const [wayValue, setWayValue] = useState<string>('')
    // 创建表头排序
    const [createSortOrder, setCreateSortOrder] = useState<SortOrder>('descend')
    // 查询params
    const [queryParams, setQueryParams] = useState<any>()
    // 执行中
    const [executing, setExecuting] = useState(false)
    // 排序params
    const [sortDire, setSortDire] = useState<any>({
        direction: defaultLogsMenu.sort,
        sort: defaultLogsMenu.key,
    })
    const [listInterval, setListInterval] = useState<any>()

    // 显示/隐藏搜索框
    const showSearch = useMemo(
        () =>
            fetching ||
            selectValue !== '' ||
            wayValue !== '' ||
            items.length > 0,
        [fetching, selectValue, wayValue, items],
    )

    useEffect(() => {
        setLoading(true)
        setSelectValue('')
        setWayValue('')
        setCreateSortOrder('descend')
        setQueryParams({
            ...initialQueryParams,
            limit: pageSize,
        })
    }, [id])

    // useEffect(() => {
    //     if (isNeedUpdate) {
    //         getList(queryParams)
    //     }
    // }, [isNeedUpdate])

    useEffect(() => {
        getList(queryParams)
    }, [queryParams])

    useUnmount(() => {
        if (listInterval) {
            clearInterval(listInterval)
        }
    })

    // 获取表单列表
    const getList = async (params) => {
        if (items.length === 0) {
            setLoading(true)
        }
        if (!id || !params) {
            setLoading(false)
            return
        }
        clearInterval(listInterval)
        const request = async () => {
            try {
                setFetching(true)
                let res
                if (model === 'sync') {
                    res = await getDataSyncHistoryList({
                        ...params,
                        model_uuid: id,
                    })
                } else if (model === 'proc') {
                    res = await getDataProcessHistoryList({
                        ...params,
                        model_uuid: id,
                    })
                } else {
                    res = await queryWorkFlowLogsList({
                        ...params,
                        process_uuid: id,
                    })
                }
                const { data } = res
                const { current_page, total_list, total_page, ...rest } = data
                setTotal(rest.total || 0)
                setItems(total_list || [])
            } catch (e) {
                formatError(e)
                setTotal(0)
                setItems([])
            } finally {
                setLoading(false)
                setFetching(false)
            }
        }
        await request()
        const interval = setInterval(request, 5000)
        setListInterval(interval)
    }

    // 状态筛选
    const handleSelectChange = (value: string) => {
        setSelectValue(value)
        setQueryParams({ ...queryParams, offset: 1, status: value })
    }

    // 方式筛选
    const handleWayChange = (value: string) => {
        setWayValue(value)
        setQueryParams({ ...queryParams, offset: 1, scheduleExecute: value })
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        let sortFields = {}
        if (sorter.column) {
            setCreateSortOrder(null)
            if (sorter.columnKey === 'start_time') {
                setCreateSortOrder(sorter.order || 'ascend')
            }
            sortFields = {
                direction:
                    sorter.order === 'descend'
                        ? SortDirection.DESC
                        : SortDirection.ASC,
                sort: sorter.columnKey,
            }
        } else {
            sortFields = sortDire
            if (sortDire.sort === 'start_time') {
                setCreateSortOrder('ascend')
                sortFields = { ...sortDire, direction: SortDirection.ASC }
            }
        }
        setSortDire(sortFields)
        setQueryParams({
            ...queryParams,
            sort: sorter.columnKey,
            direction:
                sorter.order === 'descend'
                    ? SortDirection.DESC
                    : SortDirection.ASC,
            offset: 1,
        })
    }

    // 执行工作流
    const handleExecute = async () => {
        if (id) {
            setExecuting(true)
            await handleExecuteWf(id!, model)
            updateExecStatus(id, model, () => {
                setExecuting(false)
            })
        }

        setTimeout(() => {
            getList({ ...queryParams })
        }, 1000)
    }
    const { run: debounceExecute } = useDebounceFn(handleExecute, {
        wait: 2000,
        leading: true,
        trailing: false,
    })

    // 业务表格项
    const columns: ColumnsType<any> = [
        {
            title: __('执行状态'),
            dataIndex: 'status',
            key: 'status',
            render: (value, record) => (
                <div className={styles.nameWrap}>
                    <StateLabel type={changeExecuteType(record.status)} />
                    {record.status === ExecuteState.FAIL && (
                        <span
                            onClick={async () => {
                                if (model === 'wf') {
                                    setOperateItem(record)
                                    setFailVisible(true)
                                    return
                                }
                                try {
                                    const { data } = await getDetailLogs({
                                        subProcessTaskInstanceId:
                                            record.step_id,
                                    })
                                    setErrorDetail(data?.message || '')
                                    setErrorDetailVisible(true)
                                } catch (ex) {
                                    formatError(ex)
                                }
                            }}
                            style={{
                                color: '#126ee3',
                                cursor: 'pointer',
                                marginLeft: 8,
                            }}
                        >
                            {__('详情')}
                        </span>
                    )}
                </div>
            ),
        },
        {
            title: __('数据条数'),
            dataIndex: 'sync_count',
            key: 'sync_count',
            render: (value) => value || '--',
        },
        {
            title: __('执行方式'),
            dataIndex: 'sync_method',
            key: 'sync_method',
            render: (value) => value || '--',
        },
        {
            title: __('总时长'),
            dataIndex: 'sync_time',
            key: 'sync_time',
            render: (value) =>
                value
                    ? model === 'wf'
                        ? formatWfTotalTime(value)
                        : formatTotalTime(Number(value))
                    : '--',
        },
        {
            title: __('开始时间'),
            dataIndex: 'start_time',
            key: 'start_time',
            sorter: true,
            sortOrder: createSortOrder,
            showSorterTooltip: false,
            render: (value) =>
                value ? formatTime(value) : value === 0 ? `0${__('秒')}` : '--',
        },
        {
            title: __('结束时间'),
            dataIndex: 'end_time',
            key: 'end_time',
            render: (value) => (value ? formatTime(value) : '--'),
        },
    ]

    return (
        <div
            className={styles.logsListWrap}
            style={{ padding: pageType === 'whole' ? '10px 20px 16px' : 0 }}
        >
            <div className={styles.topWrap}>
                <div className={styles.topLeftWrap}>
                    <div className={styles.title} hidden={pageType !== 'whole'}>
                        {model === 'wf'
                            ? __('日志')
                            : model === 'sync'
                            ? __('同步日志')
                            : __('加工日志')}
                    </div>
                    <Button
                        type={pageType === 'graph' ? 'default' : 'primary'}
                        onClick={debounceExecute}
                        hidden={pageType === 'whole'}
                        disabled={dataInfo?.node_count === 0}
                        loading={executing}
                    >
                        {__('立即执行')}
                    </Button>
                </div>
                <Space
                    size={12}
                    className={styles.topRightWrap}
                    hidden={loading || !showSearch}
                >
                    <LabelSelect
                        contentNode={
                            <Select
                                onChange={handleWayChange}
                                value={wayValue}
                                optionLabelProp="label"
                                getPopupContainer={(node) => node.parentNode}
                                notFoundContent={__('暂无数据')}
                            >
                                {executeWayList.map((item: any) => (
                                    <Select.Option
                                        value={item.value}
                                        key={item.value}
                                        title={item.label}
                                        label={
                                            <span>
                                                <span>{__('执行方式')}：</span>
                                                {item.label}
                                            </span>
                                        }
                                    >
                                        {item.label}
                                    </Select.Option>
                                ))}
                            </Select>
                        }
                    />
                    <LabelSelect
                        contentNode={
                            <Select
                                onChange={handleSelectChange}
                                value={selectValue}
                                optionLabelProp="label"
                                getPopupContainer={(node) => node.parentNode}
                            >
                                {executeStateList.map((item: any) => (
                                    <Select.Option
                                        value={item.value}
                                        key={item.value}
                                        title={item.label}
                                        label={
                                            <span>
                                                <span>{__('执行状态')}：</span>
                                                {item.label}
                                            </span>
                                        }
                                    >
                                        {item.label}
                                    </Select.Option>
                                ))}
                            </Select>
                        }
                    />
                    <RefreshBtn
                        onClick={() =>
                            setQueryParams({
                                ...queryParams,
                                offset: 1,
                            })
                        }
                    />
                </Space>
            </div>
            <div className={styles.split} hidden={pageType !== 'whole'} />
            <div className={styles.bottomWrap}>
                {loading ? (
                    <Loader />
                ) : showSearch ? (
                    <>
                        <Table
                            columns={
                                model === 'wf'
                                    ? columns.filter(
                                          (currentColumns) =>
                                              currentColumns.key !==
                                              'sync_count',
                                      )
                                    : columns
                            }
                            dataSource={items}
                            // loading={fetching}
                            pagination={{ position: [] }}
                            onChange={(pagination, filter, sorter) =>
                                handleTableChange(sorter)
                            }
                            scroll={{
                                y:
                                    items.length > 0
                                        ? total > pageSize
                                            ? `calc(100vh - ${hi + 48}px)`
                                            : `calc(100vh - ${hi}px)`
                                        : undefined,
                            }}
                            locale={{
                                emptyText: <Empty />,
                            }}
                        />
                        <Pagination
                            current={queryParams.offset}
                            pageSize={queryParams.limit}
                            onChange={(page) => {
                                setQueryParams({ ...queryParams, offset: page })
                            }}
                            className={styles.pagination}
                            total={total}
                            showSizeChanger={false}
                            hideOnSinglePage
                        />
                    </>
                ) : (
                    <div className={styles.empty}>
                        <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                    </div>
                )}
            </div>
            <LogsFailView
                visible={failVisible}
                id={id}
                data={operateItem}
                onClose={() => {
                    setFailVisible(false)
                    setOperateItem(undefined)
                }}
            />
            <Modal
                title={__('失败详情')}
                width={640}
                open={errorDetailVisible}
                footer={null}
                onCancel={() => {
                    setErrorDetailVisible(false)
                }}
                destroyOnClose
                getContainer={false}
                bodyStyle={{
                    padding: '24px',
                    maxHeight: 545,
                    minHeight: 320,
                }}
            >
                <div
                    style={{
                        maxHeight: '470px',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                    }}
                >
                    {errorDetail}
                </div>
            </Modal>
        </div>
    )
}

export default LogsList
