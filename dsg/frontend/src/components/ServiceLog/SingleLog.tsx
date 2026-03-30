import { Table, Button, Modal, Select, DatePicker } from 'antd'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import { omit, debounce } from 'lodash'
import moment from 'moment'
import __ from './locale'
import {
    searchFormInitData,
    initSearch,
    defaultMenu,
    sortMenus,
    statusOptions,
} from './const'
import styles from './styles.module.less'
import { Empty } from '@/ui'
import { SortDirection, formatError, getMonitorList } from '@/core'
import {
    IMonitorListRes,
    MonitoringStatus,
} from '@/core/apis/dataApplicationService/index.d'
import { formatTime } from '@/utils'
import { StatusView, renderEmpty, renderLoader } from './helper'

const { RangePicker } = DatePicker

interface ISingleLog {
    // 接口服务id
    service_id: string
    // 是否打开
    open: boolean
    // 关闭回调
    onClose: () => void
}

const SingleLog: React.FC<ISingleLog> = ({
    service_id,
    open,
    onClose,
}): React.ReactElement => {
    // 搜索条件
    const [searchCondition, setSearchCondition] = useState<any>({})
    // 表头排序
    const [tableSort, setTableSort] = useState<any>({
        call_time: 'desc',
    })

    // load
    const [loading, setLoading] = useState<boolean>(true)
    const [fetching, setFetching] = useState<boolean>(true)

    // 表格数据
    const [tableData, setTableData] = useState<IMonitorListRes[]>([])
    // 总条数
    const [total, setTotal] = useState<number>(0)

    // 调用时间
    const [timeRange, setTimeRange] = useState<any>([])
    // 状态
    const [status, setStatus] = useState<MonitoringStatus>()

    // 初始化搜索条件
    useEffect(() => {
        setSearchCondition(initSearch)
    }, [])

    // 弹窗关闭时清空筛选与状态
    useEffect(() => {
        if (!open) {
            setTimeRange([])
            setStatus(undefined)
            setSearchCondition(initSearch)
        }
    }, [open])

    // 是否有过滤值
    const isSearchStatus = useMemo(() => {
        const ignoreAttr = ['offset', 'limit', 'sort', 'direction']
        return Object.values(omit(searchCondition, ignoreAttr))?.some(
            (item) => item,
        )
    }, [searchCondition])

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

            const res = await getMonitorList({ ...params, service_id })

            setTableData(res?.entries || [])
            setTotal(res?.total_count || 0)
        } catch (error) {
            formatError(error)
        } finally {
            setFetching(false)
            setLoading(false)
        }
    }

    const columns: any = useMemo(() => {
        const cols = [
            {
                title: __('接口服务名称'),
                dataIndex: 'service_name',
                key: 'service_name',
                ellipsis: true,
                render: (value, record) => value || '--',
            },
            {
                title: __('调用时间'),
                dataIndex: 'call_time',
                key: 'call_time',
                sorter: true,
                sortOrder: tableSort?.call_time,
                showSorterTooltip: false,
                sortDirections: ['descend', 'ascend', 'descend'],
                ellipsis: true,
                render: (value, record) => formatTime(value) || '--',
            },
            {
                title: __('调用时长'),
                dataIndex: 'call_duration',
                key: 'call_duration',
                ellipsis: true,
                render: (value, record) => value || '--',
            },
            {
                title: __('状态'),
                dataIndex: 'status',
                key: 'status',
                width: 80,
                ellipsis: true,
                render: (value, record) => {
                    return <StatusView record={record} />
                },
            },
        ]

        return cols
    }, [tableSort, searchCondition])

    // 表格排序改变
    const onTableChange = (sorter) => {
        const newSort = {
            call_time: null,
        }

        if (sorter.column) {
            const key = sorter.columnKey
            newSort[key] = sorter.order || 'ascend'
        }

        setTableSort(newSort)

        return {
            key: sorter?.columnKey,
            sort:
                sorter?.order === 'ascend'
                    ? SortDirection.ASC
                    : SortDirection.DESC,
        }
    }

    // 表格排序改变
    const handleTableChange = (currentPagination, filters, sorter, extra) => {
        const selectedMenu = onTableChange(sorter)
        setSearchCondition((prev) => ({
            ...prev,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            offset: currentPagination?.current || 1,
            limit: currentPagination?.pageSize || 10,
        }))
    }

    // 添加防抖处理
    const handleSearch = debounce(() => {
        let start_time = ''
        let end_time = ''
        if (timeRange && timeRange.length > 0) {
            start_time = moment(timeRange[0]).format('YYYY-MM-DD 00:00:00')
            end_time = moment(timeRange[1]).format('YYYY-MM-DD 23:59:59')
        }

        const params = {
            ...searchCondition,
            start_time,
            end_time,
            status,
            offset: 1,
        }

        setSearchCondition(params)
    }, 300)

    // 获取顶部操作区域
    const getTopOperate = () => {
        return (
            <div className={styles.topOperate}>
                <div>
                    <div className={styles.tipLabel}>{__('调用时间')}</div>
                    <RangePicker
                        className={styles.timeRangePicker}
                        value={timeRange}
                        onChange={(value) => setTimeRange(value || [])}
                    />
                </div>
                <div>
                    <div className={styles.tipLabel}>{__('状态')}</div>
                    <Select
                        allowClear
                        placeholder={__('请选择')}
                        options={statusOptions}
                        className={styles.statusSelect}
                        value={status}
                        onChange={(value) => setStatus(value)}
                    />
                </div>
                <div>
                    <div className={styles.tipLabel} />
                    <Button type="primary" onClick={handleSearch}>
                        {__('查询')}
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <Modal
            title={__('接口服务日志')}
            width={800}
            open={open}
            onCancel={onClose}
            footer={null}
            className={styles.singleLogModal}
        >
            {loading ? (
                renderLoader()
            ) : (
                <>
                    {getTopOperate()}
                    {tableData.length === 0 && !isSearchStatus ? (
                        renderEmpty()
                    ) : (
                        <Table
                            columns={columns}
                            dataSource={tableData}
                            loading={fetching}
                            rowKey="id"
                            onChange={handleTableChange}
                            scroll={{ y: `calc(100vh - 292px)` }}
                            pagination={{
                                total,
                                pageSize: searchCondition?.limit,
                                current: searchCondition?.offset,
                                showQuickJumper: true,
                                showSizeChanger: true,
                                showTotal: (count) =>
                                    __('共${count}条', { count }),
                            }}
                            locale={{ emptyText: <Empty /> }}
                        />
                    )}
                </>
            )}
        </Modal>
    )
}

export default SingleLog
