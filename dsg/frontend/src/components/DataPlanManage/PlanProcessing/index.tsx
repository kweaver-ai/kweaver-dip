import { useAntdTable } from 'ahooks'
import {
    Button,
    message,
    Popconfirm,
    Popover,
    Select,
    Space,
    Table,
    Tooltip,
} from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import { divide, isNumber } from 'lodash'
import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import { CloseCircleFilled, SwapRightOutlined } from '@ant-design/icons'
import dataEmpty from '@/assets/dataEmpty.svg'
import DropDownFilter from '@/components/DropDownFilter'
import { FixedType } from '@/components/CommonTable/const'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import {
    cancelDataProcessingPlanAudit,
    changeDataProcessingPlanStatus,
    deleteDataProcessingPlan,
    formatError,
    getDataProcessingPlan,
    SortDirection,
} from '@/core'
import { LightweightSearch, Loader, SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import { OperateType } from '@/utils'
import {
    DefaultMenu,
    initSearchCondition,
    PriorityOptions,
    SearchFilter,
    getOptionState,
} from './helper'
import __ from './locale'
import styles from './styles.module.less'
import OptModal from './OptModal'
import DetailModal from './DetailModal'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import {
    AuditOptionsLabel,
    convertToPlain,
    getStateSelect,
    StatusOptions,
} from '../PlanUnderstanding/helper'
import AuditorTooltip from '@/components/AuditorTooltip'

interface IStatusCompProps {
    record: any
}
const StatusComp = ({ record }: IStatusCompProps) => {
    const [auditApplyId, setAuditApplyId] = useState('')

    return (
        <AuditorTooltip auditApplyId={auditApplyId}>
            <div
                hidden={record?.audit_status === 'pass'}
                className={
                    record?.audit_status === 'reject'
                        ? styles['is-reject']
                        : ['undo', ''].includes(record?.audit_status)
                        ? styles['is-undo']
                        : undefined
                }
                onMouseEnter={() => setAuditApplyId(record.audit_apply_id)}
                onMouseLeave={() => setAuditApplyId('')}
            >
                {!record?.audit_status
                    ? __('待提交')
                    : AuditOptionsLabel.find(
                          (o) => o.value === record?.audit_status,
                      )?.label ?? ''}
                {record?.audit_status === 'reject' && record?.reject_reason && (
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
                                    {__('审核未通过')}
                                </div>
                                <div
                                    style={{
                                        wordBreak: 'break-all',
                                    }}
                                >
                                    {record?.reject_reason}
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

const PlanProcessing = () => {
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
    })

    // 修改表头排序
    const [updateSortOrder, setUpdateSortOrder] = useState<SortOrder>('ascend')

    const [searchIsExpansion, setSearchIsExpansion] = useState<boolean>(false)

    const [tableHeight, setTableHeight] = useState<number>(0)
    const [initSearch, setInitSearch] = useState<boolean>(true)

    const hasSearchCondition = useMemo(() => {
        return (
            searchCondition.keyword ||
            searchCondition.status ||
            searchCondition.priority ||
            searchCondition.started_at ||
            searchCondition.finished_at
        )
    }, [searchCondition])

    useEffect(() => {
        // 展开/收起查询条件高度
        const defalutHeight: number = 276
        // 已选搜索条件高度
        const searchConditionHeight: number = hasSearchCondition ? 41 : 0
        const height = defalutHeight + searchConditionHeight

        setTableHeight(height)
    }, [hasSearchCondition, searchIsExpansion])

    useEffect(() => {
        run({ ...searchCondition, current: searchCondition.offset })
    }, [])

    // 数据理解计划查询
    const getDataList = async (params) => {
        try {
            setLoading(true)
            const obj = params
            const res = await getDataProcessingPlan(obj)
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

    const { tableProps, run, pagination, refresh } = useAntdTable(getDataList, {
        defaultPageSize: 10,
        manual: true,
    })

    useEffect(() => {
        if (!initSearch) {
            run({ ...searchCondition, current: searchCondition.offset })
        }
    }, [searchCondition])

    const [curPlan, setCurPlan] = useState<any>()
    const [detailVisible, setDetailVisible] = useState<boolean>(false)
    const [optOpen, setOptOpen] = useState<boolean>(false)

    const handleDelete = async (id: string) => {
        try {
            await deleteDataProcessingPlan(id)
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

    const handleCancelPlan = async (planId: string) => {
        try {
            await cancelDataProcessingPlanAudit(planId)
            message.success(__('撤回成功'))
            // 刷新
            run({ ...searchCondition })
        } catch (error) {
            formatError(error)
        }
    }

    const handleOperate = async (op: OperateType, item: any) => {
        switch (op) {
            case OperateType.DETAIL:
                setCurPlan(item)
                setDetailVisible(true)
                break
            case OperateType.CREATE:
                // 创建
                setOptOpen(true)
                break
            case OperateType.EDIT:
                // 编辑
                setCurPlan(item)
                setOptOpen(true)
                break
            case OperateType.DELETE:
                // 删除
                handleDelete(item?.id)
                break
            case OperateType.REVOCATION:
                // 撤回
                handleCancelPlan(item?.id)
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
        if (searchCondition.updated_at_end === 'created_at') {
            if (searchCondition.direction === SortDirection.ASC) {
                setTableSort({
                    createTime: 'descend',
                })
            } else {
                setTableSort({
                    createTime: 'ascend',
                })
            }
        } else if (searchCondition.updated_at_end === SortDirection.ASC) {
            setTableSort({
                createTime: null,
            })
        } else {
            setTableSort({
                createTime: null,
            })
        }
        return {
            key: searchCondition.updated_at_end,
            sort:
                searchCondition.direction === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC,
        }
    }

    const handleChangeStatus = async (planId: string, state: string) => {
        try {
            await changeDataProcessingPlanStatus(planId, state)
            refresh?.()
        } catch (error) {
            formatError(error)
        }
    }

    const columns: any = [
        {
            title: (
                <div>
                    <span>{__('计划名称')}</span>
                    <span
                        style={{
                            color: 'rgba(0,0,0,0.45)',
                            fontWeight: 'normal',
                        }}
                    >
                        （{__('简介')}）
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
                        <StatusComp record={record} />
                    </div>
                    <div
                        className={styles.planContent}
                        title={convertToPlain(record?.plan_info)}
                    >
                        {convertToPlain(record?.plan_info) || '--'}
                    </div>
                </div>
            ),
        },
        {
            title: __('状态'),
            dataIndex: 'status',
            key: 'status',
            ellipsis: true,
            render: (text, record) => {
                if (
                    record?.audit_status === 'pass' &&
                    ['not_started', 'ongoing'].includes(text)
                ) {
                    return (
                        <Select
                            options={getStateSelect(text)}
                            value={text}
                            onChange={(key) =>
                                handleChangeStatus(record?.id, key)
                            }
                        />
                    )
                }
                return getOptionState(text, StatusOptions)
            },
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
            title: __('责任人'),
            dataIndex: 'responsible_person',
            key: 'responsible_person',
            ellipsis: true,
            render: (text, record) => (
                <div
                    className={styles.ellipsisTitle}
                    title={record.responsible_person}
                >
                    {text || '--'}
                </div>
            ),
        },
        {
            title: __('计划日期'),
            dataIndex: 'started_at',
            key: 'started_at',
            width: 240,
            ellipsis: true,
            render: (text, record) => {
                const startTime =
                    isNumber(record?.started_at) && record?.started_at
                        ? moment(record.started_at * 1000).format('YYYY-MM-DD')
                        : '--'
                const endTime =
                    isNumber(record?.finished_at) && record?.finished_at
                        ? moment(record.finished_at * 1000).format('YYYY-MM-DD')
                        : '--'
                return (
                    <div
                        className={styles.ellipsisTitle}
                        title={
                            startTime ? `${startTime} - ${endTime}` : undefined
                        }
                    >
                        {!startTime ? (
                            '--'
                        ) : (
                            <>
                                {startTime}{' '}
                                <SwapRightOutlined
                                    style={{ margin: '0 4px' }}
                                />{' '}
                                {endTime}
                            </>
                        )}
                    </div>
                )
            },
        },

        {
            title: __('创建时间'),
            dataIndex: 'created_at',
            key: 'created_at',
            ellipsis: true,
            sorter: true,
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
            width: 220,
            fixed: FixedType.RIGHT,
            render: (_: string, record) => {
                const isAuditing = record?.audit_status === 'auditing'
                const isPass = record?.audit_status === 'pass'

                const btnList: any[] = [
                    {
                        key: OperateType.DETAIL,
                        label: __('详情'),
                        show: true,
                    },
                    {
                        key: OperateType.EDIT,
                        label: __('编辑'),
                        show: !isPass,
                        disabled: isAuditing,
                    },
                    {
                        key: OperateType.DELETE,
                        label: __('删除'),
                        tip: __('确定要执行此操作吗？'),
                        show: !isPass,
                        disabled: isAuditing,
                    },
                    {
                        key: OperateType.REVOCATION,
                        label: __('撤回审核'),
                        tip: __('确定要执行此操作吗？'),
                        show: isAuditing,
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
                                            (isAuditing &&
                                                item.key !==
                                                    OperateType.REVOCATION)
                                        }
                                        overlayClassName={styles.popconfirmTips}
                                        key={item.key}
                                    >
                                        <Tooltip
                                            title={
                                                isAuditing &&
                                                [
                                                    OperateType.EDIT,
                                                    OperateType.DELETE,
                                                ].includes(item.key)
                                                    ? __('审核中，无法操作')
                                                    : ''
                                            }
                                            placement="bottom"
                                        >
                                            <Button
                                                type="link"
                                                key={item.key}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (
                                                        [
                                                            OperateType.DELETE,
                                                            OperateType.REVOCATION,
                                                        ].includes(item.key)
                                                    )
                                                        return
                                                    handleOperate(
                                                        item.key,
                                                        record,
                                                    )
                                                }}
                                                disabled={
                                                    isAuditing &&
                                                    [
                                                        OperateType.EDIT,
                                                        OperateType.DELETE,
                                                    ].includes(item.key)
                                                }
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
            updated_at_end: selectedMenu.key,
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
                        <div> {__('点击【新建】可新建数据处理计划')}</div>
                    </div>
                }
                iconSrc={dataEmpty}
            />
        )
    }

    // 翻页
    const pageChange = async (offset, limit) => {
        setSearchCondition({
            ...searchCondition,
            offset,
            limit,
        })
    }

    return (
        <div className={styles['plan-processing']}>
            <div className={styles['operate-container']}>
                <Button
                    onClick={() => handleOperate(OperateType.CREATE, undefined)}
                    type="primary"
                >
                    {__('新建')}
                </Button>
                <Space size={16}>
                    <Space size={8}>
                        <SearchInput
                            className={styles.nameInput}
                            style={{ width: 272 }}
                            placeholder={__('搜索数据处理计划')}
                            onKeyChange={(kw: string) =>
                                setSearchCondition({
                                    ...searchCondition,
                                    keyword: kw,
                                    offset: 1,
                                })
                            }
                        />
                        <LightweightSearch
                            formData={SearchFilter}
                            onChange={(data, key) => {
                                if (key === 'status') {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        status: data.status,
                                    })
                                } else if (key === 'priority') {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        priority: data.priority,
                                    })
                                } else if (key === 'date_range') {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        started_at:
                                            data.date_range?.[0] &&
                                            data.date_range[0]
                                                .startOf('day')
                                                .unix(),
                                        finished_at:
                                            data.date_range?.[1] &&
                                            data.date_range[1]
                                                .endOf('day')
                                                .unix(),
                                    })
                                } else {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        status: undefined,
                                        priority: undefined,
                                        started_at: undefined,
                                        finished_at: undefined,
                                    })
                                }
                            }}
                            defaultValue={{
                                status: undefined,
                                priority: undefined,
                                started_at: undefined,
                                finished_at: undefined,
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
                            className={classnames(
                                !searchIsExpansion && styles.isExpansion,
                            )}
                            rowClassName={styles.tableRow}
                            columns={columns}
                            {...tableProps}
                            rowKey="id"
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
                                        updated_at_end: selectedMenu.key,
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
                    id={curPlan?.id}
                    onClose={(isRefresh?: boolean) => {
                        if (isRefresh) {
                            run({ ...searchCondition })
                        }
                        setOptOpen(false)
                        setCurPlan(undefined)
                    }}
                />
            )}
            {detailVisible && (
                <DetailModal
                    id={curPlan?.id}
                    onClose={() => {
                        setDetailVisible(false)
                        setCurPlan(undefined)
                    }}
                />
            )}
        </div>
    )
}

export default PlanProcessing
