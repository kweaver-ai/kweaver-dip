import React, { useEffect, useState } from 'react'
import { Table } from 'antd'
import { useAntdTable } from 'ahooks'
import { Empty, Loader } from '@/ui'
import styles from './styles.module.less'
import dataEmpty from '@/assets/dataEmpty.svg'
import { formatError, getWorkOrder } from '@/core'
import __ from './locale'
import { getOptionState } from '@/components/WorkOrder/WorkOrderManage/helper'
import { OrderStatusOptions } from '@/components/WorkOrder/helper'
import DetailModal from '@/components/WorkOrder/WorkOrderManage/DetailModal'

function RelativeOrder({ relativeId }: { relativeId: string }) {
    const [loading, setLoading] = useState<boolean>(false)
    const [searchCondition, setSearchCondition] = useState<any>({
        offset: 1,
        limit: 5,
    })
    const [current, setCurrent] = useState<any>()
    const [detailVisible, setDetailVisible] = useState<boolean>(false)

    // 工单查询
    const getDataList = async (params) => {
        try {
            setLoading(true)
            const obj = params
            const res = await getWorkOrder(obj)
            return { total: res.total_count, list: res.entries }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setLoading(false)
        }
    }

    const { tableProps, run } = useAntdTable(getDataList, {
        defaultPageSize: 5,
        manual: true,
    })

    useEffect(() => {
        if (relativeId) {
            run({
                ...searchCondition,
                current: searchCondition.offset,
                source_id: relativeId,
            })
        }
    }, [relativeId, searchCondition])

    const columns: any = [
        {
            title: (
                <div>
                    <span>{__('工单名称')}</span>
                    <span
                        style={{
                            color: 'rgba(0,0,0,0.45)',
                            fontWeight: 'normal',
                        }}
                    >
                        （{__('编号')}）
                    </span>
                </div>
            ),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.titleBox}>
                    <div className={styles.planTitle}>
                        <div
                            title={text}
                            onClick={() => {
                                if (record?.work_order_id) {
                                    setCurrent(record)
                                    setDetailVisible(true)
                                }
                            }}
                        >
                            {text || '--'}
                        </div>
                    </div>
                    <div className={styles.planContent} title={record?.code}>
                        {record?.code || '--'}
                    </div>
                </div>
            ),
        },
        {
            title: __('状态'),
            dataIndex: 'status',
            key: 'status',
            width: 180,
            render: (text, record) => getOptionState(text, OrderStatusOptions),
        },

        {
            title: __('责任人'),
            dataIndex: 'responsible_uname',
            key: 'responsible_uname',
            ellipsis: true,
            width: 180,
            render: (text, record) => (
                <div className={styles.ellipsisTitle} title={text}>
                    {text || '--'}
                </div>
            ),
        },
    ]

    const renderEmpty = () => {
        return (
            <Empty
                desc={
                    <div style={{ textAlign: 'center' }}>
                        <div> {__('暂无数据')}</div>
                    </div>
                }
                iconSrc={dataEmpty}
            />
        )
    }
    return (
        <div className={styles['relative-order']}>
            {loading ? (
                <Loader />
            ) : (
                <div className={styles.table}>
                    {tableProps.dataSource.length === 0 ? (
                        <div className={styles.emptyWrapper}>
                            {renderEmpty()}
                        </div>
                    ) : (
                        <Table
                            rowClassName={styles.tableRow}
                            columns={columns}
                            {...tableProps}
                            rowKey="work_order_id"
                            scroll={{
                                x: 600,
                            }}
                            pagination={{
                                ...tableProps.pagination,
                                showSizeChanger: false,
                                hideOnSinglePage: true,
                            }}
                            bordered={false}
                            locale={{
                                emptyText: <Empty />,
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
                                        limit: newPagination.pageSize || 10,
                                    })
                                }
                            }}
                        />
                    )}
                </div>
            )}

            {detailVisible && (
                <DetailModal
                    id={current?.work_order_id}
                    type={current?.type}
                    onClose={() => {
                        setDetailVisible(false)
                        setCurrent(undefined)
                    }}
                />
            )}
        </div>
    )
}

export default RelativeOrder
