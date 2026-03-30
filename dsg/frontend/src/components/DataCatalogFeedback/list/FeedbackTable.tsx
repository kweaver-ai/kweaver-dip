import { Space, Table } from 'antd'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useUpdateEffect } from 'ahooks'
import { trim, omit, isFunction } from 'lodash'
import { SortOrder } from 'antd/lib/table/interface'
import {
    Empty,
    LightweightSearch,
    OptionBarTool,
    OptionMenuType,
    SearchInput,
} from '@/ui'
import { useDict } from '@/hooks/useDict'
import DropDownFilter from '../../DropDownFilter'
import {
    SortDirection,
    formatError,
    getFeedbackList,
    DCFeedbackReq,
    DataDictType,
} from '@/core'
import { formatTime } from '@/utils'
import { SearchType } from '@/ui/LightweightSearch/const'
import { RefreshBtn, SortBtn } from '../../ToolbarComponents'
import {
    FeedbackTabMap,
    StatusView,
    FeedbackOperate,
    feedbackStatusMap,
    renderEmpty,
    renderLoader,
    MultiHeader,
    MultiColumn,
    TypeView,
    feedbackStatusOptions,
    FeedbackMenuEnum,
} from '../helper'
import Details from '../operate/Details'
import Reply from '../operate/Reply'
import __ from '../locale'
import styles from '../styles.module.less'

const FeedbackTable: React.FC<{
    menu: string
    scrollY?: string
    onReplySuccess?: () => void
}> = ({ menu, scrollY = 'calc(100vh - 300px)', onReplySuccess }) => {
    // 初始化 load
    const [loading, setLoading] = useState<boolean>(true)
    // 加载数据 load
    const [fetching, setFetching] = useState<boolean>(true)
    // 表格数据
    const [tableData, setTableData] = useState<any[]>([])
    // 总条数
    const [total, setTotal] = useState<number>(0)
    // 当前操作项
    const [operateItem, setOperateItem] = useState<any>()
    // 表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>(FeedbackTabMap[menu].defaultTableSort)
    // 回复弹窗
    const [replyVisible, setReplyVisible] = useState(false)
    // 详情弹窗
    const [detailsVisible, setDetailsVisible] = useState(false)
    // 搜索条件
    const [searchCondition, setSearchCondition] = useState<DCFeedbackReq>()
    // 获取 搜索条件
    const searchConditionRef = useRef(searchCondition)
    // 下拉排序
    const [selectedSort, setSelectedSort] = useState<any>(
        FeedbackTabMap[menu].defaultMenu,
    )
    const searchRef = useRef<any>(null)

    const [dict, getDict] = useDict()

    // 反馈类型选项
    const [feedbackTypeOptions, setFeedbackTypeOptions] = useState<any[]>([])

    useEffect(() => {
        const res = dict.find(
            (item) => item.dict_type === DataDictType.CatalogFeedbackType,
        )

        if (!res?.dict_item_resp) return

        const options = [
            { value: '', label: __('不限') },
            ...res.dict_item_resp.map((item) => ({
                value: item.dict_key,
                label: item.dict_value,
            })),
        ]
        setFeedbackTypeOptions(options)
    }, [dict])

    useEffect(() => {
        // 初始化搜索条件
        const { initSearch } = FeedbackTabMap[menu]
        setSearchCondition(initSearch)
    }, [menu])

    useEffect(() => {
        searchConditionRef.current = searchCondition
    }, [searchCondition])

    // 是否有过滤值
    const isSearchStatus = useMemo(() => {
        const ignoreAttr = [
            'offset',
            'limit',
            'sort',
            'direction',
            'view',
            'status',
        ]
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
            const res = await getFeedbackList(params)
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

    // 表格操作事件
    const handleOptionTable = (key: string, record) => {
        setOperateItem(record)
        switch (key) {
            case FeedbackOperate.Details:
                setDetailsVisible(true)
                break

            case FeedbackOperate.Reply:
                setReplyVisible(true)
                break

            default:
                break
        }
    }

    // 表格操作项
    const getTableOptions = () => {
        const allOptionMenus = [
            {
                key: FeedbackOperate.Details,
                label: __('反馈详情'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: FeedbackOperate.Reply,
                label: __('回复'),
                menuType: OptionMenuType.Menu,
            },
        ]

        // 根据 optionKeys 过滤出对应的 optionMenus
        const optionMenus = allOptionMenus.filter((i) =>
            FeedbackTabMap[menu].actionMap.includes(i.key),
        )

        return optionMenus
    }

    const columns: any = useMemo(() => {
        const commonProps = {
            ellipsis: true,
            render: (value) => value || '--',
        }

        const sortableColumn = (dataIndex: string) => ({
            sorter: true,
            sortOrder: tableSort?.[dataIndex],
            showSorterTooltip: false,
            sortDirections: ['descend', 'ascend', 'descend'],
            width: 200,
        })

        const cols = [
            {
                title: (
                    <MultiHeader
                        mainTitle={__('数据资源目录名称')}
                        subTitle={__('（编码）')}
                    />
                ),
                dataIndex: 'catalog_title',
                key: 'catalog_title',
                ...sortableColumn('catalog_title'),
                width: 300,
                ...commonProps,
                render: (value, record) => (
                    <MultiColumn
                        value={value}
                        subValue={record?.catalog_code}
                        onClick={() =>
                            handleOptionTable(FeedbackOperate.Details, record)
                        }
                    />
                ),
            },
            {
                title: __('状态'),
                dataIndex: 'status',
                key: 'status',
                width: 140,
                render: (value, record) => {
                    const item = feedbackStatusMap[value]
                    return <StatusView data={item} />
                },
            },
            {
                title: __('所属部门'),
                dataIndex: 'org_name',
                key: 'org_name',
                ...commonProps,
                width: 200,
                render: (value, record) => {
                    return <span title={record?.org_path}>{value || '--'}</span>
                },
            },
            {
                title: __('反馈类型'),
                dataIndex: 'feedback_type',
                key: 'feedback_type',
                width: 200,
                render: (value, record) => {
                    return <TypeView type={value} />
                },
            },
            {
                title: __('反馈描述'),
                dataIndex: 'feedback_desc',
                key: 'feedback_desc',
                ...commonProps,
            },
            {
                title: __('反馈时间'),
                dataIndex: 'created_at',
                key: 'created_at',
                ...sortableColumn('created_at'),
                ...commonProps,
                render: (val: number) => (val ? formatTime(val) : '--'),
            },
            {
                title: __('回复时间'),
                dataIndex: 'replied_at',
                key: 'replied_at',
                ...sortableColumn('replied_at'),
                ...commonProps,
                render: (val: number) => (val ? formatTime(val) : '--'),
            },
            {
                title: __('操作'),
                key: 'action',
                width: FeedbackTabMap[menu].actionWidth,
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
            FeedbackTabMap[menu].columnKeys.includes(col.key),
        )
    }, [menu, tableSort])

    // 关键字搜索
    const handleKwSearch = (kw) => {
        if (kw === searchCondition?.keyword) return
        setSearchCondition({
            ...searchCondition,
            keyword: kw,
            offset: 1,
        } as DCFeedbackReq)
    }

    // 轻量级搜索改变
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
            } as DCFeedbackReq)
        } else {
            setSearchCondition({
                ...searchCondition,
                offset: 1,
                [key]: undefined,
            } as DCFeedbackReq)
        }
    }

    // 筛选顺序变化
    const onChangeMenuToTableSort = (selectedMenu) => {
        const newSort: any = {
            catalog_title: null,
            created_at: null,
            replied_at: null,
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
        } as DCFeedbackReq)
        onChangeMenuToTableSort(selectedMenu)
    }

    // 刷新
    const handleRefresh = (refresh: boolean = true) => {
        setSearchCondition({
            ...searchCondition,
            offset: refresh ? 1 : searchCondition?.offset,
        } as DCFeedbackReq)
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        const newSort = {
            catalog_title: null,
            created_at: null,
            replied_at: null,
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
        if (extra.action === 'sort' && !!sorter.column) {
            const selectedMenu = handleTableChange(sorter)
            setSelectedSort(selectedMenu)
            setSearchCondition({
                ...searchCondition,
                sort: selectedMenu.key,
                direction: selectedMenu.sort,
                offset: 1,
            } as DCFeedbackReq)
        }
    }

    // 分页改变
    const onPaginationChange = (page, pageSize) => {
        setSearchCondition({
            ...searchCondition,
            offset: page || 1,
            limit: pageSize,
        } as DCFeedbackReq)
    }

    // 回复成功
    const handleReplySuccess = () => {
        setReplyVisible(false)
        handleRefresh()
        if (onReplySuccess && isFunction(onReplySuccess)) {
            onReplySuccess()
        }
    }

    // 顶部左侧操作
    const leftOperate = (
        <div className={styles.topLeft}>
            <div className={styles.feedbackTitle}>
                {FeedbackTabMap[menu].title}
            </div>
        </div>
    )

    const getFormData = () => {
        let formData = [
            {
                label: __('反馈类型'),
                key: 'feedback_type',
                options: feedbackTypeOptions,
                type: SearchType.Radio,
            },
        ]
        let defaultValue: any = {
            feedback_type: '',
        }
        if (menu === FeedbackMenuEnum.MyFeedback) {
            defaultValue = {
                status: '',
                feedback_type: '',
            }
            formData = [
                {
                    label: __('状态'),
                    key: 'status',
                    options: feedbackStatusOptions,
                    type: SearchType.Radio,
                },
                ...formData,
            ]
        }
        return {
            formData,
            defaultValue,
        }
    }

    // 顶部右侧操作
    const rightOperate = (tableData.length > 0 || isSearchStatus) && (
        <div className={styles.topRight}>
            <Space size={8}>
                <SearchInput
                    value={searchCondition?.keyword}
                    style={{ width: 280 }}
                    placeholder={__('搜索数据资源目录名称、编码')}
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
                    formData={getFormData().formData}
                    onChange={handleLightWeightSearchChange}
                    defaultValue={getFormData().defaultValue}
                />
                <SortBtn
                    contentNode={
                        <DropDownFilter
                            menus={FeedbackTabMap[menu].sortMenus}
                            defaultMenu={FeedbackTabMap[menu].defaultMenu}
                            menuChangeCb={handleMenuChange}
                            changeMenu={selectedSort}
                        />
                    }
                />
                <RefreshBtn onClick={handleRefresh} />
            </Space>
        </div>
    )

    return (
        <div className={styles.feedbackContent}>
            {loading ? (
                renderLoader()
            ) : (
                <>
                    <div className={styles.feedbackOperation}>
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
                            onChange={onTableChange}
                            scroll={{
                                x: columns.length * 180,
                                y: scrollY,
                            }}
                            pagination={{
                                total,
                                pageSize: searchCondition?.limit,
                                current: searchCondition?.offset,
                                showQuickJumper: true,
                                onChange: (page, pageSize) =>
                                    onPaginationChange(page, pageSize),
                                showSizeChanger: true,
                                showTotal: (count) =>
                                    __('共${count}条', { count }),
                            }}
                            locale={{ emptyText: <Empty /> }}
                        />
                    )}
                </>
            )}

            {detailsVisible ? (
                <Details
                    open={detailsVisible}
                    item={operateItem}
                    onDetailsClose={() => setDetailsVisible(false)}
                />
            ) : null}

            {replyVisible ? (
                <Reply
                    open={replyVisible}
                    item={operateItem}
                    onReplySuccess={handleReplySuccess}
                    onReplyClose={() => setReplyVisible(false)}
                />
            ) : null}
        </div>
    )
}

export default FeedbackTable
