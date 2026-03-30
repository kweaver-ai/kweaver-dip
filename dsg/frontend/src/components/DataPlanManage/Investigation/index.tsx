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
import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import { CloseCircleFilled } from '@ant-design/icons'
import dataEmpty from '@/assets/dataEmpty.svg'
import DropDownFilter from '@/components/DropDownFilter'
import { FixedType } from '@/components/CommonTable/const'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import {
    cancelInvestigationReportAudit,
    deleteInvestigationReport,
    formatError,
    getInvestigationReport,
    SortDirection,
} from '@/core'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { LightweightSearch, Loader, SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import { OperateType } from '@/utils'
import DetailModal from './DetailModal'
import OrderDetailModal from '@/components/WorkOrder/WorkOrderManage/DetailModal'
import {
    AuditOptions,
    DefaultMenu,
    initSearchCondition,
    SearchFilter,
} from './helper'
import __ from './locale'
import OptModal from './OptModal'
import styles from './styles.module.less'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const Investigation = () => {
    const [loading, setLoading] = useState<boolean>(true)
    const [btnLoading, setBtnLoading] = useState<boolean>(false)
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        updateTime: 'descend',
    })

    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(DefaultMenu)

    const [searchCondition, setSearchCondition] = useState<any>({
        ...initSearchCondition,
    })
    const [userId] = useCurrentUser('ID')
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

    // 数据理解计划查询
    const getDataList = async (params) => {
        try {
            setLoading(true)
            const obj = params
            const res = await getInvestigationReport(obj)
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

    const [curReport, setCurReport] = useState<any>()
    const [detailVisible, setDetailVisible] = useState<boolean>(false)
    const [orderDetailVisible, setOrderDetailVisible] = useState<boolean>(false)
    const [optOpen, setOptOpen] = useState<boolean>(false)

    const handleDelete = async (id: string) => {
        try {
            setBtnLoading(true)
            await deleteInvestigationReport(id)
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
            setBtnLoading(false)
        }
    }

    const handleCancelPlan = async (planId: string) => {
        try {
            setBtnLoading(true)
            await cancelInvestigationReportAudit(planId)
            message.success(__('撤回成功'))
            // 刷新
            run({ ...searchCondition })
        } catch (error) {
            formatError(error)
        } finally {
            setBtnLoading(false)
        }
    }

    const handleOperate = async (op: OperateType, item: any) => {
        switch (op) {
            case OperateType.DETAIL:
                setCurReport(item)
                setDetailVisible(true)
                break
            case OperateType.CREATE:
                // 创建
                setOptOpen(true)
                break
            case OperateType.EDIT:
                // 编辑
                setCurReport(item)
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
            if (sorter.columnKey === 'updated_at') {
                setTableSort({
                    updateTime: sorter.order || 'ascend',
                })
            } else {
                setTableSort({
                    updateTime: null,
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
        if (searchCondition.sort === 'updated_at') {
            if (searchCondition.direction === SortDirection.ASC) {
                setTableSort({
                    updateTime: 'descend',
                })
            } else {
                setTableSort({
                    updateTime: 'ascend',
                })
            }
        } else if (searchCondition.sort === SortDirection.ASC) {
            setTableSort({
                updateTime: null,
            })
        } else {
            setTableSort({
                updateTime: null,
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
                    <span>{__('调研报告名称')}</span>
                    <span
                        style={{
                            color: 'rgba(0,0,0,0.45)',
                            fontWeight: 'normal',
                        }}
                    >
                        （{__('调研目的')}）
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
                        <div
                            hidden={
                                ![
                                    '',
                                    'undo',
                                    'auditing',
                                    'reject',
                                    'change_auditing', // 变更审核中
                                    'change_reject', // 变更未通过
                                ].includes(record?.audit_status)
                            }
                            className={
                                ['reject', 'change_reject'].includes(
                                    record?.audit_status,
                                )
                                    ? styles['is-reject']
                                    : record?.audit_status === 'undo' ||
                                      record?.audit_status === ''
                                    ? styles['is-undo']
                                    : undefined
                            }
                        >
                            {record?.audit_status === 'change_auditing'
                                ? __('变更') + __('审核中')
                                : record?.audit_status === 'change_reject'
                                ? __('变更') + __('未通过')
                                : record?.audit_status === 'undo' ||
                                  record?.audit_status === ''
                                ? __('待提交')
                                : __('申报') +
                                  (AuditOptions.find(
                                      (o) => o.value === record?.audit_status,
                                  )?.label ?? '')}

                            {['reject', 'change_reject'].includes(
                                record?.audit_status,
                            ) &&
                                record?.reject_reason && (
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
                                                    {(record?.audit_status ===
                                                    'change_reject'
                                                        ? __('变更')
                                                        : __('申报')) +
                                                        __('审核未通过')}
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
                    </div>
                    <div
                        className={styles.planContent}
                        title={record?.research_purpose}
                    >
                        {record?.research_purpose || '--'}
                    </div>
                </div>
            ),
        },

        {
            title: __('关联工单'),
            dataIndex: 'work_order_name',
            key: 'work_order_name',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.planTitle}>
                    <div
                        title={text}
                        onClick={() => {
                            setCurReport(record)
                            setOrderDetailVisible(true)
                        }}
                    >
                        {text || '--'}
                    </div>
                </div>
            ),
        },

        {
            title: __('更新人'),
            dataIndex: 'updated_by_user_name',
            key: 'updated_by_user_name',
            ellipsis: true,
            render: (text, record) => (
                <div
                    className={styles.ellipsisTitle}
                    title={record.updated_by_user_name}
                >
                    {text || '--'}
                </div>
            ),
        },
        {
            title: __('更新时间'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.updateTime,
            showSorterTooltip: false,
            render: (text: any) => {
                return text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '--'
            },
        },

        {
            title: __('操作'),
            key: 'action',
            width: 220,
            fixed: FixedType.RIGHT,
            render: (_: string, record) => {
                const isAuditing = ['auditing', 'change_auditing'].includes(
                    record?.audit_status,
                )
                const isMe = userId === record?.created_by_uid
                const btnList: any[] = [
                    {
                        key: OperateType.DETAIL,
                        label: __('详情'),
                        show: true,
                    },
                    {
                        key: OperateType.EDIT,
                        label: __('编辑'),
                        show: isMe,
                        disabled: isAuditing,
                    },
                    {
                        key: OperateType.DELETE,
                        label: __('删除'),
                        tip: __('确定要执行此操作吗？'),
                        show: true,
                        disabled: isAuditing,
                    },
                    {
                        key: OperateType.REVOCATION,
                        label: __('撤回审核'),
                        tip: __('确定要执行此操作吗？'),
                        show: isAuditing && isMe,
                    },
                ]
                return (
                    <Space size={16} className={styles.oprColumn}>
                        {btnList
                            .filter((o) => o.show)
                            .map((item) => {
                                return (
                                    <Popconfirm
                                        okButtonProps={{
                                            loading: btnLoading,
                                        }}
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
                                                    ? (record?.audit_status ===
                                                      'change_auditing'
                                                          ? __('变更')
                                                          : __('申报')) +
                                                      __('审核中，无法操作')
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
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            offset: 1,
        })
        setSelectedSort(selectedMenu)
        onChangeMenuToTableSort(selectedMenu)
    }

    const onChangeMenuToTableSort = (selectedMenu) => {
        switch (selectedMenu.key) {
            case 'updated_at':
                setTableSort({
                    updateTime:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                })
                break
            default:
                setTableSort({
                    updateTime: null,
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
                        <div> {__('点击【新建】可新建调研报告')}</div>
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
        <div className={styles.inverstigation}>
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
                            placeholder={__('搜索调研报告、关联工单')}
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
                                if (key === 'date_range') {
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
                                        started_at: undefined,
                                        finished_at: undefined,
                                    })
                                }
                            }}
                            defaultValue={{
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
                    id={curReport?.id}
                    onClose={(refresh?: boolean) => {
                        if (refresh) {
                            run({ ...searchCondition })
                        }
                        setOptOpen(false)
                        setCurReport(undefined)
                    }}
                />
            )}
            {detailVisible && (
                <DetailModal
                    id={curReport?.id}
                    onClose={() => {
                        setDetailVisible(false)
                        setCurReport(undefined)
                    }}
                />
            )}

            {orderDetailVisible && (
                <OrderDetailModal
                    id={curReport?.work_order_id}
                    onClose={() => {
                        setOrderDetailVisible(false)
                        setCurReport(undefined)
                    }}
                />
            )}
        </div>
    )
}

export default Investigation
