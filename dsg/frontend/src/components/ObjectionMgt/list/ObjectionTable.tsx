import { Button, Space, Table, Tooltip, message } from 'antd'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useUpdateEffect } from 'ahooks'
import { trim, omit } from 'lodash'
import { SortOrder } from 'antd/lib/table/interface'
import {
    Empty,
    LightweightSearch,
    ListPagination,
    ListType,
    Loader,
    OptionBarTool,
    OptionMenuType,
    SearchInput,
} from '@/ui'
import DropDownFilter from '../../DropDownFilter'
import {
    SortDirection,
    formatError,
    cancelRaiseObjectionAudit,
    reportObjection,
    ObjectionTypeEnum,
    IGetSSZDDataObjectionListParams,
    createSSZDSyncTask,
    SSZDSyncTaskEnum,
} from '@/core'
import { formatTime } from '@/utils'
import { RefreshBtn, SortBtn } from '../../ToolbarComponents'
import { FontIcon } from '@/icons'
import {
    ObjectionTabMap,
    StatusView,
    ObjectionOperate,
    ObjectionMenuEnum,
    getConfirmModal,
    objectionInfo,
    renderEmpty,
    renderLoader,
    checkDealPerm,
} from '../helper'
import Details from '../detail/Details'
import Evaluation from '../operate/Evaluation'
import CreateObjection from '../operate/CreateObjection'
import Transfer from '../operate/Transfer'
import Audit from '../operate/Audit'
import AuditDetails from '../detail/AuditDetails'
import Deal from '../operate/Deal'
import __ from '../locale'
import styles from '../styles.module.less'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IObjectionTab {
    menu: string
    func: Function
}

const ObjectionTable: React.FC<IObjectionTab> = ({ menu, func }) => {
    // 初始化 load
    const [loading, setLoading] = useState<boolean>(true)
    // 加载数据 load
    const [fetching, setFetching] = useState<boolean>(true)
    // 同步 loading
    const [syncLoading, setSyncLoading] = useState<boolean>(false)
    // 同步数据
    const [syncData, setSyncData] = useState<any>()
    // 表格数据
    const [tableData, setTableData] = useState<any[]>([])
    // 总条数
    const [total, setTotal] = useState<number>(0)
    // 当前操作项
    const [operateItem, setOperateItem] = useState<any>()
    // 表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>(ObjectionTabMap[menu].defaultTableSort)
    // 转办弹窗
    const [transferVisible, setTransferVisible] = useState(false)
    // 处理弹窗
    const [dealVisible, setDealVisible] = useState(false)
    // 详情弹窗
    const [detailsVisible, setDetailsVisible] = useState(false)
    // 评价弹窗
    const [evaluationVisible, setEvaluationVisible] = useState(false)
    // 审核弹窗
    const [auditVisible, setAuditVisible] = useState(false)
    // 搜索条件
    const [searchCondition, setSearchCondition] =
        useState<IGetSSZDDataObjectionListParams>()
    // 获取 搜索条件
    const searchConditionRef = useRef(searchCondition)
    // 下拉排序
    const [selectedSort, setSelectedSort] = useState<any>(
        ObjectionTabMap[menu].defaultMenu,
    )
    const searchRef = useRef<any>(null)
    const { checkPermission } = useUserPermCtx()
    const [userInfo] = useCurrentUser()

    useEffect(() => {
        // 初始化搜索条件
        const { initSearch } = ObjectionTabMap[menu]
        setSearchCondition(initSearch)
    }, [menu])

    useEffect(() => {
        searchConditionRef.current = searchCondition
    }, [searchCondition])

    // 是否有过滤值
    const isSearchStatus = useMemo(() => {
        const ignoreAttr = ['offset', 'limit', 'sort', 'direction', 'target']
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
            const res = await func(params)
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

    // 撤销
    const handleRevoke = async (record) => {
        try {
            await cancelRaiseObjectionAudit(record?.id)
            getTableList({ ...searchConditionRef.current })
        } catch (error) {
            formatError(error)
        }
    }

    // 重新上报
    const handleReReport = async (record) => {
        try {
            await reportObjection(record?.id)
            getTableList({ ...searchConditionRef.current })
        } catch (error) {
            formatError(error)
        }
    }

    // 表格操作事件
    const handleOptionTable = (key: string, record) => {
        setOperateItem(record)
        switch (key) {
            case ObjectionOperate.Details:
                setDetailsVisible(true)
                break
            case ObjectionOperate.Evaluation:
                setEvaluationVisible(true)
                break
            case ObjectionOperate.Transfer:
                setTransferVisible(true)
                break
            case ObjectionOperate.Deal:
                setDealVisible(true)
                break
            case ObjectionOperate.Audit:
                setAuditVisible(true)
                break
            case ObjectionOperate.Revoke:
                getConfirmModal({
                    title: __('确定撤销${title}申请吗？', {
                        title: record?.title,
                    }),
                    content: __('撤销申请后将无法撤回，请确认。'),
                    onOk: () => handleRevoke(record),
                })
                break
            case ObjectionOperate.ReReport:
                getConfirmModal({
                    title: __('确定重新上报${title}吗？', {
                        title: record?.title,
                    }),
                    content: __('上报后的信息无法修改，请确认。'),
                    onOk: () => handleReReport(record),
                })
                break
            default:
                break
        }
    }

    // 表格操作项
    const getTableOptions = (record) => {
        const optionMenus = [
            {
                key: ObjectionOperate.Details,
                label: __('详情'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: ObjectionOperate.Revoke,
                label: __('撤销'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: ObjectionOperate.ReReport,
                label: __('重新上报'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: ObjectionOperate.Evaluation,
                label: __('评价'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: ObjectionOperate.Transfer,
                label: __('转办'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: ObjectionOperate.Deal,
                label: __('处理'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: ObjectionOperate.Audit,
                label: __('审核'),
                menuType: OptionMenuType.Menu,
            },
        ]

        // 决定显示操作项的状态值
        const { status } = record
        let statusOp = ObjectionTabMap[menu].actionMap[status]?.operation
        // 如果包含Deal,需要进一步检查处理按钮是否显示
        if (statusOp.includes(ObjectionOperate.Deal)) {
            statusOp = checkDealPerm({
                record,
                checkPermission,
                statusOp,
                userInfo,
            })
        }

        return optionMenus.filter((item) => statusOp?.includes(item.key))
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
                title: __('异议标题'),
                dataIndex: 'title',
                key: 'title',
                width: 180,
                ...commonProps,
                render: (value, record) => (
                    <span
                        title={value}
                        className={styles.columnTitle}
                        onClick={() =>
                            handleOptionTable(ObjectionOperate.Details, record)
                        }
                    >
                        {value}
                    </span>
                ),
            },
            {
                title: __('异议类型'),
                dataIndex: 'objection_type',
                key: 'objection_type',
                width: 140,
                ...commonProps,
                render: (value, record) =>
                    objectionInfo[value]?.objectTypeText || '--',
            },
            {
                title: __('数据目录/资源名称'),
                dataIndex: 'data_name',
                key: 'data_name',
                ...commonProps,
            },
            {
                title: __('纠错/异议描述'),
                dataIndex: 'description',
                key: 'description',
                ...commonProps,
            },
            {
                title: __('处理进度'),
                dataIndex: 'status',
                key: 'status',
                render: (value, record) => {
                    const item = ObjectionTabMap[menu].actionMap[record.status]
                    const tip = item?.errorKey
                        ? item.errorTitle + record[item.errorKey]
                        : undefined
                    return <StatusView data={item} tip={tip} />
                },
            },
            {
                title: __('审核状态'),
                dataIndex: 'audit_status',
                key: 'audit_status',
                width: 120,
                render: (value, record) => {
                    const item = ObjectionTabMap[menu].actionMap[record.status]
                    return <StatusView data={item} />
                },
            },
            {
                title: __('处理人'),
                dataIndex: 'user_name',
                key: 'user_name',
                ...commonProps,
            },
            {
                title: __('提出部门'),
                key: 'objection_org_name',
                dataIndex: 'objection_org_name',
                ...commonProps,
            },
            {
                title: __('提出人'),
                dataIndex: 'contact',
                key: 'contact',
                ...commonProps,
            },
            {
                title: __('提出人电话'),
                dataIndex: 'phone',
                key: 'phone',
                width: 180,
                ...commonProps,
            },
            {
                title: __('申请时间'),
                dataIndex: 'apply_time',
                key: 'apply_time',
                ...sortableColumn('apply_time'),
                ...commonProps,
                render: (val: number) => (val ? formatTime(val) : '--'),
            },
            {
                title: __('提出异议时间'),
                dataIndex: 'created_at',
                key: 'created_at',
                ...sortableColumn('created_at'),
                ...commonProps,
                render: (val: number) => (val ? formatTime(val) : '--'),
            },
            {
                title: __('更新时间'),
                dataIndex: 'updated_at',
                key: 'updated_at',
                ...sortableColumn('updated_at'),
                ...commonProps,
                render: (val: number) => (val ? formatTime(val) : '--'),
            },
            {
                title: __('操作'),
                key: 'action',
                width: ObjectionTabMap[menu].actionWidth,
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
            ObjectionTabMap[menu].columnKeys.includes(col.key),
        )
    }, [menu, tableSort])

    // 发起同步任务
    const getSyncData = async () => {
        try {
            setSyncLoading(true)
            const res = await createSSZDSyncTask(
                menu === ObjectionMenuEnum.Raise
                    ? SSZDSyncTaskEnum.RaiseObjection
                    : SSZDSyncTaskEnum.HandleObjection,
            )
            if (res) {
                setSyncData(res)
                handleRefresh()
            }
        } catch (err) {
            formatError(err)
        } finally {
            setSyncLoading(false)
        }
    }

    // 关键字搜索
    const handleKwSearch = (kw) => {
        if (kw === searchCondition?.keyword) return
        setSearchCondition((prev) => ({
            ...prev,
            keyword: kw,
            offset: 1,
        }))
    }

    // 轻量级搜索改变
    const handleLightWeightSearchChange = (d, key) => {
        if (key === 'status') {
            setSearchCondition((prev) => ({
                ...prev,
                offset: 1,
                status: d.status || undefined,
            }))
        }
    }

    // 筛选顺序变化
    const onChangeMenuToTableSort = (selectedMenu) => {
        const newSort: any = {
            created_at: null,
            updated_at: null,
        }

        const key = selectedMenu === 'created_at' ? 'created_at' : 'updated_at'
        newSort[key] =
            searchCondition?.direction === SortDirection.ASC
                ? 'descend'
                : 'ascend'

        setTableSort(newSort)

        return {
            key,
            sort:
                newSort[key] === 'ascend'
                    ? SortDirection.ASC
                    : SortDirection.DESC,
        }
    }

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition((prev) => ({
            ...prev,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            offset: 1,
        }))
        onChangeMenuToTableSort(selectedMenu)
    }

    // 刷新
    const handleRefresh = (refresh: boolean = true) => {
        setSearchCondition({
            ...searchCondition,
            offset: refresh ? 1 : searchCondition?.offset,
        })
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        const newSort = {
            created_at: null,
            updated_at: null,
        }

        if (sorter.column) {
            const key = sorter.columnKey
            newSort[key] = sorter.order || 'ascend'
        }

        if (searchCondition?.sort) {
            const key = searchCondition?.sort
            newSort[key] =
                searchCondition?.direction === SortDirection.ASC
                    ? 'descend'
                    : 'ascend'
        }

        setTableSort(newSort)

        return {
            key: sorter.column ? sorter.columnKey : searchCondition?.sort,
            sort:
                newSort[newSort.created_at ? 'created_at' : 'updated_at'] ===
                'ascend'
                    ? SortDirection.ASC
                    : SortDirection.DESC,
        }
    }

    // 表格排序改变
    const onTableChange = (currentPagination, filters, sorter) => {
        const selectedMenu = handleTableChange(sorter)
        setSelectedSort(selectedMenu)
        setSearchCondition((prev) => ({
            ...prev,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            offset: 1,
        }))
    }

    // 分页改变
    const onPaginationChange = (page, pageSize) => {
        setSearchCondition((prev) => ({
            ...prev,
            offset: page || 1,
            limit: pageSize,
        }))
    }

    // 顶部左侧操作
    const leftOperate = (
        <div className={styles.topLeft}>
            <Tooltip title={syncLoading ? __('同步中') : ''}>
                <Button
                    className={styles.syncButton}
                    icon={
                        <FontIcon
                            className={styles.syncIcon}
                            name="icon-shujutongbu"
                        />
                    }
                    disabled={syncLoading}
                    onClick={() => getSyncData()}
                >
                    {__('数据同步')}
                </Button>
            </Tooltip>
            {syncData?.last_sync_time && (
                <span className={styles.syncTime}>
                    {__('数据同步时间：${syncTime}', {
                        syncTime: formatTime(syncData.last_sync_time),
                    })}
                </span>
            )}
        </div>
    )

    // 顶部右侧操作
    const rightOperate = (tableData.length > 0 || isSearchStatus) && (
        <div className={styles.topRight}>
            <Space size={8}>
                <SearchInput
                    value={searchCondition?.keyword}
                    style={{ width: 280 }}
                    placeholder={__('搜索异议标题、数据目录/资源名称')}
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
                    formData={ObjectionTabMap[menu].searchFormData}
                    onChange={handleLightWeightSearchChange}
                    defaultValue={ObjectionTabMap[menu].defaultSearch}
                />
                <SortBtn
                    contentNode={
                        <DropDownFilter
                            menus={ObjectionTabMap[menu].sortMenus}
                            defaultMenu={ObjectionTabMap[menu].defaultMenu}
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
        <div className={styles.objectionContent}>
            {loading ? (
                renderLoader()
            ) : (
                <>
                    {menu === ObjectionMenuEnum.Raise ||
                    menu === ObjectionMenuEnum.Handle ? (
                        <div className={styles.objectionOperation}>
                            {leftOperate}
                            {rightOperate}
                        </div>
                    ) : null}
                    {tableData.length === 0 && !isSearchStatus ? (
                        renderEmpty()
                    ) : (
                        <>
                            <Table
                                columns={columns}
                                dataSource={tableData}
                                loading={fetching}
                                rowKey="id"
                                rowClassName={styles.tableRow}
                                onChange={onTableChange}
                                scroll={{
                                    x: columns.length * 180,
                                    y: `calc(100vh - 270px)`,
                                }}
                                pagination={false}
                                locale={{ emptyText: <Empty /> }}
                            />
                            <ListPagination
                                listType={ListType.WideList}
                                queryParams={searchCondition}
                                totalCount={total}
                                onChange={onPaginationChange}
                                hideOnSinglePage={false}
                                className={styles.pagination}
                            />
                        </>
                    )}
                </>
            )}

            {detailsVisible ? (
                menu === ObjectionMenuEnum.Reviewed ? (
                    <AuditDetails
                        open={detailsVisible}
                        item={operateItem}
                        onCancel={() => setDetailsVisible(false)}
                    />
                ) : (
                    <Details
                        open={detailsVisible}
                        menu={menu as ObjectionMenuEnum}
                        item={operateItem}
                        onDetailsClose={() => setDetailsVisible(false)}
                    />
                )
            ) : null}

            {evaluationVisible ? (
                <Evaluation
                    open={evaluationVisible}
                    item={operateItem}
                    onEvaluationSuccess={() => {
                        setEvaluationVisible(false)
                        handleRefresh()
                    }}
                    onEvaluationClose={() => setEvaluationVisible(false)}
                />
            ) : null}

            {transferVisible ? (
                <Transfer
                    open={transferVisible}
                    item={operateItem}
                    onTransferSuccess={() => {
                        setTransferVisible(false)
                        handleRefresh()
                    }}
                    onTransferClose={() => setTransferVisible(false)}
                />
            ) : null}

            {dealVisible ? (
                <Deal
                    open={dealVisible}
                    item={operateItem}
                    onDealSuccess={() => {
                        setDealVisible(false)
                        handleRefresh()
                    }}
                    onDealClose={() => setDealVisible(false)}
                />
            ) : null}

            {auditVisible ? (
                <Audit
                    open={auditVisible}
                    item={operateItem}
                    onAuditSuccess={() => {
                        setAuditVisible(false)
                        handleRefresh()
                    }}
                    onAuditClose={() => setAuditVisible(false)}
                />
            ) : null}
        </div>
    )
}

export default ObjectionTable
