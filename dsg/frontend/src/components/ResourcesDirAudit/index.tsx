import { useAntdTable } from 'ahooks'
import { Space, Table } from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import { useEffect, useState } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import { formatError, getAuditTasks, SortDirection } from '@/core'
import { Empty, LightweightSearch, Loader, SearchInput } from '@/ui'
import { formatTime } from '@/utils'
import { RefreshBtn } from '../ToolbarComponents'
import { lightweightSearchData, auditTypeList } from './const'
import __ from './locale'
import styles from './styles.module.less'
import { PolicyType } from '../AuditPolicy/const'
import { getCurOffset } from '../DataPlanManage/ListCollectionAudit/helper'
import DetailDialog from './DetailDialog'

const ResourcesDirAudit = () => {
    const [searchCondition, setSearchCondition] = useState<any>({
        offset: 1,
        limit: 10,
        type: `${PolicyType.CatalogPublish},${PolicyType.CatalogOnline},${PolicyType.CatalogOffline},${PolicyType.CatalogChange}`,
        target: 'tasks',
    })
    const [auditOpen, setAuditOpen] = useState(false)
    const [isAudit, setIsAudit] = useState(false)
    const [auditAppCaseInfo, setAuditAppCaseInfo] = useState<any>()
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        createdAt: 'descend',
    })

    const columns: any = [
        {
            title: (
                <div>
                    <span>{__('数据资源目录名称')}</span>
                    <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                        {__('（编码）')}
                    </span>
                </div>
            ),
            dataIndex: 'name',
            key: 'name',
            // sorter: true,
            // sortOrder: tableSort.name,
            // showSorterTooltip: {
            //     title: __('按目录名称排序'),
            //     placement: 'bottom',
            //     overlayInnerStyle: {
            //         color: '#fff',
            //     },
            // },
            render: (text, record) => {
                const it = JSON.parse(record?.apply_detail?.data || '{}')
                const title = it?.title
                const code = it?.code
                const catalog_id = it?.id
                return (
                    <div className={styles.catlgName}>
                        <div className={styles.catlgNameCont}>
                            <div
                                onClick={() => {
                                    setIsAudit(false)
                                    setAuditOpen(true)
                                    setAuditAppCaseInfo({
                                        ...record,
                                        catalog_id,
                                    })
                                }}
                                title={title}
                                className={styles.names}
                            >
                                {title || '--'}
                            </div>
                            <div className={styles.code} title={code}>
                                {code}
                            </div>
                        </div>
                    </div>
                )
            },
        },
        {
            title: __('审核类型'),
            dataIndex: 'biz_type',
            key: 'biz_type',
            ellipsis: true,
            render: (text, record) =>
                auditTypeList?.find((o) => o.value === text)?.label || '--',
        },
        {
            title: __('申请人'),
            dataIndex: 'apply_user_name',
            key: 'apply_user_name',
            ellipsis: true,
            render: (text, record) => text || '--',
        },
        {
            title: __('创建时间'),
            dataIndex: 'apply_time',
            key: 'apply_time',
            // sorter: true,
            // sortOrder: tableSort.createdAt,
            render: (val) => formatTime(val),
        },
        {
            title: __('操作'),
            key: 'action',
            fixed: 'right',
            width: 100,
            render: (_, record) => {
                const it = JSON.parse(record?.apply_detail?.data || '{}')
                const catalog_id = it?.id

                return (
                    <Space size={8}>
                        <div
                            className={styles.link}
                            onClick={() => {
                                setIsAudit(true)
                                setAuditOpen(true)
                                setAuditAppCaseInfo({ ...record, catalog_id })
                            }}
                        >
                            {__('审核')}
                        </div>
                    </Space>
                )
            },
        },
    ]

    const renderEmpty = () => {
        return <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
    }

    const getAppCaseAuditList = async (params: any) => {
        try {
            const obj = {
                type: params?.type,
                target: params?.target,
                limit: params?.limit,
                offset: getCurOffset(params?.offset),
                doc_name: params?.keyword || '',
            }
            const res = await getAuditTasks(obj)

            return {
                total: Math.abs(res.total_count),
                list: res.entries,
            }
        } catch (error) {
            formatError(error)
            return {
                total: 0,
                list: [],
            }
        }
    }

    const { tableProps, run, pagination, loading } = useAntdTable(
        getAppCaseAuditList,
        {
            defaultPageSize: 10,
            manual: true,
        },
    )

    useEffect(() => {
        run(searchCondition)
    }, [searchCondition])

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            setTableSort({
                createdAt: null,
                name: sorter.order || 'ascend',
            })
            return {
                key: sorter.columnKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }
        if (searchCondition.sort === 'created_at') {
            if (searchCondition.direction === SortDirection.ASC) {
                setTableSort({
                    createdAt: 'descend',
                    name: null,
                })
            } else {
                setTableSort({
                    createdAt: 'ascend',
                    name: null,
                })
            }
        } else if (searchCondition.sort === SortDirection.ASC) {
            setTableSort({
                createdAt: null,
                name: 'descend',
            })
        } else {
            setTableSort({
                createdAt: null,
                name: 'ascend',
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

    return (
        <div className={styles['resources-audit']}>
            <div className={styles['resources-audit-top']}>
                <div className={styles['resources-audit-title']}>
                    {__('数据资源目录审核')}
                </div>
                <Space size={8}>
                    {/* <SearchInput
                        placeholder={__('搜索申请内容')}
                        onKeyChange={(value: string) => {
                            if (value) {
                                setSearchCondition((pre) => ({
                                    ...pre,
                                    keyword: value,
                                }))
                            }
                        }}
                        // 解决清除按钮接口调用2次
                        onChange={(e) => {
                            const { value } = e.target
                            if (!value) {
                                setSearchCondition((pre) => ({
                                    ...pre,
                                    keyword: undefined,
                                }))
                            }
                        }}
                        style={{ width: 272 }}
                    /> */}
                    {/* <LightweightSearch
                        formData={lightweightSearchData}
                        onChange={(data, key) => {
                            setSearchCondition((pre) => ({
                                ...pre,
                                [key || '']: data[key || ''],
                            }))
                        }}
                        defaultValue={{ type: '' }}
                    /> */}
                    <RefreshBtn onClick={() => run(searchCondition)} />
                </Space>
            </div>
            {loading ? (
                <div className={styles.loader}>
                    <Loader />
                </div>
            ) : !loading && tableProps.dataSource.length === 0 ? (
                <div className={styles.emptyWrapper}>{renderEmpty()}</div>
            ) : (
                <Table
                    columns={columns}
                    {...tableProps}
                    rowKey="id"
                    rowClassName={styles.tableRow}
                    className={styles.table}
                    onChange={(currentPagination, filters, sorter) => {
                        const selectedMenu = handleTableChange(sorter)
                        setSearchCondition((prev) => ({
                            ...prev,
                            sort: selectedMenu.key,
                            direction: selectedMenu.sort,
                            offset: currentPagination.current || 1,
                            pageSize: currentPagination.pageSize || 10,
                        }))
                    }}
                    scroll={{
                        x: 1200,
                        y:
                            tableProps.dataSource.length === 0
                                ? undefined
                                : `calc(100vh - 278px)`,
                    }}
                    pagination={{
                        ...tableProps.pagination,
                        showSizeChanger: false,
                        hideOnSinglePage: true,
                        current: searchCondition.offset,
                        pageSize: searchCondition.limit,
                        showTotal: (count) => {
                            return `共 ${count} 条记录 第 ${
                                searchCondition.offset
                            }/${Math.ceil(count / searchCondition.limit)} 页`
                        },
                    }}
                    locale={{ emptyText: <Empty /> }}
                />
            )}
            {auditOpen && auditAppCaseInfo && (
                <DetailDialog
                    open={auditOpen}
                    onClose={() => {
                        setAuditOpen(false)
                        setAuditAppCaseInfo(undefined)
                        run(searchCondition)
                    }}
                    appCaseInfo={auditAppCaseInfo}
                    id={auditAppCaseInfo?.catalog_id || ''}
                    isAudit={isAudit}
                />
            )}
            {/* {detailDialogOpen && auditAppCaseInfo?.id && (
                <TagDetails
                    open={detailDialogOpen}
                    id={auditAppCaseInfo?.id || ''}
                    showTreeInfo
                    showAuditInfo
                    type={TagDetailsType.audit}
                    onClose={() => setDetailDialogOpen(false)}
                />
            )} */}
        </div>
    )
}

export default ResourcesDirAudit
