import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Divider, message, Rate, Space, Tooltip } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { noop } from 'lodash'
import { useNavigate } from 'react-router-dom'
import { useSize, useUnmount } from 'ahooks'
import moment from 'moment'
import { useQuery, getPlatformNumber } from '@/utils'
import {
    formatError,
    getDataCatalogMountFrontend,
    policyValidate,
    PolicyActionEnum,
    AssetTypeEnum,
    reqDataCatlgBasicInfo,
    getCatlgScoreSummary,
    ResType,
    LoginPlatform,
    HasAccess,
} from '@/core'
import styles from './styles.module.less'
import ContentTabs from './ContentTabs'
import {
    formatCatlgError,
    RescErrorCodeList,
    ServiceType,
    DataCatlgTabKey,
} from './helper'
import __ from './locale'
import Loader from '@/ui/Loader'
import Expand from '@/ui/Expand'
import CustomDrawer from '../CustomDrawer'
import { BusinObjOpr } from './const'
import { AppDataContentColored, CopyOutlined } from '@/icons'
import LogicViewDetail from './LogicViewDetail'
import { useCongSearchContext } from '../CognitiveSearch/CogSearchProvider'
import { PublishStatusTag, OnlineStatusTag } from './CatalogMoreInfo'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
    ResourceType,
    publishStatus,
    publishedList,
    upPublishedList,
    onLineStatus,
} from '../ResourcesDir/const'
import ApplicationServiceDetail from './ApplicationServiceDetail'
import FeedbackOperation from './FeedbackOperation'
import FavoriteOperation, {
    UpdateFavoriteParams,
} from '@/components/Favorite/FavoriteOperation'
import FileDetail from './FileInfoDetail'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import CityShareOperation from './CityShareOperation'
import Score from '../MyAssets/MyScore/Score'
import { copyToClipboard } from '../MyAssets/helper'
import CitySharingDrawer from '../CitySharing/CitySharingDrawer'
import { TimeRender } from './LogicViewDetail/helper'

/**
 * @param isIntroduced  该组件是否被引用，true：组件被引用到某页面中（如新建需求中，此时路由路径不变）， false：组件用作服务超市详情页
 */
interface IDataCatlgContent {
    open: boolean
    onClose: (dataCatlgCommonInfo?: any) => void
    // 默认显示tab页
    tabKey?: DataCatlgTabKey
    isIntroduced?: boolean
    assetsId?: string
    returnInDrawer?: () => void
    handleAssetBtnUpdate?: (type: BusinObjOpr, item: any, newItem?: any) => void
    errorCallback?: (error?: any) => void
    getContainer?: HTMLElement | false
    customBodyStyle?: React.CSSProperties | undefined
    style?: React.CSSProperties | undefined
    canChat?: boolean // 是否可以问答
    hasAsst?: boolean // 是否有认知助手
    zIndex?: number
}
// 页面路径中获取参数
const DataCatlgContent: React.FC<IDataCatlgContent> = ({
    open,
    onClose,
    tabKey,
    isIntroduced,
    assetsId,
    returnInDrawer,
    handleAssetBtnUpdate = noop,
    errorCallback = noop,
    getContainer = false,
    customBodyStyle,
    style,
    canChat = false,
    hasAsst = false,
    zIndex,
}) => {
    const { bigHeader } = useCongSearchContext()

    const [loading, setLoading] = useState(false)

    const query = useQuery()

    const id = query.get('id') || query.get('catalogId') || ''

    // 数据资源目录id--不能为空  如果参数中有assetsId就使用assetsId，否则使用页面路径id参数
    const [rescId, setRescId] = useState<string>('')

    // 库表id
    const [logicViewId, setLogicViewId] = useState<string>('')
    const [resourceId, setResourceId] = useState<string>('')
    // 库表详情open
    const [loginViewOpen, setLoginViewOpen] = useState(false)
    const [applicationServiceOpen, setApplicationServiceOpen] = useState(false)
    const [fileDetailOpen, setFileDetailOpen] = useState(false)

    const navigate = useNavigate()
    const [userId] = useCurrentUser('ID')
    const { checkPermission, checkPermissions } = useUserPermCtx()
    const [allowRead, setAllowRead] = useState<boolean>(false)
    const platform = getPlatformNumber()
    const hasBusinessRoles = useMemo(() => {
        return checkPermissions(HasAccess.isHasBusiness) ?? false
    }, [checkPermissions])

    // 目录共享申报
    const [applyCatalog, setApplyCatalog] = useState<any>()

    // useCogAsstContext 已移除，相关功能已下线

    const handleReturn = () => {
        if (returnInDrawer) {
            returnInDrawer()
        } else {
            onClose(dataCatlgCommonInfo)
        }
    }

    // 资源目录基本信息
    const [dataCatlgCommonInfo, setDataCatlgCommonInfo] =
        useState<any>(undefined)
    const [scoreInfo, setScoreInfo] = useState<any>({})

    const [scoreOpen, setScoreOpen] = useState(false)

    // 顶部ref
    const topRef = useRef<HTMLDivElement>(null)
    const topSize = useSize(topRef) || {
        width: document.body.clientWidth,
        height: document.body.clientHeight,
    }
    // 内容tab
    const tabRef: any = useRef()
    const [isRescExist, setIsRescExist] = useState<boolean>(false)

    // useEffect(() => {
    //     if (!resourceId) return
    //     checkRescIsExist(resourceId)
    // }, [resourceId])

    // const checkRescIsExist = async (rId: string) => {
    //     if (!rId) return
    //     let flag = true
    //     try {
    //         const resource_type = dataCatlgCommonInfo?.mountInfo?.resource_type
    //         if (resource_type === ResourceType.DataView) {
    //             await getDatasheetViewDetails(rId)
    //         } else if (resource_type === ResourceType.Api) {
    //             await detailFrontendServiceOverview(rId)
    //         } else if (resource_type === ResourceType.File) {
    //             await getFileCatalogDetail(rId)
    //         }
    //     } catch (e) {
    //         const errCode = e?.data?.code || ''
    //         if (
    //             [
    //                 'DataApplicationService.Service.ServiceIDNotExist',
    //                 'DataView.FormView.FormViewIdNotExist',
    //             ].includes(errCode)
    //         ) {
    //             flag = false
    //         } else {
    //             formatError(e)
    //         }
    //     } finally {
    //         setIsRescExist(flag)
    //     }
    // }

    const isOwnedRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermission])

    const handleError = (error?: any) => {
        const { code } = error?.data || {}

        // 资源下线-刷新列表（其他错误如服务器错误等，不刷新列表）
        if (code === RescErrorCodeList.ASSETSOFFLINEERROR) {
            onClose()
            errorCallback(error)
        }
    }

    // 收藏状态改变
    const handleFavoriteChange = (res: UpdateFavoriteParams) => {
        setDataCatlgCommonInfo({
            ...dataCatlgCommonInfo,
            is_favored: res?.is_favored,
            favor_id: res?.favor_id,
        })
    }

    const getDataCatlgCommonInfo = async (cId?: string, isUpdate?: boolean) => {
        if (!cId) return
        try {
            setLoading(true)

            const mountRes = await getDataCatalogMountFrontend(cId)
            const res = await reqDataCatlgBasicInfo(cId)
            const scoreInfoRes = await getCatlgScoreSummary([cId])
            const mountInfo = mountRes?.mount_resource
            const mountViewInfo = mountInfo?.find(
                (item) => item.resource_type === ResourceType.DataView,
            )
            const viewId = mountViewInfo?.resource_id || ''
            const viewInfo = {}
            try {
                if (viewId) {
                    // viewInfo = await getDatasheetViewDetails(viewId)
                    // const viewBusinTimeInfo = await getBusinessUpdateTime(
                    //     viewId,
                    // )
                    // viewInfo = {
                    //     // ...(viewInfo || {}),
                    //     ...(viewBusinTimeInfo || {}),
                    // }
                    setLogicViewId(viewId)
                }
            } catch (e) {
                // formatError(e)
            }
            setScoreInfo(
                scoreInfoRes?.[0] || {
                    catalog_id: cId,
                    average_score: 0,
                    count: 0,
                },
            )
            setDataCatlgCommonInfo({
                ...res,
                subject_domain_name: res?.subject_info?.map(
                    (item) => item.subject,
                ),
                logicView: {
                    // ...viewInfo,
                    id: viewId,
                },
                mountInfo,
                preview_count: res?.preview_count || 0,
                scoreInfo: scoreInfoRes?.[0] || {
                    catalog_id: cId,
                    average_score: 0,
                    count: 0,
                },
                mount_data_resources: mountRes?.mount_resource,
            })
            // setResourceId(mountInfo?.resource_id)

            // if (isUpdate) {
            // 根据审核策略不同,申请可能会被自动拒绝或其他情况
            // 获取最新权限值来设置按钮状态
            // handleAssetBtnUpdate(BusinObjOpr.DATADOWNLOAD, res, res)
            // }
        } catch (error) {
            // 需求申请中报错不进行路由跳转
            formatCatlgError(error, handleError)
            onClose()
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (dataCatlgCommonInfo) {
            // setScoreInfo(dataCatlgCommonInfo?.scoreInfo)
            const rescOwnerId = dataCatlgCommonInfo?.owner_id
            // 当前用户为资源owner或被授予权限，则可下载
            if (rescOwnerId && rescOwnerId === userId) {
                setAllowRead(true)
            } else {
                checkReadPermission(logicViewId)
            }
        }
    }, [dataCatlgCommonInfo])

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
            if (dataCatlgCommonInfo?.effect === 'allow') {
                setAllowRead(true)
            }
        } catch (error) {
            formatError(error)
        }
    }

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

    // 不适用路径参数时，使用props参数中的assetsId（资源Id）
    useEffect(() => {
        if (assetsId) {
            setRescId(assetsId || '')
        } else {
            setRescId(id)
        }
    }, [assetsId])

    useEffect(() => {
        if (open) {
            getDataCatlgCommonInfo(rescId)
        }
    }, [rescId, open])

    useUnmount(() => {
        // useCogAsstContext 已移除
    })

    const topMargin = useMemo(() => {
        if (topSize.width < 1280) {
            return '0 32px'
        }
        return '0 auto'
    }, [topSize.width])

    // const resourceClick = () => {
    //     recoverConAsstIndex()
    //     if (
    //         dataCatlgCommonInfo?.mountInfo?.resource_type ===
    //         ResourceType.DataView
    //     ) {
    //         setLoginViewOpen(true)
    //     } else if (
    //         dataCatlgCommonInfo?.mountInfo?.resource_type === ResourceType.Api
    //     ) {
    //         setApplicationServiceOpen(true)
    //     } else if (
    //         dataCatlgCommonInfo?.mountInfo?.resource_type === ResourceType.File
    //     ) {
    //         setFileDetailOpen(true)
    //     }
    // }

    // 是否能问答 - 认知助手功能已下线
    const canChatEnable = false

    // 是否能收藏和反馈
    const canFavorAndFeedback = useMemo(
        () =>
            [
                onLineStatus.Online,
                onLineStatus.OfflineAuditing,
                onLineStatus.OfflineReject,
            ].includes(dataCatlgCommonInfo?.online_status),
        [dataCatlgCommonInfo, platform],
    )

    const handleScoreOk = async () => {
        const res = await getCatlgScoreSummary([scoreInfo.catalog_id])
        setScoreInfo(res?.[0] || {})
        setScoreOpen(false)
    }

    return (
        <CustomDrawer
            open={open}
            isShowFooter={false}
            zIndex={zIndex}
            bodyStyle={{
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
            }}
            customHeaderStyle={{ display: 'none' }}
            customBodyStyle={
                customBodyStyle ||
                (isIntroduced
                    ? { height: '100%' }
                    : {
                          height: `calc(100% - ${styleTop}px)`,
                          borderTop: '1px solid rgb(0 0 0 / 10%)',
                      })
            }
            style={
                style ||
                (isIntroduced
                    ? {
                          position: 'absolute',
                          zIndex: 999,
                          width: 'calc(100% - 48px)',
                          height: 'calc(100% - 152px)',
                          top: 55,
                          margin: '0 24px 24px',
                      }
                    : {
                          position: 'fixed',
                          width: '100vw',
                          // height: 'calc(100vh - 64px)',
                          // top: '64px',
                          height: '100vh',
                          top: styleTop,
                      })
            }
            getContainer={getContainer}
        >
            <div
                className={classnames(
                    styles.assetsContentWrapper,
                    styles.businsAssetsContentWrapper,
                    returnInDrawer && styles.assetsContentInDrawerWrapper,
                )}
                hidden={loginViewOpen}
            >
                {loading && (
                    <div className={styles.assetsLoading}>
                        <Loader />
                    </div>
                )}

                <div
                    className={styles.top}
                    ref={topRef}
                    style={isIntroduced ? { border: 'none' } : undefined}
                    hidden={loading}
                >
                    <div
                        className={styles.topContent}
                        style={{ margin: topMargin }}
                    >
                        {/* <div> */}
                        <div className={styles.topInfo}>
                            <div className={styles.returnInfo}>
                                <LeftOutlined
                                    className={styles.returnArrow}
                                    onClick={handleReturn}
                                />
                                <div className={styles.rescInfoWrapper}>
                                    <div className={styles.rescIcon}>
                                        <AppDataContentColored
                                            className={styles.modelIcon}
                                        />
                                    </div>
                                    <div className={styles.rescInfoContent}>
                                        <div className={styles.rescTitleBox}>
                                            {isOwnedRole &&
                                            upPublishedList.includes(
                                                dataCatlgCommonInfo?.publish_status,
                                            ) ? (
                                                <PublishStatusTag
                                                    status={
                                                        dataCatlgCommonInfo?.publish_status
                                                    }
                                                    isFull
                                                />
                                            ) : null}
                                            {isOwnedRole &&
                                            [
                                                onLineStatus.UnOnline,
                                                onLineStatus.OnlineAuditing,
                                                onLineStatus.OnlineAuditingReject,
                                                onLineStatus.Offline,
                                                onLineStatus.OfflinelineAuditing,
                                                onLineStatus.OfflinelineReject,
                                            ].includes(
                                                dataCatlgCommonInfo?.online_status,
                                            ) &&
                                            publishedList.includes(
                                                dataCatlgCommonInfo?.publish_status,
                                            ) ? (
                                                <OnlineStatusTag
                                                    status={
                                                        dataCatlgCommonInfo?.online_status
                                                    }
                                                    isFull
                                                />
                                            ) : null}
                                            <div
                                                className={styles.rescTitle}
                                                title={
                                                    dataCatlgCommonInfo?.name ||
                                                    '--'
                                                }
                                            >
                                                {dataCatlgCommonInfo?.name ||
                                                    '--'}
                                            </div>
                                            <Tooltip
                                                placement="right"
                                                title="复制"
                                            >
                                                <CopyOutlined
                                                    style={{
                                                        fontSize: 16,
                                                        marginLeft: '4px',
                                                        color: 'rgba(0,0,0,0.85)',
                                                    }}
                                                    onClick={() => {
                                                        copyToClipboard(
                                                            dataCatlgCommonInfo?.name ||
                                                                '--',
                                                        )
                                                        message.success(
                                                            '复制成功',
                                                        )
                                                    }}
                                                />
                                            </Tooltip>
                                        </div>
                                        <div
                                            className={styles.rescTopOtherInfo}
                                        >
                                            <div
                                                className={styles.rescInfoItem}
                                            >
                                                <div
                                                    className={
                                                        styles.rescInfoItemTitle
                                                    }
                                                >
                                                    {__('编码：')}
                                                </div>
                                                <div
                                                    title={
                                                        dataCatlgCommonInfo?.code ||
                                                        '--'
                                                    }
                                                    className={styles.rescCode}
                                                >
                                                    {dataCatlgCommonInfo?.code ||
                                                        '--'}
                                                </div>
                                            </div>
                                            <Divider
                                                type="vertical"
                                                className={
                                                    styles.detlInfoDivider
                                                }
                                            />
                                            {/* <div
                                                className={styles.rescInfoItem}
                                            >
                                                <div
                                                    className={
                                                        styles.rescInfoItemTitle
                                                    }
                                                >
                                                    {__('申请量') + __('：')}
                                                </div>
                                                <div
                                                    title={
                                                        dataCatlgCommonInfo?.apply_num ||
                                                        0
                                                    }
                                                >
                                                    {dataCatlgCommonInfo?.apply_num ||
                                                        0}
                                                </div>
                                            </div> */}
                                            {/* <Divider
                                                type="vertical"
                                                className={
                                                    styles.detlInfoDivider
                                                }
                                            /> */}
                                            <div
                                                className={
                                                    styles.scoreContainer
                                                }
                                            >
                                                <Tooltip
                                                    title={__(
                                                        '综合评分 ${score} 共 ${count} 人评分',
                                                        {
                                                            score:
                                                                scoreInfo?.average_score ||
                                                                '0',
                                                            count:
                                                                scoreInfo?.count ||
                                                                '0',
                                                        },
                                                    )}
                                                    getPopupContainer={(n) => n}
                                                    placement="bottom"
                                                >
                                                    <div>{__('综合评分')}</div>
                                                </Tooltip>
                                                <Rate
                                                    value={
                                                        scoreInfo?.average_score ||
                                                        0
                                                    }
                                                    disabled
                                                />
                                                <span
                                                    className={styles.scoreText}
                                                >
                                                    {scoreInfo?.average_score ||
                                                        0}{' '}
                                                    &nbsp;
                                                    {__('共${count}人评分', {
                                                        count:
                                                            scoreInfo?.count ||
                                                            '0',
                                                    })}
                                                </span>
                                                {scoreInfo?.has_scored ? (
                                                    <span
                                                        className={
                                                            styles.scoredText
                                                        }
                                                    >
                                                        {__('已评价')}
                                                    </span>
                                                ) : (
                                                    <Button
                                                        type="link"
                                                        onClick={() =>
                                                            setScoreOpen(true)
                                                        }
                                                    >
                                                        {__('我要评分')}
                                                    </Button>
                                                )}
                                            </div>
                                            {/* <div
                                                className={styles.rescInfoItem}
                                            >
                                                <div
                                                    className={
                                                        styles.rescInfoItemTitle
                                                    }
                                                >
                                                    {dataCatlgCommonInfo
                                                        ?.mountInfo
                                                        ?.resource_type ===
                                                    ResourceType.DataView
                                                        ? __('库表：')
                                                        : dataCatlgCommonInfo
                                                              ?.mountInfo
                                                              ?.resource_type ===
                                                          ResourceType.Api
                                                        ? __('接口：')
                                                        : dataCatlgCommonInfo
                                                              ?.mountInfo
                                                              ?.resource_type ===
                                                          ResourceType.File
                                                        ? __('文件') + __('：')
                                                        : ''}
                                                </div>
                                            </div> */}
                                        </div>
                                    </div>
                                    <Space>
                                        {/* {hasBusinessRoles && canChat && (
                                            <Tooltip
                                                title={chatTipCatalog(
                                                    'detail',
                                                    [
                                                        onLineStatus.Online,
                                                        onLineStatus.OfflineAuditing,
                                                        onLineStatus.OfflineReject,
                                                    ].includes(
                                                        dataCatlgCommonInfo?.online_status,
                                                    ),
                                                    allowRead,
                                                    dataCatlgCommonInfo?.resource_type,
                                                )}
                                                placement="bottomRight"
                                                arrowPointAtCenter
                                            >
                                                <Button
                                                    disabled={!canChatEnable}
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        updateParams(
                                                            CogAParamsType.Resource,
                                                            {
                                                                data: [
                                                                    {
                                                                        id: rescId,
                                                                        name: dataCatlgCommonInfo.name,
                                                                        type: 'data_catalog',
                                                                    },
                                                                ],
                                                                op: 'add',
                                                                event: e,
                                                            },
                                                        )
                                                        onOpenAssistant(true)
                                                    }}
                                                >
                                                    <img
                                                        src={
                                                            canChatEnable
                                                                ? qaColored
                                                                : qa
                                                        }
                                                        alt=""
                                                        width="16px"
                                                        draggable={false}
                                                        style={{
                                                            marginRight: 8,
                                                        }}
                                                    />
                                                    {__('提问')}
                                                </Button>
                                            </Tooltip>
                                        )} */}
                                        {/* 反馈 */}
                                        {canFavorAndFeedback && (
                                            <FeedbackOperation
                                                type="button"
                                                catalog={{
                                                    id: rescId,
                                                    ...dataCatlgCommonInfo,
                                                }}
                                            />
                                        )}
                                        {/* 收藏 */}
                                        {canFavorAndFeedback && (
                                            <FavoriteOperation
                                                type="button"
                                                item={{
                                                    id: rescId,
                                                    ...dataCatlgCommonInfo,
                                                }}
                                                resType={ResType.DataCatalog}
                                                onAddFavorite={
                                                    handleFavoriteChange
                                                }
                                                onCancelFavorite={
                                                    handleFavoriteChange
                                                }
                                            />
                                        )}

                                        {/* 加入/移出共享清单+共享申请 */}
                                        {/* {[
                                            onLineStatus.Online,
                                            onLineStatus.OfflineAuditing,
                                            onLineStatus.OfflineReject,
                                        ].includes(
                                            dataCatlgCommonInfo?.online_status,
                                        ) &&
                                            platform === LoginPlatform.drmp && (
                                                <CityShareOperation
                                                    catalog={{
                                                        ...dataCatlgCommonInfo,
                                                        id: rescId,
                                                    }}
                                                    className={styles.icon}
                                                    disabledClassName={
                                                        styles.disableIcon
                                                    }
                                                    showClassName={
                                                        styles.showIcon
                                                    }
                                                    type="button"
                                                    onApply={(value) => {
                                                        setApplyCatalog(value)
                                                    }}
                                                    offset={[-2, 6]}
                                                />
                                            )} */}
                                    </Space>
                                </div>
                            </div>
                            {/* <AddAssetsToLibrary
                                item={dataCatlgCommonInfo}
                                downLoadTitleList={[
                                    {
                                        key: 'catlgList',
                                        label: (
                                            <span
                                                className={styles.returnPath}
                                                onClick={onClose}
                                            >
                                                {__('数据服务超市')}
                                            </span>
                                        ),
                                    },
                                    {
                                        key: 'catlgDetail',
                                        label: (
                                            <span className={styles.returnPath}>
                                                {__('数据目录详情')}
                                            </span>
                                        ),
                                    },
                                ]}
                                updateData={(type: BusinObjOpr) => {
                                    if (type === BusinObjOpr.DATADOWNLOAD) {
                                        getDataCatlgCommonInfo(rescId, true)
                                    } else {
                                        handleAssetBtnUpdate(
                                            type,
                                            dataCatlgCommonInfo,
                                        )
                                    }
                                }}
                                errorCallback={handleError}
                            /> */}
                        </div>

                        <div className={styles.rescOtherInfo}>
                            {/* <Space
                                className={styles.rescCountInfo}
                                align="center"
                                size={16}
                            >
                                {bsinsAbstractStaticsConfig?.map((sItem) => {
                                    const itemCount = isNumber(
                                        dataCatlgCommonInfo?.[sItem.key],
                                    )
                                        ? dataCatlgCommonInfo?.[sItem.key]
                                        : '--'
                                    return (
                                        <div
                                            className={styles.rescCountItem}
                                            key={sItem.key}
                                        >
                                            {sItem.icon}
                                            <div
                                                className={
                                                    styles.rescCountLabel
                                                }
                                            >
                                                {`${sItem.label}：${
                                                    isNumber(itemCount)
                                                        ? formatCount(itemCount)
                                                        : 0
                                                }`}
                                            </div>
                                        </div>
                                    )
                                })}
                            </Space> */}
                            <div className={styles.rescDescs}>
                                <div className={styles.rescItemLabel}>
                                    {__('描述：')}
                                </div>
                                <div className={styles.rescItemInfo}>
                                    {dataCatlgCommonInfo?.description ? (
                                        <Expand
                                            expandTips={__('展开')}
                                            content={
                                                dataCatlgCommonInfo?.description
                                            }
                                        />
                                    ) : (
                                        '--'
                                    )}
                                </div>
                            </div>
                            <div className={styles.moreInfo}>
                                {/* <CatalogMoreInfo
                                    infoData={{
                                        online_at:
                                            dataCatlgCommonInfo?.online_time,
                                        data_resource_type:
                                            dataCatlgCommonInfo?.resource_type,
                                        subject_domain_name:
                                            dataCatlgCommonInfo?.subject_domain_name?.join(
                                                '，',
                                            ),
                                        department: {
                                            node_path:
                                                dataCatlgCommonInfo?.department_path,
                                        },
                                        department_name:
                                            dataCatlgCommonInfo?.department,
                                        system_name:
                                            dataCatlgCommonInfo?.info_system,
                                        scoreInfo:
                                            dataCatlgCommonInfo?.scoreInfo,
                                        mount_data_resources:
                                            dataCatlgCommonInfo?.mount_data_resources,
                                    }}
                                    isNeedScore
                                />
                                <div className={styles.previewCount}>
                                    <FontIcon
                                        name="icon-fangwenliang"
                                        className={styles.icon}
                                    />
                                    {__('访问量：')}
                                    {dataCatlgCommonInfo?.preview_count}
                                </div> */}
                                <div className={styles.itemInfoLine}>
                                    <div
                                        className={classnames(
                                            styles.itemDetailInfo,
                                            styles.itemDetailProvider,
                                        )}
                                    >
                                        <span
                                            className={
                                                styles.itemDetailInfoTitle
                                            }
                                        >
                                            {__('目录提供方') + __('：')}
                                        </span>
                                        <span
                                            className={styles.score}
                                            title={
                                                dataCatlgCommonInfo?.department_path
                                            }
                                        >
                                            {dataCatlgCommonInfo?.department ||
                                                '--'}
                                        </span>
                                    </div>
                                    <Divider
                                        type="vertical"
                                        className={styles.detlInfoDivider}
                                    />

                                    <div
                                        className={classnames(
                                            styles.itemDetailInfo,
                                            styles.itemShowAllInfo,
                                        )}
                                    >
                                        <span
                                            className={
                                                styles.itemDetailInfoTitle
                                            }
                                        >
                                            {__('目录更新时间') + __('：')}
                                        </span>
                                        <span>
                                            {dataCatlgCommonInfo?.updated_at
                                                ? moment(
                                                      dataCatlgCommonInfo?.updated_at,
                                                  ).format('YYYY-MM-DD')
                                                : __('暂无')}
                                        </span>
                                    </div>
                                    <Divider
                                        type="vertical"
                                        className={styles.detlInfoDivider}
                                    />
                                    <div
                                        className={classnames(
                                            styles.itemDetailInfo,
                                            styles.itemShowAllInfo,
                                        )}
                                    >
                                        <span
                                            className={
                                                styles.itemDetailInfoTitle
                                            }
                                        >
                                            {__('数据更新时间') + __('：')}
                                        </span>
                                        <span>
                                            {/* {dataCatlgCommonInfo?.logicView
                                                ?.business_update_time
                                                ? moment(
                                                      dataCatlgCommonInfo
                                                          ?.logicView
                                                          ?.business_update_time,
                                                  ).format('YYYY-MM-DD')
                                                : __('暂无')} */}
                                            <TimeRender
                                                formViewId={logicViewId}
                                            />
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {/* <Space
                                className={styles.rescCountInfo}
                                align="center"
                                size={16}
                            >
                                {bsinsAbstractStaticsConfig?.map((sItem) => {
                                    const itemCount = isNumber(
                                        dataCatlgCommonInfo?.[sItem.key],
                                    )
                                        ? dataCatlgCommonInfo?.[sItem.key]
                                        : '--'
                                    return (
                                        <div
                                            className={styles.rescCountItem}
                                            key={sItem.key}
                                        >
                                            {sItem.icon}
                                            <div
                                                className={
                                                    styles.rescCountLabel
                                                }
                                            >
                                                {`${sItem.label}：${
                                                    isNumber(itemCount)
                                                        ? formatCount(itemCount)
                                                        : 0
                                                }`}
                                            </div>
                                        </div>
                                    )
                                })}
                            </Space> */}
                            {/* <div className={styles.rescOrgName}>
                                <div className={styles.rescItemLabel}>
                                    {__('英文：')}
                                </div>
                                <div
                                    title={
                                        dataCatlgCommonInfo?.name_en || '--'
                                    }
                                    className={styles.rescItemCon}
                                >
                                    {dataCatlgCommonInfo?.name_en || '--'}
                                </div>
                            </div> */}
                        </div>
                    </div>
                    {/* <Divider className={styles.topDivider} /> */}
                </div>
                <div
                    className={classnames(styles.bottom)}
                    hidden={loading}
                    style={isIntroduced ? { background: '#fff' } : undefined}
                >
                    <ContentTabs
                        ref={tabRef}
                        id={rescId || ''}
                        catlgCommonInfo={dataCatlgCommonInfo}
                        tabKey={tabKey}
                        serviceType={ServiceType.APPLICATIONSERVICE}
                        errorCallback={handleError}
                    />
                </div>
            </div>
            {scoreOpen && (
                <Score
                    catlgItem={{ ...(scoreInfo || {}) }}
                    open={scoreOpen}
                    onCancel={() => setScoreOpen(false)}
                    onOk={handleScoreOk}
                    isFirstScore
                />
            )}
            {logicViewId && loginViewOpen && (
                <LogicViewDetail
                    open={loginViewOpen}
                    onClose={() => {
                        setLoginViewOpen(false)
                    }}
                    id={logicViewId}
                    isIntroduced
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        top: '52px',
                        borderTop: '1px solid rgb(0 0 0 / 10%)',
                        zIndex: 1001,
                    }}
                    hasAsst={hasAsst}
                />
            )}
            {applicationServiceOpen && resourceId && (
                <ApplicationServiceDetail
                    open={applicationServiceOpen}
                    onClose={() => {
                        setApplicationServiceOpen(false)
                    }}
                    serviceCode={resourceId}
                    hasAsst={hasAsst}
                />
            )}
            {/* 文件信息抽屉 */}
            {resourceId && fileDetailOpen && (
                <FileDetail
                    open={fileDetailOpen}
                    onClose={() => {
                        setFileDetailOpen(false)
                    }}
                    id={resourceId}
                    isIntroduced
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        top: '52px',
                        borderTop: '1px solid rgb(0 0 0 / 10%)',
                        zIndex: 1001,
                    }}
                    hasAsst={hasAsst}
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
        </CustomDrawer>
    )
}

export default DataCatlgContent
