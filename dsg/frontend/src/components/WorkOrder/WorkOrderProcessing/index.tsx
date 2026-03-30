import { CloseCircleFilled } from '@ant-design/icons'
import { useAntdTable } from 'ahooks'
import {
    Button,
    message,
    Popconfirm,
    Popover,
    Space,
    Table,
    Tooltip,
} from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import { isNumber } from 'lodash'
import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import DropDownFilter from '@/components/DropDownFilter'
import { FixedType } from '@/components/CommonTable/const'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import {
    cancelWorkOrderAudit,
    delAudit,
    formatError,
    getWorkOrderProcessing,
    SortDirection,
    updateWorkOrder,
} from '@/core'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { LightweightSearch, Loader, SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import { OperateType } from '@/utils'
import {
    AllShowOrderType,
    AuditType,
    getOptionState,
    OrderAuditOptionsLabel,
    OrderStatusOptions,
    OrderType,
    OrderTypeOptions,
    PriorityOptions,
    StatusType,
} from '../helper'
import DetailModal from './DetailModal'

import dataEmpty from '@/assets/dataEmpty.svg'
import PopList from '@/components/DataPlanManage/PopList'
import { renderPlanOrder } from '../WorkOrderManage/CreationWorkOrder'
import TransferModal from '../WorkOrderManage/TransferModal'
import {
    CompleteMenu,
    CompleteSearchCondition,
    SearchFilter,
    TodoMenu,
    TodoSearchCondition,
} from './helper'
import __ from './locale'
import styles from './styles.module.less'
import ToComplete from './ToComplete'
import ToProcess from './ToProcess'
import { ProcessProvider } from './ProcessProvider'

const WorkOrderProcessing = ({ orderType }: { orderType?: OrderType }) => {
    const [loading, setLoading] = useState<boolean>(true)
    const [currentTab, setCurrentTab] = useState<any>('Unassigned,Ongoing')
    const [count, setCount] = useState<{
        completed_count: number
        todo_count: number
    }>({ completed_count: 0, todo_count: 0 })
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        updateTime: null,
        createTime: null,
        acceptTime: null,
    })

    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(TodoMenu[0])

    const [searchCondition, setSearchCondition] = useState<any>({
        ...TodoSearchCondition,
        type: orderType || AllShowOrderType.join(','),
    })

    const [tableHeight, setTableHeight] = useState<number>(0)
    const [initSearch, setInitSearch] = useState<boolean>(true)

    const hasSearchCondition = useMemo(() => {
        return currentTab === 'Completed'
            ? searchCondition.keyword || searchCondition.type
            : searchCondition.keyword ||
                  searchCondition.status ||
                  searchCondition.type
    }, [searchCondition, currentTab])

    useEffect(() => {
        const isTodo = currentTab === 'Unassigned,Ongoing'
        setSelectedSort(isTodo ? TodoMenu[0] : CompleteMenu[0])
        setTableSort((prev) => ({
            ...prev,
            createTime: null,
            updateTime: null,
            acceptTime: null,
            [isTodo ? 'acceptTime' : 'updateTime']: 'descend',
        }))
        setSearchCondition({
            type: orderType || AllShowOrderType.join(','),
            ...(isTodo ? TodoSearchCondition : CompleteSearchCondition),
        })
    }, [currentTab, orderType])

    useEffect(() => {
        // 展开/收起查询条件高度
        const defalutHeight: number = 276
        // 已选搜索条件高度
        const searchConditionHeight: number = hasSearchCondition ? 41 : 0
        const height = defalutHeight + searchConditionHeight

        setTableHeight(height)
    }, [hasSearchCondition])

    useEffect(() => {
        run({ ...searchCondition, current: searchCondition.offset })
    }, [])

    // 工单处理查询
    const getDataList = async (params) => {
        try {
            setLoading(true)
            const obj = params
            const res = await getWorkOrderProcessing(obj)
            setCount({
                completed_count: res?.completed_count ?? 0,
                todo_count: res?.todo_count ?? 0,
            })
            return {
                total:
                    currentTab === 'Completed'
                        ? res.completed_count
                        : res.todo_count,
                list: res.entries,
            }
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
    const [transferOpen, setTransferOpen] = useState<boolean>(false)
    const [optCompleteOpen, setOptCompleteOpen] = useState<boolean>(false)
    const [optTodoOpen, setOptTodoOpen] = useState<boolean>(false)

    const handleRevocation = async (_id: string) => {
        try {
            await cancelWorkOrderAudit(_id)
            message.success(__('撤回审核成功'))
            // 刷新
            run({ ...searchCondition })
        } catch (error) {
            formatError(error)
        }
    }

    const handleOperate = async (op: OperateType, item: any) => {
        setCurWorkOrder(item)
        switch (op) {
            case OperateType.DETAIL:
                setDetailVisible(true)
                break
            case OperateType.RUN:
                // 开始处理
                setOptTodoOpen(true)
                break
            case OperateType.EXECUTE:
                // 完成
                setOptCompleteOpen(true)
                break
            case OperateType.MOVE:
                // 转派
                setTransferOpen(true)
                break
            case OperateType.REVOCATION:
                // 撤回
                handleRevocation(item?.work_order_id || '')
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
                    updateTime: null,
                    acceptTime: null,
                })
            } else if (sorter.columnKey === 'updated_at') {
                setTableSort({
                    createTime: null,
                    updateTime: sorter.order || 'ascend',
                    acceptTime: null,
                })
            } else if (sorter.columnKey === 'acceptance_at') {
                setTableSort({
                    createTime: null,
                    updateTime: null,
                    acceptTime: sorter.order || 'ascend',
                })
            } else {
                setTableSort({
                    createTime: null,
                    updateTime: null,
                    acceptTime: null,
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
                    updateTime: null,
                    acceptTime: null,
                })
            } else {
                setTableSort({
                    createTime: 'ascend',
                    updateTime: null,
                    acceptTime: null,
                })
            }
        } else if (searchCondition.sort === 'updated_at') {
            if (searchCondition.direction === SortDirection.ASC) {
                setTableSort({
                    updateTime: 'descend',
                    acceptTime: null,
                    createTime: null,
                })
            } else {
                setTableSort({
                    updateTime: 'ascend',
                    acceptTime: null,
                    createTime: null,
                })
            }
        } else if (searchCondition.sort === 'acceptance_at') {
            if (searchCondition.direction === SortDirection.ASC) {
                setTableSort({
                    acceptTime: 'descend',
                    updateTime: null,
                    createTime: null,
                })
            } else {
                setTableSort({
                    acceptTime: 'ascend',
                    updateTime: null,
                    createTime: null,
                })
            }
        } else if (searchCondition.sort === SortDirection.ASC) {
            setTableSort({
                updateTime: null,
                acceptTime: null,
                createTime: null,
            })
        } else {
            setTableSort({
                updateTime: null,
                acceptTime: null,
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
            width: 200,
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
                        <div
                            hidden={record?.audit_status === AuditType.PASS}
                            className={classnames(
                                styles.auditStatus,
                                record?.audit_status === AuditType.REJECT
                                    ? styles['is-reject']
                                    : record?.audit_status === AuditType.UNDONE
                                    ? styles['is-undone']
                                    : undefined,
                            )}
                        >
                            {
                                OrderAuditOptionsLabel.find(
                                    (o) => o.value === record?.audit_status,
                                )?.label
                            }
                            {record?.audit_status === AuditType.REJECT &&
                                record?.audit_description && (
                                    <Popover
                                        placement="bottomLeft"
                                        arrowPointAtCenter
                                        overlayClassName={styles.PopBox}
                                        content={
                                            <div className={styles.PopTip}>
                                                <div>
                                                    <span
                                                        className={
                                                            styles.popTipIcon
                                                        }
                                                    >
                                                        <CloseCircleFilled />
                                                    </span>
                                                    {__('审核未通过')}
                                                </div>
                                                <div
                                                    style={{
                                                        wordBreak: 'break-all',
                                                    }}
                                                >
                                                    {record?.audit_description}
                                                </div>
                                            </div>
                                        }
                                    >
                                        <FontIcon
                                            name="icon-xinxitishi"
                                            type={IconType.FONTICON}
                                            style={{
                                                fontSize: '12px',
                                                cursor: 'pointer',
                                            }}
                                        />
                                    </Popover>
                                )}
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
            title: __('工单状态'),
            dataIndex: 'status',
            key: 'status',
            ellipsis: true,
            render: (text, record) => getOptionState(text, OrderStatusOptions),
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
            title: __('工单任务'),
            dataIndex: 'tasks',
            key: 'tasks',
            ellipsis: true,
            render: (text: any[], record) => (
                <div
                    className={classnames(
                        styles.taskOrder,
                        text?.length > 0 && styles.hasTask,
                    )}
                    style={{ filter: `grayscale(${text?.length > 0 ? 0 : 1})` }}
                >
                    <FontIcon name="icon-renwu" type={IconType.COLOREDICON} />

                    <PopList
                        popTitle={__('工单任务')}
                        popContent={
                            text?.length > 0 ? renderPlanOrder(text) : undefined
                        }
                    >
                        <span className={styles.taskCount}>
                            {text?.length ?? 0}
                        </span>
                    </PopList>
                </div>
            ),
        },
        {
            title: __('任务完成进度'),
            dataIndex: 'completed_task_count',
            key: 'completed_task_count',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.ellipsisTitle}>
                    {text ?? 0}/{record?.tasks?.length ?? 0}
                </div>
            ),
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
        // {
        //     title: __('签收时间'),
        //     dataIndex: 'acceptance_at',
        //     key: 'acceptance_at',
        //     ellipsis: true,
        //     sorter: true,
        //     width: 180,
        //     sortOrder: tableSort.acceptTime,
        //     showSorterTooltip: false,
        //     render: (text: any) => {
        //         return isNumber(text) && text
        //             ? moment(text).format('YYYY-MM-DD HH:mm:ss')
        //             : '--'
        //     },
        // },
        {
            title: __('工单处理完成时间'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            ellipsis: true,
            width: 180,
            sorter: true,
            sortOrder: tableSort.updateTime,
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
            width: currentTab === 'Completed' ? 100 : 320,
            fixed: FixedType.RIGHT,
            render: (_: string, record) => {
                const btnList: any[] = [
                    {
                        key: OperateType.DETAIL,
                        label: __('详情'),
                        show: true,
                    },
                    {
                        key: OperateType.RUN,
                        label: __('开始处理'),
                        disabled: [AuditType.AUDITING].includes(
                            record?.audit_status,
                        ),
                        show: currentTab === 'Unassigned,Ongoing',
                    },
                    {
                        key: OperateType.EXECUTE,
                        label: __('完成工单'),
                        disabled:
                            record?.audit_status !== AuditType.PASS ||
                            record?.status !== StatusType.ONGOING ||
                            record?.tasks?.length !==
                                record?.completed_task_count,
                        show: currentTab === 'Unassigned,Ongoing',
                    },
                    {
                        key: OperateType.MOVE,
                        label: __('转派'),
                        disabled: record?.audit_status === AuditType.AUDITING,
                        show: currentTab === 'Unassigned,Ongoing',
                    },
                    {
                        key: OperateType.REVOCATION,
                        label: __('撤回审核'),
                        tip: __('确定要执行此操作吗？'),
                        show:
                            currentTab === 'Unassigned,Ongoing' &&
                            record?.type === OrderType.AGGREGATION &&
                            record?.audit_status === AuditType.AUDITING,
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
                                            (record?.audit_status ===
                                                AuditType.AUDITING &&
                                                item.key !==
                                                    OperateType.REVOCATION)
                                        }
                                        overlayClassName={styles.popconfirmTips}
                                        key={item.key}
                                    >
                                        <Tooltip
                                            title={
                                                item?.disabled
                                                    ? record?.audit_status !==
                                                      AuditType.PASS
                                                        ? item.key ===
                                                          OperateType.RUN
                                                            ? __(
                                                                  '未通过审核,无法开始处理',
                                                              )
                                                            : item.key ===
                                                              OperateType.MOVE
                                                            ? __(
                                                                  '未通过审核,无法转派',
                                                              )
                                                            : __(
                                                                  '未通过审核,无法完成工单',
                                                              )
                                                        : record?.status !==
                                                          StatusType.ONGOING
                                                        ? __(
                                                              '未开始处理,无法完成工单',
                                                          )
                                                        : record?.tasks
                                                              ?.length !==
                                                          record?.completed_task_count
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
                                                        item.key ===
                                                            OperateType.REVOCATION
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

    const currentColumns = useMemo(() => {
        const todoKeys = ['updated_at']
        const completeKeys = ['status', 'finished_at', 'completed_task_count']
        if (orderType) {
            todoKeys.push('type')
            completeKeys.push('type')
        }

        return columns.filter(
            (o) =>
                !(
                    currentTab === 'Completed' ? completeKeys : todoKeys
                ).includes(o.key),
        )
    }, [currentTab, orderType, tableSort])

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
                    updateTime: null,
                    acceptTime: null,
                })
                break
            case 'updated_at':
                setTableSort({
                    updateTime:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    createTime: null,
                    acceptTime: null,
                })
                break
            case 'acceptance_at':
                setTableSort({
                    acceptTime:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    createTime: null,
                    updateTime: null,
                })
                break
            default:
                setTableSort({
                    updateTime: null,
                    createTime: null,
                    acceptTime: null,
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

    const pageChange = async (offset, limit) => {
        setSearchCondition({
            ...searchCondition,
            offset,
            limit,
        })
    }

    return (
        <ProcessProvider>
            <div className={styles['work-order-processing']}>
                <div className={styles['operate-container']}>
                    <div>
                        <div className={styles['opt-tab']}>
                            <span
                                className={
                                    currentTab === 'Unassigned,Ongoing'
                                        ? styles['is-check']
                                        : undefined
                                }
                                onClick={() => switchTab('Unassigned,Ongoing')}
                            >
                                待办({count.todo_count})
                            </span>
                            <span
                                onClick={() => switchTab('Completed')}
                                className={
                                    currentTab === 'Completed'
                                        ? styles['is-check']
                                        : undefined
                                }
                            >
                                已办({count.completed_count})
                            </span>
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
                            {currentTab !== 'Completed' && (
                                <LightweightSearch
                                    formData={
                                        orderType
                                            ? SearchFilter.filter(
                                                  (o) => o.key !== 'type',
                                              )
                                            : SearchFilter
                                    }
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
                                                status:
                                                    data.status || undefined,
                                            })
                                        } else {
                                            setSearchCondition({
                                                ...searchCondition,
                                                offset: 1,
                                                type: undefined,
                                                status: currentTab,
                                            })
                                        }
                                    }}
                                    defaultValue={{
                                        type: undefined,
                                        status: currentTab,
                                    }}
                                />
                            )}
                        </Space>
                        <span>
                            <SortBtn
                                contentNode={
                                    <DropDownFilter
                                        menus={
                                            currentTab === 'Completed'
                                                ? CompleteMenu
                                                : TodoMenu
                                        }
                                        defaultMenu={
                                            (currentTab === 'Completed'
                                                ? CompleteMenu
                                                : TodoMenu)[0]
                                        }
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
                                className={classnames(styles.isExpansion)}
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
                                        (tableProps.pagination.total || 0) <=
                                        10,
                                    current: searchCondition.offset,
                                    pageSize: searchCondition.limit,
                                    pageSizeOptions: [10, 20, 50, 100],
                                    showQuickJumper: true,
                                    responsive: true,
                                    showLessItems: true,
                                    showSizeChanger: true,
                                    showTotal: (ct) => {
                                        return `共 ${ct} 条记录 第 ${
                                            searchCondition.offset
                                        }/${Math.ceil(
                                            ct / searchCondition.limit,
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
                                            limit:
                                                newPagination?.pageSize || 10,
                                        })
                                    }
                                }}
                            />
                        )}
                    </div>
                )}
                {transferOpen && (
                    <TransferModal
                        item={curWorkOrder}
                        visible={transferOpen}
                        onClose={(refresh?: boolean) => {
                            if (refresh) {
                                run({ ...searchCondition })
                            }
                            setTransferOpen(false)
                            setCurWorkOrder(undefined)
                        }}
                    />
                )}
                {optTodoOpen && (
                    <ToProcess
                        id={curWorkOrder?.work_order_id}
                        onClose={(refresh?: boolean) => {
                            if (refresh) {
                                run({ ...searchCondition })
                            }
                            setOptTodoOpen(false)
                            setCurWorkOrder(undefined)
                        }}
                    />
                )}
                {optCompleteOpen && (
                    <ToComplete
                        id={curWorkOrder?.work_order_id}
                        onClose={(refresh?: boolean) => {
                            if (refresh) {
                                run({ ...searchCondition })
                            }
                            setOptCompleteOpen(false)
                            setCurWorkOrder(undefined)
                        }}
                    />
                )}
                {detailVisible && (
                    <DetailModal
                        id={curWorkOrder?.work_order_id}
                        onClose={() => {
                            setDetailVisible(false)
                            setCurWorkOrder(undefined)
                        }}
                    />
                )}
            </div>
        </ProcessProvider>
    )
}

export default WorkOrderProcessing
