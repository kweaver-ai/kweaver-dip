import { useAntdTable } from 'ahooks'
import { Button, message, Popconfirm, Space, Table, Tooltip } from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import { omit } from 'lodash'
import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import { OperateType } from '@/utils'
import Empty from '@/ui/Empty'
import { LightweightSearch, Loader, SearchInput } from '@/ui'
import { IconType } from '@/icons/const'
import { FontIcon } from '@/icons'
import {
    cancelWorkOrderAudit,
    deleteWorkOrder,
    formatError,
    getWorkOrderByResponsible,
    SortDirection,
    updateWorkOrderStatus,
} from '@/core'

import dataEmpty from '@/assets/dataEmpty.svg'
import { FixedType } from '@/components/CommonTable/const'
import PlanCollectionDetail from '@/components/DataPlanManage/PlanCollection/DetailModal'
import PlanProcessingDetail from '@/components/DataPlanManage/PlanProcessing/DetailModal'
import PlanUnderstandingDetail from '@/components/DataPlanManage/PlanUnderstanding/DetailModal'
import PopList from '@/components/DataPlanManage/PopList'
import DropDownFilter from '@/components/DropDownFilter'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import {
    AllShowOrderType,
    OrderStatusOptions,
    OrderType,
    OrderTypeOptions,
    PriorityOptions,
    StatusType,
} from '../helper'
import ToComplete from '../WorkOrderProcessing/ToComplete'
import ToProcess from '../WorkOrderProcessing/ToProcess'
import DetailModal from './DetailModal'
import {
    DefaultMenu,
    getOptionState,
    initSearchCondition,
    SearchFilter,
    SourceTypeEnum,
    SourceTypeMap,
} from './helper'
import __ from './locale'
import OptModal from './OptModal'
import styles from './styles.module.less'
import TransferModal from './TransferModal'

export const renderPlanOrder = (
    items: {
        task_id: string
        task_name: string
    }[],
) => {
    return (
        <div>
            {items?.map((item, idx) => {
                return (
                    <div className={styles['sigle-line']} key={item?.task_id}>
                        {idx + 1}、{item?.task_name}
                        {/* <span>{__('查看详情')}</span> */}
                    </div>
                )
            })}
        </div>
    )
}

/**
 * 我负责的
 */
const ResponsibleWorkOrder = ({ orderType }: { orderType?: OrderType }) => {
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
        type: orderType || AllShowOrderType.join(','),
    })
    const [optCompleteOpen, setOptCompleteOpen] = useState<boolean>(false)
    const [optTodoOpen, setOptTodoOpen] = useState<boolean>(false)

    const [tableHeight, setTableHeight] = useState<number>(0)
    const [initSearch, setInitSearch] = useState<boolean>(true)

    const hasSearchCondition = useMemo(() => {
        const ignoreKeys = ['limit', 'offset', 'current', 'sort', 'direction']
        if (orderType) {
            ignoreKeys.push('type')
        }
        const hasSearch = Object.values(omit(searchCondition, ignoreKeys)).some(
            (item) => item,
        )
        return orderType
            ? hasSearch
            : hasSearch && searchCondition.type !== AllShowOrderType.join(',')
    }, [searchCondition])

    useEffect(() => {
        // 展开/收起查询条件高度
        const defalutHeight: number = 276
        // 已选搜索条件高度
        const searchConditionHeight: number = hasSearchCondition ? 41 : 0
        const height = defalutHeight + searchConditionHeight

        setTableHeight(height)
    }, [hasSearchCondition])

    useEffect(() => {
        run({
            ...searchCondition,
            current: searchCondition.offset,
            type: orderType || AllShowOrderType.join(','),
        })
    }, [orderType])

    // 工单查询
    const getDataList = async (params) => {
        try {
            setLoading(true)
            const obj = params
            const res = await getWorkOrderByResponsible(obj)
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
    const [previewVisible, setPreviewVisible] = useState<boolean>(false)
    const [optOpen, setOptOpen] = useState<boolean>(false)
    const [transferOpen, setTransferOpen] = useState<boolean>(false)
    const [qualityExamineOpen, setQualityExamineOpen] = useState<boolean>(false)

    const handleDelete = async (id: string) => {
        try {
            await deleteWorkOrder(id)
            message.success(__('删除成功'))
        } catch (error) {
            formatError(error)
        } finally {
            run({
                ...searchCondition,
                offset:
                    tableProps.dataSource.length === 1
                        ? pagination.current! - 1 || 1
                        : pagination.current!,
            })
        }
    }

    const handleCancel = async (_id: string) => {
        try {
            await cancelWorkOrderAudit(_id)
            message.success(__('撤回成功'))
            // 刷新
            run({ ...searchCondition })
        } catch (error) {
            formatError(error)
        }
    }

    const handleSync = async (_id: string) => {
        try {
            // await syncWorkOrder(_id)
            message.success(__('同步成功'))
        } catch (error) {
            message.error(__('同步失败'))
        }
    }

    const handleComplete = async (_id: string) => {
        const params = {
            status: StatusType.COMPLETED,
        }
        try {
            await updateWorkOrderStatus(_id, params)
            message.success(__('确认成功'))
            run({ ...searchCondition })
        } catch (error) {
            formatError(error)
        }
    }

    const handleOperate = async (op: OperateType, item: any) => {
        setCurrentType(item?.type)
        const curItem = {
            ...item,
            work_order_id: item?.work_order_id || item?.id,
            responsible_uid: item?.responsible_user?.id,
            responsible_uname: item?.responsible_user?.name,
        }
        switch (op) {
            case OperateType.DETAIL:
                setCurrent(curItem)
                setDetailVisible(true)
                break
            case OperateType.EDIT:
                // 编辑
                setCurrent(curItem)
                setOptOpen(true)
                break
            case OperateType.MOVE:
                // 转派
                setCurrent(curItem)
                setTransferOpen(true)
                break
            case OperateType.QUALITY_EXAMINE:
                // 发起质量检测
                setCurrent(curItem)
                setQualityExamineOpen(true)
                break
            case OperateType.DELETE:
                // 删除
                handleDelete(curItem?.work_order_id)
                break
            case OperateType.RUN:
                // 开始处理
                setCurrent(curItem)
                setOptTodoOpen(true)
                break
            case OperateType.EXECUTE:
                // 理解工单等工单完成
                if (
                    [
                        OrderType.COMPREHENSION,
                        OrderType.RESEARCH_REPORT,
                        OrderType.DATA_CATALOG,
                        OrderType.FRONT_PROCESSORS,
                    ].includes(curItem?.type)
                ) {
                    setCurrent(curItem)
                    setOptCompleteOpen(true)
                    return
                }
                // 第三方直接完成
                handleComplete(curItem?.work_order_id)
                break
            case OperateType.PREVIEW:
                // 来源预览
                setCurrent(curItem)
                setPreviewVisible(true)
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
            width: 280,
            fixed: FixedType.LEFT,
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
            width: 120,
            render: (text, record) => getOptionState(text, OrderStatusOptions),
        },
        {
            title: __('类型'),
            dataIndex: 'type',
            key: 'type',
            ellipsis: true,
            width: 120,
            render: (text, record) =>
                OrderTypeOptions.find((o) => o.value === text)?.label ?? '--',
        },
        {
            title: __('优先级'),
            dataIndex: 'priority',
            key: 'priority',
            ellipsis: true,
            width: 120,
            render: (text, record) => (
                <div className={styles.ellipsisTitle}>
                    {getOptionState(text, PriorityOptions)}
                </div>
            ),
        },
        {
            title: __('责任人'),
            dataIndex: 'responsible_user',
            key: 'responsible_user',
            ellipsis: true,
            width: 150,
            render: (user, record) => (
                <div className={styles.ellipsisTitle} title={user?.name}>
                    {user?.name || '--'}
                </div>
            ),
        },
        {
            title:
                orderType === OrderType.QUALITY_EXAMINE
                    ? __('质量检测任务')
                    : __('工单任务'),
            dataIndex: 'work_order_task_count',
            key: 'work_order_task_count',
            ellipsis: true,
            width: 120,
            render: (task: any, record) => (
                <div
                    className={classnames(
                        styles.taskOrder,
                        task?.total > 0 && styles.hasTask,
                    )}
                    style={{ filter: `grayscale(${task?.total > 0 ? 0 : 1})` }}
                >
                    <FontIcon name="icon-renwu" type={IconType.COLOREDICON} />

                    {/* <PopList
                        popTitle={__('工单任务')}
                        popContent={
                            task?.total > 0 ? renderPlanOrder(task) : undefined
                        }
                    > */}
                    <span className={styles.taskCount}>{task?.total ?? 0}</span>
                    {/* </PopList> */}
                </div>
            ),
        },
        {
            title: __('任务完成进度'),
            dataIndex: 'work_order_task_count',
            key: 'work_order_task_count',
            ellipsis: true,
            width: 120,
            render: (tasks: any, record) => (
                <div className={styles.ellipsisTitle}>
                    {tasks?.completed ?? 0}/{tasks?.total ?? 0}
                </div>
            ),
        },
        // {
        //     title: __('来源'),
        //     dataIndex: 'sources',
        //     key: 'sources',
        //     ellipsis: true,
        //     width: 200,
        //     render: (arr: any[], record) => {
        //         const text = arr?.map((o) => o.name).join('、')
        //         const sourceType = arr?.[0]?.type

        //         const canDetail = [
        //             SourceTypeEnum.PLAN,
        //             SourceTypeEnum.AGGREGATION_WORK_ORDER,
        //         ].includes(sourceType)
        //         return (
        //             <div className={styles.linkTitle} title={text}>
        //                 {['', SourceTypeEnum.STANDALONE].includes(
        //                     sourceType,
        //                 ) ? (
        //                     '--'
        //                 ) : (
        //                     <>
        //                         {arr?.[0]?.id && (
        //                             <FontIcon
        //                                 name={
        //                                     SourceTypeMap?.[sourceType]
        //                                         ?.icon as string
        //                                 }
        //                                 style={{ fontSize: 16 }}
        //                                 type={IconType.COLOREDICON}
        //                             />
        //                         )}

        //                         <PopList
        //                             popTitle={
        //                                 SourceTypeMap?.[sourceType]?.label
        //                             }
        //                             popContent={text}
        //                         >
        //                             <span
        //                                 className={
        //                                     canDetail ? styles.link : undefined
        //                                 }
        //                                 style={{
        //                                     display: 'inline-block',
        //                                     overflow: 'hidden',
        //                                     textOverflow: 'ellipsis',
        //                                 }}
        //                                 onClick={() => {
        //                                     if (canDetail) {
        //                                         handleOperate(
        //                                             OperateType.PREVIEW,
        //                                             record,
        //                                         )
        //                                     }
        //                                 }}
        //                             >
        //                                 {text || '--'}
        //                             </span>
        //                         </PopList>
        //                     </>
        //                 )}
        //             </div>
        //         )
        //     },
        // },
        {
            title: __('截止日期'),
            dataIndex: 'finished_at',
            key: 'finished_at',
            width: 120,
            ellipsis: true,
            render: (text, record) => {
                return record?.finished_at
                    ? moment(record.finished_at).format('YYYY-MM-DD')
                    : '--'
            },
        },
        {
            title: __('创建人'),
            dataIndex: 'creator_name',
            key: 'creator_name',
            ellipsis: true,
            width: 120,
            render: (text, record) => (
                <div className={styles.ellipsisTitle} title={text}>
                    {text || '--'}
                </div>
            ),
        },
        {
            title: __('操作'),
            key: 'action',
            width: 260,
            fixed: FixedType.RIGHT,
            render: (_: string, record) => {
                // 是否为理解工单
                // const isComprehension = record?.type === OrderType.COMPREHENSION
                const canProcessor = [
                    OrderType.COMPREHENSION,
                    OrderType.RESEARCH_REPORT,
                    OrderType.DATA_CATALOG,
                    OrderType.FRONT_PROCESSORS,
                ].includes(record?.type)
                // 已完成
                const isFinished = record?.status === StatusType.COMPLETED
                // 能处理、转派
                const showOperate = canProcessor && !isFinished
                // 能完成
                const showFinish = record?.status !== StatusType.COMPLETED

                // 能发起质量检测
                const canQualityExamine =
                    record?.status === StatusType.COMPLETED &&
                    record?.type === OrderType.AGGREGATION
                const btnList: any[] = [
                    {
                        key: OperateType.DETAIL,
                        label: __('详情'),
                        show: true,
                    },
                    {
                        key: OperateType.RUN,
                        label: __('处理'),
                        show: showOperate,
                    },
                    {
                        key: OperateType.EXECUTE,
                        label: __('完成'),
                        tip: canProcessor
                            ? undefined
                            : __('确定要执行此操作吗？'),
                        disabled:
                            record?.work_order_task_count?.total !==
                            record?.work_order_task_count?.completed,
                        show: showFinish,
                    },
                    {
                        key: OperateType.MOVE,
                        label: __('转派'),
                        show: showOperate,
                    },
                    {
                        key: OperateType.QUALITY_EXAMINE,
                        label: __('发起质量检测'),
                        show: canQualityExamine,
                    },
                ]

                return (
                    <Space size={16} className={styles.oprColumn}>
                        {btnList
                            .filter((o) => o.show)
                            .map((item) => {
                                return (
                                    <Popconfirm
                                        title={item.tip}
                                        placement="bottom"
                                        okText={__('确定')}
                                        cancelText={__('取消')}
                                        onConfirm={() => {
                                            handleOperate(item.key, record)
                                        }}
                                        disabled={
                                            !item.tip ||
                                            (item.key === OperateType.EXECUTE &&
                                                item.disabled)
                                        }
                                        overlayClassName={styles.popconfirmTips}
                                        key={item.key}
                                    >
                                        <Tooltip
                                            title={
                                                item?.disabled
                                                    ? record
                                                          ?.work_order_task_count
                                                          ?.total !==
                                                      record
                                                          ?.work_order_task_count
                                                          ?.completed
                                                        ? __(
                                                              '存在未完成工单任务,无法完成工单',
                                                          )
                                                        : ''
                                                    : undefined
                                            }
                                            placement="bottom"
                                        >
                                            <Button
                                                type="link"
                                                key={item.key}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (
                                                        item.disabled ||
                                                        item.tip
                                                    )
                                                        return
                                                    handleOperate(
                                                        item.key,
                                                        record,
                                                    )
                                                }}
                                                disabled={item.disabled}
                                            >
                                                {item.label}
                                            </Button>
                                        </Tooltip>
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

    const [currentColumns, buttonElements, filterMenus] = useMemo(() => {
        const titleElement = <div className={styles.leftTitle}>工单列表</div>
        if (orderType) {
            const curColumns = columns.filter((o) => o.key !== 'type')
            let curFilters = SearchFilter.filter((o) => o.key !== 'type')
            // 质量检测工单无待签收状态
            if (orderType === OrderType.QUALITY_EXAMINE) {
                curFilters = curFilters.map((o) => {
                    if (o.key === 'status') {
                        return {
                            ...o,
                            options: OrderStatusOptions.slice(1),
                        }
                    }
                    return o
                })
            }
            return [curColumns, titleElement, curFilters]
        }
        return [columns, titleElement, SearchFilter]
    }, [orderType, tableSort])

    const pageChange = async (offset, limit) => {
        setSearchCondition({
            ...searchCondition,
            offset,
            limit,
        })
    }

    const renderSourceFrom = () => {
        if (!previewVisible) return null
        const source = current?.sources?.[0]
        const sourceType = source?.type
        // 来源计划
        if (sourceType === SourceTypeEnum.PLAN) {
            return current?.type === OrderType.AGGREGATION ? (
                <PlanCollectionDetail
                    id={source?.id}
                    onClose={() => {
                        setPreviewVisible(false)
                        setCurrent(undefined)
                    }}
                />
            ) : current?.type === OrderType.COMPREHENSION ? (
                <PlanUnderstandingDetail
                    id={source?.id}
                    onClose={() => {
                        setPreviewVisible(false)
                        setCurrent(undefined)
                    }}
                />
            ) : [
                  OrderType.STANDARD,
                  OrderType.QUALITY_EXAMINE,
                  OrderType.FUNSION,
              ].includes(current?.type) ? (
                <PlanProcessingDetail
                    id={source?.id}
                    onClose={() => {
                        setPreviewVisible(false)
                        setCurrent(undefined)
                    }}
                />
            ) : null
        }

        // 来源归集工单
        if (sourceType === SourceTypeEnum.AGGREGATION_WORK_ORDER) {
            return (
                <DetailModal
                    id={current?.work_order_id}
                    type={OrderType.AGGREGATION}
                    onClose={() => {
                        setPreviewVisible(false)
                        setCurrent(undefined)
                    }}
                />
            )
        }
        return null
    }

    return (
        <div className={styles['work-orders']}>
            <div className={styles['operate-container']}>
                {buttonElements}
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
                            formData={filterMenus}
                            onChange={(data, key) => {
                                if (key === 'type') {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        type: data.type || undefined,
                                    })
                                } else if (key === 'status') {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        status: data.status || undefined,
                                    })
                                } else if (key === 'created_at') {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        started_at:
                                            data.created_at?.[0] &&
                                            data.created_at[0]
                                                .startOf('day')
                                                .unix(),
                                        finished_at:
                                            data.created_at?.[1] &&
                                            data.created_at[1]
                                                .endOf('day')
                                                .unix(),
                                    })
                                } else {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        type: undefined,
                                        status: undefined,
                                        started_at: undefined,
                                        finished_at: undefined,
                                    })
                                }
                            }}
                            defaultValue={{
                                type: undefined,
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
                            columns={currentColumns}
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
                    onClose={(refresh?: boolean) => {
                        if (refresh) {
                            run({ ...searchCondition })
                        }
                        setTransferOpen(false)
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

            {optTodoOpen && (
                <ToProcess
                    id={current?.work_order_id}
                    onClose={(refresh?: boolean) => {
                        if (refresh) {
                            run({ ...searchCondition })
                        }
                        setOptTodoOpen(false)
                        setCurrent(undefined)
                    }}
                />
            )}
            {optCompleteOpen && (
                <ToComplete
                    id={current?.work_order_id}
                    onClose={(refresh?: boolean) => {
                        if (refresh) {
                            run({ ...searchCondition })
                        }
                        setOptCompleteOpen(false)
                        setCurrent(undefined)
                    }}
                />
            )}
            {renderSourceFrom()}
            {qualityExamineOpen && (
                <OptModal
                    id={current?.work_order_id}
                    visible={qualityExamineOpen}
                    type={OrderType.QUALITY_EXAMINE}
                    fromType={current?.type}
                    onClose={(refresh?: boolean) => {
                        if (refresh) {
                            run({ ...searchCondition })
                        }
                        setQualityExamineOpen(false)
                        setCurrent(undefined)
                    }}
                    orderName={`${__('质量检测')}-${current?.name}`}
                />
            )}
        </div>
    )
}

export default ResponsibleWorkOrder
