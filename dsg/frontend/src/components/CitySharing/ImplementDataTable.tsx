import { Drawer, message, Table } from 'antd'

import { useGetState } from 'ahooks'
import React, { useEffect, useMemo, useState } from 'react'
import {
    detailServiceOverview,
    formatError,
    getCityShareApplyDetail,
    getCityShareApplyImplementList,
    getCityShareApplyListByID,
    getResourceDetailsByAnalysisId,
    ShareApplyImplTag,
    ShareApplyResourceType,
    ShareApplyStatus,
    signOffCityShareApplyImplement,
    syncSubService,
} from '@/core'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { ListPagination, ListType, OptionBarTool } from '@/ui'
import { rewriteUrl } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import DataPushDrawer from '../DataPush/DataPushDrawer'
import { DataPushAction } from '../DataPush/const'
import SearchLayout from '../SearchLayout'
import ResourceDetails from './Details/ResourceDetails'
import Implement from './Implement'
import ApiImp from './Implement/ApiImp'
import {
    allOptionMenus,
    recordSearchFilter,
    SharingOperate,
    SharingTab,
    sharingTabMap,
    supplyTypeMap,
} from './const'
import {
    CardHeader,
    changeUrlData,
    renderEmpty,
    renderLoader,
    ResTypeEnum,
    SourceNameView,
    StatusFilter,
    StatusView,
    timeStrToTimestamp,
} from './helper'
import __ from './locale'
import styles from './styles.module.less'

const ImplementDataTable: React.FC = () => {
    const { initSearch, filterKeys, statusOption } =
        sharingTabMap[SharingTab.ImplementData]

    // 页面加载状态
    const [loading, setLoading] = useState(false)
    // 卡片列表
    const [cardList, setCardList] = useState<any[]>([])
    // 卡片数据总数
    const [total, setTotal] = useState(0)
    // 展开的卡片
    const [expandedCard, setExpandedCard, getExpandedCard] =
        useGetState<any>(null)
    // 卡片搜索条件
    const [searchCondition, setSearchCondition] = useState<any>(initSearch)
    // 表格加载状态
    const [tableLoading, setTableLoading] = useState(false)
    // 表格数据
    const [tableData, setTableData] = useState<any[]>([])
    // 表格操作项
    const [operateItem, setOperateItem] = useState<any>(null)
    // 添加选中状态的状态管理
    const [selectStatus, setSelectStatus] = useState<ShareApplyStatus>(
        ShareApplyStatus.All,
    )
    const [showImplement, setShowImplement] = useState(false)

    const [showImplementDetail, setShowImplementDetail] = useState(false)

    const [showApiImplement, setShowApiImplement] = useState(false)

    const [showApiImplementDetail, setShowApiImplementDetail] = useState(false)
    const [showImplementTask, setShowImplementTask] = useState(false)

    const [pushTaskId, setPushTaskId] = useState<string>('')

    const [viewInfo, setViewInfo] = useState<any>()
    const [isShowAppInfo, setIsShowAppInfo] = useState(false)
    // 当前用户信息
    const [userInfo] = useCurrentUser()
    // 监听 searchCondition 变化
    useEffect(() => {
        if (searchCondition) {
            getCardList(searchCondition)
        }
    }, [searchCondition])

    // 获取卡片列表数据
    const getCardList = async (params: any) => {
        try {
            setLoading(true)
            const res = await getCityShareApplyImplementList(params)

            const entries = res?.entries || []
            setCardList(entries)
            setTotal(res?.total_count || 0)

            // 如果有数据，默认展开第一个卡片
            if (entries.length > 0) {
                const firstCard = entries[0]
                setExpandedCard(firstCard)
                getCardTableData(firstCard.id)
            } else {
                // 如果没有数据，清空相关状态
                clearActiveData()
            }
        } catch (error) {
            formatError({ error })
        } finally {
            setLoading(false)
        }
    }

    // 获取展开卡片的表格数据
    const getCardTableData = async (cardId: string) => {
        try {
            setTableLoading(true)
            const transformStatus =
                selectStatus === ShareApplyStatus.Implementing
                    ? `${ShareApplyStatus.ImplementSolutionCreating},${ShareApplyStatus.ImplementSolutionConfirming},${ShareApplyStatus.Implementing},${ShareApplyStatus.Implemented}`
                    : selectStatus

            const res = await getCityShareApplyListByID(cardId, {
                limit: 20,
                offset: 1,
                status: transformStatus,
            })
            setTableData(res?.entries || [])
        } catch (error) {
            formatError(error)
        } finally {
            setTableLoading(false)
        }
    }

    // 处理卡片展开/收起
    const handleCardExpand = (cardInfo: any) => {
        if (expandedCard?.id === cardInfo.id) {
            setExpandedCard(null)
            setTableData([])
            setOperateItem(null)
        } else {
            setExpandedCard(cardInfo)
            getCardTableData(cardInfo.id)
        }
    }

    /**
     * 获取实施任务
     * @param applyId
     * @returns
     */
    const handleShowImplementTask = async (applyId: string, id: string) => {
        try {
            if (!applyId) return
            const res = await getCityShareApplyDetail(applyId, {
                fields: 'implement',
            })
            setShowImplementTask(true)
            if (res?.implement?.length > 0) {
                const firstItem = res?.implement.find(
                    (item: any) => item.id === id,
                )
                setPushTaskId(firstItem?.push_job_id || '')
            }
        } catch (err) {
            formatError(err)
        }
    }

    // 获取信息
    const getDetails = async (applyId, resId, analysisId) => {
        try {
            const res = await getCityShareApplyDetail(applyId, {
                fields: 'base,analysis,implement',
            })
            const apiDetail = await getResourceDetailsByAnalysisId(
                applyId,
                analysisId,
            )
            let detailsService
            if (apiDetail.src_item.apply_conf.api_apply_conf?.data_res_id) {
                detailsService = await detailServiceOverview(
                    apiDetail.src_item.apply_conf.api_apply_conf?.data_res_id,
                )
            }

            const {
                passid,
                token,
                is_publish,
                sync_success,
                sync_failed_reason,
                sub_success,
                sub_failed_reason,
                app_name,
                ip_addr,
            } = apiDetail.implement || {}

            const baseResources = res.base.resources || []
            const analysisResources = res.analysis.resources || []
            const replaceRes: any[] = []
            const clgData = baseResources.map((resource) => {
                const analysisRes = analysisResources.find(
                    (item) => item.src_id === resource.id,
                )

                const {
                    additional_info_types,
                    is_reasonable,
                    attach_add_remark,
                    id,
                    is_res_replace,
                } = analysisRes || {}

                if (!(is_reasonable || !is_res_replace)) {
                    replaceRes.push({
                        res_type: ResTypeEnum.Catalog,
                        res_id: analysisRes?.new_res_id,
                        res_code: analysisRes?.new_res_code,
                        res_name: analysisRes?.new_res_name,
                        org_path: analysisRes?.org_path,
                        apply_conf: analysisRes?.apply_conf,
                    })
                }

                return {
                    ...resource,
                    additional_info_types,
                    is_reasonable,
                    attach_add_remark,
                    analysis_item_id: id,
                }
            })
            const allData = [
                ...clgData,
                ...replaceRes,
                ...analysisResources
                    .filter((item) => item.is_new_res)
                    .map((item) => {
                        return {
                            ...item,
                            analysis_item_id: item.id,
                            res_id: item.new_res_id,
                            res_name: item.new_res_name,
                            res_code: item.new_res_code,
                            res_type: item.new_res_type,
                        }
                    }),
            ]
            const currentRes = allData.find(
                (item) =>
                    item.apply_conf?.view_apply_conf?.data_res_id === resId ||
                    item.apply_conf?.api_apply_conf?.data_res_id === resId,
            )
            setViewInfo({
                ...currentRes,
                passid,
                token,
                is_publish,
                sync_success,
                sync_failed_reason,
                sub_success,
                sub_failed_reason,
                app_name,
                ip_addr,
                service_path: detailsService?.service_info?.service_path,
                service_name: detailsService?.service_info?.service_name,
            })
        } catch (error) {
            formatError(error)
        }
    }

    const subService = async (id: string, analysisId: string) => {
        try {
            await syncSubService(id, analysisId)
            message.success(__('操作成功'))
            setSearchCondition({
                ...searchCondition,
                offset: 1,
            })
        } catch (error) {
            formatError(error)
        }
    }

    // 处理表格操作
    const handleOptionTable = async (key: string, record: any) => {
        setOperateItem(record)

        switch (key) {
            case SharingOperate.CreateImplSolution:
                setShowImplement(true)
                rewriteUrl(
                    changeUrlData({
                        operate: SharingOperate.CreateImplSolution,
                        applyId: getExpandedCard()?.id,
                        catalogId: record?.data_res_id,
                    }),
                )
                break
            case SharingOperate.ImplementSign:
                confirm({
                    title: __('确定要实施签收吗？'),
                    content: __('签收后，进入待实施页面进行实施操作'),
                    onOk: () => signOff(getExpandedCard()?.id, record?.id),
                })
                break
            case SharingOperate.ViewImplSolution:
                // 查看库表实施方案
                if (record.supply_type === ShareApplyResourceType.View) {
                    setShowImplementDetail(true)
                    rewriteUrl(
                        changeUrlData({
                            operate: SharingOperate.CreateImplSolution,
                            applyId: getExpandedCard()?.id,
                            catalogId: record?.data_res_id,
                        }),
                    )
                    // 查看接口实施方案
                } else {
                    setShowApiImplementDetail(true)
                    rewriteUrl(
                        changeUrlData({
                            operate: SharingOperate.Implement,
                            applyId: getExpandedCard()?.id,
                            catalogId: record?.data_res_id,
                        }),
                    )
                }

                break
            case SharingOperate.Implement:
                setShowApiImplement(true)
                rewriteUrl(
                    changeUrlData({
                        operate: SharingOperate.Implement,
                        applyId: getExpandedCard()?.id,
                        catalogId: record?.data_res_id,
                    }),
                )
                break
            case SharingOperate.ReCreateImplSolution:
                setShowImplement(true)
                rewriteUrl(
                    changeUrlData({
                        operate: SharingOperate.ReCreateImplSolution,
                        applyId: getExpandedCard()?.id,
                        catalogId: record?.data_res_id,
                    }),
                )
                break
            case SharingOperate.ViewImplTask:
                handleShowImplementTask(getExpandedCard()?.id || '', record?.id)
                break
            case SharingOperate.Detail:
            case SharingOperate.ViewApiDetail:
                getDetails(getExpandedCard()?.id, record.data_res_id, record.id)
                break
            case SharingOperate.SyncApi:
                subService(getExpandedCard()?.id, record?.id)
                break
            case SharingOperate.SubService:
            case SharingOperate.ResSubService:
                subService(getExpandedCard()?.id, record?.id)
                break
            case SharingOperate.ViewSubService:
                setIsShowAppInfo(true)
                getDetails(getExpandedCard()?.id, record.data_res_id, record.id)
                break
            default:
                break
        }
    }

    const signOff = async (id: string, analysisId: string) => {
        try {
            await signOffCityShareApplyImplement(id, {
                analysis_item_id: analysisId,
            })
            message.success(__('实施签收成功'))
            setSearchCondition({
                ...searchCondition,
                offset: 1,
            })
        } catch (err) {
            formatError(err)
        }
    }
    // 清理方法
    const clearActiveData = () => {
        setExpandedCard(null)
        setTableData([])
        setOperateItem(null)
    }

    // 获取操作项
    const getOperateOptions = (record: any): any[] => {
        // 获取状态相关的操作规则
        const getStatusOperates = () => {
            const { status, impl_tag, supply_type } = record

            const statusOperateMap = {
                [ShareApplyStatus.ImplementSigningOff]: () => [
                    SharingOperate.Detail,
                    SharingOperate.ImplementSign,
                ],
                [ShareApplyStatus.ImplementPending]: () => {
                    if (supply_type === ShareApplyResourceType.View) {
                        return [SharingOperate.CreateImplSolution]
                    }
                    return [SharingOperate.Implement]
                },
                [ShareApplyStatus.ImplementSolutionCreating]: () => {
                    if (
                        impl_tag === ShareApplyImplTag.ImplSolutionConfirmReject
                    ) {
                        return [SharingOperate.ReCreateImplSolution]
                    }
                    return [SharingOperate.CreateImplSolution]
                },
                [ShareApplyStatus.ImplementSolutionConfirming]: () => [
                    SharingOperate.ViewImplSolution,
                ],
                [ShareApplyStatus.Implementing]: () => {
                    if (supply_type === ShareApplyResourceType.View) {
                        return [
                            SharingOperate.ViewImplSolution,
                            SharingOperate.ViewImplTask,
                        ]
                    }
                    // 订阅成功
                    if (
                        typeof record.sub_success === 'boolean' &&
                        record.sub_success
                    ) {
                        return [SharingOperate.Implement]
                    }
                    // 订阅失败
                    if (
                        typeof record.sub_success === 'boolean' &&
                        !record.sub_success
                    ) {
                        return [SharingOperate.ResSubService]
                    }
                    if (
                        !record.sync_success &&
                        typeof record.sync_success === 'boolean'
                    ) {
                        return [SharingOperate.SyncApi]
                    }
                    // 同步成功但没有订阅过
                    if (
                        record.sync_success &&
                        typeof record.sub_success !== 'boolean'
                    ) {
                        return [SharingOperate.SubService]
                    }
                    return [SharingOperate.Implement]
                },
                [ShareApplyStatus.Implemented]: () => {
                    if (supply_type === ShareApplyResourceType.View) {
                        return [SharingOperate.ViewImplSolution]
                    }
                    if (
                        typeof record.sub_success === 'boolean' &&
                        record.sub_success
                    ) {
                        return [SharingOperate.ViewSubService]
                    }
                    return [SharingOperate.ViewApiDetail]
                },
            }
            return statusOperateMap[status]?.() || []
        }
        // 获取最终的操作项keys
        const finalOperateKeys = getStatusOperates()

        // 如果是数据资源实施全部列表，且有实施者ID但不是当前用户，只显示详情操作
        if (
            selectStatus === ShareApplyStatus.All &&
            record.implement_id &&
            record.implement_id !== userInfo?.ID
        ) {
            // 如果 finalOperateKeys 包含 SharingOperate.Detail，则显示详情操作
            if (finalOperateKeys.includes(SharingOperate.Detail)) {
                return [SharingOperate.Detail]
            }
            // 如果不包含，则返回空数组
            return []
        }

        // 从 allOptionMenus 中过滤出对应的操作项
        return allOptionMenus.filter((item) =>
            finalOperateKeys.includes(item.key),
        )
    }

    // 表格列配置
    const columns: any = useMemo(
        () => [
            {
                title: __('数据资源名称（编码）'),
                dataIndex: 'data_resource_name',
                key: 'data_resource_name',
                ellipsis: true,
                width: 300,
                render: (value, record) => (
                    <SourceNameView
                        data={record}
                        onClick={() =>
                            handleOptionTable(SharingOperate.Detail, record)
                        }
                    />
                ),
            },
            {
                title: __('提供方式'),
                dataIndex: 'supply_type',
                key: 'supply_type',
                width: 120,
                render: (value, record) => (
                    <span>{supplyTypeMap[value]?.text}</span>
                ),
            },
            {
                title: __('所属数据目录'),
                dataIndex: 'res_name',
                key: 'res_name',
                ellipsis: true,
            },
            {
                title: __('数据提供部门'),
                dataIndex: 'org_name',
                key: 'org_name',
                ellipsis: true,
                render: (value, record) => (
                    <span title={record.org_path}>{value}</span>
                ),
            },
            {
                title: __('实施人'),
                dataIndex: 'implement_name',
                key: 'implement_name',
                width: 120,
            },
            {
                title: __('实施状态'),
                dataIndex: 'status',
                key: 'status',
                width: 160,
                render: (value, record) => (
                    <StatusView
                        record={record}
                        tab={SharingTab.ImplementData}
                    />
                ),
            },
            {
                title: __('操作'),
                key: 'action',
                width: 260,
                render: (_, record) => (
                    <OptionBarTool
                        menus={getOperateOptions(record) as any[]}
                        onClick={(key, e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleOptionTable(key, record)
                        }}
                    />
                ),
            },
        ],
        [],
    )

    // 渲染卡片
    const renderCard = (item: any) => (
        <div key={item.id} className={styles.implementCard}>
            <CardHeader
                section={item}
                expanded={expandedCard?.id === item.id}
                handleToggleExpand={() => handleCardExpand(item)}
            />
            {expandedCard?.id === item.id && (
                <Table
                    columns={columns}
                    scroll={{
                        y: `200px`,
                    }}
                    dataSource={tableData}
                    pagination={false}
                    rowKey="id"
                    loading={tableLoading}
                />
            )}
        </div>
    )

    // 搜索处理
    const handleSearch = (values: any) => {
        const obj = timeStrToTimestamp(values)
        const newCondition = {
            ...searchCondition,
            ...obj,
            offset: 1,
        }
        setSearchCondition(newCondition)
    }

    // 分页处理
    const handlePageChange = (page: number, pageSize: number) => {
        setSearchCondition((prev) => ({
            ...prev,
            offset: page,
            limit: pageSize,
        }))
    }

    // 切换状态
    const handleStatusChange = (status: ShareApplyStatus) => {
        setSelectStatus(status)
        const newCondition = {
            ...searchCondition,
            status,
            is_all: status === ShareApplyStatus.All,
            offset: 1,
        }
        setSearchCondition(newCondition)
    }

    return (
        <div className={styles.implementDataTable}>
            <div className={styles.title}>{__('数据资源实施')}</div>
            <SearchLayout
                formData={recordSearchFilter({
                    filterKeys,
                })}
                prefixNode={
                    <StatusFilter
                        statusOptions={statusOption}
                        selectStatus={selectStatus}
                        onStatusChange={handleStatusChange}
                    />
                }
                onSearch={handleSearch}
            />
            {loading ? (
                <div className={styles.loadingWrapper}>{renderLoader()}</div>
            ) : (
                <>
                    {cardList.length === 0 ? (
                        renderEmpty()
                    ) : (
                        <div className={styles.cardList}>
                            {cardList.map(renderCard)}
                        </div>
                    )}

                    <ListPagination
                        listType={ListType.WideList}
                        queryParams={searchCondition}
                        totalCount={total}
                        onChange={handlePageChange}
                        className={styles.pagination}
                    />
                </>
            )}
            {/* 库表实施 */}
            {showImplement && (
                <Implement
                    open={showImplement}
                    applyId={expandedCard?.id}
                    onClose={() => {
                        setShowImplement(false)
                        rewriteUrl(changeUrlData({}, ['operate', 'applyId']))
                        setSearchCondition({
                            ...searchCondition,
                            offset: 1,
                        })
                        setSearchCondition({
                            ...searchCondition,
                            offset: 1,
                        })
                    }}
                    rejectReason={operateItem?.reject_reason}
                    model="implement"
                    catalogId={operateItem?.data_res_id}
                    analysisId={operateItem?.id}
                />
            )}
            {showImplementDetail && (
                <Implement
                    open={showImplementDetail}
                    applyId={expandedCard?.id}
                    onClose={() => {
                        setShowImplementDetail(false)
                        rewriteUrl(changeUrlData({}, ['operate', 'applyId']))
                    }}
                    catalogId={operateItem?.data_res_id}
                    analysisId={operateItem?.id}
                    rejectReason={
                        operateItem.solution_confirm_result === 'reject'
                            ? operateItem?.reject_reason
                            : null
                    }
                />
            )}
            {showApiImplement && (
                <ApiImp
                    open={showApiImplement}
                    applyId={expandedCard?.id}
                    onClose={() => {
                        setShowApiImplement(false)
                        rewriteUrl(changeUrlData({}, ['operate', 'applyId']))
                        setSearchCondition({
                            ...searchCondition,
                        })
                    }}
                    analysisId={operateItem?.id}
                    isView={false}
                />
            )}
            {showApiImplementDetail && (
                <ApiImp
                    open={showApiImplementDetail}
                    applyId={expandedCard?.id}
                    onClose={() => {
                        setShowApiImplementDetail(false)
                        rewriteUrl(changeUrlData({}, ['operate', 'applyId']))
                    }}
                    analysisId={operateItem?.id}
                    isView
                />
            )}
            {showImplementTask && (
                <DataPushDrawer
                    open={showImplementTask}
                    onClose={(refresh) => {
                        setShowImplementTask(false)
                    }}
                    dataPushId={pushTaskId}
                    operate={DataPushAction.Detail}
                />
            )}
            {viewInfo && (
                <Drawer
                    title={__('查看资源')}
                    open={!!viewInfo}
                    onClose={() => {
                        setViewInfo(undefined)
                        setIsShowAppInfo(false)
                    }}
                    width={837}
                    push={false}
                >
                    <ResourceDetails
                        data={viewInfo || {}}
                        isShowAppInfo={isShowAppInfo}
                    />
                </Drawer>
            )}
        </div>
    )
}

export default ImplementDataTable
