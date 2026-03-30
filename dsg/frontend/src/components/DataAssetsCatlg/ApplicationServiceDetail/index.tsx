import React, { useState, useEffect, useRef, useMemo, useContext } from 'react'
import classnames from 'classnames'
import {
    Anchor,
    Col,
    Row,
    Space,
    Table,
    Button,
    message,
    Divider,
    Tooltip,
} from 'antd'
import Icon, { LeftOutlined } from '@ant-design/icons'
import { noop } from 'lodash'
import moment from 'moment'
import { useUnmount } from 'ahooks'
import { InterfaceColored, FontIcon } from '@/icons'
import {
    AssetTypeEnum,
    HasAccess,
    OnlineStatus,
    PolicyActionEnum,
    PublishStatus,
    detailFrontendServiceOverview,
    formatError,
    isMicroWidget,
    policyValidate,
    getSubServices,
    ResType,
    downloadApiDoc,
} from '@/core'
import { ReactComponent as icon1 } from '@/assets/DataAssetsCatlg/icon1.svg'
import __ from '../locale'
import styles from './styles.module.less'
import JSONCodeView from '@/ui/JSONCodeView'
import { TextAreaView } from '@/components/AutoFormView/baseViewComponents'
import CustomDrawer from '@/components/CustomDrawer'
import ApplyApplication from '../ApplicationService/ApplyApplication'
import AuthInfo from '@/components/MyAssets/AuthInfo'
import { serviceTypeList } from '@/components/ApiServices/const'
import {
    getRequestParamExample,
    itemOtherInfo,
    ActionText,
    publishStatus,
    onlineStatus,
    getDisabledTooltip,
} from './helper'
import { useCongSearchContext } from '@/components/CognitiveSearch/CogSearchProvider'
import { Loader } from '@/ui'
import { useAuditProcess } from '@/hooks/useAuditProcess'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { CogAParamsType, MicroWidgetPropsContext } from '@/context'
import { getActualUrl, getInnerUrl, streamToFile } from '@/utils'
import { viewCardBaiscInfoList } from '../LogicViewDetail/helper'
import {
    DataRescType,
    OfflineStatusList,
    UnpublishedStatusList,
    getPublishStatus,
} from '../ApplicationService/helper'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import AccessModal from '@/components/AccessPolicy/AccessModal'
import { IconType } from '@/icons/const'
import { BizType, PolicyType } from '@/components/AuditPolicy/const'
import ApplyPolicy from '@/components/AccessPolicy/ApplyPolicy'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import CityShareOperation from '../CityShareOperation'
import CitySharingDrawer from '@/components/CitySharing/CitySharingDrawer'
import OwnerDisplay from '@/components/OwnerDisplay'
import PermisApplyBtn from '../DataResc/PermisApplyBtn'
import { usePolicyCheck } from '@/hooks/usePolicyCheck'
import FavoriteOperation, {
    UpdateFavoriteParams,
} from '@/components/FavoriteResMode/FavoriteOperation'
import FeedbackOperation from '@/components/FeedbackResMode/operate/FeedbackOperation'
import ExampleCode from './ExampleCode'

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

interface IApplicationServiceDetail {
    open: boolean
    onClose: (flag?: boolean) => void
    serviceCode: string
    isIntroduced?: boolean
    isFromAuth?: boolean
    // 是否拥有此数据资源的权限
    hasPermission?: boolean
    returnInDrawer?: () => void
    getContainer?: HTMLElement | false
    showShadow?: boolean
    style?: React.CSSProperties | undefined
    // 是否显示详情需要原有按钮
    isNeedComExistBtns?: boolean
    extraBtns?: React.ReactNode
    canChat?: boolean // 是否可以问答
    hasAsst?: boolean // 是否有认知助手
    // 添加收藏
    onAddFavorite?: ({ is_favored, favor_id }: UpdateFavoriteParams) => void
    // 取消收藏
    onCancelFavorite?: ({ is_favored, favor_id }: UpdateFavoriteParams) => void
}

const ApplicationServiceDetail = ({
    open,
    onClose,
    serviceCode,
    hasPermission = false,
    isIntroduced,
    isFromAuth,
    returnInDrawer = noop,
    getContainer = false,
    showShadow = true,
    style,
    isNeedComExistBtns = true,
    extraBtns,
    canChat = false,
    hasAsst = false,
    onAddFavorite = noop,
    onCancelFavorite = noop,
}: IApplicationServiceDetail) => {
    const { bigHeader } = useCongSearchContext()
    const [userId] = useCurrentUser('ID')
    const [{ using, cssjj }] = useGeneralConfig()

    const [loading, setLoading] = useState(true)
    // 授权
    const [accessOpen, setAccessOpen] = useState<boolean>(false)
    const [applicationInfo, setApplicationInfo] = useState<any>(null)
    const [applicationOperationInfo, setApplicationOperationInfo] =
        useState<any>({})
    const [applyCatalog, setApplyCatalog] = useState<any>()
    const [targetOffset, setTargetOffset] = useState<number>(0)
    const container = useRef<any>(null)
    const header = useRef<any>(null)
    const { Link } = Anchor
    const [authInfoOpen, setAuthInfoOpen] = useState<boolean>(false)
    const [applyOpen, setApplyOpen] = useState<boolean>(false)
    const [isApply, setIsApply] = useState<boolean>(false)
    // 是否允许调用
    const [allowRead, setAllowRead] = useState<boolean>(false)
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [subServiceAccess, setSubServiceAccess] = useState<any>()
    const [subServices, setSubServices] = useState<any[]>()

    const [usedEgOpen, setUsedEgOpen] = useState<boolean>(false)

    // const [hasAuditProcess, refreshAuditProcess] = useAuditProcess({
    //     audit_type: PolicyType.AssetPermission,
    //     service_type: BizType.AuthService,
    // })

    const [isAppDeveloper, setIsAppDeveloper] = useState<boolean>(false)
    const { checkPermission, checkPermissions } = useUserPermCtx()

    const appDeveloper = useMemo(
        () => checkPermission('manageIntegrationApplication'),
        [checkPermission],
    )

    // 授权申请
    const [permissionRequestOpen, setPermissionRequestOpen] =
        useState<boolean>(false)

    // useCogAsstContext 已移除，相关功能已下线
    const [wholeAccess, setWholeAccess] = useState<string>('')
    const { allowedActions, checkBatchPolicy, refreshPolicy } = usePolicyCheck(
        serviceCode,
        AssetTypeEnum.Api,
        {
            toast: microWidgetProps?.components?.toast,
        },
    )

    const columns = [
        {
            title: __('英文名称'),
            dataIndex: 'en_name',
            key: 'en_name',
            render: (text) => (
                <div className={styles.tableTrContainer} title={text || ''}>
                    <div className={styles.itemTitle}>{text || '--'}</div>
                </div>
            ),
            width: '15%',
        },
        {
            title: __('中文名称'),
            dataIndex: 'cn_name',
            key: 'cn_name',
            width: '25%',
            render: (text) => (
                <div className={styles.tableTrContainer} title={text || ''}>
                    <div className={styles.itemTitle}>{text || '--'}</div>
                </div>
            ),
        },
        {
            title: __('类型'),
            dataIndex: 'data_type',
            key: 'data_type',
            width: '10%',
            render: (text) => text || '--',
        },
        {
            title: __('是否必填'),
            dataIndex: 'required',
            key: 'required',
            width: '10%',
            render: (text) =>
                text === 'yes' ? '必填' : text === 'no' ? '非必填' : '--',
        },
        {
            title: __('描述'),
            dataIndex: 'description',
            key: 'description',
            width: '40%',
            render: (text) => text || '--',
        },
    ]

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
        if (open && serviceCode) {
            initApplicationInfo()
            // checkReadPermission(serviceCode)
        }
    }, [serviceCode, open])

    useUnmount(() => {
        // useCogAsstContext 已移除
    })

    // 对应资源模式下，发布状态或上线状态
    const isPubOrOnline = useMemo(() => {
        const { service_info } = applicationInfo || {}
        const rescOwnerId = service_info?.owner_id

        const status =
            // (using === 1 &&
            publishStatus.includes(service_info?.publish_status) ||
            // )
            // (using === 2 &&
            onlineStatus.includes(service_info?.status)
        // )

        if (status) {
            // 当前用户为资源owner或被授予权限，则可下载
            if (rescOwnerId && rescOwnerId === userId) {
                setAllowRead(true)
            }
        }
        return status
    }, [applicationInfo])

    // 是否拥有数据运营工程师
    const hasDataOperRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermissions])

    // 发布状态
    const publishedStatus = useMemo(() => {
        const status = getPublishStatus(
            applicationInfo?.service_info?.publish_status,
        )
        return status ? __('（') + status + __('）') : ''
    }, [applicationInfo])

    // 仅服务超市、认知搜索、首页、我的、资产全景
    const isShowRequestPath = [
        '/data-assets',
        '/cognitive-search',
        '/asset-center',
        '/my-assets',
        '/asset-view/architecture',
    ].includes(getInnerUrl(window.location.pathname))

    /**
     * 查询接口权限
     * @param _id
     */
    const getSubServicePermission = async (_id: string) => {
        if (!_id) return
        try {
            const subServiceResult = await getSubServices({
                limit: 1000,
                offset: 1,
                service_id: _id,
            })

            const subItems = (subServiceResult?.entries || []).map((o) => ({
                id: o.id,
                name: o.name,
                detail: JSON.parse(o.detail || '{}'),
            }))

            setSubServices(subItems)

            // 仅非owner查询子视图权限 且子视图数量大于0
            if (!isOwner && subItems?.length > 0) {
                const subParams = subItems.map((o) => ({
                    id: o.id,
                    type: AssetTypeEnum.SubService,
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
                setSubServiceAccess(groupById)
            }
        } catch (error) {
            formatError(error)
        }
    }

    // 具备授权权限
    const canAuth = useMemo(() => {
        return (
            [PolicyActionEnum.Allocate, PolicyActionEnum.Auth].some((o) =>
                (allowedActions || []).includes(o),
            ) || applicationInfo?.service_info?.can_auth
        )
    }, [allowedActions, applicationInfo?.service_info?.can_auth])

    const isOwner = useMemo(() => {
        return applicationInfo?.service_info?.owners?.some(
            (owner) => owner.owner_id === userId,
        )
    }, [applicationInfo, userId])

    useEffect(() => {
        if (!isOwner && applicationInfo && open) {
            getSubServicePermission(serviceCode)
        }
    }, [isOwner, applicationInfo, open, serviceCode])

    useEffect(() => {
        if (isOwner) {
            const accessText = [__('读取'), __('授权')].join('/')
            setAllowRead(true)
            setWholeAccess(accessText)
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

            if (allowedActions?.includes(PolicyActionEnum.Read)) {
                setAllowRead(true)
            }

            const accessText = allowActions.join('/') || ''
            setWholeAccess(accessText)
        }
    }, [isOwner, allowedActions])

    const initApplicationInfo = async () => {
        if (serviceCode) {
            try {
                setLoading(true)
                const data = await detailFrontendServiceOverview(serviceCode)
                setApplicationInfo(data)
                setApplicationOperationInfo({
                    ...data?.service_info,
                    code: data?.service_info?.service_code,
                    id: data?.service_info?.service_id,
                    name: data?.service_info?.service_name,
                    online_status: data?.service_info?.status,
                    type: 'interface_svc',
                })
            } catch (error) {
                switch (true) {
                    case error?.data?.code ===
                        'DataApplicationService.Service.ServiceOffline':
                        message.error('当前接口已下线')
                        onClose(isApply)
                        break
                    case error?.data?.code ===
                        'DataApplicationService.Service.ServiceCodeNotExist':
                        message.error('当前接口不存在')
                        onClose(isApply)
                        break
                    default:
                        formatError(error, microWidgetProps?.components?.toast)
                }
                onClose()
            } finally {
                setLoading(false)
            }
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

    const showToolTip = (
        title: any,
        toolTipTitle: any,
        value: any,
        toolTipContent?: any,
    ) => {
        return (
            <Tooltip
                title={
                    title ? (
                        <div className={styles.unitTooltip}>
                            <div>{toolTipTitle}</div>
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: toolTipContent || value || '--',
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

    const subServiceInfo = useMemo(() => {
        const subServiceItems: any = Object.keys(subServiceAccess || {}).reduce(
            (prev: any[], cur) => {
                const sub = subServices?.find((o) => o.id === cur)
                const item = {
                    id: sub.id,
                    name: sub.name,
                    access: (subServiceAccess[cur] || [])
                        .map((o) => ActionText[o])
                        .join('/'),
                }
                return [...prev, item]
            },
            [],
        )

        return (
            <div className={styles.subServiceList}>
                {(subServiceItems || []).map((o) => (
                    <div className={styles.subServiceItem} key={o.id}>
                        <div
                            className={styles.subServiceName}
                            title={o.name || '--'}
                        >
                            <span>{__('规则')}：</span> {o.name || '--'}
                        </div>
                        <div
                            className={styles.subServiceAccess}
                            title={o.access || '--'}
                        >
                            <span>{__('权限')}：</span> {o.access || '--'}
                        </div>
                    </div>
                ))}
                <div
                    className={styles.subServiceItem}
                    hidden={subServiceItems?.length}
                >
                    <div className={styles.subServiceName}>
                        {__('暂无规则权限')}
                    </div>
                </div>
            </div>
        )
    }, [subServiceAccess, subServices])

    // render
    const renderOtherInfo = (item: any, data: any) => {
        const { firstKey, infoKey, type, title, toolTipTitle } = item
        let showContent = data?.[firstKey]?.[infoKey] || ''
        if (infoKey === 'department') {
            const fullPath =
                applicationInfo?.service_info?.department.name || '--'
            const departmentName =
                applicationInfo?.service_info?.department.name?.split('/') || []
            showContent = departmentName?.slice(-1)?.[0] || '--'
            return showToolTip(title, toolTipTitle, showContent, fullPath)
        }
        if (infoKey === 'subject_domain_name') {
            const fullPath = showContent || '--'
            const domainName = showContent?.split('/') || []
            showContent = domainName?.slice(-1)?.[0] || '--'
            return showToolTip(title, toolTipTitle, showContent, fullPath)
        }
        if (infoKey === 'online_time') {
            showContent = `${moment(showContent).format('YYYY-MM-DD')}`
            return (
                <>
                    <div
                        style={{
                            flexShrink: 0,
                        }}
                    >
                        {`${__('上线于')} ${showContent}`}
                    </div>
                    {showDivder()}
                </>
            )
        }

        if (infoKey === 'access') {
            return showToolTip(
                title,
                toolTipTitle,
                wholeAccess || __('暂无权限'),
            )
        }

        if (infoKey === 'owners') {
            return (
                <div className={styles.itemDetailInfo} key={title}>
                    <span>{title}</span>
                    <OwnerDisplay
                        value={applicationInfo?.service_info?.owners}
                    />
                </div>
            )
        }

        return showToolTip(title, toolTipTitle, showContent)
    }

    // 收藏
    const handleAddFavorite = ({
        is_favored,
        favor_id,
    }: UpdateFavoriteParams) => {
        setApplicationInfo({
            ...applicationInfo,
            service_info: {
                ...applicationInfo?.service_info,
                is_favored,
                favor_id,
            },
        })
        onAddFavorite({ is_favored, favor_id })
    }

    /** 取消收藏 */
    const handleCancelFavorite = ({
        is_favored,
        favor_id,
    }: UpdateFavoriteParams) => {
        setApplicationInfo({
            ...applicationInfo,
            service_info: {
                ...applicationInfo?.service_info,
                is_favored,
                favor_id,
            },
        })
        onCancelFavorite({ is_favored, favor_id })
    }

    /**
     * 下载API文档
     * @returns void
     */

    const apiDocDownload = async () => {
        try {
            if (!serviceCode) return
            const res = await downloadApiDoc({
                service_ids: [serviceCode],
            })

            // 从响应头中提取文件名
            const contentDisposition = res.headers?.['content-disposition']
            let fileName = 'api-doc.pdf' // 默认文件名

            if (contentDisposition) {
                // 解析 filename*=utf-8''encoded-filename 或 filename="filename" 格式
                const filenameStarMatch = contentDisposition.match(
                    /filename\*=utf-8''(.+)/i,
                )
                if (filenameStarMatch) {
                    fileName = decodeURIComponent(filenameStarMatch[1])
                } else {
                    const filenameMatch =
                        contentDisposition.match(/filename="?([^"]+)"?/i)
                    if (filenameMatch?.[1]) {
                        fileName = filenameMatch?.[1]
                    }
                }
            }

            streamToFile(res.data, fileName)
        } catch (err) {
            formatError(err)
        }
    }

    return (
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
            customHeaderStyle={{ display: 'none' }}
            customBodyStyle={{ height: '100%', position: 'relative' }}
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
                          borderTop: '1px solid rgb(0 0 0 / 10%)',
                      })
            }
            getContainer={getContainer}
        >
            <div className={styles.bodyContainer}>
                {showShadow && (
                    <div hidden={loading} className={styles.bodyShadow} />
                )}
                <div className={styles.applicationDetail}>
                    {loading && (
                        <div className={styles.detailLoading}>
                            <Loader />
                        </div>
                    )}
                    <div
                        className={styles.header}
                        ref={header}
                        hidden={loading}
                    >
                        <div
                            onClick={() => {
                                returnInDrawer()
                                onClose(isApply)
                            }}
                            className={styles.returnInfo}
                        >
                            <LeftOutlined className={styles.returnArrow} />
                        </div>
                        <div
                            className={classnames({
                                [styles.headerContent]: true,
                                [styles.isAuth]: isFromAuth,
                            })}
                        >
                            <Space
                                direction="vertical"
                                wrap={false}
                                style={{ width: '100%' }}
                            >
                                <div className={styles.headerBox}>
                                    <div className={styles.rescIcon}>
                                        <InterfaceColored />
                                    </div>
                                    <div className={styles.rescTopInfoWrapper}>
                                        <div
                                            className={styles.applicationName}
                                            title={
                                                applicationInfo?.service_info
                                                    ?.service_name
                                            }
                                        >
                                            <div className={styles.serviceType}>
                                                {serviceTypeList.find(
                                                    (item) =>
                                                        item.value ===
                                                        applicationInfo
                                                            ?.service_info
                                                            ?.service_type,
                                                )?.label || '--'}
                                            </div>
                                            <span
                                                className={styles.nameWrapper}
                                            >
                                                <span
                                                    className={styles.nameArea}
                                                    title={
                                                        applicationInfo
                                                            ?.service_info
                                                            ?.service_name || ''
                                                    }
                                                >
                                                    {applicationInfo
                                                        ?.service_info
                                                        ?.service_name || '--'}
                                                </span>
                                                {hasDataOperRole &&
                                                    (UnpublishedStatusList?.includes(
                                                        applicationInfo
                                                            ?.service_info
                                                            ?.publish_status,
                                                    ) ||
                                                        OfflineStatusList?.includes(
                                                            applicationInfo
                                                                ?.service_info
                                                                ?.status,
                                                        )) && (
                                                        <div
                                                            className={
                                                                styles.publishState
                                                            }
                                                        >
                                                            {UnpublishedStatusList?.includes(
                                                                applicationInfo
                                                                    ?.service_info
                                                                    ?.publish_status,
                                                            )
                                                                ? __('未发布') +
                                                                  publishedStatus
                                                                : __('未上线')}
                                                        </div>
                                                    )}
                                            </span>
                                        </div>
                                        <div
                                            className={
                                                styles.rescCodeInfoWrapper
                                            }
                                        >
                                            {__('编码：')}
                                            <span>
                                                {applicationInfo?.service_info
                                                    ?.service_code || '--'}
                                            </span>
                                        </div>
                                    </div>
                                    {/* {applicationInfo?.service_apply && ( */}
                                    <div className={styles.nameBtn}>
                                        {extraBtns}
                                        {isNeedComExistBtns && (
                                            <>
                                                {/* <Button
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        window.open(
                                                            getActualUrl(
                                                                `/datasheet-view?serviceCode=${serviceCode}`,
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
                                                    className={
                                                        styles.itemOprBtn
                                                    }
                                                >
                                                    {__('跳转后台')}
                                                </Button> */}
                                                {/* 申请共享 */}
                                                {isPubOrOnline &&
                                                    applicationInfo
                                                        ?.service_info
                                                        .service_type ===
                                                        'service_register' &&
                                                    cssjj && (
                                                        <CityShareOperation
                                                            catalog={
                                                                applicationOperationInfo
                                                            }
                                                            className={
                                                                styles.itemOprIcon
                                                            }
                                                            disabledClassName={
                                                                styles.itemOprDiabled
                                                            }
                                                            showClassName={
                                                                styles.itemOprIconVisible
                                                            }
                                                            onApply={(
                                                                value,
                                                            ) => {
                                                                setApplyCatalog(
                                                                    value,
                                                                )
                                                            }}
                                                            type="button"
                                                        />
                                                    )}
                                                {/* {hasAuditProcess &&
                                                    using === 2 &&
                                                    !isOwner &&
                                                    appDeveloper &&
                                                    (isShowRequestPath ||
                                                        isMicroWidget({
                                                            microWidgetProps,
                                                        })) && (
                                                        <Tooltip
                                                            overlayClassName={
                                                                styles.toolTipWrapper
                                                            }
                                                            placement="bottomRight"
                                                            title={__(
                                                                '为集成应用申请权限',
                                                            )}
                                                        >
                                                            <Button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    setPermissionRequestOpen(
                                                                        true,
                                                                    )
                                                                    e.preventDefault()
                                                                    e.stopPropagation()
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
                                                            >
                                                                {__('权限申请')}
                                                            </Button>
                                                        </Tooltip>
                                                    )} */}
                                                <PermisApplyBtn
                                                    id={serviceCode}
                                                    type={
                                                        DataRescType.INTERFACE
                                                    }
                                                    isOnline={onlineStatus.includes(
                                                        applicationInfo
                                                            ?.service_info
                                                            ?.status,
                                                    )}
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
                                                {(isOwner || canAuth) &&
                                                    isPubOrOnline &&
                                                    using === 2 &&
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
                                                                {__('资源授权')}
                                                            </Button>
                                                        </Tooltip>
                                                    )}
                                                {isPubOrOnline && (
                                                    <FeedbackOperation
                                                        type="button"
                                                        item={{
                                                            ...applicationInfo?.service_info,
                                                            id: serviceCode,
                                                        }}
                                                        resType={
                                                            ResType.InterfaceSvc
                                                        }
                                                        // disabled={
                                                        //     !isPubOrOnline
                                                        // }
                                                        disabledTooltip={getDisabledTooltip(
                                                            {
                                                                applicationInfo,
                                                                action: 'feedback',
                                                            },
                                                        )}
                                                        className={
                                                            styles.itemOprIcon
                                                        }
                                                    />
                                                )}
                                                {isPubOrOnline && (
                                                    <FavoriteOperation
                                                        type="button"
                                                        item={{
                                                            ...applicationInfo?.service_info,
                                                            id: serviceCode,
                                                        }}
                                                        className={
                                                            styles.itemOprIcon
                                                        }
                                                        resType={
                                                            ResType.InterfaceSvc
                                                        }
                                                        // disabled={
                                                        //     !isPubOrOnline
                                                        // }
                                                        disabledTooltip={getDisabledTooltip(
                                                            {
                                                                applicationInfo,
                                                                action: 'favorite',
                                                            },
                                                        )}
                                                        onAddFavorite={
                                                            handleAddFavorite
                                                        }
                                                        onCancelFavorite={
                                                            handleCancelFavorite
                                                        }
                                                    />
                                                )}

                                                <Tooltip
                                                    title={__('下载文档')}
                                                    overlayClassName={
                                                        styles.toolTipWrapper
                                                    }
                                                    placement="bottomRight"
                                                >
                                                    <Button
                                                        onClick={(e) => {
                                                            // 下载文档
                                                            apiDocDownload()
                                                        }}
                                                        icon={
                                                            <FontIcon
                                                                name="icon-xiazai"
                                                                style={{
                                                                    marginRight: 4,
                                                                }}
                                                            />
                                                        }
                                                        className={
                                                            styles.itemOprBtn
                                                        }
                                                    >
                                                        {__('下载文档')}
                                                    </Button>
                                                </Tooltip>
                                                {/* {isPubOrOnline
                                                    ? allowRead && (
                                                          <Tooltip
                                                              title={
                                                                  allowRead
                                                                      ? __(
                                                                            '调用信息',
                                                                        )
                                                                      : __(
                                                                            '无调用权限，请联系数据Owner进行授权',
                                                                        )
                                                              }
                                                              overlayClassName={
                                                                  styles.toolTipWrapper
                                                              }
                                                              placement="bottomRight"
                                                              getPopupContainer={(
                                                                  n,
                                                              ) => n}
                                                          >
                                                              <Button
                                                                  onClick={(
                                                                      e,
                                                                  ) => {
                                                                      e.preventDefault()
                                                                      e.stopPropagation()
                                                                      setAuthInfoOpen(
                                                                          true,
                                                                      )
                                                                  }}
                                                                  icon={
                                                                      <InterfaceOutlined
                                                                          className={
                                                                              styles.itemOprIcon
                                                                          }
                                                                      />
                                                                  }
                                                                  disabled={
                                                                      !allowRead
                                                                  }
                                                                  className={
                                                                      styles.itemOprBtn
                                                                  }
                                                              >
                                                                  {__(
                                                                      '调用信息',
                                                                  )}
                                                              </Button>
                                                          </Tooltip>
                                                      )
                                                    : undefined} */}

                                                {/* {canChat &&
                                                    using === 2 &&
                                                    allowRead &&
                                                    onlineStatus.includes(
                                                        applicationInfo
                                                            ?.service_info
                                                            .status,
                                                    ) && (
                                                        <Tooltip
                                                            title={
                                                                llm
                                                                    ? __(
                                                                          '有读取数据的能力，可提问',
                                                                      )
                                                                    : __(
                                                                          '认知助手服务不可用',
                                                                      )
                                                            }
                                                            placement="bottom"
                                                        >
                                                            <Button
                                                                disabled={!llm}
                                                                className={
                                                                    styles.itemOprBtn
                                                                }
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault()
                                                                    e.stopPropagation()
                                                                    updateParams(
                                                                        CogAParamsType.Resource,
                                                                        {
                                                                            data: [
                                                                                {
                                                                                    id: applicationInfo
                                                                                        ?.service_info
                                                                                        ?.service_id,
                                                                                    name: applicationInfo
                                                                                        ?.service_info
                                                                                        ?.service_name,
                                                                                    type: 'interface_svc',
                                                                                },
                                                                            ],
                                                                            op: 'add',
                                                                            event: e,
                                                                        },
                                                                    )
                                                                    onOpenAssistant(
                                                                        true,
                                                                    )
                                                                }}
                                                            >
                                                                <img
                                                                    src={
                                                                        qaColored
                                                                    }
                                                                    alt=""
                                                                    width="16px"
                                                                    draggable={
                                                                        false
                                                                    }
                                                                    style={{
                                                                        marginRight: 8,
                                                                    }}
                                                                />
                                                                {__('提问')}
                                                            </Button>
                                                        </Tooltip>
                                                    )} */}

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
                                                                title={__(
                                                                    '关闭',
                                                                )}
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
                                                {/* {applicationInfo?.service_apply
                                                    ?.audit_status ===
                                                    'auditing' && (
                                                    <div>
                                                        <InfoCircleFilled
                                                            className={
                                                                styles.nameBtnIcon
                                                            }
                                                        />
                                                        {__('接口申请审核中')}
                                                    </div>
                                                )} */}
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.descriptionWrapper}>
                                    <span className={styles.textTitle}>
                                        {__('描述：')}
                                    </span>
                                    <div className={styles.descContent}>
                                        <TextAreaView
                                            initValue={
                                                applicationInfo?.service_info
                                                    ?.description ||
                                                __('[暂无说明]')
                                            }
                                            rows={1}
                                            placement="end"
                                            onExpand={() => {
                                                // if (
                                                //     header.current?.clientHeight
                                                // ) {
                                                //     setTargetOffset(
                                                //         Number(
                                                //             header.current
                                                //                 .clientHeight,
                                                //         ) + 80,
                                                //     )
                                                // }
                                            }}
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
                                            applicationInfo?.service_info?.[
                                                using === 1
                                                    ? 'publish_time'
                                                    : 'online_time'
                                            ]?.substring?.(0, 10) || '--'
                                        }`}
                                    </div>
                                    {showDivder()}
                                    <div className={styles.iconLabel}>
                                        {itemOtherInfo.map((oItem) => {
                                            return renderOtherInfo(
                                                oItem,
                                                applicationInfo,
                                            )
                                        })}
                                        {/* <div
                                            className={styles.itemDetailInfo}
                                            hidden={isOwner}
                                        >
                                            <span>{__('限定')}：</span>
                                            <Tooltip
                                                title={subServiceInfo}
                                                placement="right"
                                                color="#fff"
                                                overlayClassName={
                                                    styles['subService-tip']
                                                }
                                            >
                                                <span
                                                    className={styles.ruleText}
                                                >
                                                    {__('查看规则权限')}
                                                </span>
                                            </Tooltip>
                                        </div> */}
                                    </div>
                                </div>
                            </Space>
                        </div>
                    </div>
                    <div
                        className={styles.content}
                        ref={container}
                        hidden={loading}
                    >
                        <div className={styles.contentContainer}>
                            <div className={styles.contentWrapper}>
                                <div id="basic-info">
                                    <TitleBar title={__('基本信息')} />
                                    <div className={styles.basicContent}>
                                        <Space
                                            direction="vertical"
                                            wrap={false}
                                            style={{ width: '100%' }}
                                        >
                                            <Row gutter={16}>
                                                <Col
                                                    span={12}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <span
                                                        className={styles.label}
                                                    >
                                                        {__('接口编号：')}
                                                    </span>
                                                    <div
                                                        className={
                                                            styles.nameWrapper
                                                        }
                                                    >
                                                        <div>
                                                            {applicationInfo
                                                                ?.service_info
                                                                ?.service_code ||
                                                                '--'}
                                                        </div>
                                                    </div>
                                                </Col>
                                                {/* <Col
                                                span={12}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <span className={styles.label}>
                                                    {__('服务分类：')}
                                                </span>
                                                <span
                                                    className={styles.name}
                                                    title={
                                                        applicationInfo
                                                            ?.service_info
                                                            ?.category?.name ||
                                                        ''
                                                    }
                                                >
                                                    {applicationInfo
                                                        ?.service_info?.category
                                                        ?.name || '--'}
                                                </span>
                                            </Col> */}
                                                <Col span={12}>
                                                    <span
                                                        className={styles.label}
                                                    >
                                                        {__('调用频率：')}
                                                    </span>
                                                    <span>
                                                        {applicationInfo
                                                            ?.service_info
                                                            ?.rate_limiting ===
                                                        0
                                                            ? __('不限制')
                                                            : __(
                                                                  '${count} 秒/次',
                                                                  {
                                                                      count: applicationInfo?.service_info?.rate_limiting.toString(),
                                                                  },
                                                              )}
                                                    </span>
                                                </Col>
                                            </Row>
                                            <Row gutter={16}>
                                                <Col span={12}>
                                                    <span
                                                        className={styles.label}
                                                    >
                                                        {__('超时时间：')}
                                                    </span>
                                                    <span>
                                                        {`${
                                                            applicationInfo
                                                                ?.service_info
                                                                ?.timeout ||
                                                            '--'
                                                        } ${__('秒')}`}
                                                    </span>
                                                </Col>
                                                <Col span={12}>
                                                    <span
                                                        className={styles.label}
                                                    >
                                                        {__('所属部门')}：
                                                    </span>
                                                    <span
                                                        className={styles.name}
                                                        title={
                                                            applicationInfo
                                                                ?.service_info
                                                                ?.department
                                                                .name || ''
                                                        }
                                                    >
                                                        {applicationInfo
                                                            ?.service_info
                                                            ?.department.name ||
                                                            '--'}
                                                    </span>
                                                </Col>
                                            </Row>
                                            <Row gutter={16}>
                                                {/* <Col
                                                    span={12}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <span
                                                        className={styles.label}
                                                    >
                                                        {__('数据Owner')}：
                                                    </span>
                                                    <span
                                                        className={styles.name}
                                                    >
                                                        <OwnerDisplay
                                                            value={
                                                                applicationInfo
                                                                    ?.service_info
                                                                    ?.owners
                                                            }
                                                        />
                                                    </span>
                                                </Col> */}
                                                <Col
                                                    span={12}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <span
                                                        className={styles.label}
                                                    >
                                                        {__('更新时间：')}
                                                    </span>
                                                    <span
                                                        className={styles.name}
                                                        title={
                                                            applicationInfo
                                                                ?.service_info
                                                                ?.update_time ||
                                                            ''
                                                        }
                                                    >
                                                        {applicationInfo
                                                            ?.service_info
                                                            ?.update_time ||
                                                            '--'}
                                                    </span>
                                                </Col>
                                            </Row>
                                        </Space>
                                    </div>
                                </div>
                                <div id="param-info">
                                    <TitleBar title={__('参数信息')} />
                                    <div className={styles.paramBasicInfo}>
                                        <Space
                                            direction="vertical"
                                            wrap={false}
                                            style={{ width: '100%' }}
                                        >
                                            <div
                                                id="param-info-address"
                                                className={styles.address}
                                                title={`${applicationInfo?.service_info?.gateway_url}${applicationInfo?.service_info?.service_path}`}
                                            >
                                                <span className={styles.label}>
                                                    {__('接口地址：')}
                                                </span>
                                                <span className={styles.text}>
                                                    {!applicationInfo
                                                        ?.service_info
                                                        ?.gateway_url &&
                                                    !applicationInfo
                                                        ?.service_info
                                                        ?.service_path
                                                        ? '--'
                                                        : `${applicationInfo?.service_info?.gateway_url}${applicationInfo?.service_info?.service_path}`}
                                                </span>
                                            </div>
                                            <div id="param-info-protocol">
                                                <span className={styles.label}>
                                                    {__('接口协议：')}
                                                </span>
                                                <span>
                                                    {applicationInfo?.service_info?.protocol.toLocaleUpperCase() ||
                                                        '--'}
                                                </span>
                                            </div>
                                            <div id="param-info-method">
                                                <span className={styles.label}>
                                                    {__('请求方式：')}
                                                </span>
                                                <span>
                                                    {applicationInfo?.service_info?.http_method?.toLocaleUpperCase() ||
                                                        '--'}
                                                </span>
                                            </div>
                                            <div id="param-info-return">
                                                <span className={styles.label}>
                                                    {__('返回类型：')}
                                                </span>
                                                <span>
                                                    {applicationInfo?.service_info?.return_type?.toLocaleUpperCase() ||
                                                        '--'}
                                                </span>
                                            </div>
                                        </Space>
                                    </div>
                                    {applicationInfo?.service_param
                                        ?.data_table_request_params?.length ? (
                                        <div
                                            className={styles.paramsContent}
                                            id="param-info-request"
                                        >
                                            <div className={styles.title}>
                                                {__('请求参数')}
                                            </div>
                                            <div className={styles.table}>
                                                <Table
                                                    columns={columns}
                                                    dataSource={
                                                        applicationInfo
                                                            .service_param
                                                            .data_table_request_params
                                                    }
                                                    pagination={false}
                                                />
                                            </div>
                                        </div>
                                    ) : null}

                                    {applicationInfo?.service_test
                                        ?.request_example && (
                                        <div
                                            className={styles.paramsContent}
                                            id="param-info-request-example"
                                        >
                                            <div className={styles.title}>
                                                {__('请求示例')}
                                            </div>
                                            {getRequestParamExample(
                                                applicationInfo?.service_info
                                                    ?.http_method,
                                                applicationInfo,
                                            )}
                                        </div>
                                    )}
                                    {applicationInfo?.service_param
                                        ?.data_table_response_params?.length ? (
                                        <div
                                            className={styles.paramsContent}
                                            id="param-info-response"
                                        >
                                            <div className={styles.title}>
                                                {__('返回参数')}
                                            </div>
                                            <div className={styles.table}>
                                                <Table
                                                    columns={columns.filter(
                                                        (currentData) =>
                                                            currentData.key !==
                                                            'required',
                                                    )}
                                                    dataSource={
                                                        applicationInfo
                                                            .service_param
                                                            .data_table_response_params
                                                    }
                                                    pagination={false}
                                                />
                                            </div>
                                        </div>
                                    ) : null}

                                    {applicationInfo?.service_test
                                        ?.response_example ? (
                                        <div
                                            className={styles.paramsContent}
                                            id="param-info-response-example"
                                        >
                                            <div className={styles.title}>
                                                {__('返回示例')}
                                            </div>
                                            <JSONCodeView
                                                code={
                                                    applicationInfo
                                                        ?.service_test
                                                        ?.response_example
                                                }
                                                className={styles.codeBox}
                                            />
                                        </div>
                                    ) : null}
                                </div>

                                {!usedEgOpen && (
                                    <div className={styles['used-eg-btn']}>
                                        <Button
                                            type="primary"
                                            onClick={() => setUsedEgOpen(true)}
                                        >
                                            {__('使用示例')}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {usedEgOpen && (
                                <div className={styles.exampleCodeContainer}>
                                    <ExampleCode
                                        open={usedEgOpen}
                                        onClose={() => setUsedEgOpen(false)}
                                        id={
                                            applicationInfo?.service_info
                                                ?.service_id
                                        }
                                    />
                                </div>
                            )}
                        </div>
                        {/* <div className={styles.ancherPosition}>
                            <AnchorMenu
                                navData={[
                                    {
                                        id: '#basic-info',
                                        label: __('基本信息'),
                                    },
                                    {
                                        id: '#param-info',
                                        label: __('参数信息'),
                                        children: [
                                            {
                                                id: '#param-info-address',
                                                label: __('接口地址'),
                                            },
                                            {
                                                id: '#param-info-protocol',
                                                label: __('接口协议'),
                                            },
                                            {
                                                id: '#param-info-method',
                                                label: __('请求方式'),
                                            },
                                            {
                                                id: '#param-info-return',
                                                label: __('返回类型'),
                                            },
                                            {
                                                id: '#param-info-request',
                                                label: __('请求参数'),
                                            },
                                            {
                                                id: '#param-info-request-example',
                                                label: __('请求示例'),
                                            },
                                            {
                                                id: '#param-info-response',
                                                label: __('返回参数'),
                                            },
                                            {
                                                id: '#param-info-response-example',
                                                label: __('返回示例'),
                                            },
                                        ].filter((currentNav) => {
                                            switch (currentNav.id) {
                                                case '#param-info-request':
                                                    return !!applicationInfo
                                                        ?.service_param
                                                        ?.data_table_request_params
                                                        ?.length
                                                case '#param-info-request-example':
                                                    return !!applicationInfo
                                                        ?.service_test
                                                        ?.request_example
                                                case '#param-info-response':
                                                    return !!applicationInfo
                                                        ?.service_param
                                                        ?.data_table_response_params
                                                        ?.length
                                                case '#param-info-response-example':
                                                    return !!applicationInfo
                                                        ?.service_test
                                                        ?.response_example
                                                default:
                                                    return true
                                            }
                                        }),
                                    },
                                ]}
                                getContainer={() =>
                                    container.current as HTMLElement
                                }
                                targetOffset={targetOffset}
                            />
                        </div> */}
                    </div>
                </div>
                {/* 权限申请 */}
                {accessOpen && (
                    <AccessModal
                        id={applicationInfo?.service_info?.service_id}
                        type={AssetTypeEnum.Api}
                        onClose={(needRefresh?: boolean) => {
                            setAccessOpen(false)
                            if (needRefresh) {
                                refreshPolicy()
                                initApplicationInfo()
                            }
                        }}
                    />
                )}

                {permissionRequestOpen && (
                    <ApplyPolicy
                        id={applicationInfo?.service_info?.service_id}
                        onClose={(needRefresh: boolean) => {
                            setPermissionRequestOpen(false)
                            // if (needRefresh) {
                            // refreshAuditProcess()
                            // }
                        }}
                        type={AssetTypeEnum.Api as string}
                    />
                )}

                {applyOpen && (
                    <ApplyApplication
                        open={applyOpen}
                        onClose={() => {
                            setApplyOpen(false)
                        }}
                        onOk={() => {
                            setApplyOpen(false)
                            initApplicationInfo()
                            setIsApply(true)
                        }}
                        id={applicationInfo?.service_info?.service_id}
                    />
                )}

                {authInfoOpen && (
                    <AuthInfo
                        id={applicationInfo?.service_info?.service_id}
                        open={authInfoOpen}
                        onClose={() => {
                            setAuthInfoOpen(false)
                        }}
                    />
                )}
                {/* 目录共享申报 */}
                {applyCatalog && (
                    <CitySharingDrawer
                        applyResource={applyCatalog}
                        operate="create"
                        open={!!applyCatalog}
                        onClose={() => setApplyCatalog(undefined)}
                    />
                )}
            </div>
        </CustomDrawer>
    )
}

export default ApplicationServiceDetail
