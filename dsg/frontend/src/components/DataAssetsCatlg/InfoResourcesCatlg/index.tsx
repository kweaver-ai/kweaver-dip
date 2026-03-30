import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
    useMemo,
} from 'react'
import { LeftOutlined } from '@ant-design/icons'
import { List, Tooltip, Col, Row, BackTop } from 'antd'
import classnames from 'classnames'
import { isNumber } from 'lodash'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useUpdateEffect } from 'ahooks'
import { FontIcon, ReturnTopOutlined, ViewOutlined } from '@/icons'
import { IconType } from '@/icons/const'
import styles from '../styles.module.less'
import __ from '../locale'
import {
    businessAssetsFilterInit,
    businTreeFilterInit,
    goBackTop,
    IBusinessAssetsFilterQuery,
    ViewType,
    infoRescFilterConditionConfig,
    getMoreInfoData,
} from '../helper'
import {
    formatError,
    queryInfoResCatlgListFrontend,
    queryInfoResCatlgList,
    IBusinNodeParams,
    IqueryInfoResCatlgItem,
    ResType,
    LoginPlatform,
} from '@/core'
import { Empty, Loader, SearchInput } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import FilterConditionLayout from '../FilterConditionLayout'
import { CogAParamsType } from '@/context'
import {
    CatalogMoreInfo,
    CatalogInfoItems,
    PublishStatusTag,
    OnlineStatusTag,
} from '../CatalogMoreInfo'
import InfoCatlgCard from './InfoCatlgCard'
import ResourcesCustomTree from '../../ResourcesDir/ResourcesCustomTree'
import InfoCatlgDetails from './InfoCatlgDetails'
import {
    PublishStatus,
    PublishStatusList,
    OnlineStatus,
    OnlineStatusList,
} from '@/components/InfoRescCatlg/const'
import { getPlatformNumber } from '@/utils'
import FavoriteOperation, {
    UpdateFavoriteParams,
} from '@/components/Favorite/FavoriteOperation'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IDataCatlgProps {
    // searchKey: string
}

// 默认加载条数
export const defaultListSize = 20
const scrollListId = 'scrollableDiv'

const InfoResourcesCatlg = forwardRef((props: IDataCatlgProps, ref) => {
    // const {
    //     searchKey,
    // } = props

    const [expand, setExpand] = useState<boolean>(true)

    // 右侧列表页loading
    const [listDataLoading, setListDataLoading] = useState(true)

    const [viewKey, setViewKey] = useState<ViewType>(
        businTreeFilterInit.category_type,
    )

    const [isShowAll, setIsShowAll] = useState(false)
    const [isInit, setIsInit] = useState(true)

    const [selectedNode, setSelectedNode] = useState<any>({})

    // 业务逻辑实体列表
    const [listData, setListData] = useState<Array<any>>()
    const [roleList, setRoleList] = useState<Array<any>>()
    // 类目
    const [categorys, setCategorys] = useState<Array<any>>([])

    // 左侧视角-树结构搜索条件
    const [filterTreeCondition, setfilterTreeConditoin] =
        useState<IBusinNodeParams>({
            ...businTreeFilterInit,
        })

    // 右侧列表搜索条件
    const [filterListCondition, setFilterListCondition] =
        useState<IBusinessAssetsFilterQuery>({
            ...businessAssetsFilterInit,
        })

    const [searchKeyword, setSearchKeyword] = useState<string>('')

    // 数据总条数
    const [totalCount, setTotalCount] = useState<number>(0)
    const [isSearch, setIsSearch] = useState<boolean>(false)
    const [catalogCardOpen, setCatalogCardOpen] = useState<boolean>(false)

    // useCogAsstContext 已移除，相关功能已下线

    const { checking, checkPermission } = useUserPermCtx()

    // 是否拥有数据资源访问权限
    const hasDataAccessPermission = useMemo(
        () => checkPermission('accessDataResource'),
        [checkPermission],
    )

    // 是否拥有管理目录权限
    const hasDataOperRole = useMemo(() => {
        return checkPermission('manageResourceCatalog') ?? false
    }, [checkPermission])

    const platform = getPlatformNumber()

    const showCardStyle = {
        width: 'calc(100% - 418px)',
        borderRight: '16px solid #F0F2F6',
    }

    useEffect(() => {
        if (!checking) {
            loadEntityList(filterListCondition, '')
        }
    }, [hasDataOperRole, checking])

    useUpdateEffect(() => {
        if (!isInit) {
            loadEntityList(filterListCondition, searchKeyword)
        }
    }, [searchKeyword])

    useEffect(() => {
        const cate_info = {
            cate_id: selectedNode?.cate_id || '',
            node_id: selectedNode?.id || '',
        }

        if (!isInit) {
            loadEntityList(
                {
                    ...filterListCondition,
                    cate_info: selectedNode?.id ? cate_info : undefined,
                },
                searchKeyword,
            )
        }
        setCatalogCardOpen(false)
    }, [selectedNode])

    useEffect(() => {
        if (viewKey === ViewType.ORGNIZATION) {
            setIsShowAll(false)
        } else {
            setIsShowAll(true)
        }
        setSelectedNode({})
        setfilterTreeConditoin({
            ...businTreeFilterInit,
            category_type: viewKey,
        })
    }, [viewKey])

    const filterConfig = useMemo(() => {
        return hasDataOperRole
            ? infoRescFilterConditionConfig
            : infoRescFilterConditionConfig.filter(
                  (item) =>
                      item.key !== 'publish_status' &&
                      item.key !== 'online_status',
              )
    }, [hasDataOperRole])

    // 详情页抽屉的显示/隐藏
    const [detailOpen, setDetailOpen] = useState(false)
    // 点击详情对应item
    const [detailItem, setDetailItem] = useState<IqueryInfoResCatlgItem>()

    useImperativeHandle(ref, () => ({
        refresh,
        scrollListId,
    }))

    const refresh = () => {
        loadEntityList(filterListCondition, searchKeyword)
    }

    // 获取业务逻辑实体列表
    const loadEntityList = async (
        params: any,
        keyword: string,
        loadMore?: boolean,
    ) => {
        try {
            // 1：未发布，未上线；2已发布，已上线
            const upPubulishList = PublishStatusList.filter((item) =>
                [
                    PublishStatus.Unpublished,
                    PublishStatus.PublishedAuditing,
                    PublishStatus.PublishedAuditReject,
                ].includes(item.value),
            )?.map((item) => item.value)
            const pubulishList = PublishStatusList.filter(
                (item) => !upPubulishList.includes(item.value),
            )?.map((item) => item.value)

            const unOnLineList = [
                OnlineStatus.UnOnline,
                OnlineStatus.OnlineAuditing,
                OnlineStatus.OnlineAuditingReject,
                OnlineStatus.OfflineUpAuditingReject,
                OnlineStatus.OfflineUpAuditing,
                OnlineStatus.Offline,
            ]
            const OnLineList = OnlineStatusList.filter(
                (item) => !unOnLineList.includes(item.value),
            )?.map((item) => item.value)
            const statue = {
                publish_status:
                    typeof params?.publish_status === 'object' // 下一页继续保留
                        ? params?.publish_status
                        : params?.publish_status === '2'
                        ? pubulishList
                        : params?.publish_status === '1'
                        ? upPubulishList
                        : undefined,
                online_status:
                    typeof params?.online_status === 'object' // 下一页继续保留
                        ? params?.online_status
                        : params?.online_status === '2'
                        ? OnLineList
                        : params?.online_status === '1'
                        ? unOnLineList
                        : undefined,
            }
            const filter = {
                ...params,
                online_at: params?.online_at?.start_time
                    ? {
                          start: params?.online_at?.start_time,
                          end: params?.online_at?.end_time,
                      }
                    : undefined,
                ...statue,
            }
            let reqParams = {
                next_flag: params.next_flag,
                filter,
            }

            // 只有加载更多（加载下一页）的时候才传next_flag
            if (!loadMore) {
                setListDataLoading(true)
                delete reqParams.next_flag
            }
            // let isOwned: boolean = hasDataOperRole || false
            // if (!roleList?.length) {
            //     const roleRres = await getCurUserRoles()
            //     setRoleList(roleRres || [])
            //     isOwned = !!roleRres?.find((r) =>
            //         [
            //             allRoleList.TCDataOperationEngineer,
            //             allRoleList.TCDataGovernEngineer,
            //         ].includes(r.id),
            //     )
            //     setHasDataOperRole(isOwned)
            // }
            const action = hasDataOperRole
                ? queryInfoResCatlgList
                : queryInfoResCatlgListFrontend

            const res = await action({
                ...reqParams,
                keyword,
            })

            reqParams = {
                ...reqParams,
                next_flag: res.next_flag || [],
            }

            if (!loadMore) {
                setListData(res.entries || [])
            } else {
                const listDataTemp = listData || []
                setListData(listDataTemp?.concat(res.entries || []))
            }
            setTotalCount(res.total_count)
            setFilterListCondition({
                ...reqParams?.filter,
                next_flag: reqParams.next_flag,
            })
        } catch (error) {
            formatError(error)
        } finally {
            if (!loadMore) {
                setListDataLoading(false)
            }
            setIsInit(false)
        }
    }

    // 列表为空
    const showListDataEmpty = () => {
        const desc =
            searchKeyword || isSearch
                ? __('抱歉，没有找到相关内容')
                : __('暂无数据')
        const icon = searchKeyword || isSearch ? searchEmpty : dataEmpty
        return <Empty desc={desc} iconSrc={icon} />
    }

    const clickListItem = (item) => {
        setDetailItem(item)
        setCatalogCardOpen(true)
    }

    const clickListItemName = (item) => {
        setDetailItem(item)
        setDetailOpen(true)
    }

    // 更新列表项收藏状态
    const updateFavoriteInfo = ({
        res,
        item,
    }: {
        res: UpdateFavoriteParams
        item?: any
    }) => {
        setListData(
            listData?.map((liItem) => {
                if (liItem.id === item?.id) {
                    return {
                        ...liItem,
                        is_favored: res?.is_favored,
                        favor_id: res?.favor_id,
                    }
                }
                return liItem
            }),
        )
        if (detailItem?.id === item.id) {
            setDetailItem({
                ...detailItem,
                is_favored: res?.is_favored,
                favor_id: res?.favor_id,
            } as any)
        }
    }

    const renderListItem = (item) => {
        const publish = item?.status?.publish
        const online = item?.status?.online
        const onlineStatus = [
            OnlineStatus.UnOnline,
            OnlineStatus.OnlineAuditing,
            OnlineStatus.OnlineAuditingReject,
            OnlineStatus.Offline,
        ].includes(online)

        return (
            <List.Item
                key={item.id}
                className={styles.itemLi}
                onClick={() => {
                    clickListItem(item)
                }}
            >
                <div className={styles.itemTop}>
                    <div
                        className={styles.itemTopTitle}
                        onClick={(e) => {
                            e.stopPropagation()
                            clickListItemName(item)
                        }}
                    >
                        <FontIcon
                            name="icon-xinximulu1"
                            type={IconType.COLOREDICON}
                            className={styles.itemIcon}
                        />
                        {hasDataOperRole &&
                        publish !== PublishStatus.Published ? (
                            <PublishStatusTag status={publish} />
                        ) : null}
                        {hasDataOperRole &&
                        onlineStatus &&
                        publish === PublishStatus.Published ? (
                            <OnlineStatusTag status={online} />
                        ) : null}
                        <div
                            className={styles.itemTitle}
                            title={item.raw_name}
                            dangerouslySetInnerHTML={{
                                __html: item.name,
                            }}
                        />
                    </div>

                    {/* {item.is_online &&
                        item.actions?.includes('read') &&
                        hasDataAccessPermission && (
                            <Tooltip
                                placement="bottomRight"
                                arrowPointAtCenter
                                title={chatTip()}
                                getPopupContainer={(n) => n}
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
                                        updateParams(CogAParamsType.Resource, {
                                            data: [
                                                {
                                                    id: item.id,
                                                    name: item.raw_title,
                                                    type: 'data_catalog',
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
                    {/* 收藏 */}
                    {!onlineStatus && platform === LoginPlatform.drmp && (
                        <FavoriteOperation
                            item={item}
                            className={classnames(styles.itemOprIcon)}
                            resType={ResType.InfoCatalog}
                            onAddFavorite={(res) =>
                                updateFavoriteInfo({ res, item })
                            }
                            onCancelFavorite={(res) =>
                                updateFavoriteInfo({ res, item })
                            }
                        />
                    )}
                </div>
                <div className={styles.itemDesc}>
                    <span>{__('描述')}：</span>
                    <span
                        className={styles.text}
                        dangerouslySetInnerHTML={{
                            __html: item.description || '--',
                        }}
                        title={item.raw_description}
                    />
                </div>
                <div style={{ margin: '8px 8px 8px 0', width: '100%' }}>
                    <CatalogInfoItems
                        dataList={item?.columns?.map((it) => ({
                            name: it.raw_name,
                            rowName: it.name,
                        }))}
                    />
                </div>
                <CatalogMoreInfo
                    isShowScore={false}
                    categorys={categorys}
                    infoData={getMoreInfoData(item)}
                    filterKeys={['data_resource_type', 'subject_domain_name']}
                />
            </List.Item>
        )
    }

    return (
        <>
            <div
                className={classnames({
                    [styles.contentWrapper]: true,
                    [styles.businessAssetsWrapper]: true,
                })}
            >
                <Row
                    wrap={false}
                    style={{
                        height: '100%',
                        width: '100%',
                    }}
                >
                    <Col flex={expand ? '280px' : 0}>
                        <div
                            className={styles.unexpandSwitch}
                            onClick={() => setExpand(false)}
                            hidden={!expand}
                        >
                            <LeftOutlined />
                        </div>
                        <div className={styles.leftWrapper} hidden={!expand}>
                            <ResourcesCustomTree
                                getCategorys={setCategorys}
                                onChange={setSelectedNode}
                                needUncategorized
                            />
                        </div>

                        <span
                            className={styles.expandSwitch}
                            hidden={expand}
                            onClick={() => {
                                setExpand(true)
                            }}
                        >
                            <ViewOutlined />
                            <span>{__('视角')}</span>
                        </span>
                    </Col>
                    <Col flex="auto">
                        <div className={styles.rightWrapper}>
                            {/* 列表 */}
                            <div className={styles.catlgListWrapper}>
                                <div
                                    className={classnames(
                                        styles.listHeader,
                                        styles.catlgListHeader,
                                    )}
                                >
                                    <FilterConditionLayout
                                        layoutClassName={
                                            styles.catlgFilterLayout
                                        }
                                        filterConfig={filterConfig}
                                        updateList={(params: Object) => {
                                            loadEntityList(
                                                {
                                                    ...filterListCondition,
                                                    ...params,
                                                },
                                                searchKeyword,
                                            )
                                        }}
                                        getIsShowClearBtn={(flag) =>
                                            setIsSearch(flag)
                                        }
                                    />
                                    {/* {searchRender()} */}
                                    <Tooltip
                                        title={__(
                                            '搜索目录名称、编码、描述、信息项',
                                        )}
                                    >
                                        <SearchInput
                                            style={{
                                                marginLeft: '16px',
                                                width: '275px',
                                            }}
                                            placeholder={__(
                                                '搜索目录名称、编码、描述、信息项',
                                            )}
                                            value={searchKeyword}
                                            onKeyChange={(kw: string) => {
                                                setSearchKeyword(kw)
                                                loadEntityList(
                                                    filterListCondition,
                                                    kw,
                                                )
                                            }}
                                            onPressEnter={(e: any) => {
                                                setSearchKeyword(
                                                    e.target?.value,
                                                )
                                                loadEntityList(
                                                    filterListCondition,
                                                    e.target?.value,
                                                )
                                            }}
                                            maxLength={255}
                                        />
                                    </Tooltip>
                                </div>
                                <div
                                    className={styles.totalWrapper}
                                    style={catalogCardOpen ? showCardStyle : {}}
                                >
                                    共
                                    <span
                                        className={styles.totalCount}
                                    >{` ${totalCount} `}</span>
                                    条资源
                                </div>
                                <div
                                    className={styles.listLoading}
                                    hidden={!listDataLoading}
                                    style={
                                        catalogCardOpen
                                            ? {
                                                  ...showCardStyle,
                                                  height: '100%',
                                                  marginTop: 0,
                                              }
                                            : {}
                                    }
                                >
                                    <Loader />
                                </div>
                                <div
                                    id={scrollListId}
                                    className={styles.listDataWrapper}
                                    hidden={listDataLoading}
                                    style={catalogCardOpen ? showCardStyle : {}}
                                >
                                    {!listData?.length ? (
                                        <div className={styles.listEmpty}>
                                            {showListDataEmpty()}
                                        </div>
                                    ) : (
                                        <InfiniteScroll
                                            dataLength={listData.length}
                                            next={() => {
                                                loadEntityList(
                                                    filterListCondition,
                                                    searchKeyword,
                                                    true,
                                                )
                                            }}
                                            hasMore={
                                                isNumber(listData?.length) &&
                                                listData?.length < totalCount
                                            }
                                            loader={<div />}
                                            scrollableTarget={scrollListId}
                                            endMessage={
                                                listData?.length >=
                                                defaultListSize ? (
                                                    <div
                                                        style={{
                                                            textAlign: 'center',
                                                            color: 'rgba(0,0,0,0.25)',
                                                            padding: '8px 0',
                                                            fontSize: '12px',
                                                            background: '#fff',
                                                        }}
                                                    >
                                                        {__('已完成全部加载')}
                                                    </div>
                                                ) : undefined
                                            }
                                        >
                                            <List
                                                dataSource={listData}
                                                renderItem={renderListItem}
                                            />
                                        </InfiniteScroll>
                                    )}
                                </div>
                                <Tooltip title={__('回到顶部')} placement="top">
                                    <BackTop
                                        className={styles.backTop}
                                        style={
                                            catalogCardOpen
                                                ? {
                                                      right: '454px',
                                                  }
                                                : {}
                                        }
                                        target={() =>
                                            document.getElementById(
                                                scrollListId,
                                            ) || window
                                        }
                                        onClick={() => {
                                            // 页面置顶
                                            goBackTop(scrollListId)
                                        }}
                                    >
                                        <ReturnTopOutlined />
                                    </BackTop>
                                </Tooltip>
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>

            {detailOpen && (
                <InfoCatlgDetails
                    open={detailOpen}
                    onClose={() => {
                        setDetailOpen(false)
                    }}
                    catalogId={detailItem?.id || ''}
                    name={detailItem?.raw_name || ''}
                    onFavoriteChange={(res) =>
                        updateFavoriteInfo({ res, item: detailItem })
                    }
                />
            )}
            {catalogCardOpen && (
                <InfoCatlgCard
                    catalogId={detailItem?.id}
                    info={detailItem}
                    open={catalogCardOpen}
                    onClose={() => {
                        setCatalogCardOpen(false)
                    }}
                    toOpenDetails={() => {
                        setDetailOpen(true)
                    }}
                    onAddFavorite={(res) =>
                        updateFavoriteInfo({ res, item: detailItem })
                    }
                    onCancelFavorite={(res) =>
                        updateFavoriteInfo({ res, item: detailItem })
                    }
                />
            )}
        </>
    )
})

export default InfoResourcesCatlg
