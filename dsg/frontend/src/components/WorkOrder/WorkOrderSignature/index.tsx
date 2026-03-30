import { useAntdTable } from 'ahooks'
import { Button, Popconfirm, Space, Table } from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import { isNumber } from 'lodash'
import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import { FixedType } from '@/components/CommonTable/const'
import PopList from '@/components/DataPlanManage/PopList'
import DropDownFilter from '@/components/DropDownFilter'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import { formatError, getWorkOrderAcceptance, SortDirection } from '@/core'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { Loader, SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import { OperateType } from '@/utils'
import {
    AllShowOrderType,
    getOptionState,
    OrderType,
    OrderTypeOptions,
    PriorityOptions,
} from '../helper'
import DetailModal from '../WorkOrderManage/DetailModal'
import { DefaultMenu, initSearchCondition } from './helper'
import __ from './locale'
import styles from './styles.module.less'

const WorkOrderSignature = ({ orderType }: { orderType?: OrderType }) => {
    const [currentTab, setCurrentTab] = useState<any>()
    const [loading, setLoading] = useState<boolean>(true)
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        createTime: 'descend',
    })

    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(DefaultMenu)

    const [searchCondition, setSearchCondition] = useState<any>({
        ...initSearchCondition,
        type: orderType || AllShowOrderType.join(','),
    })

    useEffect(() => {
        setSearchCondition((prev) => ({
            ...prev,
            offset: 1,
            type: currentTab || AllShowOrderType.join(','),
        }))
    }, [currentTab])

    useEffect(() => {
        setCurrentTab(orderType)
    }, [orderType])

    const [searchIsExpansion, setSearchIsExpansion] = useState<boolean>(false)

    const [tableHeight, setTableHeight] = useState<number>(0)
    const [initSearch, setInitSearch] = useState<boolean>(true)

    const hasSearchCondition = useMemo(() => {
        return searchCondition.keyword
    }, [searchCondition])

    useEffect(() => {
        // 展开/收起查询条件高度
        const defalutHeight: number = !searchIsExpansion ? 276 : 384
        // 已选搜索条件高度
        const searchConditionHeight: number = hasSearchCondition ? 41 : 0
        const height = defalutHeight + searchConditionHeight

        setTableHeight(height)
    }, [hasSearchCondition, searchIsExpansion])

    useEffect(() => {
        run({ ...searchCondition, current: searchCondition.offset })
    }, [])

    // 工单签收查询
    const getDataList = async (params) => {
        try {
            setLoading(true)
            const obj = params
            const res = await getWorkOrderAcceptance(obj)
            return { total: res.total_count, list: res.entries }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setLoading(false)
            setSelectedSort(undefined)
            setInitSearch(false)
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getDataList, {
        defaultPageSize: 10,
        manual: true,
    })

    useEffect(() => {
        if (!initSearch) {
            run({ ...searchCondition, current: searchCondition.offset })
        }
    }, [searchCondition])

    const [curWorkOrder, setCurWorkOrder] = useState<any>()
    const [detailVisible, setDetailVisible] = useState<boolean>(false)

    const handleOperate = async (op: OperateType, item: any) => {
        switch (op) {
            case OperateType.DETAIL:
                setCurWorkOrder(item)
                setDetailVisible(true)
                break
            default:
                break
        }
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            if (sorter.columnKey === 'created_at') {
                setTableSort({
                    createTime: sorter.order || 'ascend',
                })
            } else {
                setTableSort({
                    createTime: null,
                })
            }
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
                    createTime: 'descend',
                })
            } else {
                setTableSort({
                    createTime: 'ascend',
                })
            }
        } else if (searchCondition.sort === SortDirection.ASC) {
            setTableSort({
                createTime: null,
            })
        } else {
            setTableSort({
                createTime: null,
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
            width: 300,
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.titleBox}>
                    <div className={styles.planTitle}>
                        <div
                            title={text}
                            onClick={() =>
                                handleOperate(OperateType.DETAIL, record)
                            }
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
            title: __('类型'),
            dataIndex: 'type',
            key: 'type',
            ellipsis: true,
            render: (text, record) =>
                OrderTypeOptions.find((o) => o.value === text)?.label ?? '--',
        },
        {
            title: __('优先级'),
            dataIndex: 'priority',
            key: 'priority',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.ellipsisTitle}>
                    {getOptionState(text, PriorityOptions)}
                </div>
            ),
        },
        {
            title: __('截止日期'),
            dataIndex: 'finished_at',
            key: 'finished_at',
            ellipsis: true,
            render: (text, record) => {
                const endTime =
                    isNumber(record?.finished_at) && record?.finished_at
                        ? moment(record.finished_at * 1000).format('YYYY-MM-DD')
                        : '--'
                return <div className={styles.ellipsisTitle}>{endTime}</div>
            },
        },
        {
            title: __('来源'),
            dataIndex: 'source_name',
            key: 'source_name',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.linkTitle} title={text}>
                    {['', 'standalone'].includes(record?.source_type) ? (
                        '--'
                    ) : (
                        <>
                            {record?.source_id && (
                                <FontIcon
                                    name={
                                        record?.source_type === 'plan'
                                            ? 'icon-jihua'
                                            : 'icon-shujubiaoshitu'
                                    }
                                    type={IconType.COLOREDICON}
                                />
                            )}

                            <PopList
                                popTitle={
                                    record?.source_type === 'plan'
                                        ? __('来源计划')
                                        : __('来源业务表')
                                }
                                popContent={
                                    record?.source_type === 'plan'
                                        ? text
                                        : record?.data_aggregation_inventory?.business_forms
                                              ?.map((o) => o?.name || '')
                                              .filter((o) => !!o)
                                              .join('、')
                                }
                            >
                                <span className={styles.link}>
                                    {record?.source_type === 'plan'
                                        ? text || '--'
                                        : record?.data_aggregation_inventory?.business_forms
                                              ?.map((o) => o?.name || '')
                                              .filter((o) => !!o)
                                              .join('、') || '--'}
                                </span>
                            </PopList>
                        </>
                    )}
                </div>
            ),
        },
        {
            title: __('创建人'),
            dataIndex: 'created_by',
            key: 'created_by',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.ellipsisTitle} title={text}>
                    {text || '--'}
                </div>
            ),
        },
        {
            title: __('创建时间'),
            dataIndex: 'created_at',
            key: 'created_at',
            ellipsis: true,
            sorter: true,
            width: 180,
            sortOrder: tableSort.createTime,
            showSorterTooltip: false,
            render: (text: any) => {
                return isNumber(text) && text
                    ? moment(text).format('YYYY-MM-DD HH:mm:ss')
                    : '--'
            },
        },

        {
            title: __('操作'),
            key: 'action',
            width: 160,
            fixed: FixedType.RIGHT,
            render: (_: string, record) => {
                const btnList: any[] = [
                    {
                        key: OperateType.DETAIL,
                        label: __('详情'),
                    },
                ]
                return (
                    <Space size={16} className={styles.oprColumn}>
                        {btnList.map((item) => {
                            return (
                                <Popconfirm
                                    title={item.tip}
                                    placement="bottom"
                                    okText={__('确定')}
                                    cancelText={__('取消')}
                                    onConfirm={() => {
                                        handleOperate(item.key, record)
                                    }}
                                    disabled={!item.tip}
                                    overlayClassName={styles.popconfirmTips}
                                    key={item.key}
                                >
                                    <Button
                                        type="link"
                                        key={item.key}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (
                                                item.key === OperateType.EXECUTE
                                            ) {
                                                return
                                            }
                                            handleOperate(item.key, record)
                                        }}
                                    >
                                        {item.label}
                                    </Button>
                                </Popconfirm>
                            )
                        })}
                    </Space>
                )
            },
        },
    ]

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition({
            ...searchCondition,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            offset: 1,
        })
        setSelectedSort(selectedMenu)
        onChangeMenuToTableSort(selectedMenu)
    }

    const onChangeMenuToTableSort = (selectedMenu) => {
        switch (selectedMenu.key) {
            case 'created_at':
                setTableSort({
                    createTime:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                })
                break
            default:
                setTableSort({
                    createTime: null,
                })
                break
        }
    }

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

    const switchTab = (key?: string) => {
        setCurrentTab(key)
    }

    // 翻页
    const pageChange = async (offset, limit) => {
        setSearchCondition({
            ...searchCondition,
            offset,
            limit,
        })
    }

    const curColumns = useMemo(() => {
        return orderType ? columns?.filter((o) => o.key !== 'type') : columns
    }, [orderType, tableSort])

    return (
        <div className={styles['work-order-signature']}>
            <div className={styles['operate-container']}>
                <div>
                    <div className={styles['opt-tab']} hidden={!!orderType}>
                        <span
                            className={
                                !currentTab ? styles['is-check'] : undefined
                            }
                            onClick={() => switchTab()}
                        >
                            全部
                        </span>
                        {OrderTypeOptions.map((it) => (
                            <span
                                onClick={() => switchTab(it.value)}
                                className={
                                    currentTab === it.value
                                        ? styles['is-check']
                                        : undefined
                                }
                            >
                                {it?.label}
                            </span>
                        ))}
                    </div>
                </div>
                <Space size={16}>
                    <Space size={8}>
                        <SearchInput
                            className={styles.nameInput}
                            style={{ width: 272 }}
                            placeholder={__('搜索工单名称、编号')}
                            onKeyChange={(kw: string) =>
                                setSearchCondition({
                                    ...searchCondition,
                                    keyword: kw,
                                    offset: 1,
                                })
                            }
                        />
                    </Space>
                    <span>
                        <SortBtn
                            contentNode={
                                <DropDownFilter
                                    menus={[DefaultMenu]}
                                    defaultMenu={DefaultMenu}
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
                <Loader />
            ) : (
                <div className={styles.table}>
                    {tableProps.dataSource.length === 0 &&
                    !hasSearchCondition ? (
                        <div className={styles.emptyWrapper}>
                            {renderEmpty()}
                        </div>
                    ) : (
                        <Table
                            className={classnames(
                                !searchIsExpansion && styles.isExpansion,
                            )}
                            rowClassName={styles.tableRow}
                            columns={curColumns}
                            {...tableProps}
                            rowKey="work_order_id"
                            scroll={{
                                x: 1340,
                                y:
                                    tableProps.dataSource.length === 0
                                        ? undefined
                                        : `calc(100vh - ${tableHeight}px)`,
                            }}
                            pagination={{
                                ...tableProps.pagination,
                                onChange: pageChange,
                                hideOnSinglePage:
                                    (tableProps.pagination.total || 0) <= 10,
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
                                emptyText: <Empty />,
                            }}
                            onChange={(newPagination, filters, sorter) => {
                                if (
                                    newPagination.current ===
                                        searchCondition.offset &&
                                    newPagination.pageSize ===
                                        searchCondition.limit
                                ) {
                                    const selectedMenu =
                                        handleTableChange(sorter)
                                    setSelectedSort(selectedMenu)
                                    setSearchCondition({
                                        ...searchCondition,
                                        sort: selectedMenu.key,
                                        direction: selectedMenu.sort,
                                        offset: 1,
                                    })
                                } else {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: newPagination?.current || 1,
                                        limit: newPagination?.pageSize || 10,
                                    })
                                }
                            }}
                        />
                    )}
                </div>
            )}
            {detailVisible && (
                <DetailModal
                    id={curWorkOrder?.work_order_id}
                    type={curWorkOrder?.type}
                    onClose={() => {
                        setDetailVisible(false)
                        setCurWorkOrder(undefined)
                    }}
                />
            )}
        </div>
    )
}

export default WorkOrderSignature
