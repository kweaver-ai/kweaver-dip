import { Tooltip, Button } from 'antd'
import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
    useMemo,
} from 'react'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import { isArray, isFunction } from 'lodash'
import { FontIcon, AppDataContentColored } from '@/icons'
import { IconType } from '@/icons/const'
import { ICatlgContent } from '@/core/apis/dataCatalog/index.d'
import styles from './styles.module.less'
import {
    formatError,
    getRescDirDetail,
    getDataCatalogMount,
    getCategory,
    SystemCategory,
    detailFrontendServiceOverview,
    getDatasheetViewDetails,
    getInfoCatlgDetailByOper,
    getInfoCatlgDetail,
    ResType,
    LoginPlatform,
    HasAccess,
} from '@/core'
import { getPlatformNumber } from '@/utils'
import __ from '../locale'
import { getState } from '../../DatasheetView/helper'
import { Expand, DetailsLabel, Loader } from '@/ui'
import LogicViewDetail from '../../DataAssetsCatlg/LogicViewDetail'
import {
    PublishStatus,
    PublishStatusList,
    OnlineStatus,
    OnlineStatusList,
    OpenTypeEnum,
    ShareTypeEnum,
    ScheduleType,
    ScheduleTypeTips,
    ScheduleTypeList,
    updateCycle,
    UseScene,
} from '../const'
import ApplicationServiceDetail from '../../DataAssetsCatlg/ApplicationServiceDetail'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { basicInfoDetailsList, ILabelTitle } from './helper'
import { sceneTypeList } from '../EditInfoRescCatlg/SelectBusinScene/helper'
import { selectNullOptionValue } from '../EditInfoRescCatlg/helper'
import { getPubOrOnlineStatusLabel, unPubStatusList } from '../helper'
import { onLineStatus } from '../../ResourcesDir/const'
import FavoriteOperation, {
    UpdateFavoriteParams,
} from '@/components/Favorite/FavoriteOperation'
import TagList from '../TagList'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

export const LabelTitle: React.FC<ILabelTitle> = ({ label, id }) => {
    return (
        <div className={styles.labelTitleWrapper} id={id}>
            <span className={styles.labelLine} />
            <span>{label}</span>
        </div>
    )
}

interface IDirBasicInfo {
    catalogId: string
    isAudit?: boolean
    isMarket?: boolean
    onFavoriteChange?: (res) => void
}
// DirDetailContent传参数
const DirBasicInfo = forwardRef((props: IDirBasicInfo, ref) => {
    const { catalogId, isAudit, isMarket, onFavoriteChange } = props
    const navigator = useNavigate()

    const [loading, setLoading] = useState(true)
    const [loginViewOpen, setLoginViewOpen] = useState(false)
    const [applicationServiceOpen, setApplicationServiceOpen] = useState(false)
    const [logicViewId, setLoginViewId] = useState<string>('')

    const [dirContent, setDirContent] = useState<any>()

    const [basicInfoDetailsData, setBasicInfoDetailsData] =
        useState<any[]>(basicInfoDetailsList)
    const [{ using, governmentSwitch }] = useGeneralConfig()
    const platform = getPlatformNumber()
    const { checkPermissions } = useUserPermCtx()
    const governmentStatus = useMemo(() => {
        return governmentSwitch.on
    }, [governmentSwitch])

    const getDirName = () => {
        return dirContent?.name || ''
    }

    // 是否拥有数据运营工程师
    const hasDataOperRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermissions])

    useImperativeHandle(ref, () => ({
        getDirName,
    }))

    const getDirContent = async () => {
        if (!catalogId) return
        try {
            setLoading(true)
            const action = hasDataOperRole
                ? getInfoCatlgDetailByOper
                : getInfoCatlgDetail
            const res = await action(catalogId)
            const { entries } = await getCategory({})
            const categorys = entries?.filter((item) => item.using) || []
            const hasBusinessSystem: boolean = !!categorys?.find(
                (item) =>
                    item.using && item.id === SystemCategory.InformationSystem,
            )?.id

            const info = {
                ...res,
                hasBusinessSystem,
            }
            setDirContent(info)
            getDetailsInfo(info, categorys)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (catalogId) {
            getDirContent()
        }
    }, [catalogId, hasDataOperRole])

    const toEdit = () => {
        const url = `/dataService/editInfoCatlg?id=${catalogId}&backUrl=/dataService/infoCatlgDetails?catlgId=${catalogId}`
        navigator(url)
    }

    // 是否能收藏
    const canFavorite = useMemo(
        () =>
            platform === LoginPlatform.drmp &&
            [
                onLineStatus.Online,
                onLineStatus.OfflineAuditing,
                onLineStatus.OfflineReject,
            ].includes(dirContent?.status?.online),
        [dirContent],
    )

    // 收藏状态改变
    const handleFavoriteChange = (res: UpdateFavoriteParams) => {
        const params = {
            ...dirContent,
            is_favored: res?.is_favored,
            favor_id: res?.favor_id,
        }
        setDirContent(params)
        if (isFunction(onFavoriteChange)) {
            onFavoriteChange(params)
        }
    }

    const getDetailsInfo = (data: any, categorys?: any[]) => {
        if (!data) return
        const resourceType = data?.mountInfo?.resource_type
        const filterKeys: string[] = []
        const { relation_info = {}, shared_open_info = {} } = data
        const { shared_type, shared_mode, open_type } = shared_open_info
        const cateNodes = categorys?.filter(
            (o) => o.type !== 'system' && o.using,
        )
        const list = basicInfoDetailsData?.map((item) => {
            let itemList = item?.list.map((it) => {
                const { key, subKey } = it
                const value = key && subKey ? data[key]?.[subKey] : data?.[key]
                const obj = { ...it, value: value || '--' }

                if (it.key === 'created_at' || it.key === 'updated_at') {
                    obj.value = data[it.key]
                        ? moment(data[it.key]).format('YYYY-MM-DD HH:mm:ss')
                        : '--'
                }
                if (it.key === 'label_ids') {
                    obj.value = (
                        <TagList
                            tags={data.label_ids}
                            maxRows={0}
                            maxTagWidth={120}
                            useAipQueryTags
                            containerStyle={{ width: '100%' }}
                        />
                    )
                }
                if (['source_info', 'belong_info'].includes(key)) {
                    if (subKey === 'business_responsibility') {
                        obj.value = data[key]?.office?.[subKey] || '--'
                    } else if (subKey === 'business_process') {
                        const newValue = value?.filter(
                            (_item) => _item.name,
                            //  &&  _item.id &&  _item.id !== selectNullOptionValue,
                        )
                        obj.render = () => {
                            return (
                                <div className={styles.tagWrapper}>
                                    {newValue?.length
                                        ? newValue?.map((pItem) => {
                                              return (
                                                  <Tooltip
                                                      color="white"
                                                      overlayClassName="selRescTagsWrapper"
                                                      // overlayStyle={{maxWidth: '200px'}}
                                                      title={
                                                          pItem?.id &&
                                                          pItem.id !==
                                                              selectNullOptionValue
                                                              ? pItem.name
                                                              : ''
                                                      }
                                                  >
                                                      <div
                                                          title={pItem.name}
                                                          className={
                                                              styles.tagItem
                                                          }
                                                      >
                                                          {pItem.name}
                                                      </div>
                                                  </Tooltip>
                                              )
                                          })
                                        : '--'}
                                </div>
                            )
                        }
                    } else {
                        obj.value =
                            typeof value === 'string'
                                ? value
                                : value?.id &&
                                  value?.id !== selectNullOptionValue
                                ? value?.name
                                : '--'
                    }
                }
                if (key === 'relation_info') {
                    if (
                        [
                            'related_business_scenes',
                            'source_business_scenes',
                        ].includes(subKey)
                    ) {
                        const type = sceneTypeList?.find(
                            (_type) => _type.key === value?.[0]?.type,
                        )?.label
                        const sceneValue = value
                            ?.map?.((tag) => {
                                return tag.value
                            })
                            ?.join('；')
                        obj.value =
                            type && sceneValue ? `${type}/${sceneValue}` : '--'
                    } else {
                        const newValue = value?.filter(
                            (_item) => _item.name,
                            //  &&  _item.id &&  _item.id !== selectNullOptionValue,
                        )
                        obj.render = () => {
                            return (
                                <div className={styles.relationValueWrapper}>
                                    {newValue?.length
                                        ? newValue?.map(
                                              (rItem: any, rIndex) => {
                                                  return (
                                                      <Tooltip
                                                          color="white"
                                                          overlayClassName="selRescTagsWrapper"
                                                          title={
                                                              rItem?.id &&
                                                              rItem.id !==
                                                                  selectNullOptionValue
                                                                  ? rItem.name
                                                                  : ''
                                                          }
                                                      >
                                                          <span
                                                              className={
                                                                  styles.relationInfoItemText
                                                              }
                                                          >
                                                              {rIndex > 0 &&
                                                                  '，'}
                                                              {rItem?.name ||
                                                                  '--'}
                                                          </span>
                                                      </Tooltip>
                                                  )
                                              },
                                          )
                                        : '--'}
                                </div>
                            )
                        }
                    }
                }
                return obj
            })
            if (!data.hasBusinessSystem) {
                filterKeys.push('info_system')
            }
            if (open_type !== OpenTypeEnum.HASCONDITION) {
                filterKeys.push('open_condition')
            }
            if (shared_type === ShareTypeEnum.NOSHARE) {
                itemList = itemList.map((it: any) => {
                    const itItem = {
                        ...it,
                    }
                    if (it.subKey === 'shared_message') {
                        itItem.label = __('不予共享依据')
                    }
                    return itItem
                })
                filterKeys.push('shared_mode')
            }
            if (shared_type === ShareTypeEnum.UNCONDITION) {
                filterKeys.push('shared_message')
            }

            itemList = itemList.filter(
                (it) =>
                    !filterKeys.includes(it.key) &&
                    !filterKeys.includes(it.subKey),
            )
            const resourcesAttrList =
                cateNodes?.map((it) => {
                    return {
                        label: it.name,
                        value:
                            data?.cate_info?.find((o) => o.cate_id === it.id)
                                ?.node_name || '--',
                        key: it.id,
                    }
                }) || []
            return {
                ...item,
                list:
                    item.key === 'cate_info' && resourcesAttrList?.length
                        ? resourcesAttrList
                        : itemList,
            }
        })
        setBasicInfoDetailsData(list.filter((item) => item.list?.length))
    }

    return loading ? (
        <Loader />
    ) : (
        <div className={styles.basicContentWrapper}>
            {!isMarket && (
                <div className={styles.headerBox}>
                    <div className={styles.headerTitle}>
                        <div className={styles.headerLeft}>
                            <FontIcon
                                name="icon-xinximulu1"
                                type={IconType.COLOREDICON}
                                className={styles.icon}
                            />
                            <div className={styles.catlgNameCont}>
                                <div className={styles.nameWrapper}>
                                    {dirContent?.status &&
                                        getPubOrOnlineStatusLabel(
                                            dirContent,
                                            true,
                                        )}
                                    <div
                                        title={dirContent?.name}
                                        className={styles.names}
                                    >
                                        {dirContent?.name}
                                    </div>
                                </div>
                                <div className={styles.info}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.lable}>
                                            {__('编码')}：
                                        </span>
                                        <span className={styles.text}>
                                            {dirContent?.code}
                                        </span>
                                    </div>
                                    {!isAudit && (
                                        <>
                                            <div className={styles.infoItem}>
                                                <span className={styles.lable}>
                                                    {__('发布状态')}：
                                                </span>
                                                <span className={styles.text}>
                                                    {getState(
                                                        unPubStatusList.includes(
                                                            dirContent?.status
                                                                ?.publish,
                                                        )
                                                            ? PublishStatus.Unpublished
                                                            : PublishStatus.Published,
                                                        PublishStatusList,
                                                        {
                                                            width: '6px',
                                                            height: '6px',
                                                        },
                                                    )}
                                                    {dirContent?.audit_advice &&
                                                        dirContent?.status
                                                            ?.publish ===
                                                            PublishStatus.PublishedAuditReject && (
                                                            <Tooltip
                                                                title={
                                                                    dirContent?.audit_advice
                                                                }
                                                                placement="bottom"
                                                            >
                                                                <FontIcon
                                                                    name="icon-shenheyijian"
                                                                    type={
                                                                        IconType.COLOREDICON
                                                                    }
                                                                    className={
                                                                        styles.icon
                                                                    }
                                                                    style={{
                                                                        fontSize: 20,
                                                                        marginLeft: 4,
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                        )}
                                                </span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.lable}>
                                                    {__('上线状态')}：
                                                </span>
                                                <span className={styles.text}>
                                                    {getState(
                                                        dirContent?.status
                                                            ?.online,
                                                        OnlineStatusList,
                                                        {
                                                            width: '6px',
                                                            height: '6px',
                                                        },
                                                    )}

                                                    {dirContent?.audit_advice &&
                                                        [
                                                            OnlineStatus.OnlineAuditingReject,
                                                            OnlineStatus.OfflineReject,
                                                            OnlineStatus.OfflineUpAuditingReject,
                                                        ].includes(
                                                            dirContent?.status
                                                                ?.online,
                                                        ) && (
                                                            <Tooltip
                                                                title={
                                                                    dirContent?.audit_advice
                                                                }
                                                                placement="bottom"
                                                            >
                                                                <FontIcon
                                                                    name="icon-shenheyijian"
                                                                    type={
                                                                        IconType.COLOREDICON
                                                                    }
                                                                    className={
                                                                        styles.icon
                                                                    }
                                                                    style={{
                                                                        fontSize: 20,
                                                                        marginLeft: 4,
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                        )}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* {!isAudit &&
                            [
                                PublishStatus.Unpublished,
                                PublishStatus.PublishedAuditReject,
                            ].includes(dirContent?.status?.publish) && (
                                <Button
                                    type="default"
                                    icon={
                                        <FontIcon
                                            name="icon-edit"
                                            className={styles.icon}
                                            style={{
                                                marginRight: '8px',
                                                marginTop: -'1px',
                                            }}
                                        />
                                    }
                                    onClick={() => toEdit()}
                                >
                                    {__('编辑')}
                                </Button>
                            )} */}
                        {canFavorite && (
                            <FavoriteOperation
                                type="button"
                                item={{ id: catalogId, ...dirContent }}
                                resType={ResType.InfoCatalog}
                                onAddFavorite={handleFavoriteChange}
                                onCancelFavorite={handleFavoriteChange}
                            />
                        )}
                    </div>
                    <div className={styles.desc}>
                        <span>{__('信息资源目录描述')}：</span>
                        {dirContent?.description ? (
                            <Expand
                                expandTips={__('展开')}
                                content={dirContent?.description}
                            />
                        ) : (
                            '--'
                        )}
                    </div>
                </div>
            )}
            <div className={styles.basicContent}>
                {basicInfoDetailsData.map((item) => {
                    return (
                        <div key={item.subKey || item.key}>
                            {isMarket ? (
                                <div
                                    style={{
                                        marginBottom: '20px',
                                        fontWeight: 550,
                                    }}
                                >
                                    {item.label}
                                </div>
                            ) : (
                                <LabelTitle label={item.label} />
                            )}
                            <div style={{ marginBottom: '20px' }}>
                                <DetailsLabel
                                    wordBreak
                                    labelWidth="160px"
                                    detailsList={item.list}
                                    border={isMarket}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
})

export default DirBasicInfo
