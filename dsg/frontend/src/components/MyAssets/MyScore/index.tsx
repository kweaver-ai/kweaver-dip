import { Space, Table, TableProps } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { useAntdTable } from 'ahooks'
import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import moment from 'moment'
import __ from '../locale'
import { defaultMenu, menus } from './const'
import styles from './styles.module.less'
import { Empty, SearchInput, Loader } from '@/ui'
import DropDownFilter from '../../DropDownFilter'
import {
    ICatlgScoreItem,
    IDemandListItem,
    SortDirection,
    formatError,
    getCatlgScoreList,
} from '@/core'
import { formatTime } from '@/utils'
import dataEmpty from '@/assets/dataEmpty.svg'
import { RefreshBtn, SortBtn } from '../../ToolbarComponents'
import Score from './Score'

const MyScore = () => {
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)
    const [searchCondition, setSearchCondition] = useState<any>({
        keyword: '',
        limit: 10,
        current: 1,
        sort: defaultMenu.key,
        direction: defaultMenu.sort,
    })
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        nameAt: null,
        scoredAt: 'descend',
    })
    const [operateItem, setOperateItem] = useState<ICatlgScoreItem>()

    useEffect(() => {
        run({ ...searchCondition })
    }, [searchCondition])

    const columns: TableProps<any>['columns'] = [
        {
            title: (
                <div>
                    {__('数据资源目录名称')}
                    <span className={styles['code-title']}>
                        {__('（编码）')}
                    </span>
                </div>
            ),
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            sortOrder: tableSort.nameAt,
            showSorterTooltip: false,
            render: (_, record: ICatlgScoreItem) => {
                return (
                    <div className={styles['name-wrapper']}>
                        <div className={styles.name} title={record.name}>
                            {record.name}
                        </div>
                        <div className={styles.code} title={record.code}>
                            {record.code}
                        </div>
                    </div>
                )
            },
        },
        {
            title: __('所属部门'),
            dataIndex: 'department',
            key: 'department',
            ellipsis: true,
            render: (_, record: ICatlgScoreItem) => {
                return (
                    <span title={record.department_path}>
                        {record.department}
                    </span>
                )
            },
        },
        {
            title: __('评分'),
            dataIndex: 'score',
            key: 'score',
        },
        {
            title: __('评分时间'),
            dataIndex: 'scored_at',
            sorter: true,
            sortOrder: tableSort.scoredAt,
            showSorterTooltip: false,
            key: 'scored_at',
            render: (val: number) => formatTime(val),
        },
        {
            title: __('操作'),
            key: 'action',
            width: 120,
            fixed: 'right',
            render: (_, record: ICatlgScoreItem) => (
                <a onClick={() => setOperateItem(record)}>{__('重新评分')}</a>
            ),
        },
    ]

    const onChangeMenuToTableSort = (selectedMenu) => {
        switch (selectedMenu.key) {
            case 'scored_at':
                setTableSort({
                    scoredAt:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                })
                break
            case 'name':
                setTableSort({
                    nameAt:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                })
                break
            default:
                setTableSort({
                    scoredAt: null,
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
        // setSelectedSort(selectedMenu)
        onChangeMenuToTableSort(selectedMenu)
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            if (sorter.columnKey === 'scored_at') {
                setTableSort({
                    scoredAt: sorter.order || 'ascend',
                    nameAt: null,
                })
            } else {
                setTableSort({
                    scoredAt: null,
                    nameAt: sorter.order || 'ascend',
                })
            }
            return {
                key: sorter.columnKey === 'name' ? 'name' : 'scored_at',
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }
        if (searchCondition.sort === 'scored_at') {
            if (searchCondition.direction === SortDirection.ASC) {
                setTableSort({
                    scoredAt: 'descend',
                    nameAt: null,
                })
            } else {
                setTableSort({
                    scoredAt: 'ascend',
                    nameAt: null,
                })
            }
        } else if (searchCondition.sort === SortDirection.ASC) {
            setTableSort({
                scoredAt: null,
                nameAt: 'descend',
            })
        } else {
            setTableSort({
                scoredAt: null,
                nameAt: 'ascend',
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

    const renderEmpty = () => {
        return <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
    }

    const getList = async (params: any) => {
        const { current: offset, limit, keyword, sort, direction } = params

        try {
            const res = await getCatlgScoreList({
                offset,
                limit,
                sort,
                direction,
                keyword,
            })

            return {
                total: res.total_count,
                list: res.entries,
            }
        } catch (error) {
            formatError(error)
            return {
                total: 0,
                list: [],
            }
        } finally {
            setSelectedSort(undefined)
        }
    }

    const { tableProps, run, pagination, loading } = useAntdTable(getList, {
        defaultPageSize: 10,
        manual: true,
    })

    return (
        <div className={classnames(styles['myscore-wrapper'])}>
            <div className={styles.wrapperTitle}>{__('我的评分')}</div>
            <div className={styles['operate-container']}>
                <div className={styles.title}>{__('评分列表')}</div>
                <Space size={16}>
                    <Space size={8}>
                        <SearchInput
                            className={styles.nameInput}
                            style={{ width: 272 }}
                            placeholder={__('搜索数据资源目录名称、编码')}
                            onKeyChange={(kw: string) =>
                                setSearchCondition({
                                    ...searchCondition,
                                    keyword: kw,
                                    offset: 1,
                                    current: 1,
                                })
                            }
                        />
                    </Space>
                    <span>
                        <SortBtn
                            contentNode={
                                <DropDownFilter
                                    menus={menus}
                                    defaultMenu={defaultMenu}
                                    menuChangeCb={handleMenuChange}
                                    changeMenu={selectedSort}
                                />
                            }
                        />
                        <RefreshBtn
                            onClick={() =>
                                setSearchCondition({ ...searchCondition })
                            }
                        />
                    </span>
                </Space>
            </div>
            {loading ? (
                <div className={styles.loader}>
                    <Loader />
                </div>
            ) : !loading &&
              tableProps.dataSource.length === 0 &&
              !searchCondition.keyword ? (
                <div className={styles.emptyWrapper}>{renderEmpty()}</div>
            ) : (
                <Table
                    columns={columns}
                    {...tableProps}
                    rowKey="id"
                    rowClassName={styles.tableRow}
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
                                current: 1,
                            })
                        } else {
                            setSearchCondition({
                                ...searchCondition,
                                current: currentPagination?.current || 1,
                            })
                        }
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
                    }}
                    locale={{ emptyText: <Empty /> }}
                />
            )}
            {operateItem && (
                <Score
                    open={!!operateItem}
                    onCancel={() => setOperateItem(undefined)}
                    catlgItem={operateItem!}
                    onOk={() =>
                        setSearchCondition({
                            ...searchCondition,
                            current: 1,
                        })
                    }
                />
            )}
        </div>
    )
}

export default MyScore
