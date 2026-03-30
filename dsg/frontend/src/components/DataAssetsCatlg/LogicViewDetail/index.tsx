import Icon, { LeftOutlined } from '@ant-design/icons'
import { Button, Divider, Dropdown, Space, Tabs, Tooltip } from 'antd'
import { noop, toNumber } from 'lodash'
import moment from 'moment'
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useUnmount } from 'ahooks'
import classnames from 'classnames'
import { ReactComponent as icon1 } from '@/assets/DataAssetsCatlg/icon1.svg'
import { TextAreaView } from '@/components/AutoFormView/baseViewComponents'
import { useCongSearchContext } from '@/components/CognitiveSearch/CogSearchProvider'
import CustomDrawer from '@/components/CustomDrawer'
import FieldList from '@/components/DatasheetView/FieldList'
import {
    IEditFormData,
    detailTabKey,
    filterEmptyProperties,
    stateType,
} from '@/components/DatasheetView/const'
import {
    AssetTypeEnum,
    HasAccess,
    IGradeLabel,
    IPolicyInfo,
    IVisitor,
    OnlineStatus,
    PolicyActionEnum,
    allRoleList,
    formatError,
    getDataGradeLabel,
    getDataViewBaseInfo,
    getDatasheetViewDetails,
    getSubViews,
    isMicroWidget,
    policyDetail,
    policyValidate,
    queryFrontendInterfaceServiceList,
    ResType,
} from '@/core'
import { DatasheetViewColored, FontIcon } from '@/icons'
import __ from './locale'
import styles from './styles.module.less'

import { validateRepeatName } from '@/components/DatasheetView/helper'
import { getInnerUrl, useQuery } from '@/utils'

import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useAuditProcess } from '@/hooks/useAuditProcess'

import { IconType } from '@/icons/const'
import ApplyPolicy from '@/components/AccessPolicy/ApplyPolicy'
import AccessModal from '@/components/AccessPolicy/AccessModal'
import { Loader } from '@/ui'
import DataDownloadConfig from '@/components/DataAssetsCatlg/DataDownloadConfig'
import { getTagsData } from '@/components/DataClassificationTag/const'
import { useGradeLabelState } from '@/hooks/useGradeLabelState'
import ApplicationServiceDetail from '../ApplicationServiceDetail'

import {
    ActionText,
    itemOtherInfo,
    TimeRender,
    getShareAndOpenType,
    getDisabledTooltip,
} from './helper'

import { CogAParamsType, MicroWidgetPropsContext } from '@/context'
import { getIsNeedPermisControl } from '../helper'

import { BizType, PolicyType } from '@/components/AuditPolicy/const'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import {
    getPublishStatus,
    OfflineStatusList,
    UnpublishedStatusList,
    DataRescType,
} from '../ApplicationService/helper'
import {
    AccessOptMap,
    getLabelByPermission,
} from '@/components/AccessPolicy/components/VisitAccessSelect/helper'
import DataPreview from '@/components/DatasheetView/DataPreview'
import ReportDetailContent from '@/components/WorkOrder/QualityReport/ReportDetail/ReportDetailContent'
import { DataViewProvider } from '@/components/DatasheetView/DataViewProvider'
import ConsanguinityGraph from '@/components/ConsanguinityGraph'
import ImpactAnalysis from '@/components/ImpactAnalysis'
import AddDataset from '@/components/Dataset/AddDataset'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import OwnerDisplay from '@/components/OwnerDisplay'

import PermisApplyBtn from '../DataResc/PermisApplyBtn'
import { usePolicyCheck } from '@/hooks/usePolicyCheck'
import FavoriteOperation, {
    UpdateFavoriteParams,
} from '@/components/FavoriteResMode/FavoriteOperation'
import FeedbackOperation from '@/components/FeedbackResMode/operate/FeedbackOperation'

interface TitleBarType {
    title: string
}
const TitleBar = ({ title }: TitleBarType) => {
    return (
        <div className={styles.titleBar}>
            <Icon component={icon1} className={styles.label} />
            <div className={styles.tilte}>{title}</div>
        </div>
    )
}

interface ILogicViewDetail {
    open: boolean
    onClose: (flag?: boolean) => void
    id?: string
    isIntroduced?: boolean
    // 是否来自审核待办
    isAudit?: boolean
    // 是否来自授权页
    isFromAuth?: boolean
    // 是否拥有此数据资源的权限
    hasPermission?: boolean
    returnInDrawer?: () => void
    getContainer?: HTMLElement | false
    showShadow?: boolean
    // 是否显示数据下载功能
    showDataDownload?: boolean
    style?: React.CSSProperties | undefined
    // 是否显示详情需要原有按钮
    isNeedComExistBtns?: boolean
    extraBtns?: React.ReactNode
    canChat?: boolean // 是否可以问答
    hasAsst?: boolean // 是否有认知助手
    headerStyle?: React.CSSProperties | undefined
    headerTitle?: string
    isShowHeader?: boolean
    isFromAi?: boolean
    aiStyle?: React.CSSProperties | undefined
    fullHeight?
    maskClosable?: boolean
    hiddenReturn?: boolean // 是否隐藏返回按钮
    // 添加收藏
    onAddFavorite?: ({ is_favored, favor_id }: UpdateFavoriteParams) => void
    // 取消收藏
    onCancelFavorite?: ({ is_favored, favor_id }: UpdateFavoriteParams) => void
    isPersonalCenter?: boolean // 是否来自个人中心
    showDataConsanguinity?: boolean // 是否显示数据血缘关系
    showFavoriteOperation?: boolean // 是否显示收藏操作
    showFeedbackOperation?: boolean // 是否显示反馈操作
}

const LogicViewDetail = ({
    open,
    onClose,
    id = '',
    isIntroduced,
    isFromAuth,
    hasPermission = false,
    returnInDrawer = noop,
    getContainer = false,
    isAudit = false,
    showShadow = true,
    showDataDownload = true,
    style,
    isNeedComExistBtns = true,
    extraBtns,
    canChat = false,
    hasAsst = false,
    headerStyle = { display: 'none' },
    headerTitle,
    isShowHeader = false,
    isFromAi = false,
    aiStyle,
    fullHeight = false,
    maskClosable = false,
    hiddenReturn = false,
    onAddFavorite = noop,
    onCancelFavorite = noop,
    showDataConsanguinity = false,
    showFavoriteOperation = true,
    showFeedbackOperation = true,
    isPersonalCenter = false,
}: ILogicViewDetail) => {
    const [userId] = useCurrentUser('ID')
    const [{ using }] = useGeneralConfig()

    const [loading, setLoading] = useState(true)

    const container = useRef<any>(null)
    const header = useRef<any>(null)
    const [isApply, setIsApply] = useState<boolean>(false)

    const fieldsTableRef: any = useRef()

    const [openDelFields, setOpenDelFields] = useState<boolean>(false)
    const [dataList, setDataList] = useState<any[]>([])

    const [fillteDataList, setFillteDataList] = useState<any[]>([])
    const [currentData, setCurrentData] = useState<any>({})
    const [dropdownSearchKey, setDropdownSearchKey] = useState<string>('')
    const [detailsData, setDetailsData] = useState<any>()
    const [delfieldList, setDelFieldList] = useState<any[]>([])
    const [fieldsTableData, setFieldsTableData] = useState<any[]>([])
    const [initFieldsTableData, setInitFieldsTableData] = useState<any[]>([])
    const [isNotExistDatasheet, setIsNotExistDatasheet] =
        useState<boolean>(false)
    const [openEditBasicInfo, setOpenEditBasicInfo] = useState<boolean>(false)
    const [moreInfoIschanged, setMoreInfoIschanged] = useState<boolean>(false)
    const [editFormData, setEditFormData] = useState<IEditFormData>()
    const [baseInfoData, setBaseInfoData] = useState<any>({})
    const [tabActiveKey, setTabActiveKey] = useState<detailTabKey | string>(
        detailTabKey.view,
    )
    const [downloadOpen, setDownloadOpen] = useState(false)
    const [viewModalRadio, setViewModalRadio] = useState<string>(
        isFromAi ? 'list' : 'table',
    )

    const [allowRead, setAllowRead] = useState<boolean>(false)
    // 授权申请
    const [permissionRequestOpen, setPermissionRequestOpen] =
        useState<boolean>(false)
    // 授权
    const [accessOpen, setAccessOpen] = useState<boolean>(false)
    // 点击接口
    const [selInterface, setSelInterface] = useState<any>({})
    // 接口详情
    const [interfaceDetailOpen, setInterfaceDetailOpen] =
        useState<boolean>(false)
    const [hasTimestamp, setHasTimestamp] = useState<boolean>(false)
    const { bigHeader } = useCongSearchContext()
    const [isGradeOpen] = useGradeLabelState()
    const [tagData, setTagData] = useState<IGradeLabel[]>([])
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const {
        checkPermission: checkUserPermission,
        checkPermissions: checkUserPermissions,
    } = useUserPermCtx()

    const hasBusinessRoles = useMemo(
        () => checkUserPermissions(HasAccess.isHasBusiness),
        [checkUserPermissions],
    )
    // useCogAsstContext 已移除，相关功能已下线

    const [dataViewAccess, setDataViewAccess] = useState<string>()
    const [subViewAccess, setSubViewAccess] = useState<any>()
    const [subViews, setSubViews] = useState<any[]>()
    const query = useQuery()
    const dataviewId = query.get('dataviewId') || ''
    // 视图id--不能为空  如果参数中有id就使用id，否则使用页面路径dataviewId参数
    const [rescId, setRescId] = useState<string>('')
    const {
        loading: permisLoading,
        allowedActions,
        checkBatchPolicy,
        refreshPolicy,
    } = usePolicyCheck(rescId, AssetTypeEnum.DataView, {
        toast: microWidgetProps?.components?.toast,
    })

    // 获取当前数据运营工程师
    const userOperationEngineer = useMemo(
        () => checkUserPermission(allRoleList.TCDataOperationEngineer),
        [checkUserPermission],
    )
    // 获取当前数据开发工程师
    const userDevelopEngineer = useMemo(
        () => checkUserPermission(allRoleList.TCDataGovernEngineer),
        [checkUserPermission],
    )

    const detailTabItems = useMemo(() => {
        if (isPersonalCenter) {
            return [
                {
                    label: __('字段'),
                    key: detailTabKey.view,
                },
            ]
        }
        return [
            // {
            //     label: __('样例数据'),
            //     key: detailTabKey.sampleData,
            // },
            // {
            //     label: __('数据预览'),
            //     key: detailTabKey.dataPreview,
            // },
            {
                label: __('字段'),
                key: detailTabKey.view,
            },
            {
                label: showDataConsanguinity ? __('数据血缘') : '',
                key: detailTabKey.dataConsanguinity,
            },
            {
                label: __('影响分析'),
                key: detailTabKey.impactAnalysis,
            },
            {
                label: __('数据质量'),
                key: detailTabKey.dataPreview,
            },
        ]?.filter((tab) => tab.label)
    }, [baseInfoData, isPersonalCenter])

    // 获取分级标签
    const getTags = async () => {
        try {
            const result = await getDataGradeLabel({ keyword: '' })
            const tagArr = []
            getTagsData(result.entries, tagArr)
            setTagData(tagArr)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (id) {
            setRescId(id || '')
        } else {
            setRescId(dataviewId)
        }
    }, [id])

    useEffect(() => {
        if (isGradeOpen) {
            getTags()
        }
    }, [isGradeOpen])

    // 是否拥有数据运营工程师
    const hasDataOperRole = useMemo(() => {
        return (
            checkUserPermission(allRoleList.TCDataOperationEngineer) ??
            checkUserPermission(allRoleList.TCDataGovernEngineer) ??
            false
        )
    }, [checkUserPermission])

    // 发布状态-2.0.0.5库表仅有未发布，没有审核状态
    // const publishedStatus = useMemo(() => {
    //     const status = getPublishStatus(baseInfoData.published_status)
    //     return status ? __('（') + status + __('）') : ''
    // }, [baseInfoData])

    // 抽屉 top
    const styleTop = useMemo(() => {
        if (style?.top === 0) {
            return 0
        }
        if (style?.top) {
            if (typeof style.top === 'number') {
                return style.top
            }
            return Number(style.top.replace('px', ''))
        }
        return bigHeader ? 62 : 52
    }, [style])

    useEffect(() => {
        if (open) {
            getDetails()
        }
    }, [rescId, open])

    useUnmount(() => {
        // useCogAsstContext 已移除
    })

    // const checkDownloadPermission = async (_id: string) => {
    //     if (!_id) return
    //     try {
    //         const res = await policyValidate([
    //             {
    //                 action: PolicyActionEnum.Download,
    //                 object_id: _id,
    //                 object_type: AssetTypeEnum.DataView,
    //                 subject_id: userId,
    //                 subject_type: 'user',
    //             },
    //         ])
    //         const validateItem = (res || [])?.find((o) => o.object_id === _id)
    //         if (validateItem?.effect === 'allow') {
    //             setAllowDownload(true)
    //         }
    //     } catch (error) {
    //         formatError(error, microWidgetProps?.components?.toast)
    //     }
    // }

    const checkReadPermission = async (_id: string) => {
        if (!_id) return
        try {
            const res = await policyValidate([
                {
                    action: PolicyActionEnum.Read,
                    object_id: _id,
                    object_type: AssetTypeEnum.DataView,
                    subject_id: userId,
                    subject_type: 'user',
                },
            ])
            const validateItem = (res || [])?.find((o) => o.object_id === _id)
            if (validateItem?.effect === 'allow') {
                setAllowRead(true)
            }
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        }
    }

    // 对应资源模式下，发布状态或上线状态
    const isPubOrOnline = useMemo(() => {
        const rescOwnerId = baseInfoData?.owner_id
        const status =
            (using === 1 && !!baseInfoData?.publish_at) ||
            (using === 2 &&
                [
                    OnlineStatus.ONLINE,
                    OnlineStatus.DOWN_AUDITING,
                    OnlineStatus.DOWN_REJECT,
                ].includes(baseInfoData?.online_status))
        if (status) {
            // 当前用户为资源owner或被授予权限，则可读取
            if (rescOwnerId && rescOwnerId === userId) {
                setAllowRead(true)
            } else {
                // checkDownloadPermission(rescId)
                checkReadPermission(rescId)
            }
        }
        return status
    }, [baseInfoData])

    // 是否已上线
    const isOnline = useMemo(() => {
        return [
            OnlineStatus.ONLINE,
            OnlineStatus.DOWN_AUDITING,
            OnlineStatus.DOWN_REJECT,
        ].includes(baseInfoData?.online_status)
    }, [baseInfoData])

    // 是否已发布
    const isPublished = useMemo(() => {
        return baseInfoData?.publish_status === 'published'
    }, [baseInfoData?.publish_status])

    const getDetails = async () => {
        if (!rescId) return
        try {
            setLoading(true)
            const res = await getDatasheetViewDetails(rescId)
            const baseRes = await getDataViewBaseInfo(rescId)

            let asscoiateInterfaces: any = []
            try {
                asscoiateInterfaces = (
                    await queryFrontendInterfaceServiceList(rescId)
                )?.entries
            } catch (e) {
                // formatError(e)
            }

            // 去除空字段
            const baseResValue: IEditFormData = filterEmptyProperties(baseRes)
            setBaseInfoData({
                ...baseResValue,
                id: rescId,
                business_name: res?.business_name,
                technical_name: res?.technical_name,
                viewStatus: res?.status,
                datasource_id: res?.datasource_id,
                last_publish_time: res?.last_publish_time,
                // 关联接口
                asscoiateInterfaces,
            })
            setHasTimestamp(res.fields?.some((o) => o.business_timestamp))
            setDetailsData({
                ...res,
                owner_id: baseResValue?.owner_id,
                owners: baseResValue?.owners,
            })
            // 屏蔽切换库表功能，指定详情数据为当前数据，后续放开需调整
            setCurrentData({
                ...res,
                updated_at: baseResValue?.updated_at,
                publish_at: res?.last_publish_time,
            })
            setEditFormData({
                id: rescId,
                business_name: res?.business_name,
                technical_name: res?.technical_name,
                last_publish_time: res?.last_publish_time,
                datasource_id: res?.datasource_id,
                description: baseResValue?.description,
                owner_id: baseResValue?.owner_id,
                subject_id: baseResValue?.subject_id,
                subject: baseResValue?.subject,
                department_id: baseResValue?.department_id,
            })
            const delFields = res?.fields
                ?.filter((item) => item.status === stateType.delete)
                .sort((a, b) =>
                    a.business_name.localeCompare(b.business_name, 'pinyin', {
                        numeric: true,
                    }),
                )
            setDelFieldList(delFields)
            // setOptionType(!res?.last_publish_time ? 'edit' : model)
            const data = res?.fields.map((item) => {
                return {
                    ...item,
                    tips:
                        validateRepeatName(
                            res?.fields?.filter(
                                (it) => it.status !== stateType.delete,
                            ),
                            item,
                        ) && item.status !== stateType.delete
                            ? __('此名称和其他字段的业务名称重复，请修改')
                            : '',
                }
            })
            // bug-728558 服务超市字段列表移除权限
            // .filter((o) => o.is_readable) // 只显示具备读取权限字段
            setFieldsTableData(data)
            setInitFieldsTableData(data)
        } catch (err) {
            const { code } = err?.data ?? {}
            if (code === 'DataView.FormView.FormViewIdNotExist') {
                // setIsNotExistDatasheet(
                //     err?.data?.code === 'DataView.FormView.FormViewIdNotExist',
                // )
                onClose()
                return
            }

            setFieldsTableData([])
            setInitFieldsTableData([])
            formatError(err, microWidgetProps?.components?.toast)
            onClose()
        } finally {
            setLoading(false)
        }
    }

    const showDivder = (divdStyle?: any) => {
        return (
            <Divider
                style={{
                    height: '12px',
                    borderRadius: '1px',
                    borderLeft: '1px solid rgba(0,0,0,0.24)',
                    margin: '0px 2px 0px 12px',
                    ...divdStyle,
                }}
                type="vertical"
            />
        )
    }
    // 仅服务超市、认知搜索、首页、我的、资产全景
    const isShowRequestPath = [
        '/data-assets',
        '/cognitive-search',
        '/asset-center',
        '/my-assets',
        '/asset-view/architecture',
    ].includes(getInnerUrl(window.location.pathname))

    // 具备授权权限
    const canAuth = useMemo(() => {
        const viewAuth = [
            PolicyActionEnum.Allocate,
            PolicyActionEnum.Auth,
        ].some((o) => allowedActions?.includes(o))
        const subAuth = detailsData?.can_auth
        return viewAuth || subAuth
    }, [allowedActions, detailsData?.can_auth])

    const isOwner = useMemo(() => {
        return (
            userId &&
            detailsData?.owners?.some((owner) => owner.owner_id === userId)
        )
    }, [detailsData, userId])

    useEffect(() => {
        if (isOwner) {
            const accessText = [__('读取'), __('下载'), __('授权')].join('/')
            setAllowRead(true)
            setDataViewAccess(accessText)
        } else {
            // 授权单独判断
            const allowActions = allowedActions
                ?.filter(
                    (o) =>
                        ![
                            PolicyActionEnum.Auth,
                            PolicyActionEnum.Allocate,
                        ].includes(o),
                )
                .map((o) => ActionText[o])
            if (allowedActions?.includes(PolicyActionEnum.Auth)) {
                allowActions.push(__('授权'))
            }
            if (allowedActions?.includes(PolicyActionEnum.Allocate)) {
                allowActions.push(__('授权(仅分配)'))
            }
            setAllowRead(allowedActions?.includes(PolicyActionEnum.Read))
            const accessText =
                allowActions.join('/') ||
                (userDevelopEngineer || userOperationEngineer ? __('读取') : '')
            setDataViewAccess(accessText)
        }
    }, [isOwner, allowedActions, userDevelopEngineer, userOperationEngineer])

    const getUserAccess = async () => {
        if (!rescId) return
        try {
            const subviewResult = await getSubViews({
                limit: 1000,
                offset: 1,
                logic_view_id: rescId,
            })

            const subItems = (subviewResult?.entries || []).map((o) => ({
                id: o.id,
                name: o.name,
                detail: JSON.parse(o.detail || '{}'),
            }))
            setSubViews(subItems)

            // 仅非owner查询子视图权限 且子视图数量大于0
            if (!isOwner && subItems?.length > 0) {
                const subParams = subItems.map((o) => ({
                    id: o.id,
                    type: AssetTypeEnum.SubView,
                }))
                // 批量查询子视图权限并分组
                const subResult: any = await checkBatchPolicy(subParams)

                const groupById = Object.keys(subResult || {}).reduce(
                    (acc, key) => {
                        const item = subResult[key] as any
                        acc[key] = acc[key] || []
                        acc[key].push(...(item.allowedActions || []))
                        return acc
                    },
                    {},
                )
                setSubViewAccess(groupById)
            }
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (detailsData && open) {
            getUserAccess()
        }
    }, [isOwner, detailsData, open, userDevelopEngineer, userOperationEngineer])

    // 是否显示权限申请按钮
    // const isShowAuditProcessBtn = useMemo(() => {
    //     return (
    //         hasAuditProcess &&
    //         !isOwner &&
    //         (isShowRequestPath ||
    //             isMicroWidget({
    //                 microWidgetProps,
    //             }))
    //     )
    // }, [hasAuditProcess, isOwner])

    const showToolTip = (title: any, toolTipTitle: any, value: any) => {
        return (
            <Tooltip
                title={
                    title ? (
                        <div className={styles.unitTooltip}>
                            <div>{toolTipTitle}</div>
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: value || '--',
                                }}
                            />
                        </div>
                    ) : (
                        value
                    )
                }
                overlayClassName={styles.toolTipWrapper}
                className={styles.toolTip}
                getPopupContainer={(n) => n.parentElement?.parentElement || n}
                placement="bottom"
            >
                <div className={styles.itemDetailInfo} key={title}>
                    <span>{title}</span>
                    <span
                        className={styles.itemDetailInfoValue}
                        dangerouslySetInnerHTML={{
                            __html: value || '--',
                        }}
                    />
                </div>
            </Tooltip>
        )
    }

    const subViewInfo = useMemo(() => {
        const subViewItems: any = Object.keys(subViewAccess || {}).reduce(
            (prev: any[], cur) => {
                const sub = subViews?.find((o) => o.id === cur)
                const item = {
                    id: sub?.id,
                    name: sub?.name,
                    access: (subViewAccess[cur] || [])
                        .map((o) => ActionText[o])
                        .join('/'),
                }
                return [...prev, item]
            },
            [],
        )

        return (
            <div className={styles.subViewList}>
                {(subViewItems || []).map((o) => (
                    <div className={styles.subViewItem} key={o.id}>
                        <div
                            className={styles.subViewName}
                            title={o.name || '--'}
                        >
                            <span>{__('规则')}：</span> {o.name || '--'}
                        </div>
                        <div
                            className={styles.subViewAccess}
                            title={o.access || '--'}
                        >
                            <span>{__('权限')}：</span> {o.access || '--'}
                        </div>
                    </div>
                ))}
                <div
                    className={styles.subViewItem}
                    hidden={subViewItems?.length}
                >
                    <div className={styles.subViewName}>
                        {__('暂无规则权限')}
                    </div>
                </div>
            </div>
        )
    }, [subViewAccess, subViews])

    // render
    const renderOtherInfo = (item: any, data: any) => {
        const { firstKey, infoKey, type, title, toolTipTitle } = item
        if (infoKey === 'owners') {
            return (
                <div className={styles.itemDetailInfo} key={title}>
                    <span>{title}</span>
                    <OwnerDisplay value={data?.owners} />
                </div>
            )
        }
        if (infoKey === 'access') {
            let currentTitle = title
            if (!isOwner) {
                currentTitle = (
                    <>
                        {title}
                        <span>{__('库表')}：</span>
                    </>
                )
            }
            return isPersonalCenter
                ? null
                : showToolTip(
                      currentTitle,
                      toolTipTitle,
                      dataViewAccess || __('暂无权限'),
                  )
        }
        const showContent = data?.[infoKey] || ''
        return showToolTip(title, toolTipTitle, showContent)
    }

    //  收藏
    const handleFavoriteAdd = ({
        is_favored,
        favor_id,
    }: UpdateFavoriteParams) => {
        setBaseInfoData({
            ...baseInfoData,
            is_favored,
            favor_id,
        })
        onAddFavorite({ is_favored, favor_id })
    }

    //  取消收藏
    const handleFavoriteCancel = ({
        is_favored,
        favor_id,
    }: UpdateFavoriteParams) => {
        setBaseInfoData({
            ...baseInfoData,
            is_favored,
            favor_id,
        })
        onCancelFavorite({ is_favored, favor_id })
    }

    return (
        <DataViewProvider>
            <CustomDrawer
                open={open}
                isShowFooter={false}
                bodyStyle={{
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                }}
                onClose={(e: any) => onClose(e)}
                title={headerTitle}
                customHeaderStyle={{ display: 'none' }}
                customBodyStyle={{
                    height: fullHeight ? '100%' : `calc(100% - ${styleTop}px)`,
                    background: '#f0f2f6',
                    position: 'relative',
                    overflow: 'hidden',
                }}
                headerStyle={headerStyle}
                isShowHeader={isShowHeader}
                // getContainer={() => document.body}
                style={
                    style ||
                    (isIntroduced
                        ? {
                              position: 'relative',
                              width: '100%',
                              //   height: 'calc(100% - 55px)',
                              height: '100%',
                              top: 0,
                          }
                        : {
                              position: 'fixed',
                              width: '100vw',
                              // height: 'calc(100vh - 64px)',
                              // top: '64px',
                              height: '100vh',
                              top: styleTop,
                              //   borderTop: '1px solid rgb(0 0 0 / 10%)',
                          })
                }
                getContainer={getContainer}
                maskClosable={maskClosable}
            >
                {showShadow && (
                    <div
                        hidden={loading || permisLoading}
                        className={styles.bodyShadow}
                    />
                )}
                <div
                    className={styles.logicViewDetail}
                    ref={container}
                    style={{
                        height: isIntroduced ? '100%' : undefined,
                        borderTop:
                            !style && !isIntroduced
                                ? '1px solid rgb(0 0 0 / 10%)'
                                : '',
                    }}
                >
                    {(loading || permisLoading) && (
                        <div className={styles.detailLoading}>
                            <Loader />
                        </div>
                    )}
                    <div
                        className={styles.header}
                        ref={header}
                        hidden={loading || permisLoading}
                    >
                        <div
                            onClick={() => {
                                returnInDrawer()
                                onClose(isApply)
                            }}
                            className={styles.returnInfo}
                            hidden={hiddenReturn}
                        >
                            <LeftOutlined className={styles.returnArrow} />
                        </div>
                        <div className={styles.headerContent}>
                            <Space
                                direction="vertical"
                                wrap={false}
                                style={{ width: '100%' }}
                            >
                                <div className={styles.headerBox}>
                                    <div className={styles.rescIcon}>
                                        <DatasheetViewColored />
                                    </div>
                                    <div className={styles.rescTopInfoWrapper}>
                                        <div
                                            className={styles.logicViewName}
                                            title={baseInfoData?.business_name}
                                        >
                                            <span
                                                className={styles.name}
                                                title={
                                                    baseInfoData?.business_name ||
                                                    '--'
                                                }
                                            >
                                                {baseInfoData?.business_name ||
                                                    '--'}
                                            </span>
                                            {hasDataOperRole &&
                                                // 库表2005版发布不经过审核，仅有未发布、已发布状态，详情接口中仅能通过是否有发布时间判断是否发布
                                                !baseInfoData?.publish_at && (
                                                    <div
                                                        className={
                                                            styles.publishState
                                                        }
                                                    >
                                                        {
                                                            __('未发布')
                                                            //   + publishedStatus
                                                        }
                                                    </div>
                                                )}
                                        </div>
                                        <div className={styles.logicSubInfo}>
                                            <div
                                                className={
                                                    styles.rescCodeInfoWrapper
                                                }
                                            >
                                                {__('编码：')}
                                                <span
                                                    title={
                                                        baseInfoData?.uniform_catalog_code ||
                                                        '--'
                                                    }
                                                >
                                                    {baseInfoData?.uniform_catalog_code ||
                                                        '--'}
                                                </span>
                                            </div>
                                            <div
                                                className={styles.rescTechName}
                                            >
                                                {__('技术名称：')}
                                                <span
                                                    title={
                                                        baseInfoData?.technical_name ||
                                                        '--'
                                                    }
                                                >
                                                    {baseInfoData?.technical_name ||
                                                        '--'}
                                                </span>
                                            </div>
                                            {!isFromAi && !isPersonalCenter && (
                                                <div
                                                    className={
                                                        styles.rescGenview
                                                    }
                                                >
                                                    {__('生成接口：')}

                                                    <div
                                                        className={
                                                            styles.viewWrapper
                                                        }
                                                    >
                                                        {toNumber(
                                                            baseInfoData
                                                                ?.asscoiateInterfaces
                                                                ?.length,
                                                        ) > 0 ? (
                                                            <span
                                                                className={
                                                                    styles.viewTag
                                                                }
                                                                title={
                                                                    baseInfoData
                                                                        ?.asscoiateInterfaces?.[0]
                                                                        ?.service_name ||
                                                                    '--'
                                                                }
                                                            >
                                                                <a
                                                                    className={
                                                                        styles.serviceLink
                                                                    }
                                                                    onClick={() => {
                                                                        setSelInterface(
                                                                            baseInfoData
                                                                                ?.asscoiateInterfaces?.[0],
                                                                        )
                                                                        setInterfaceDetailOpen(
                                                                            true,
                                                                        )
                                                                    }}
                                                                >
                                                                    {baseInfoData
                                                                        ?.asscoiateInterfaces?.[0]
                                                                        ?.service_name ||
                                                                        '--'}
                                                                </a>
                                                            </span>
                                                        ) : (
                                                            '--'
                                                        )}
                                                        {toNumber(
                                                            baseInfoData
                                                                ?.asscoiateInterfaces
                                                                ?.length,
                                                        ) > 1 && (
                                                            <Dropdown
                                                                menu={{
                                                                    items: baseInfoData?.asscoiateInterfaces
                                                                        ?.slice(
                                                                            1,
                                                                            11,
                                                                        )
                                                                        ?.map(
                                                                            (
                                                                                sItem,
                                                                            ) => ({
                                                                                ...sItem,
                                                                                label: sItem.service_name,
                                                                                key: sItem.service_id,
                                                                            }),
                                                                        ),
                                                                    onClick: (
                                                                        sItem,
                                                                    ) => {
                                                                        const selService =
                                                                            baseInfoData?.asscoiateInterfaces?.find(
                                                                                (
                                                                                    _item,
                                                                                ) =>
                                                                                    _item.service_id ===
                                                                                    sItem.key,
                                                                            )
                                                                        setSelInterface(
                                                                            selService,
                                                                        )
                                                                        setInterfaceDetailOpen(
                                                                            true,
                                                                        )
                                                                    },
                                                                }}
                                                                trigger={[
                                                                    'click',
                                                                ]}
                                                                getPopupContainer={(
                                                                    n,
                                                                ) => n}
                                                                placement="bottomRight"
                                                            >
                                                                <span
                                                                    className={
                                                                        styles.viewOtherNumTag
                                                                    }
                                                                >
                                                                    <a
                                                                        className={
                                                                            styles.moreLink
                                                                        }
                                                                    >
                                                                        {`+${
                                                                            toNumber(
                                                                                baseInfoData
                                                                                    ?.asscoiateInterfaces
                                                                                    ?.length,
                                                                            ) -
                                                                            1
                                                                        }`}
                                                                    </a>
                                                                </span>
                                                            </Dropdown>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {hasTimestamp && (
                                                <div
                                                    className={
                                                        styles.rescTechName
                                                    }
                                                >
                                                    {__('业务数据更新时间：')}
                                                    <span>
                                                        <TimeRender
                                                            formViewId={rescId}
                                                        />
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {!isFromAi && (
                                        <div className={styles.nameBtn}>
                                            {extraBtns}
                                            {isNeedComExistBtns && (
                                                <>
                                                    {/* {/* <Button
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        window.open(
                                                            getActualUrl(
                                                                `/datasheet-view?tab=${baseInfoData?.type}&viewCode=${baseInfoData?.uniform_catalog_code}`,
                                                            ),
                                                        )
                                                    }}
                                                    icon={
                                                        <FontIcon
                                                            name="icon-tiaozhuan1"
                                                            className={
                                                                styles.itemOprIcon
                                                            }
                                                        />
                                                    }
                                                    className={styles.itemOprBtn}
                                                >
                                                    {__('跳转后台')}
                                                </Button> */}
                                                    {/* {(isOwner || canAuth) &&
                                                        isOnline &&
                                                        (isShowRequestPath ||
                                                            isMicroWidget({
                                                                microWidgetProps,
                                                            })) && (
                                                            <Tooltip
                                                                title={__(
                                                                    '资源授权',
                                                                )}
                                                                overlayClassName={
                                                                    styles.toolTipWrapper
                                                                }
                                                                placement="bottomRight"
                                                            >
                                                                <Button
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.preventDefault()
                                                                        e.stopPropagation()
                                                                        setAccessOpen(
                                                                            true,
                                                                        )
                                                                    }}
                                                                    icon={
                                                                        <FontIcon
                                                                            name="icon-shouquan"
                                                                            type={
                                                                                IconType.FONTICON
                                                                            }
                                                                            className={
                                                                                styles.itemOprIcon
                                                                            }
                                                                        />
                                                                    }
                                                                    className={
                                                                        styles.itemOprBtn
                                                                    }
                                                                >
                                                                    {__(
                                                                        '资源授权',
                                                                    )}
                                                                </Button>
                                                            </Tooltip>
                                                        )} */}
                                                    {/* {isShowAuditProcessBtn && (
                                                        <Tooltip
                                                            title={
                                                                !isOnline
                                                                    ? __(
                                                                          '该库表未发布或未上线，无法进行权限申请',
                                                                      )
                                                                    : !hasBusinessRoles
                                                                    ? __(
                                                                          '为集成应用申请权限',
                                                                      )
                                                                    : ''
                                                            }
                                                            overlayClassName={
                                                                styles.toolTipWrapper
                                                            }
                                                            placement="bottomRight"
                                                        >
                                                            <Button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault()
                                                                    e.stopPropagation()
                                                                    setPermissionRequestOpen(
                                                                        true,
                                                                    )
                                                                }}
                                                                icon={
                                                                    <FontIcon
                                                                        name="icon-quanxianshenqing1"
                                                                        type={
                                                                            IconType.FONTICON
                                                                        }
                                                                        className={
                                                                            styles.itemOprIcon
                                                                        }
                                                                    />
                                                                }
                                                                className={
                                                                    styles.itemOprBtn
                                                                }
                                                                disabled={
                                                                    !isOnline
                                                                }
                                                            >
                                                                {__('权限申请')}
                                                            </Button>
                                                        </Tooltip>
                                                    )} */}
                                                    <PermisApplyBtn
                                                        id={id}
                                                        type={
                                                            DataRescType.LOGICALVIEW
                                                        }
                                                        isOnline={isOnline}
                                                        isOwner={isOwner}
                                                        onApplyPermisClick={(
                                                            flag?: boolean,
                                                        ) =>
                                                            setPermissionRequestOpen(
                                                                true,
                                                            )
                                                        }
                                                        isIconBtn={false}
                                                    />
                                                    {/* 认知助手功能已下线 */}
                                                    {/* <Button
                                                    hidden={isFromAuth}
                                                    onClick={() => {
                                                        returnInDrawer()
                                                        onClose(isApply)
                                                    }}
                                                    type={
                                                        isIntroduced
                                                            ? 'text'
                                                            : 'default'
                                                    }
                                                    className={classnames({
                                                        [styles.closeScreenBtn]:
                                                            true,
                                                        [styles.isIntroCloseBtn]:
                                                            isIntroduced,
                                                    })}
                                                    icon={
                                                        isIntroduced ? (
                                                            <Tooltip
                                                                title={__('关闭')}
                                                                placement="bottom"
                                                            >
                                                                <CloseOutlined
                                                                    className={
                                                                        styles.closeIcon
                                                                    }
                                                                />
                                                            </Tooltip>
                                                        ) : (
                                                            <Tooltip
                                                                title={__(
                                                                    '退出全屏',
                                                                )}
                                                                placement="bottom"
                                                            >
                                                                <ShouQiOutlined
                                                                    className={
                                                                        styles.closeIcon
                                                                    }
                                                                />
                                                            </Tooltip>
                                                        )
                                                    }
                                                /> */}
                                                    {!isPersonalCenter &&
                                                        showFavoriteOperation && (
                                                            <FavoriteOperation
                                                                type="button"
                                                                item={
                                                                    baseInfoData
                                                                }
                                                                className={
                                                                    styles.itemOprIcon
                                                                }
                                                                resType={
                                                                    ResType.DataView
                                                                }
                                                                disabled={
                                                                    !isOnline
                                                                }
                                                                disabledTooltip={getDisabledTooltip(
                                                                    {
                                                                        isOnline,
                                                                        isPublished,
                                                                        action: 'favorite',
                                                                    },
                                                                )}
                                                                onAddFavorite={
                                                                    handleFavoriteAdd
                                                                }
                                                                onCancelFavorite={
                                                                    handleFavoriteCancel
                                                                }
                                                            />
                                                        )}
                                                    {!isPersonalCenter &&
                                                        showFeedbackOperation && (
                                                            <FeedbackOperation
                                                                type="button"
                                                                item={
                                                                    baseInfoData
                                                                }
                                                                resType={
                                                                    ResType.DataView
                                                                }
                                                                disabled={
                                                                    !isOnline
                                                                }
                                                                disabledTooltip={getDisabledTooltip(
                                                                    {
                                                                        isOnline,
                                                                        isPublished,
                                                                        action: 'feedback',
                                                                    },
                                                                )}
                                                                className={
                                                                    styles.itemOprIcon
                                                                }
                                                            />
                                                        )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {/* 添加到数据集 */}
                                    {/* {!isAudit && allowRead && isPubOrOnline && (
                                        <AddDataset
                                            showTitle
                                            className={styles.itemOprIcon}
                                            item={id}
                                        />
                                    )} */}
                                </div>
                                <div className={styles.descriptionWrapper}>
                                    <span className={styles.textTitle}>
                                        {__('描述：')}
                                    </span>
                                    <div className={styles.descContent}>
                                        <TextAreaView
                                            initValue={
                                                baseInfoData?.description ||
                                                '--'
                                            }
                                            rows={1}
                                            placement="end"
                                            onExpand={() => {}}
                                        />
                                    </div>
                                </div>
                                <div className={styles.itemOtherInfo}>
                                    <div
                                        style={{
                                            flexShrink: 0,
                                        }}
                                    >
                                        {`${
                                            using === 1
                                                ? __('发布时间')
                                                : __('上线时间')
                                        } ${
                                            baseInfoData?.[
                                                using === 1
                                                    ? 'publish_at'
                                                    : 'online_time'
                                            ]
                                                ? moment(
                                                      baseInfoData?.[
                                                          using === 1
                                                              ? 'publish_at'
                                                              : 'online_time'
                                                      ],
                                                  ).format('YYYY-MM-DD')
                                                : '--'
                                        }`}
                                    </div>
                                    {showDivder()}
                                    <div className={styles.iconLabel}>
                                        {itemOtherInfo.map((oItem) => {
                                            return renderOtherInfo(
                                                oItem,
                                                baseInfoData,
                                            )
                                        })}
                                        {!isPersonalCenter && (
                                            <div
                                                className={
                                                    styles.itemDetailInfo
                                                }
                                                hidden={isOwner}
                                            >
                                                <span>{__('行列')}：</span>
                                                <Tooltip
                                                    title={subViewInfo}
                                                    placement="right"
                                                    color="#fff"
                                                    overlayClassName={
                                                        styles['subview-tip']
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            styles.ruleText
                                                        }
                                                    >
                                                        {__('查看规则权限')}
                                                    </span>
                                                </Tooltip>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {getShareAndOpenType(baseInfoData)}
                            </Space>
                        </div>
                    </div>
                    <div
                        className={styles.contentTabsWrapper}
                        hidden={loading || permisLoading}
                    >
                        <Tabs
                            activeKey={tabActiveKey}
                            onChange={(key: any) => {
                                setTabActiveKey(key)
                            }}
                            tabBarGutter={32}
                            items={detailTabItems}
                            className={classnames(
                                styles.contentTabs,
                                tabActiveKey === detailTabKey.dataPreview &&
                                    styles.dataPreviewTab,
                                hiddenReturn && styles.hiddenReturnTab,
                            )}
                        />
                        {tabActiveKey === detailTabKey.view ? (
                            <div className={styles.viewDetailsWrapper}>
                                <div className={styles.detailFields}>
                                    {/* {delfieldList.length > 0 && (
                                    <div>
                                        <InfoCircleFilled
                                            className={styles.titleIcon}
                                        />
                                        <span>
                                            {__('提示：有')}
                                            {delfieldList.length}
                                            {__('个标记删除的字段。')}
                                        </span>
                                        <span
                                            onClick={() =>
                                                setOpenDelFields(true)
                                            }
                                            className={styles.deltext}
                                        >
                                            {__('查看删除字段')}
                                        </span>
                                    </div>
                                )} */}
                                    {/* <div className={styles.detailFieldsRadio}>
                                    <Radio.Group
                                        onChange={({ target: { value } }) =>
                                            setViewModalRadio(value)
                                        }
                                        value={viewModalRadio}
                                        optionType="button"
                                        buttonStyle="solid"
                                    >
                                        <Tooltip
                                            placement="bottom"
                                            title={__('切换为图表')}
                                        >
                                            <Radio.Button value="table">
                                                <FormTableModelOutlined />
                                            </Radio.Button>
                                        </Tooltip>
                                        <Tooltip
                                            placement="bottom"
                                            title={__('切换为列表')}
                                        >
                                            <Radio.Button value="list">
                                                <FormListModelOutlined />
                                            </Radio.Button>
                                        </Tooltip>
                                    </Radio.Group>
                                </div> */}
                                </div>
                                {/* {viewModalRadio === 'table' ? (
                                <div
                                    className={classnames(
                                        styles.tableBox,
                                        fieldsTableData.length > 9 &&
                                            styles.height,
                                    )}
                                >
                                    <FieldsTable
                                        fieldList={fieldsTableData}
                                        getFieldList={setFieldsTableData}
                                        optionType="view"
                                        datasheetInfo={{
                                            business_name:
                                                detailsData?.business_name,
                                            technical_name:
                                                detailsData?.technical_name,
                                            datasource_type:
                                                detailsData?.datasource_type,
                                            datasource_id:
                                                detailsData?.datasource_id,
                                            view_source_catalog_name:
                                                detailsData?.view_source_catalog_name,
                                        }}
                                        dataViewList={dataList}
                                        ref={fieldsTableRef}
                                        isStart={isGradeOpen}
                                        tagData={tagData}
                                    />
                                </div>
                            ) : (
                                <FieldList
                                    fieldList={fieldsTableData}
                                    currentData={detailsData}
                                    isStart={isGradeOpen}
                                    tagData={tagData}
                                />
                            )} */}
                                <FieldList
                                    fieldList={fieldsTableData}
                                    currentData={detailsData}
                                    isStart={isGradeOpen}
                                    tagData={tagData}
                                    style={{
                                        // margin: '0  0 24px 0',
                                        margin: '0',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: 'calc(100vh - 267px)',
                                    }}
                                    tableScroll={{
                                        y: 'calc(100vh - 300px)',
                                    }}
                                    getContainer={document.getElementById(
                                        'serviceWrap',
                                    )}
                                    isMarket
                                    hiddenFilters
                                />
                            </div>
                        ) : tabActiveKey === detailTabKey.dataPreview ? (
                            <div className={styles.dataPreviewWrapper}>
                                {/* <DataPreview
                                    dataViewId={rescId}
                                    isNeedPermisControl={getIsNeedPermisControl(
                                        microWidgetProps,
                                    )}
                                    isMarket
                                    isOwner={baseInfoData?.owner_id === userId}
                                    // formViewStatus={formViewStatus}
                                /> */}
                                <ReportDetailContent
                                    item={{
                                        ...(baseInfoData || {}),
                                        form_view_id: id,
                                    }}
                                    isMarket
                                    showCorrection={false} // 不显示整改按钮
                                />
                            </div>
                        ) : tabActiveKey === detailTabKey.dataConsanguinity ? (
                            <ConsanguinityGraph id={rescId} />
                        ) : tabActiveKey === detailTabKey.impactAnalysis ? (
                            <ImpactAnalysis id={rescId} />
                        ) : null}

                        {/* {openDelFields && (
                        <DelFieldsModal
                            fieldData={delfieldList}
                            onClose={() => setOpenDelFields(false)}
                            open={openDelFields}
                            sum={delfieldList.length}
                        />
                    )} */}
                    </div>
                </div>
                {downloadOpen && (
                    <DataDownloadConfig
                        formViewId={rescId}
                        open={downloadOpen}
                        onClose={() => {
                            setDownloadOpen(false)
                        }}
                        isFullScreen
                    />
                )}

                {/* 权限申请 */}
                {accessOpen && (
                    <AccessModal
                        id={rescId}
                        type={AssetTypeEnum.DataView}
                        onClose={(needRefresh) => {
                            setAccessOpen(false)
                            if (needRefresh) {
                                refreshPolicy()
                                getDetails()
                            }
                        }}
                    />
                )}
                {/* 权限申请 */}
                {permissionRequestOpen && (
                    <ApplyPolicy
                        id={rescId}
                        onClose={(needRefresh: boolean) => {
                            setPermissionRequestOpen(false)
                            // if (needRefresh) {
                            //     refreshAuditProcess()
                            // }
                        }}
                        type={AssetTypeEnum.DataView as string}
                    />
                )}
                {interfaceDetailOpen && selInterface?.service_id && (
                    <ApplicationServiceDetail
                        open={interfaceDetailOpen}
                        onClose={() => {
                            setInterfaceDetailOpen(false)
                        }}
                        serviceCode={selInterface?.service_id}
                        isIntroduced
                        showShadow={false}
                        style={{
                            position: 'fixed',
                            width: '100vw',
                            height: '100vh',
                            top: '52px',
                            borderTop: '1px solid rgb(0 0 0 / 10%)',
                            color: '#123456,',
                            zIndex: '1001',
                        }}
                        hasAsst={hasAsst}
                    />
                )}
            </CustomDrawer>
        </DataViewProvider>
    )
}

export default LogicViewDetail
