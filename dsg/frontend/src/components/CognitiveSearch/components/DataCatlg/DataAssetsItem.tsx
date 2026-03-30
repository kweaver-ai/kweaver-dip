import React, { memo, useMemo, useState } from 'react'
import classnames from 'classnames'
import { Tooltip, Divider } from 'antd'
import moment from 'moment'
import { DownOutlined, RightOutlined } from '@ant-design/icons'
import { SizeMe } from 'react-sizeme'
import { AppDataContentColored, FontIcon } from '@/icons'
import { AssetType, BusinObjOpr } from '../../const'
import { getActualUrl, getPlatformNumber } from '@/utils'
import styles from './styles.module.less'
import __ from '../../locale'
import { useCongSearchContext } from '../../CogSearchProvider'
import { CogAParamsType } from '@/context'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { HasAccess, LoginPlatform, OnlineStatus } from '@/core'
import { CatalogMoreInfo } from '@/components/DataAssetsCatlg/CatalogMoreInfo'
import { publishStatus, onLineStatus } from '@/components/ResourcesDir/const'
import CityShareOperation from '@/components/DataAssetsCatlg/CityShareOperation'
import FeedbackOperation from '@/components/DataAssetsCatlg/FeedbackOperation'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IDataAssetsItem {
    item: any
    isCongSearch?: boolean
    handleAssetBtnUpdate: (type: BusinObjOpr, item: any, newItem?: any) => void
    handleError: (err) => void
    getClickAsset?: (asset: any, st: AssetType) => void
    checkClickAssetIsOnline?: (asset: any, st: AssetType) => void
    addedAssets?: any[]
    getAddAsset?: (asset: any) => void
    onGraphClick?: (asset: any) => void
    onShareApply?: (value: any) => void
}

const DataAssetsItem: React.FC<IDataAssetsItem> = ({
    item,
    isCongSearch,
    addedAssets,
    getAddAsset,
    onGraphClick,
    handleAssetBtnUpdate,
    handleError,
    getClickAsset,
    checkClickAssetIsOnline,
    onShareApply,
}: IDataAssetsItem) => {
    const { assetType, hasDataOperRole } = useCongSearchContext()
    const [isExpand, setIsExpand] = useState<boolean>(false)
    const [userId] = useCurrentUser('ID')
    // useCogAsstContext 已移除，相关功能已下线
    const { checkPermissions } = useUserPermCtx()

    const hasBusinessRoles = useMemo(
        () => checkPermissions(HasAccess.isHasBusiness),
        [checkPermissions],
    )
    const [applyCatalog, setApplyCatalog] = useState<any>()
    const platform = getPlatformNumber()

    // 点击列表
    const clickListItem = () => {
        if (getClickAsset && checkClickAssetIsOnline) {
            checkClickAssetIsOnline(item, AssetType.DATACATLG)
        }
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
                className={styles.toolTip}
                getPopupContainer={(n) => n}
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

    // render AI/实体列表项-信息展示
    const renderOtherInfo = (items: any, data: any) => {
        const { infoKey, type, title, toolTipTitle } = items
        let showContent = data[infoKey]
        if (infoKey === 'published_at') {
            showContent = `${moment(showContent).format('yyyy-MM-DD')}`
            return (
                <>
                    <div
                        style={{
                            flexShrink: 0,
                        }}
                    >
                        {`${__('上线时间')} ${showContent || '--'}`}
                    </div>
                    <Divider
                        style={{
                            height: '12px',
                            borderRadius: '1px',
                            borderLeft: '1px solid rgba(0,0,0,0.24)',
                            margin: '0px 2px 0px 12px',
                        }}
                        type="vertical"
                    />
                </>
            )
        }

        return showToolTip(title, toolTipTitle, showContent)
    }

    const backUrl = useMemo(
        () => getActualUrl(`/cognitive-search?tabKey=${assetType}`),
        [assetType],
    )

    const renderStatusTag = () => {
        if (!hasDataOperRole) return null

        let text = ''
        if (item?.publish_status !== publishStatus.Published) {
            text = __('未发布')
        } else if (
            [
                onLineStatus.UnOnline,
                onLineStatus.OnlineAuditing,
                onLineStatus.OnlineAuditingReject,
                onLineStatus.Offline,
            ].includes(item?.online_status)
        ) {
            text = __('未上线')
        }

        return text ? (
            <div className={styles.tagWrapper}>
                <div className={styles.tag}>{text}</div>
            </div>
        ) : null
    }

    // 是否能问答
    const canChatEnable = useMemo(
        () =>
            (item.owner_id === userId || item.available_status === '1') &&
            [
                OnlineStatus.ONLINE,
                OnlineStatus.DOWN_AUDITING,
                OnlineStatus.DOWN_REJECT,
            ].includes(item.online_status) &&
            item?.resource_type === 'data_view',
        [item],
    )

    return (
        <div className={styles['assets-item']} onClick={clickListItem}>
            <div className={styles.itemIcon}>
                <AppDataContentColored style={{ fontSize: 40 }} />
            </div>
            <div className={styles.itemContent}>
                <div className={styles.itemTop}>
                    {renderStatusTag()}
                    <div
                        className={styles.itemTitle}
                        title={item.raw_title}
                        dangerouslySetInnerHTML={{
                            __html: item.title,
                        }}
                    />
                    {/* <div className={styles.addAssetsToLibrary}>
                        {getAddAsset ? (
                            <div className={styles.assetsIconWrapper}>
                                <Tooltip
                                    title={
                                        addedAssets?.find(
                                            (asset) => asset.res_id === item.id,
                                        )
                                            ? '已添加'
                                            : ''
                                    }
                                >
                                    <Button
                                        disabled={addedAssets?.find(
                                            (asset) => asset.res_id === item.id,
                                        )}
                                        className={styles.addAssetsToLibraryBtn}
                                        type="primary"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            getAddAsset(item)
                                        }}
                                    >
                                        添加资源
                                    </Button>
                                </Tooltip>
                            </div>
                        ) : (
                            <AddAssetsToLibrary
                                item={item}
                                customClassName={styles.hoverShow}
                                backUrl={backUrl}
                                updateData={(type: BusinObjOpr) => {
                                    handleAssetBtnUpdate(type, item)
                                }}
                                errorCallback={handleError}
                            />
                        )}
                    </div> */}
                    <span
                        className={styles.recDetail}
                        onClick={(e) => {
                            onGraphClick?.(item)
                            e.stopPropagation()
                        }}
                        hidden={!isCongSearch}
                    >
                        <div>推荐详情</div>
                        <RightOutlined
                            style={{
                                fontSize: 12,
                                color: 'rgba(0,0,0,0.45)',
                            }}
                        />
                    </span>
                    {/* {hasBusinessRoles && (
                        <Tooltip
                            placement="bottom"
                            title={chatTipCatalog(
                                'normal',
                                [
                                    OnlineStatus.ONLINE,
                                    OnlineStatus.DOWN_AUDITING,
                                    OnlineStatus.DOWN_REJECT,
                                ].includes(item.online_status),
                                item.owner_id === userId ||
                                    item.available_status === '1',
                                item?.resource_type === 'data_view' ? 1 : 2,
                            )}
                        >
                            <FontIcon
                                name="icon-yinyong1"
                                className={classnames({
                                    [styles.itemOprIcon]: true,
                                    [styles.itemOprDiabled]: !canChatEnable,
                                })}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    if (!canChatEnable) return
                                    updateParams(CogAParamsType.Resource, {
                                        data: [
                                            {
                                                id: item.id,
                                                name: item.raw_title,
                                                type: item.type,
                                                indicator_type:
                                                    item?.indicator_type,
                                            },
                                        ],
                                        op: 'add',
                                        event: e,
                                    })
                                    onOpenAssistant()
                                }}
                            />
                        </Tooltip>
                    )} */}

                    {/* 申请共享 */}
                    {[
                        OnlineStatus.ONLINE,
                        OnlineStatus.DOWN_AUDITING,
                        OnlineStatus.DOWN_REJECT,
                    ].includes(item.online_status) &&
                        platform === LoginPlatform.drmp && (
                            <CityShareOperation
                                catalog={{
                                    ...item,
                                    data_resource_type:
                                        item.resource_type === 'data_view'
                                            ? 1
                                            : 2,
                                }}
                                className={styles.itemOprIcon}
                                disabledClassName={styles.itemOprDiabled}
                                showClassName={styles.itemOprIconVisible}
                                onApply={onShareApply}
                            />
                        )}
                    {[
                        OnlineStatus.ONLINE,
                        OnlineStatus.DOWN_AUDITING,
                        OnlineStatus.DOWN_REJECT,
                    ].includes(item.online_status) && (
                        <FeedbackOperation
                            catalog={{
                                ...item,
                                raw_name: item?.raw_title,
                                name: item?.title,
                            }}
                            className={styles.itemOprIcon}
                        />
                    )}
                </div>
                {/* <div className={styles.tableNameWrapper}>
                    <span className={styles.tableName}>
                        {item?.table_name && (
                            <span
                                title={item.raw_table_name}
                                dangerouslySetInnerHTML={{
                                    __html: item.table_name,
                                }}
                            />
                        )}
                    </span>

                    <span
                        className={styles.recDetail}
                        onClick={(e) => {
                            onGraphClick?.(item)
                            e.stopPropagation()
                        }}
                        hidden={!isCongSearch}
                    >
                        <div>推荐详情</div>
                        <RightOutlined
                            style={{
                                fontSize: 12,
                                color: 'rgba(0,0,0,0.45)',
                            }}
                        />
                    </span>
                </div> */}
                {item.description && (
                    <div className={styles.itemDescWrapper}>
                        <span className={styles.itemDescTip}>
                            {__('描述')}：
                        </span>
                        <div
                            className={classnames(
                                styles.itemDesc,
                                !item.description && styles.noDesc,
                            )}
                            title={item.raw_description}
                            dangerouslySetInnerHTML={{
                                __html: item.description,
                            }}
                        />
                    </div>
                )}
                {!!item?.fields?.length && (
                    <SizeMe>
                        {({ size: outerSize }) => (
                            <div
                                className={classnames(
                                    styles.fieldWrapper,
                                    !isExpand && styles.isUnExpand,
                                )}
                            >
                                <span className={styles.fieldWrapperField}>
                                    {__('信息项')}：
                                </span>
                                <SizeMe>
                                    {({ size: innerSize }) => {
                                        const shwoExpand =
                                            (outerSize?.width || 0) - 50 ===
                                            innerSize.width
                                        return (
                                            <div
                                                className={styles.fieldInfoWrap}
                                            >
                                                <div
                                                    className={styles.fieldInfo}
                                                >
                                                    {item?.fields?.map(
                                                        (field, index) => {
                                                            return (
                                                                <span
                                                                    key={`${field?.field_name_zh}-${index}`}
                                                                    className={
                                                                        styles.fieldInfoItem
                                                                    }
                                                                    title={`${field.raw_field_name_zh}\n${field.raw_field_name_en}`}
                                                                >
                                                                    <span
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: field.field_name_zh,
                                                                        }}
                                                                        className={
                                                                            styles.field
                                                                        }
                                                                    />
                                                                    <span
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: field.field_name_en,
                                                                        }}
                                                                        className={
                                                                            styles.field
                                                                        }
                                                                    />
                                                                </span>
                                                            )
                                                        },
                                                    )}
                                                </div>
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setIsExpand(!isExpand)
                                                    }}
                                                    className={
                                                        styles.expandIcon
                                                    }
                                                    style={{
                                                        visibility: shwoExpand
                                                            ? 'visible'
                                                            : 'hidden',
                                                    }}
                                                >
                                                    <DownOutlined />
                                                </div>
                                            </div>
                                        )
                                    }}
                                </SizeMe>
                            </div>
                        )}
                    </SizeMe>
                )}

                {/* <div className={styles.itemOtherInfo}>
                {itemOtherInfo
                        .filter(
                            (oItem) =>
                                ![
                                    'data_source_name',
                                    'schema_name',
                                    'owner_name',
                                ].includes(oItem.infoKey),
                        )
                        .map((oItem) => renderOtherInfo(oItem, item))} 
                </div> */}
                <CatalogMoreInfo
                    infoData={{
                        online_at: item?.online_at,
                        data_resource_type:
                            item?.resource_type === 'data_view' ? 1 : 2,
                        subject_domain_name: item?.subject_infos?.map(
                            (info) => info.name,
                        ),
                        department_name: item?.raw_department_name,
                        system_name: item?.system_name,
                        scoreInfo: item?.scoreInfo,
                    }}
                />
            </div>
        </div>
    )
}

export default memo(DataAssetsItem)
