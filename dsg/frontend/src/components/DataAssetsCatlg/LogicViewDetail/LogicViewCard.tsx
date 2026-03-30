import Icon, {
    DownOutlined,
    InfoCircleFilled,
    UpOutlined,
} from '@ant-design/icons'
import { useUpdateEffect } from 'ahooks'
import { message, Space, Row, Col, Tabs, Tooltip, Radio, Button } from 'antd'
import classnames from 'classnames'
import { isEmpty, isNumber, isString, max, toNumber, trim, noop } from 'lodash'
import moment from 'moment'
import {
    ReactNode,
    memo,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { ReactComponent as icon1 } from '@/assets/DataAssetsCatlg/icon1.svg'
import dataEmpty from '@/assets/dataEmpty.svg'
import ApplyPolicy from '@/components/AccessPolicy/ApplyPolicy'
import AccessView from '@/components/AccessPolicy/components/AccessDetail/AccessView'
import CustomDrawer from '@/components/CustomDrawer'
import {
    IEditFormData,
    VIEWERRORCODElIST,
    detailTabKey,
    filterEmptyProperties,
} from '@/components/DatasheetView/const'
import {
    DashBoard,
    RadarMap,
} from '@/components/DatasheetView/DataPreview/g2plotConfig'
import { getFieldTypeEelment } from '@/components/DatasheetView/helper'
import { AssetType, CogAParamsType, MicroWidgetPropsContext } from '@/context'
import {
    AssetTypeEnum,
    HasAccess,
    IPolicyInfo,
    IVirtualEngineExample,
    IVisitor,
    OnlineStatus,
    PolicyActionEnum,
    formatError,
    getAuditProcessFromConfCenter,
    getBusinessUpdateTime,
    getDataViewBaseInfo,
    getDatasheetViewDetails,
    getDatasourceConfig,
    getExploreReport,
    getSubViews,
    getSynthData,
    getVirtualEngineExample,
    isMicroWidget,
    policyDetail,
    policyValidate,
    ResType,
} from '@/core'
import { useAuditProcess } from '@/hooks/useAuditProcess'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
    CloseOutlined,
    FontIcon,
    FullScreenOutlined,
    InfotipOutlined,
} from '@/icons'
import { IconType as FontIconType } from '@/icons/const'
import { Empty, Expand, Loader } from '@/ui'
import { cancelRequest, getInnerUrl } from '@/utils'
import DataDownloadConfig from '../DataDownloadConfig'
import { checkAuditPolicyPermis, getIsNeedPermisControl } from '../helper'
import {
    SampleOptionValue,
    TimeRender,
    getScore,
    isValidTime,
    viewCardBaiscInfoList,
    getDisabledTooltip,
} from './helper'
import __ from './locale'
import styles from './styles.module.less'

import AccessModal from '@/components/AccessPolicy/AccessModal'
import { BizType, PolicyType } from '@/components/AuditPolicy/const'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import OwnerDisplay from '@/components/OwnerDisplay'
import PermisApplyBtn from '../DataResc/PermisApplyBtn'
import { DataRescType } from '../ApplicationService/helper'
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

const logicViewCardId = 'logicViewCardId'

interface IOperaionModelType {
    open?: boolean
    id: string
    icon?: ReactNode
    allowDownload?: boolean
    cardProps?: Record<string, any>
    // operate: OperateType
    onFullScreen: (isOwner?: boolean) => void
    onClose: (flag?: boolean) => void
    onSure: () => void
    onDownload?: () => void
    allowChat?: boolean // 问答
    inAssetPanorama?: boolean // 在资产全景中
    onAddFavorite?: ({ is_favored, favor_id }: UpdateFavoriteParams) => void
    onCancelFavorite?: ({ is_favored, favor_id }: UpdateFavoriteParams) => void
    selectedResc?: any
}

const LogicViewCard = ({
    open,
    // operate,
    id,
    icon,
    cardProps,
    allowDownload,
    onFullScreen,
    onClose,
    onSure,
    onDownload,
    allowChat = false,
    inAssetPanorama = false,
    onAddFavorite = noop,
    onCancelFavorite = noop,
    selectedResc,
}: IOperaionModelType) => {
    const [loading, setLoading] = useState<boolean>(true)
    const [permisLoading, setPermisLoading] = useState(true)

    const [userInfo] = useCurrentUser()
    const [userId] = useCurrentUser('ID')

    const [downloadVisible, setDownloadVisible] = useState<boolean>(false)

    const [confTimeliness, setConfTimeliness] = useState<string>()
    // 样例数据加载
    const [sampleDataLoading, setSampleDataLoading] = useState<boolean>(false)

    const [exploreReportData, setExploreReportData] = useState<any>({})
    const [probeTime, setProbeTime] = useState<any>({})

    const [tabActiveKey, setTabActiveKey] = useState<string>(
        detailTabKey.sampleData,
    )
    // 资源授权
    const [accessOpen, setAccessOpen] = useState<boolean>(false)
    // 授权申请
    const [permissionRequestOpen, setPermissionRequestOpen] =
        useState<boolean>(false)
    // 样例数据字段
    const [columns, setColumns] = useState<Array<any>>([])
    const [radarMapData, setRadarMapData] = useState<any[]>()
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    // useCogAsstContext 已移除，相关功能已下线
    const cardRef = useRef<any>()
    const viewContentRef = useRef<any>()
    const tabBarRef = useRef<any>()

    const [showBackToTop, setShowBackToTop] = useState<boolean>(false)
    const [existPermissionReq, setExistPermissionReq] = useState(true)

    const { allowedActions, canDownload, refreshPolicy } = usePolicyCheck(
        id,
        AssetTypeEnum.DataView,
        {
            toast: microWidgetProps?.components?.toast,
        },
    )

    const handleScroll = () => {
        const scrollableElement = viewContentRef?.current
        const stickyElement = tabBarRef?.current
        // card viewHeaderWrapper高度47
        const stickyThreshold = 47

        if (
            scrollableElement &&
            stickyElement &&
            scrollableElement.scrollTop >=
                stickyElement.offsetTop - stickyThreshold
        ) {
            setShowBackToTop(true)
        } else {
            setShowBackToTop(false)
        }
    }

    useEffect(() => {
        const scrollableElement = viewContentRef?.current
        scrollableElement?.addEventListener('scroll', handleScroll)
        return () =>
            scrollableElement?.removeEventListener('scroll', handleScroll)
    }, [loading])
    const { checkPermissions } = useUserPermCtx()

    const hasBusinessRoles = useMemo(
        () => checkPermissions(HasAccess.isHasBusiness),
        [checkPermissions],
    )
    const hasOwnedRoles = useMemo(
        () => checkPermissions(HasAccess.isOwner),
        [checkPermissions],
    )

    const isTimelinessPass = useMemo(() => {
        let diffHours = -1
        if (confTimeliness) {
            let startTime: any = null
            switch (confTimeliness) {
                case 'day':
                    startTime = moment().add(-1, 'day').toDate()
                    break
                case 'week':
                    startTime = moment().add(-1, 'week').toDate()
                    break
                case 'month':
                    startTime = moment().add(-1, 'month').toDate()
                    break
                case 'quarter':
                    startTime = moment().add(-1, 'quarter').toDate()
                    break
                case 'half_a_year':
                    startTime = moment().add(-6, 'month').toDate()
                    break
                case 'year':
                    startTime = moment().add(-1, 'year').toDate()
                    break
                default:
                    break
            }

            diffHours = probeTime?.date
                ? moment(probeTime?.date)
                      .startOf('hour')
                      .diff(moment(startTime).startOf('hour'), 'hour')
                : -1
        }

        return diffHours >= 0
    }, [confTimeliness, probeTime])

    useEffect(() => {
        getRadarMapData(isTimelinessPass)
    }, [exploreReportData, isTimelinessPass, confTimeliness])

    const [title, setTitle] = useState('资源实体title')
    const [viewInfo, setViewInfo] = useState<any>()

    const hasDownloadPermission = useMemo(() => {
        // 拥有下载权限：外界传的权限值或当前用户为数据owner
        return (
            allowDownload ||
            canDownload ||
            (userInfo?.ID &&
                viewInfo?.owners?.some(
                    (owner) => owner.owner_id === userInfo?.ID,
                ))
        )
    }, [allowDownload, canDownload, viewInfo])

    const isShowRequestPath = [
        '/data-assets',
        '/cognitive-search',
        '/asset-view/architecture',
    ].includes(getInnerUrl(window.location.pathname))

    // 具备授权权限
    const canAuth = useMemo(() => {
        const viewAuth = [
            PolicyActionEnum.Allocate,
            PolicyActionEnum.Auth,
        ].some((o) => allowedActions?.includes(o))
        const subAuth = viewInfo?.can_auth
        return viewAuth || subAuth
    }, [allowedActions, viewInfo?.can_auth])

    const isOwner = useMemo(() => {
        return (
            userInfo?.ID &&
            viewInfo?.owners?.some((owner) => owner.owner_id === userInfo?.ID)
        )
    }, [viewInfo, userInfo])

    // 是否拥有数据运营、开发工程师
    const hasDataOperRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermissions])

    // 是否只显示样例数据，无ai或用户为数据运营、开发工程师或库表的owner则只显示样例数据
    const onlyShowSampleData = useMemo(() => {
        return hasDataOperRole || isOwner
    }, [hasDataOperRole, isOwner])
    // 数据质量评分
    const dataQulityScore = useMemo(() => {
        let score
        try {
            const validScoreList = radarMapData?.filter(
                (item) => typeof item.score === 'number',
            )
            const count = validScoreList?.length
            if (typeof count === 'number' && count > 0) {
                const sum = validScoreList
                    ?.map((item) => item.score)
                    .reduce((num, res) => num + res * 100, 0)
                if (sum >= 0) {
                    // 取整
                    score = Math.trunc(sum / count) / 100
                }
            }
        } catch (e) {
            // console.log(e)
        }
        return score
    }, [radarMapData])

    const detailTabItems = useMemo(() => {
        const score = dataQulityScore || '--'
        return [
            {
                label: __('字段 (${count})', {
                    count: viewInfo?.fields?.length || 0,
                }),
                key: detailTabKey.sampleData,
            },
            {
                label: __('质量评分 (${count})', {
                    count: score.toString(),
                }),
                key: detailTabKey.dataQuality,
            },
        ]
        // const accessItem = {
        //     label: __('权限信息'),
        //     key: detailTabKey.accessInfo,
        // }
        // // 仅在规定模块下显示权限Tab
        // return isShowRequestPath ||
        //     isMicroWidget({
        //         microWidgetProps,
        //     })
        //     ? [...tabItems, accessItem]
        //     : tabItems
    }, [viewInfo, dataQulityScore, isShowRequestPath, microWidgetProps])

    // 是否已上线
    const isOnline = useMemo(() => {
        return [
            OnlineStatus.ONLINE,
            OnlineStatus.DOWN_AUDITING,
            OnlineStatus.DOWN_REJECT,
        ].includes(viewInfo?.online_status)
    }, [viewInfo?.online_status])

    // 是否已发布
    const isPublished = useMemo(() => {
        return viewInfo?.publish_status === 'published'
    }, [viewInfo?.publish_status])

    const sampleOptions = useMemo(
        () => [
            { label: __('样例数据'), value: SampleOptionValue.Sample },
            {
                label: (
                    <Tooltip>
                        <div className={styles.sampleOption}>
                            <FontIcon
                                name="icon-AIhecheng"
                                type={FontIconType.FONTICON}
                                className={styles.smapleIcon}
                            />
                            <span>{__('合成数据')}</span>
                        </div>
                    </Tooltip>
                ),
                value: SampleOptionValue.Synthetic,
                disabled: false,
            },
        ],
        [],
    )
    // 样例数据radio
    const [sampleOption, setSampleOption] = useState(SampleOptionValue.Sample)
    // 样例/合成数据错误类型
    const [sampOrSynthError, setSampOrSynthError] = useState<any>()

    // 字段样例数据
    const [sampleData, setSampleData] = useState<any>({})
    // 字段合成数据
    const [synthData, setSynthData] = useState<any>({})
    const [isApply, setIsApply] = useState<boolean>(false)
    // 是否有整表权限
    const [isOwnedFullReadPermis, setIsOwnedFullReadPermis] =
        useState<boolean>(false)
    // 是否有读取权限
    const [allowRead, setAllowRead] = useState<boolean>(false)
    const [permissions, setPermissions] = useState<IVisitor[]>()

    // const [hasAuditProcess, refreshAuditProcess] = useAuditProcess({
    //     audit_type: PolicyType.AssetPermission,
    //     service_type: BizType.AuthService,
    // })
    // let source: CancelTokenSource | null = axios.CancelToken.source()

    useEffect(() => {
        if (open) {
            setLoading(true)
            message.destroy()
            setTabActiveKey(detailTabKey.sampleData)
            setSampleOption(SampleOptionValue.Sample)
            setIsOwnedFullReadPermis(false)
            setAllowRead(false)
            setViewInfo(undefined)
            setSampleData({})
            setSynthData({})
            setSampOrSynthError(undefined)
            // 查询是否有整表权限
            checkIsOwnedView(id, AssetTypeEnum.DataView)
            checkReadPermission()
            initTableData()
            getDataQulity()
        }
    }, [id, open])

    useEffect(() => {
        if (!allowRead) return
        // 多次切换所选库表，去除非当前id库表的请求
        if (viewInfo?.viewId && viewInfo?.viewId !== id) {
            const [catalog, schema] =
                viewInfo?.view_source_catalog_name?.split('.') || []
            cancelRequest(
                `/api/virtual_engine_service/v1/preview/${catalog}/${schema}/${viewInfo.technical_name}`,
                'get',
            )
            cancelRequest(
                `/api/data-view/v1/logic-view/${viewInfo?.viewId}/synthetic-data`,
                'get',
            )
        } else {
            getSampleData()
        }
    }, [id, viewInfo, allowRead])

    const initTableData = async () => {
        try {
            setLoading(true)
            // cancelRequest(`/api/data-view/v1/form-view/${id}`, 'get')
            // cancelRequest(`/api/data-view/v1/form-view/${id}/details`, 'get')

            const [res, baseRes] = await Promise.all([
                getDatasheetViewDetails(id),
                getDataViewBaseInfo(id),
            ])
            // 去除空字段
            const baseResValue: IEditFormData = filterEmptyProperties(baseRes)
            setViewInfo({
                // 判断当前库表是否为id指向的id，防止多次切换库表导致错误
                viewId: id,
                ...res,
                ...baseResValue,
            })

            const confRes = await getDatasourceConfig({
                form_view_id: id,
            })

            const ruleConf = JSON.parse(confRes?.config || '{}')
            const conf = ruleConf?.view?.rules?.find(
                (o) => o.dimension === 'timeliness',
            )?.rule_config
            const timelinessPeriod = JSON.parse(conf || '{}')?.update_period
            setConfTimeliness(timelinessPeriod)
        } catch (err) {
            if (err?.data?.code !== 'ERR_CANCELED') {
                formatError(err, microWidgetProps?.components?.toast)
                onClose()
            }
        } finally {
            setLoading(false)
        }
    }
    const getDataQulity = async () => {
        try {
            // 获取数据质量信息
            const dataQulityRes = await getExploreReport({
                id,
            })
            setExploreReportData(dataQulityRes)
        } catch (err) {
            // console.log(err)
        }
    }

    const checkIsOwnedView = async (viewId: string, rtype: AssetTypeEnum) => {
        try {
            setPermisLoading(true)
            if (hasDataOperRole) {
                setIsOwnedFullReadPermis(true)
                return
            }
            cancelRequest(
                `/api/auth-service/v1/policy?object_id=${viewId}&object_type=${rtype}`,
                'get',
            )
            const res: IPolicyInfo = await policyDetail(viewId, rtype)
            const owndUserIdList = res?.owner_id ? [res?.owner_id] : []
            res?.subjects?.forEach((item) => {
                const { subject_id } = item
                if (subject_id) {
                    owndUserIdList.push(subject_id)
                }
            })
            setIsOwnedFullReadPermis(owndUserIdList.includes(userId))
            setPermissions(res?.subjects as any)
        } catch (error) {
            const errCode = error?.data?.code || ''
            if (errCode === 'ERR_CANCELED') {
                return
            }

            formatError(error, microWidgetProps?.components?.toast)
        } finally {
            setPermisLoading(false)
        }
    }

    // 库表有read权限才需要需要样例、合成数据
    const checkReadPermission = async () => {
        try {
            setPermisLoading(true)
            cancelRequest(`/api/auth-service/v1/enforce`, 'post')

            const res = await policyValidate([
                {
                    action: PolicyActionEnum.Read,
                    object_id: id,
                    object_type: AssetTypeEnum.DataView,
                    subject_id: userId,
                    subject_type: 'user',
                },
            ])
            const validateItem = (res || [])?.find((o) => o.object_id === id)
            const isAllow = validateItem?.effect === 'allow'
            setAllowRead(isAllow)

            // 拥有整表权限，则不再请求子库表权限读取权限
            if (isAllow) return

            // 无整表权限情况下，查询子库表是否有读取权限
            const subviewResult = await getSubViews({
                limit: 1000,
                offset: 1,
                logic_view_id: id,
            })

            const subItems = (subviewResult?.entries || []).map((o) => ({
                id: o.id,
                name: o.name,
                detail: JSON.parse(o.detail || '{}'),
            }))
            if (!subItems?.length) return
            const params: any =
                subItems?.map((subItem) => {
                    return {
                        action: PolicyActionEnum.Read,
                        object_id: subItem.id,
                        object_type: AssetTypeEnum.SubView,
                        subject_id: userId,
                        subject_type: 'user',
                    }
                }) || []

            const subViewsRes = await policyValidate(params)

            const allowItems = (subViewsRes || []).filter(
                (o) => o.effect === 'allow',
            )
            setAllowRead(!!allowItems?.length)
        } catch (error) {
            const errCode = error?.data?.code || ''
            if (errCode === 'ERR_CANCELED') {
                return
            }

            formatError(error, microWidgetProps?.components?.toast)
        } finally {
            setPermisLoading(false)
        }
    }

    const getSampleData = async () => {
        try {
            setSampleDataLoading(true)
            setSampOrSynthError('')

            const [catalog, schema] =
                viewInfo?.view_source_catalog_name?.split('.') || []

            if (!catalog || !schema) return
            const viewId = id
            const sampleParams: IVirtualEngineExample = {
                catalog,
                schema,
                table: viewInfo.technical_name,
                user: userInfo?.Account || '',
                user_id: userInfo?.ID || '',
                limit: 10,
            }
            cancelRequest(
                `/api/virtual_engine_service/v1/preview/${catalog}/${schema}/${viewInfo.technical_name}`,
                'get',
            )
            cancelRequest(
                `/api/data-view/v1/logic-view/${viewId}/synthetic-data`,
                'get',
            )

            const isNeedPermisControl = getIsNeedPermisControl(microWidgetProps)
            // 2.0.0.3版本，除服务超市-样例数据不需要传user_id，其余页面均需要传参
            if (isNeedPermisControl) {
                sampleParams.user_id =
                    (isNeedPermisControl ? userInfo?.ID : '') || ''
            }

            // 获取样例数据
            let data: any = {}
            if (sampleOption === SampleOptionValue.Sample) {
                if (!allowRead) {
                    setSampleDataLoading(false)
                    return
                }

                data = await getVirtualEngineExample(sampleParams)
            } else {
                data = await getSynthData(viewId)
            }

            const names = data?.columns?.map((item) => item.name)

            if (sampleOption === SampleOptionValue.Sample) {
                const sampleDataObj: Object = {}

                names?.forEach((name, nIdx) => {
                    const obj: any = []

                    data?.data.forEach((item, idx) => {
                        const val = trim(item[nIdx] || '')
                        // 去前三个非重复有值数据
                        if (val && !sampleDataObj?.[name]?.includes(val)) {
                            if (!sampleDataObj?.[name]?.length) {
                                sampleDataObj[name] = [val]
                            } else if (
                                toNumber(sampleDataObj?.[name]?.length) < 3
                            ) {
                                sampleDataObj?.[name]?.push(val)
                            }
                        }
                    })
                })
                setSampleData(sampleDataObj)
            } else {
                const synthDataObj = {}
                data?.data.forEach((rowData, idx) => {
                    rowData.forEach((columnData) => {
                        const { column_name: name, column_value } = columnData
                        const isValNumber = isNumber(column_value)
                        const val = isValNumber
                            ? column_value
                            : trim(column_value || '')
                        if (!val && !isValNumber) return
                        if (!synthDataObj?.[name]) {
                            synthDataObj[name] = [val]
                        } else if (
                            !synthDataObj?.[name]?.includes(val) &&
                            toNumber(synthDataObj?.[name]?.length) < 3
                        ) {
                            synthDataObj?.[name]?.push(val)
                        }
                    })
                })
                setSynthData(synthDataObj)
            }
            setSampleDataLoading(false)
        } catch (e) {
            const errCode = e?.data?.code || ''
            if (errCode === 'ERR_CANCELED') {
                return
            }

            // 加载失败
            setSampOrSynthError(errCode || 'error')
            // 合成数据生成中
            if (errCode === VIEWERRORCODElIST.ADGENERATING) {
                // 依旧显示加载中
                // formatError(e, microWidgetProps?.components?.toast)
            } else if (errCode === VIEWERRORCODElIST.VIEWDATAEMPTYERRCODE) {
                setSampleDataLoading(false)
            } else if (errCode === VIEWERRORCODElIST.VIEWSQLERRCODE) {
                setSampleDataLoading(false)
                // message.error(__('库表有更新，请重新发布'))
            } else if (errCode === VIEWERRORCODElIST.VIEWTABLEFIELD) {
                setSampleDataLoading(false)
                // 库表与源表的字段不一致
                message.info({
                    icon: <InfoCircleFilled className={styles.infoIcon} />,
                    content: <span>{e?.data?.description}</span>,
                    duration: 5,
                    className: styles.sampleMsgInfo,
                    getPopupContainer: (n) =>
                        document.getElementById(logicViewCardId) ||
                        cardRef?.current ||
                        n,
                })

                // setTimeout(() => {
                //     // 恢复默认container
                //     message.config({
                //         getContainer: () => document.body as HTMLElement,
                //     })
                // }, 6000)
            } else if (errCode === VIEWERRORCODElIST.AFSAILORERROR) {
                setSampleDataLoading(false)
                // af-sailor服务挂掉
                message.warning({
                    getPopupContainer: (n) =>
                        document.getElementById(logicViewCardId) ||
                        cardRef?.current ||
                        n,
                    icon: <InfoCircleFilled className={styles.infoIcon} />,
                    content: __('无法连接af-sailor服务，信息获取失败'),
                    className: styles.sampleMsgInfo,
                })

                // setTimeout(() => {
                //     // 恢复默认container
                //     message.config({
                //         getContainer: () => document.body as HTMLElement,
                //     })
                // }, 6000)
            } else {
                setSampleDataLoading(false)
                formatError(e, microWidgetProps?.components?.toast)
            }
        }
    }

    useEffect(() => {
        // 开启了及时性探查
        if (id && confTimeliness) {
            getProbeUpdateTime()
        }
    }, [id, confTimeliness])

    const getProbeUpdateTime = async () => {
        try {
            const res = await getBusinessUpdateTime(id)
            const time = res?.business_update_time
            const fieldInfo = {
                field_id: res?.field_id,
                field_business_name: res?.field_business_name,
            }
            if (time) {
                const { isTime, date } = isValidTime(time)
                if (isTime) {
                    const timeStr = isTime ? date : ''
                    const year = new Date(timeStr).getFullYear()
                    const month = new Date(timeStr).getMonth() + 1
                    const day = new Date(timeStr).getDate()
                    const hms = moment(timeStr).format('LTS')
                    setProbeTime({
                        date,
                        year,
                        month: month < 10 ? `0${month}` : month,
                        day: day < 10 ? `0${day}` : day,
                        hms,
                    })
                }
            }
        } catch (err) {
            // formatError(err)
        }
    }

    // 及时性评分
    const timelinessScore = useMemo(() => {
        let score: any = null
        const { business_update_time } = viewInfo || {}
        if (business_update_time) {
            score = moment()
                .startOf('day')
                .diff(moment(business_update_time).startOf('day'), 'days')
            return max([100 - score, 0])
        }
        return score
    }, [viewInfo])

    useUpdateEffect(() => {
        // 样例数据跟权限有关，跟ai无关,合成数据跟权限无关，跟ai有关
        // 切换radio，若数据为空则重新获取
        if (
            (sampleOption === SampleOptionValue.Sample &&
                isEmpty(sampleData)) ||
            (sampleOption === SampleOptionValue.Synthetic && isEmpty(synthData))
        ) {
            getSampleData()
        }
    }, [sampleOption])

    const getRadarMapData = (pass: boolean) => {
        const itemList = [
            {
                item: __('准确性'),
                score: getScore(
                    exploreReportData?.overview?.accuracy_score,
                    false,
                ),
            },
            {
                item: __('完整性'),
                score: getScore(
                    exploreReportData?.overview?.completeness_score,
                    false,
                ),
            },
            // {
            //     item: __('一致性'),
            //     score: getScore(
            //         exploreReportData?.overview?.consistency_score,
            //         false,
            //     ),
            // },
            {
                item: __('规范性'),
                score: getScore(
                    exploreReportData?.overview?.standardization_score,
                    false,
                ),
            },
            {
                item: __('唯一性'),
                score: getScore(
                    exploreReportData?.overview?.uniqueness_score,
                    false,
                ),
            },
            {
                item: __('及时性'),
                score: pass ? 100 : confTimeliness ? 0 : null,
            },
        ]
        setRadarMapData(itemList)
    }

    const onSampleOptionChange = (e) => {
        const { value } = e?.target || {}
        setSampOrSynthError('')
        setSampleOption(value)
    }

    const dataQualityEmpty = (desc: string) => {
        return <Empty iconSrc={dataEmpty} desc={desc} />
    }

    const fieldsEmpty = (desc?: string, iconSrc?: any) => {
        // if (sampOrSynthError !==VIEWERRORCODElIST.VIEWDATAEMPTYERRCODE) {
        //     // 加载失败
        //     return (
        //         <Empty
        //             iconSrc={iconSrc || dataEmpty}
        //             desc={
        //                 <Space direction="vertical" align="center" size={8}>
        //                     <div>{__('加载失败')}</div>
        //                     <div>
        //                         <a onClick={() => getSampleData(viewInfo?.viewId)}>
        //                             {__('重新加载')}
        //                         </a>
        //                     </div>
        //                 </Space>
        //             }
        //         />
        //     )
        // }

        if (sampOrSynthError) {
            if (sampOrSynthError === VIEWERRORCODElIST.VIEWDATAEMPTYERRCODE) {
                // 源表无任何数据信息，导致合成数据为空时
                return (
                    <Empty
                        iconSrc={dataEmpty}
                        desc={__('库表数据为空，不能生成合成数据')}
                    />
                )
            }
            // 加载失败
            return (
                <Empty
                    iconSrc={iconSrc || dataEmpty}
                    desc={
                        <Space direction="vertical" align="center" size={8}>
                            <div>{__('加载失败')}</div>
                            <div>
                                <a onClick={() => getSampleData()}>
                                    {__('重新加载')}
                                </a>
                            </div>
                        </Space>
                    }
                />
            )
        }

        return <Empty iconSrc={iconSrc || dataEmpty} desc={desc} />
    }

    const renderParamsInfo = (info: any) => {
        const { key, options } = info
        const text = viewInfo?.[key]
        if (key === 'description') {
            return (
                <Expand
                    content={text || '--'}
                    expandTips={
                        <span className={styles.expBtn}>
                            {__('展开')}
                            <DownOutlined className={styles.expIcon} />
                        </span>
                    }
                    collapseTips={
                        <span className={styles.expBtn}>
                            {__('收起')}
                            <UpOutlined className={styles.expIcon} />
                        </span>
                    }
                />
            )
        }
        if (key === 'business_update_time') {
            return <TimeRender formViewId={id} />
        }
        if (options?.length) {
            return options?.find((o) => o.value === text)?.label || '--'
        }

        return text || '--'
    }

    /**
     *
     * @param _fields 字段（包含名称、类型等）
     * @param _fieldsData 字段数据（样例数据/合成数据）
     * @returns
     */
    const renderSampleFields = (_fields, _fieldsData) => {
        if (
            sampOrSynthError &&
            ![
                VIEWERRORCODElIST.VIEWDATAEMPTYERRCODE,
                VIEWERRORCODElIST.VIEWTABLEFIELD,
            ].includes(sampOrSynthError)
        ) {
            return fieldsEmpty()
        }
        return (
            <>
                {sampleOption === SampleOptionValue.Synthetic && (
                    <div className={styles.synthDataInfo}>
                        {__(
                            '合成数据由 AI 生成，不能作为真实数据使用，仅供参考。',
                        )}
                    </div>
                )}
                {_fields?.map((fItem) => (
                    <div key={fItem.id} className={styles.fieldItemWrapper}>
                        <div className={styles.fieldsHeader}>
                            {getFieldTypeEelment(
                                {
                                    type: fItem.data_type,
                                },
                                18,
                            )}
                            <div
                                className={styles.fieldTitle}
                                title={fItem.business_name || '--'}
                            >
                                {fItem.business_name || '--'}
                            </div>
                            {fItem.primary_key && (
                                <div className={styles.isPrimary}>
                                    {__('主键')}
                                </div>
                            )}
                        </div>
                        <div
                            className={styles.desc}
                            title={fItem.technical_name || '--'}
                        >
                            {fItem.technical_name || '--'}
                        </div>
                        {/* <div className={styles.sampleData}>
                            <div className={styles.sampleDataTitle}>
                                {sampleOption === SampleOptionValue.Sample
                                    ? __('样例数据：')
                                    : __('合成数据：')}
                            </div>
                            <div className={styles.sampleDataTags}>
                                {(sampleOption ===
                                    SampleOptionValue.Synthetic ||
                                    isOwnedFullReadPermis ||
                                    fItem?.is_readable) &&
                                _fieldsData?.[fItem.technical_name]?.length ? (
                                    _fieldsData?.[fItem.technical_name]?.map(
                                        (sItem, sIdx) => {
                                            return (
                                                <div
                                                    key={sIdx}
                                                    className={styles.sampleTag}
                                                    title={sItem}
                                                >
                                                    {sItem}
                                                </div>
                                            )
                                        },
                                    )
                                ) : (
                                    <span>
                                        {sampOrSynthError ===
                                        VIEWERRORCODElIST.VIEWTABLEFIELD
                                            ? __(
                                                  '库表存在与源表不一致的字段，无法查看',
                                              )
                                            : sampleOption ===
                                              SampleOptionValue.Sample
                                            ? isOwnedFullReadPermis ||
                                              fItem?.is_readable
                                                ? __('暂无数据')
                                                : __('无权限查看')
                                            : __('库表数据为空，不生成')}
                                    </span>
                                )}
                            </div>
                        </div> */}
                    </div>
                ))}
            </>
        )
    }

    useEffect(() => {
        // 同步收藏状态
        if (
            selectedResc?.service_info?.is_favored !== viewInfo?.is_favored ||
            selectedResc?.service_info?.favor_id !== viewInfo?.favor_id
        ) {
            setViewInfo({
                ...viewInfo,
                is_favored: selectedResc?.is_favored,
                favor_id: selectedResc?.favor_id,
            })
        }
    }, [selectedResc])

    /** 收藏 */
    const handleFavoriteAdd = ({
        is_favored,
        favor_id,
    }: UpdateFavoriteParams) => {
        setViewInfo({
            ...viewInfo,
            is_favored,
            favor_id,
        })
        onAddFavorite({ is_favored, favor_id })
    }

    /** 取消收藏 */
    const handleFavoriteCancel = ({
        is_favored,
        favor_id,
    }: UpdateFavoriteParams) => {
        setViewInfo({
            ...viewInfo,
            is_favored,
            favor_id,
        })
        onCancelFavorite({ is_favored, favor_id })
    }

    return (
        <div
            className={styles.logicViewCardWrapper}
            ref={cardRef}
            id={logicViewCardId}
        >
            <CustomDrawer
                open={open}
                destroyOnClose
                loading={loading || sampleDataLoading}
                onCancel={onClose}
                onClose={() => onClose()}
                handleOk={onSure}
                // headerWidth="calc(100% - 40px)"
                isShowHeader={false}
                isShowFooter={false}
                customBodyStyle={{
                    flexDirection: 'column',
                    height: '100%',
                }}
                // className={bodyClassName}
                bodyStyle={{
                    // width: 417,
                    padding: 0,
                    // flexDirection: 'column',
                }}
                style={{
                    position: 'relative',
                    // width: 417,
                    right: '0',
                    height: '100%',
                }}
                {...cardProps}
                // customBodyStyle={{ height: 'calc(100% - 125px)' }}
                // title={viewInfo?.service_name || '--'}
            >
                <div hidden={!loading}>
                    <Loader />
                </div>
                <div className={styles.viewHeaderWrapper} hidden={loading}>
                    <div
                        className={styles.viewTitle}
                        title={viewInfo?.business_name || '--'}
                    >
                        {icon}
                        {viewInfo?.business_name || '--'}
                    </div>
                    <Space size={4} className={styles.headerBtnWrapper}>
                        {/* {(isOwner || canAuth) &&
                            [
                                OnlineStatus.ONLINE,
                                OnlineStatus.DOWN_AUDITING,
                                OnlineStatus.DOWN_REJECT,
                            ].includes(viewInfo?.online_status) &&
                            (isShowRequestPath ||
                                isMicroWidget({
                                    microWidgetProps,
                                })) && (
                                <Tooltip
                                    title={__('资源授权')}
                                    placement="bottom"
                                >
                                    <FontIcon
                                        name="icon-shouquan"
                                        type={FontIconType.FONTICON}
                                        className={classnames(
                                            styles.permissionIcon,
                                        )}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setAccessOpen(true)
                                        }}
                                    />
                                </Tooltip>
                            )} */}
                        {/* {permisAuditPolicy &&
                            !isOwner &&
                            (isShowRequestPath ||
                                isMicroWidget({
                                    microWidgetProps,
                                })) && (
                                <Tooltip
                                    title={
                                        [
                                            OnlineStatus.ONLINE,
                                            OnlineStatus.DOWN_AUDITING,
                                            OnlineStatus.DOWN_REJECT,
                                        ].includes(viewInfo?.online_status)
                                            ? __('权限申请')
                                            : __(
                                                  '该库表未发布或未上线，无法进行权限申请',
                                              )
                                    }
                                    placement="bottom"
                                >
                                    <FontIcon
                                        name="icon-quanxianshenqing1"
                                        type={FontIconType.FONTICON}
                                        className={classnames(
                                            styles.permissionIcon,
                                            ![
                                                OnlineStatus.ONLINE,
                                                OnlineStatus.DOWN_AUDITING,
                                                OnlineStatus.DOWN_REJECT,
                                            ].includes(
                                                viewInfo?.online_status,
                                            ) && styles.disablePermission,
                                        )}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            if (
                                                ![
                                                    OnlineStatus.ONLINE,
                                                    OnlineStatus.DOWN_AUDITING,
                                                    OnlineStatus.DOWN_REJECT,
                                                ].includes(
                                                    viewInfo?.online_status,
                                                )
                                            )
                                                return
                                            setPermissionRequestOpen(true)
                                        }}
                                    />
                                </Tooltip>
                            )} */}
                        <PermisApplyBtn
                            id={id}
                            type={DataRescType.LOGICALVIEW}
                            isOnline={[
                                OnlineStatus.ONLINE,
                                OnlineStatus.DOWN_AUDITING,
                                OnlineStatus.DOWN_REJECT,
                            ].includes(viewInfo?.online_status)}
                            isOwner={isOwner}
                            onApplyPermisClick={(flag?: boolean) =>
                                setPermissionRequestOpen(true)
                            }
                        />
                        {/* <Tooltip
                                    title={__('跳转后台')}
                                    placement="bottom"
                                    getPopupContainer={(n) => n}
                                    overlayClassName={styles.toolTipWrapper}
                                >
                                    <FontIcon
                                        name="icon-tiaozhuan1"
                                        className={styles.linkModIcon}
                                        onClick={() => {
                                            window.open(
                                                getActualUrl(
                                                    `/datasheet-view?tab=${viewInfo?.type}&viewCode=${viewInfo?.uniform_catalog_code}`,
                                                ),
                                            )
                                        }}
                                    />
                                </Tooltip> */}
                        {/* <Tooltip
                            title={
                                hasDownloadPermission
                                    ? __('下载任务')
                                    : hasBusinessRoles
                                    ? __('无下载权限，请联系数据Owner进行授权')
                                    : __('角色权限不足，不能进行下载')
                            }
                            overlayClassName={styles.toolTip}
                            placement="bottom"
                        >
                            <FontIcon
                                name="icon-xiazai"
                                className={classnames(
                                    styles.downloadIcon,
                                    (!hasDownloadPermission ||
                                        !hasOwnedRoles) &&
                                        styles.disableDownload,
                                )}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    if (
                                        !hasDownloadPermission ||
                                        !hasOwnedRoles
                                    )
                                        return
                                    if (onDownload) {
                                        onDownload()
                                    } else {
                                        setDownloadVisible(true)
                                    }
                                }}
                            />
                        </Tooltip> */}
                        {/* 引用资源提问按钮 */}
                        {/* {!inAssetPanorama &&
                            hasBusinessRoles &&
                            [
                                OnlineStatus.ONLINE,
                                OnlineStatus.DOWN_AUDITING,
                                OnlineStatus.DOWN_REJECT,
                            ].includes(viewInfo?.online_status) && (
                                <Tooltip
                                    placement="bottom"
                                    title={chatTip('normal', allowChat)}
                                >
                                    <FontIcon
                                        name="icon-yinyong1"
                                        className={classnames(
                                            styles.chatIcon,
                                            (!allowChat || !llm) &&
                                                styles.disableChat,
                                        )}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            if (!allowChat || !llm) return
                                            updateParams(
                                                CogAParamsType.Resource,
                                                {
                                                    data: [
                                                        {
                                                            id,
                                                            name: viewInfo.business_name,
                                                            type: AssetType.LOGICVIEW,
                                                        },
                                                    ],
                                                    op: 'add',
                                                    event: e,
                                                },
                                            )
                                            onOpenAssistant()
                                        }}
                                    />
                                </Tooltip>
                            )} */}
                        <FavoriteOperation
                            item={{
                                ...viewInfo,
                                id,
                            }}
                            className={styles.favoriteIcon}
                            resType={ResType.DataView}
                            disabled={!isOnline || !isPublished}
                            disabledTooltip={getDisabledTooltip({
                                isOnline,
                                isPublished,
                                action: 'favorite',
                            })}
                            onAddFavorite={handleFavoriteAdd}
                            onCancelFavorite={handleFavoriteCancel}
                        />
                        <FeedbackOperation
                            item={{
                                ...viewInfo,
                                id,
                            }}
                            resType={ResType.DataView}
                            className={styles.favoriteIcon}
                            disabled={!isOnline || !isPublished}
                            disabledTooltip={getDisabledTooltip({
                                isOnline,
                                isPublished,
                                action: 'feedback',
                            })}
                        />
                        <Tooltip title={__('进入全屏')} placement="bottom">
                            <FontIcon
                                name="icon-zhankai1"
                                className={styles.fullScreenIcon}
                                onClick={() => {
                                    message.destroy()
                                    onFullScreen(
                                        onDownload ? isOwner : undefined,
                                    )
                                }}
                            />
                        </Tooltip>
                        <Tooltip title={__('关闭')} placement="bottom">
                            <CloseOutlined
                                className={styles.closeIcon}
                                onClick={onClose}
                            />
                        </Tooltip>
                    </Space>
                </div>
                <div
                    className={styles.viewContentWrapper}
                    ref={viewContentRef}
                    hidden={loading}
                >
                    <div className={styles.viewBasicInfoWrapper}>
                        <Space
                            direction="vertical"
                            wrap={false}
                            style={{ width: '100%' }}
                        >
                            <Row gutter={16}>
                                {viewCardBaiscInfoList?.map((info) => {
                                    const { key } = info
                                    const text = renderParamsInfo(info)
                                    const isDesc = key === 'description'
                                    const hasTimestamp = viewInfo?.fields?.some(
                                        (o) => o.business_timestamp,
                                    )
                                    return !hasTimestamp &&
                                        key ===
                                            'business_update_time' ? null : (
                                        <Col
                                            span={info.span || 12}
                                            key={info.key}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                marginTop: 10,
                                            }}
                                        >
                                            <>
                                                <span className={styles.label}>
                                                    {info?.label}
                                                </span>
                                                {info.key === 'owners' ? (
                                                    <span
                                                        className={styles.name}
                                                    >
                                                        <OwnerDisplay
                                                            value={
                                                                viewInfo?.[key]
                                                            }
                                                        />
                                                    </span>
                                                ) : (
                                                    <span
                                                        className={
                                                            isDesc
                                                                ? styles.desc
                                                                : styles.name
                                                        }
                                                        title={
                                                            isDesc
                                                                ? viewInfo?.[
                                                                      key
                                                                  ]
                                                                : isString(text)
                                                                ? text
                                                                : ''
                                                        }
                                                    >
                                                        {text}
                                                    </span>
                                                )}
                                            </>
                                        </Col>
                                    )
                                })}
                            </Row>
                        </Space>
                    </div>
                    <div ref={tabBarRef} className={styles.viewContentTab}>
                        <Tabs
                            activeKey={tabActiveKey}
                            onChange={(e) => setTabActiveKey(e)}
                            getPopupContainer={(node) => node}
                            tabBarGutter={32}
                            items={detailTabItems}
                            tabBarExtraContent={
                                showBackToTop && (
                                    <Button
                                        type="link"
                                        onClick={() => {
                                            const scrollableElement =
                                                viewContentRef?.current
                                            // 设置返回时带动画
                                            const timer = setInterval(() => {
                                                const top =
                                                    scrollableElement?.scrollTop
                                                scrollableElement?.scrollTo(
                                                    0,
                                                    top - top / 5,
                                                )
                                                if (top === 0) {
                                                    clearInterval(timer)
                                                }
                                            }, 30)
                                        }}
                                        className={styles.backToTop}
                                    >
                                        {__('返回顶部')}
                                    </Button>
                                )
                            }
                            destroyInactiveTabPane
                        />
                    </div>

                    <div className={styles.viewContent}>
                        {tabActiveKey === detailTabKey.sampleData &&
                            (viewInfo?.fields?.length ||
                            permisLoading ||
                            sampleDataLoading ? (
                                <div className={styles.sampleDataWrapper}>
                                    {hasDataOperRole ? undefined : (
                                        <div
                                            className={
                                                styles.sampleDataHeaderWrapper
                                            }
                                            style={{
                                                marginBottom:
                                                    isOwnedFullReadPermis
                                                        ? '16px'
                                                        : '',
                                            }}
                                        >
                                            {isOwnedFullReadPermis ? (
                                                <div
                                                    className={
                                                        styles.sampelDataTitle
                                                    }
                                                >
                                                    {__('字段样例数据')}
                                                </div>
                                            ) : (
                                                <Radio.Group
                                                    options={sampleOptions}
                                                    optionType="button"
                                                    onChange={
                                                        onSampleOptionChange
                                                    }
                                                    value={sampleOption}
                                                />
                                            )}
                                            <Tooltip
                                                title={
                                                    <div
                                                        className={
                                                            styles.infoTooltip
                                                        }
                                                    >
                                                        {isOwner ? (
                                                            <div
                                                                className={
                                                                    styles.sampleDataTipInfo
                                                                }
                                                            >
                                                                {__(
                                                                    '您是资源的数据Owner，可直接查看所有字段下的真实样例数据。',
                                                                )}
                                                            </div>
                                                        ) : isOwnedFullReadPermis ? (
                                                            <div
                                                                className={
                                                                    styles.sampleDataTipInfo
                                                                }
                                                            >
                                                                {__(
                                                                    '您有整个库表的权限，可直接查看所有字段下的真实样例数据。',
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div
                                                                    className={
                                                                        styles.sampleTitle
                                                                    }
                                                                >
                                                                    {__(
                                                                        '样例数据',
                                                                    )}
                                                                </div>
                                                                <div
                                                                    className={
                                                                        styles.sampleIntro
                                                                    }
                                                                >
                                                                    {__(
                                                                        '用户对数据有读取或下载权限的部分，可查看真实的样例数据。',
                                                                    )}
                                                                </div>
                                                                <div
                                                                    className={
                                                                        styles.sampleTitle
                                                                    }
                                                                >
                                                                    {__(
                                                                        '合成数据',
                                                                    )}
                                                                </div>
                                                                <div
                                                                    className={
                                                                        styles.sampleIntro
                                                                    }
                                                                >
                                                                    {__(
                                                                        '由 AI 生成，不能作为真实数据使用，仅供参考。数据权限不足时，可以通过查看合成数据来辅助判断是否要申请真实数据的权限。',
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                }
                                                color="#fff"
                                                overlayClassName={
                                                    styles.moreInfoTip
                                                }
                                                placement="bottomRight"
                                                // placement="bottom"
                                                getPopupContainer={(n) => n}
                                            >
                                                <InfotipOutlined
                                                    className={styles.infoIcon}
                                                />
                                            </Tooltip>
                                        </div>
                                    )}

                                    <div className={styles.fieldsWrapper}>
                                        {permisLoading || sampleDataLoading ? (
                                            <div
                                                style={{
                                                    margin: '96px 0',
                                                }}
                                            >
                                                <Loader />
                                            </div>
                                        ) : (
                                            renderSampleFields(
                                                viewInfo?.fields,
                                                sampleOption ===
                                                    SampleOptionValue.Sample
                                                    ? sampleData
                                                    : synthData,
                                            )
                                        )}
                                    </div>
                                </div>
                            ) : (
                                fieldsEmpty()
                            ))}
                        {tabActiveKey === detailTabKey.dataQuality && (
                            <div className={styles.dataQualityWrapper}>
                                <div className={styles.plotWrapper}>
                                    <div className={styles.plotTitleWrapper}>
                                        <Icon
                                            component={icon1}
                                            className={styles.icon}
                                        />
                                        <div className={styles.plotTitle}>
                                            {__('质量评分')}
                                        </div>
                                    </div>
                                    {dataQulityScore ? (
                                        <DashBoard
                                            dataInfo={dataQulityScore || 0}
                                            height={200}
                                            titleStyle={{
                                                fontWeight: '500',
                                                fontSize: '24px',
                                                color: 'rgba(0,0,0,0.65)',
                                                lineHeight: '24px',
                                            }}
                                            contentStyle={{
                                                fontSize: '16px',
                                                color: 'rgba(0,0,0,0.65)',
                                                lineHeight: '24px',
                                                marginTop: '-16px',
                                            }}
                                        />
                                    ) : (
                                        dataQualityEmpty(__('暂无质量评分'))
                                    )}
                                </div>
                                <div
                                    className={classnames(
                                        styles.plotWrapper,
                                        styles.radarWrapper,
                                    )}
                                >
                                    <div className={styles.plotTitleWrapper}>
                                        <Icon
                                            component={icon1}
                                            className={styles.icon}
                                        />
                                        <div className={styles.plotTitle}>
                                            {__('评分维度')}
                                        </div>
                                    </div>
                                    {typeof dataQulityScore !== 'number' ? (
                                        dataQualityEmpty(__('暂无评分维度'))
                                    ) : (
                                        <RadarMap
                                            dataInfo={radarMapData || []}
                                            height={204}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {tabActiveKey === detailTabKey.accessInfo && (
                            <div className={styles.accessInfoWrapper}>
                                <AccessView
                                    id={id}
                                    type={AssetTypeEnum.DataView}
                                />
                            </div>
                        )}
                    </div>
                </div>
                {downloadVisible && id && (
                    <div onClick={(e) => e.stopPropagation()}>
                        <DataDownloadConfig
                            formViewId={id || ''}
                            open={downloadVisible}
                            onClose={() => {
                                setDownloadVisible(false)
                            }}
                        />
                    </div>
                )}
            </CustomDrawer>
            {/* 资源授权  */}
            {accessOpen && (
                <AccessModal
                    id={id}
                    type={AssetTypeEnum.DataView}
                    onClose={(needRefresh) => {
                        setAccessOpen(false)
                        if (needRefresh) {
                            refreshPolicy()
                            initTableData()
                        }
                    }}
                />
            )}
            {/* 权限申请 */}
            {permissionRequestOpen && (
                <ApplyPolicy
                    id={id}
                    onClose={(needRefresh: boolean) => {
                        setPermissionRequestOpen(false)
                        // if (needRefresh) {
                        //     refreshAuditProcess()
                        // }
                    }}
                    type={AssetTypeEnum.DataView as string}
                />
            )}
        </div>
    )
}

export default memo(LogicViewCard)
