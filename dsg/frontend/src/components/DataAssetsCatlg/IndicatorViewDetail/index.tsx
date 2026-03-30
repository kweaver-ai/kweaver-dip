import { noop } from 'lodash'
import {
    FC,
    CSSProperties,
    ReactNode,
    useRef,
    useState,
    useEffect,
    useContext,
    useMemo,
} from 'react'
import { Anchor, Button, Divider, Space, Tabs, Tooltip } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import moment from 'moment'
import classnames from 'classnames'
import { useGetState, useUnmount } from 'ahooks'
import { FontIcon } from '@/icons'
import CustomDrawer from '@/components/CustomDrawer'
import styles from './styles.module.less'
import __ from './locale'

import {
    allRoleList,
    AssetTypeEnum,
    formatError,
    getDimRules,
    getIndicatorDetail,
    HasAccess,
    isMicroWidget,
    PolicyActionEnum,
    policyValidate,
    ResType,
} from '@/core'
import {
    ActionText,
    IndicatorDetailTabKey,
    IndicatorTypesText,
    itemOtherInfo,
} from './helper'
import { TextAreaView } from '@/components/AutoFormView/baseViewComponents'
import IndicatorConsanguinity from '@/components/IndicatorConsanguinity'

import { businessDetailInfo } from '@/components/IndicatorManage/const'

import IndicatorDetailContent from '@/components/IndicatorManage/IndicatorDetailContent'
import { Loader } from '@/ui'
import { CogAParamsType, MicroWidgetPropsContext } from '@/context'
import { useCongSearchContext } from '@/components/CognitiveSearch/CogSearchProvider'
import IndicatorPreview from '@/components/IndicatorManage/IndicatorPreview'
import { useAuditProcess } from '@/hooks/useAuditProcess'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { BizType, PolicyType } from '@/components/AuditPolicy/const'
import { getInnerUrl, useQuery } from '@/utils'
import ApplyPolicy from '@/components/AccessPolicy/ApplyPolicy'
import { IconType } from '@/icons/const'
import AccessModal from '@/components/AccessPolicy/AccessModal'
import IndicatorIcons from '@/components/IndicatorManage/IndicatorIcons'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import OwnerDisplay from '@/components/OwnerDisplay'
import { DataRescType } from '../ApplicationService/helper'
import PermisApplyBtn from '../DataResc/PermisApplyBtn'
import { usePolicyCheck } from '@/hooks/usePolicyCheck'
import FavoriteOperation, {
    UpdateFavoriteParams,
} from '@/components/FavoriteResMode/FavoriteOperation'
import FeedbackOperation from '@/components/FeedbackResMode/operate/FeedbackOperation'

// 初始params
const initialQueryParams: any = {
    offset: 1,
    limit: 2000,
    keyword: '',
}

interface IIndicatorViewDetail {
    open: boolean
    onClose?: (flag?: boolean) => void
    id?: string
    isIntroduced?: boolean
    getContainer?: HTMLElement | false
    showShadow?: boolean
    style?: CSSProperties | undefined
    extraBtns?: ReactNode
    returnInDrawer?: () => void
    indicatorType?: string
    canChat?: boolean // 是否可以问答
    hasAsst?: boolean // 是否有认知助手
    isNeedComExistBtns?: boolean
    hiddenReturn?: boolean // 是否隐藏返回按钮
    // 添加收藏
    onAddFavorite?: ({ is_favored, favor_id }: UpdateFavoriteParams) => void
    // 取消收藏
    onCancelFavorite?: ({ is_favored, favor_id }: UpdateFavoriteParams) => void
}
const IndicatorViewDetail: FC<IIndicatorViewDetail> = ({
    open,
    onClose = noop,
    id,
    getContainer,
    showShadow = true,
    style,
    extraBtns,
    isIntroduced,
    indicatorType,
    returnInDrawer = noop,
    canChat = false,
    hasAsst = false,
    isNeedComExistBtns = true,
    hiddenReturn = false,
    onAddFavorite = noop,
    onCancelFavorite = noop,
}) => {
    const [loading, setLoading] = useState(false)
    const container = useRef<any>(null)
    const [userId] = useCurrentUser('ID')
    const header = useRef<any>(null)
    const [baseInfoData, setBaseInfoData] = useState<any>({})
    const [tabActiveKey, setTabActiveKey] = useState<
        IndicatorDetailTabKey | string
    >(IndicatorDetailTabKey.Preview)

    const { Link } = Anchor
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const { bigHeader } = useCongSearchContext()
    // const [hasAuditProcess, refreshAuditProcess] = useAuditProcess({
    //     audit_type: PolicyType.AssetPermission,
    //     service_type: BizType.AuthService,
    // })
    // 授权
    const [accessOpen, setAccessOpen] = useState<boolean>(false)

    // 是否允许调用
    const [allowRead, setAllowRead] = useState<boolean>(false)
    // 是否有读取权限
    const [allowReadAll, setAllowReadAll] = useState<boolean>(false)
    const { checkPermission, checkPermissions } = useUserPermCtx()

    // 获取当前数据运营工程师
    const userOperationEngineer = useMemo(
        () => checkPermission(allRoleList.TCDataOperationEngineer),
        [checkPermission],
    )
    // 获取当前数据开发工程师
    const userDevelopEngineer = useMemo(
        () => checkPermission(allRoleList.TCDataGovernEngineer),
        [checkPermission],
    )
    const [wholeAccess, setWholeAccess] = useState<string>('')
    const userRoles = useMemo(
        () => checkPermissions(HasAccess.isHasBusiness),
        [checkPermissions],
    )
    const [{ using }] = useGeneralConfig()
    // useCogAsstContext 已移除，相关功能已下线

    const query = useQuery()
    const indicatorId = query.get('indicatorId') || ''
    // 指标id--不能为空  如果参数中有id就使用id，否则使用页面路径indicatorId参数
    const [rescId, setRescId] = useState<string>('')
    const [subDimAccess, setSubDimAccess] = useState<any>()
    const [subDims, setSubDims] = useState<any[]>()
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

    const [userInfo] = useCurrentUser()
    // 授权申请
    const [permissionRequestOpen, setPermissionRequestOpen] =
        useState<boolean>(false)

    const isShowRequestPath = [
        '/data-assets',
        '/congnitive-search',
        '/my-assets',
        '/asset-view/architecture',
    ].includes(getInnerUrl(window.location.pathname))

    const { allowedActions, checkBatchPolicy, refreshPolicy } = usePolicyCheck(
        rescId,
        AssetTypeEnum.Indicator,
        {
            toast: microWidgetProps?.components?.toast,
        },
    )

    /**
     * 查询维度权限
     * @param _id
     */
    const getSubDimPermission = async (_id: string) => {
        if (!_id) return
        try {
            const subDimResult = await getDimRules({
                limit: 1000,
                offset: 1,
                indicator_id: rescId,
            })
            const subItems = (subDimResult?.entries || []).map((item) => {
                const { metadata, spec } = item
                const obj = {
                    detail: {
                        fields: spec?.fields || [],
                        row_filters: spec?.row_filters || {},
                    },
                    id: metadata?.id,
                    name: spec?.name,
                }
                return obj
            })

            setSubDims(subItems)

            // 仅非owner查询子视图权限 且子视图数量大于0
            if (!isOwner && subItems?.length > 0) {
                const subParams = subItems.map((o) => ({
                    id: o.id,
                    type: AssetTypeEnum.Dim,
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
                setSubDimAccess(groupById)
            }
        } catch (error) {
            formatError(error)
        }
    }

    // 具备授权权限
    const canAuth = useMemo(() => {
        const viewAuth = [
            PolicyActionEnum.Allocate,
            PolicyActionEnum.Auth,
        ].some((o) => (allowedActions || []).includes(o))
        const subAuth = baseInfoData?.can_auth
        return viewAuth || subAuth
    }, [allowedActions, baseInfoData?.can_auth])

    const isOwner = useMemo(() => {
        const status =
            userInfo?.ID &&
            baseInfoData?.owners?.some(
                (owner) => owner.owner_id === userInfo?.ID,
            )

        return status
    }, [baseInfoData, userInfo])

    useEffect(() => {
        if (!isOwner && baseInfoData && open) {
            getSubDimPermission(rescId)
        }
    }, [isOwner, baseInfoData, open, rescId])

    useEffect(() => {
        if (id) {
            setRescId(id || '')
        } else {
            setRescId(indicatorId)
        }
    }, [id])

    useEffect(() => {
        if (open && rescId) {
            getDetails()
        }
    }, [rescId, open])

    useEffect(() => {
        if (isOwner) {
            const accessText = [__('读取'), __('授权')].join('/')
            setAllowReadAll(true)
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
                setAllowReadAll(true)
            }
            if (
                allowedActions?.includes(PolicyActionEnum.Read) ||
                userDevelopEngineer ||
                userOperationEngineer
            ) {
                setAllowRead(true)
            }

            const accessText =
                allowActions.join('/') ||
                (userDevelopEngineer || userOperationEngineer ? __('读取') : '')
            setWholeAccess(accessText)
        }
    }, [isOwner, allowedActions, userDevelopEngineer, userOperationEngineer])

    useUnmount(() => {
        // useCogAsstContext 已移除
    })

    const [tabItems, setTabItems, getTabItems] = useGetState<Array<any>>([
        {
            key: IndicatorDetailTabKey.Preview,
            label: __('指标预览'),
        },
        {
            key: IndicatorDetailTabKey.Detail,
            label: __('指标定义'),
        },
        {
            key: IndicatorDetailTabKey.Consanguinity,
            label: __('指标血缘'),
        },
    ])

    const [
        businessDetailContent,
        setBusinessDetailContent,
        getBusinessDetailContent,
    ] = useGetState(businessDetailInfo)

    const getDetails = async () => {
        try {
            setLoading(true)
            const indictorData = await getIndicatorDetail(rescId)

            setBaseInfoData(indictorData)
        } catch (ex) {
            formatError(ex, microWidgetProps?.components?.toast)
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

    const subDimInfo = useMemo(() => {
        const subDimItems: any = Object.keys(subDimAccess || {}).reduce(
            (prev: any[], cur) => {
                const sub = subDims?.find((o) => o.id === cur)
                const item = {
                    id: sub.id,
                    name: sub.name,
                    access: (subDimAccess[cur] || [])
                        .map((o) => ActionText[o])
                        .join('/'),
                }
                return [...prev, item]
            },
            [],
        )

        return (
            <div className={styles.subDimList}>
                {(subDimItems || []).map((o) => (
                    <div className={styles.subDimItem} key={o.id}>
                        <div
                            className={styles.subDimName}
                            title={o.name || '--'}
                        >
                            <span>{__('规则')}：</span> {o.name || '--'}
                        </div>
                        <div
                            className={styles.subDimAccess}
                            title={o.access || '--'}
                        >
                            <span>{__('权限')}：</span> {o.access || '--'}
                        </div>
                    </div>
                ))}
                <div className={styles.subDimItem} hidden={subDimItems?.length}>
                    <div className={styles.subDimName}>
                        {__('暂无规则权限')}
                    </div>
                </div>
            </div>
        )
    }, [subDimAccess, subDims])

    // render
    const renderOtherInfo = (item: any, data: any) => {
        const { firstKey, infoKey, type, title, toolTipTitle } = item
        const showContent = data?.[infoKey] || ''
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
                    <OwnerDisplay value={data?.owners} />
                </div>
            )
        }
        return showToolTip(title, toolTipTitle, showContent)
    }

    const handleTabsChange = (key: string) => {
        setTabActiveKey(key as IndicatorDetailTabKey)
    }

    /**
     * 根据当前激活的标签键获取相应的标签组件。
     *
     * 此函数通过switch-case语句根据tabActiveKey的值决定渲染哪个组件。
     * 它处理了三个不同的标签：亲缘关系、详情和预览，每个标签对应一个不同的组件。
     * 在每个情况下，都会根据是否是微组件来调整组件的高度。
     * 如果tabActiveKey的值不符合任何已知情况，则返回null。
     */
    const getTabComponent = () => {
        switch (tabActiveKey) {
            case IndicatorDetailTabKey.Consanguinity:
                // 渲染亲缘关系组件，高度根据是否是微组件进行调整
                return (
                    <div
                        style={{
                            height: isMicroWidget({ microWidgetProps })
                                ? 'calc(100vh - 223px)'
                                : 'calc(100vh - 173px)',
                            position: 'relative',
                        }}
                    >
                        <IndicatorConsanguinity id={rescId} />
                    </div>
                )
            case IndicatorDetailTabKey.Detail:
                // 渲染详情组件
                return (
                    <div className={styles.detailContainer}>
                        <div className={styles.detailContent}>
                            <IndicatorDetailContent
                                indicatorId={rescId}
                                indicatorType={
                                    baseInfoData?.indicator_type ||
                                    indicatorType
                                }
                                isMarket
                            />
                        </div>
                    </div>
                )
            case IndicatorDetailTabKey.Preview:
                // 渲染预览组件，高度根据是否是微组件进行调整
                // 后续需要加权限判断
                return (
                    <div
                        style={{
                            height: 'calc(100% - 48px)',
                            position: 'relative',
                        }}
                    >
                        <IndicatorPreview indicatorId={rescId} />
                    </div>
                )
            default:
                // 如果tabActiveKey的值不符合任何已知情况，返回null
                return null
        }
    }

    // 收藏
    const handleAddFavorite = ({
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

    /** 取消收藏 */
    const handleCancelFavorite = ({
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
            customBodyStyle={{
                height: `calc(100% - ${styleTop}px)`,
                background: '#f0f2f6',
                position: 'relative',
                overflow: 'hidden',
            }}
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
            {showShadow && <div className={styles.bodyShadow} />}
            <div
                className={styles.logicViewDetail}
                style={{ height: isIntroduced ? '100%' : undefined }}
            >
                {loading && (
                    <div className={styles.detailLoading}>
                        <Loader />
                    </div>
                )}
                <div className={styles.header} ref={header} hidden={loading}>
                    <div
                        onClick={() => {
                            returnInDrawer()
                            onClose()
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
                                    <div className={styles.iconContainer}>
                                        <IndicatorIcons
                                            type={
                                                baseInfoData?.indicator_type ||
                                                indicatorType
                                            }
                                            fontSize={36}
                                        />
                                    </div>
                                </div>
                                <div className={styles.rescTopInfoWrapper}>
                                    <div className={styles.logicViewName}>
                                        <span
                                            className={styles.name}
                                            title={baseInfoData?.name || '--'}
                                        >
                                            {baseInfoData?.name || '--'}
                                        </span>
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
                                                    baseInfoData?.code || '--'
                                                }
                                            >
                                                {baseInfoData?.code || '--'}
                                            </span>
                                        </div>
                                        <div className={styles.rescTechName}>
                                            {__('指标类型：')}
                                            <span
                                                title={
                                                    IndicatorTypesText[
                                                        baseInfoData
                                                            ?.indicator_type
                                                    ]
                                                }
                                            >
                                                {IndicatorTypesText[
                                                    baseInfoData?.indicator_type
                                                ] || '--'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.nameBtn}>
                                    {extraBtns}

                                    {isNeedComExistBtns && (
                                        <>
                                            {/* {hasAuditProcess &&
                                                !isOwner &&
                                                (isShowRequestPath ||
                                                    isMicroWidget({
                                                        microWidgetProps,
                                                    })) && (
                                                    <Tooltip
                                                        overlayClassName={
                                                            styles.toolTipWrapper
                                                        }
                                                        placement="bottomRight"
                                                        title={
                                                            !userRoles
                                                                ? __(
                                                                      '为集成应用申请权限',
                                                                  )
                                                                : ''
                                                        }
                                                    >
                                                        <Button
                                                            onClick={(e) => {
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
                                                        >
                                                            {__('权限申请')}
                                                        </Button>
                                                    </Tooltip>
                                                )} */}
                                            <PermisApplyBtn
                                                id={rescId}
                                                type={DataRescType.INDICATOR}
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
                                                (isShowRequestPath ||
                                                    isMicroWidget({
                                                        microWidgetProps,
                                                    })) && (
                                                    <Tooltip
                                                        title={__('资源授权')}
                                                        overlayClassName={
                                                            styles.toolTipWrapper
                                                        }
                                                        placement="bottomRight"
                                                    >
                                                        <Button
                                                            onClick={(e) => {
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
                                        </>
                                    )}

                                    {/* 认知助手功能已下线 */}
                                    <FavoriteOperation
                                        type="button"
                                        item={baseInfoData}
                                        className={styles.itemOprBtn}
                                        resType={ResType.Indicator}
                                        onAddFavorite={handleAddFavorite}
                                        onCancelFavorite={handleCancelFavorite}
                                    />
                                    <FeedbackOperation
                                        type="button"
                                        item={baseInfoData}
                                        resType={ResType.Indicator}
                                        className={styles.itemOprBtn}
                                    />
                                    {/* <Button
                                        // hidden={isFromAuth}
                                        onClick={() => {
                                            returnInDrawer()
                                            onClose()
                                        }}
                                        type={isIntroduced ? 'text' : 'default'}
                                        className={classnames({
                                            [styles.closeScreenBtn]: true,
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
                                                    title={__('退出全屏')}
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
                                </div>
                            </div>
                            <div className={styles.descriptionWrapper}>
                                <span className={styles.textTitle}>
                                    {__('指标定义：')}
                                </span>
                                <div className={styles.descContent}>
                                    <TextAreaView
                                        initValue={
                                            baseInfoData?.description || '--'
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
                                    {`${__('发布时间')} ${
                                        baseInfoData?.updated_at
                                            ? moment(
                                                  baseInfoData?.updated_at,
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
                                    <div
                                        className={styles.itemDetailInfo}
                                        hidden={isOwner}
                                    >
                                        <span>{__('维度')}：</span>
                                        <Tooltip
                                            title={subDimInfo}
                                            placement="right"
                                            color="#fff"
                                            overlayClassName={
                                                styles['subdim-tip']
                                            }
                                        >
                                            <span className={styles.ruleText}>
                                                {__('查看规则权限')}
                                            </span>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                        </Space>
                    </div>
                </div>
                <div className={styles.contentTabsWrapper} hidden={loading}>
                    <Tabs
                        defaultActiveKey={IndicatorDetailTabKey.Preview}
                        onChange={handleTabsChange}
                        items={tabItems}
                        tabBarGutter={32}
                        className={classnames(
                            styles.contentTabs,
                            hiddenReturn && styles.hiddenReturnTab,
                        )}
                    />

                    {getTabComponent()}
                </div>

                {/* 权限申请 */}
                {accessOpen && (
                    <AccessModal
                        id={rescId}
                        type={AssetTypeEnum.Indicator}
                        onClose={(needRefresh) => {
                            setAccessOpen(false)
                            if (needRefresh) {
                                refreshPolicy()
                                getDetails()
                            }
                        }}
                        indicatorType={baseInfoData.indicator_type}
                    />
                )}
                {permissionRequestOpen && (
                    <ApplyPolicy
                        id={rescId}
                        onClose={(needRefresh: boolean) => {
                            setPermissionRequestOpen(false)
                            // if (needRefresh) {
                            //     refreshAuditProcess()
                            // }
                        }}
                        type={AssetTypeEnum.Indicator as string}
                        indicatorType={baseInfoData.indicator_type}
                    />
                )}
            </div>
        </CustomDrawer>
    )
}

export default IndicatorViewDetail
