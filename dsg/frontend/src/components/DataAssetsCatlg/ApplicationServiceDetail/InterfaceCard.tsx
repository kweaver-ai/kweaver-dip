import { memo, useEffect, useState, useContext, useMemo } from 'react'
import Icon, { DownOutlined, UpOutlined } from '@ant-design/icons'
import { message, Space, Row, Col, Table, Tooltip, Tabs } from 'antd'
import { isNumber, noop } from 'lodash'
import classnames from 'classnames'
import CustomDrawer from '@/components/CustomDrawer'
import { CloseOutlined, FontIcon, FullScreenOutlined } from '@/icons'
import { ReactComponent as paramsIcon } from '@/assets/DataAssetsCatlg/params.svg'
import styles from './styles.module.less'
import __ from '../locale'
import { Expand, Loader } from '@/ui'
import {
    AssetTypeEnum,
    detailFrontendServiceOverview,
    formatError,
    OnlineStatus,
    PublishStatus,
    isMicroWidget,
    PolicyActionEnum,
    ResType,
} from '@/core'
import JSONCodeView from '@/ui/JSONCodeView'
import {
    getRequestParamExample,
    interfaceCardParamsInfoList,
    InterfaceContentTabs,
    InterfaceContentType,
    publishStatus,
    onlineStatus,
    getDisabledTooltip,
} from './helper'

import { MicroWidgetPropsContext } from '@/context'
import { getInnerUrl } from '@/utils'
import AuthInfo from '@/components/MyAssets/AuthInfo'
import AccessModal from '@/components/AccessPolicy/AccessModal'
import { IconType as FontIconType } from '@/icons/const'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useAuditProcess } from '@/hooks/useAuditProcess'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

import { BizType, PolicyType } from '@/components/AuditPolicy/const'
import ApplyPolicy from '@/components/AccessPolicy/ApplyPolicy'
import AccessInterface from '@/components/AccessPolicy/components/AccessDetail/AccessInterface'
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
            <Icon component={paramsIcon} className={styles.label} />
            <div className={styles.tilte}>{title}</div>
        </div>
    )
}

const serviceParamColumns = [
    {
        title: __('中文名称'),
        dataIndex: 'cn_name',
        key: 'cn_name',
        width: 88,
        render: (text) => (
            <div className={styles.tableTrContainer} title={text || ''}>
                <div className={styles.itemTitle}>{text || '--'}</div>
            </div>
        ),
    },
    {
        title: __('英文名称'),
        dataIndex: 'en_name',
        key: 'en_name',
        width: 88,
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
        // width: '10%',
        ellipsis: true,
        width: 60,
        render: (text) => text || '--',
    },
    {
        title: __('是否必填'),
        dataIndex: 'required',
        key: 'required',
        width: 88,
        ellipsis: true,
        render: (text) =>
            text === 'yes' ? '必填' : text === 'no' ? '非必填' : '--',
    },
    {
        title: __('描述'),
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
        // width: '40%',
        render: (text) => text || '--',
    },
]

interface IOperaionModelType {
    open?: boolean
    item?: any
    interfaceId: string
    cardProps?: Record<string, any>
    // operate: OperateType
    // 是否允许显示调用信息
    allowInvoke?: boolean
    allowChat?: boolean // 问答
    showOwner?: boolean // 是否显示Owner
    onFullScreen: () => void
    onClose: (flag?: boolean) => void
    onSure: () => void
    inAssetPanorama?: boolean // 在资产全景中
    // 添加收藏
    onAddFavorite?: ({ is_favored, favor_id }: UpdateFavoriteParams) => void
    // 取消收藏
    onCancelFavorite?: ({ is_favored, favor_id }: UpdateFavoriteParams) => void
    // 选中资源
    selectedResc?: any
}

const InterfaceCard = ({
    open,
    // operate,
    item,
    interfaceId,
    cardProps,
    allowInvoke = false,
    allowChat = false,
    onFullScreen,
    onClose,
    onSure,
    inAssetPanorama = false,
    showOwner = true,
    onAddFavorite = noop,
    onCancelFavorite = noop,
    selectedResc,
}: IOperaionModelType) => {
    const [userInfo] = useCurrentUser()
    const [loading, setLoading] = useState<boolean>(false)
    const [{ using }] = useGeneralConfig()
    const [title, setTitle] = useState('资源实体title')
    const [applicationInfo, setApplicationInfo] = useState<any>(null)
    const [isApply, setIsApply] = useState<boolean>(false)
    const [accessOpen, setAccessOpen] = useState<boolean>(false)
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    // useCogAsstContext 已移除，相关功能已下线

    const [activeKey, setActiveKey] = useState<InterfaceContentType>(
        InterfaceContentType.PARAM_ATTR,
    )

    const { checkPermission } = useUserPermCtx()

    const appDeveloper = useMemo(
        () => checkPermission('manageIntegrationApplication'),
        [checkPermission],
    )

    // 授权申请
    const [permissionRequestOpen, setPermissionRequestOpen] =
        useState<boolean>(false)

    const { allowedActions, refreshPolicy } = usePolicyCheck(
        interfaceId,
        AssetTypeEnum.Api,
        {
            toast: microWidgetProps?.components?.toast,
        },
    )
    // const [hasAuditProcess, refreshAuditProcess] = useAuditProcess({
    //     audit_type: PolicyType.AssetPermission,
    //     service_type: BizType.AuthService,
    // })

    const isShowRequestPath = ['/data-assets', '/congnitive-search'].includes(
        getInnerUrl(window.location.pathname),
    )

    const [authInfoOpen, setAuthInfoOpen] = useState<boolean>(false)

    useEffect(() => {
        if (open) {
            initApplicationInfo()
        }
    }, [interfaceId, open])

    const initApplicationInfo = async () => {
        if (interfaceId) {
            try {
                setLoading(true)
                const data = await detailFrontendServiceOverview(interfaceId)
                setApplicationInfo(data)
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
                        onClose()
                        formatError(error, microWidgetProps?.components?.toast)
                }
            } finally {
                setLoading(false)
            }
        }
    }

    // 对应资源模式下，发布状态或上线状态
    const isPubOrOnline = useMemo(() => {
        const { service_info } = applicationInfo || {}
        const status =
            // (using === 1 &&
            publishStatus.includes(service_info?.publish_status) ||
            // )
            // (using === 2 &&
            onlineStatus.includes(service_info?.status)
        // )

        return status
    }, [applicationInfo])

    // 具备授权权限
    const canAuth = useMemo(() => {
        return (
            [PolicyActionEnum.Allocate, PolicyActionEnum.Auth].some((o) =>
                (allowedActions || []).includes(o),
            ) || applicationInfo?.service_info?.can_auth
        )
    }, [allowedActions, applicationInfo?.service_info?.can_auth])

    const isOwner = useMemo(() => {
        return (
            userInfo?.ID &&
            applicationInfo?.service_info?.owners?.some(
                (owner) => owner.owner_id === userInfo?.ID,
            )
        )
    }, [applicationInfo, userInfo])

    const renderParamsInfo = (info: any) => {
        const { key, subKey, unit } = info
        let text = applicationInfo?.[key]?.[subKey]
        if (subKey === 'service_path') {
            text =
                !applicationInfo?.service_info?.gateway_url &&
                !applicationInfo?.service_info?.service_path
                    ? '--'
                    : `${applicationInfo?.service_info?.gateway_url}${applicationInfo?.service_info?.service_path}`
        } else if (
            ['protocol', 'http_method', 'return_type'].includes(subKey)
        ) {
            text = text?.toLocaleUpperCase()
        } else if (subKey === 'rate_limiting') {
            text = text === 0 ? __('不限制') : text ? `${text} ${unit}` : '--'
        } else if (subKey === 'timeout') {
            text = isNumber(text) ? `${text} ${unit}` : '--'
        }

        return text || '--'
    }

    /**
     * 参数信息模板
     * @returns
     */
    const getParamAttrTemplate = () => {
        return (
            <div>
                <div className={styles.paramBasicInfo}>
                    <Space
                        direction="vertical"
                        wrap={false}
                        style={{ width: '100%' }}
                    >
                        <Row gutter={16}>
                            {interfaceCardParamsInfoList?.map((info) => {
                                const text = renderParamsInfo(info)

                                return (
                                    <Col
                                        span={info.span || 12}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            marginTop: 10,
                                        }}
                                    >
                                        <span className={styles.label}>
                                            {info?.label}
                                        </span>
                                        <span
                                            className={styles.name}
                                            title={text}
                                        >
                                            {text}
                                        </span>
                                    </Col>
                                )
                            })}
                        </Row>
                    </Space>
                </div>
                {applicationInfo?.service_param?.data_table_request_params
                    ?.length ? (
                    <div
                        className={styles.paramsContent}
                        id="param-info-request"
                    >
                        <div className={styles.title}>{__('请求参数')}</div>
                        <div className={styles.table}>
                            <Table
                                columns={serviceParamColumns}
                                dataSource={
                                    applicationInfo.service_param
                                        .data_table_request_params
                                }
                                pagination={false}
                            />
                        </div>
                    </div>
                ) : null}

                {applicationInfo?.service_test?.request_example && (
                    <div
                        className={styles.paramsContent}
                        id="param-info-request-example"
                    >
                        <div className={styles.title}>{__('请求示例')}</div>
                        {getRequestParamExample(
                            applicationInfo?.service_info?.http_method,
                            applicationInfo,
                        )}
                    </div>
                )}
                {applicationInfo?.service_param?.data_table_response_params
                    ?.length ? (
                    <div
                        className={styles.paramsContent}
                        id="param-info-response"
                    >
                        <div className={styles.title}>{__('返回参数')}</div>
                        <div className={styles.table}>
                            <Table
                                columns={serviceParamColumns
                                    .filter(
                                        (currentData) =>
                                            currentData.key !== 'required',
                                    )
                                    ?.map((o) => ({
                                        ...o,
                                        width:
                                            o.key === 'data_type'
                                                ? '80px'
                                                : o.width,
                                    }))}
                                dataSource={
                                    applicationInfo.service_param
                                        .data_table_response_params
                                }
                                pagination={false}
                            />
                        </div>
                    </div>
                ) : null}

                {applicationInfo?.service_test?.response_example ? (
                    <div
                        className={styles.paramsContent}
                        id="param-info-response-example"
                    >
                        <div className={styles.title}>{__('返回示例')}</div>
                        <JSONCodeView
                            code={
                                applicationInfo?.service_test?.response_example
                            }
                            className={styles.codeBox}
                        />
                    </div>
                ) : null}
            </div>
        )
    }

    /**
     * 内容模板
     * @param key
     * @returns
     */
    const getContentTemplate = (key: InterfaceContentType) => {
        switch (key) {
            case InterfaceContentType.PARAM_ATTR:
                return getParamAttrTemplate()
            case InterfaceContentType.AUTH_POLICY:
                return (
                    <div className={styles.paramBasicInfo}>
                        <AccessInterface
                            id={interfaceId}
                            type={AssetTypeEnum.Api}
                        />
                    </div>
                )
            default:
                return null
        }
    }

    // 更新选中资源
    useEffect(() => {
        if (
            selectedResc?.service_info?.is_favored !==
                applicationInfo?.service_info?.is_favored ||
            selectedResc?.service_info?.favor_id !==
                applicationInfo?.service_info?.favor_id
        ) {
            setApplicationInfo({
                ...applicationInfo,
                service_info: {
                    ...applicationInfo?.service_info,
                    is_favored: selectedResc?.is_favored,
                    favor_id: selectedResc?.favor_id,
                },
            })
        }
    }, [selectedResc])

    /**
     * 添加收藏
     */
    const handleFavoriteAdd = ({
        is_favored,
        favor_id,
    }: UpdateFavoriteParams) => {
        // 更新收藏状态
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

    /**
     * 取消收藏
     */
    const handleFavoriteCancel = ({
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

    return (
        <div className={styles.interfaceCardWrapper}>
            <CustomDrawer
                open={open}
                destroyOnClose
                loading={loading}
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
                // title={applicationInfo?.service_name || '--'}
            >
                {loading ? (
                    <Loader />
                ) : (
                    <>
                        <div className={styles.interfaceHeaderWrapper}>
                            <div
                                className={styles.interfaceTitle}
                                title={
                                    applicationInfo?.service_info
                                        ?.service_name || '--'
                                }
                            >
                                {applicationInfo?.service_info?.service_name ||
                                    '--'}
                            </div>
                            <Space size={4} className={styles.headerBtnWrapper}>
                                {/* <Tooltip
                                    title={__('跳转后台')}
                                    placement="bottom"
                                    getPopupContainer={(n) => n}
                                >
                                    <FontIcon
                                        name="icon-tiaozhuan1"
                                        className={styles.itemOprIcon}
                                        onClick={() => {
                                            window.open(
                                                getActualUrl(
                                                    `/dataService/interfaceService?serviceCode=${applicationInfo?.service_info?.service_code}`,
                                                ),
                                            )
                                        }}
                                    />
                                </Tooltip> */}
                                {/* {hasAuditProcess &&
                                    !isOwner &&
                                    appDeveloper &&
                                    (isShowRequestPath ||
                                        isMicroWidget({
                                            microWidgetProps,
                                        })) &&
                                    using === 2 && (
                                        <Tooltip
                                            title={__('为集成应用申请权限')}
                                            placement="bottom"
                                        >
                                            <FontIcon
                                                name="icon-quanxianshenqing1"
                                                className={classnames(
                                                    styles.itemOprIcon,
                                                )}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    setPermissionRequestOpen(
                                                        true,
                                                    )
                                                }}
                                            />
                                        </Tooltip>
                                    )} */}

                                <PermisApplyBtn
                                    id={interfaceId}
                                    type={DataRescType.INTERFACE}
                                    isOnline={onlineStatus.includes(
                                        applicationInfo?.service_info?.status,
                                    )}
                                    isOwner={isOwner}
                                    onApplyPermisClick={(flag?: boolean) =>
                                        setPermissionRequestOpen(true)
                                    }
                                />

                                {(isOwner || canAuth) &&
                                    isPubOrOnline &&
                                    using === 2 && (
                                        <Tooltip
                                            title={__('资源授权')}
                                            placement="bottom"
                                            overlayClassName={
                                                styles.toolTipWrapper
                                            }
                                        >
                                            <FontIcon
                                                name="icon-shouquan"
                                                type={FontIconType.FONTICON}
                                                className={classnames(
                                                    styles.itemOprIcon,
                                                )}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    setAccessOpen(true)
                                                }}
                                            />
                                        </Tooltip>
                                    )}
                                {isPubOrOnline && (
                                    <FavoriteOperation
                                        item={{
                                            ...applicationInfo?.service_info,
                                            id: interfaceId,
                                        }}
                                        className={styles.itemOprIcon}
                                        resType={ResType.InterfaceSvc}
                                        // disabled={!isPubOrOnline}
                                        disabledTooltip={getDisabledTooltip({
                                            applicationInfo,
                                            action: 'favorite',
                                        })}
                                        onAddFavorite={handleFavoriteAdd}
                                        onCancelFavorite={handleFavoriteCancel}
                                    />
                                )}
                                {isPubOrOnline && (
                                    <FeedbackOperation
                                        item={{
                                            ...applicationInfo?.service_info,
                                            id: interfaceId,
                                        }}
                                        resType={ResType.InterfaceSvc}
                                        // disabled={!isPubOrOnline}
                                        disabledTooltip={getDisabledTooltip({
                                            applicationInfo,
                                            action: 'feedback',
                                        })}
                                        className={styles.itemOprIcon}
                                    />
                                )}
                                {/* <Tooltip
                                    title={
                                        allowInvoke
                                            ? __('调用信息')
                                            : __(
                                                  '无调用权限，请联系数据Owner进行授权',
                                              )
                                    }
                                    overlayClassName={styles.toolTipWrapper}
                                    placement="bottom"
                                    // getPopupContainer={(n) => n}
                                >
                                    <InterfaceOutlined
                                        className={classnames(
                                            styles.itemOprIcon,
                                            !allowInvoke &&
                                                styles.itemOprDiabled,
                                        )}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            if (!allowInvoke) return
                                            setAuthInfoOpen(true)
                                        }}
                                    />
                                </Tooltip> */}
                                {/* 引用资源提问按钮 */}
                                {/* {!inAssetPanorama && (
                                    <Tooltip
                                        placement="bottom"
                                        title={
                                            allowChat
                                                ? chatTip
                                                : __(
                                                      '无读取权限，不能对当前资源提问',
                                                  )
                                        }
                                        // getPopupContainer={(n) => n}
                                    >
                                        <FontIcon
                                            name="icon-yinyong1"
                                            className={classnames(
                                                styles.itemOprIcon,
                                                (!allowChat || !llm) &&
                                                    styles.itemOprDiabled,
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
                                                                id: interfaceId,
                                                                name: applicationInfo
                                                                    ?.service_info
                                                                    ?.service_name,
                                                                type: AssetType.INTERFACESVC,
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
                                <Tooltip
                                    title={__('进入全屏')}
                                    placement="bottom"
                                    getPopupContainer={(n) => n}
                                >
                                    <FullScreenOutlined
                                        className={styles.fullScreenIcon}
                                        onClick={onFullScreen}
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
                        <div className={styles.interfaceContentWrapper}>
                            <div id="basic-info">
                                <div className={styles.basicContent}>
                                    <Space
                                        direction="vertical"
                                        wrap={false}
                                        style={{ width: '100%' }}
                                    >
                                        <Row gutter={16}>
                                            <Col
                                                span={24}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    marginTop: 10,
                                                }}
                                            >
                                                <span className={styles.label}>
                                                    {__('编码：')}
                                                </span>
                                                <span className={styles.name}>
                                                    {applicationInfo
                                                        ?.service_info
                                                        ?.service_code || '--'}
                                                </span>
                                            </Col>
                                            {/* {showOwner && (
                                                <Col
                                                    span={24}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        marginTop: 10,
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
                                                </Col>
                                            )} */}
                                            <Col
                                                span={24}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    marginTop: 10,
                                                }}
                                            >
                                                <span className={styles.label}>
                                                    {__('描述：')}
                                                </span>
                                                <span
                                                    className={styles.desc}
                                                    title={
                                                        applicationInfo
                                                            ?.service_info
                                                            ?.description ||
                                                        '--'
                                                    }
                                                >
                                                    <Expand
                                                        content={
                                                            applicationInfo
                                                                ?.service_info
                                                                ?.description ||
                                                            '--'
                                                        }
                                                        expandTips={
                                                            <span
                                                                className={
                                                                    styles.expBtn
                                                                }
                                                            >
                                                                {__('展开')}
                                                                <DownOutlined
                                                                    className={
                                                                        styles.expIcon
                                                                    }
                                                                />
                                                            </span>
                                                        }
                                                        collapseTips={
                                                            <span
                                                                className={
                                                                    styles.expBtn
                                                                }
                                                            >
                                                                {__('收起')}
                                                                <UpOutlined
                                                                    className={
                                                                        styles.expIcon
                                                                    }
                                                                />
                                                            </span>
                                                        }
                                                    />
                                                </span>
                                            </Col>
                                        </Row>
                                    </Space>
                                </div>
                            </div>
                            <div
                                id="param-info"
                                className={styles.paramsInfoWrapper}
                            >
                                <Tabs
                                    activeKey={activeKey}
                                    items={InterfaceContentTabs}
                                    onChange={(key) =>
                                        setActiveKey(
                                            key as InterfaceContentType,
                                        )
                                    }
                                    tabBarGutter={32}
                                    className={styles.viewContentTab}
                                />
                                <div className={styles.viewContentAttrWrapper}>
                                    {getContentTemplate(activeKey)}
                                </div>
                            </div>
                        </div>
                    </>
                )}
                {/* 资源授权  */}
                {accessOpen && (
                    <AccessModal
                        id={applicationInfo?.service_info?.service_id}
                        type={AssetTypeEnum.Api}
                        onClose={(needRefresh) => {
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
                            //     refreshAuditProcess()
                            // }
                        }}
                        type={AssetTypeEnum.Api as string}
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
            </CustomDrawer>
        </div>
    )
}

export default memo(InterfaceCard)
