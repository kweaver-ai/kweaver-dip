import { Space, Table, message } from 'antd'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useUpdateEffect } from 'ahooks'
import { trim, omit } from 'lodash'
import {
    Empty,
    OptionBarTool,
    OptionMenuType,
    SearchInput,
    LightweightSearch,
} from '@/ui'
import {
    formatError,
    getFavoriteList,
    ResType,
    deleteFavorite,
    IGetFavoriteListParams,
    IFavoriteItem,
    SortType,
    SortDirection,
} from '@/core'
import { formatTime } from '@/utils'
import {
    FavoriteTabMap,
    FavoriteOperate,
    renderEmpty,
    renderLoader,
    MultiHeader,
    MultiColumn,
    SubjectView,
    IndicatorTypeView,
} from './helper'
import __ from './locale'
import styles from './styles.module.less'
import DataCatlgContent from '@/components/DataAssetsCatlg/DataCatlgContent'
import { SearchType } from '@/ui/LightweightSearch/const'
import { RefreshBtn, SortBtn } from '../ToolbarComponents'
import DropDownFilter from '../DropDownFilter'
import IndicatorViewDetail from '@/components/DataAssetsCatlg/IndicatorViewDetail'
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'
import ApplicationServiceDetail from '@/components/DataAssetsCatlg/ApplicationServiceDetail'

const FavoriteTable: React.FC<{
    menu: ResType
}> = ({ menu }) => {
    // 初始化 load
    const [loading, setLoading] = useState<boolean>(true)
    // 加载数据 load
    const [fetching, setFetching] = useState<boolean>(true)
    // 表格数据
    const [tableData, setTableData] = useState<IFavoriteItem[]>([])
    // 总条数
    const [total, setTotal] = useState<number>(0)
    // 当前操作项
    const [operateItem, setOperateItem] = useState<IFavoriteItem>()

    // 搜索条件
    const [searchCondition, setSearchCondition] =
        useState<IGetFavoriteListParams>()
    // 获取 搜索条件
    const searchConditionRef = useRef(searchCondition)
    // 下拉排序
    const [selectedSort, setSelectedSort] = useState<any>(
        FavoriteTabMap[menu].defaultMenu,
    )
    // 表头排序
    const [tableSort, setTableSort] = useState<any>(
        FavoriteTabMap[menu].defaultTableSort,
    )
    // 是否引入
    const [isIntroduced, setIsIntroduced] = useState<boolean>(false)
    // 详情弹窗
    const [indicatorDetailOpen, setIndicatorDetailOpen] =
        useState<boolean>(false)
    const [viewDetailOpen, setViewDetailOpen] = useState<boolean>(false)
    const [interfaceDetailOpen, setInterfaceDetailOpen] =
        useState<boolean>(false)
    const searchRef = useRef<any>(null)

    useEffect(() => {
        // 初始化搜索条件
        const { initSearch } = FavoriteTabMap[menu]
        setSearchCondition(initSearch)
    }, [menu])

    useEffect(() => {
        searchConditionRef.current = searchCondition
    }, [searchCondition])

    // 是否有过滤值
    const isSearchStatus = useMemo(() => {
        const ignoreAttr = ['offset', 'limit', 'res_type', 'direction', 'sort']
        return Object.values(omit(searchCondition, ignoreAttr)).some(
            (item) => item,
        )
    }, [searchCondition])

    useUpdateEffect(() => {
        if (searchCondition) {
            getTableList({ ...searchCondition })
        }
    }, [searchCondition])

    // 获取表格数据
    const getTableList = async (params: any) => {
        try {
            setFetching(true)
            const res = await getFavoriteList(params)
            setTableData(res?.entries || [])
            setTotal(res?.total_count || 0)
        } catch (error) {
            formatError(error)
        } finally {
            setFetching(false)
            setLoading(false)
            setSelectedSort(undefined)
        }
    }

    // 取消收藏
    const handleCancelFavorite = async (record: IFavoriteItem) => {
        try {
            await deleteFavorite(record.id)
            getTableList({ ...searchConditionRef.current })
            message.success('取消收藏成功')
        } catch (error) {
            formatError(error)
        }
    }

    // 表格操作事件
    const handleOptionTable = (key: string, record) => {
        setOperateItem(record)
        switch (key) {
            case FavoriteOperate.Details:
                if (menu === ResType.Indicator) {
                    setIndicatorDetailOpen(true)
                } else if (menu === ResType.DataView) {
                    setViewDetailOpen(true)
                } else if (menu === ResType.InterfaceSvc) {
                    setInterfaceDetailOpen(true)
                }
                break

            case FavoriteOperate.CancelFavorite:
                handleCancelFavorite(record)
                break

            default:
                break
        }
    }

    // 表格操作项
    const getTableOptions = () => {
        const allOptionMenus = [
            {
                key: FavoriteOperate.Details,
                label: __('详情'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: FavoriteOperate.CancelFavorite,
                label: __('取消收藏'),
                menuType: OptionMenuType.Menu,
            },
        ]

        // 根据 optionKeys 过滤出对应的 optionMenus
        const optionMenus = allOptionMenus.filter((i) =>
            FavoriteTabMap[menu].actionMap.includes(i.key),
        )

        return optionMenus
    }

    const columns: any = useMemo(() => {
        const sortableColumn = (dataIndex: string) => ({
            sorter: true,
            sortOrder: tableSort?.[dataIndex],
            showSorterTooltip: false,
            sortDirections: ['descend', 'ascend', 'descend'],
        })

        const cols = [
            {
                title: (
                    <MultiHeader
                        mainTitle={__('资源名称')}
                        subTitle={__('（编码）')}
                    />
                ),
                dataIndex: 'name',
                key: 'name',
                ...sortableColumn('name'),
                ellipsis: true,
                render: (value, record) => (
                    <MultiColumn
                        menu={menu}
                        record={record}
                        onClick={() =>
                            handleOptionTable(FavoriteOperate.Details, record)
                        }
                    />
                ),
            },
            {
                title: __('指标类型'),
                dataIndex: 'indicator_type',
                key: 'indicator_type',
                ellipsis: true,
                render: (value, record) => {
                    return <IndicatorTypeView record={record} />
                },
            },
            {
                title: __('所属业务对象'),
                dataIndex: 'subjects',
                key: 'subjects',
                ellipsis: true,
                render: (value, record) => {
                    return <SubjectView record={record} />
                },
            },
            {
                title: __('所属部门'),
                dataIndex: 'org_name',
                key: 'org_name',
                ellipsis: true,
                render: (value, record) => {
                    return value ? (
                        <span title={record?.org_path}>{value}</span>
                    ) : (
                        '--'
                    )
                },
            },
            {
                title: __('上线时间'),
                dataIndex: 'online_at',
                key: 'online_at',
                ellipsis: true,
                ...sortableColumn('online_at'),
                width: 200,
                render: (val: number) => (val ? formatTime(val) : '--'),
            },
            {
                title: __('发布时间'),
                dataIndex: 'published_at',
                key: 'published_at',
                ellipsis: true,
                ...sortableColumn('published_at'),
                width: 200,
                render: (val: number) => (val ? formatTime(val) : '--'),
            },
            {
                title: __('操作'),
                key: 'action',
                width: FavoriteTabMap[menu].actionWidth,
                fixed: 'right',
                render: (_, record) => {
                    return (
                        <OptionBarTool
                            menus={getTableOptions() as any[]}
                            onClick={(key, e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleOptionTable(key, record)
                            }}
                        />
                    )
                },
            },
        ]
        return cols.filter((col) =>
            FavoriteTabMap[menu].columnKeys.includes(col.key),
        )
    }, [menu, tableSort])

    // 关键字搜索
    const handleKwSearch = (kw) => {
        if (kw === searchCondition?.keyword) return
        setSearchCondition({
            ...searchCondition,
            keyword: kw,
            offset: 1,
        } as IGetFavoriteListParams)
    }

    // 刷新
    const handleRefresh = (refresh: boolean = true) => {
        setSearchCondition({
            ...searchCondition,
            offset: refresh ? 1 : searchCondition?.offset,
        } as IGetFavoriteListParams)
    }

    // 轻量级搜索
    const handleLightWeightSearchChange = (data, key) => {
        if (!key) {
            setSearchCondition({
                ...searchCondition,
                offset: 1,
                ...data,
            })
        } else if (data[key]) {
            setSearchCondition({
                ...searchCondition,
                offset: 1,
                [key]: data[key],
            })
        } else {
            setSearchCondition({
                ...searchCondition,
                offset: 1,
                [key]: undefined,
            })
        }
    }

    // 筛选顺序变化
    const onChangeMenuToTableSort = (selectedMenu) => {
        const newSort: any = {
            name: null,
            online_at: null,
            published_at: null,
        }

        const key = selectedMenu?.key
        newSort[key] =
            selectedMenu.sort === SortDirection.DESC ? 'descend' : 'ascend'

        setTableSort(newSort)

        return {
            key,
            sort: selectedMenu?.sort,
        }
    }

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition({
            ...searchCondition,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            offset: 1,
        })
        onChangeMenuToTableSort(selectedMenu)
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        const newSort = {
            name: null,
            online_at: null,
            published_at: null,
        }

        if (sorter.column) {
            const key = sorter.columnKey
            newSort[key] = sorter.order || 'ascend'
        }

        setTableSort(newSort)

        return {
            key: sorter?.columnKey,
            sort:
                sorter?.order === 'ascend'
                    ? SortDirection.ASC
                    : SortDirection.DESC,
        }
    }

    // 表格排序改变
    const onTableChange = (currentPagination, filters, sorter, extra) => {
        const selectedMenu = handleTableChange(sorter)
        setSelectedSort(selectedMenu)
        setSearchCondition({
            ...searchCondition,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            limit: currentPagination?.pageSize,
            offset: currentPagination?.current,
        })
    }

    // 顶部左侧操作
    const leftOperate = <div className={styles.topLeft}>{__('收藏列表')}</div>

    // 顶部右侧操作
    const rightOperate = (tableData.length > 0 || isSearchStatus) && (
        <div className={styles.topRight}>
            <Space size={8}>
                <SearchInput
                    value={searchCondition?.keyword}
                    style={{ width: 280 }}
                    placeholder={__('搜索资源名称、编码')}
                    onKeyChange={(kw: string) => {
                        handleKwSearch(kw)
                    }}
                    onPressEnter={(
                        e: React.KeyboardEvent<HTMLInputElement>,
                    ) => {
                        handleKwSearch(trim(e.currentTarget.value))
                    }}
                />
                <LightweightSearch
                    ref={searchRef}
                    formData={FavoriteTabMap[menu].searchFormData}
                    onChange={handleLightWeightSearchChange}
                    defaultValue={FavoriteTabMap[menu].defaultSearch}
                />
                <SortBtn
                    contentNode={
                        <DropDownFilter
                            menus={FavoriteTabMap[menu].sortMenus}
                            defaultMenu={FavoriteTabMap[menu].defaultMenu}
                            menuChangeCb={handleMenuChange}
                            changeMenu={selectedSort}
                        />
                    }
                />
                <RefreshBtn onClick={handleRefresh} />
            </Space>
        </div>
    )

    // 取消收藏
    const cancelFavorite = (params: { flag?: boolean; detailsInfo?: any }) => {
        const { flag, detailsInfo } = params || {}
        // 取消收藏后，刷新列表
        if (!detailsInfo?.is_favored) {
            getTableList({ ...searchConditionRef.current })
        }
    }

    return (
        <div className={styles.favoriteContent}>
            {loading ? (
                renderLoader()
            ) : (
                <>
                    <div className={styles.favoriteOperation}>
                        {leftOperate}
                        {rightOperate}
                    </div>

                    {tableData.length === 0 && !isSearchStatus ? (
                        renderEmpty()
                    ) : (
                        <Table
                            columns={columns}
                            dataSource={tableData}
                            loading={fetching}
                            rowKey="id"
                            rowClassName={styles.tableRow}
                            scroll={{
                                x: columns.length * 180,
                                y: 'calc(100vh - 292px)',
                            }}
                            onChange={onTableChange}
                            pagination={{
                                total,
                                pageSize: searchCondition?.limit,
                                current: searchCondition?.offset,
                                showQuickJumper: true,
                                showSizeChanger: true,
                                showTotal: (count) =>
                                    __('共${count}条', { count }),
                            }}
                            locale={{ emptyText: <Empty /> }}
                        />
                    )}
                </>
            )}

            {indicatorDetailOpen && operateItem && (
                <IndicatorViewDetail
                    open={indicatorDetailOpen}
                    isIntroduced={isIntroduced}
                    id={operateItem?.res_id}
                    onClose={(params) => {
                        // cancelFavorite(params || {})
                        setIndicatorDetailOpen(false)
                    }}
                    indicatorType={operateItem?.indicator_type || ''}
                    canChat
                    hasAsst
                />
            )}
            {viewDetailOpen && operateItem && (
                <LogicViewDetail
                    open={viewDetailOpen}
                    onClose={(params) => {
                        // cancelFavorite(params || {})
                        setViewDetailOpen(false)
                    }}
                    id={operateItem?.res_id}
                    isIntroduced={isIntroduced}
                    canChat
                    hasAsst
                />
            )}

            {interfaceDetailOpen && operateItem && (
                <ApplicationServiceDetail
                    open={interfaceDetailOpen}
                    onClose={(params) => {
                        // cancelFavorite(params || {})
                        setInterfaceDetailOpen(false)
                    }}
                    serviceCode={operateItem?.res_id}
                    isIntroduced={isIntroduced}
                    hasAsst
                />
            )}
        </div>
    )
}

export default FavoriteTable
