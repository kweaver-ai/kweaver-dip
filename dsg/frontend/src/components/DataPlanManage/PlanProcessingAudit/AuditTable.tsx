import { useAntdTable } from 'ahooks'
import { Button, Space, Table } from 'antd'
import classnames from 'classnames'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { OperateType } from '@/utils'
import { Empty, Loader } from '@/ui'
import { formatError, getDataProcessingPlanAudit } from '@/core'
import dataEmpty from '@/assets/dataEmpty.svg'
import DetailModal from '../PlanProcessing/DetailModal'
import AuditModal from './AuditModal'
import { AuditType } from './const'
import __ from './locale'
import styles from './styles.module.less'
import SearchLayout from '@/components/SearchLayout'

/** 审核表 */
const AuditTable = ({ type }: { type: AuditType }) => {
    const [loading, setLoading] = useState<boolean>(true)
    // 详情
    const [previewOpen, setPreviewOpen] = useState<boolean>(false)
    // 审核
    const [auditOpen, setAuditOpen] = useState<boolean>(false)
    const [curItem, setCurItem] = useState<any>()

    const [searchCondition, setSearchCondition] = useState<any>({
        offset: 1,
        limit: 10,
        target: type,
    })

    // 审核查询
    const getDataList = async (params) => {
        try {
            setLoading(true)
            const obj = params
            const res = await getDataProcessingPlanAudit(obj)
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
        run({ ...searchCondition, current: searchCondition.offset })
    }, [searchCondition])

    const handleOperate = async (op: OperateType, item: any) => {
        setCurItem(item)

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
            title: __('申请编号'),
            dataIndex: 'id',
            key: 'id',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.line} title={record.id}>
                    {text || '--'}
                </div>
            ),
        },
        {
            title: (
                <div>
                    <span>{__('数据处理计划名称')}</span>
                </div>
            ),
            dataIndex: 'name',
            key: 'name',
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
            fixed: 'right',
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
                    </Space>
                )
            },
        },
    ]

    const renderEmpty = () => {
        return <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
    }

    return (
        <div className={styles['audit-container']}>
            {loading ? (
                <div style={{ paddingTop: '48px' }}>
                    <Loader />
                </div>
            ) : (
                <>
                    {/* 目前后端不支持搜索、排序 */}
                    <div className={styles.top}>
                        <SearchLayout
                            prefixNode={
                                <div className={styles.auditTitle}>
                                    {__('处理计划待审核列表')}
                                </div>
                            }
                            formData={[]}
                            onSearch={(object, isRefresh) => {
                                const params = {
                                    ...searchCondition,
                                    ...object,
                                    offset: isRefresh
                                        ? searchCondition.offset
                                        : 1,
                                }
                                setSearchCondition(params)
                            }}
                        />
                    </div>
                    <div className={styles.bottom}>
                        {tableProps.dataSource.length === 0 ? (
                            <div className={styles.emptyWrapper}>
                                {renderEmpty()}
                            </div>
                        ) : (
                            <Table
                                rowClassName={styles.tableRow}
                                columns={columns}
                                {...tableProps}
                                rowKey="id"
                                scroll={{
                                    x: 1340,
                                    y:
                                        tableProps.dataSource.length === 0
                                            ? undefined
                                            : `calc(100vh - 226px)`,
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
                                        searchCondition.offset
                                    ) {
                                        setSearchCondition({
                                            ...searchCondition,
                                            offset: 1,
                                        })
                                    } else {
                                        setSearchCondition({
                                            ...searchCondition,
                                            offset: newPagination?.current || 1,
                                        })
                                    }
                                }}
                            />
                        )}
                    </div>
                </>
            )}

            {previewOpen && (
                <DetailModal
                    id={curItem?.id}
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
