import { Badge, Button, Space, Table, Tooltip, message } from 'antd'

import { ExclamationCircleFilled } from '@ant-design/icons'
import classnames from 'classnames'
import { cloneDeep, noop } from 'lodash'
import React, { useEffect, useMemo, useState } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import { useCongSearchContext } from '@/components/CognitiveSearch/CogSearchProvider'
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'
import {
    IDemandItemInfo,
    IImplAchv,
    IItemImplementAuthority,
    formatError,
    getDemandDetailsV2,
    getItemDetails,
    submitAuthApplyBackV2,
} from '@/core'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import {
    Empty,
    LightweightSearch,
    ListDefaultPageSize,
    ListPagination,
    ListType,
    Loader,
    SearchInput,
} from '@/ui'
import { getActualUrl } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import AddImplementResult from '../AddImplementResult'
import {
    ApplyAuthPhaseList,
    DemandDetailView,
    IExtendDemandItemInfo,
    filterApplyAuthPhaseList,
    searchData,
    statusDefaultVal,
} from '../const'
import __ from '../locale'
import styles from './styles.module.less'
import ViewImplementResult from './ViewImplementResult'
import ViewPermission from './ViewPermission'

interface IDemandItems {
    // 需求ID
    id?: string
    // 分析记录ID
    analysisId?: string
    getImpRes?: (data) => void
    getFeedBack?: (feedback: string) => void
    getEmptyStatus?: (isEmpty: boolean) => void
    getLoading?: (isLoading: boolean) => void
    // 是否为后台实施页面
    isBack?: boolean
    // 需求关联资源列表所有数据
    initRescList?: IDemandItemInfo[]
    handleChangeResces?: (data) => void
    // 资源权限申请是否设置审核流程
    existPermissionReq?: boolean
}

const listType = ListType.WideList

const defaultListSize = ListDefaultPageSize[listType]

const ImplementDemandItems: React.FC<IDemandItems> = ({
    id = '',
    analysisId = '',
    getImpRes = () => {},
    getFeedBack,
    getEmptyStatus,
    getLoading,
    isBack = false,
    initRescList,
    handleChangeResces = noop,
    existPermissionReq = false,
}) => {
    const [userId] = useCurrentUser('ID')
    const [{ using }, updateUsing] = useGeneralConfig()
    const { bigHeader } = useCongSearchContext()

    const [configOpen, setConfigOpen] = useState(false)
    const [implementOpen, setImplementOpen] = useState(false)
    const [total, setTotal] = useState(initRescList?.length || 0)
    const [queryParams, setQueryParams] = useState<any>({
        offset: 1,
        limit: defaultListSize,
        keyword: '',
        status: statusDefaultVal,
    })
    const [items, setItems] = useState<IDemandItemInfo[]>([])
    const [operateId, setOperateId] = useState('')
    const [operateData, setOperateData] = useState<IExtendDemandItemInfo>()
    const [implementResOpen, setImplementResOpen] = useState(false)
    const [implementRes, setImplementRes] = useState<IItemImplementAuthority[]>(
        [],
    )
    // 点击查看资源
    const [selectedResc, setSelectedResc] = useState<IDemandItemInfo>()
    // 数据库表详情
    const [viewDetailOpen, setViewDetailOpen] = useState<boolean>(false)

    const [operateItemAuthority, setOperateItemAuthority] =
        useState<IImplAchv>()
    const [loading, setLoading] = useState(false)

    const showSearch = useMemo(() => {
        return (
            queryParams?.keyword ||
            queryParams?.status?.length > 0 ||
            items?.length > 0
        )
    }, [queryParams, items])

    // 批量申请不可点击
    // const disableBatchApply = useMemo(() => {
    //     if (!isBack) return false
    //     const flag = initRescList?.find((item) => {
    //         const { auth_apply_id, phase, is_online, is_publish } = item
    //         // 已发布/上线状态
    //         const rescStatus =
    //             (using === 1 && is_publish) || (using === 2 && is_online)

    //         return (
    //             rescStatus &&
    //             auth_apply_id &&
    //             !rescApplyAuthEnd
    //                 ?.join()
    //                 ?.toLocaleLowerCase()
    //                 ?.includes(phase?.toLocaleLowerCase())
    //         )
    //     })

    //     return !flag
    // }, [initRescList])

    useEffect(() => {
        if (!initRescList) return
        setLoading(true)
        setTimeout(() => {
            const { keyword, status, offset, limit } = queryParams
            let originItems: any = []
            if (keyword || status?.length) {
                originItems = initRescList?.filter((item) => {
                    const lcKeyword = keyword?.toLocaleLowerCase() || ''
                    const { phase } = item
                    return (
                        (item?.res_busi_name
                            ?.toLocaleLowerCase()
                            ?.includes(lcKeyword) ||
                            item?.res_tech_name
                                ?.toLocaleLowerCase()
                                ?.includes(lcKeyword)) &&
                        (status === statusDefaultVal ||
                            (!phase &&
                                status?.[0] === ApplyAuthPhaseList.PENDING) ||
                            (status?.length &&
                                status
                                    ?.join()
                                    ?.toLocaleLowerCase()
                                    ?.includes(
                                        item?.phase?.toLocaleLowerCase(),
                                    )))
                    )
                })
            } else {
                originItems = initRescList
            }
            setTotal(originItems?.length)
            const cur = (offset - 1) * limit
            const newItems = originItems?.slice(cur, cur + defaultListSize)
            setItems(newItems)
            setLoading(false)
        }, 200)
    }, [initRescList, queryParams])

    useEffect(() => {
        getImpRes(implementRes)
    }, [implementRes])

    // 查看配置
    const handleView = async (item: IDemandItemInfo) => {
        try {
            const res = await getItemDetails(id, item.id)
            setOperateData({
                ...res,
                visitors: res.extend_info
                    ? JSON.parse(res.extend_info)?.visitors
                    : [],
            })
            setConfigOpen(true)
        } catch (error) {
            formatError(error)
        }
    }

    const getDemandDetail = async () => {
        try {
            if (id) {
                const res = await getDemandDetailsV2({
                    id,
                    fields: 'analysis_result,implement_result',
                    view: isBack
                        ? DemandDetailView.OPERAOTR
                        : DemandDetailView.APPLIER,
                })
                // setDetails(res)
                const newItems = res?.analysis_result?.items
                const apply_details = res?.implement_result?.apply_details
                const applyAuthPhaseList = {}
                apply_details?.forEach((applyItem) => {
                    applyAuthPhaseList[applyItem?.res_id] = applyItem
                })
                const newApplyResces = newItems?.map((item) => {
                    return {
                        ...item,
                        ...applyAuthPhaseList[item?.res_id],
                    }
                })
                handleChangeResces(newApplyResces)
            }
        } catch (err) {
            formatError(err)
        }
    }

    // 资源提交申请
    const handleAuthApply = async (item?: IDemandItemInfo) => {
        try {
            const res = await submitAuthApplyBackV2({
                demandID: id,
                analysisID: analysisId,
                ids: item?.id ? [item?.id] : undefined,
            })
            if (res?.is_applied) {
                const tipsContent = (h) => (
                    <span>
                        {__('权限申请已提交，您可前往')}
                        <span
                            style={{
                                color: '#1677FF',
                                cursor: 'pointer',
                                // marginLeft: 16,
                            }}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                const url = getActualUrl(
                                    `/personal-center/doc-audit-client/?target=apply`,
                                )
                                window.open(url)
                                message.destroy()
                            }}
                        >
                            {__('「我的-审核待办」')}
                        </span>
                        {__('中查看进度')}
                    </span>
                )

                message.info({
                    content: tipsContent(''),
                    duration: 5,
                    style: {
                        marginTop: '40px',
                    },
                })
            }
            // 重新获取资源列表数据
            getDemandDetail()
        } catch (e) {
            formatError(e)
        }
    }

    const getImplementRes = (data) => {
        if (!operateData) return
        const index = implementRes.findIndex(
            (item) => item.item_id === operateData.id,
        )
        if (index > -1) {
            const temp = cloneDeep(implementRes)
            temp[index].impl_achv = data
            setImplementRes(temp)
        } else {
            setImplementRes([
                ...implementRes,
                { item_id: operateData.id, impl_achv: data },
            ])
        }
        setOperateData(undefined)
    }

    const columns = [
        {
            title: (
                <div>
                    {__('数据资源名称')}
                    <span className={styles.subtitle}>
                        （{__('技术名称')}）
                    </span>
                </div>
            ),
            dataIndex: 'items',
            key: 'res_name',
            ellipsis: true,
            width: 348,
            render: (name, record) => {
                const { res_tech_name, res_busi_name, is_publish, is_online } =
                    record
                // 已发布/上线状态
                const rescStatus =
                    (using === 1 && is_publish) || (using === 2 && is_online)
                const rescStatusLabel =
                    using === 1
                        ? is_publish
                            ? __('已发布')
                            : __('未发布')
                        : using === 2
                        ? is_online
                            ? __('已上线')
                            : __('已下线')
                        : ''
                return (
                    <div className={styles['info-container']}>
                        <FontIcon
                            name="icon-shujubiaoshitu"
                            type={IconType.COLOREDICON}
                            className={styles.icon}
                        />
                        <div className={styles.names}>
                            <div
                                className={classnames(
                                    styles.name,
                                    rescStatus && styles.linkName,
                                )}
                                title={res_busi_name}
                                onClick={() => {
                                    if (rescStatus) {
                                        setSelectedResc(record)
                                        setViewDetailOpen(true)
                                    }
                                }}
                            >
                                {res_busi_name}
                            </div>
                            <div
                                className={styles['tech-name']}
                                title={res_tech_name}
                            >
                                {res_tech_name}
                            </div>
                        </div>
                        <div
                            className={classnames(
                                rescStatusLabel && styles['online-flag'],
                                !rescStatus &&
                                    rescStatusLabel &&
                                    styles['offline-flag'],
                            )}
                        >
                            {rescStatusLabel}
                        </div>
                    </div>
                )
            },
        },
        {
            title: __('描述'),
            dataIndex: 'res_desc',
            key: 'res_desc',
            render: (desc) => {
                return desc || '--'
            },
        },
        {
            title: __('申请状态'),
            dataIndex: 'phase',
            key: 'phase',
            width: 200,
            render: (_phase: string, record: any) => {
                const phase = (_phase ||
                    ApplyAuthPhaseList.PENDING) as ApplyAuthPhaseList
                const { message: msg } = record
                const status: any =
                    filterApplyAuthPhaseList.find((s) =>
                        s.value
                            ?.join()
                            ?.toLocaleLowerCase()
                            ?.includes(phase?.toLocaleLowerCase()),
                    ) || {}

                return status?.bgColor ? (
                    <>
                        <Badge
                            color={status.bgColor}
                            text={status.label || '--'}
                            className={styles['status-badge']}
                        />
                        {[
                            ApplyAuthPhaseList.REJECTED,
                            ApplyAuthPhaseList.UNDONE,
                            ApplyAuthPhaseList.FAILED,
                        ].includes(phase) && (
                            <Tooltip
                                title={`${
                                    [
                                        ApplyAuthPhaseList.REJECTED,
                                        ApplyAuthPhaseList.UNDONE,
                                    ].includes(phase)
                                        ? __('拒绝原因：')
                                        : __('失败原因：')
                                }${msg}`}
                                placement="bottom"
                            >
                                <FontIcon
                                    name="icon-shenheyijian"
                                    type={IconType.COLOREDICON}
                                    className={styles.reasonIcon}
                                />
                            </Tooltip>
                        )}
                    </>
                ) : (
                    '--'
                )
            },
        },
        {
            title: __('操作'),
            dataIndex: 'action',
            key: 'action',
            width: 220,
            render: (action, record: IDemandItemInfo) => {
                const { auth_apply_id, is_publish, is_online, phase } = record
                // 已发布/上线状态
                const rescStatus =
                    (using === 1 && is_publish) || (using === 2 && is_online)
                // 在授权申请阶段（如审核中，拒绝申请等等阶段）
                const isPendingPhase =
                    !phase ||
                    ApplyAuthPhaseList.PENDING.toLocaleLowerCase() ===
                        phase?.toLocaleLowerCase()
                // 显示申请按钮
                const showApplyBtn = !isPendingPhase || rescStatus
                // 支持单个资源提交申请
                const canApplyBtn = isPendingPhase && rescStatus
                return auth_apply_id && existPermissionReq ? (
                    <Space size={12}>
                        <a
                            onClick={() => {
                                setOperateId(record.id)
                                setOperateData(record)
                                setConfigOpen(true)
                            }}
                        >
                            {__('查看权限')}
                        </a>

                        {isBack && showApplyBtn && existPermissionReq && (
                            <a
                                onClick={() => {
                                    if (canApplyBtn) {
                                        handleAuthApply(record)
                                    }
                                }}
                                className={
                                    isPendingPhase
                                        ? undefined
                                        : styles['submit-auth-disable']
                                }
                            >
                                {__('提交申请')}
                            </a>
                        )}
                    </Space>
                ) : (
                    <span style={{ color: '#126EE3' }}>--</span>
                )
            },
        },
    ]

    const handleSearchPressEnter = (kw) => {
        setLoading(true)
        setQueryParams({ ...queryParams, keyword: kw, offset: 1 })
    }

    const searchChange = (d, dataKey) => {
        setLoading(true)
        setQueryParams({
            ...queryParams,
            ...d,
            offset: 1,
        })
    }

    const handlePageChange = (offset: number, limit: number) => {
        setQueryParams({ ...queryParams, offset, limit })
    }

    // 空库表
    const showEmpty = () => {
        const desc = showSearch ? (
            <span>{__('抱歉，没有找到相关内容')}</span>
        ) : (
            <div style={{ height: 44 }}>
                <div>{__('暂无数据')}</div>
            </div>
        )
        const icon = showSearch ? searchEmpty : dataEmpty
        return <Empty desc={desc} iconSrc={icon} />
    }

    return (
        <div className={styles['demand-items-wrapper']}>
            <div
                className={styles['demand-items-oprWrapper']}
                hidden={!showSearch}
            >
                {isBack && existPermissionReq && (
                    <div className={styles['demand-oprBtns']}>
                        <Button
                            type="primary"
                            onClick={() => {
                                confirm({
                                    title: __('确定要批量提交申请吗？'),
                                    icon: (
                                        <ExclamationCircleFilled
                                            style={{ color: '#faac14' }}
                                        />
                                    ),
                                    content:
                                        __(
                                            '已下线的数据资源将不会被提交，请知悉',
                                        ),
                                    okText: __('确定'),
                                    cancelText: __('取消'),
                                    onOk() {
                                        handleAuthApply()
                                    },
                                    wrapClassName: styles['apply-all-confirm'],
                                })
                            }}
                        >
                            {__('一键申请')}
                        </Button>
                    </div>
                )}
                <Space size={12} className={styles['demand-search']}>
                    <SearchInput
                        placeholder={__('搜索数据资源名称/技术名称')}
                        onKeyChange={(kw: string) => {
                            if (kw !== queryParams.keyword) {
                                handleSearchPressEnter(kw)
                            }
                        }}
                        onPressEnter={handleSearchPressEnter}
                        maxLength={32}
                    />

                    <LightweightSearch
                        formData={searchData}
                        onChange={(data, key) => searchChange(data, key)}
                        defaultValue={{ status: statusDefaultVal }}
                    />
                </Space>
            </div>
            {loading ? (
                <div className={styles['loader-container']}>
                    <Loader />
                </div>
            ) : items.length === 0 ? (
                <div
                    className={styles['empty-container']}
                    hidden={loading || items?.length > 0}
                >
                    {showEmpty()}
                </div>
            ) : (
                <div className={styles['demand-items']}>
                    <Table
                        dataSource={items}
                        columns={columns}
                        pagination={false}
                        // pagination={queryParams}
                        rowKey="id"
                        loading={loading}
                        locale={{
                            emptyText: (
                                <div className={styles['empty-container']}>
                                    <Empty
                                        iconSrc={dataEmpty}
                                        desc={__('暂无数据')}
                                    />
                                </div>
                            ),
                        }}
                    />
                    <div className={styles['list-pagination']}>
                        <ListPagination
                            size="small"
                            listType={listType}
                            queryParams={queryParams}
                            // totalCount={initRescList?.length || 0}
                            totalCount={total}
                            showTotal={(t) => {
                                return ''
                            }}
                            showQuickJumper={false}
                            pageSizeOptions={undefined}
                            showSizeChanger={false}
                            onChange={handlePageChange}
                        />
                    </div>
                </div>
            )}

            {configOpen && (
                <ViewPermission
                    open={configOpen}
                    onClose={() => {
                        setConfigOpen(false)
                        setOperateId('')
                        setOperateData(undefined)
                    }}
                    name={operateData?.res_busi_name!}
                    viewid={operateData?.auth_apply_id!}
                    sheetId={operateData?.res_id!}
                />
            )}

            {implementOpen && (
                <ViewImplementResult
                    open={implementOpen}
                    onClose={() => setImplementOpen(false)}
                    authority={operateData?.authority || []}
                    initAuthority={operateItemAuthority}
                />
            )}

            {implementResOpen && (
                <AddImplementResult
                    open={implementResOpen}
                    onClose={() => {
                        setImplementResOpen(false)
                    }}
                    getImplementRes={getImplementRes}
                    authority={operateData?.authority || []}
                    initAuthority={operateItemAuthority}
                />
            )}
            {viewDetailOpen && selectedResc?.res_id && (
                <LogicViewDetail
                    open={viewDetailOpen}
                    onClose={() => {
                        setViewDetailOpen(false)
                        setSelectedResc(undefined)
                    }}
                    id={selectedResc?.res_id}
                    showShadow={false}
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        top: bigHeader ? '62px' : '52px',
                    }}
                />
            )}
        </div>
    )
}

export default ImplementDemandItems
