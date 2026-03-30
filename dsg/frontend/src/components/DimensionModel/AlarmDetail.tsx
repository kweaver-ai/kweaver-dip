import { Drawer, Table, Tooltip } from 'antd'
import React, { useEffect, useState, useMemo } from 'react'
import { isNumber } from 'lodash'
import __ from './locale'
import { formatError, getDimensionModelAlarm, SortDirection } from '@/core'
import dataEmpty from '@/assets/dataEmpty.svg'
import { Empty, Loader } from '@/ui'

import styles from './styles.module.less'
import { formatTime } from '@/utils'

// 告警类型枚举
enum AlarmType {
    FACT_TABLE = 0, // 事实表
    DIMENSION_TABLE = 1, // 维度表
    FACT_FIELD = 2, // 维度字段（事实表中字段）
    DIMENSION_FIELD = 3, // 关联字段（维度表中字段）
}

// 告警原因枚举
enum AlarmReason {
    DELETED = 0, // 被删除
    TYPE_CHANGED = 1, // 数据类型变更
}

interface IAlarmDetailProps {
    open: boolean
    id?: string
    onClose: () => void
}

interface AlarmItem {
    id: string
    alarm_type: number
    alarm_table: string
    technical_name: string
    alarm_reason: number
    created_at?: number
    updated_at?: number
}

function AlarmDetail({ open, id, onClose }: IAlarmDetailProps) {
    const [alarms, setAlarms] = useState<AlarmItem[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    })
    const [sortParams, setSortParams] = useState<{
        sort?: string
        direction?: SortDirection
    }>({})

    // 获取告警类型名称
    const getAlarmTypeName = (alarmType: number): string => {
        switch (alarmType) {
            case AlarmType.FACT_TABLE:
                return __('事实表')
            case AlarmType.DIMENSION_TABLE:
                return __('维度表')
            case AlarmType.FACT_FIELD:
                return __('维度字段')
            case AlarmType.DIMENSION_FIELD:
                return __('关联字段')
            default:
                return ''
        }
    }

    // 获取告警原因描述
    const getAlarmReasonText = (
        alarmType: number,
        alarmReason: number,
        alarmTable: string,
        technicalName: string,
    ): string => {
        const typeName = getAlarmTypeName(alarmType)

        if (alarmReason === AlarmReason.DELETED) {
            return `${typeName}被删除`
        }
        if (alarmReason === AlarmReason.TYPE_CHANGED) {
            return `${typeName}异常`
        }

        return ''
    }

    // 获取告警数据
    const getAlarms = async (pageNum: number = 1) => {
        await getAlarmsWithSort(pageNum, sortParams)
    }

    useEffect(() => {
        if (open && id) {
            getAlarms(1)
        } else {
            setAlarms([])
            setPagination((prev) => ({ ...prev, current: 1, total: 0 }))
            setSortParams({})
        }
    }, [open, id])

    // 处理表格排序
    const handleTableChange = (
        paginationInfo: any,
        filters: any,
        sorter: any,
    ) => {
        const { current } = paginationInfo
        let newSortParams = {}

        if (sorter.columnKey === 'alarm_time' && sorter.order) {
            newSortParams = {
                sort: 'alarm_time',
                direction:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }

        // 更新排序参数
        setSortParams(newSortParams)
        setPagination((prev) => ({ ...prev, current }))

        // 立即请求新数据
        getAlarmsWithSort(current, newSortParams)
    }

    // 带排序参数的数据请求
    const getAlarmsWithSort = async (
        pageNum: number = 1,
        sortParamsOverride: any = null,
    ) => {
        if (!id) return

        try {
            setLoading(true)
            const currentSortParams = sortParamsOverride || sortParams
            const res = await getDimensionModelAlarm({
                model_id: id,
                offset: pageNum,
                limit: pagination.pageSize,
                sort: currentSortParams.sort,
                direction: currentSortParams.direction,
            })

            setAlarms(res?.entries || [])
            setPagination((prev) => ({
                ...prev,
                current: pageNum,
                total: res?.total_count || 0,
            }))
        } catch (error) {
            formatError(error)
            setAlarms([])
            setPagination((prev) => ({ ...prev, total: 0 }))
        } finally {
            setLoading(false)
        }
    }

    // 处理分页变化
    const handlePaginationChange = (page: number) => {
        getAlarmsWithSort(page)
    }

    const columns = [
        {
            title: __('告警时间'),
            dataIndex: 'alarm_time',
            key: 'alarm_time',
            width: 180,
            sorter: true,
            sortOrder:
                sortParams.sort === 'alarm_time'
                    ? sortParams.direction === SortDirection.ASC
                        ? 'ascend'
                        : 'descend'
                    : null,
            render: (value) => {
                return value || '--'
            },
        },
        {
            title: __('告警原因'),
            key: 'alarm_reason',
            render: (record: AlarmItem) => {
                const reasonText = getAlarmReasonText(
                    record.alarm_type,
                    record.alarm_reason,
                    record.alarm_table,
                    record.technical_name,
                )

                return (
                    <Tooltip title={reasonText} placement="topLeft">
                        <span>{reasonText}</span>
                    </Tooltip>
                )
            },
        },
    ]

    const tablePagination = useMemo(
        () => ({
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: false,
            hideOnSinglePage: true,
            onChange: handlePaginationChange,
            showTotal: (total: number, range: [number, number]) =>
                `共 ${total} 条`,
        }),
        [pagination],
    )

    return (
        <Drawer
            title={__('异常告警')}
            placement="right"
            onClose={onClose}
            open={open}
            width={400}
            maskClosable={false}
            destroyOnClose
        >
            <div className={styles.alarmDetailContainer}>
                {!alarms?.length && !loading ? (
                    <div className={styles.tableEmpty}>
                        <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                    </div>
                ) : (
                    <Table
                        dataSource={alarms}
                        columns={columns as any}
                        rowKey="id"
                        loading={loading}
                        rowClassName={styles['alarm-table-row']}
                        pagination={tablePagination}
                        onChange={handleTableChange}
                        scroll={{ y: 'calc(100vh - 100px)' }}
                    />
                )}
            </div>
        </Drawer>
    )
}

export default AlarmDetail
