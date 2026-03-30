import { useAntdTable } from 'ahooks'
import { Button, Space, Table } from 'antd'
import classnames from 'classnames'
import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import { OperateType } from '@/utils'
import { Empty, Loader } from '@/ui'
import { formatError, getAuditHistory, getAuditTasks } from '@/core'
import dataEmpty from '@/assets/dataEmpty.svg'
import { OrderPolicyMap, OrderTypeOptions } from '../helper'
import DetailModal from '../WorkOrderManage/DetailModal'
import { defaultMenu } from '../WorkOrderTask/const'
import AuditModal from './AuditModal'
import { AuditStatusOptions, AuditType, getAuditSearchParams } from './const'
import { getCurOffset } from './helper'
import __ from './locale'
import styles from './styles.module.less'

/** 审核表 */
const AuditTable = ({
    target,
    type,
    queryParams = {},
}: {
    target: AuditType
    type: string
    queryParams: any
}) => {
    const [loading, setLoading] = useState<boolean>(true)
    // 详情
    const [previewOpen, setPreviewOpen] = useState<boolean>(false)
    // 审核
    const [auditOpen, setAuditOpen] = useState<boolean>(false)
    const [curItem, setCurItem] = useState<any>()
    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)
    const defaultPageSize = 10

    const [searchCondition, setSearchCondition] = useState<any>({
        offset: 1,
        limit: defaultPageSize,
        target,
        type,
    })

    useEffect(() => {
        setSearchCondition((prev) => ({
            ...prev,
            ...queryParams,
            target,
            type,
            offset: 1,
        }))
    }, [queryParams, target, type])

    // 审核查询
    const getDataList = async (params) => {
        try {
            setLoading(true)
            const obj = {
                type: params?.type,
                limit: params?.limit,
                offset: getCurOffset(params?.offset),
                abstracts: params?.abstracts || '', // 申请内容匹配关键词
                status: params?.status,
            }
            const queryFunc =
                target === AuditType.Tasks ? getAuditTasks : getAuditHistory
            const res = await queryFunc(obj)
            return { total: res.total_count, list: res.entries }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setLoading(false)
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getDataList, {
        defaultPageSize,
        manual: true,
    })

    const pageChange = async (offset, limit) => {
        setSearchCondition({
            ...searchCondition,
            offset,
            limit,
        })
    }

    useEffect(() => {
        run({ ...searchCondition, current: searchCondition.offset })
    }, [searchCondition])

    const handleOperate = async (op: OperateType, item: any) => {
        setCurItem({
            ...item,
            detail: JSON.parse(item?.apply_detail?.data || '{}'),
        })

        switch (op) {
            case OperateType.PREVIEW:
                setPreviewOpen(true)
                break
            case OperateType.AUDIT:
                setAuditOpen(true)
                break

            default:
                break
        }
    }

    const columns: any = [
        {
            title: (
                <div>
                    <span>{__('工单名称')}</span>
                </div>
            ),
            dataIndex: 'apply_detail',
            key: 'apply_detail',
            ellipsis: true,
            render: (detail, record) => {
                const it = JSON.parse(detail?.data || '{}')
                const title = it?.title
                return (
                    <div
                        className={classnames(styles.line, styles.catlgName)}
                        title={title}
                        onClick={() => {
                            handleOperate(OperateType.PREVIEW, {
                                ...record,
                                detail: it,
                            })
                        }}
                    >
                        {title || '--'}
                    </div>
                )
            },
        },
        {
            title: __('工单类型'),
            dataIndex: 'biz_type',
            key: 'biz_type',
            render: (biz_type, record) => {
                const orderType = Object.keys(OrderPolicyMap)?.find(
                    (oType) => OrderPolicyMap[oType] === biz_type,
                )
                return (
                    OrderTypeOptions.find((o) => o?.value === orderType)
                        ?.label ?? '--'
                )
            },
        },
        {
            title: __('审核状态'),
            dataIndex: 'audit_status',
            key: 'audit_status',
            render: (text, record) => {
                let state = text
                // 审核中与已完成保持一致
                if (text === 'pending') {
                    state = 'pass'
                }
                const item = AuditStatusOptions.find((o) => o.value === state)
                const status = item?.label || '--'
                const color = item?.color || 'rgba(0,0,0,0.45)'
                return <span style={{ color }}>{status}</span>
            },
        },
        {
            title: __('申请人'),
            dataIndex: 'apply_user_name',
            key: 'apply_user_name',
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
            showSorterTooltip: false,
            render: (text: any) => {
                return text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '--'
            },
        },
        {
            title: __('审核时间'),
            dataIndex: 'end_time',
            key: 'end_time',
            ellipsis: true,
            showSorterTooltip: false,
            render: (text: any) => {
                return text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '--'
            },
        },

        {
            title: __('操作'),
            key: 'action',
            width: 100,
            fixed: 'right',
            render: (_: string, record) => {
                return (
                    <Space size={16} className={styles.oprColumn}>
                        {target === AuditType.Tasks && (
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
                    </Space>
                )
            },
        },
    ]

    const renderEmpty = () => {
        return <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
    }

    const currentColumns = useMemo(() => {
        if (target === AuditType.Tasks) {
            return columns.filter(
                (o) => !['audit_status', 'end_time'].includes(o.key),
            )
        }
        return columns.filter((o) => !['apply_time', 'action'].includes(o.key))
    }, [target])

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
                            columns={currentColumns}
                            {...tableProps}
                            rowKey="id"
                            scroll={{
                                x: 1340,
                                y:
                                    tableProps.dataSource.length === 0
                                        ? undefined
                                        : `calc(100vh - 256px)`,
                            }}
                            pagination={{
                                ...tableProps.pagination,
                                onChange: pageChange,
                                hideOnSinglePage:
                                    (tableProps.pagination.total || 0) <=
                                    defaultPageSize,
                                current: searchCondition.offset,
                                pageSize: searchCondition.limit,
                                pageSizeOptions: [10, 20, 50, 100],
                                showQuickJumper: true,
                                responsive: true,
                                showLessItems: true,
                                showSizeChanger: true,
                                showTotal: (count) => {
                                    return `共 ${count} 条记录 第 ${
                                        searchCondition.offset
                                    }/${Math.ceil(
                                        count / searchCondition.limit,
                                    )} 页`
                                },
                            }}
                            bordered={false}
                            locale={{
                                emptyText: renderEmpty(),
                            }}
                            onChange={(newPagination, filters, sorter) => {
                                if (
                                    newPagination.current ===
                                        searchCondition.offset &&
                                    newPagination.pageSize ===
                                        searchCondition.limit
                                ) {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                    })
                                } else {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: newPagination?.current || 1,
                                        limit:
                                            newPagination.pageSize ||
                                            defaultPageSize,
                                    })
                                }
                            }}
                        />
                    )}
                </div>
            )}

            {previewOpen && (
                <DetailModal
                    id={curItem?.detail?.id}
                    type={curItem?.detail?.type}
                    onClose={() => {
                        setPreviewOpen(false)
                        setCurItem(undefined)
                    }}
                />
            )}
            {auditOpen && (
                <AuditModal
                    item={curItem}
                    onClose={(refresh?: boolean) => {
                        if (refresh) {
                            run({ ...searchCondition })
                        }
                        setAuditOpen(false)
                        setCurItem(undefined)
                    }}
                />
            )}
        </div>
    )
}

export default AuditTable
