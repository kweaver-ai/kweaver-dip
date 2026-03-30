import React, { useEffect, useMemo, useState } from 'react'
import { Tabs, Drawer, Tooltip, Space } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import moment from 'moment'
import { FontIcon, AppDataContentColored } from '@/icons'
import styles from './styles.module.less'
import __ from '../locale'
import { cardInfoList } from './const'
import { DetailsLabel, Expand } from '@/ui'
import { CatalogInfoItemDetails } from '../CatalogMoreInfo'
import {
    formatError,
    queryInfoResCatlgDetailsFrontend,
    queryInfoResCatlgColumns,
    getResourceCatalogsFrontend,
    getInfoCatlgDetail,
    ResType,
    LoginPlatform,
    HasAccess,
} from '@/core'
import { getPlatformNumber } from '@/utils'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import DirContentDrawer from './DirContentDrawer'
import FavoriteOperation, {
    UpdateFavoriteParams,
} from '@/components/Favorite/FavoriteOperation'
import { OnlineStatus } from '@/components/InfoRescCatlg/const'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import DataCatlgContent from '@/components/DataAssetsCatlg/DataCatlgContent'

interface IResourcesCatalogItem {
    name: string
    code: string
    publish_at?: string
}
export const ResourcesCatalogItem = (props: {
    dataList: IResourcesCatalogItem[]
    onNameClick?: (item) => void
}) => {
    const { dataList, onNameClick } = props

    return (
        <div className={styles.resourcesCatalogWrapper}>
            {dataList?.map((item, index) => {
                return (
                    <div key={item.code} className={styles.itemBox}>
                        <div
                            className={styles.firstLine}
                            onClick={() => onNameClick?.(item)}
                        >
                            <div className={styles.iconBox}>
                                <AppDataContentColored
                                    className={styles.icon}
                                />
                            </div>
                            <div className={styles.nameBox}>
                                <div title={item.name} className={styles.name}>
                                    {item.name}
                                </div>
                                <div title={item.code} className={styles.code}>
                                    {item.code}
                                </div>
                            </div>
                        </div>
                        <div className={styles.secondLine}>
                            <span className={styles.label}>
                                {__('发布时间')}：
                            </span>
                            <span>{item.publish_at || '--'}</span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

interface IInfoCatlgCard {
    open: boolean
    onClose: () => void
    toOpenDetails: () => void
    info: any
    catalogId: any
    style?: any
    onAddFavorite?: (res: UpdateFavoriteParams) => void
    onCancelFavorite?: (res: UpdateFavoriteParams) => void
}
const InfoCatlgCard = (props: IInfoCatlgCard) => {
    const {
        open,
        info,
        catalogId,
        style,
        onClose,
        toOpenDetails,
        onAddFavorite,
        onCancelFavorite,
    } = props

    const { checkPermissions } = useUserPermCtx()

    const [cardInfoData, setCardInfoData] = useState<any[]>(cardInfoList)
    const [currentResCatlog, setCurrentResCatlog] = useState<any>({})
    const [resouresCatlogData, setResouresCatlogData] = useState<any[]>([])
    const [activeKey, setActiveKey] = useState<string>('1')
    const [infolist, setInfolist] = useState<any[]>([])
    const [detailOpen, setDetailOpen] = useState<boolean>(false)
    const platform = getPlatformNumber()
    useEffect(() => {
        if (catalogId) {
            getDetails()
            getInfoCatlgColumns()
        }
    }, [catalogId])

    // 是否拥有数据运营工程师
    const hasDataOperRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermissions])

    const items = [
        {
            label: (
                <span>
                    {__('信息项')}：{infolist?.length}
                </span>
            ),
            key: '1',
            children: infolist?.length ? (
                infolist?.map((item, index) => {
                    return (
                        <CatalogInfoItemDetails key={index} dataList={item} />
                    )
                })
            ) : (
                <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
            ),
        },
        {
            label: __('关联数据资源目录'),
            key: '2',
            children: resouresCatlogData?.length ? (
                <div style={{ marginTop: '-16px' }}>
                    <ResourcesCatalogItem
                        onNameClick={(item) => onResCatalogClick(item)}
                        dataList={resouresCatlogData}
                    />
                </div>
            ) : (
                <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
            ),
        },
    ]

    const getDetails = async () => {
        try {
            const aciton = hasDataOperRole
                ? getInfoCatlgDetail
                : queryInfoResCatlgDetailsFrontend
            const res = await aciton(catalogId)
            setCardInfoData(
                cardInfoList.map((item) => {
                    const render = () => {
                        return res?.description ? (
                            <Expand
                                expandTips={__('展开')}
                                content={res?.description}
                            />
                        ) : (
                            '--'
                        )
                    }
                    return {
                        ...item,
                        value: res[item.key],
                        render: item.key === 'description' ? render : undefined,
                    }
                }),
            )
        } catch (err) {
            formatError(err)
        }
    }

    const onResCatalogClick = (record) => {
        setCurrentResCatlog(record)
        setDetailOpen(true)
    }

    const getResourceCatalogs = async () => {
        try {
            const res = await getResourceCatalogsFrontend({
                id: catalogId,
                offset: 1,
                limit: 1000,
            })
            const list = res?.entries?.map((item) => ({
                ...item,
                publish_at: item.publish_at
                    ? moment(item.publish_at).format('YYYY-MM-DD HH:mm:ss')
                    : '',
            }))
            setResouresCatlogData(list)
        } catch (err) {
            formatError(err)
        }
    }

    const getInfoCatlgColumns = async () => {
        try {
            const res = await queryInfoResCatlgColumns({
                id: info?.id,
            })
            const list = res?.entries?.map((item) => ({
                ...item,
                dataType: item?.metadata?.data_type,
                isPrimary: item.is_primary_key,
            }))
            setInfolist(list)
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <>
            <Drawer
                title={
                    <div>
                        <div className={styles.drawerTitle}>
                            <div
                                className={styles.title}
                                title={info?.raw_name}
                            >
                                {info?.raw_name}
                            </div>
                            <Space>
                                <Tooltip title={__('进入全屏')}>
                                    <FontIcon
                                        name="icon-fangdatubiao"
                                        className={styles.icon}
                                        onClick={() => {
                                            toOpenDetails()
                                        }}
                                    />
                                </Tooltip>
                                <CloseOutlined onClick={onClose} />
                            </Space>
                        </div>
                        <div className={styles.oprIcon}>
                            <Space>
                                {![
                                    OnlineStatus.UnOnline,
                                    OnlineStatus.OnlineAuditing,
                                    OnlineStatus.OnlineAuditingReject,
                                    OnlineStatus.OfflineUpAuditing,
                                    OnlineStatus.OfflineUpAuditingReject,
                                    OnlineStatus.Offline,
                                ].includes(info?.status?.online) &&
                                    platform === LoginPlatform.drmp && (
                                        <FavoriteOperation
                                            item={{ ...info, id: catalogId }}
                                            className={styles.icon}
                                            resType={ResType.InfoCatalog}
                                            onAddFavorite={onAddFavorite}
                                            onCancelFavorite={onCancelFavorite}
                                        />
                                    )}
                            </Space>
                        </div>
                    </div>
                }
                placement="right"
                // onClose={onClose}
                closeIcon={false}
                open={open}
                width={418}
                style={
                    style || {
                        height: 'calc(100% - 146px)',
                        marginTop: '122px',
                        marginRight: '24px',
                    }
                }
                getContainer={false}
                mask={false}
                destroyOnClose
                footer={false}
                zIndex={998}
                bodyStyle={{ padding: '8px 16px 16px' }}
            >
                <div className={styles.drawerWrapper}>
                    <DetailsLabel detailsList={cardInfoData} />
                    <Tabs
                        activeKey={activeKey}
                        onChange={(val) => {
                            setActiveKey(val)
                            if (val === '2') {
                                getResourceCatalogs()
                            }
                        }}
                        getPopupContainer={(node) => node}
                        tabBarGutter={32}
                        items={items}
                        destroyInactiveTabPane
                        style={{ marginLeft: '8px' }}
                    />
                </div>
            </Drawer>
            {detailOpen && currentResCatlog?.id && (
                // <DirContentDrawer
                //     open={detailOpen}
                //     onClose={() => {
                //         setDetailOpen(false)
                //     }}
                //     catlgId={currentResCatlog?.id}
                //     name={currentResCatlog?.name}
                // />
                <DataCatlgContent
                    open={detailOpen}
                    onClose={() => {
                        setDetailOpen(false)
                    }}
                    assetsId={currentResCatlog?.id || ''}
                />
            )}
        </>
    )
}
export default InfoCatlgCard
