import React, {
    forwardRef,
    ReactNode,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { Tabs, Drawer, Tooltip, Button, Space } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { uniq } from 'lodash'
import { FontIcon } from '@/icons'
import styles from './styles.module.less'
import __ from '../locale'
import { cardInfoList, getMountResoureList } from './const'
import { DetailsLabel, Expand, Loader } from '@/ui'
import {
    CatalogInfoItemDetails,
    CatalogMountResource,
} from '../CatalogMoreInfo'
import {
    formatError,
    getDataCatalogMountFrontend,
    reqDataCatlgBasicInfo,
    detailFrontendServiceOverview,
    getDatasheetViewDetails,
    reqDataCatlgColumnInfo,
    ResType,
    LoginPlatform,
    HasAccess,
    getFileCatalogDetail,
} from '@/core'
import { getPlatformNumber } from '@/utils'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'
import ApplicationServiceDetail from '@/components/DataAssetsCatlg/ApplicationServiceDetail'
import {
    ResourceType,
    resourceTypeList,
    typeOptoins,
} from '@/components/ResourcesDir/const'
import CityShareOperation from '../CityShareOperation'
import FeedbackOperation from '../FeedbackOperation'
import FavoriteOperation, {
    UpdateFavoriteParams,
} from '@/components/Favorite/FavoriteOperation'
import { DataCatlgTabKey } from '../helper'
import FileDetail from '@/components/DataAssetsCatlg/FileInfoDetail'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import CitySharingDrawer from '@/components/CitySharing/CitySharingDrawer'

interface ICatalogCard {
    open: boolean
    onClose: () => void
    toOpenDetails: (activeTabKey?: DataCatlgTabKey) => void
    info: any
    catalogId: any
    style?: any
    onAddFavorite?: ({ is_favored, favor_id }: UpdateFavoriteParams) => void
    onCancelFavorite?: ({ is_favored, favor_id }: UpdateFavoriteParams) => void
}
const CatalogCard = (props: ICatalogCard) => {
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

    const [isLoading, setIsLoading] = useState(false)
    const [cardInfoData, setCardInfoData] = useState<any[]>(cardInfoList)
    const [activeKey, setActiveKey] = useState<string>('1')
    const [infolist, setInfolist] = useState<any[]>([])
    const [selectedId, setSelectedId] = useState<string>('')
    const [logicViewDetailOpen, setLogicViewDetailOpen] =
        useState<boolean>(false)
    const [applicationServiceOpen, setApplicationServiceOpen] =
        useState<boolean>(false)
    const [mountRescInfo, setMountRescInfo] = useState<any[]>([])
    const [isRescExist, setIsRescExist] = useState<boolean>(false)
    const [fileDetailOpen, setFileDetailOpen] = useState<boolean>(false)
    const [isFileResource, setIsFileResource] = useState<boolean>(false)
    // useCogAsstContext 已移除，相关功能已下线
    const { checkPermissions } = useUserPermCtx()

    const hasBusinessRoles = useMemo(
        () => checkPermissions(HasAccess.isHasBusiness),
        [checkPermissions],
    )
    const platform = getPlatformNumber()
    // 目录共享申报
    const [applyCatalog, setApplyCatalog] = useState<any>()

    useEffect(() => {
        if (catalogId) {
            setIsRescExist(false)
            getDetails()
            getMountInfo()
            getInfoItems()
        }
    }, [catalogId])

    useEffect(() => {
        if (!mountRescInfo) return
        checkRescIsExist(mountRescInfo)
    }, [mountRescInfo])

    const checkRescIsExist = async (resc: any = undefined) => {
        const { resource_id, resource_type } = resc || {}
        if (!resc || !resource_id) return
        let flag = true

        try {
            if (resource_type === ResourceType.DataView) {
                await getDatasheetViewDetails(resource_id)
            } else if (resource_type === ResourceType.Api) {
                await detailFrontendServiceOverview(resource_id)
            } else if (resource_type === ResourceType.File) {
                await getFileCatalogDetail(resource_id)
            }
        } catch (e) {
            const errCode = e?.data?.code || ''
            if (
                [
                    'DataApplicationService.Service.ServiceIDNotExist',
                    'DataView.FormView.FormViewIdNotExist',
                ].includes(errCode)
            ) {
                flag = false
            } else {
                formatError(e)
            }
        } finally {
            setIsRescExist(flag)
            // if (!flag) {
            //     setMountResoureInfoData(
            //         mountResoureInfoList.map((item) => {
            //             const render =
            //                 item.key === 'name'
            //                     ? () => {
            //                           return (
            //                               <Tooltip
            //                                   title={
            //                                       flag
            //                                           ? ''
            //                                           : __('挂接资源已不存在')
            //                                   }
            //                               >
            //                                   <a
            //                                       type="link"
            //                                       onClick={() =>
            //                                           flag &&
            //                                           resourceNameClick(
            //                                               mountRescInfo,
            //                                           )
            //                                       }
            //                                       title={resc?.[item.key]}
            //                                       className={classnames(
            //                                           styles.mountNameBtn,
            //                                           !flag &&
            //                                               styles.mountNameBtnDisable,
            //                                       )}
            //                                   >
            //                                       {resc?.[item.key]}
            //                                   </a>
            //                               </Tooltip>
            //                           )
            //                       }
            //                     : undefined
            //             return {
            //                 ...item,
            //                 render,
            //             }
            //         }),
            //     )
            // }
        }
    }
    const getInfoItems = async () => {
        try {
            const res = await reqDataCatlgColumnInfo({
                catalogId: info?.id,
                limit: 0,
            })
            setInfolist(
                (res.columns || []).map((item) => {
                    const type = typeOptoins.find(
                        (it) => item.data_type === it.value,
                    )?.strValue
                    return {
                        ...item,
                        name: item.business_name,
                        code: item.technical_name,
                        dataType: type,
                        isPrimary: !!item.primary_flag,
                    }
                }),
            )
        } catch (err) {
            formatError(err)
            setInfolist([])
        }
    }

    useEffect(() => {
        if (isFileResource) {
            // 文件卡片-初始化tab时挂接资源
            getMountInfo()
            setActiveKey('2')
        } else {
            // 库表、接口有信息项
            setActiveKey('1')
            getInfoItems()
        }
    }, [isFileResource])

    const resourceNameClick = (record) => {
        setSelectedId(record.resource_id)
        if (record.resource_type === ResourceType.DataView) {
            setLogicViewDetailOpen(true)
        } else if (record.resource_type === ResourceType.File) {
            setFileDetailOpen(true)
        } else if (record.resource_type === ResourceType.Api) {
            setApplicationServiceOpen(true)
        }
    }

    const items: any = useMemo(() => {
        return [
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
                            <CatalogInfoItemDetails
                                key={index}
                                dataList={item}
                            />
                        )
                    })
                ) : (
                    <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                ),
                isShow: !isFileResource,
            },
            {
                label: __('挂接资源'),
                key: '2',
                children: (
                    <CatalogMountResource
                        onResourceClick={resourceNameClick}
                        resourceList={getMountResoureList(mountRescInfo)}
                    />
                ),
                isShow: true,
            },
        ]
    }, [infolist, isFileResource])

    const getDetails = async () => {
        try {
            setIsLoading(true)
            const res = await reqDataCatlgBasicInfo(catalogId)
            const mountRes = await getDataCatalogMountFrontend(catalogId)
            let resource_type = uniq(
                mountRes?.mount_resource?.map(
                    (o) =>
                        resourceTypeList.find(
                            (i) => o.resource_type === i.value,
                        )?.label,
                ) || [],
            )?.join('、')
            const hasApi =
                mountRes?.mount_resource?.find(
                    (o) => o.resource_type === ResourceType.DataView,
                )?.children?.length > 0
            if (hasApi) {
                resource_type = `${resource_type}、${__('接口')}`
            }
            setIsFileResource(
                mountRes?.mount_resource.every(
                    (item) => item.resource_type === ResourceType.File,
                ),
            )
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
                        value:
                            item.key === 'resource_type'
                                ? resource_type
                                : res[item.key],
                        render: item.key === 'description' ? render : undefined,
                    }
                }),
            )
        } catch (err) {
            formatError(err)
        } finally {
            setIsLoading(false)
        }
    }

    const getMountInfo = async () => {
        try {
            const res = await getDataCatalogMountFrontend(info?.id)
            const mountInfo = res?.mount_resource
            setMountRescInfo(mountInfo)
            // setMountResoureInfoData(
            //     mountResoureInfoList.map((item) => {
            //         const value =
            //             item.key === 'publish_at'
            //                 ? moment(mountInfo?.[item.key]).format(
            //                       'YYYY-MM-DD HH:mm:ss',
            //                   )
            //                 : mountInfo[item.key]
            //         const render =
            //             item.key === 'name'
            //                 ? () => {
            //                       return (
            //                           <a
            //                               type="link"
            //                               onClick={() =>
            //                                   resourceNameClick(mountInfo)
            //                               }
            //                               title={mountInfo?.[item.key]}
            //                               className={styles.mountNameBtn}
            //                           >
            //                               {mountInfo?.[item.key]}
            //                           </a>
            //                       )
            //                   }
            //                 : undefined
            //         return {
            //             ...item,
            //             label:
            //                 item.key === 'name' &&
            //                 mountInfo?.resource_type === ResourceType.File
            //                     ? __('文件资源名称')
            //                     : item.label,
            //             value,
            //             render,
            //         }
            //     }),
            // )
        } catch (err) {
            formatError(err)
        }
    }

    // 是否能问答 - 认知助手功能已下线
    const canChatEnable = false

    return (
        <div className={styles.catalogCard}>
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
                            <Space size={10}>
                                {/* 引用资源提问按钮 */}
                                {/* {hasBusinessRoles && (
                                    <Tooltip
                                        placement="bottomRight"
                                        arrowPointAtCenter
                                        title={chatTipCatalog(
                                            'normal',
                                            info?.is_online,
                                            info?.actions?.includes('read'),
                                            info?.data_resource_type,
                                        )}
                                    >
                                        <FontIcon
                                            name="icon-yinyong1"
                                            className={classnames({
                                                [styles.icon]: true,
                                                [styles.disableIcon]:
                                                    !canChatEnable,
                                            })}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                if (!canChatEnable) return
                                                updateParams(
                                                    CogAParamsType.Resource,
                                                    {
                                                        data: [
                                                            {
                                                                id: catalogId,
                                                                name: info?.raw_name,
                                                                type: 'data_catalog',
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

                                {/* 反馈 */}
                                {info.is_online && (
                                    <FeedbackOperation
                                        catalog={info}
                                        className={styles.icon}
                                    />
                                )}

                                {/* 收藏 */}
                                {info.is_online && (
                                    <FavoriteOperation
                                        item={info}
                                        className={styles.icon}
                                        resType={ResType.DataCatalog}
                                        onAddFavorite={onAddFavorite}
                                        onCancelFavorite={onCancelFavorite}
                                    />
                                )}

                                {/* 申请共享 */}
                                {/* {info.is_online && (
                            <CityShareOperation
                                catalog={info}
                                className={styles.icon}
                                disabledClassName={styles.disableIcon}
                                showClassName={styles.showIcon}
                                offset={[-2, 6]}
                            />
                        )} */}

                                {/* 加入/移出共享清单+共享申请 */}
                                {info.is_online &&
                                    platform === LoginPlatform.drmp && (
                                        <CityShareOperation
                                            catalog={info}
                                            isMarketCard
                                            // className={styles.itemOprIcon}
                                            // disabledClassName={styles.itemOprDiabled}
                                            // showClassName={styles.itemOprIconVisible}
                                            className={styles.icon}
                                            disabledClassName={
                                                styles.disableIcon
                                            }
                                            showClassName={styles.showIcon}
                                            type="icon"
                                            onApply={(value) => {
                                                setApplyCatalog(value)
                                            }}
                                            offset={[-2, 6]}
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
                // width={418}
                style={
                    style || {
                        height: 'calc(100% - 96px)',
                        marginTop: '72px',
                        marginRight: '24px',
                    }
                }
                getContainer={false}
                mask={false}
                destroyOnClose
                footer={false}
                zIndex={998}
                bodyStyle={{ padding: '8px 16px 16px' }}
                contentWrapperStyle={{
                    width: '100%',
                }}
            >
                {isLoading ? (
                    <Loader />
                ) : (
                    <div className={styles.drawerWrapper}>
                        <DetailsLabel detailsList={cardInfoData} />
                        <Tabs
                            activeKey={activeKey}
                            onChange={(val) => {
                                setActiveKey(val)
                                if (val === '2') {
                                    getMountInfo()
                                }
                            }}
                            getPopupContainer={(node) => node}
                            tabBarGutter={32}
                            items={items?.filter((item) => item.isShow)}
                            destroyInactiveTabPane
                            style={{ marginLeft: '8px' }}
                        />
                    </div>
                )}
            </Drawer>
            {logicViewDetailOpen && selectedId && (
                <LogicViewDetail
                    open={logicViewDetailOpen}
                    onClose={() => {
                        setLogicViewDetailOpen(false)
                    }}
                    id={selectedId}
                />
            )}
            {applicationServiceOpen && selectedId && (
                <ApplicationServiceDetail
                    open={applicationServiceOpen}
                    onClose={() => {
                        setApplicationServiceOpen(false)
                    }}
                    serviceCode={selectedId}
                />
            )}
            {fileDetailOpen && selectedId && (
                <FileDetail
                    open={fileDetailOpen}
                    onClose={() => {
                        setFileDetailOpen(false)
                    }}
                    id={selectedId}
                    isIntroduced
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        top: '52px',
                        borderTop: '1px solid rgb(0 0 0 / 10%)',
                        zIndex: 1001,
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
    )
}
export default CatalogCard
