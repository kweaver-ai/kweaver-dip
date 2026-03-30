import { useState, useMemo, useEffect } from 'react'
import { Button, Space, Table, Tooltip } from 'antd'
import { useAntdTable } from 'ahooks'
import moment from 'moment'
import classnames from 'classnames'
import { SortOrder, ColumnType } from 'antd/lib/table/interface'
import { InfotipOutlined } from '@/icons'
import { ListDefaultPageSize, ListType, SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import { SortDirection, formatError, getSingleCatalogHistory } from '@/core'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import DropDownFilter from '@/components/DropDownFilter'
import dataEmpty from '@/assets/dataEmpty.svg'
import styles from './styles.module.less'
import __ from './locale'
import BreadcrumbNav from './BreadcrumbNav'
import { useRouter } from './RouterStack'
import { errMsg } from './TemplateManage'

enum SortType {
    UPDATED = 'search_at',
    NAME = 'data_catalog_name',
}

const menus = [
    { key: SortType.UPDATED, label: __('按查询时间排序') },
    { key: SortType.NAME, label: __('按查询数据目录排序') },
]

const defaultMenu = {
    key: SortType.UPDATED,
    sort: SortDirection.DESC,
}

const defaultLimit = ListDefaultPageSize[ListType.WideList]

const HistoryRecord = () => {
    const { push } = useRouter()
    const [keyword, setKeyword] = useState('')
    const [searchCondition, setSearchCondition] = useState<any>({
        pageSize: defaultLimit,
        current: 1,
        sort: defaultMenu.key,
        direction: defaultMenu.sort,
        keyword,
    })
    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        updateAt: 'descend',
    })

    const getRulesList = async (params: any) => {
        const {
            current,
            pageSize = defaultLimit,
            keyword: kd,
            sort,
            direction,
        } = params

        try {
            const res = await getSingleCatalogHistory({
                offset: current,
                limit: pageSize,
                keyword: kd,
                sort,
                direction,
            })
            // const res = {
            //     entries: [
            //         {
            //             data_catalog_name: '规则名称',
            //             id: '1',
            //             query_count: 200,
            //         },
            //         {
            //             data_catalog_name: '规则名称',
            //             id: '2',
            //             query_count: 200,
            //         },
            //         {
            //             data_catalog_name: '规则名称',
            //             id: '3',
            //             query_count: 200,
            //         },
            //         {
            //             data_catalog_name: '规则名称',
            //             id: '4',
            //             query_count: 200,
            //         },
            //         {
            //             data_catalog_name: '规则名称',
            //             id: '5',
            //             query_count: 200,
            //         },
            //         {
            //             data_catalog_name: '规则名称',
            //             id: '6',
            //             query_count: 200,
            //         },
            //     ],
            //     total_count: 100,
            // }
            return { total: res.total_count, list: res.entries }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setSelectedSort(undefined)
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getRulesList, {
        defaultPageSize: defaultLimit,
        manual: true,
    })

    const columns: ColumnType<any>[] = [
        {
            title: __('查询数据目录'),
            dataIndex: 'data_catalog_name',
            key: 'data_catalog_name',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.name,
            showSorterTooltip: false,
            render(text: string, record: any) {
                const isDisabled = record.error_type !== 0
                return (
                    <>
                        <div title={text} className={styles.textOverflow}>
                            <span
                                className={classnames(styles.mr4, {
                                    [styles.disabled]: isDisabled,
                                })}
                            >
                                {text}
                            </span>
                            {isDisabled && (
                                <Tooltip
                                    title={errMsg[record.error_type]}
                                    placement="top"
                                    color="#fff"
                                    overlayInnerStyle={{
                                        color: 'rgba(0, 0, 0, 0.85)',
                                    }}
                                >
                                    <InfotipOutlined
                                        style={{ color: '#F5222D' }}
                                    />
                                </Tooltip>
                            )}
                        </div>
                        <div
                            title={record.description}
                            className={`${styles.descText} ${styles.textOverflow}`}
                        >
                            {record.description}
                        </div>
                    </>
                )
            },
        },
        {
            title: __('查询结果数'),
            dataIndex: 'search_count',
            key: 'search_count',
            ellipsis: true,
        },
        {
            title: '查询时间',
            dataIndex: 'search_at',
            key: 'search_at',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.updateAt,
            showSorterTooltip: false,
            render(text: string) {
                return moment(text).format('YYYY-MM-DD HH:mm:ss')
            },
        },
        {
            title: __('操作'),
            dataIndex: 'operation',
            key: 'operation',
            ellipsis: true,
            width: 120,
            render(_, record: any) {
                const isDisabled = record.error_type !== 0
                return (
                    <div className={styles.tableOperation}>
                        <Tooltip
                            title={
                                isDisabled ? __('暂时无法导入查询数据') : null
                            }
                            overlayInnerStyle={{
                                color: 'rgba(0, 0, 0, 0.85)',
                            }}
                            color="#fff"
                            placement="top"
                        >
                            <Button
                                type="link"
                                disabled={isDisabled}
                                onClick={() => {
                                    push(
                                        `importQueryCondition?condition=${record.id}`,
                                    )
                                }}
                            >
                                {__('导入查询条件')}
                            </Button>
                        </Tooltip>
                    </div>
                )
            },
        },
    ]

    useEffect(() => {
        run({ ...pagination, ...searchCondition })
    }, [searchCondition])

    const isSearch = useMemo(() => {
        const { keyword: kd } = searchCondition
        return kd !== undefined && kd !== null && kd !== ''
    }, [searchCondition])

    // 表格排序改变
    const handleTableChange = (sorter) => {
        const sortFieldsMap = {
            search_at: 'updateAt',
            data_catalog_name: 'name',
        }
        const switchSortColumn = (
            source: { [key: string]: SortOrder },
            selectedKey: string,
            sortValue: SortOrder,
        ) => {
            const newState = { ...source }

            Object.keys(source).forEach((key) => {
                if (sortFieldsMap[selectedKey] === key) {
                    newState[key] = sortValue
                } else {
                    newState[key] = null
                }
            })
            return newState
        }
        if (sorter.column) {
            setTableSort((prevState) =>
                switchSortColumn(
                    prevState,
                    sorter.columnKey,
                    sorter.order || 'ascend',
                ),
            )
            return {
                key: sorter.columnKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }
        // 当表格排序字段为undefined
        const { sort } = searchCondition
        setTableSort((prevState) => {
            return switchSortColumn(
                prevState,
                sort,
                searchCondition.direction === SortDirection.ASC
                    ? 'descend'
                    : 'ascend',
            )
        })
        return {
            key: searchCondition.sort,
            sort:
                searchCondition.direction === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC,
        }
    }

    const onChangeMenuToTableSort = (selectedMenu) => {
        switch (selectedMenu.key) {
            case 'data_catalog_name':
                setTableSort({
                    name:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    updateAt: null,
                })
                break
            case 'search_at':
                setTableSort({
                    name: null,
                    updateAt:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                })
                break
            default:
                setTableSort({
                    name: null,
                    updateAt: null,
                })
                break
        }
    }

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition({
            ...searchCondition,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            current: 1,
        })
        setSelectedSort(selectedMenu)
        onChangeMenuToTableSort(selectedMenu)
    }

    return (
        <div className={styles.historyRecordWrapper}>
            <div className={styles.top}>
                <div className={styles.pageTitle}>
                    <BreadcrumbNav />
                    <span className={styles.pageTitleInfo}>
                        <InfotipOutlined />
                        {__('提示：仅展示最近前50条历史记录')}
                    </span>
                </div>
                <Space size={12} className={styles.topRight}>
                    <SearchInput
                        style={{ width: 272 }}
                        placeholder={__('搜索查询数据目录')}
                        onKeyChange={(kw: string) => {
                            if (kw === searchCondition?.keyword) return
                            setSearchCondition({
                                ...searchCondition,
                                current: 1,
                                keyword: kw,
                            })
                            setKeyword(kw)
                        }}
                    />
                    <Space size={0}>
                        <SortBtn
                            contentNode={
                                <DropDownFilter
                                    menus={menus}
                                    defaultMenu={defaultMenu}
                                    menuChangeCb={handleMenuChange}
                                    changeMenu={selectedSort}
                                    overlayStyle={{ width: 170 }}
                                />
                            }
                        />
                        <RefreshBtn
                            onClick={() => {
                                setSearchCondition({
                                    ...searchCondition,
                                    current: 1,
                                })
                            }}
                        />
                    </Space>
                </Space>
            </div>

            <div className={styles.bottom} id="desensitizationList">
                {!isSearch &&
                tableProps.dataSource.length === 0 &&
                !tableProps.loading ? (
                    <div className={styles.emptyWrapper}>
                        <Empty desc="暂无数据" iconSrc={dataEmpty} />
                    </div>
                ) : (
                    <Table
                        columns={columns}
                        {...tableProps}
                        rowKey="id"
                        onChange={(currentPagination, filters, sorter) => {
                            if (
                                currentPagination.current ===
                                searchCondition.current
                            ) {
                                const selectedMenu = handleTableChange(sorter)
                                setSelectedSort(selectedMenu)
                                setSearchCondition({
                                    ...searchCondition,
                                    sort: selectedMenu.key,
                                    direction: selectedMenu.sort,
                                    pageSize: currentPagination.pageSize,
                                    current: 1,
                                })
                            } else {
                                setSearchCondition({
                                    ...searchCondition,
                                    pageSize: currentPagination.pageSize,
                                    current: currentPagination?.current || 1,
                                })
                            }
                        }}
                        scroll={{
                            x: 500,
                            y:
                                tableProps.dataSource.length === 0
                                    ? undefined
                                    : tableProps.pagination.total > 20
                                    ? 'calc(100vh - 250px)'
                                    : 'calc(100vh - 250px)',
                        }}
                        pagination={{
                            ...tableProps.pagination,
                            hideOnSinglePage: tableProps.pagination.total <= 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            onChange(current, pageSize) {
                                setSearchCondition({
                                    ...searchCondition,
                                    current,
                                    pageSize,
                                })
                            },
                            showTotal(total, range) {
                                return `共 ${total} 条`
                            },
                        }}
                        bordered={false}
                        locale={{
                            emptyText: tableProps.loading ? (
                                <div style={{ height: 300 }} />
                            ) : (
                                <Empty />
                            ),
                        }}
                    />
                )}
            </div>
        </div>
    )
}

export default HistoryRecord
