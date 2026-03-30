import { Button, Radio, Space, Table, Tooltip, message } from 'antd'

import {
    CheckCircleFilled,
    CloseCircleFilled,
    SyncOutlined,
} from '@ant-design/icons'
import { useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import { omit } from 'lodash'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreateObjection } from '@/components/ObjectionMgt'
import {
    ObjectionTypeEnum,
    SortDirection,
    formatError,
    getSSZDDemandAuditProcess,
    getShareApplyAuditList,
    getShareApplyList,
    postShareApplyApproveAuditInstance,
    putShareApplyApproveAuditEscalate,
    putShareApplyEscalate,
    putShareApplyUnsub,
} from '@/core'
import { FontIcon, ShujutongbuOutlined } from '@/icons'
import {
    Empty,
    LightweightSearch,
    ListPagination,
    ListType,
    OptionBarTool,
    OptionMenuType,
    SearchInput,
} from '@/ui'
import { formatTime, rewriteUrl, useQuery } from '@/utils'
import { error as modalError, success } from '@/utils/modalHelper'
import { PolicyType } from '../AuditPolicy/const'
import DropDownFilter from '../DropDownFilter'
import { RefreshBtn, SortBtn } from '../ToolbarComponents'
import RevokeModal from './Apply/RevokeModal'
import AuditDrawer from './Audit/AuditDrawer'
import {
    ApplyProcess,
    AuditType,
    SharingOperate,
    SharingTab,
    SubscribeStatus,
    applyResourceMap,
    auditTypeMap,
    auditTypeOptions,
    sharingTabMap,
    subscribeStatusOptions,
} from './const'
import {
    PromptModal,
    ResourceInvalidTag,
    StatusView,
    changeUrlData,
    renderEmpty,
    renderLoader,
} from './helper'
import __ from './locale'
import { useResourceShareContext } from './ResourceShareProvider'
import SharingDrawer from './SharingDrawer'
import styles from './styles.module.less'
import SubscribeInfos from './Subscribe/SubscribeInfos'
import SubscribeModal from './Subscribe/SubscribeModal'

interface IResourceTable {
    tab: string
}

const ResourceTable: React.FC<IResourceTable> = ({ tab }) => {
    const navigate = useNavigate()
    const query = useQuery()
    const operate = query.get('operate')
    const id = query.get('applyId')

    const searchRef = useRef<any>(null)
    const [searchCondition, setSearchCondition] = useState<any>()
    // 下拉排序
    const [selectedSort, setSelectedSort] = useState<any>(
        sharingTabMap[tab].defaultMenu,
    )
    // 表头排序
    const [tableSort, setTableSort] = useState<any>(
        sharingTabMap[tab].defaultTableSort,
    )
    // 订阅状态选中值
    const [subscribeKey, setSubscribeKey] = useState<string>(
        SubscribeStatus.None,
    )
    // 审核类型选中值
    const [auditTypeKey, setAuditTypeKey] = useState<string>(AuditType.None)

    // load
    const [loading, setLoading] = useState<boolean>(true)
    const [fetching, setFetching] = useState<boolean>(true)
    const [initiateAuditLoading, setInitiateAuditLoading] =
        useState<boolean>(false)

    // 弹窗显示
    const [showRevokeModal, setShowRevokeModal] = useState(false)
    const [showSubscribeModal, setShowSubscribeModal] = useState(false)
    const [showSubscribeDetails, setShowSubscribeDetails] = useState(false)
    const [showDetails, setShowDetails] = useState(false)
    const [showAuditModal, setShowAuditModal] = useState(false)
    const [showObjectionModal, setShowObjectionModal] = useState(false)

    // 表格数据
    const [tableData, setTableData] = useState<any[]>([])
    // 总条数
    const [total, setTotal] = useState<number>(0)
    // 当前操作项
    const [operateItem, setOperateItem] = useState<any>()
    // 当前操作
    const [detailsOp, setDetailsOp] = useState<any>('view')
    // 是否配置审核策略
    const [existPermissionReq, setExistPermissionReq] = useState({
        [PolicyType.SSZDShareApplyApprove]: true,
        [PolicyType.SSZDShareApplyEscalate]: true,
    })

    const { syncLoading, syncData, onToSyncData } = useResourceShareContext()

    useEffect(() => {
        const config = sharingTabMap[tab]
        const initSearch = {
            limit: 10,
            offset: 1,
            sort: config.defaultMenu?.key,
            direction: config.defaultMenu?.sort,
            target: tab,
        }
        setSearchCondition(initSearch)
        setSelectedSort(sharingTabMap[tab].defaultMenu)
        setTableSort(sharingTabMap[tab].defaultTableSort)
        setSubscribeKey(SubscribeStatus.None)
        setAuditTypeKey(AuditType.None)
    }, [tab])

    useEffect(() => {
        if (operate && id) {
            setDetailsOp(operate)
            setOperateItem({ id })
            setShowDetails(true)
        }
    }, [operate])

    // 是否有过滤值
    const isSearchStatus = useMemo(() => {
        const ignoreAttr = ['offset', 'limit', 'sort', 'direction', 'target']
        return Object.values(omit(searchCondition, ignoreAttr)).some(
            (item) => item,
        )
    }, [searchCondition])

    // 根据条件请求数据
    useUpdateEffect(() => {
        if (searchCondition) {
            getTableList({ ...searchCondition })
        }
    }, [searchCondition])

    // 获取表格数据
    const getTableList = async (params: any) => {
        try {
            setFetching(true)
            const req = [SharingTab.Reviewed, SharingTab.ToReviewed].includes(
                tab as SharingTab,
            )
                ? getShareApplyAuditList
                : getShareApplyList
            const res = await req(params)
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

    // 获取是否配置权限申请审核策略
    const getAuditProcess = async () => {
        try {
            const res1 = await getSSZDDemandAuditProcess({
                audit_type: PolicyType.SSZDShareApplyApprove,
            })
            const res2 = await getSSZDDemandAuditProcess({
                audit_type: PolicyType.SSZDShareApplyEscalate,
            })
            setExistPermissionReq({
                [PolicyType.SSZDShareApplyApprove]: res1.entries?.length > 0,
                [PolicyType.SSZDShareApplyEscalate]: res2.entries?.length > 0,
            })
        } catch (error) {
            formatError(error)
        }
    }

    // 刷新
    const handleRefresh = (refresh: boolean = true) => {
        setSearchCondition({
            ...searchCondition,
            offset: refresh ? 1 : searchCondition.offset,
        })
    }

    // 重新提交审批
    const toReApprove = async (value) => {
        try {
            await putShareApplyApproveAuditEscalate(value?.id)
            success({
                icon: <CheckCircleFilled style={{ color: '#52C41B' }} />,
                title: __('资源共享处理结果反馈成功'),
                okText: __('确定'),
            })
        } catch (err) {
            modalError({
                icon: <CloseCircleFilled style={{ color: '#ff4d4f' }} />,
                title: __('资源共享处理结果反馈失败'),
                content: formatError(err),
                okText: __('确定'),
            })
        }
    }

    // 表格操作事件
    const handleOptionTable = (key: string, record) => {
        setOperateItem(record)
        switch (key) {
            case SharingOperate.Detail: {
                if (
                    [
                        SharingTab.Reviewed,
                        SharingTab.ToReviewed,
                        SharingTab.Processed,
                    ].includes(tab as SharingTab)
                ) {
                    setDetailsOp('view')
                    setShowDetails(true)
                } else {
                    rewriteUrl(
                        changeUrlData({
                            operate: 'viewWithRecord',
                            applyId: record.id,
                        }),
                    )
                }
                break
            }
            case SharingOperate.Revoke:
                setShowRevokeModal(true)
                break
            case SharingOperate.ReReport:
                PromptModal({
                    title: `${__('确定重新申请${name}吗？', {
                        name: record.catalog_title,
                    })}`,
                    content: __('提交申请后将无法修改内容，请确认。'),
                    async onOk() {
                        try {
                            await putShareApplyEscalate(record?.id)
                            message.success(__('上报成功'))
                            handleRefresh(false)
                        } catch (err) {
                            modalError({
                                icon: (
                                    <CloseCircleFilled
                                        style={{ color: '#ff4d4f' }}
                                    />
                                ),
                                title: __('资源申请发起失败'),
                                content: formatError(err),
                                okText: __('确定'),
                            })
                        }
                    },
                })
                break
            case SharingOperate.Subscribe:
                setShowSubscribeModal(true)
                break
            case SharingOperate.SubscribeInfo:
                setShowSubscribeDetails(true)
                break
            case SharingOperate.StopSubscribe:
                PromptModal({
                    title: `${__('确定停止订阅${name}吗？', {
                        name: record.catalog_title,
                    })}`,
                    content: __('停止订阅后将无法继续使用数据，请确认。'),
                    async onOk() {
                        try {
                            await putShareApplyUnsub(record?.id)
                            message.success(__('停止订阅成功'))
                            setTableData((prev) =>
                                prev.map((item) => {
                                    if (item?.id === record?.id) {
                                        return {
                                            ...item,
                                            status: SubscribeStatus.NotSubscribed,
                                            subscribe_at: 0,
                                        }
                                    }
                                    return item
                                }),
                            )
                        } catch (err) {
                            formatError(err)
                        }
                    },
                })
                break
            case SharingOperate.ReApprove:
                toReApprove(record)
                break
            case SharingOperate.Audit:
                setShowAuditModal(true)
                break
            case SharingOperate.Objection:
                setShowObjectionModal(true)
                break
            default:
                break
        }
    }

    // 表格操作项
    const getTableOptions = (record) => {
        const optionMenus = [
            {
                key: SharingOperate.Detail,
                label: __('详情'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: SharingOperate.Revoke,
                label: __('撤销'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: SharingOperate.ReReport,
                label: __('重新上报'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: SharingOperate.Subscribe,
                label: (
                    <Tooltip
                        title={
                            record.catalog_status === 0
                                ? __('目录已失效，无法订阅')
                                : ''
                        }
                    >
                        <span>{__('订阅')}</span>
                    </Tooltip>
                ),
                menuType: OptionMenuType.Menu,
                disabled: record.catalog_status === 0,
            },
            {
                key: SharingOperate.SubscribeInfo,
                label: __('订阅信息'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: SharingOperate.StopSubscribe,
                label: __('停止订阅'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: SharingOperate.Audit,
                label: __('审核'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: SharingOperate.ReApprove,
                label: __('重新上报'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: SharingOperate.Objection,
                label: __('提出异议'),
                menuType: OptionMenuType.Menu,
            },
        ]

        // 决定显示操作项的状态值
        const { status, audit_type } = record
        const { actionMap } = sharingTabMap[tab]
        const statusOp =
            actionMap[tab === SharingTab.ToReviewed ? audit_type : status]
                ?.operation
        return optionMenus.filter((item) => statusOp?.includes(item.key))
    }

    const columns: any = useMemo(() => {
        const cols = [
            {
                title: __('申请编号'),
                dataIndex: 'apply_id',
                key: 'apply_id',
                width: 180,
                ellipsis: true,
                render: (value, record) => (
                    <span
                        title={value}
                        className={styles.a_name}
                        onClick={() =>
                            handleOptionTable(SharingOperate.Detail, record)
                        }
                    >
                        {value}
                    </span>
                ),
            },
            {
                title: __('申请数据目录名称（编码）'),
                dataIndex: 'catalog',
                key: 'catalog',
                width: 220,
                ellipsis: true,
                render: (value, record) => {
                    const name = record.catalog_title
                    const code = record.catalog_code
                    return (
                        <div className={styles.catalog}>
                            <div title={`${name}（${code}）`}>
                                <div className={styles.name}>{name}</div>
                                <div className={styles.code}>{code}</div>
                            </div>
                            {record.catalog_status === 0 && (
                                <ResourceInvalidTag />
                            )}
                        </div>
                    )
                },
            },
            {
                title: __('申请资源名称'),
                dataIndex: 'resource_name',
                key: 'resource_name',
                ellipsis: true,
                render: (value, record) => value || '--',
            },
            {
                title: __('资源类型'),
                dataIndex: 'resource_type',
                key: 'resource_type',
                ellipsis: true,
                width: 100,
                render: (value, record) =>
                    applyResourceMap[value]?.text || '--',
            },
            {
                title: __('审核类型'),
                dataIndex: 'audit_type',
                key: 'audit_type',
                ellipsis: true,
                render: (value, record) => auditTypeMap[value]?.text || '--',
            },
            {
                title: __('处理进度'),
                dataIndex: 'process_status',
                key: 'process_status',
                render: (value, record) => {
                    const item = sharingTabMap[tab].actionMap[record.status]
                    let tip = record?.[item?.errorKey]
                    if (tip) {
                        tip = item.errorTitle + tip
                    }
                    return <StatusView data={item} tip={tip} />
                },
            },
            {
                title: __('订阅状态'),
                dataIndex: 'subscribe_status',
                key: 'subscribe_status',
                render: (value, record) => {
                    const item = sharingTabMap[tab].actionMap[record.status]
                    return <StatusView data={item} />
                },
            },
            {
                title: __('状态'),
                dataIndex: 'status',
                key: 'status',
                render: (value, record) => {
                    const item = sharingTabMap[tab].actionMap[record.status]
                    let tip = record?.[item?.errorKey]
                    if (tip) {
                        tip = item.errorTitle + tip
                    }
                    return <StatusView data={item} tip={tip} />
                },
            },
            {
                title: __('审核状态'),
                dataIndex: 'audit_status',
                key: 'audit_status',
                render: (value, record) => {
                    const item = sharingTabMap[tab].actionMap[record.status]
                    let tip = record?.[item?.errorKey]
                    if (tip) {
                        tip = item.errorTitle + tip
                    }
                    return <StatusView data={item} tip={tip} />
                },
            },
            {
                title: __('申请人'),
                dataIndex: 'apply_name',
                key: 'apply_name',
                ellipsis: true,
                render: (value, record) => value || '--',
            },
            {
                title: __('使用人'),
                dataIndex: 'user_name',
                key: 'user_name',
                ellipsis: true,
                render: (value, record) => value || '--',
            },
            {
                title: __('使用部门'),
                dataIndex: 'user_org_name',
                key: 'user_org_name',
                ellipsis: true,
                render: (value, record) => (
                    <span title={record?.user_org_path || value}>
                        {value || '--'}
                    </span>
                ),
            },
            {
                title: __('申请时间'),
                dataIndex: 'created_at',
                key: 'created_at',
                sorter: !!tableSort,
                sortOrder: tableSort?.created_at,
                showSorterTooltip: false,
                sortDirections: ['descend', 'ascend', 'descend'],
                width: 200,
                ellipsis: true,
                render: (val: number) => (val ? formatTime(val) : '--'),
            },
            {
                title: __('订阅时间'),
                dataIndex: 'subscribe_at',
                key: 'subscribe_at',
                sorter: !!tableSort,
                sortOrder: tableSort?.subscribe_at,
                showSorterTooltip: false,
                sortDirections: ['descend', 'ascend', 'descend'],
                width: 200,
                ellipsis: true,
                render: (val: number) => (val ? formatTime(val) : '--'),
            },
            {
                title: __('更新时间'),
                dataIndex: 'updated_at',
                key: 'updated_at',
                sorter: !!tableSort,
                sortOrder: tableSort?.updated_at,
                showSorterTooltip: false,
                sortDirections: ['descend', 'ascend', 'descend'],
                width: 200,
                ellipsis: true,
                render: (val: number) => (val ? formatTime(val) : '--'),
            },
            {
                title: __('操作'),
                key: 'action',
                width: sharingTabMap[tab].actionWidth,
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
            sharingTabMap[tab].columnKeys.includes(col.key),
        )
    }, [tab, tableSort])

    const onChangeMenuToTableSort = (selectedMenu) => {
        switch (selectedMenu.key) {
            case 'created_at':
                setTableSort({
                    created_at:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    subscribe_at: null,
                    updated_at: null,
                })
                break
            case 'subscribe_at':
                setTableSort({
                    created_at: null,
                    subscribe_at:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    updated_at: null,
                })
                break
            case 'updated_at':
                setTableSort({
                    created_at: null,
                    subscribe_at: null,
                    updated_at:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                })
                break
            default:
                setTableSort({
                    subscribe_at: null,
                    created_at: null,
                    updated_at: null,
                })
                break
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

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            if (sorter.columnKey === 'created_at') {
                setTableSort({
                    created_at: sorter.order || 'ascend',
                    subscribe_at: null,
                    updated_at: null,
                })
            } else if (sorter.columnKey === 'subscribe_at') {
                setTableSort({
                    created_at: null,
                    subscribe_at: sorter.order || 'ascend',
                    updated_at: null,
                })
            } else {
                setTableSort({
                    subscribe_at: null,
                    created_at: null,
                    updated_at: sorter.order || 'ascend',
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
            setTableSort({
                created_at:
                    searchCondition.direction === SortDirection.ASC
                        ? 'descend'
                        : 'ascend',
                subscribe_at: null,
                updated_at: null,
            })
        } else if (searchCondition.sort === 'subscribe_at') {
            setTableSort({
                created_at: null,
                subscribe_at:
                    searchCondition.direction === SortDirection.ASC
                        ? 'descend'
                        : 'ascend',
                updated_at: null,
            })
        } else {
            setTableSort({
                subscribe_at: null,
                created_at: null,
                updated_at:
                    searchCondition.direction === SortDirection.ASC
                        ? 'descend'
                        : 'ascend',
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

    useUpdateEffect(() => {
        // 同步成功刷新列表
        if (!syncData?.id && !syncLoading) {
            handleRefresh()
        }
    }, [syncData, syncLoading])

    // 一键发起审核
    const onInitiateAudit = async () => {
        try {
            setInitiateAuditLoading(true)
            await postShareApplyApproveAuditInstance()
            message.success({
                content: (
                    <span>
                        {__('已发起审核。')}
                        <a
                            onClick={() => {
                                navigate(`/dataService/resourceSharing/audit`)
                            }}
                        >
                            {__('请前往「资源审核」去审核相关资源')}
                        </a>
                    </span>
                ),
            })
            handleRefresh()
        } catch (err) {
            formatError(err)
        } finally {
            setInitiateAuditLoading(false)
        }
    }

    // 顶部左侧操作
    const leftOperate = (
        <div className={styles.leftOperate}>
            {/* 同步 */}
            {[SharingTab.Apply, SharingTab.Processed].includes(
                tab as SharingTab,
            ) && (
                <Space size={16}>
                    <Tooltip title={syncLoading ? __('同步中') : ''}>
                        <Button
                            icon={
                                syncLoading ? (
                                    <SyncOutlined spin />
                                ) : (
                                    <ShujutongbuOutlined />
                                )
                            }
                            disabled={syncLoading}
                            onClick={() => onToSyncData()}
                        >
                            {__('数据同步')}
                        </Button>
                    </Tooltip>
                    {tab === SharingTab.Processed && tableData.length > 0 && (
                        <Tooltip
                            title={initiateAuditLoading ? __('发起审核中') : ''}
                        >
                            <Button
                                disabled={initiateAuditLoading}
                                onClick={() => onInitiateAudit()}
                            >
                                <FontIcon
                                    name="icon-a-shenhedaibanxianxing"
                                    style={{ fontSize: 14 }}
                                />
                                {__('一键发起审核')}
                            </Button>
                        </Tooltip>
                    )}
                    {syncData?.last_sync_time && (
                        <span className={styles.syncTime}>
                            {__('数据同步时间：')}
                            {formatTime(syncData.last_sync_time)}
                        </span>
                    )}
                </Space>
            )}
            {/* 订阅状态 */}
            {tab === SharingTab.Subscribe &&
                (tableData.length > 0 || isSearchStatus) && (
                    <Radio.Group
                        options={subscribeStatusOptions}
                        onChange={(e) => {
                            setSubscribeKey(e.target.value)
                            setSearchCondition((prev) => ({
                                ...prev,
                                offset: 1,
                                status: e.target.value || undefined,
                            }))
                        }}
                        value={subscribeKey}
                        optionType="button"
                    />
                )}
            {/* 审核类型 */}
            {[SharingTab.Reviewed, SharingTab.ToReviewed].includes(
                tab as SharingTab,
            ) &&
                (tableData.length > 0 || isSearchStatus) && (
                    <Radio.Group
                        options={auditTypeOptions}
                        onChange={(e) => {
                            setAuditTypeKey(e.target.value)
                            setSearchCondition((prev) => ({
                                ...prev,
                                offset: 1,
                                audit_type: e.target.value || undefined,
                            }))
                        }}
                        value={auditTypeKey}
                        optionType="button"
                    />
                )}
        </div>
    )

    // 顶部右侧操作
    const rightOperate = (tableData.length > 0 || isSearchStatus) && (
        <div className={styles.rightOperate}>
            <Space size={8}>
                {sharingTabMap[tab].search && (
                    <SearchInput
                        value={searchCondition?.keyword}
                        style={{ width: 280 }}
                        placeholder={__('搜索申请编号、数据目录名称/资源')}
                        onKeyChange={(kw: string) => {
                            if (kw === searchCondition?.keyword) return
                            setSearchCondition((prev) => ({
                                ...prev,
                                keyword: kw,
                                offset: 1,
                            }))
                        }}
                    />
                )}
                {sharingTabMap[tab].searchFormData && (
                    <LightweightSearch
                        ref={searchRef}
                        formData={sharingTabMap[tab].searchFormData}
                        onChange={(d, key) => {
                            if (key === 'status') {
                                setSearchCondition((prev) => ({
                                    ...prev,
                                    offset: 1,
                                    status: d.status || undefined,
                                }))
                            } else {
                                setSearchCondition((prev) => ({
                                    ...prev,
                                    offset: 1,
                                    status: undefined,
                                    create_begin_time: undefined,
                                    create_end_time: undefined,
                                }))
                            }
                        }}
                        defaultValue={sharingTabMap[tab].defaultSearch}
                    />
                )}
                <span>
                    {sharingTabMap[tab].sortMenus && (
                        <SortBtn
                            contentNode={
                                <DropDownFilter
                                    menus={sharingTabMap[tab].sortMenus}
                                    defaultMenu={sharingTabMap[tab].defaultMenu}
                                    menuChangeCb={handleMenuChange}
                                    changeMenu={selectedSort}
                                />
                            }
                        />
                    )}
                    {sharingTabMap[tab].refresh && (
                        <RefreshBtn onClick={() => handleRefresh()} />
                    )}
                </span>
            </Space>
        </div>
    )

    return (
        <div className={classnames(styles.resourceTable)}>
            {loading ? (
                renderLoader()
            ) : (
                <>
                    <div className={styles.top}>
                        {leftOperate}
                        {rightOperate}
                    </div>
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
                                onChange={(
                                    currentPagination,
                                    filters,
                                    sorter,
                                ) => {
                                    const selectedMenu =
                                        handleTableChange(sorter)
                                    setSelectedSort(selectedMenu)
                                    setSearchCondition((prev) => ({
                                        ...prev,
                                        sort: selectedMenu.key,
                                        direction: selectedMenu.sort,
                                        offset: 1,
                                    }))
                                }}
                                scroll={{
                                    x: columns.length * 182,
                                    y: `calc(100vh - ${
                                        [
                                            SharingTab.Reviewed,
                                            SharingTab.ToReviewed,
                                        ].includes(tab as SharingTab)
                                            ? 311
                                            : 265
                                    }px)`,
                                }}
                                pagination={false}
                                locale={{ emptyText: <Empty /> }}
                            />
                            <ListPagination
                                listType={ListType.WideList}
                                queryParams={searchCondition}
                                totalCount={total}
                                onChange={(page, pageSize) => {
                                    setSearchCondition((prev) => ({
                                        ...prev,
                                        offset: page || 1,
                                        limit: pageSize,
                                    }))
                                }}
                                hideOnSinglePage={false}
                                className={styles.pagination}
                            />
                        </>
                    )}
                </>
            )}

            {/* 撤销申请 */}
            <RevokeModal
                data={operateItem}
                open={showRevokeModal}
                onOk={(value) => {
                    setTableData((prev) =>
                        prev.map((item) => {
                            if (item?.id === operateItem?.id) {
                                return {
                                    ...item,
                                    status: ApplyProcess.ReportCanceled,
                                    catalog_status: 0,
                                    cancel_reason: value,
                                }
                            }
                            return item
                        }),
                    )
                    setShowRevokeModal(false)
                }}
                onCancel={() => setShowRevokeModal(false)}
            />

            {/* 订阅资源 */}
            <SubscribeModal
                data={operateItem}
                open={showSubscribeModal}
                onOk={() => {
                    handleRefresh()
                    setShowSubscribeModal(false)
                }}
                onCancel={() => setShowSubscribeModal(false)}
            />

            {/* 订阅信息 */}
            <SubscribeInfos
                applyId={operateItem?.id}
                open={showSubscribeDetails}
                onClose={() => setShowSubscribeDetails(false)}
            />

            {/* 详情 */}
            <SharingDrawer
                open={showDetails}
                operate={detailsOp}
                applyId={operateItem?.id}
                onClose={() => {
                    setShowDetails(false)
                    rewriteUrl(changeUrlData({}, ['operate', 'applyId']))
                }}
                isModal={[
                    SharingTab.Reviewed,
                    SharingTab.ToReviewed,
                    SharingTab.Processed,
                ].includes(tab as SharingTab)}
            />

            {/* 审核 */}
            <AuditDrawer
                data={operateItem}
                open={showAuditModal}
                onClose={(refresh) => {
                    setShowAuditModal(false)
                    if (refresh) {
                        setSearchCondition((prev) => ({
                            ...prev,
                            offset:
                                tableData.length === 1
                                    ? prev.offset - 1 || 1
                                    : prev.offset,
                        }))
                    }
                }}
            />

            {/* 提出异议 */}
            <CreateObjection
                item={{ ...operateItem, title: '' }}
                open={showObjectionModal}
                type={
                    tab === SharingTab.Apply
                        ? ObjectionTypeEnum.ApplyObjection
                        : ObjectionTypeEnum.UseObjection
                }
                onCreateObjectionClose={() => setShowObjectionModal(false)}
            />
        </div>
    )
}

export default ResourceTable
