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
    delAudit,
    deleteDataAggregationInventories,
    formatError,
    getDataAggregationInventories,
    SortDirection,
} from '@/core'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { LightweightSearch, Loader, SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import { OperateType } from '@/utils'
import DetailModal from './DetailModal'
import {
    CreateMethod,
    DefaultMenu,
    initSearchCondition,
    SearchFilter,
    StatusOptions,
} from './helper'
import __ from './locale'
import OptModal from './OptModal'
import styles from './styles.module.less'

/** 归集清单 */
const ListCollection = () => {
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

    const [initSearch, setInitSearch] = useState<boolean>(true)

    const hasSearchCondition = useMemo(() => {
        return searchCondition.keyword || searchCondition.status
    }, [searchCondition])

    useEffect(() => {
        run({ ...searchCondition, current: searchCondition.offset })
    }, [])

    // 数据归集清单查询
    const getDataList = async (params) => {
        try {
            setLoading(true)
            const obj = params
            const res = await getDataAggregationInventories(obj)
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

    const [curPlan, setCurPlan] = useState<any>()
    const [detailVisible, setDetailVisible] = useState<boolean>(false)
    const [optOpen, setOptOpen] = useState<boolean>(false)

    const handleDelete = async (id: string) => {
        try {
            await deleteDataAggregationInventories(id)
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

    const handleCancelPlan = async (auditId: string) => {
        try {
            await delAudit(auditId)
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
                handleCancelPlan(item?.doc_audit?.biz_id)
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
                    <span>{__('清单名称')}</span>
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
                        <div
                            hidden={record?.status === 'Completed'}
                            className={
                                record?.status === 'Reject'
                                    ? styles['is-reject']
                                    : record?.status === 'Draft'
                                    ? styles['is-undo']
                                    : undefined
                            }
                        >
                            {
                                StatusOptions.find(
                                    (o) => o.value === record?.status,
                                )?.label
                            }
                            {record?.status === 'Reject' &&
                                record?.doc_audit?.audit_msg && (
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
                                                    {
                                                        record?.doc_audit
                                                            ?.audit_msg
                                                    }
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
            title: __('资源数量'),
            dataIndex: 'resources_count',
            key: 'resources_count',
            ellipsis: true,
            render: (text) => text ?? 0,
        },
        {
            title: __('关联工单'),
            dataIndex: 'work_order_names',
            key: 'work_order_names',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.ellipsisTitle} title={text?.join(`、`)}>
                    {text?.join(`、`) || '--'}
                </div>
            ),
        },
        {
            title: __('创建人'),
            dataIndex: 'creator_name',
            key: 'creator_name',
            ellipsis: true,
            render: (text, record) => (
                <div
                    className={styles.ellipsisTitle}
                    title={record.creator_name}
                >
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
            sortOrder: tableSort.createTime,
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
                const isAuditing = record?.status === 'Auditing'
                const isPass = record?.status === 'Completed'
                const isCreatedByWorkOrder =
                    record?.creation_method === CreateMethod.WorkOrder
                const btnList: any[] = [
                    {
                        key: OperateType.DETAIL,
                        label: __('详情'),
                        show: true,
                    },
                    {
                        key: OperateType.EDIT,
                        label: __('编辑'),
                        show: !isPass && !isCreatedByWorkOrder,
                        disabled: isAuditing,
                    },
                    {
                        key: OperateType.DELETE,
                        label: __('删除'),
                        tip: __('确定要执行此操作吗？'),
                        show: !isPass && !isCreatedByWorkOrder,
                        disabled: isAuditing,
                    },
                    {
                        key: OperateType.REVOCATION,
                        label: __('撤回审核'),
                        tip: __('确定要执行此操作吗？'),
                        show: isAuditing && !isCreatedByWorkOrder,
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
                        <div> {__('点击【新建】可新建数据归集清单')}</div>
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
        <div className={styles['list-collection']}>
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
                            placeholder={__('搜索归集清单名称、编号')}
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
                                } else {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        status: undefined,
                                    })
                                }
                            }}
                            defaultValue={{
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
                            rowClassName={styles.tableRow}
                            columns={columns}
                            {...tableProps}
                            rowKey="id"
                            scroll={{
                                x: 1340,
                                y:
                                    tableProps.dataSource.length === 0
                                        ? undefined
                                        : `calc(100vh - 274px)`,
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
                    id={curPlan?.id}
                    onClose={(refresh?: boolean) => {
                        if (refresh) {
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

export default ListCollection
