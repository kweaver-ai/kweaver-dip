import { CloseCircleFilled } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
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
    formatError,
    getWorkOrderProcessing,
    SortDirection,
    updateWorkOrder,
    updateWorkOrderStatus,
} from '@/core'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { LightweightSearch, Loader, SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import { OperateType } from '@/utils'
import {
    AuditType,
    getOptionState,
    OrderAuditOptionsLabel,
    CommonOrderStatusOptions,
    OrderType,
    PriorityOptions,
    StatusType,
} from '../helper'
import DetailModal from '../WorkOrderType/QualityOrder/DetailModal'

import dataEmpty from '@/assets/dataEmpty.svg'
import TransferModal from '../WorkOrderManage/TransferModal'
import CompleteModal from '../WorkOrderType/QualityOrder/CompleteModal'
import RejectModal from '../WorkOrderType/QualityOrder/RejectModal'
import {
    QualityCompleteMenu,
    CompleteSearchCondition,
    QualitySearchFilter,
    QualityTodoMenu,
    TodoSearchCondition,
} from './helper'
import __ from './locale'
import { ProcessProvider } from './ProcessProvider'
import styles from './styles.module.less'
import AuditorTooltip from '@/components/AuditorTooltip'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import actionType from '@/redux/actionType'

interface IStatusCompProps {
    record: any
}
const StatusComp = ({ record }: IStatusCompProps) => {
    const [auditApplyId, setAuditApplyId] = useState('')

    return (
        <AuditorTooltip auditApplyId={auditApplyId}>
            <div
                hidden={
                    [AuditType.PASS, AuditType.UNDONE].includes(
                        record?.audit_status,
                    ) || record?.status === StatusType.COMPLETED
                }
                className={classnames(
                    styles.auditStatus,
                    record?.audit_status === AuditType.REJECT
                        ? styles['is-reject']
                        : undefined,
                )}
                onMouseEnter={() => setAuditApplyId(record.audit_apply_id)}
                onMouseLeave={() => setAuditApplyId('')}
            >
                {record?.audit_status === AuditType.REJECT
                    ? __('驳回未通过')
                    : OrderAuditOptionsLabel.find(
                          (o) => o.value === record?.audit_status,
                      )?.label}
                {record?.audit_status === AuditType.REJECT &&
                    record?.audit_description && (
                        <Popover
                            placement="bottomLeft"
                            arrowPointAtCenter
                            overlayClassName={styles.PopBox}
                            content={
                                <div className={styles.PopTip}>
                                    <div>
                                        <span className={styles.popTipIcon}>
                                            <CloseCircleFilled />
                                        </span>
                                        {__('驳回未通过')}
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
        </AuditorTooltip>
    )
}

const DataQualityProcessing = () => {
    const [loading, setLoading] = useState<boolean>(true)
    const [currentTab, setCurrentTab] = useState<any>('Unassigned,Ongoing')
    const [count, setCount] = useState<{
        completed_count: number
        todo_count: number
    }>({ completed_count: 0, todo_count: 0 })

    const dispatch = useDispatch()
    const menusCountConfigs = useSelector(
        (state: any) => state?.menusCountConfigsReducer,
    )
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        updateTime: null,
        createTime: null,
        processTime: null,
    })

    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(QualityTodoMenu[0])

    const [searchCondition, setSearchCondition] = useState<any>({
        ...TodoSearchCondition,
        type: OrderType.QUALITY,
    })

    const [tableHeight, setTableHeight] = useState<number>(0)
    const [initSearch, setInitSearch] = useState<boolean>(true)
    const [userId] = useCurrentUser('ID')
    const hasSearchCondition = useMemo(() => {
        return currentTab === 'Completed'
            ? searchCondition.keyword || searchCondition.priority
            : searchCondition.keyword ||
                  !searchCondition.status?.includes(',') ||
                  searchCondition.priority
    }, [searchCondition, currentTab])

    useEffect(() => {
        const isTodo = currentTab === 'Unassigned,Ongoing'
        setSelectedSort(isTodo ? QualityTodoMenu[0] : QualityCompleteMenu[0])
        setTableSort((prev) => ({
            ...prev,
            [isTodo ? 'processTime' : 'updateTime']: 'descend',
        }))
        setSearchCondition({
            type: OrderType.QUALITY,
            ...(isTodo ? TodoSearchCondition : CompleteSearchCondition),
        })
    }, [currentTab])

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

    const updateMenusCountConfigs = (todoCount: number) => {
        if (todoCount > 0) {
            dispatch({
                type: actionType.SET_MENUS_COUNT_CONFIGS,
                payload: menusCountConfigs.length
                    ? menusCountConfigs.map((it) => {
                          if (it.key === 'dataQualityWorkOrderProcessing') {
                              return { ...it, count: todoCount }
                          }
                          return it
                      })
                    : [
                          {
                              key: 'dataQualityWorkOrderProcessing',
                              count: todoCount,
                              needBadge: true,
                          },
                      ],
            })
        } else {
            dispatch({
                type: actionType.SET_MENUS_COUNT_CONFIGS,
                payload: menusCountConfigs.filter(
                    (it) => it.key !== 'dataQualityWorkOrderProcessing',
                ),
            })
        }
    }

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
            if (
                obj.status === 'Unassigned,Ongoing' &&
                !obj.keyword &&
                obj.type === 'data_quality'
            ) {
                updateMenusCountConfigs(res?.todo_count ?? 0)
            }
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
    const [optRejectOpen, setOptRejectOpen] = useState<boolean>(false)

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
    const handleStart = async (responsibleUid: string, _id: string) => {
        try {
            // 没有处理人，先转派给自己
            if (!responsibleUid) {
                await updateWorkOrder(_id, {
                    responsible_uid: userId,
                })
            }
            await updateWorkOrderStatus(_id, {
                status: StatusType.ONGOING,
            })
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
                handleStart(item?.responsible_uid, item?.work_order_id || '')
                break
            case OperateType.EXECUTE:
                // 完成
                setOptCompleteOpen(true)
                break
            case OperateType.CANCEL:
                // 驳回
                setOptRejectOpen(true)
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
                    processTime: null,
                })
            } else if (sorter.columnKey === 'updated_at') {
                setTableSort({
                    createTime: null,
                    updateTime: sorter.order || 'ascend',
                    processTime: null,
                })
            } else if (sorter.columnKey === 'acceptance_at') {
                setTableSort({
                    createTime: null,
                    updateTime: null,
                    processTime: sorter.order || 'ascend',
                })
            } else {
                setTableSort({
                    createTime: null,
                    updateTime: null,
                    processTime: null,
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
                    processTime: null,
                })
            } else {
                setTableSort({
                    createTime: 'ascend',
                    updateTime: null,
                    processTime: null,
                })
            }
        } else if (searchCondition.sort === 'updated_at') {
            if (searchCondition.direction === SortDirection.ASC) {
                setTableSort({
                    updateTime: 'descend',
                    processTime: null,
                    createTime: null,
                })
            } else {
                setTableSort({
                    updateTime: 'ascend',
                    processTime: null,
                    createTime: null,
                })
            }
        } else if (searchCondition.sort === 'acceptance_at') {
            if (searchCondition.direction === SortDirection.ASC) {
                setTableSort({
                    processTime: 'descend',
                    updateTime: null,
                    createTime: null,
                })
            } else {
                setTableSort({
                    processTime: 'ascend',
                    updateTime: null,
                    createTime: null,
                })
            }
        } else if (searchCondition.sort === SortDirection.ASC) {
            setTableSort({
                updateTime: null,
                processTime: null,
                createTime: null,
            })
        } else {
            setTableSort({
                updateTime: null,
                processTime: null,
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
                        <div
                            hidden={
                                record?.remind !== 1 ||
                                record?.status === StatusType.COMPLETED
                            }
                        >
                            <FontIcon
                                name="icon-cuiban"
                                type={IconType.COLOREDICON}
                                style={{
                                    fontSize: '14px',
                                }}
                            />
                        </div>
                        <StatusComp record={record} />
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
            title: __('发起人'),
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
            title: __('发起人联系方式'),
            dataIndex: 'contact_phone',
            key: 'contact_phone',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.ellipsisTitle} title={text}>
                    {text || '--'}
                </div>
            ),
        },
        {
            title: __('开始处理时间'),
            dataIndex: 'process_at',
            key: 'process_at',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.processTime,
            showSorterTooltip: false,
            render: (text: any) => {
                return isNumber(text) && text
                    ? moment(text).format('YYYY-MM-DD HH:mm:ss')
                    : '--'
            },
        },
        {
            title: __('工单处理完成时间'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            ellipsis: true,
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
                        disabled: record?.audit_status === AuditType.AUDITING,
                        show:
                            currentTab === 'Unassigned,Ongoing' &&
                            record?.status === StatusType.UNASSIGENED,
                    },
                    {
                        key: OperateType.EXECUTE,
                        label: __('完成工单'),
                        disabled: record?.audit_status === AuditType.AUDITING,
                        show:
                            currentTab === 'Unassigned,Ongoing' &&
                            record?.status === StatusType.ONGOING,
                    },
                    {
                        key: OperateType.CANCEL,
                        label: __('驳回工单'),
                        disabled: record?.audit_status === AuditType.AUDITING,
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
                                                    ? record?.audit_status ===
                                                      AuditType.AUDITING
                                                        ? __('审核中,无法操作')
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

        return columns.filter(
            (o) =>
                !(
                    currentTab === 'Completed' ? completeKeys : todoKeys
                ).includes(o.key),
        )
    }, [currentTab, tableSort])

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
                    processTime: null,
                })
                break
            case 'updated_at':
                setTableSort({
                    updateTime:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    createTime: null,
                    processTime: null,
                })
                break
            case 'acceptance_at':
                setTableSort({
                    processTime:
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
                    processTime: null,
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

    return (
        <ProcessProvider>
            <div className={styles['work-order-processing']}>
                <div className={styles['operate-container']}>
                    <div>
                        <div className={styles['opt-tab']}>
                            <span
                                className={classnames({
                                    [styles['is-check']]:
                                        currentTab === 'Unassigned,Ongoing',
                                    [styles['has-unassigned']]:
                                        count?.todo_count > 0,
                                })}
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
                            <LightweightSearch
                                formData={
                                    currentTab === 'Completed'
                                        ? QualitySearchFilter?.filter(
                                              (o) => o.key !== 'status',
                                          )
                                        : QualitySearchFilter
                                }
                                onChange={(data, key) => {
                                    if (key === 'priority') {
                                        setSearchCondition({
                                            ...searchCondition,
                                            offset: 1,
                                            priority:
                                                data.priority || undefined,
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
                                            status: currentTab,
                                        })
                                    }
                                }}
                                defaultValue={{
                                    priority: undefined,
                                    status: currentTab,
                                }}
                            />
                        </Space>
                        <span>
                            <SortBtn
                                contentNode={
                                    <DropDownFilter
                                        menus={
                                            currentTab === 'Completed'
                                                ? QualityCompleteMenu
                                                : QualityTodoMenu
                                        }
                                        defaultMenu={
                                            (currentTab === 'Completed'
                                                ? QualityCompleteMenu
                                                : QualityTodoMenu)[0]
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
                                    showSizeChanger: false,
                                    hideOnSinglePage: true,
                                    current: searchCondition.offset,
                                    pageSize: searchCondition.limit,
                                    pageSizeOptions: [10, 20, 50, 100],
                                    showQuickJumper: true,
                                    responsive: true,
                                    showLessItems: true,
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
                        isWorkOrder={false}
                        onClose={(refresh?: boolean) => {
                            if (refresh) {
                                run({ ...searchCondition })
                            }
                            setTransferOpen(false)
                            setCurWorkOrder(undefined)
                        }}
                    />
                )}
                {optRejectOpen && (
                    <RejectModal
                        item={curWorkOrder}
                        visible={optRejectOpen}
                        onClose={(refresh?: boolean) => {
                            if (refresh) {
                                run({ ...searchCondition })
                            }
                            setOptRejectOpen(false)
                            setCurWorkOrder(undefined)
                        }}
                    />
                )}
                {optCompleteOpen && (
                    <CompleteModal
                        item={curWorkOrder}
                        visible={optCompleteOpen}
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

export default DataQualityProcessing
