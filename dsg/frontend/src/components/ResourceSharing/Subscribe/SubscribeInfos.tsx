import React, { useState, useEffect, useMemo } from 'react'
import { Drawer, DrawerProps, Tabs, Table } from 'antd'
import __ from '../locale'
import DetailsGroup from '../Details/DetailsGroup'
import { subscribeDetailMap } from './const'
import { ApplyResource } from '../const'
import styles from './styles.module.less'
import { formatTime } from '@/utils'
import {
    IExchangeRecord,
    IShareApplySubInfo,
    formatError,
    getShareApplyExchangeRecord,
    getShareApplySubInfo,
} from '@/core'
import { renderEmpty, renderLoader } from '../helper'

enum TabType {
    // 订阅信息
    Info = 'info',
    // 同步记录
    Record = 'record',
}

interface ISubscribeInfos extends DrawerProps {
    applyId?: string
    open: boolean
}

/**
 * 订阅信息
 */
const SubscribeInfos = ({ applyId, open, ...props }: ISubscribeInfos) => {
    const [actionKey, setActionKey] = useState<string>(TabType.Info)
    // 初始化 load
    const [loading, setLoading] = useState<boolean>(true)
    // 记录数据 load
    const [fetching, setFetching] = useState<boolean>(true)

    // 详情数据
    const [detailsData, setDetailsData] = useState<IShareApplySubInfo>()
    // 表格数据
    const [tableData, setTableData] = useState<IExchangeRecord[]>([])
    // 总条数
    const [total, setTotal] = useState<number>(0)
    // 分页
    const [current, setCurrent] = useState<number>(1)

    // 资源类型
    const rsrc = useMemo(() => detailsData?.resource_type || '', [detailsData])

    useEffect(() => {
        if (open && applyId) {
            setLoading(true)
            getDetails()
        } else {
            setActionKey(TabType.Info)
            setDetailsData(undefined)
            setTableData([])
            setTotal(0)
            setCurrent(1)
        }
    }, [open])

    useEffect(() => {
        getSyncData()
    }, [rsrc])

    // 获取信息
    const getDetails = async () => {
        try {
            const res = await getShareApplySubInfo(applyId!)
            setDetailsData(res)
        } catch (error) {
            formatError(error)
            setLoading(false)
        }
    }

    // 获取同步记录
    const getSyncData = async () => {
        if (!applyId || rsrc !== ApplyResource.Database) {
            setLoading(false)
            return
        }
        try {
            setFetching(true)
            const res = await getShareApplyExchangeRecord(applyId)
            setTableData(res?.entries || [])
            setTotal(res?.entries?.length || 0)
        } catch (error) {
            formatError(error)
        } finally {
            setFetching(false)
            setLoading(false)
        }
    }

    // 库表类型显示的 tab
    const tabItems = [
        {
            label: __('订阅信息'),
            key: TabType.Info,
            children: '',
        },
        {
            label: __('同步记录'),
            key: TabType.Record,
            children: '',
        },
    ]

    const columns: any = [
        {
            title: __('数据条数'),
            dataIndex: 'output_lines',
            key: 'output_lines',
            ellipsis: true,
            render: (value, record) => value || 0,
        },
        {
            title: __('任务开始时间'),
            dataIndex: 'start_time',
            key: 'start_time',
            defaultSortOrder: 'descend',
            sortDirections: ['descend', 'ascend', 'descend'],
            sorter: (a, b) => a.start_time - b.start_time,
            showSorterTooltip: false,
            ellipsis: true,
            render: (val: number) => (val ? formatTime(val) : '--'),
        },
        {
            title: __('任务结束时间'),
            dataIndex: 'stop_time',
            key: 'stop_time',
            showSorterTooltip: false,
            sortDirections: ['descend', 'ascend', 'descend'],
            sorter: (a, b) => a.stop_time - b.stop_time,
            ellipsis: true,
            render: (val: number) => (val ? formatTime(val) : '--'),
        },
    ]

    return (
        <Drawer
            width={640}
            open={open}
            title={__('订阅信息')}
            maskClosable={false}
            destroyOnClose
            placement="right"
            bodyStyle={{ padding: 0 }}
            {...props}
        >
            <div className={styles.subscribeDetails}>
                {loading ? (
                    renderLoader()
                ) : !detailsData ? (
                    renderEmpty()
                ) : (
                    <>
                        {rsrc === ApplyResource.Database && (
                            <Tabs
                                activeKey={actionKey}
                                onChange={(key) => setActionKey(key)}
                                items={tabItems}
                                className={styles['subscribeDetails-tabs']}
                            />
                        )}
                        {actionKey === TabType.Info &&
                            subscribeDetailMap[rsrc]?.map((group, idx) => (
                                <div key={idx} className={styles.groupItem}>
                                    <div className={styles.title}>
                                        {group.title}
                                    </div>
                                    <DetailsGroup
                                        config={group.content}
                                        data={detailsData}
                                    />
                                </div>
                            ))}
                        {actionKey === TabType.Record &&
                            (tableData.length > 0 ? (
                                <div className={styles.table}>
                                    <Table
                                        columns={columns}
                                        dataSource={tableData}
                                        loading={fetching}
                                        pagination={{
                                            size: 'small',
                                            current,
                                            pageSize: 10,
                                        }}
                                        onChange={(
                                            currentPagination,
                                            filters,
                                            sorter,
                                        ) => {
                                            if (
                                                current ===
                                                currentPagination?.current
                                            ) {
                                                setCurrent(1)
                                            } else {
                                                setCurrent(
                                                    currentPagination?.current ||
                                                        1,
                                                )
                                            }
                                        }}
                                        scroll={{
                                            y: `calc(100vh - ${
                                                total > 10 ? 226 : 186
                                            }px)`,
                                        }}
                                    />
                                </div>
                            ) : (
                                renderEmpty()
                            ))}
                    </>
                )}
            </div>
        </Drawer>
    )
}

export default SubscribeInfos
