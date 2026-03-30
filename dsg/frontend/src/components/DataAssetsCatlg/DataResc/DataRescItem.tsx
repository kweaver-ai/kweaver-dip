import React, { memo, useState, useMemo, useContext } from 'react'
import { Tooltip, Space } from 'antd'
import moment from 'moment'
import { RightOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { noop, toNumber, has } from 'lodash'
import { FontIcon } from '@/icons'
import { IconType as FontIconType } from '@/icons/const'
import AuthInfo from '@/components/MyAssets/AuthInfo'
import styles from './styles.module.less'
import {
    DataRescType,
    UnpublishedStatusList,
    getPublishStatus,
    OfflineStatusList,
} from '../ApplicationService/helper'
import __ from './locale'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getInnerUrl, getPlatformNumber } from '@/utils'
import ApplyPolicy from '@/components/AccessPolicy/ApplyPolicy'
import { CogAParamsType, MicroWidgetPropsContext } from '@/context'
import {
    AssetTypeEnum,
    PublishStatus,
    isMicroWidget,
    ObjectionTypeEnum,
    OnlineStatus,
    ResType,
    LoginPlatform,
    ShareApplyResourceTypeEnum,
    HasAccess,
    PolicyActionEnum,
} from '@/core'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import AccessModal from '@/components/AccessPolicy/AccessModal'
import { DataRescTypeMap, getDataRescTypeIcon, getOtherInfo } from './helper'
import ApplyChooseModal from '@/components/ResourceSharing/Apply/ApplyChooseModal'
import { CreateObjection } from '@/components/ObjectionMgt'
import FavoriteOperation, {
    UpdateFavoriteParams,
} from '@/components/Favorite/FavoriteOperation'
import FeedbackOperation from '@/components/FeedbackResMode/operate/FeedbackOperation'
import { serviceTypeList } from '../Interface/helper'
import AddDataset from '@/components/Dataset/AddDataset'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import CityShareOperation from '../CityShareOperation'
import OprDropDown from '../DataCatalog/OprDropDown'
import { DCatlgOprType } from '../DataCatalog/const'
import CitySharingDrawer from '@/components/CitySharing/CitySharingDrawer'
import { dataAssetsIndicatorPath } from '@/components/DataAssetsIndicator/const'
import { policyCacheManager } from '@/hooks/usePolicyCheck'

export const renderOtherInfo = (
    item,
    _type: DataRescType,
    relateRescType?: string[],
    otherInfoParams?: string[],
) => {
    const { type } = item
    let otherInfo
    if (otherInfoParams?.length) {
        otherInfo = getOtherInfo(otherInfoParams)
    } else {
        switch (_type) {
            case DataRescType.LOGICALVIEW:
            case DataRescType.INTERFACE:
            case DataRescType.INDICATOR:
                otherInfo = getOtherInfo([
                    'subject_domain_name',
                    'department_name',
                ])
                break
            case DataRescType.PROVINCE_DATACATLG:
                otherInfo = getOtherInfo([
                    'department_name',
                    'relate_resc_type',
                ])
                break
            case DataRescType.LICENSE_CATLG:
                otherInfo = getOtherInfo([
                    'license_type',
                    'department_name',
                ]).map((infoItem) => {
                    return {
                        ...infoItem,
                        toolTipTitle:
                            infoItem.key === 'department_name'
                                ? (text) =>
                                      `${__('管理部门：${text}', {
                                          text: text || '--',
                                      })}`
                                : infoItem.toolTipTitle,
                    }
                })
                break
            default:
                break
        }
    }

    return otherInfo?.map((infoItem) => {
        const { infoKey, infoRawKey, icon, toolTipTitle } = infoItem
        const tipContent = item[infoKey]
        let content = item[infoRawKey]
        // if (
        //     type === DataRescType.PROVINCE_DATACATLG &&
        //     infoRawKey === 'relate_resc_type'
        // ) {
        //     const rescLabelList =
        //         relateRescType?.map((rKey) => PrvcCatlgRescTypeList[rKey]) || []
        //     content = rescLabelList.join('、')
        //     tipContent = content
        // } else
        if (infoRawKey === 'api_type') {
            content = serviceTypeList?.find(
                (sItem) => sItem.value === content,
            )?.label
        }
        return (
            <div
                className={styles.itemOtherInfo}
                style={{
                    maxWidth: `calc(100% / ${otherInfo?.length || 1})`,
                }}
            >
                <Tooltip
                    title={
                        <div
                            dangerouslySetInnerHTML={{
                                __html: toolTipTitle?.(
                                    tipContent || content || '--',
                                ),
                            }}
                        />
                    }
                    className={styles.toolTip}
                >
                    <div className={styles.icon}>{icon}</div>
                    <div
                        className={styles.infoContent}
                        dangerouslySetInnerHTML={{
                            __html: content || '--',
                        }}
                    />
                </Tooltip>
            </div>
        )
    })
}

// 数据资源项
interface IDataRescListItem {
    id: string
    code?: string
    raw_code?: string
    name: string
    raw_name: string
    owner_id: string
    owner_name?: string
    type: DataRescType
    fields?: Array<{
        field_name_zh?: string
        raw_field_name_zh?: string
        field_name_en?: string
        raw_field_name_en?: string
    }>
    description?: string
    raw_description?: string
    published_at?: number
    online_at?: number
    updated_at?: number
    subject_domain_id?: string
    subject_domain_name?: string
    raw_subject_domain_name?: string
    subject_domain_path?: string
    raw_subject_domain_path?: string
    department_id?: string
    department_name?: string
    raw_department_name?: string
    department_path?: string
    raw_department_path?: string
    is_publish?: boolean
    is_online?: boolean
    // 省级目录-资源状态，1：生效中，0：已撤销，上报无需传
    status?: '1' | '0'
    // 发布状态
    published_status?: string
    // 上线状态
    online_status?: string
    has_permission?: boolean
    // 指标-字段数量
    field_count: number
    // 用户有哪些动作的权限
    actions?: string[]
    indicator_type?: string
    // 资源关联类型，如库表、接口、文件
    relateRescType?: string[]
    api_type?: string
    owners?: { owner_id?: string; owner_name?: string }[]
    // 是否设置了启用内置策略
    hasInnerEnablePolicy?: boolean
    // 是否同类型资源有启用策略
    hasCustomEnablePolicy?: boolean
    // hasAuditEnablePolicy 为true：资源设置了启用策略，可申请权限申请
    hasAuditEnablePolicy?: boolean
    // 是否具备授权权限
    can_auth?: boolean
}

interface IDataRescItem {
    item: IDataRescListItem
    fieldKeys?: any
    otherInfoParams?: Array<string>
    // 当前列表是否在按关键词搜索
    isSearchingByKeyword?: boolean
    isCongSearch?: boolean
    // 列表选中项
    selectedResc?: any
    // 关闭详情弹窗
    onClose?: () => void
    // 点击确认 申请API 弹窗
    confirmApplyApplication?: () => void
    onItemClick: (e: any) => void
    onNameClick?: (e: any) => void
    onItemBtnClick?: (e: any) => void
    onGraphClick?: (e: any) => void
    // 是否拥有数据运营工程师
    hasDataOperRole?: boolean
    // 是否启用了权限申请审核流程
    hasAuditProcess?: boolean
    // 是否显示右侧卡片
    showCard?: boolean
    // 过滤dropdown操作按钮支持列表
    filterOperationList?: string[]
    refreshAuditProcess?: () => void
    handleRefresh?: () => void
    // 是否为省级目录
    inProvinceDataCatlg?: boolean
    // 添加收藏
    onAddFavorite?: ({ is_favored, favor_id }: UpdateFavoriteParams) => void
    // 取消收藏
    onCancelFavorite?: ({ is_favored, favor_id }: UpdateFavoriteParams) => void
    // 是否显示类型文本
    showTypeText?: boolean
}

const DataRescItem: React.FC<IDataRescItem> = ({
    item,
    fieldKeys,
    otherInfoParams,
    isSearchingByKeyword,
    isCongSearch,
    selectedResc = {},
    onClose = noop,
    confirmApplyApplication = noop,
    onItemClick = noop,
    onNameClick = noop,
    onItemBtnClick = noop,
    onGraphClick,
    hasDataOperRole = false,
    // 当前资源是否启用
    hasAuditProcess = false,
    refreshAuditProcess,
    handleRefresh,
    inProvinceDataCatlg = false,
    onAddFavorite = noop,
    showCard,
    filterOperationList,
    showTypeText = true,
    onCancelFavorite = noop,
}: IDataRescItem) => {
    const [userId] = useCurrentUser('ID')
    const [{ using, cssjj }] = useGeneralConfig()

    const [authInfoOpen, setAuthInfoOpen] = useState<boolean>(false)
    // 资源授权
    const [accessOpen, setAccessOpen] = useState<boolean>(false)
    // 授权申请
    const [permissionRequestOpen, setPermissionRequestOpen] =
        useState<boolean>(false)
    // 资源共享申请
    const [shareApplyOpen, setShareApplyOpen] = useState<boolean>(false)
    // 纠错
    const [objectionOpen, setObjectionOpen] = useState<boolean>(false)
    // 授权申请
    // useCogAsstContext 已移除，相关功能已下线
    const { checkPermission, checkPermissions } = useUserPermCtx()
    const appDeveloper = useMemo(
        () => checkPermission('manageIntegrationApplication'),
        [checkPermission],
    )
    const platform = getPlatformNumber()

    // 目录共享申报
    const [applyCatalog, setApplyCatalog] = useState<any>()

    const {
        name,
        raw_name,
        type,
        fields,
        raw_description,
        description,
        raw_subject_domain_name,
        subject_domain_name,
        subject_domain_path,
        raw_subject_domain_path,
        department_name,
        raw_department_path,
        department_path,
        updated_at,
        online_at,
        published_at,
        is_publish,
        status,
        has_permission = false,
        is_online,
        online_status = '',
        actions,
        relateRescType = [],
        // 是否设置了启用内置策略
        hasInnerEnablePolicy = false,
        // 是否同类型资源有启用策略
        hasCustomEnablePolicy = false,
        // item.hasAuditEnablePolicy 为true：当前资源设置了启用策略（内置启用或启用自定义策略选了当前资源），可申请权限申请
        hasAuditEnablePolicy,
    } = item

    // 权限申请按钮显示
    const isAccessBtnShowByPolicy =
        hasInnerEnablePolicy || hasCustomEnablePolicy
    // 权限申请按钮禁用(无内置启用&无启用并绑定该资源的自定义策略)，其中上线逻辑之前的规则迁移过来的
    const isAccessBtnDisableByPolicy = !(
        hasInnerEnablePolicy || hasAuditEnablePolicy
    )

    const { microWidgetProps } = useContext(MicroWidgetPropsContext)

    const hasBusinessRoles = useMemo(
        () => checkPermissions(HasAccess.isHasBusiness),
        [checkPermissions],
    )
    // 是否是资源owner，启用包含特殊情况用户是应用开发者，但之前被赋予了owner角色并将资源owner设置为当前用户
    const hasOwnedRoles = useMemo(
        () => checkPermissions(HasAccess.isOwner),
        [checkPermissions],
    )

    // 对应资源模式下，发布状态或上线状态
    const isPubOrOnline =
        (using === 1 && item.is_publish) || (using === 2 && item.is_online)

    const published_status = getPublishStatus(item.published_status || '')

    // 未发布
    const notPub = UnpublishedStatusList.includes(
        item.published_status as PublishStatus,
    )
    // 未上线
    const notOnlineStatus = OfflineStatusList.includes(
        online_status as OnlineStatus,
    )
    const notOnline = !is_online

    const isShowRequestPath = [
        '/data-assets',
        '/cognitive-search',
        dataAssetsIndicatorPath,
    ].includes(getInnerUrl(window.location.pathname))

    const isPublishedByRule = !(
        (has(item, 'is_publish') && item.is_publish === false) ||
        (has(item, 'published_status') && notPub)
    )

    const isOnlineByRule = !(
        (has(item, 'is_online') && item.is_online === false) ||
        (has(item, 'online_status') && notOnlineStatus)
    )

    const disabled = useMemo(() => {
        return !(isPublishedByRule && isOnlineByRule)
    }, [isPublishedByRule, isOnlineByRule])

    // 获取禁用提示信息
    const getDisabledTooltip = ({
        action,
    }: {
        action: 'favorite' | 'feedback'
    }) => {
        // 如果未发布，提示未发布
        if (!isPublishedByRule) {
            return action === 'favorite'
                ? __('资源未发布，不能进行收藏')
                : __('资源未发布，不能进行反馈')
        }

        // 如果未上线，提示未上线
        if (!isOnlineByRule) {
            return action === 'favorite'
                ? __('资源未上线，不能进行收藏')
                : __('资源未上线，不能进行反馈')
        }

        return ''
    }

    // 具备授权权限
    const canAuth = useMemo(() => {
        return (
            [PolicyActionEnum.Allocate, PolicyActionEnum.Auth].some((o) =>
                (item?.actions || []).includes(o),
            ) || item?.can_auth
        )
    }, [item?.actions, item?.can_auth])

    const isOwner = useMemo(() => {
        return (
            userId && item?.owners?.some((owner) => owner.owner_id === userId)
        )
    }, [item, userId])

    // 是否可以引用资源问答
    // const canResChat = useMemo(() => {
    //     if (item?.type === DataRescType.INTERFACE) {
    //         return false
    //     }
    //     const readPermission = isOwner || actions?.includes('read')
    //     const online = is_online
    //     if (readPermission && online) {
    //         return true
    //     }
    //     return false
    // }, [isOwner, llm, item])

    /**
     *  获取字段Label
     * @param _type  数据类型
     * @param count 总数
     * @returns
     */
    const getFieldLabelData = (_type: DataRescType, count = 0) => {
        switch (_type) {
            case DataRescType.LOGICALVIEW:
                return __('字段(${count}):', {
                    count: (count || 0).toString(),
                })
            case DataRescType.INTERFACE:
                return __('出参字段(${count}):', {
                    count: (count || 0).toString(),
                })
            case DataRescType.INDICATOR:
                return __('分析维度:')
            case DataRescType.PROVINCE_DATACATLG:
            case DataRescType.LICENSE_CATLG:
                return __('信息项：')
            default:
                return ''
        }
    }

    // 资源类型转换
    const transformResType = (itemType: string) => {
        switch (itemType) {
            case DataRescType.LICENSE_CATLG:
                return ResType.ElecLicenceCatalog
            case 'data_view':
                return ResType.DataView
            case 'interface_svc':
                return ResType.InterfaceSvc
            case 'indicator':
                return ResType.Indicator
            default:
                return ResType.DataView
        }
    }

    // 是否显示收藏按钮
    const showFavoriteBtn = useMemo(() => {
        // 电子证照
        if (item.type === DataRescType.LICENSE_CATLG) {
            return [
                OnlineStatus.ONLINE,
                OnlineStatus.DOWN_AUDITING,
                OnlineStatus.DOWN_REJECT,
            ].includes(item?.online_status as OnlineStatus)
        }
        // 接口
        if (item.type === DataRescType.INTERFACE) {
            return item?.is_online && item?.is_publish
        }
        return false
    }, [item.type, item.online_status])

    // 是否显示反馈按钮
    const showFeedbackBtn = useMemo(() => {
        // 接口
        if (item.type === DataRescType.INTERFACE) {
            return item?.is_online && item?.is_publish
        }
        return false
    }, [item.type, item.is_online, item.is_publish])

    // 是否显示共享申请按钮
    const showShareApplyBtn = useMemo(() => {
        // 将原来的判断操作按钮显示隐藏的逻辑平移至OprDropDown组件内，逻辑未动
        return (
            (item.is_online &&
                item.api_type === 'service_register' &&
                platform === LoginPlatform.drmp) ||
            (isAccessBtnShowByPolicy &&
                !isOwner &&
                (isShowRequestPath || isMicroWidget({ microWidgetProps })) &&
                (item?.type === DataRescType.LOGICALVIEW ||
                    (item?.type === DataRescType.INTERFACE && appDeveloper)) &&
                !cssjj)
        )
    }, [
        item,
        platform,
        isAccessBtnShowByPolicy,
        isOwner,
        isShowRequestPath,
        isMicroWidget,
        microWidgetProps,
        cssjj,
        appDeveloper,
    ])

    return (
        <>
            <div
                key={item.id}
                className={classnames(
                    styles.rescItem,
                    selectedResc?.id === item.id && styles.selRescItem,
                )}
                onClick={onItemClick}
            >
                <div className={styles.rescItemContent}>
                    <div className={styles.nameContent}>
                        {getDataRescTypeIcon({
                            type: item.type,
                            indicator_type: item.indicator_type,
                            showTypeText,
                        })}
                        <div className={styles.nameWrapper}>
                            {hasDataOperRole &&
                                [
                                    DataRescType.LOGICALVIEW,
                                    DataRescType.INTERFACE,
                                    DataRescType.INDICATOR,
                                ].includes(item.type) &&
                                (notPub || notOnline) && (
                                    // <Tooltip
                                    //     title={
                                    //         notPub
                                    //             ? __('未发布${text}', {
                                    //                   text: published_status
                                    //                       ? `（${published_status}）`
                                    //                       : '',
                                    //               })
                                    //             : __('未上线')
                                    //     }
                                    //     placement="bottom"
                                    //     color="#fff"
                                    //     overlayInnerStyle={{
                                    //         color: 'rgba(0 0 0 / 65%)',
                                    //     }}
                                    //     overlayStyle={{
                                    //         paddingTop: '4px',
                                    //     }}
                                    //     getPopupContainer={(n) => n}
                                    // >
                                    <div className={styles.publishState}>
                                        {notPub ? __('未发布') : __('未上线')}
                                    </div>
                                    // </Tooltip>
                                )}
                            {/* <div
                            title={name}
                            className={styles.name}
                            dangerouslySetInnerHTML={{
                                __html: name,
                            }}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setSelectedResc(item)
                                if (type === DataRescType.LOGICALVIEW) {
                                    setViewDetailOpen(true)
                                } else if (
                                    type === DataRescType.INTERFACE
                                ) {
                                    setInterfaceDetailOpen(true)
                                }
                            }}
                        /> */}
                            <div className={styles.nameContent}>
                                <div className={styles.name}>
                                    <div
                                        title={raw_name}
                                        className={styles.nameArea}
                                        dangerouslySetInnerHTML={{
                                            __html: name,
                                        }}
                                        onClick={onNameClick}
                                    />
                                </div>
                                {isCongSearch && (
                                    <span
                                        className={styles.recDetail}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onGraphClick?.(item)
                                        }}
                                    >
                                        <div>{__('推荐详情')}</div>
                                        <RightOutlined
                                            style={{ fontSize: '14px' }}
                                        />
                                    </span>
                                )}
                                {type === DataRescType.PROVINCE_DATACATLG &&
                                    status?.toString() === '0' && (
                                        <div className={styles.cancelStatus}>
                                            {__('已撤销')}
                                        </div>
                                    )}
                            </div>
                        </div>

                        {inProvinceDataCatlg && (
                            <div className={styles.sszdNameBtn}>
                                <div
                                    className={styles.provOprItem}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setShareApplyOpen(true)
                                    }}
                                >
                                    <FontIcon
                                        name="icon-shenqing1"
                                        type={FontIconType.COLOREDICON}
                                        className={classnames(
                                            styles.provOprItem_icon,
                                        )}
                                    />
                                    <span>{__('申请')}</span>
                                </div>
                                <div
                                    className={styles.provOprItem}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setObjectionOpen(true)
                                    }}
                                >
                                    <FontIcon
                                        name="icon-jiucuo"
                                        type={FontIconType.COLOREDICON}
                                        className={classnames(
                                            styles.provOprItem_icon,
                                        )}
                                    />
                                    <span>{__('纠错')}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    {[
                        DataRescType.LOGICALVIEW,
                        DataRescType.INTERFACE,
                        DataRescType.INDICATOR,
                        DataRescType.DATA_RESC_CATLG,
                    ].includes(item.type) && (
                        <div
                            title={raw_description || '--'}
                            className={styles.description}
                            dangerouslySetInnerHTML={{
                                __html: `${
                                    item.type === DataRescType.INDICATOR
                                        ? __('指标定义：')
                                        : __('描述：')
                                }${item.description || '--'}`,
                            }}
                        />
                    )}
                    <div className={styles.filedInfoWrapper}>
                        <div className={styles.fieldTitle}>
                            {getFieldLabelData(
                                item.type as DataRescType,
                                item?.field_count || item?.fields?.length || 0,
                            )}
                        </div>
                        <Space size={4} className={styles.fieldTagWrapper}>
                            {fields?.length
                                ? fields?.slice(0, 4)?.map((fItem: any) => {
                                      const {
                                          [fieldKeys?.nameCn]: nameCn,
                                          [fieldKeys?.rawNameCn]: rawNameCn,
                                          [fieldKeys?.nameEn]: nameEn,
                                          [fieldKeys?.rawNameEn]: rawNameEn,
                                      } = fItem
                                      return (
                                          <Tooltip
                                              color="#fff"
                                              title={
                                                  <div
                                                      style={{
                                                          color: '#000',
                                                      }}
                                                      className={
                                                          styles.fieldTooltipInfo
                                                      }
                                                  >
                                                      <div
                                                          className={
                                                              styles.fieldTooltipItem
                                                          }
                                                      >
                                                          <div
                                                              className={
                                                                  styles.fieldTipTitle
                                                              }
                                                          >
                                                              {__('业务名称：')}
                                                          </div>
                                                          <div
                                                              className={
                                                                  styles.fieldTipCon
                                                              }
                                                              dangerouslySetInnerHTML={{
                                                                  __html:
                                                                      nameCn ||
                                                                      '--',
                                                              }}
                                                          />
                                                      </div>
                                                      {!!fieldKeys?.nameEn && (
                                                          <div
                                                              className={
                                                                  styles.fieldTooltipItem
                                                              }
                                                          >
                                                              <div
                                                                  className={
                                                                      styles.fieldTipTitle
                                                                  }
                                                              >
                                                                  {__(
                                                                      '技术名称：',
                                                                  )}
                                                              </div>
                                                              <div
                                                                  className={
                                                                      styles.fieldTipCon
                                                                  }
                                                                  dangerouslySetInnerHTML={{
                                                                      __html:
                                                                          nameEn ||
                                                                          '--',
                                                                  }}
                                                              />
                                                          </div>
                                                      )}
                                                  </div>
                                              }
                                          >
                                              <div
                                                  className={styles.fieldTag}
                                                  // 搜索关键词时，技术名称与原始技术名称值不同表示匹配则显示
                                                  dangerouslySetInnerHTML={{
                                                      __html:
                                                          isSearchingByKeyword &&
                                                          nameEn !== rawNameEn
                                                              ? `${nameCn} | ${nameEn}`
                                                              : nameCn,
                                                  }}
                                              />
                                          </Tooltip>
                                      )
                                  })
                                : '--'}
                            {(fields?.length || 0) > 4 && (
                                <div className={styles.fieldRemainingCount}>
                                    +{toNumber(fields?.length) - 4}
                                </div>
                            )}
                        </Space>
                    </div>
                    <div className={styles.otherInfo}>
                        <div>
                            {type === DataRescType.PROVINCE_DATACATLG
                                ? `${__('更新时间')} ${
                                      updated_at
                                          ? moment(updated_at).format(
                                                'YYYY-MM-DD',
                                            )
                                          : '--'
                                  }`
                                : `${__('上线时间')} ${
                                      online_at
                                          ? moment(online_at).format(
                                                'YYYY-MM-DD',
                                            )
                                          : '--'
                                  }`}
                        </div>

                        <div className={styles.line} />
                        <div className={styles.itemOtherInfoWrapper}>
                            {renderOtherInfo(item, type, relateRescType)}
                        </div>
                    </div>
                </div>
                <div className={styles.oprWrapper}>
                    {showCard ? (
                        <OprDropDown
                            catalog={item}
                            showShareApplyBtn={showShareApplyBtn ?? false}
                            filterOperationList={filterOperationList}
                            onCallback={(oprKey: DCatlgOprType, value: any) => {
                                if (oprKey === DCatlgOprType.ShareApply) {
                                    setApplyCatalog(value)
                                }
                            }}
                            resType={
                                type === DataRescType.INTERFACE
                                    ? ShareApplyResourceTypeEnum.Api
                                    : ShareApplyResourceTypeEnum.Catalog
                            }
                            onAddFavorite={onAddFavorite}
                            onCancelFavorite={onCancelFavorite}
                        />
                    ) : (
                        <div className={styles.nameBtn}>
                            {/* {(isOwner || canAuth) &&
                                isPubOrOnline &&
                                (isShowRequestPath ||
                                    isMicroWidget({ microWidgetProps })) &&
                                [
                                    DataRescType.LOGICALVIEW,
                                    DataRescType.INTERFACE,
                                    DataRescType.INDICATOR,
                                ].includes(item?.type) &&
                                !cssjj && (
                                    <Tooltip
                                        title={__('资源授权')}
                                        placement="bottom"
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
                                )} */}
                            {/* 申请共享 */}
                            {/* {item.is_online &&
                                item.api_type === 'service_register' &&
                                platform === LoginPlatform.drmp && (
                                    <CityShareOperation
                                        catalog={item}
                                        className={styles.itemOprIcon}
                                        disabledClassName={
                                            styles.itemOprDiabled
                                        }
                                        showClassName={
                                            styles.itemOprIconVisible
                                        }
                                        onApply={(value) => {
                                            setApplyCatalog(value)
                                        }}
                                        type="button"
                                    />
                                )} */}
                            {isAccessBtnShowByPolicy &&
                                !isOwner &&
                                (isShowRequestPath ||
                                    isMicroWidget({ microWidgetProps })) &&
                                (item?.type === DataRescType.LOGICALVIEW ||
                                    (item?.type === DataRescType.INTERFACE &&
                                        appDeveloper)) &&
                                !cssjj && (
                                    <Tooltip
                                        title={
                                            is_online
                                                ? isAccessBtnDisableByPolicy &&
                                                  hasCustomEnablePolicy
                                                    ? __(
                                                          '无匹配的审核流程，不能进行权限申请',
                                                      )
                                                    : item?.type ===
                                                      DataRescType.INTERFACE
                                                    ? __('为集成应用申请权限')
                                                    : __('权限申请')
                                                : __(
                                                      '该${text}未发布或未上线，无法进行权限申请',
                                                      {
                                                          text: DataRescTypeMap[
                                                              item.type
                                                          ],
                                                      },
                                                  )
                                        }
                                        placement={
                                            is_online ? 'bottom' : 'bottomRight'
                                        }
                                        overlayStyle={{ maxWidth: 500 }}
                                    >
                                        <FontIcon
                                            name="icon-quanxianshenqing1"
                                            type={FontIconType.FONTICON}
                                            className={classnames(
                                                styles.itemOprIcon,
                                                (!is_online ||
                                                    isAccessBtnDisableByPolicy) &&
                                                    styles.itemOprDiabled,
                                            )}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                if (
                                                    !is_online ||
                                                    isAccessBtnDisableByPolicy
                                                )
                                                    return
                                                setPermissionRequestOpen(true)
                                            }}
                                        />
                                    </Tooltip>
                                )}
                            {isAccessBtnShowByPolicy &&
                                !isOwner &&
                                (isShowRequestPath ||
                                    isMicroWidget({ microWidgetProps })) &&
                                item?.type === DataRescType.INDICATOR && (
                                    <Tooltip
                                        title={
                                            isAccessBtnDisableByPolicy &&
                                            hasCustomEnablePolicy
                                                ? __(
                                                      '无匹配的审核流程，不能进行权限申请',
                                                  )
                                                : !hasBusinessRoles
                                                ? __('为集成应用申请权限')
                                                : __('权限申请')
                                        }
                                        placement="bottom"
                                        overlayStyle={{ maxWidth: 500 }}
                                    >
                                        <FontIcon
                                            name="icon-quanxianshenqing1"
                                            type={FontIconType.FONTICON}
                                            className={classnames(
                                                styles.itemOprIcon,
                                                isAccessBtnDisableByPolicy &&
                                                    styles.itemOprDiabled,
                                            )}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                if (isAccessBtnDisableByPolicy)
                                                    return
                                                setPermissionRequestOpen(true)
                                            }}
                                        />
                                    </Tooltip>
                                )}
                            {/* {item?.type === DataRescType.LOGICALVIEW && (
                                <Tooltip
                                    title={
                                        has_permission
                                            ? __('下载任务')
                                            : hasBusinessRoles
                                            ? __(
                                                  '无下载权限，请联系数据Owner进行授权',
                                              )
                                            : __('角色权限不足，不能进行下载')
                                    }
                                    placement="bottom"
                                >
                                    <FontIcon
                                        className={classnames(
                                            styles.itemOprIcon,
                                            (!has_permission ||
                                                !hasOwnedRoles) &&
                                                styles.itemOprDiabled,
                                        )}
                                        name="icon-xiazai"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            if (
                                                !has_permission ||
                                                !hasOwnedRoles
                                            )
                                                return
                                            onItemBtnClick(item)
                                        }}
                                    />
                                </Tooltip>
                            )}
                            {/* {canResChat && hasBusinessRoles && (
                                <Tooltip
                                    placement="bottomRight"
                                    arrowPointAtCenter
                                    title={chatTip()}
                                >
                                    <FontIcon
                                        name="icon-yinyong1"
                                        className={classnames(
                                            styles.itemOprIcon,
                                            !llm && styles.itemOprDiabled,
                                        )}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            if (!llm) return
                                            updateParams(
                                                CogAParamsType.Resource,
                                                {
                                                    data: [
                                                        {
                                                            id: item.id,
                                                            name: item.raw_name,
                                                            type: item.type,
                                                            indicator_type:
                                                                item?.indicator_type,
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
                            {/* {item?.type === DataRescType.LOGICALVIEW &&
                                is_online &&
                                (actions?.includes('read') || isOwner) && (
                                    <AddDataset
                                        item={item.id}
                                        className={styles.itemOprIcon}
                                    />
                                )} */}
                            {/* {showFeedbackBtn && (
                                <FeedbackOperation
                                    item={item}
                                    type="button"
                                    resType={transformResType(item.type)}
                                />
                            )} */}
                            {/* 电子证照 使用目录模式的收藏 */}
                            {/* {showFavoriteBtn && (
                                <FavoriteOperation
                                    item={item}
                                    // className={styles.itemOprIcon}
                                    resType={transformResType(item.type)}
                                    type="button"
                                    onAddFavorite={onAddFavorite}
                                    onCancelFavorite={onCancelFavorite}
                                />
                            )} */}
                        </div>
                    )}
                </div>
            </div>
            {/* 资源授权  接口 | 库表 */}
            {accessOpen && (
                <AccessModal
                    id={item?.id}
                    type={
                        item?.type === DataRescType.INTERFACE
                            ? AssetTypeEnum.Api
                            : item?.type === DataRescType.INDICATOR
                            ? AssetTypeEnum.Indicator
                            : AssetTypeEnum.DataView
                    }
                    onClose={(needRefresh?: boolean) => {
                        setAccessOpen(false)
                        if (needRefresh) {
                            policyCacheManager?.clearCache()
                            handleRefresh?.()
                        }
                    }}
                    indicatorType={
                        item?.type === DataRescType.INDICATOR
                            ? item.indicator_type
                            : undefined
                    }
                />
            )}
            {/* 权限申请 */}
            {permissionRequestOpen && (
                <ApplyPolicy
                    id={item?.id}
                    onClose={(needRefresh: boolean) => {
                        setPermissionRequestOpen(false)
                        if (needRefresh) {
                            refreshAuditProcess?.()
                        }
                    }}
                    type={
                        item?.type === DataRescType.LOGICALVIEW
                            ? AssetTypeEnum.DataView
                            : item?.type === DataRescType.INTERFACE
                            ? AssetTypeEnum.Api
                            : AssetTypeEnum.Indicator
                    }
                    indicatorType={
                        item?.type === DataRescType.INDICATOR
                            ? item.indicator_type
                            : undefined
                    }
                />
            )}
            {/* 调用信息 */}
            {authInfoOpen && (
                <AuthInfo
                    id={selectedResc.id}
                    open={authInfoOpen}
                    onClose={() => {
                        setAuthInfoOpen(false)
                    }}
                />
            )}

            {/* 资源共享申请 */}
            {shareApplyOpen && (
                <ApplyChooseModal
                    data={item}
                    open={shareApplyOpen}
                    onCancel={() => setShareApplyOpen(false)}
                    onOk={() => setShareApplyOpen(false)}
                />
            )}

            {/* 纠错 */}
            {objectionOpen && (
                <CreateObjection
                    open={objectionOpen}
                    item={item}
                    onCreateObjectionClose={() => setObjectionOpen(false)}
                    type={ObjectionTypeEnum.DirectoryCorrection}
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
        </>
    )
}

export default memo(DataRescItem)
