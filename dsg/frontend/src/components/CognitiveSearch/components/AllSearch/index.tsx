import { useUpdateEffect } from 'ahooks'
import { List, message } from 'antd'
import { memo, useEffect, useMemo, useState } from 'react'
import classnames from 'classnames'
import { useSearchParams } from 'react-router-dom'
import {
    RescErrorCodeList,
    formatCatlgError,
} from '@/components/DataAssetsCatlg/helper'
import {
    HasAccess,
    OnlineStatus,
    getRepositoryIsOnline,
    reqCatlgCommonInfo,
} from '@/core'
import { useQuery } from '@/utils'
import { ParamsType, useCongSearchContext } from '../../CogSearchProvider'
import { BusinObjOpr, AssetType } from '../../const'
import __ from '../../locale'
import DerivationModel from '../DerivationModel'
import { IConditions } from '../InterfaceSvc/FilterLine'
import PageLayout from '../PageLayout'
import ScrollList from '../ScrollList'
import styles from '../styles.module.less'
import ApplicationServiceDetail from '@/components/DataAssetsCatlg/ApplicationServiceDetail'
import DataCatlgContent from '@/components/DataAssetsCatlg/DataCatlgContent'
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'
import LogicViewCard from '@/components/DataAssetsCatlg/LogicViewDetail/LogicViewCard'
import InterfaceCard from '@/components/DataAssetsCatlg/ApplicationServiceDetail/InterfaceCard'
import IndicatorItem from '../Indicator/IndicatorItem'
import IndicatorViewCard from '@/components/DataAssetsCatlg/IndicatorViewDetail/IndicatorViewCard'
import IndicatorViewDetail from '@/components/DataAssetsCatlg/IndicatorViewDetail'
import DataRescItem from '@/components/DataAssetsCatlg/DataResc/DataRescItem'
import { DataRescType } from '@/components/DataAssetsCatlg/ApplicationService/helper'
import { useAuditProcess } from '@/hooks/useAuditProcess'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import DataDownloadConfig from '@/components/DataAssetsCatlg/DataDownloadConfig'
import AuthInfo from '@/components/MyAssets/AuthInfo'
import DragBox from '@/components/DragBox'
import { BizType, PolicyType } from '@/components/AuditPolicy/const'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

function AllSearch({ getAddAsset, addedAssets }: any) {
    const {
        loading,
        searchKey,
        searchInfo,
        conditions,
        updateParams,
        data,
        bigHeader,
        onLoadMore,
        isCongSearch,
    } = useCongSearchContext()
    const { checkPermissions } = useUserPermCtx()
    // const [hasAuditProcess, refreshAuditProcess] = useAuditProcess({
    //     audit_type: PolicyType.AssetPermission,
    //     service_type: BizType.AuthService,
    // })

    const [userId] = useCurrentUser('ID')
    // 是否拥有数据运营工程师
    const hasDataOperRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermissions])
    const [defaultSize, setDefaultSize] = useState<Array<number>>(
        JSON.parse(localStorage.getItem('marketConSize') || '[60, 40]'),
    )
    const [isDragging, setIsDragging] = useState(false)
    const [filters, setFilters] = useState<IConditions>({})
    const [scrollTop, setScrollTop] = useState<number>(0)
    const [dataCatlgVisible, setDataCatlgVisible] = useState<boolean>(false)
    const [graphVisible, setGraphVisible] = useState<boolean>(false)
    // 被点击资源项
    const [current, setCurrent] = useState<any>()
    // 被点击名称资源项
    const [curDetailResc, setCurDetailResc] = useState<any>()
    const [showGraph, setShowGraph] = useState<boolean>(false)

    // 数据库表详情
    const [viewDetailOpen, setViewDetailOpen] = useState<boolean>(false)
    // 数据库表卡片详情
    const [viewCardOpen, setViewCardOpen] = useState<boolean>(false)
    // 接口详情
    const [interfaceDetailOpen, setInterfaceDetailOpen] =
        useState<boolean>(false)
    // 接口卡片详情
    const [interfaceCardOpen, setInterfaceCardOpen] = useState<boolean>(false)
    const [authInfoOpen, setAuthInfoOpen] = useState<boolean>(false)
    const [downloadOpen, setDownloadOpen] = useState(false)

    // 指标详情详情
    const [indicatorDetailOpen, setIndicatorDetailOpen] =
        useState<boolean>(false)
    // 指标卡片详情
    const [indicatorCardOpen, setIndicatorCardOpen] = useState<boolean>(false)

    const [searchParams, setSearchParams] = useSearchParams()
    const query = useQuery()
    // 库表详情 id
    const dataviewId = query.get('dataviewId') || ''
    // 指标详情id
    const indicatorId = query.get('indicatorId') || ''

    useEffect(() => {
        if (dataviewId) {
            setViewDetailOpen(true)
        }
    }, [dataviewId])

    useEffect(() => {
        if (indicatorId) {
            setIndicatorDetailOpen(true)
        }
    }, [indicatorId])

    useUpdateEffect(() => {
        setScrollTop(0)
    }, [conditions])
    const updateData = () => {}

    useEffect(() => {
        // 重新搜索数据时，关闭所有抽屉
        setViewDetailOpen(false)
        setViewCardOpen(false)
        setInterfaceDetailOpen(false)
        setInterfaceCardOpen(false)
        setIndicatorCardOpen(false)
        setIndicatorDetailOpen(false)
        if (dataviewId) {
            setViewDetailOpen(true)
            return
        }
        if (indicatorId) {
            setIndicatorDetailOpen(true)
        }
    }, [searchInfo, dataviewId, indicatorId])

    // 更新当前列表项权限
    const updCurItemDownloadAccess = async (cId: string, newItem?: any) => {
        let curItem = newItem
        if (!newItem) {
            try {
                // 根据审核策略不同,申请可能会被自动拒绝或其他情况
                // 获取最新权限值来设置按钮状态
                curItem = await reqCatlgCommonInfo(cId)
            } catch (error) {
                // 需求申请中报错不进行路由跳转
                formatCatlgError(error)
            }
        }

        const listDataTemp = data?.map((liItem) => {
            if (liItem.id === curItem.id) {
                return {
                    ...liItem,
                    download_access: curItem?.download_access,
                }
            }
            return liItem
        })
        // setData(listDataTemp)
    }

    // 目录下载或添加到申请清单操作成功/失败之后的更新操作
    const handleAssetBtnUpdate = async (
        type: BusinObjOpr,
        item: any,
        newItem?: any,
    ) => {
        if (type === BusinObjOpr.DATADOWNLOAD) {
            // 申请下载
            updCurItemDownloadAccess(item?.id, newItem)
        } else {
            // 失效资源添加到申请清单 或 立即申请-资源不支持 ——刷新列表
            updateData()
        }
    }

    const handleError = (error?: any) => {
        const { code } = error?.data || {}

        // 资源下线-刷新列表（其他错误如服务器错误等，不刷新列表）
        if (code === RescErrorCodeList.ASSETSOFFLINEERROR) {
            updateData()
        }
    }

    const getAssetIsOnline = async (item: any, type: AssetType) => {
        try {
            const res = await getRepositoryIsOnline(item?.id)
            if (!res.available) {
                message.error(
                    __('当前目录暂不支持在数据资源目录中查看，请查看其他目录'),
                )
                updateData()
            } else {
                onItemClick(item, type)
            }
        } catch (error) {
            message.error(
                __('当前目录暂不支持在数据资源目录中查看，请查看其他目录'),
            )
        }
    }

    useUpdateEffect(() => {
        getData()
    }, [filters])

    const getData = async () => {
        updateParams(ParamsType.Filter, {
            published_at: filters?.onlineTime,
        })
    }
    const onItemClick = (item: any, _t?: AssetType) => {
        const { type } = item
        setCurrent(item)
        if (type === AssetType.LOGICVIEW) {
            setDataCatlgVisible(false)
            setInterfaceCardOpen(false)
            setIndicatorCardOpen(false)
            setViewCardOpen(true)
        } else if (type === AssetType.INDICATOR) {
            setDataCatlgVisible(false)
            setInterfaceCardOpen(false)
            setViewCardOpen(false)
            setIndicatorCardOpen(true)
        } else if (type === AssetType.INTERFACESVC) {
            setDataCatlgVisible(false)
            setIndicatorCardOpen(false)
            setInterfaceCardOpen(true)
            setViewCardOpen(false)
        }
    }

    const handleItemNameClick = (e: any, item: any) => {
        e.preventDefault()
        e.stopPropagation()
        const { type } = item
        setCurDetailResc(item)
        if (type === AssetType.LOGICVIEW) {
            setViewDetailOpen(true)
        } else if (type === AssetType.INTERFACESVC) {
            setInterfaceDetailOpen(true)
        } else if (type === AssetType.INDICATOR) {
            setIndicatorDetailOpen(true)
        }
    }

    const handleItemBtnClick = (item: any) => {
        const { id, type } = item
        setCurrent(item)

        if (type === DataRescType.INTERFACE) {
            setAuthInfoOpen(true)
        } else if (type === DataRescType.LOGICALVIEW) {
            setDownloadOpen(true)
        }
    }

    const onGraphClick = (item: any) => {
        setCurDetailResc(item)
        setGraphVisible(true)
    }
    /**
     * 数据目录项
     */
    const itemRender = (item) => {
        const { type } = item
        if (type === AssetType.INDICATOR) {
            return (
                <List.Item
                    key={item.id}
                    className={classnames(
                        styles['list-item'],
                        current?.id === item.id && styles['is-selected'],
                    )}
                >
                    <IndicatorItem
                        key={item.id}
                        item={item}
                        onCloseDetail={() => getData()}
                        // confirmApplyApplication={() => getData()}
                        onItemClick={onItemClick}
                        onGraphClick={onGraphClick}
                        isCongSearch={isCongSearch}
                        isSelected={current?.id === item.id}
                        onNameClick={(e) => handleItemNameClick(e, item)}
                    />
                </List.Item>
            )
        }

        return (
            <DataRescItem
                item={{
                    ...item,
                    name: item.title,
                    raw_name: item.raw_title,
                    published_status: item.publish_status,
                    is_online: [
                        OnlineStatus.ONLINE,
                        OnlineStatus.DOWN_AUDITING,
                        OnlineStatus.DOWN_REJECT,
                    ].includes(item.online_status),
                    actions: item.available_status === '1' ? ['read'] : [],
                }}
                key={item.id}
                fieldKeys={{
                    nameCn: 'field_name_zh',
                    rawNameCn: 'raw_field_name_zh',
                    nameEn: 'field_name_en',
                    rawNameEn: 'raw_field_name_en',
                }}
                isSearchingByKeyword
                isCongSearch={isCongSearch}
                selectedResc={current}
                onNameClick={(e) => handleItemNameClick(e, item)}
                onItemClick={(e) => onItemClick(item)}
                onItemBtnClick={(e) => handleItemBtnClick(item)}
                onGraphClick={onGraphClick}
                confirmApplyApplication={() => getData()}
                hasDataOperRole={hasDataOperRole}
                handleRefresh={() => getData()}
                // hasAuditProcess={hasAuditProcess}
                // refreshAuditProcess={refreshAuditProcess}
            />
        )
        // return (
        //     <List.Item
        //         key={item.id}
        //         className={classnames(
        //             styles['list-item'],
        //             current?.id === item.id && styles['is-selected'],
        //         )}
        //     >
        //         <InterfaceItem
        //             key={item.id}
        //             item={item}
        //             onCloseDetail={() => getData()}
        //             confirmApplyApplication={() => getData()}
        //             onItemClick={onItemClick}
        //             onGraphClick={onGraphClick}
        //             isCongSearch={isCongSearch}
        //             isSelected={current?.id === item.id}
        //         />
        //     </List.Item>
        // )
    }

    const dataSource = useMemo(() => data?.entries || undefined, [data])

    const renderListContent = () => {
        return (
            <div className={styles['page-wrapper-content']}>
                <div className={styles['page-wrapper-top']}>
                    {/* <FilterLine onChange={(cond) => setFilters(cond)} /> */}
                    <div className={styles['page-wrapper-top-count']}>
                        {__('共')}
                        <span>{data?.total_count ?? 0}</span>
                        {__('条结果')}
                    </div>
                </div>
                <ScrollList
                    isSearch={searchKey}
                    loading={loading}
                    scrollTop={scrollTop}
                    itemRender={itemRender}
                    hasMore={
                        dataSource !== undefined &&
                        dataSource?.length < data?.total_count
                    }
                    data={dataSource}
                    onLoad={() => {
                        onLoadMore()
                    }}
                />
            </div>
        )
    }

    return (
        <>
            <PageLayout>
                {viewCardOpen || interfaceCardOpen || indicatorCardOpen ? (
                    <DragBox
                        defaultSize={defaultSize}
                        minSize={[273, 417]}
                        maxSize={[Infinity, 600]}
                        onDragStart={() => {
                            setIsDragging(true)
                        }}
                        onDragEnd={(size) => {
                            setIsDragging(false)
                            setDefaultSize(size)
                            localStorage.setItem(
                                'marketConSize',
                                JSON.stringify(size),
                            )
                        }}
                        cursor="col-resize"
                        gutterSize={1}
                        gutterStyles={{
                            width: '4px',
                            borderRight: '4px solid rgb(0 0 0 / 0%)',
                            borderLeft: 'none !important',
                        }}
                        splitClass={classnames(
                            styles['page-wrapper-dragBox'],
                            isDragging && styles['page-wrapper-isDraggingBox'],
                        )}
                        showExpandBtn={false}
                        rightNodeStyle={{
                            padding: 0,
                            minWidth: 417,
                        }}
                    >
                        {renderListContent()}
                        {(viewCardOpen ||
                            interfaceCardOpen ||
                            indicatorCardOpen) && (
                            <div className={styles['page-wrapper-card']}>
                                {current?.type &&
                                current?.type === AssetType.LOGICVIEW ? (
                                    <LogicViewCard
                                        id={current?.id}
                                        open={viewCardOpen}
                                        allowChat={
                                            current?.available_status === '1' ||
                                            userId === current?.owner_id
                                        }
                                        allowDownload={current?.has_permission}
                                        onClose={() => {
                                            setViewCardOpen(false)
                                            setCurDetailResc(undefined)
                                        }}
                                        onSure={() => {}}
                                        onDownload={() => {
                                            setDownloadOpen(true)
                                        }}
                                        onFullScreen={() => {
                                            setCurDetailResc(current)
                                            setViewDetailOpen(true)
                                        }}
                                    />
                                ) : current?.type === AssetType.INDICATOR ? (
                                    <IndicatorViewCard
                                        open={indicatorCardOpen}
                                        onClose={() => {
                                            setIndicatorCardOpen(false)
                                            setCurDetailResc(undefined)
                                        }}
                                        onSure={() => {}}
                                        indicatorId={current?.id}
                                        onFullScreen={() => {
                                            setCurDetailResc(current)
                                            setIndicatorDetailOpen(true)
                                        }}
                                        allowRead={
                                            current?.available_status === '1' ||
                                            userId === current?.owner_id
                                        }
                                    />
                                ) : (
                                    <InterfaceCard
                                        open={interfaceCardOpen}
                                        onClose={() => {
                                            setInterfaceCardOpen(false)
                                            setCurDetailResc(undefined)
                                        }}
                                        onSure={() => {}}
                                        interfaceId={current?.id}
                                        onFullScreen={() => {
                                            setCurDetailResc(current)
                                            setInterfaceDetailOpen(true)
                                        }}
                                        allowChat={
                                            (current?.available_status ===
                                                '1' ||
                                                userId === current?.owner_id) &&
                                            [
                                                OnlineStatus.ONLINE,
                                                OnlineStatus.DOWN_AUDITING,
                                                OnlineStatus.DOWN_REJECT,
                                            ].includes(current?.online_status)
                                        }
                                    />
                                )}
                            </div>
                        )}
                    </DragBox>
                ) : (
                    renderListContent()
                )}

                {graphVisible && (
                    <DerivationModel
                        open={graphVisible}
                        item={curDetailResc}
                        type={curDetailResc?.type}
                        handleClose={() => {
                            setGraphVisible(false)
                        }}
                        handleDetail={() => {
                            setGraphVisible(false)
                            setShowGraph(true)
                            if (curDetailResc?.type === AssetType.DATACATLG) {
                                setDataCatlgVisible(true)
                            } else if (
                                curDetailResc?.type === AssetType.INTERFACESVC
                            ) {
                                setInterfaceDetailOpen(true)
                            } else if (
                                curDetailResc?.type === AssetType.LOGICVIEW
                            ) {
                                setViewDetailOpen(true)
                            } else if (
                                curDetailResc?.type === AssetType.INDICATOR
                            ) {
                                setIndicatorDetailOpen(true)
                            }
                        }}
                    />
                )}
            </PageLayout>
            {dataCatlgVisible && (
                <DataCatlgContent
                    open={dataCatlgVisible}
                    onClose={() => {
                        setDataCatlgVisible(false)
                        if (showGraph) {
                            setGraphVisible(true)
                            setShowGraph(false)
                        }
                    }}
                    assetsId={current?.id}
                    isIntroduced={false}
                    handleAssetBtnUpdate={() => {}}
                    errorCallback={() => {}}
                    canChat
                    hasAsst
                />
            )}
            {interfaceDetailOpen && (
                <ApplicationServiceDetail
                    open={interfaceDetailOpen}
                    onClose={() => {
                        setInterfaceDetailOpen(false)
                        setCurDetailResc(undefined)

                        if (showGraph) {
                            setGraphVisible(true)
                            setShowGraph(false)
                        }
                    }}
                    serviceCode={curDetailResc?.id}
                    isIntroduced
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        top: bigHeader ? '62px' : '52px',
                    }}
                    hasAsst
                />
            )}

            {viewDetailOpen && (
                <LogicViewDetail
                    open={viewDetailOpen}
                    onClose={() => {
                        setViewDetailOpen(false)
                        setCurDetailResc(undefined)
                        if (showGraph) {
                            setGraphVisible(true)
                            setShowGraph(false)
                        }
                        if (dataviewId) {
                            searchParams.delete('dataviewId')
                            setSearchParams(searchParams)
                        }
                    }}
                    hasPermission={current?.has_permission}
                    id={curDetailResc?.id}
                    isIntroduced
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        top: bigHeader ? '62px' : '52px',
                    }}
                    canChat
                    hasAsst
                />
            )}

            {indicatorDetailOpen && (
                <IndicatorViewDetail
                    open={indicatorDetailOpen}
                    onClose={() => {
                        setIndicatorDetailOpen(false)
                        setCurDetailResc(undefined)
                        if (showGraph) {
                            setGraphVisible(true)
                            setShowGraph(false)
                        }
                        if (indicatorId) {
                            searchParams.delete('indicatorId')
                            setSearchParams(searchParams)
                        }
                    }}
                    id={curDetailResc?.id}
                    indicatorType={current?.indicator_type}
                    isIntroduced
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        top: bigHeader ? '62px' : '52px',
                    }}
                    canChat
                    hasAsst
                />
            )}
            {/* 调用信息 */}
            {authInfoOpen && (
                <AuthInfo
                    id={current?.id}
                    open={authInfoOpen}
                    onClose={() => {
                        setAuthInfoOpen(false)
                    }}
                />
            )}
            {/* 下载 */}
            {downloadOpen && (
                <DataDownloadConfig
                    formViewId={current?.id}
                    open={downloadOpen}
                    drawerStyle={{
                        position: 'fixed',
                        width: '100vw',
                        height: `calc(100vh - ${bigHeader ? 62 : 52}px)`,
                        top: bigHeader ? '62px' : '52px',
                        left: 0,
                        zIndex: 1001,
                    }}
                    onClose={() => {
                        setDownloadOpen(false)
                    }}
                />
            )}
        </>
    )
}

export default memo(AllSearch)
