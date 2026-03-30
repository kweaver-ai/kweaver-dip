import React, { useRef, useState, useEffect, useMemo, useContext } from 'react'
import { Row, Col, Tooltip, Divider, BackTop } from 'antd'
import InfiniteScroll from 'react-infinite-scroll-component'
import { isEqual } from 'lodash'
import { CaretLeftOutlined } from '@ant-design/icons'
import { useDebounce, useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import { getPlatformNumber, useQuery } from '@/utils'
import styles from './styles.module.less'
import __ from '../locale'
import Loader from '@/ui/Loader'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import { ReturnTopOutlined } from '@/icons'
import {
    DataRescToServiceType,
    FilterConditionType,
    ServiceType,
    goBackTop,
} from '../helper'
import {
    formatError,
    getDataRescList,
    getDataRescListByOper,
    HasAccess,
    isMicroWidget,
    ScopeModuleCategory,
    LoginPlatform,
    SystemCategory,
} from '@/core'
import ApplicationServiceDetail from '../ApplicationServiceDetail'
import AuthInfo from '@/components/MyAssets/AuthInfo'
import {
    DataRescType,
    ViewMode,
    rescFilterConditionConfig,
    allNodeInfo,
} from './helper'
import DataDownloadConfig from '../DataDownloadConfig'
import InterfaceCard from '../ApplicationServiceDetail/InterfaceCard'
import { MicroWidgetPropsContext } from '@/context'
import DragBox from '@/components/DragBox'
import DataRescItem from '../DataResc/DataRescItem'
import { useAuditProcess } from '@/hooks/useAuditProcess'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { BizType, PolicyType } from '@/components/AuditPolicy/const'
import ResourcesCustomTree from '@/components/ResourcesDir/ResourcesCustomTree'
import ExpandFilterConditionLayout from '../ExpandFilterConditionLayout'
import { DCatlgOprType } from '../DataCatalog/const'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IApplicationService {
    ref?: any
    isIntroduced?: boolean
    getClickAsset?: (asset: any, st: ServiceType) => void
    getAddAsset?: (asset: any) => void
    isAIService?: boolean
}

const scrollListId = 'scrollableDiv'

// 默认加载条数
const defaultListSize = 20

const InterfaceSVC: React.FC<IApplicationService> = (props: any) => {
    const query = useQuery()
    const platform = getPlatformNumber()
    const serviceCode = query.get('serviceCode')
    const [hasAuditProcess, refreshAuditProcess] = useAuditProcess({
        audit_type: PolicyType.AssetPermission,
        service_type: BizType.AuthService,
    })
    const [userId] = useCurrentUser('ID')
    const { permissions, checkPermission, checkPermissions } = useUserPermCtx()
    // 是否拥有数据运营工程师
    const hasDataOperRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermissions])

    const hasPublishStatus = useMemo(() => {
        return checkPermission('manageInterfaceService') ?? false
    }, [checkPermission])

    const filterConfig = useMemo(() => {
        return hasPublishStatus
            ? rescFilterConditionConfig
            : rescFilterConditionConfig.filter(
                  (fItem) =>
                      fItem.key !== 'is_publish' && fItem.key !== 'is_online',
              )
    }, [hasPublishStatus])

    const scrollRef: any = useRef()
    const [loading, setLoading] = useState(false)
    const [listDataLoading, setListDataLoading] = useState(false)
    const [defaultSize, setDefaultSize] = useState<Array<number>>(
        JSON.parse(localStorage.getItem('marketConSize') || '[60, 40]'),
    )
    const [isDragging, setIsDragging] = useState(false)
    const [applicationData, setApplicationData] = useState<Array<any>>([])
    const [totalCount, setTotalCount] = useState<number>(0)
    const [nextFlag, setNextFlag] = useState<Array<string>>([])

    const [expand, setExpand] = useState<boolean>(true)

    const [isTagExpand, setIsTagExpand] = useState(false)

    const lightweightSearchRef: any = useRef()
    // const [direction, setDirection] = useState<'asc' | 'desc'>('desc')
    const [departmentId, setDepartmentId] = useState<string>('')
    // 数据库表详情
    const [viewDetailOpen, setViewDetailOpen] = useState<boolean>(false)
    // 数据库表卡片详情
    const [viewCardOpen, setViewCardOpen] = useState<boolean>(false)
    const [isSearch, setIsSearch] = useState<boolean>(false)
    // 接口详情
    const [interfaceDetailOpen, setInterfaceDetailOpen] =
        useState<boolean>(false)
    // 接口卡片详情
    const [interfaceCardOpen, setInterfaceCardOpen] = useState<boolean>(false)
    const [selectedServiceCode, setSelectedServiceCode] = useState<string>(
        serviceCode || '',
    )

    // 指标详情
    const [indicatorDetailOpen, setIndicatorDetailOpen] =
        useState<boolean>(false)
    // 指标卡片详情
    const [indicatorCardOpen, setIndicatorCardOpen] = useState<boolean>(false)
    // 当前列表选中资源项
    const [selectedResc, setSelectedResc] = useState<any>()
    // 列表中按钮操作项
    const [oprResc, setOprResc] = useState<any>()
    // 被点击名称资源项
    const [curDetailResc, setCurDetailResc] = useState<any>()
    const [authInfoOpen, setAuthInfoOpen] = useState<boolean>(false)
    const [downloadOpen, setDownloadOpen] = useState(false)
    // const [onlineTime, setOnlineTime] = useState<any>()
    // 过滤参数
    const [filterParams, setFilterParams] = useState<any>({
        type: DataRescType.INTERFACE,
    })
    const {
        searchKey,
        isIntroduced,
        getClickAsset,
        getAddAsset,
        isAIService = false,
    } = props
    const [searchKeyword, setSearchKeyword] = useState<string>(searchKey || '')
    const debounceKeyword = useDebounce(searchKeyword, {
        wait: 500,
    })
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [initSearch, setInitSearch] = useState<boolean>(true)

    const isListSearchingByKeyword = useMemo(() => {
        return !!debounceKeyword
    }, [debounceKeyword])

    useEffect(() => {
        if (!permissions || isEqual(filterParams, {})) return
        if (isAIService) return
        getApplicationData([])
    }, [permissions])

    useUpdateEffect(() => {
        if (initSearch && !isAIService) return

        if (isAIService && !filterParams?.cate_info_req?.[0]?.cate_id) return
        if (!permissions || isEqual(filterParams, {})) return
        // 获取角色后，获取列表数据
        const { type, online_at, keyword } = filterParams
        if (online_at?.start && !online_at?.end) return
        setViewCardOpen(false)
        setInterfaceCardOpen(false)
        // if (scrollRef.current) {
        //     scrollRef.current.scrollTop = 0
        // }
        getApplicationData([])
        setSearchKeyword(keyword)
    }, [filterParams])

    useUpdateEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0
        }
    }, [debounceKeyword])

    const refresh = () => {
        if (isAIService) return
        getApplicationData([])
    }

    const escFunction = () => {
        if (viewDetailOpen) {
            setViewDetailOpen(false)
        }
        if (interfaceDetailOpen) {
            setInterfaceDetailOpen(false)
        }
        if (indicatorDetailOpen) {
            setIndicatorDetailOpen(false)
        }
    }

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                escFunction()
            }
        }

        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [interfaceDetailOpen, viewDetailOpen])

    /**
     * 获取接口数据
     * @param preData 之前获取到的数据
     */
    const getApplicationData = async (preData: Array<any>) => {
        try {
            const { keyword } = filterParams
            setListDataLoading(true)
            if (!preData || !preData?.length) {
                // 刷新列表
                setLoading(true)
                setViewCardOpen(false)
                setInterfaceCardOpen(false)
                setIndicatorCardOpen(false)
            }
            const filter = {
                ...filterParams,
                ...{
                    is_publish:
                        filterParams?.is_publish === '2'
                            ? true
                            : filterParams?.is_publish === '1'
                            ? false
                            : undefined,
                    is_online:
                        filterParams?.is_online === '2'
                            ? true
                            : filterParams?.is_online === '1'
                            ? false
                            : undefined,
                },
            }

            // 发布状态
            // const isPublish = filter.is_publish
            // if (typeof isPublish !== 'boolean') {
            //     filter = omit(filter, 'is_publish')
            // }
            // // 上线状态
            // const isOnline = filter.is_online
            // if (typeof isOnline !== 'boolean') {
            //     filter = omit(filter, 'is_online')
            // }

            // 主题域
            // if (viewMode === ViewMode.Domain) {
            //     filter.subject_domain_id = departmentId
            // } else {
            //     // 组织架构
            //     filter.department_id = departmentId
            // }
            const obj: any = {
                keyword,
                filter,
            }

            // let res
            // if (hasDataOperRole) {
            //     res = await getDataRescListByOper(
            //         preData.length ? { ...obj, next_flag: nextFlag } : obj,
            //     )
            // } else {
            const res = await getDataRescList(
                preData.length ? { ...obj, next_flag: nextFlag } : obj,
            )
            // }

            const { total_count, next_flag, entries } = res

            setNextFlag(next_flag || [])

            const newListData = entries ? [...preData, ...entries] : []
            setApplicationData(newListData)
            setTotalCount(total_count)

            // 搜索接口只有一条数据，则打开侧边详情框xxx
            if (keyword && !preData?.length && newListData?.length === 1) {
                const onlyRes = newListData?.[0]
                setSelectedResc(onlyRes)
                if (onlyRes?.type === DataRescType.LOGICALVIEW) {
                    setInterfaceCardOpen(false)
                    setViewCardOpen(true)
                } else if (onlyRes?.type === DataRescType.INTERFACE) {
                    setViewCardOpen(false)
                    setInterfaceCardOpen(true)
                }
            }
        } catch (e) {
            formatError(e)
        } finally {
            // if (isRefreshNewList) {
            setListDataLoading(false)
            // }
            if (!preData || !preData?.length) {
                setLoading(false)
            }
            setInitSearch(false)
        }
    }

    const getAssetIsOnline = (item, type: ServiceType) => {
        getClickAsset(item, type)
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

    const showDivder = (divdStyle?: any) => {
        return (
            <Divider
                style={{
                    height: '12px',
                    borderRadius: '1px',
                    borderLeft: '1px solid rgba(0,0,0,0.24)',
                    margin: '0px 2px 0px 8px',
                    ...divdStyle,
                }}
                type="vertical"
            />
        )
    }

    const handleItemClick = (item) => {
        if (isIntroduced) {
            getAssetIsOnline(
                {
                    serviceCode: item.id,
                    id: item.id,
                },
                DataRescToServiceType[item.type],
            )
        } else {
            setSelectedResc(item)
            setSelectedServiceCode(item.id)
            if (item.type === DataRescType.INDICATOR && !indicatorCardOpen) {
                setInterfaceCardOpen(false)
                setViewCardOpen(false)
                setIndicatorCardOpen(true)
            } else if (
                item.type === DataRescType.LOGICALVIEW &&
                !viewCardOpen
            ) {
                setIndicatorCardOpen(false)
                setInterfaceCardOpen(false)
                setViewCardOpen(true)
            } else if (
                item.type === DataRescType.INTERFACE &&
                !interfaceCardOpen
            ) {
                setIndicatorCardOpen(false)
                setViewCardOpen(false)
                setInterfaceCardOpen(true)
            }
        }
    }

    const handleItemNameClick = (e: any, item: any) => {
        e.preventDefault()
        e.stopPropagation()
        const { type } = item
        setCurDetailResc(item)
        if (type === DataRescType.LOGICALVIEW) {
            setViewDetailOpen(true)
        } else if (type === DataRescType.INTERFACE) {
            setInterfaceDetailOpen(true)
        } else if (item.type === DataRescType.INDICATOR) {
            setIndicatorDetailOpen(true)
        }
    }

    const handleItemBtnClick = (item: any) => {
        const { id, type } = item
        setOprResc(item)
        if (type === DataRescType.INTERFACE) {
            setAuthInfoOpen(true)
        } else if (type === DataRescType.LOGICALVIEW) {
            setDownloadOpen(true)
        }
    }

    // 获取选中的节点
    const getSelectedNode = (sn?: any) => {
        let node
        if (sn) {
            node = { ...sn }
        } else {
            node = allNodeInfo
        }
        const cate_info_req = [
            {
                cate_id: node?.cate_id || '',
                node_ids: node?.id
                    ? [node?.id]
                    : isAIService
                    ? node?.treeFirstIds
                    : [],
            },
        ]

        setFilterParams((pre) => ({
            ...pre,
            department_id:
                node?.id && node?.cate_id === SystemCategory.Organization
                    ? node?.id
                    : undefined,
            cate_info_req:
                (cate_info_req?.[0]?.node_ids?.length || isAIService) &&
                node?.cate_id !== SystemCategory.Organization
                    ? cate_info_req
                    : undefined,
        }))
    }

    // 更新列表项收藏状态
    const updateFavoriteInfo = ({ res, item }: { res: any; item?: any }) => {
        setApplicationData(
            applicationData?.map((i) => {
                if (i.id === item?.id) {
                    return {
                        ...i,
                        is_favored: res?.is_favored,
                        favor_id: res?.favor_id,
                    }
                }
                return i
            }),
        )
        if (selectedResc?.id === item.id) {
            setSelectedResc({
                ...selectedResc,
                is_favored: res?.is_favored,
                favor_id: res?.favor_id,
            })
        }
    }

    const renderListItem = (item: any, _i) => {
        const otherInfo = ['api_type', 'subject_domain_name', 'department_name']
        return (
            <DataRescItem
                item={item}
                fieldKeys={{
                    nameCn: 'business_name',
                    rawNameCn: 'raw_business_name',
                    nameEn: 'technical_name',
                    rawNameEn: 'raw_technical_name',
                }}
                otherInfoParams={otherInfo}
                isSearchingByKeyword={isListSearchingByKeyword}
                selectedResc={selectedResc}
                onNameClick={(e) => handleItemNameClick(e, item)}
                onItemClick={(e) => handleItemClick(item)}
                onItemBtnClick={(e) => handleItemBtnClick(item)}
                hasDataOperRole={hasDataOperRole}
                hasAuditProcess={hasAuditProcess}
                refreshAuditProcess={refreshAuditProcess}
                showCard={interfaceCardOpen}
                onAddFavorite={(res) => updateFavoriteInfo({ res, item })}
                onCancelFavorite={(res) => updateFavoriteInfo({ res, item })}
                // filterOperationList={[
                //     DCatlgOprType.Favorite,
                //     DCatlgOprType.Feedback,
                // ]}
            />
        )
    }

    const renderListContent = () => {
        return (
            <div className={styles.leftWrapper}>
                <div className={styles.total}>
                    {__('共')}
                    <span className={styles.totalText}>
                        {` ${totalCount} `}
                    </span>
                    {__('条资源')}
                </div>

                <div
                    className={styles.listEmpty}
                    hidden={applicationData?.length > 0}
                >
                    {searchKeyword || isSearch || filterParams?.online_at ? (
                        <Empty />
                    ) : (
                        <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                    )}
                </div>
                <div
                    id={scrollListId}
                    className={styles.contentList}
                    ref={scrollRef}
                    hidden={!applicationData?.length}
                >
                    <InfiniteScroll
                        hasMore={applicationData.length < totalCount}
                        endMessage={
                            applicationData.length >= defaultListSize ? (
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
                        loader={
                            <div
                                className={styles.listLoading}
                                // hidden={!listDataLoading}
                            >
                                <Loader />
                            </div>
                        }
                        next={() => {
                            getApplicationData(applicationData)
                        }}
                        dataLength={applicationData.length}
                        scrollableTarget={scrollListId}
                    >
                        {applicationData.map((item = {}, index = 0) =>
                            renderListItem(item, index),
                        )}
                    </InfiniteScroll>
                    {/* )} */}
                </div>
                <Tooltip title={__('回到顶部')} placement="top">
                    <BackTop
                        className={styles.backTop}
                        target={() =>
                            document.getElementById(scrollListId) || window
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
        )
    }
    return (
        <div className={styles.applicationContainer}>
            <Row
                // gutter={expand ? '16px' : 0}
                style={{
                    height: '100%',
                }}
                wrap={false}
            >
                <Col flex={expand ? '296px' : 0}>
                    {/* <div
                            className={styles.unexpandSwitch}
                            hidden={!expand}
                            onClick={() => setExpand(false)}
                        >
                            <LeftOutlined />
                        </div> */}
                    {expand ? (
                        <div>
                            <div
                                className={styles.expandOpen}
                                onClick={() => {
                                    setExpand(false)
                                }}
                            >
                                <CaretLeftOutlined />
                            </div>
                        </div>
                    ) : (
                        <div
                            className={styles.unexpandList}
                            onClick={() => {
                                setExpand(true)
                            }}
                        >
                            <div className={styles.expandClose}>
                                {__('筛选')}
                            </div>
                        </div>
                    )}
                    <div className={styles.leftContainer} hidden={!expand}>
                        {isAIService && (
                            <div
                                style={{
                                    padding: '16px 24px 0 24px',
                                    fontWeight: '550',
                                }}
                            >
                                {__('AI服务')}
                            </div>
                        )}
                        <ResourcesCustomTree
                            onChange={getSelectedNode}
                            defaultCategotyId="00000000-0000-0000-0000-000000000001"
                            needUncategorized={!isAIService}
                            wapperStyle={{ height: 'calc(100vh - 105px)' }}
                            scopeModuleCategory={ScopeModuleCategory.Interface}
                            hiddenSwitch={isAIService}
                            aIServiceTreeName={isAIService ? 'AI服务' : ''}
                            applyScopeTreeKey="market_left"
                            applyScopeId="00000000-0000-0000-0000-000000000001"
                        />
                        {/* <Radio.Group
                            options={viewModeOptions}
                            onChange={(e) => setViewMode(e.target.value)}
                            value={viewMode}
                            optionType="button"
                            className={styles.viewModeRadioWrapper}
                        />

                        <div
                            className={classnames(
                                styles.resTree,
                                isMicroWidget({ microWidgetProps }) &&
                                    styles.microTree,
                            )}
                        >
                            {viewMode === ViewMode.Domain ? (
                                <GlossaryDirTree
                                    getSelectedKeys={(nodeInfo) => {
                                        setDepartmentId(nodeInfo?.id || '')
                                    }}
                                    dirTreeStyle={{ overflow: 'hidden' }}
                                    filterType={[
                                        BusinessDomainType.subject_domain_group,
                                        BusinessDomainType.subject_domain,
                                        BusinessDomainType.business_object,
                                        BusinessDomainType.business_activity,
                                    ]}
                                    limitTypes={[
                                        BusinessDomainType.business_object,
                                        BusinessDomainType.business_activity,
                                    ]}
                                    placeholder={__(
                                        '搜索主题域分组、主题域、业务对象/活动',
                                    )}
                                    needUncategorized
                                    unCategorizedKey="Uncategorized"
                                />
                            ) : (
                                <ArchitectureDirTree
                                    getSelectedNode={(nodeInfo) => {
                                        setDepartmentId(nodeInfo?.id || '')
                                    }}
                                    // ref={ref}
                                    // isShowOperate
                                    filterType={[
                                        Architecture.ORGANIZATION,
                                        Architecture.DEPARTMENT,
                                    ].join()}
                                    needUncategorized
                                    unCategorizedKey="Uncategorized"
                                />
                            )}
                        </div> */}
                    </div>
                </Col>
                <Col flex="auto">
                    {!permissions ? (
                        <div
                            style={{
                                background: '#fff',
                                height: '100%',
                                width: '100%',
                            }}
                        >
                            <Loader />
                        </div>
                    ) : (
                        <div className={styles.container}>
                            <div className={styles.applicationDataContent}>
                                <ExpandFilterConditionLayout
                                    layoutClassName={styles.catlgFilterLayout}
                                    isShowExpSwitch
                                    filterConfig={filterConfig}
                                    updateList={(params: any) => {
                                        setSearchKeyword(params?.keyword)
                                        setFilterParams({
                                            ...filterParams,
                                            ...params,
                                            online_at: {
                                                start: params?.online_at
                                                    ?.start_time,
                                                end: params?.online_at
                                                    ?.end_time,
                                            },
                                        })
                                    }}
                                    getIsShowClearBtn={(flag) =>
                                        setIsSearch(flag)
                                    }
                                    placeholder={__(
                                        '搜索接口名称、编码、描述、出参字段',
                                    )}
                                    beforeSearchInputKey={
                                        FilterConditionType.ONLINETIME
                                    }
                                />
                                {/* <div className={styles.titleBar}>
                                    <div className={styles.titleBarBox}>
                                        <FilterConditionLayout
                                            layoutClassName={
                                                styles.catlgFilterLayout
                                            }
                                            updateList={(params: any = {}) => {
                                                setFilterParams({
                                                    ...filterParams,
                                                    ...params,
                                                    online_at: {
                                                        start: params?.online_at
                                                            ?.start_time,
                                                        end: params?.online_at
                                                            ?.end_time,
                                                    },
                                                })
                                            }}
                                            filterConfig={filterConfig}
                                        />
                                    </div>
                                    <Tooltip
                                        title={__(
                                            '搜索接口名称、编码、描述、出参字段',
                                        )}
                                    >
                                        <SearchInput
                                            style={{
                                                marginLeft: '16px',
                                                width: '275px',
                                            }}
                                            placeholder={__(
                                                '搜索接口名称、编码、描述、出参字段',
                                            )}
                                            value={searchKeyword}
                                            onKeyChange={(kw: string) => {
                                                setSearchKeyword(kw)
                                                // getApplicationData(
                                                //     [],
                                                //     e.target?.value,
                                                // )
                                            }}
                                            maxLength={255}
                                        />
                                    </Tooltip>
                                </div> */}

                                {loading ? (
                                    <div
                                        className={styles.listLoading}
                                        hidden={!loading}
                                    >
                                        <Loader />
                                    </div>
                                ) : (
                                    <div
                                        className={styles.listContentWrapper}
                                        hidden={loading}
                                    >
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
                                                borderRight:
                                                    '4px solid rgb(0 0 0 / 0%)',
                                                borderLeft: 'none !important',
                                            }}
                                            splitClass={classnames(
                                                styles.dragBox,
                                                isDragging &&
                                                    styles.isDraggingBox,
                                                !interfaceCardOpen &&
                                                    styles.noRightNode,
                                            )}
                                            showExpandBtn={false}
                                            rightNodeStyle={{
                                                padding: 0,
                                                minWidth: 417,
                                            }}
                                            // hiddenElement={
                                            //     viewCardOpen ||
                                            //     interfaceCardOpen || indicatorCardOpen
                                            //         ? 'right'
                                            //         : ''
                                            // }
                                        >
                                            {renderListContent()}
                                            <div
                                                className={styles.rightWrapper}
                                                hidden={!interfaceCardOpen}
                                            >
                                                {interfaceCardOpen &&
                                                    selectedResc?.type ===
                                                        DataRescType.INTERFACE && (
                                                        <InterfaceCard
                                                            open={
                                                                interfaceCardOpen
                                                            }
                                                            onClose={() => {
                                                                setInterfaceCardOpen(
                                                                    false,
                                                                )
                                                            }}
                                                            onSure={() => {}}
                                                            interfaceId={
                                                                selectedResc?.id
                                                            }
                                                            selectedResc={
                                                                selectedResc
                                                            }
                                                            allowInvoke={
                                                                selectedResc?.has_permission
                                                            }
                                                            onFullScreen={() => {
                                                                setCurDetailResc(
                                                                    selectedResc,
                                                                )
                                                                setInterfaceDetailOpen(
                                                                    true,
                                                                )
                                                            }}
                                                            allowChat={
                                                                (selectedResc?.actions?.includes(
                                                                    'read',
                                                                ) ||
                                                                    selectedResc?.owner_id ===
                                                                        userId) &&
                                                                selectedResc?.is_online
                                                            }
                                                            cardProps={{
                                                                zIndex: 999,
                                                            }}
                                                            onAddFavorite={(
                                                                res,
                                                            ) =>
                                                                updateFavoriteInfo(
                                                                    {
                                                                        res,
                                                                        item: selectedResc,
                                                                    },
                                                                )
                                                            }
                                                            onCancelFavorite={(
                                                                res,
                                                            ) =>
                                                                updateFavoriteInfo(
                                                                    {
                                                                        res,
                                                                        item: selectedResc,
                                                                    },
                                                                )
                                                            }
                                                        />
                                                    )}
                                            </div>
                                        </DragBox>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Col>
            </Row>
            {interfaceDetailOpen && (
                <div hidden={!interfaceDetailOpen}>
                    <ApplicationServiceDetail
                        open={interfaceDetailOpen}
                        onClose={() => {
                            setInterfaceDetailOpen(false)
                            // 提交申请后，更新列表状态
                            // getApplicationData([], searchKeyword)
                        }}
                        hasPermission={curDetailResc?.has_permission}
                        serviceCode={curDetailResc?.id}
                        isIntroduced={isIntroduced}
                        hasAsst={platform === LoginPlatform.default}
                        onAddFavorite={(res) =>
                            updateFavoriteInfo({ res, item: curDetailResc })
                        }
                        onCancelFavorite={(res) =>
                            updateFavoriteInfo({ res, item: curDetailResc })
                        }
                    />
                </div>
            )}

            {authInfoOpen && (
                <AuthInfo
                    id={oprResc?.id}
                    open={authInfoOpen}
                    onClose={() => {
                        setAuthInfoOpen(false)
                    }}
                />
            )}
            {downloadOpen && (
                <DataDownloadConfig
                    formViewId={oprResc?.id}
                    open={downloadOpen}
                    onClose={() => {
                        setDownloadOpen(false)
                    }}
                    // 集成到AS后，下载页面全屏显示，兼容AS侧边栏可拖拽
                    isFullScreen={!!isMicroWidget({ microWidgetProps })}
                />
            )}
        </div>
    )
}

export default InterfaceSVC
