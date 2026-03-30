import React, {
    useRef,
    useState,
    useEffect,
    useImperativeHandle,
    forwardRef,
    useMemo,
    useContext,
} from 'react'
import { Row, Col, Tooltip, Divider, Radio, BackTop } from 'antd'
import { useLocation } from 'react-router-dom'
import InfiniteScroll from 'react-infinite-scroll-component'
import { isEqual } from 'lodash'
import { CaretLeftOutlined } from '@ant-design/icons'
import { useUpdateEffect, useUnmount } from 'ahooks'
import classnames from 'classnames'
import { getPlatformNumber, useQuery } from '@/utils'
import styles from './styles.module.less'
import __ from '../locale'
import { Architecture } from '@/components/ResourcesDir/const'
import Loader from '@/ui/Loader'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import { ReturnTopOutlined } from '@/icons'
import {
    DataRescToServiceType,
    ServiceType,
    goBackTop,
    checkAuditPolicyPermis,
    itemOtherInfo,
} from '../helper'

import {
    HasAccess,
    LoginPlatform,
    IDataRescQuery,
    IRole,
    formatError,
    getDataRescList,
    getDataRescListByOper,
    isMicroWidget,
} from '@/core'
import ApplicationServiceDetail from '../ApplicationServiceDetail'
import LogicViewDetail from '../LogicViewDetail'
import AuthInfo from '@/components/MyAssets/AuthInfo'
import {
    DataRescType,
    ViewMode,
    rescFilterConditionConfig,
    viewModeOptions,
} from './helper'
import DataDownloadConfig from '../DataDownloadConfig'
import ArchitectureDirTree from '@/components/BusinessArchitecture/ArchitectureDirTree'
import GlossaryDirTree from '@/components/BusinessDomain/GlossaryDirTree'
import InterfaceCard from '../ApplicationServiceDetail/InterfaceCard'
import LogicViewCard from '../LogicViewDetail/LogicViewCard'
import { BusinessDomainType } from '@/components/BusinessDomain/const'
import IndicatorViewCard from '../IndicatorViewDetail/IndicatorViewCard'
import IndicatorViewDetail from '../IndicatorViewDetail'
import { MicroWidgetPropsContext } from '@/context'
import DragBox from '@/components/DragBox'
import FilterConditionLayout from '../FilterConditionLayout'
import DataRescItem from '../DataResc/DataRescItem'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { SearchInput } from '@/ui'

interface IApplicationService {
    ref?: any
    searchKey: string
    resourceType?: string
    isIntroduced?: boolean
    getClickAsset?: (asset: any, st: ServiceType) => void
    getAddAsset?: (asset: any) => void
    // 仅指标 服务超市功能
    isOnlyIndicator?: boolean
    searchRender?: any
}

const scrollListId = 'scrollableDiv'

// 默认加载条数
const defaultListSize = 20

const ApplicationService: React.FC<IApplicationService> = forwardRef(
    (props: any, ref) => {
        const {
            searchKey,
            resourceType = ServiceType.LOGICVIEW,
            isIntroduced,
            getClickAsset,
            getAddAsset,
            searchRender,
            isOnlyIndicator,
        } = props
        const { pathname } = useLocation()
        const platform = getPlatformNumber()
        const refTree: any = useRef()
        const query = useQuery()
        const serviceCode = query.get('serviceCode')
        const [userId] = useCurrentUser('ID')
        const { permissions, checkPermissions } = useUserPermCtx()

        // 是否拥有数据运营工程师
        const hasDataOperRole = useMemo(() => {
            return checkPermissions(HasAccess.isGovernOrOperation) ?? false
        }, [checkPermissions])

        const filterConfig = useMemo(() => {
            return rescFilterConditionConfig.filter(
                (fItem) => fItem.key === 'online_at',
            )
        }, [])

        const scrollRef: any = useRef()
        const filterConditionRef: any = useRef()
        const [loading, setLoading] = useState(false)
        const [listDataLoading, setListDataLoading] = useState(false)
        const [defaultSize, setDefaultSize] = useState<Array<number>>(
            JSON.parse(localStorage.getItem('marketConSize') || '[60, 40]'),
        )
        const [isDragging, setIsDragging] = useState(false)
        const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Domain)
        const [applicationData, setApplicationData] = useState<Array<any>>([])
        const [totalCount, setTotalCount] = useState<number>(0)
        const [nextFlag, setNextFlag] = useState<Array<string>>([])

        const [expand, setExpand] = useState<boolean>(true)

        const [departmentId, setDepartmentId] = useState<string>('')
        const [openStatus, setOpenStatus] = useState<boolean>(!!serviceCode)
        // 数据库表详情
        const [viewDetailOpen, setViewDetailOpen] = useState<boolean>(false)
        // 数据库表卡片详情
        const [viewCardOpen, setViewCardOpen] = useState<boolean>(false)
        // 授权申请
        const [permissionRequestOpen, setPermissionRequestOpen] =
            useState<boolean>(false)
        // 接口详情
        const [interfaceDetailOpen, setInterfaceDetailOpen] =
            useState<boolean>(false)
        // 接口卡片详情
        const [interfaceCardOpen, setInterfaceCardOpen] =
            useState<boolean>(false)
        const [selectedServiceCode, setSelectedServiceCode] = useState<string>(
            serviceCode || '',
        )

        // 指标详情
        const [indicatorDetailOpen, setIndicatorDetailOpen] =
            useState<boolean>(false)
        // 指标卡片详情
        const [indicatorCardOpen, setIndicatorCardOpen] =
            useState<boolean>(false)
        // 当前列表选中资源项
        const [selectedResc, setSelectedResc] = useState<any>()
        // 列表中按钮操作项
        const [oprResc, setOprResc] = useState<any>()
        // 被点击名称资源项
        const [curDetailResc, setCurDetailResc] = useState<any>()
        const [applyOpen, setApplyOpen] = useState<boolean>(false)
        const [timeValue, setTimeValue] = useState<any>()
        const [filterTitle, setFilterTitle] = useState<string>(__('发布时间'))
        const [rescFilterTitle, setRescFilterTitle] = useState<string>(
            __('资源类型不限'),
        )
        const [rescTypeOpen, setRescTypeOpen] = useState<boolean>(false)
        const [pubTimeOpen, setPubTimeOpen] = useState<boolean>(false)
        const [authInfoOpen, setAuthInfoOpen] = useState<boolean>(false)
        const [downloadOpen, setDownloadOpen] = useState(false)
        // const [onlineTime, setOnlineTime] = useState<any>()
        // 过滤参数
        const [filterParams, setFilterParams] = useState<any>({})
        // 资源类型
        // const [rescType, setRescType] = useState<DataRescType>(
        //     DataRescType.NOLIMIT,
        // )
        // 发布状态
        const [publishState, setPublishState] = useState<any>('')
        const [searchKeyword, setSearchKeyword] = useState<string>(
            searchKey || '',
        )
        const { microWidgetProps } = useContext(MicroWidgetPropsContext)

        // const showClearBtn = useMemo(() => {
        //     return rescType !== DataRescType.NOLIMIT || onlineTime?.end
        // }, [onlineTime, rescType])

        const isListSearchingByKeyword = useMemo(() => {
            return !!searchKeyword
        }, [searchKeyword])

        useEffect(() => {
            if (!permissions || isEqual(filterParams, {})) return
            // 获取角色后，获取列表数据
            const { type, online_at } = filterParams
            if (online_at?.start && !online_at?.end) return
            setViewCardOpen(false)
            setInterfaceCardOpen(false)
            // if (scrollRef.current) {
            //     scrollRef.current.scrollTop = 0
            // }
            getApplicationData([], searchKeyword)
            setSearchKeyword(searchKeyword)
        }, [permissions, departmentId, filterParams])

        useUpdateEffect(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = 0
            }
            getApplicationData([], searchKeyword)
        }, [searchKeyword])

        useImperativeHandle(ref, () => ({
            updFilterCondition: (keyword: string) => {
                setSearchKeyword(keyword)
            },
            refresh,
            scrollListId,
        }))

        const refresh = (type?: any) => {
            getApplicationData([], searchKeyword)
            filterConditionRef?.current?.init()
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

        const searchInpRender = () => {
            return (
                <div
                    style={{
                        marginLeft: '16px',
                        width: '275px',
                    }}
                >
                    <Tooltip
                        placement="top"
                        title={__('搜索资源名称、编码、描述、字段')}
                        overlayInnerStyle={{
                            width: 'fit-content',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <SearchInput
                            placeholder={__('搜索资源名称、编码、描述、字段')}
                            value={searchKeyword}
                            onKeyChange={(kw: string) => {
                                setSearchKeyword(kw)
                            }}
                            onPressEnter={(e: any) =>
                                setSearchKeyword(e.target?.value)
                            }
                            maxLength={255}
                        />
                    </Tooltip>
                </div>
            )
        }

        /**
         * 获取接口数据
         * @param preData 之前获取到的数据
         */
        const getApplicationData = async (preData: Array<any>, keyword) => {
            try {
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
                    type: resourceType,
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
                if (viewMode === ViewMode.Domain) {
                    filter.subject_domain_id = departmentId
                } else {
                    // 组织架构
                    filter.department_id = departmentId
                }
                if (isOnlyIndicator) {
                    filter.type = DataRescType.INDICATOR
                }
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
                //     res = await getDataRescList(
                //         preData.length ? { ...obj, next_flag: nextFlag } : obj,
                //     )
                // }
                const res = await getDataRescList(
                    preData.length ? { ...obj, next_flag: nextFlag } : obj,
                )

                const { total_count, next_flag, entries } = res

                setNextFlag(next_flag || [])

                // item.hasAuditPolicy为true：资源设置了启用策略，可申请权限申请
                const newListDataTemp = await checkAuditPolicyPermis(entries)
                const newListData = entries
                    ? [...preData, ...newListDataTemp]
                    : []
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
                if (
                    item.type === DataRescType.INDICATOR &&
                    !indicatorCardOpen
                ) {
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
                // setOpenStatus(true)
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

        // 更新收藏状态
        const updateFavoriteInfo = ({
            res,
            item,
        }: {
            res: any
            item?: any
        }) => {
            // 更新列表
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
            // 更新选中项
            if (item?.id === selectedResc?.id) {
                setSelectedResc({
                    ...selectedResc,
                    is_favored: res?.is_favored,
                    favor_id: res?.favor_id,
                })
            }
        }

        const renderListItem = (item: any, _i) => {
            return (
                <DataRescItem
                    item={item}
                    fieldKeys={{
                        nameCn: 'business_name',
                        rawNameCn: 'raw_business_name',
                        nameEn: 'technical_name',
                        rawNameEn: 'raw_technical_name',
                    }}
                    isSearchingByKeyword={isListSearchingByKeyword}
                    selectedResc={selectedResc}
                    onNameClick={(e) => handleItemNameClick(e, item)}
                    onItemClick={(e) => handleItemClick(item)}
                    onItemBtnClick={(e) => handleItemBtnClick(item)}
                    hasDataOperRole={hasDataOperRole}
                    // hasAuditProcess={hasAuditProcess}
                    // refreshAuditProcess={refreshAuditProcess}
                    handleRefresh={() => refresh()}
                    onAddFavorite={(res) => updateFavoriteInfo({ res, item })}
                    onCancelFavorite={(res) =>
                        updateFavoriteInfo({ res, item })
                    }
                />
            )
        }

        const renderListContent = () => {
            return (
                <div className={styles.leftWrapper}>
                    <div
                        className={styles.listEmpty}
                        hidden={applicationData?.length > 0}
                    >
                        {searchKeyword || filterParams?.online_at ? (
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
                                getApplicationData(
                                    applicationData,
                                    searchKeyword,
                                )
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
                        width: '100%',
                    }}
                    wrap={false}
                >
                    {isOnlyIndicator ? null : (
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
                            <div
                                className={styles.leftContainer}
                                hidden={!expand}
                            >
                                <Radio.Group
                                    options={viewModeOptions}
                                    onChange={(e) =>
                                        setViewMode(e.target.value)
                                    }
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
                                                setDepartmentId(
                                                    nodeInfo?.id || '',
                                                )
                                            }}
                                            dirTreeStyle={{
                                                overflow: 'hidden',
                                            }}
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
                                                setDepartmentId(
                                                    nodeInfo?.id || '',
                                                )
                                            }}
                                            ref={ref}
                                            // isShowOperate
                                            filterType={[
                                                Architecture.ORGANIZATION,
                                                Architecture.DEPARTMENT,
                                            ].join()}
                                            needUncategorized
                                            unCategorizedKey="Uncategorized"
                                        />
                                    )}
                                </div>
                            </div>
                        </Col>
                    )}
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
                                    <div className={styles.titleBar}>
                                        <div className={styles.total}>
                                            {__('共')}
                                            <span className={styles.totalText}>
                                                {` ${totalCount} `}
                                            </span>
                                            {__('条资源')}
                                        </div>
                                        <div className={styles.titleBarBox}>
                                            <FilterConditionLayout
                                                layoutClassName={
                                                    styles.catlgFilterLayout
                                                }
                                                ref={filterConditionRef}
                                                updateList={(
                                                    params: any = {},
                                                ) => {
                                                    setFilterParams({
                                                        ...params,
                                                        online_at: {
                                                            start: params
                                                                ?.online_at
                                                                ?.start_time,
                                                            end: params
                                                                ?.online_at
                                                                ?.end_time,
                                                        },
                                                    })
                                                }}
                                                filterConfig={filterConfig}
                                            />
                                            {searchRender?.() ||
                                                searchInpRender()}
                                        </div>
                                    </div>

                                    {loading ? (
                                        <div
                                            className={styles.listLoading}
                                            hidden={!loading}
                                        >
                                            <Loader />
                                        </div>
                                    ) : (
                                        <div
                                            className={
                                                styles.listContentWrapper
                                            }
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
                                                    borderLeft:
                                                        'none !important',
                                                }}
                                                splitClass={classnames(
                                                    styles.dragBox,
                                                    isDragging &&
                                                        styles.isDraggingBox,
                                                    !viewCardOpen &&
                                                        !interfaceCardOpen &&
                                                        !indicatorCardOpen &&
                                                        styles.noRightNode,
                                                )}
                                                showExpandBtn={false}
                                                rightNodeStyle={{
                                                    padding: 0,
                                                    minWidth: 417,
                                                }}
                                            >
                                                {renderListContent()}
                                                <div
                                                    className={
                                                        styles.rightWrapper
                                                    }
                                                    hidden={
                                                        !viewCardOpen &&
                                                        !interfaceCardOpen &&
                                                        !indicatorCardOpen
                                                    }
                                                >
                                                    {(viewCardOpen ||
                                                        interfaceCardOpen ||
                                                        indicatorCardOpen) &&
                                                    selectedResc?.type &&
                                                    selectedResc?.type ===
                                                        DataRescType.LOGICALVIEW ? (
                                                        <LogicViewCard
                                                            open={viewCardOpen}
                                                            onClose={() => {
                                                                setViewCardOpen(
                                                                    false,
                                                                )
                                                            }}
                                                            onSure={() => {}}
                                                            id={
                                                                selectedResc?.id
                                                            }
                                                            selectedResc={
                                                                selectedResc
                                                            }
                                                            allowDownload={
                                                                selectedResc?.has_permission
                                                            }
                                                            allowChat={
                                                                selectedResc?.actions?.includes(
                                                                    'read',
                                                                ) ||
                                                                selectedResc?.owner_id ===
                                                                    userId
                                                            }
                                                            onFullScreen={() => {
                                                                setCurDetailResc(
                                                                    selectedResc,
                                                                )
                                                                setViewDetailOpen(
                                                                    true,
                                                                )
                                                            }}
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
                                                    ) : selectedResc?.type ===
                                                      DataRescType.INTERFACE ? (
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
                                                    ) : selectedResc?.type ===
                                                      DataRescType.INDICATOR ? (
                                                        <IndicatorViewCard
                                                            open={
                                                                indicatorCardOpen
                                                            }
                                                            onClose={() => {
                                                                setIndicatorCardOpen(
                                                                    false,
                                                                )
                                                            }}
                                                            onSure={() => {}}
                                                            indicatorId={
                                                                selectedResc?.id
                                                            }
                                                            selectedResc={
                                                                selectedResc
                                                            }
                                                            onFullScreen={() => {
                                                                setCurDetailResc(
                                                                    selectedResc,
                                                                )
                                                                setIndicatorDetailOpen(
                                                                    true,
                                                                )
                                                            }}
                                                            cardProps={{
                                                                zIndex: 999,
                                                            }}
                                                            allowRead={
                                                                selectedResc?.actions?.includes(
                                                                    'read',
                                                                ) ||
                                                                selectedResc?.owner_id ===
                                                                    userId
                                                            }
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
                                                    ) : null}
                                                </div>
                                            </DragBox>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </Col>
                </Row>
                {viewDetailOpen && (
                    <LogicViewDetail
                        open={viewDetailOpen}
                        onClose={() => {
                            // if (!isIntroduced) {
                            //     const url = getActualUrl(`/data-assets`)
                            //     // 修改页面路径参数，但不刷新页面
                            //     rewriteUrl(url)
                            // }
                            setViewDetailOpen(false)
                        }}
                        hasPermission={curDetailResc?.has_permission}
                        id={curDetailResc?.id}
                        isIntroduced={isIntroduced}
                        canChat
                        hasAsst={platform === LoginPlatform.default}
                        onAddFavorite={(res) =>
                            updateFavoriteInfo({ res, item: curDetailResc })
                        }
                        onCancelFavorite={(res) =>
                            updateFavoriteInfo({ res, item: curDetailResc })
                        }
                        showDataConsanguinity={false}
                    />
                )}
                {indicatorDetailOpen && (
                    <IndicatorViewDetail
                        open={indicatorDetailOpen}
                        isIntroduced={isIntroduced}
                        id={curDetailResc?.id}
                        onClose={() => {
                            setIndicatorDetailOpen(false)
                        }}
                        indicatorType={curDetailResc?.indicator_type || ''}
                        canChat
                        hasAsst={platform === LoginPlatform.default}
                        onAddFavorite={(res) =>
                            updateFavoriteInfo({ res, item: curDetailResc })
                        }
                        onCancelFavorite={(res) =>
                            updateFavoriteInfo({ res, item: curDetailResc })
                        }
                    />
                )}
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
    },
)

export default ApplicationService
