import { useAntdTable } from 'ahooks'
import { Button, message, Space, Table, Tooltip } from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import { isNumber, omit } from 'lodash'
import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import { OperateType } from '@/utils'
import Empty from '@/ui/Empty'
import { LightweightSearch, Loader, SearchInput } from '@/ui'
import {
    formatError,
    getWorkOrder,
    SortDirection,
    updateQualityReportRemind,
} from '@/core'

import dataEmpty from '@/assets/dataEmpty.svg'
import DropDownFilter from '@/components/DropDownFilter'
import { FixedType } from '@/components/CommonTable/const'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import {
    CommonOrderStatusOptions,
    OrderType,
    PriorityOptions,
    StatusType,
} from '../helper'
import FeedbackModal from '../WorkOrderType/QualityOrder/FBModal'
import ImprovmentCards from '../WorkOrderType/QualityOrder/ImprovmentCards'
import DetailModal from './DetailModal'
import {
    DefaultMenu,
    getOptionState,
    initSearchCondition,
    QualitySearchFilter,
} from './helper'
import __ from './locale'
import OptModal from './OptModal'
import styles from './styles.module.less'
import TransferModal from './TransferModal'
import { getDepartName } from '../WorkOrderProcessing/helper'

const DataQualityWorkOrder = () => {
    const [currentType, setCurrentType] = useState<any>()
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
        type: OrderType.QUALITY,
    })

    const [tableHeight, setTableHeight] = useState<number>(0)
    const [initSearch, setInitSearch] = useState<boolean>(true)

    const hasSearchCondition = useMemo(() => {
        const ignoreKeys = ['limit', 'offset', 'current', 'sort', 'direction']
        const hasSearch = Object.values(omit(searchCondition, ignoreKeys)).some(
            (item) => item,
        )
        return hasSearch
    }, [searchCondition])

    useEffect(() => {
        // 展开/收起查询条件高度
        const defalutHeight: number = 276
        // 已选搜索条件高度
        const searchConditionHeight: number = hasSearchCondition ? 41 : 0
        const cardHeight = 80 + 16
        const height = defalutHeight + searchConditionHeight + cardHeight

        setTableHeight(height)
    }, [hasSearchCondition])

    useEffect(() => {
        run({
            ...searchCondition,
            current: searchCondition.offset,
            type: OrderType.QUALITY,
        })
    }, [])

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
            run({
                ...searchCondition,
                current: searchCondition.offset,
            })
        }
    }, [searchCondition])

    const [current, setCurrent] = useState<any>()
    const [detailVisible, setDetailVisible] = useState<boolean>(false)
    const [optOpen, setOptOpen] = useState<boolean>(false)
    const [transferOpen, setTransferOpen] = useState<boolean>(false)
    const [feedbackOpen, setFeedbackOpen] = useState<boolean>(false)

    const handleRemind = async (_id: string) => {
        try {
            await updateQualityReportRemind(_id)
            message.success(__('催办成功'))
            // 刷新
            run({ ...searchCondition })
        } catch (error) {
            formatError(error)
        }
    }

    const handleOperate = async (op: OperateType, item: any) => {
        setCurrentType(item?.type)
        switch (op) {
            case OperateType.DETAIL:
                setCurrent(item)
                setDetailVisible(true)
                break
            case OperateType.MOVE:
                // 转派
                setCurrent(item)
                setTransferOpen(true)
                break
            case OperateType.REPORT:
                // 反馈
                setCurrent(item)
                setFeedbackOpen(true)
                break
            case OperateType.EXECUTE:
                // 催办
                handleRemind(item?.work_order_id)
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
                    <span>{__('整改单名称')}</span>
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
            width: 220,
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
            title: __('状态'),
            dataIndex: 'status',
            key: 'status',
            ellipsis: true,
            render: (text, record) =>
                getOptionState(text, CommonOrderStatusOptions),
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
            title: __('数源部门'),
            dataIndex: 'data_source_department',
            key: 'data_source_department',
            ellipsis: true,
            render: (text: string, record) => {
                const departName = getDepartName(text)
                return (
                    <div className={styles.ellipsisTitle} title={text}>
                        {departName || '--'}
                    </div>
                )
            },
        },
        {
            title: __('处理人'),
            dataIndex: 'responsible_uname',
            key: 'responsible_uname',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.ellipsisTitle} title={text}>
                    {text || '--'}
                </div>
            ),
        },

        {
            title: __('截止日期'),
            dataIndex: 'finished_at',
            key: 'finished_at',
            ellipsis: true,
            render: (text, record) => {
                const finishTime =
                    isNumber(record?.finished_at) && record?.finished_at
                        ? moment(record.finished_at * 1000).format('YYYY-MM-DD')
                        : undefined
                const daysRemaining = record?.days_remaining

                const remainingTip =
                    daysRemaining > 0
                        ? `将于${daysRemaining}天后到期`
                        : daysRemaining < 0
                        ? `已逾期${-daysRemaining}天`
                        : '已到期'

                return (
                    <div>
                        <div>{finishTime || '--'}</div>
                        <div
                            hidden={!finishTime || daysRemaining === null}
                            style={{
                                color: 'rgba(245, 34, 45, 1)',
                                fontSize: 12,
                            }}
                        >
                            {remainingTip}
                        </div>
                    </div>
                )
            },
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
            title: __('操作'),
            key: 'action',
            width: 200,
            fixed: FixedType.RIGHT,
            render: (_: string, record) => {
                // 已完成
                const isFinished = record?.status === StatusType.COMPLETED

                const btnList: any[] = [
                    {
                        key: OperateType.DETAIL,
                        label: __('详情'),
                        show: true,
                    },
                    // {
                    //     key: OperateType.MOVE,
                    //     label: __('转派'),
                    //     show: !isFinished,
                    // },
                    {
                        key: OperateType.REPORT,
                        label: __('反馈'),
                        show: isFinished,
                        tip: __('已反馈'),
                        disabled: record?.score > 0,
                    },
                    {
                        key: OperateType.EXECUTE,
                        label: __('催办'),
                        show: !isFinished,
                        tip: __('已催办'),
                        disabled: record?.remind === 1,
                    },
                ]
                return (
                    <Space size={16} className={styles.oprColumn}>
                        {btnList
                            .filter((o) => o.show)
                            .map((item) => {
                                return (
                                    <Tooltip
                                        title={
                                            item?.disabled && item?.tip
                                                ? item?.tip
                                                : ''
                                        }
                                        placement="bottom"
                                    >
                                        <Button
                                            type="link"
                                            key={item.key}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleOperate(item.key, record)
                                            }}
                                            disabled={item?.disabled}
                                        >
                                            {item.label}
                                        </Button>
                                    </Tooltip>
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
                        <div> {__('点击【新建】可新建工单')}</div>
                    </div>
                }
                iconSrc={dataEmpty}
            />
        )
    }

    const pageChange = async (offset, limit) => {
        setSearchCondition({
            ...searchCondition,
            offset,
            limit,
        })
    }

    return (
        <div className={styles['work-orders']}>
            <div>
                <ImprovmentCards />
            </div>
            <div className={styles['operate-container']}>
                <div className={styles['operate-left']} />
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
                        <LightweightSearch
                            formData={QualitySearchFilter}
                            onChange={(data, key) => {
                                if (key === 'priority') {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        priority: data.priority || undefined,
                                    })
                                } else if (key === 'status') {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        status: data.status || undefined,
                                    })
                                } else {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        priority: undefined,
                                        status: undefined,
                                    })
                                }
                            }}
                            defaultValue={{
                                priority: undefined,
                                status: undefined,
                            }}
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
                            className={styles.isExpansion}
                            rowClassName={styles.tableRow}
                            columns={columns}
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
            {optOpen && (
                <OptModal
                    id={current?.work_order_id}
                    visible={optOpen}
                    type={currentType}
                    onClose={(refresh?: boolean) => {
                        if (refresh) {
                            run({ ...searchCondition })
                        }
                        setOptOpen(false)
                        setCurrent(undefined)
                    }}
                />
            )}
            {transferOpen && (
                <TransferModal
                    item={current}
                    visible={transferOpen}
                    isWorkOrder={false}
                    onClose={(refresh?: boolean) => {
                        if (refresh) {
                            run({ ...searchCondition })
                        }
                        setTransferOpen(false)
                        setCurrent(undefined)
                    }}
                />
            )}
            {feedbackOpen && (
                <FeedbackModal
                    item={current}
                    visible={feedbackOpen}
                    onClose={(refresh?: boolean) => {
                        if (refresh) {
                            run({ ...searchCondition })
                        }
                        setFeedbackOpen(false)
                        setCurrent(undefined)
                    }}
                />
            )}
            {detailVisible && (
                <DetailModal
                    id={current?.work_order_id}
                    type={currentType}
                    onClose={() => {
                        setDetailVisible(false)
                        setCurrent(undefined)
                    }}
                />
            )}
        </div>
    )
}

export default DataQualityWorkOrder
