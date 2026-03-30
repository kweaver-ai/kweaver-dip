import { Space, Table } from 'antd'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useUpdateEffect } from 'ahooks'
import { trim, omit, isFunction } from 'lodash'
import {
    Empty,
    LightweightSearch,
    OptionBarTool,
    OptionMenuType,
    SearchInput,
} from '@/ui'
import DropDownFilter from '../../DropDownFilter'
import {
    SortDirection,
    formatError,
    getFeedbackListResMode,
    FeedbackReqResMode,
    FeedbackStatus,
    ResType,
} from '@/core'
import { formatTime } from '@/utils'
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
    FeedbackTypeView,
    FeedbackMenuEnum,
    indicatorTypeMap,
    resTypeMap,
} from '../helper'
import Details from '../operate/Details'
import Reply from '../operate/Reply'
import __ from '../locale'
import styles from '../styles.module.less'
import IndicatorViewDetail from '@/components/DataAssetsCatlg/IndicatorViewDetail'
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'
import ApplicationServiceDetail from '@/components/DataAssetsCatlg/ApplicationServiceDetail'

const FeedbackTable: React.FC<{
    menu: FeedbackMenuEnum
    scrollY?: string
    onReplySuccess?: () => void
    resType?: any
}> = ({ menu, scrollY = 'calc(100vh - 292px)', onReplySuccess, resType }) => {
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
    // 搜索条件
    const [searchCondition, setSearchCondition] = useState<FeedbackReqResMode>()
    // 表头排序
    const [tableSort, setTableSort] = useState<any>(
        FeedbackTabMap[menu].defaultTableSort,
    )
    // 下拉排序
    const [selectedSort, setSelectedSort] = useState<any>(
        FeedbackTabMap[menu].defaultMenu,
    )

    // 回复弹窗
    const [replyVisible, setReplyVisible] = useState(false)
    // 反馈详情弹窗
    const [detailsVisible, setDetailsVisible] = useState(false)
    // 逻辑视图详情弹窗
    const [dataViewDetailsVisible, setDataViewDetailsVisible] = useState(false)
    // 接口服务详情弹窗
    const [interfaceSvcDetailsVisible, setInterfaceSvcDetailsVisible] =
        useState(false)
    // 指标详情弹窗
    const [indicatorDetailsVisible, setIndicatorDetailsVisible] =
        useState(false)

    // 获取 搜索条件
    const searchConditionRef = useRef(searchCondition)
    const searchRef = useRef<any>(null)

    useEffect(() => {
        // 初始化搜索条件
        const { initSearch } = FeedbackTabMap[menu]
        setSearchCondition({ ...initSearch, res_type: resType })
    }, [menu, resType])

    useEffect(() => {
        searchConditionRef.current = searchCondition
    }, [searchCondition])

    // 是否有过滤值
    const isSearchStatus = useMemo(() => {
        const ignoreAttr = FeedbackTabMap[menu].ignoreSearchAttr
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
            const res = await getFeedbackListResMode(params)
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
            case FeedbackOperate.FeedbackDetails:
                setDetailsVisible(true)
                break

            case FeedbackOperate.Reply:
                setReplyVisible(true)
                break

            case FeedbackOperate.Details:
                if (record?.res_type === ResType.DataView) {
                    setDataViewDetailsVisible(true)
                } else if (record?.res_type === ResType.InterfaceSvc) {
                    setInterfaceSvcDetailsVisible(true)
                } else if (record?.res_type === ResType.Indicator) {
                    setIndicatorDetailsVisible(true)
                }
                break

            default:
                break
        }
    }

    // 表格操作项
    const getTableOptions = (record?: any) => {
        // 1. 待办：只显示 Reply
        if (menu === FeedbackMenuEnum.Pending) {
            return [
                {
                    key: FeedbackOperate.Reply,
                    label: __('回复'),
                    menuType: OptionMenuType.Menu,
                },
            ]
        }

        // 2. 已办：只显示 Details
        if (menu === FeedbackMenuEnum.Handled) {
            return [
                {
                    key: FeedbackOperate.FeedbackDetails,
                    label: __('反馈详情'),
                    menuType: OptionMenuType.Menu,
                },
            ]
        }

        // 3. 我的反馈（逻辑视图、接口服务、指标）根据状态判断
        if (
            menu === FeedbackMenuEnum.DataView ||
            menu === FeedbackMenuEnum.InterfaceSvc ||
            menu === FeedbackMenuEnum.Indicator
        ) {
            return [
                {
                    key: FeedbackOperate.FeedbackDetails,
                    label: __('反馈详情'),
                    menuType: OptionMenuType.Menu,
                },
            ]
        }

        return []
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
                        mainTitle={__('资源名称')}
                        subTitle={__('（编码）')}
                    />
                ),
                dataIndex: 'res_title',
                key: 'res_title',
                ...sortableColumn('res_title'),
                ...commonProps,
                width: 300,
                render: (value, record) => (
                    <MultiColumn
                        record={record}
                        onClick={() =>
                            handleOptionTable(FeedbackOperate.Details, record)
                        }
                    />
                ),
            },
            {
                title: __('资源类型'),
                dataIndex: 'res_type',
                key: 'res_type',
                width: 100,
                render: (value, record) =>
                    resTypeMap[record?.res_type]?.text || '--',
            },
            {
                title: __('指标类型'),
                dataIndex: 'indicator_type',
                key: 'indicator_type',
                width: 100,
                render: (value, record) =>
                    indicatorTypeMap[record?.indicator_type]?.text || '--',
            },
            {
                title: __('状态'),
                dataIndex: 'status',
                key: 'status',
                width: 100,
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
                width: 140,
                render: (value, record) => {
                    return <FeedbackTypeView type={value} />
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
                            menus={getTableOptions(record) as any[]}
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
    }, [menu, tableSort, searchCondition])

    // 关键字搜索
    const handleKwSearch = (kw) => {
        if (kw === searchCondition?.keyword) return
        setSearchCondition({
            ...searchCondition,
            keyword: kw,
            offset: 1,
        } as FeedbackReqResMode)
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
            res_title: null,
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
        } as FeedbackReqResMode)
        onChangeMenuToTableSort(selectedMenu)
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        const newSort = {
            res_title: null,
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
        const selectedMenu = handleTableChange(sorter)
        setSelectedSort(selectedMenu)
        setSearchCondition({
            ...searchCondition,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            offset: currentPagination?.current || 1,
            limit: currentPagination?.pageSize || 10,
        } as FeedbackReqResMode)
    }

    // 刷新
    const handleRefresh = (refresh: boolean = true) => {
        setSearchCondition({
            ...searchCondition,
            offset: refresh ? 1 : searchCondition?.offset,
        } as FeedbackReqResMode)
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
                    formData={FeedbackTabMap[menu].searchFormData}
                    onChange={handleLightWeightSearchChange}
                    defaultValue={FeedbackTabMap[menu].defaultSearch}
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
                                // x: columns.length * 180,
                                y: scrollY,
                            }}
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

            {detailsVisible && operateItem ? (
                <Details
                    open={detailsVisible}
                    item={operateItem}
                    onDetailsClose={() => setDetailsVisible(false)}
                />
            ) : null}

            {replyVisible && operateItem ? (
                <Reply
                    open={replyVisible}
                    item={operateItem}
                    onReplySuccess={handleReplySuccess}
                    onReplyClose={() => setReplyVisible(false)}
                />
            ) : null}

            {dataViewDetailsVisible && operateItem ? (
                <LogicViewDetail
                    open={dataViewDetailsVisible}
                    onClose={() => {
                        setDataViewDetailsVisible(false)
                    }}
                    id={operateItem?.res_id}
                    canChat
                    hasAsst
                />
            ) : null}

            {indicatorDetailsVisible && operateItem ? (
                <IndicatorViewDetail
                    open={indicatorDetailsVisible}
                    id={operateItem?.res_id}
                    onClose={() => {
                        setIndicatorDetailsVisible(false)
                    }}
                    indicatorType={operateItem?.indicator_type || ''}
                    canChat
                    hasAsst
                />
            ) : null}

            {interfaceSvcDetailsVisible && operateItem ? (
                <ApplicationServiceDetail
                    open={interfaceSvcDetailsVisible}
                    onClose={() => {
                        setInterfaceSvcDetailsVisible(false)
                    }}
                    serviceCode={operateItem?.res_id}
                    hasAsst
                />
            ) : null}
        </div>
    )
}

export default FeedbackTable
