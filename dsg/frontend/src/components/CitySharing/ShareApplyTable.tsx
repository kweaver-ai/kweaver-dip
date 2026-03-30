import { ExclamationCircleFilled, PlusOutlined } from '@ant-design/icons'
import { useSize, useUpdateEffect } from 'ahooks'
import { Button, Checkbox, message, Space, Table, Tabs } from 'antd'
import classnames from 'classnames'
import { omit } from 'lodash'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { confirm } from '@/utils/modalHelper'
import {
    formatTime,
    getActualUrl,
    getPlatformNumber,
    rewriteUrl,
    useQuery,
} from '@/utils'
import { Empty, OptionBarTool, SearchInput } from '@/ui'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
    cancelSignOffCityShareApply,
    closeCityShareApply,
    deleteCityShareApply,
    FeedbackTargetEnum,
    formatError,
    getCityShareApplyAnalysisList,
    getCityShareApplyAuditList,
    getCityShareApplyDataProviderAuditList,
    getCityShareApplyResourceList,
    getShareApplyFeedbackList,
    LoginPlatform,
    ShareApplyAuditStatus,
    ShareApplyStatus,
    signOffCityShareApply,
    SortDirection,
} from '@/core'
import SearchLayout from '../SearchLayout'
import { RefreshBtn } from '../ToolbarComponents'
import Analysis from './Analysis'
import ConclusionConfirm from './Analysis/ConclusionConfirm'
import AnalysisAudit from './Audit/AnalysisAudit'
import ApplyAudit from './Audit/ApplyAudit'
import DataProviderAudit from './Audit/DataProviderAudit'
import FeedbackAudit from './Audit/FeedbackAudit'
import SharingDrawer from './CitySharingDrawer'
import {
    allOptionMenus,
    FeedbackStatusEnum,
    leftMenuItems,
    recordSearchFilter,
    SharingOperate,
    SharingTab,
    sharingTabMap,
} from './const'
import Feedback from './Feedback/Feedback'
import StartFeedback from './Feedback/StartFeedback'
import {
    ApplierView,
    changeUrlData,
    MultiColumn,
    renderEmpty,
    renderLoader,
    SourceTypeView,
    StatusFilter,
    StatusView,
    SubTitle,
    timeStrToTimestamp,
} from './helper'
import ConfirmPlan from './Implement/ConfirmPlan'
import __ from './locale'
import Revocate from './Revocate'
import styles from './styles.module.less'

interface IShareApplyTable {
    tab: string
    isPersonalCenter?: boolean
}

const ShareApplyTable: React.FC<IShareApplyTable> = ({
    tab,
    isPersonalCenter = false,
}) => {
    const navigate = useNavigate()
    const query = useQuery()
    const operate = query.get('operate')
    const id = query.get('applyId')
    const platform = getPlatformNumber()

    const searchRef = useRef<any>(null)
    const searchBoxRef = useRef<any>(null)
    const searchSize = useSize(searchBoxRef) || { width: 240, height: 32 }
    const [searchCondition, setSearchCondition] = useState<any>({})
    // // 下拉排序
    // const [selectedSort, setSelectedSort] = useState<any>(
    //     sharingTabMap[tab].defaultMenu,
    // )
    // 表头排序
    const [tableSort, setTableSort] = useState<any>(
        sharingTabMap[tab].defaultTableSort,
    )

    // load
    const [loading, setLoading] = useState<boolean>(true)
    const [fetching, setFetching] = useState<boolean>(true)

    // 弹窗显示
    const [showDetails, setShowDetails] = useState(false)

    // 表格数据
    const [tableData, setTableData] = useState<any[]>([])
    // 总条数
    const [total, setTotal] = useState<number>(0)
    // 当前操作项
    const [operateItem, setOperateItem] = useState<any>()
    // 当前操作
    const [detailsOp, setDetailsOp] = useState<SharingOperate>(
        SharingOperate.Detail,
    )

    const [showImplement, setShowImplement] = useState(false)

    const [showImplementConfirm, setShowImplementConfirm] = useState(false)
    const [showImplementResult, setShowImplementResult] = useState(false)
    const [showConclusionConfirm, setShowConclusionConfirm] = useState(false)

    const [applyAuditOpen, setApplyAuditOpen] = useState(false)

    const [analysisAuditOpen, setAnalysisAuditOpen] = useState(false)

    const [dataAuditOpen, setDataAuditOpen] = useState(false)
    // 选中的状态（申请清单和分析完善左侧状态）
    const [selectStatus, setSelectStatus] = useState<ShareApplyStatus>(
        ShareApplyStatus.All,
    )
    // 表格高度
    const [scrollY, setScrollY] = useState<string>(
        sharingTabMap[tab].defaultScrollY || `calc(100vh - 227px)`,
    )
    const searchFormRef: any = useRef()
    // 假设从上下文或props中获取用户角色
    const [userInfo] = useCurrentUser()
    const [showAnalysis, setShowAnalysis] = useState(false)
    const [cancelOpen, setCancelOpen] = useState(false)
    const [feedbackActiveTab, setFeedbackActiveTab] = useState(
        FeedbackTargetEnum.StartPending,
    )
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [selectedColumns, setSelectedColumns] = useState<any[]>([])
    const [showStartFeedback, setShowStartFeedback] = useState(false)
    const [showFeedback, setShowFeedback] = useState(false)
    const [feedbackAuditOpen, setFeedbackAuditOpen] = useState(false)
    const [auditorInfo, setAuditorInfo] = useState('')

    useEffect(() => {
        const config = sharingTabMap[tab]
        const initSearch = config?.initSearch || {
            limit: 10,
            offset: 1,
            sort: 'created_at',
            direction: 'desc',
        }
        setSearchCondition(initSearch)
        // setSelectedSort(sharingTabMap[tab].defaultMenu)
        setTableSort(sharingTabMap[tab].defaultTableSort)
        if (tab === SharingTab.StartFeedback) {
            setFeedbackActiveTab(FeedbackTargetEnum.StartPending)
        }
    }, [tab])

    useEffect(() => {
        if (operate && id) {
            setDetailsOp(operate as SharingOperate)
            setOperateItem({ id })

            if (operate === SharingOperate.Analysis) {
                setShowAnalysis(true)
            } else if (operate === SharingOperate.Detail) {
                setShowDetails(true)
            } else if (operate === SharingOperate.Implement) {
                setShowImplement(true)
            } else if (operate === SharingOperate.ImplementConfirm) {
                setShowImplementConfirm(true)
            } else if (
                operate === SharingOperate.ImplementResult ||
                operate === SharingOperate.ConfirmImplementResult
            ) {
                setShowImplementResult(true)
            }
        }
    }, [operate])

    // 是否有过滤值
    const isSearchStatus = useMemo(() => {
        const ignoreAttr = [
            'offset',
            'limit',
            'sort',
            'direction',
            'status',
            'audit_status',
            'audit_type',
        ]
        return Object.values(omit(searchCondition, ignoreAttr))?.some(
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
            let res: any
            switch (tab) {
                case SharingTab.Apply:
                case SharingTab.AnalysisConfirm:
                case SharingTab.ImplementPlan:
                case SharingTab.ImplementResult:
                    res = await getCityShareApplyResourceList(
                        tab === SharingTab.Apply && isPersonalCenter
                            ? { ...params, is_all: false }
                            : params,
                    )
                    break
                case SharingTab.AnalysisImprove:
                    res = await getCityShareApplyAnalysisList(params)
                    break

                case SharingTab.AuditDeclare:
                case SharingTab.AuditAnalysis:
                case SharingTab.AuditFeedback:
                    res = await getCityShareApplyAuditList(params)
                    break

                case SharingTab.AuditDataProvider:
                    res = await getCityShareApplyDataProviderAuditList(params)
                    break
                case SharingTab.StartFeedback:
                case SharingTab.HandleFeedback:
                    res = await getShareApplyFeedbackList(params)
                    break
                default:
                    break
            }
            setTableData(res?.entries || [])
            setTotal(res?.total_count || 0)
        } catch (error) {
            formatError(error)
        } finally {
            setFetching(false)
            setLoading(false)
        }
    }

    // 刷新
    const handleRefresh = (refresh: boolean = true) => {
        setSearchCondition((prevCondition) => ({
            ...prevCondition,
            offset: refresh ? 1 : prevCondition.offset,
        }))
    }

    const handleAnalysisSign = async (record: any) => {
        try {
            await signOffCityShareApply(record.id)
            message.success(__('分析签收成功'))
            handleRefresh(false)
        } catch (error) {
            formatError(error)
        }
    }

    const handleCancelAnalysisSign = async (record: any) => {
        try {
            await cancelSignOffCityShareApply(record.id)
            message.success(__('取消分析签收成功'))
            handleRefresh(false)
        } catch (error) {
            formatError(error)
        }
    }
    const handleDelete = async (record: any) => {
        try {
            await deleteCityShareApply(record.id)
            message.success(__('删除成功'))
            handleRefresh()
        } catch (error) {
            formatError(error)
        }
    }

    const handleClose = async (record: any) => {
        try {
            await closeCityShareApply(record.id)
            message.success(__('关闭成功'))
            handleRefresh(false)
        } catch (error) {
            formatError(error)
        }
    }

    const jumpToPage = (url: string) => {
        if (platform === LoginPlatform.drmp) {
            window.open(getActualUrl(url, true, 2), '_self')
        } else {
            navigate(url)
        }
    }

    // 表格操作事件
    const handleOptionTable = (key: string, record) => {
        setOperateItem(record)
        switch (key) {
            case SharingOperate.Detail: {
                rewriteUrl(
                    changeUrlData({
                        operate: SharingOperate.Detail,
                        applyId: record.id,
                    }),
                )
                break
            }
            case SharingOperate.Edit:
                // 编辑申报
                jumpToPage(
                    `/citySharing/shareApply?operate=create&applyId=${record.id}`,
                )
                break
            case SharingOperate.ReAnalysis:
            case SharingOperate.Analysis: {
                rewriteUrl(
                    changeUrlData({
                        operate: SharingOperate.Analysis,
                        applyId: record.id,
                    }),
                )
                break
            }
            case SharingOperate.EditAnalysis: {
                // 编辑分析
                rewriteUrl(
                    changeUrlData({
                        operate: SharingOperate.Analysis,
                        applyId: record.id,
                    }),
                )
                break
            }
            // 分析签收
            case SharingOperate.AnalysisSign:
                confirm({
                    title: __('确定分析签收吗？'),
                    content: __('签收后，可取消签收'),
                    icon: (
                        <ExclamationCircleFilled style={{ color: '#1890FF' }} />
                    ),
                    okText: __('确定'),
                    cancelText: __('取消'),
                    onOk: () => handleAnalysisSign(record),
                })
                break
            // 取消分析签收
            case SharingOperate.CancelAnalysisSign:
                confirm({
                    title: __('确认取消签收吗？'),
                    content: __('取消后，需重新签收才能分析，请确认'),
                    icon: (
                        <ExclamationCircleFilled style={{ color: '#1890FF' }} />
                    ),
                    okText: __('确定'),
                    cancelText: __('取消'),
                    onOk: () => handleCancelAnalysisSign(record),
                })
                break

            case SharingOperate.Confirm:
            case SharingOperate.ConfirmAnalysisConclusion:
                // 分析确认
                setShowConclusionConfirm(true)
                break
            case SharingOperate.Implement: {
                rewriteUrl(
                    changeUrlData({
                        operate: SharingOperate.Implement,
                        applyId: record.id,
                    }),
                )
                break
            }
            case SharingOperate.ImplementDetail: {
                rewriteUrl(
                    changeUrlData({
                        operate: SharingOperate.ImplementDetail,
                        applyId: record.application_id,
                    }),
                )
                break
            }
            case SharingOperate.ImplementConfirm:
                rewriteUrl(
                    changeUrlData({
                        operate: SharingOperate.ImplementConfirm,
                        applyId: record.id,
                    }),
                )
                break
            case SharingOperate.ImplementResult:
            case SharingOperate.ConfirmImplementResult:
                rewriteUrl(
                    changeUrlData({
                        operate: SharingOperate.ImplementResult,
                        applyId: record.id,
                    }),
                )
                break
            case SharingOperate.Audit:
                if (tab === SharingTab.AuditAnalysis) {
                    setAnalysisAuditOpen(true)
                } else if (tab === SharingTab.AuditDataProvider) {
                    setDataAuditOpen(true)
                } else if (tab === SharingTab.AuditDeclare) {
                    setApplyAuditOpen(true)
                } else if (tab === SharingTab.AuditFeedback) {
                    setFeedbackAuditOpen(true)
                }
                break
            case SharingOperate.Delete:
                confirm({
                    title: __('确认删除${name}吗？', { name: record.name }),
                    content: __('申请单删除后，将无法找回，请谨慎操作！'),
                    icon: (
                        <ExclamationCircleFilled style={{ color: '#faad14' }} />
                    ),
                    okText: __('确定'),
                    cancelText: __('取消'),
                    onOk: () => handleDelete(record),
                })
                break
            case SharingOperate.Cancel:
                setCancelOpen(true)
                break
            case SharingOperate.Close:
                confirm({
                    title: __('确认关闭${name}吗？', { name: record.name }),
                    content: '',
                    icon: (
                        <ExclamationCircleFilled style={{ color: '#faad14' }} />
                    ),
                    okText: __('确定'),
                    cancelText: __('取消'),
                    onOk: () => handleClose(record),
                })
                break
            case SharingOperate.Feedback:
                setShowFeedback(true)
                break
            default:
                break
        }
    }
    const getOperateOptions = (record: any): any[] => {
        // 特殊权限处理
        // 1. 如果是申请列表，且不是自己创建的记录，只显示详情操作
        if (tab === SharingTab.Apply && record.created_by !== userInfo?.ID) {
            return allOptionMenus.filter(
                (item) => item.key === SharingOperate.Detail,
            )
        }

        // 2. 如果是分析改善列表，且是全部列表，且有分析者ID但不是当前用户，只显示详情操作
        if (
            tab === SharingTab.AnalysisImprove &&
            selectStatus === ShareApplyStatus.All &&
            record.analyser_id &&
            record.analyser_id !== userInfo?.ID
        ) {
            return allOptionMenus.filter(
                (item) => item.key === SharingOperate.Detail,
            )
        }
        const { status, audit_status, feedback_status } = record
        // 获取当前 tab 的默认操作
        const defaultOperates = {
            [SharingTab.Apply]: [SharingOperate.Detail],
            [SharingTab.AnalysisImprove]: [SharingOperate.Detail],
            [SharingTab.AnalysisConfirm]: [
                SharingOperate.Detail,
                SharingOperate.Confirm,
            ],
            [SharingTab.ImplementPlan]: [
                SharingOperate.Detail,
                SharingOperate.ImplementConfirm,
            ],
            [SharingTab.ImplementResult]: [
                SharingOperate.Detail,
                SharingOperate.ImplementResult,
            ],
            [SharingTab.AuditDeclare]: [SharingOperate.Audit],
            [SharingTab.AuditAnalysis]: [SharingOperate.Audit],
            [SharingTab.AuditDataProvider]: [SharingOperate.Audit],
            [SharingTab.HandleFeedback]:
                searchCondition.feedback_status ===
                    FeedbackStatusEnum.PENDING ||
                (searchCondition.feedback_status ===
                    FeedbackStatusEnum.FEEDBACKING &&
                    audit_status === ShareApplyAuditStatus.FeedbackAuditReject)
                    ? [SharingOperate.Feedback]
                    : [SharingOperate.Detail],
            [SharingTab.AuditFeedback]: [SharingOperate.Audit],
        }[tab] || [SharingOperate.Detail]

        // 获取状态相关的操作规则
        const getStatusOperates = () => {
            // 根据不同的tab页返回对应的状态操作映射
            const tabStatusMap = {
                // 申请清单
                [SharingTab.Apply]: {
                    // 未申报
                    [ShareApplyStatus.UnReport]: () => {
                        if (
                            !audit_status ||
                            audit_status ===
                                ShareApplyAuditStatus.ReportAuditReject ||
                            audit_status ===
                                ShareApplyAuditStatus.ReportAuditUndone
                        ) {
                            return [
                                SharingOperate.Detail,
                                SharingOperate.Edit,
                                SharingOperate.Delete,
                            ]
                        }
                        if (
                            audit_status ===
                            ShareApplyAuditStatus.ReportAuditing
                        ) {
                            return [
                                SharingOperate.Detail,
                                SharingOperate.Cancel,
                            ]
                        }
                        return defaultOperates
                    },
                    // 分析结论不可行
                    [ShareApplyStatus.AnalysisUnfeasible]: () =>
                        isPersonalCenter
                            ? [
                                  SharingOperate.Detail,
                                  // SharingOperate.EditAnalysis,
                                  SharingOperate.Close,
                              ]
                            : [SharingOperate.Detail, SharingOperate.Close],
                    // 分析结论待确认
                    [ShareApplyStatus.AnalysisConfirming]: () =>
                        isPersonalCenter
                            ? [
                                  SharingOperate.Detail,
                                  SharingOperate.ConfirmAnalysisConclusion,
                              ]
                            : [SharingOperate.Detail],
                    // 实施成果待确认 - 个人中心使用
                    [ShareApplyStatus.ImplementAccepting]: () =>
                        isPersonalCenter
                            ? [
                                  SharingOperate.Detail,
                                  SharingOperate.ConfirmImplementResult,
                              ]
                            : defaultOperates,
                    // 数据共享待确认
                    [ShareApplyStatus.AnalysisConfirmAuditing]: () => {
                        if (
                            audit_status ===
                            ShareApplyAuditStatus.AnalysisConfirmAuditReject
                        ) {
                            return [SharingOperate.Detail, SharingOperate.Close]
                        }
                        return defaultOperates
                    },
                    // 成效反馈审核不通过
                    [ShareApplyStatus.Closed]: () => {
                        if (
                            isPersonalCenter &&
                            // 成效反馈审核失败&&成效反馈中
                            ((audit_status ===
                                ShareApplyAuditStatus.FeedbackAuditReject &&
                                feedback_status ===
                                    FeedbackStatusEnum.FEEDBACKING) ||
                                // 待成效反馈
                                feedback_status === FeedbackStatusEnum.PENDING)
                        ) {
                            return [
                                SharingOperate.Detail,
                                SharingOperate.Feedback,
                            ]
                        }
                        return defaultOperates
                    },
                },

                // 分析完善
                [SharingTab.AnalysisImprove]: {
                    // 分析待签收
                    [ShareApplyStatus.AnalysisSigningOff]: () => [
                        SharingOperate.Detail,
                        SharingOperate.AnalysisSign,
                    ],
                    // 待分析
                    [ShareApplyStatus.AnalysisPending]: () => [
                        SharingOperate.Detail,
                        SharingOperate.Analysis,
                        SharingOperate.CancelAnalysisSign,
                    ],
                    // 分析中
                    [ShareApplyStatus.Analysing]: () => {
                        if (!audit_status) {
                            return [
                                SharingOperate.Detail,
                                SharingOperate.EditAnalysis,
                            ]
                        }
                        if (
                            audit_status ===
                                ShareApplyAuditStatus.AnalysisAuditReject ||
                            audit_status ===
                                ShareApplyAuditStatus.AnalysisConfirmReject
                        ) {
                            return [
                                SharingOperate.Detail,
                                SharingOperate.ReAnalysis,
                            ]
                        }
                        return defaultOperates
                    },
                },
            }

            return tabStatusMap[tab]?.[status]?.() || defaultOperates
        }

        // 获取最终的操作项keys
        const finalOperateKeys = getStatusOperates()

        // 从 allOptionMenus 中过滤出对应的操作项
        return [
            ...allOptionMenus.filter((item) =>
                finalOperateKeys.includes(item.key),
            ),
        ]
    }

    const columns: any = useMemo(() => {
        const cols = [
            {
                title: __('申请名称（编码）'),
                dataIndex: 'name',
                key: 'name',
                ellipsis: true,
                width: 260,
                render: (value, record) => (
                    <MultiColumn
                        record={record}
                        onClick={() =>
                            handleOptionTable(SharingOperate.Detail, record)
                        }
                    />
                ),
            },
            {
                title: __('状态'),
                dataIndex: 'status',
                key: 'status',
                ellipsis: true,
                render: (value, record) => {
                    return <StatusView record={record} />
                },
            },
            {
                title: __('申请部门'),
                dataIndex: 'apply_org_name',
                key: 'apply_org_name',
                ellipsis: true,
                render: (value, record) => (
                    <span title={record.apply_org_path}>{value}</span>
                ),
            },
            {
                title: (
                    <SubTitle
                        title={__('申请人')}
                        subTitle={__('（联系电话）')}
                    />
                ),
                dataIndex: 'applier',
                key: 'applier',
                ellipsis: true,
                render: (value, record) => <ApplierView data={record} />,
            },
            {
                title: __('申请资源个数'),
                dataIndex: 'view_num',
                key: 'view_num',
                ellipsis: true,
                render: (value, record) => value + record.api_num || '--',
            },
            {
                title: __('资源类型'),
                dataIndex: 'source_type',
                key: 'source_type',
                ellipsis: true,
                render: (value, record) => <SourceTypeView data={record} />,
            },
            {
                title:
                    tab === SharingTab.Apply ? __('创建时间') : __('申请时间'),
                dataIndex: 'created_at',
                key: 'created_at',
                sorter: !!sharingTabMap[tab].defaultTableSort,
                sortOrder: tableSort?.created_at,
                showSorterTooltip: false,
                sortDirections: ['descend', 'ascend', 'descend'],
                width: 180,
                ellipsis: true,
                render: (val: number) => (val ? formatTime(val) : '--'),
            },
            {
                title: __('期望完成时间'),
                dataIndex: 'finish_date',
                key: 'finish_date',
                sorter: !!sharingTabMap[tab].defaultTableSort,
                sortOrder: tableSort?.finish_date,
                showSorterTooltip: false,
                sortDirections: ['descend', 'ascend', 'descend'],
                width: 160,
                ellipsis: true,
                render: (val: number, record) =>
                    val ? formatTime(val, 'YYYY-MM-DD') : '--',
            },
            {
                title: __('反馈内容'),
                dataIndex: 'feedback_content',
                key: 'feedback_content',
                ellipsis: true,
                render: (value, record) => value || '--',
            },
            {
                title: __('反馈时间'),
                dataIndex: 'feedback_at',
                key: 'feedback_at',
                sorter: !!sharingTabMap[tab].defaultTableSort,
                sortOrder: tableSort?.feedback_at,
                showSorterTooltip: false,
                sortDirections: ['descend', 'ascend', 'descend'],
                width: 160,
                ellipsis: true,
                render: (val: number, record) =>
                    val ? formatTime(val, 'YYYY-MM-DD') : '--',
            },
            {
                title: __('操作'),
                key: 'action',
                width: sharingTabMap[tab].actionWidth,
                fixed: 'right',
                render: (_, record) => {
                    return (
                        <OptionBarTool
                            menus={getOperateOptions(record) as any[]}
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

        // 根据 columnKeys 的顺序过滤和排序列
        return (
            Array.isArray(sharingTabMap[tab].columnKeys)
                ? sharingTabMap[tab].columnKeys
                : sharingTabMap[tab].columnKeys(feedbackActiveTab)
        )
            .map((key) => cols.find((col) => col.key === key))
            .filter(Boolean)
    }, [
        tab,
        tableSort,
        userInfo,
        feedbackActiveTab,
        searchCondition?.feedback_status,
    ])

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            if (sorter.columnKey === 'created_at') {
                setTableSort({
                    created_at: sorter.order || 'ascend',
                    finish_date: null,
                })
            } else if (sorter.columnKey === 'finish_date') {
                setTableSort({
                    created_at: null,
                    finish_date: sorter.order || 'ascend',
                })
            } else if (sorter.columnKey === 'feedback_at') {
                setTableSort({
                    created_at: null,
                    finish_date: null,
                    feedback_at: sorter.order || 'ascend',
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
                finish_date: null,
            })
        } else if (searchCondition.sort === 'finish_date') {
            setTableSort({
                created_at: null,
                finish_date:
                    searchCondition.direction === SortDirection.ASC
                        ? 'descend'
                        : 'ascend',
            })
        } else if (searchCondition.sort === 'feedback_at') {
            setTableSort({
                created_at: null,
                finish_date: null,
                feedback_at:
                    searchCondition.direction === SortDirection.ASC
                        ? 'descend'
                        : 'ascend',
            })
        } else {
            setTableSort({
                finish_date: null,
                feedback_at: null,
                created_at:
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

    // 表格排序改变
    const onTableChange = (currentPagination, filters, sorter, extra) => {
        if (extra.action === 'sort' && !!sorter.column) {
            const selectedMenu = handleTableChange(sorter)
            setSearchCondition((prev) => ({
                ...prev,
                sort: selectedMenu.key,
                direction: selectedMenu.sort,
                offset: 1,
            }))
        }
    }

    // 分页改变
    const onPaginationChange = (page, pageSize) => {
        setSearchCondition((prev) => ({
            ...prev,
            offset: page,
            limit: pageSize,
        }))
    }

    // 筛选展开状态
    const handleExpansionStatus = (status: boolean) => {
        setScrollY(
            status ? `calc(100vh - 479px)` : sharingTabMap[tab].defaultScrollY,
        )
    }

    // 切换左侧的状态状态栏
    const handleStatusChange = (status: ShareApplyStatus) => {
        setSearchCondition((prev) => ({
            ...prev,
            status,
            // is_all: status === ShareApplyStatus.All,
            offset: 1,
        }))
        setSelectStatus(status)
    }

    // 运营人员切换是否只看我的
    const handleMyApply = (e) => {
        setSearchCondition((prev) => ({
            ...prev,
            is_all: !e.target.checked,
            offset: 1,
        }))
    }

    // 顶部左侧操作
    const getPrefixNode = () => {
        switch (tab) {
            case SharingTab.Apply:
                return (
                    <Space size={16}>
                        <Button
                            icon={<PlusOutlined />}
                            type="primary"
                            onClick={() =>
                                jumpToPage(
                                    '/citySharing/shareApply?operate=create',
                                )
                            }
                        >
                            {__('共享申报')}
                        </Button>
                        {!isPersonalCenter && (
                            <Checkbox onChange={handleMyApply}>
                                {__('只看我的申请单')}
                            </Checkbox>
                        )}
                    </Space>
                )
            case SharingTab.AnalysisImprove:
                if (sharingTabMap[tab].statusOption?.length > 0) {
                    return (
                        <StatusFilter
                            statusOptions={sharingTabMap[tab].statusOption}
                            selectStatus={selectStatus}
                            onStatusChange={handleStatusChange}
                        />
                    )
                }
                return null
            case SharingTab.AnalysisConfirm:
            case SharingTab.ImplementPlan:
            case SharingTab.ImplementResult:
                return __('待确认')
            case SharingTab.StartFeedback:
                return feedbackActiveTab === FeedbackTargetEnum.StartPending ? (
                    <Button
                        icon={<PlusOutlined />}
                        type="primary"
                        disabled={selectedColumns.length === 0}
                        onClick={() => setShowStartFeedback(true)}
                    >
                        {__('发起成效反馈')}
                    </Button>
                ) : (
                    <StatusFilter
                        statusOptions={sharingTabMap[tab].statusOption}
                        selectStatus={searchCondition.feedback_status}
                        onStatusChange={(status) =>
                            setSearchCondition((prev) => ({
                                ...prev,
                                offset: 1,
                                feedback_status: status,
                            }))
                        }
                    />
                )

            case SharingTab.HandleFeedback:
                return (
                    <StatusFilter
                        statusOptions={sharingTabMap[tab].statusOption}
                        selectStatus={searchCondition.feedback_status}
                        onStatusChange={(status) =>
                            setSearchCondition((prev) => ({
                                ...prev,
                                offset: 1,
                                feedback_status: status,
                            }))
                        }
                    />
                )
            case SharingTab.AuditFeedback:
                return (
                    <div className={styles['audit-feedback-title']}>
                        {__('待审核成效反馈列表')}
                    </div>
                )
            default:
                return null
        }
    }

    // 筛选
    const handleSearch = (values: any) => {
        const obj = timeStrToTimestamp(values)
        const params = {
            ...searchCondition,
            ...obj,
            offset: 1,
        }

        setSearchCondition(params)
    }

    // 获取顶部操作区域
    const getTopOperate = () => {
        if (
            [
                SharingTab.AuditDeclare,
                SharingTab.AuditAnalysis,
                SharingTab.AuditDataProvider,
            ].includes(tab as SharingTab)
        ) {
            return (
                <div className={styles.top}>
                    <div className={styles['leftOperate-title']}>
                        {leftMenuItems.find((item) => item.key === tab)?.title}
                    </div>
                    <div className={styles.rightOperate}>
                        <Space size={8}>
                            {sharingTabMap[tab].searchPlaceholder && (
                                <SearchInput
                                    value={searchCondition?.keyword}
                                    style={{ width: 280 }}
                                    placeholder={
                                        sharingTabMap[tab].searchPlaceholder
                                    }
                                    onKeyChange={(kw: string) => {
                                        if (kw === searchCondition?.keyword)
                                            return
                                        setSearchCondition((prev) => ({
                                            ...prev,
                                            keyword: kw,
                                            offset: 1,
                                        }))
                                    }}
                                />
                            )}

                            {sharingTabMap[tab].refresh && (
                                <RefreshBtn onClick={() => handleRefresh()} />
                            )}
                        </Space>
                    </div>
                </div>
                // </div>
            )
        }

        return (
            <>
                {/* 个人中心和发起成效反馈不展示标题 */}
                {!isPersonalCenter &&
                    ![
                        SharingTab.StartFeedback,
                        SharingTab.AuditFeedback,
                    ].includes(tab as SharingTab) && (
                        <div className={styles['sort-title']}>
                            {
                                leftMenuItems.find((item) => item.key === tab)
                                    ?.title
                            }
                        </div>
                    )}
                <SearchLayout
                    ref={searchFormRef}
                    formData={recordSearchFilter({
                        filterKeys: sharingTabMap[tab].filterKeys,
                        customProps: sharingTabMap[tab].customProps,
                        placeholder: sharingTabMap[tab].searchPlaceholder,
                    })}
                    prefixNode={getPrefixNode()}
                    // beforeSearchInputNode={
                    //     isPersonalCenter ? (
                    //         <div className={styles.beforeSearchInputNode}>
                    //             <div className={styles.label}>
                    //                 {__('待我确认的数据：')}
                    //             </div>
                    //             <Checkbox.Group
                    //                 options={[
                    //                     {
                    //                         label: __('分析结论确认'),
                    //                         value: 'A',
                    //                     },
                    //                     {
                    //                         label: __('实施方案确认'),
                    //                         value: 'B',
                    //                     },
                    //                     {
                    //                         label: __('成效反馈'),
                    //                         value: 'C',
                    //                     },
                    //                 ]}
                    //                 defaultValue={['A', 'B', 'C']}
                    //                 onChange={(e) => {
                    //                     console.log(e)
                    //                 }}
                    //             />
                    //         </div>
                    //     ) : null
                    // }
                    onSearch={handleSearch}
                    getExpansionStatus={handleExpansionStatus}
                />
            </>
        )
    }

    const rowSelection: any = {
        type: 'checkbox',
        selectedRowKeys,
        onChange: (selRowKeys: React.Key[], selectedRows: any[]) => {
            const newSelectedRowKeys = selectedRowKeys.filter(
                (key) => !tableData.find((item) => item.id === key),
            )
            const newSelectedColumns = selectedColumns.filter(
                (item) => !tableData.find((d) => d.id === item.id),
            )
            setSelectedRowKeys([...newSelectedRowKeys, ...selRowKeys])
            setSelectedColumns([...newSelectedColumns, ...selectedRows])
        },
    }

    return (
        <div className={classnames(styles.shareApplyTable)}>
            {tab === SharingTab.StartFeedback && (
                <Tabs
                    items={[
                        {
                            label: __('待发起反馈'),
                            key: FeedbackTargetEnum.StartPending,
                        },
                        {
                            label: __('已发起反馈'),
                            key: FeedbackTargetEnum.Started,
                        },
                    ]}
                    activeKey={feedbackActiveTab}
                    onChange={(key) => {
                        setFeedbackActiveTab(key as FeedbackTargetEnum)
                        setSearchCondition((prev) => ({
                            ...prev,
                            target: key,
                        }))
                    }}
                />
            )}
            {loading ? (
                renderLoader()
            ) : (
                <>
                    {getTopOperate()}
                    {tableData.length === 0 && !isSearchStatus ? (
                        renderEmpty()
                    ) : (
                        <Table
                            columns={columns}
                            dataSource={tableData}
                            loading={fetching}
                            rowKey="id"
                            rowClassName={styles.tableRow}
                            onChange={onTableChange}
                            scroll={{
                                x: columns.length * 182,
                                y: scrollY,
                            }}
                            rowSelection={
                                tab === SharingTab.StartFeedback &&
                                feedbackActiveTab ===
                                    FeedbackTargetEnum.StartPending
                                    ? rowSelection
                                    : null
                            }
                            pagination={{
                                total,
                                pageSize: searchCondition?.limit,
                                current: searchCondition?.offset,
                                showQuickJumper: true,
                                onChange: (page, pageSize) =>
                                    onPaginationChange(page, pageSize),
                                showSizeChanger: true,
                                showTotal: (count) =>
                                    __('共${count}条', { count }),
                            }}
                            locale={{ emptyText: <Empty /> }}
                        />
                    )}
                </>
            )}
            {/* 详情 */}
            {showDetails && (
                <SharingDrawer
                    open={showDetails}
                    operate={detailsOp}
                    applyId={operateItem?.id}
                    onClose={() => {
                        setShowDetails(false)
                        rewriteUrl(changeUrlData({}, ['operate', 'applyId']))
                    }}
                    tab={tab as SharingTab}
                />
            )}
            {/* 分析 */}
            {showAnalysis && (
                <Analysis
                    open={showAnalysis}
                    applyId={operateItem?.id}
                    onClose={() => {
                        setShowAnalysis(false)
                        rewriteUrl(changeUrlData({}, ['operate', 'applyId']))
                        handleRefresh()
                    }}
                />
            )}
            {applyAuditOpen && (
                <ApplyAudit
                    open={applyAuditOpen}
                    onClose={() => setApplyAuditOpen(false)}
                    auditItem={operateItem}
                    onOk={() => handleRefresh()}
                />
            )}
            {analysisAuditOpen && (
                <AnalysisAudit
                    open={analysisAuditOpen}
                    onClose={() => setAnalysisAuditOpen(false)}
                    auditItem={operateItem}
                    onOk={() => handleRefresh()}
                />
            )}
            {dataAuditOpen && (
                <DataProviderAudit
                    open={dataAuditOpen}
                    onClose={() => setDataAuditOpen(false)}
                    auditItem={operateItem}
                    onOk={() => handleRefresh()}
                />
            )}
            {feedbackAuditOpen && (
                <FeedbackAudit
                    open={feedbackAuditOpen}
                    onClose={() => setFeedbackAuditOpen(false)}
                    auditItem={operateItem}
                    onOk={() => handleRefresh()}
                />
            )}
            {/* 接口实施 */}
            {/* <ApiImp
                open={showImplement}
                applyId={operateItem?.application_id}
                onClose={() => {
                    setShowImplement(false)
                    rewriteUrl(changeUrlData({}, ['operate', 'applyId']))
                }}
            /> */}
            {/* 实施确认 */}
            {showImplementConfirm && (
                <ConfirmPlan
                    open={showImplementConfirm}
                    applyId={operateItem?.id || ''}
                    onClose={() => {
                        setShowImplementConfirm(false)
                        rewriteUrl(changeUrlData({}, ['operate', 'applyId']))
                        handleRefresh()
                    }}
                />
            )}
            {/* 实施成果 */}
            {showImplementResult && (
                <ConfirmPlan
                    open={showImplementResult}
                    applyId={operateItem?.id}
                    onClose={() => {
                        setShowImplementResult(false)
                        rewriteUrl(changeUrlData({}, ['operate', 'applyId']))
                        handleRefresh()
                    }}
                    isResult
                />
            )}
            {showConclusionConfirm && (
                <ConclusionConfirm
                    applyId={operateItem?.id}
                    open={showConclusionConfirm}
                    onClose={() => setShowConclusionConfirm(false)}
                    onOk={() => handleRefresh()}
                />
            )}
            {cancelOpen && (
                <Revocate
                    open={cancelOpen}
                    onClose={() => setCancelOpen(false)}
                    applyId={operateItem?.id}
                    onOk={() => handleRefresh()}
                />
            )}
            {showStartFeedback && (
                <StartFeedback
                    data={selectedColumns}
                    open={showStartFeedback}
                    onClose={() => setShowStartFeedback(false)}
                    onOk={() => {
                        handleRefresh()
                        setSelectedRowKeys([])
                        setSelectedColumns([])
                    }}
                />
            )}
            {showFeedback && (
                <Feedback
                    open={showFeedback}
                    onClose={() => setShowFeedback(false)}
                    applyId={operateItem?.id}
                    onOk={() => {
                        handleRefresh()
                    }}
                />
            )}
        </div>
    )
}

export default ShareApplyTable
