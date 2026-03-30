import { useAntdTable } from 'ahooks'
import { Table } from 'antd'
import { SortOrder } from 'antd/es/table/interface'
import { memo, useEffect, useState } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import { formatError, getFormViewExploreReports, SortDirection } from '@/core'
import { Empty, SearchInput } from '@/ui'
import { DefaultMenu, FilterMenus, showNoContent, SortKeyMap } from '../helper'
import __ from './locale'
import styles from './styles.module.less'
import { DefaultDepartParams } from '../const'
import ReportDrawer from '../ReportDrawer'
import { DataViewProvider } from '../../DataViewProvider'
import DropDownFilter from '@/components/DropDownFilter'

const ViewTable = ({
    departmentId,
    ownerIds,
    isOwner,
}: {
    departmentId: string
    ownerIds: string
    isOwner: boolean
}) => {
    const [reportVisible, setReportVisible] = useState(false)
    const [currentView, setCurrentView] = useState<any>()
    const [searchCondition, setSearchCondition] = useState<any>()
    // 排序
    const [selectedSort, setSelectedSort] = useState<any>({
        key: SortKeyMap[DefaultMenu.key],
        sort: DefaultMenu.sort,
    })

    // 表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        total_score: null,
        accuracy_score: null,
        completeness_score: null,
        consistency_score: null,
        uniqueness_score: null,
        standardization_score: null,
        [DefaultMenu.key]:
            DefaultMenu.sort === SortDirection.DESC ? 'descend' : 'ascend',
    })

    const [pageOffset, setPageOffset] = useState(0)

    // 获取列表
    const getListData = async (params) => {
        const { current, ...rest } = params
        try {
            const res = await getFormViewExploreReports({ ...rest })
            return {
                total: res.total_count || 0,
                list: res.entries || [],
            }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setSelectedSort(undefined)
        }
    }

    const {
        tableProps,
        run,
        pagination,
        loading: tableLoading,
    } = useAntdTable(getListData, {
        defaultPageSize: 10,
        manual: true,
    })
    useEffect(() => {
        if (searchCondition && searchCondition?.department_id) {
            run({
                ...searchCondition,
                current: searchCondition.offset,
                pageSize: searchCondition.limit,
            })
        }
    }, [searchCondition])

    useEffect(() => {
        setSearchCondition((prev) => ({
            ...DefaultDepartParams,
            ...(prev || {}),
            department_id: departmentId,
            owner_ids: ownerIds,
            offset: 1,
        }))
    }, [departmentId, ownerIds])

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            setTableSort({
                total_score: null,
                accuracy_score: null,
                completeness_score: null,
                consistency_score: null,
                uniqueness_score: null,
                standardization_score: null,
                [sorter.columnKey]: sorter.order || 'ascend',
            })
            return {
                key: sorter.columnKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }

        setTableSort({
            total_score: null,
            accuracy_score: null,
            completeness_score: null,
            consistency_score: null,
            uniqueness_score: null,
            standardization_score: null,
            [sorter.columnKey]:
                searchCondition.direction === SortDirection.ASC
                    ? 'descend'
                    : 'ascend',
        })

        return {
            key: searchCondition.sort,
            sort:
                searchCondition.direction === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC,
        }
    }

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition({
            ...searchCondition,
            offset: 1,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
        })
        onChangeMenuToTableSort(selectedMenu)
    }

    const onChangeMenuToTableSort = (selectedMenu) => {
        const selectedKey =
            Object.keys(SortKeyMap).find(
                (key) => SortKeyMap[key] === selectedMenu.key,
            ) || selectedMenu.key
        setTableSort({
            total_score: null,
            accuracy_score: null,
            completeness_score: null,
            consistency_score: null,
            uniqueness_score: null,
            standardization_score: null,
            [selectedKey]:
                selectedMenu.sort === SortDirection.ASC ? 'ascend' : 'descend',
        })
    }
    useEffect(() => {
        if (!tableLoading) {
            setPageOffset((pagination.current - 1) * pagination.pageSize)
        }
    }, [pagination.current, pagination.pageSize, tableLoading])
    const columns = [
        {
            title: __('排名'),
            dataIndex: 'index',
            key: 'index',
            width: 60,
            render: (text, record, index) => pageOffset + index + 1,
        },
        {
            title: __('库表中文名称'),
            dataIndex: 'business_name',
            key: 'business_name',
            ellipsis: true,
            render: (text: string, record: any) => {
                return (
                    <span
                        className={styles.linkText}
                        onClick={() => {
                            setReportVisible(true)
                            setCurrentView(record)
                        }}
                    >
                        {text}
                    </span>
                )
            },
        },
        {
            title: __('库表英文名称'),
            dataIndex: 'technical_name',
            key: 'technical_name',
            ellipsis: true,
        },
        {
            title: __('准确性'),
            dataIndex: 'accuracy_score',
            key: 'accuracy_score',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.accuracy_score,
            render: (text: number, record: any) => showNoContent(text),
        },
        {
            title: __('完整性'),
            dataIndex: 'completeness_score',
            key: 'completeness_score',
            sortOrder: tableSort.completeness_score,
            sorter: true,
            ellipsis: true,
            render: (text: number, record: any) => showNoContent(text),
        },
        {
            title: __('一致性'),
            dataIndex: 'consistency_score',
            key: 'consistency_score',
            sortOrder: tableSort.consistency_score,
            ellipsis: true,
            sorter: true,
            render: (text: number, record: any) => showNoContent(text),
        },
        {
            title: __('唯一性'),
            dataIndex: 'uniqueness_score',
            key: 'uniqueness_score',
            sortOrder: tableSort.uniqueness_score,
            ellipsis: true,
            sorter: true,
            render: (text: number, record: any) => showNoContent(text),
        },
        {
            title: __('规范性'),
            dataIndex: 'standardization_score',
            key: 'standardization_score',
            sortOrder: tableSort.standardization_score,
            ellipsis: true,
            sorter: true,
            render: (text: number, record: any) => showNoContent(text),
        },
        {
            title: __('质量得分'),
            dataIndex: 'total_score',
            key: 'total_score',
            sortOrder: tableSort.total_score,
            ellipsis: true,
            sorter: true,
            render: (text: number, record: any) => showNoContent(text),
        },
    ]
    return (
        <div className={styles['view-table']}>
            <div className={styles['view-table-header']}>
                <div className={styles['view-table-header-title']}>
                    {__('库表各维度质量排名情况')}
                </div>
                <div className={styles['view-table-header-options']}>
                    <SearchInput
                        placeholder={__('搜索库表中英文名称')}
                        onKeyChange={(kw: string) =>
                            setSearchCondition((prev) => ({
                                ...prev,
                                keyword: kw,
                            }))
                        }
                        style={{ width: 200 }}
                    />
                    <SortBtn
                        contentNode={
                            <DropDownFilter
                                menus={FilterMenus}
                                defaultMenu={{
                                    key: SortKeyMap[DefaultMenu.key],
                                    sort: DefaultMenu.sort,
                                }}
                                menuChangeCb={handleMenuChange}
                                changeMenu={selectedSort}
                            />
                        }
                    />
                    <RefreshBtn
                        onClick={() =>
                            setSearchCondition({
                                ...searchCondition,
                                offset: 1,
                            })
                        }
                    />
                </div>
            </div>
            <div className={styles['view-table-content']}>
                <Table
                    columns={columns}
                    {...tableProps}
                    rowKey="form_view_id"
                    pagination={{
                        ...tableProps.pagination,
                        hideOnSinglePage: tableProps.pagination.total <= 10,
                        pageSizeOptions: [10, 20, 50, 100],
                        showQuickJumper: false,
                        responsive: true,
                        showLessItems: true,
                        showSizeChanger: true,
                        showTotal: (count) => {
                            return `共 ${count} 条`
                        },
                    }}
                    scroll={{
                        y: '280px',
                    }}
                    bordered={false}
                    locale={{
                        emptyText: searchCondition?.keyword ? (
                            <Empty />
                        ) : (
                            <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                        ),
                    }}
                    onChange={(newPagination, filters, sorter) => {
                        const selectedMenu = handleTableChange(sorter)
                        setSelectedSort({
                            key: SortKeyMap[selectedMenu.key],
                            sort: selectedMenu.sort,
                        })
                        setSearchCondition((prev) => ({
                            ...prev,
                            sort: SortKeyMap[selectedMenu.key],
                            direction: selectedMenu.sort,
                            offset: newPagination.current,
                            limit: newPagination.pageSize,
                        }))
                    }}
                />
            </div>
            {reportVisible && currentView && (
                <DataViewProvider>
                    <ReportDrawer
                        isOwner={isOwner}
                        departmentId={departmentId}
                        dataView={currentView}
                        onClose={() => {
                            setReportVisible(false)
                            setCurrentView(undefined)
                        }}
                    />
                </DataViewProvider>
            )}
        </div>
    )
}

export default memo(ViewTable)
