import React, { useEffect, useMemo, useState } from 'react'
import moment from 'moment'
import { Button, Space, Table } from 'antd'
import { useAntdTable } from 'ahooks'
import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import { isNumber } from 'lodash'
import __ from './locale'
import styles from './styles.module.less'
import { FixedType } from '../CommonTable/const'
import { Empty, Loader } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import {
    formatError,
    getSSZDCatlgAuditRecordList,
    ISSZDReportAuditStatus,
    SortDirection,
} from '@/core'
import { AuditType } from './const'
import { auditOperationList } from '../ResourceDirReport/const'
import CatlgAuditDetail from './CatlgAuditDetail'
import { OperateType } from '@/utils'
import CatlgAuditModal from './CatlgAuditModal'
import CatlgAuditRecordModal from './CatlgAuditRecordModal'
import { getReportState, getStateItem } from '../ResourceDirReport/helper'

/** 审核表 */
const DirReportAuditTable = ({ type }: { type: AuditType }) => {
    const [loading, setLoading] = useState<boolean>(true)
    // 目录详情
    const [previewOpen, setPreviewOpen] = useState<boolean>(false)
    // 审核详情
    const [detailOpen, setDetailOpen] = useState<boolean>(false)
    // 审核
    const [auditOpen, setAuditOpen] = useState<boolean>(false)
    const [curCatlg, setCurCatlg] = useState<any>()
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        applyTime: 'descend',
    })

    const [searchCondition, setSearchCondition] = useState<any>({
        current: 1,
        pageSize: 10,
        direction: SortDirection.DESC,
        sort: 'apply_time',
        target: type,
        report_type: 'catalog',
    })

    useEffect(() => {
        run({ ...searchCondition })
    }, [])

    // 目录上报审核查询
    const getDataList = async (params) => {
        try {
            setLoading(true)
            const { current, pageSize, ...rest } = params
            const obj = { ...rest, offset: current, limit: pageSize }
            const res = await getSSZDCatlgAuditRecordList(obj)
            return { total: res.total_count, list: res.entries }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setLoading(false)
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getDataList, {
        defaultPageSize: 10,
        manual: true,
    })

    useEffect(() => {
        run({ ...searchCondition })
    }, [searchCondition])

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            if (sorter.columnKey === 'apply_time') {
                setTableSort({
                    applyTime: sorter.order || 'ascend',
                })
            } else {
                setTableSort({
                    applyTime: null,
                })
            }
            return {
                key: sorter.columnKey === 'title' ? 'name' : sorter.columnKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }
        if (searchCondition.sort === 'apply_time') {
            if (searchCondition.direction === SortDirection.ASC) {
                setTableSort({
                    applyTime: 'descend',
                })
            } else {
                setTableSort({
                    applyTime: 'ascend',
                })
            }
        } else if (searchCondition.sort === SortDirection.ASC) {
            setTableSort({
                applyTime: null,
            })
        } else {
            setTableSort({
                applyTime: null,
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

    const handleOperate = async (op: OperateType, item: any) => {
        setCurCatlg(item)

        switch (op) {
            case OperateType.PREVIEW:
                setPreviewOpen(true)
                break
            case OperateType.AUDIT:
                setAuditOpen(true)
                break
            case OperateType.DETAIL:
                setDetailOpen(true)
                break
            default:
                break
        }
    }

    const columns: any = [
        {
            title: __('申请编号'),
            dataIndex: 'apply_code',
            key: 'apply_code',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.line} title={record.apply_code}>
                    {text || '--'}
                </div>
            ),
        },
        {
            title: (
                <div>
                    <span>{__('上报目录名称')}</span>
                </div>
            ),
            dataIndex: 'catalog_title',
            key: 'catalog_title',
            width: 220,
            ellipsis: true,
            render: (text, record) => (
                <div
                    className={classnames(styles.line, styles.catlgName)}
                    title={text}
                    onClick={() => {
                        handleOperate(OperateType.PREVIEW, record)
                    }}
                >
                    {text || '--'}
                </div>
            ),
        },
        {
            title: __('目录编码'),
            dataIndex: 'catalog_code',
            key: 'catalog_code',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.line} title={record.catalog_code}>
                    {text || '--'}
                </div>
            ),
        },
        {
            title: __('上报类型'),
            dataIndex: 'audit_operation',
            key: 'audit_operation',
            render: (text, record) => (
                <div className={styles.line} title={record.audit_operation}>
                    {auditOperationList?.find((item) => item.value === text)
                        ?.label || '--'}
                </div>
            ),
        },
        {
            title: __('申请人'),
            dataIndex: 'applier_name',
            key: 'applier_name',
            render: (text, record) => (
                <div className={styles.line} title={text}>
                    {text || '--'}
                </div>
            ),
        },
        {
            title: __('申请时间'),
            dataIndex: 'apply_time',
            key: 'apply_time',
            ellipsis: true,
            width: 180,
            sorter: true,
            sortOrder: tableSort.applyTime,
            showSorterTooltip: false,
            render: (text: any) => {
                return text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '--'
            },
        },
        {
            title: __('审核状态'),
            dataIndex: 'audit_status',
            key: 'audit_status',
            ellipsis: true,
            width: 220,
            render: (text, record) => {
                const state = getStateItem({
                    status: record.audit_status,
                    operation: record.audit_operation,
                })

                return (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {state ? getReportState(state) : '--'}
                    </div>
                )
            },
        },
        {
            title: __('审核时间'),
            dataIndex: 'audit_time',
            key: 'audit_time',
            ellipsis: true,
            width: 180,
            showSorterTooltip: false,
            render: (text: any) => {
                return text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '--'
            },
        },
        {
            title: __('操作'),
            key: 'action',
            width: 100,
            fixed: FixedType.RIGHT,
            render: (_: string, record) => {
                return (
                    <Space size={16} className={styles.oprColumn}>
                        {type === AuditType.Tasks && (
                            <Button
                                type="link"
                                key={OperateType.AUDIT}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleOperate(OperateType.AUDIT, record)
                                }}
                            >
                                {__('审核')}
                            </Button>
                        )}
                        {type === AuditType.Historys && (
                            <Button
                                type="link"
                                key={OperateType.DETAIL}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleOperate(OperateType.DETAIL, record)
                                }}
                            >
                                {__('审核详情')}
                            </Button>
                        )}
                    </Space>
                )
            },
        },
    ]

    const renderEmpty = () => {
        return <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
    }

    const curColumns = useMemo(() => {
        const unTask = ['audit_status', 'audit_time']
        if (type === AuditType.Tasks) {
            return columns.filter((item) => !unTask.includes(item.key))
        }
        return columns
    }, [type, tableSort])

    return (
        <div className={styles['audit-container']}>
            {loading ? (
                <div style={{ paddingTop: '48px' }}>
                    <Loader />
                </div>
            ) : (
                <div className={styles.bottom}>
                    {tableProps.dataSource.length === 0 ? (
                        <div className={styles.emptyWrapper}>
                            {renderEmpty()}
                        </div>
                    ) : (
                        <Table
                            rowClassName={styles.tableRow}
                            columns={curColumns}
                            {...tableProps}
                            rowKey="applier_id"
                            scroll={{
                                x: 1340,
                                y:
                                    tableProps.dataSource.length === 0
                                        ? undefined
                                        : `calc(100vh - 270px)`,
                            }}
                            pagination={{
                                ...tableProps.pagination,
                                showSizeChanger: false,
                                hideOnSinglePage: true,
                            }}
                            bordered={false}
                            locale={{
                                emptyText: renderEmpty(),
                            }}
                            onChange={(newPagination, filters, sorter) => {
                                if (
                                    newPagination.current ===
                                        searchCondition.current &&
                                    newPagination.pageSize ===
                                        searchCondition.pageSize
                                ) {
                                    const selectedMenu =
                                        handleTableChange(sorter)
                                    setSearchCondition({
                                        ...searchCondition,
                                        sort: selectedMenu.key,
                                        direction: selectedMenu.sort,
                                        current: 1,
                                    })
                                } else {
                                    setSearchCondition({
                                        ...searchCondition,
                                        current: newPagination?.current || 1,
                                        pageSize: newPagination?.pageSize || 10,
                                    })
                                }
                            }}
                        />
                    )}
                </div>
            )}

            {previewOpen && (
                <CatlgAuditDetail
                    item={curCatlg}
                    onClose={() => {
                        setPreviewOpen(false)
                        setCurCatlg(undefined)
                    }}
                />
            )}
            {auditOpen && (
                <CatlgAuditModal
                    item={curCatlg}
                    onClose={(refresh?: boolean) => {
                        if (refresh) {
                            run({ ...searchCondition })
                        }
                        setAuditOpen(false)
                        setCurCatlg(undefined)
                    }}
                />
            )}
            {detailOpen && (
                <CatlgAuditRecordModal
                    item={curCatlg}
                    onClose={() => {
                        setDetailOpen(false)
                        setCurCatlg(undefined)
                    }}
                />
            )}
        </div>
    )
}

export default DirReportAuditTable
