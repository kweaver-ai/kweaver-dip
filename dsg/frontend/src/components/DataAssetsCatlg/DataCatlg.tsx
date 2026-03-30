import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
    useMemo,
    useRef,
} from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons'
import { Divider, List, Tooltip, Col, Row, BackTop } from 'antd'
import classnames from 'classnames'
import { isNumber } from 'lodash'
import moment from 'moment'
import InfiniteScroll from 'react-infinite-scroll-component'
import { AppDataContentColored, ReturnTopOutlined } from '@/icons'
import styles from './styles.module.less'
import __ from './locale'
import {
    buildTreeFromSubjectInfo,
    getPlatformNumber,
    useQuery,
    cancelRequest,
} from '@/utils'
import {
    businessAssetsFilterInit,
    businTreeFilterInit,
    formatCatlgError,
    goBackTop,
    IBusinessAssetsFilterQuery,
    RescErrorCodeList,
    ServiceType,
    ViewType,
    businFilterConditionConfig,
    FilterConditionType,
    expeditionQualityGrade,
    DataCatlgTabKey,
} from './helper'
import { BusinObjOpr, catlgSortOptions, CatlgView } from './const'
import {
    formatError,
    reqBusinObjList,
    reqBusinObjListForOper,
    reqCatlgCommonInfo,
    IBusinNodeParams,
    IDataRescItem,
    getCatlgScoreSummary,
    LoginPlatform,
    ResType,
    HasAccess,
    SortDirection,
    SystemCategory,
} from '@/core'
import { Empty, Loader } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import DataCatlgContent from './DataCatlgContent'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
    CatalogInfoItems,
    PublishStatusTag,
    OnlineStatusTag,
} from './CatalogMoreInfo'
import CatalogCard from './CatalogCard'
import ResourcesCustomTree from '../ResourcesDir/ResourcesCustomTree'
import {
    publishStatus,
    publishedList,
    upPublishedList,
    onLineStatus,
    ResourceType,
    shareTypeList,
} from '../ResourcesDir/const'
import CityShareOperation from './CityShareOperation'
import CitySharingDrawer from '../CitySharing/CitySharingDrawer'
import FeedbackOperation from '@/components/DataAssetsCatlg/FeedbackOperation'
import FavoriteOperation from '@/components/Favorite/FavoriteOperation'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { useRescProviderContext } from './RescProvider'
import DragBox from '../DragBox'
import ExpandFilterConditionLayout from './ExpandFilterConditionLayout'
import OprDropDown from './DataCatalog/OprDropDown'
import { DCatlgOprType } from './DataCatalog/const'
import BusinView from './DataCatalog/BusinView'

interface ISortItem {
    label: string
    value: string
    direction?: SortDirection
}

// 排序组件属性
interface SortComponentProps {
    curSortItem: ISortItem // 当前排序字段
    sortOption: ISortItem // 已选排序字段及方向
    onChange: (order: SortDirection) => void // 排序变化回调
    defaultOrder?: SortDirection // 默认排序顺序
}

const SortComponent: React.FC<SortComponentProps> = ({
    curSortItem,
    sortOption,
    onChange,
    defaultOrder = SortDirection.DESC,
}) => {
    const [sortOrder, setSortOrder] = useState<SortDirection | undefined>(
        sortOption.value === curSortItem.value
            ? sortOption.direction || defaultOrder
            : undefined,
    )

    // 处理排序切换
    const handleSortChange = (newOrder: SortDirection) => {
        setSortOrder(newOrder)
        onChange(newOrder)
    }

    useEffect(() => {
        if (curSortItem.value === sortOption.value) {
            setSortOrder(sortOption.direction || defaultOrder)
        } else {
            setSortOrder(undefined)
        }
    }, [sortOption])

    return (
        <Tooltip
            title={curSortItem?.label}
            getPopupContainer={(n: any) => n || n?.parentElement}
        >
            <div
                className={classnames(styles.sortItemWrapper, {
                    [styles.active]: curSortItem.value === sortOption.value,
                })}
                onClick={() => {
                    // if (sortOrder === null) {
                    //     handleSortChange(defaultOrder)
                    // } else if (sortOrder === SortDirection.ASC) {
                    //     handleSortChange(SortDirection.DESC)
                    // } else {
                    //     handleSortChange(SortDirection.ASC)
                    // }
                    handleSortChange(
                        sortOrder === null
                            ? defaultOrder
                            : sortOrder === SortDirection.ASC
                            ? SortDirection.DESC
                            : SortDirection.ASC,
                    )
                }}
            >
                <span>{curSortItem?.label}</span>
                <div className={styles.sortIcons}>
                    <CaretUpOutlined
                        className={classnames(styles.sortIcon, {
                            [styles.active]: sortOrder === SortDirection.ASC,
                        })}
                    />
                    <CaretDownOutlined
                        className={classnames(styles.sortIcon, {
                            [styles.active]: sortOrder === SortDirection.DESC,
                        })}
                        style={{ marginTop: '-.3em' }}
                    />
                </div>
            </div>
        </Tooltip>
    )
}

interface IDataCatlgProps {
    ref?: any
    searchKey: string
    getClickAsset?: (asset: any, st: ServiceType) => void
    getAddAsset?: (asset: any) => void
    addedAssets?: any[]
    isIntroduced?: boolean
    searchRender?: any
}

// 默认加载条数
const defaultListSize = 20
const scrollListId = 'scrollableDiv'

const DataCatlg: React.FC<IDataCatlgProps> = forwardRef((props: any, ref) => {
    const {
        searchKey,
        getClickAsset,
        getAddAsset,
        addedAssets,
        isIntroduced,
        searchRender,
    } = props
    const query = useQuery()
    const homeKeyword = query.get('keyword')
    const navigator = useNavigate()
    const [userId] = useCurrentUser('ID')

    const scrollListRef = useRef<any>()

    const { catlgView } = useRescProviderContext()

    const [expand, setExpand] = useState<boolean>(false)

    // 右侧列表页loading
    const [listDataLoading, setListDataLoading] = useState(true)

    const [viewKey, setViewKey] = useState<ViewType>(
        businTreeFilterInit.category_type,
    )

    const [isShowAll, setIsShowAll] = useState(false)
    const [isInit, setIsInit] = useState(true)

    const [selectedNode, setSelectedNode] = useState<any>({})

    const [defaultSize, setDefaultSize] = useState<Array<number>>(
        JSON.parse(localStorage.getItem('marketConSize') || '[60, 40]'),
    )
    const [isDragging, setIsDragging] = useState(false)

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

    const [searchKeyword, setSearchKeyword] = useState<string>(searchKey || '')

    // 数据总条数
    const [totalCount, setTotalCount] = useState<number>(0)
    const defaultDirection = SortDirection.DESC
    const [sortOption, setSortOption] = useState<any>({
        ...catlgSortOptions[0],
        direction: defaultDirection,
    })
    const [isSearch, setIsSearch] = useState<boolean>(false)
    const [catalogCardOpen, setCatalogCardOpen] = useState<boolean>(false)
    // 目录共享申报
    const [applyCatalog, setApplyCatalog] = useState<any>()

    // useCogAsstContext 已移除，相关功能已下线

    const { checking, checkPermissions, checkPermission } = useUserPermCtx()

    const hasBusinessRoles = useMemo(
        () => checkPermissions(HasAccess.isHasBusiness),
        [checkPermissions],
    )

    // 是否拥有管理目录权限
    const hasDataOperRole = useMemo(() => {
        return checkPermission('manageResourceCatalog') ?? false
    }, [checkPermission])

    const platform = getPlatformNumber()

    const showCardStyle = {
        // width: 'calc(100% - 418px)',
        borderRight: '16px solid #F0F2F6',
    }

    useEffect(() => {
        if (!checking && !homeKeyword) {
            loadEntityList(filterListCondition)
        }
    }, [hasDataOperRole, checking])

    // 列表项宽度小于950px
    const [listContentLt950, setListContentLt950] = useState<boolean>(false)

    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.contentBoxSize) {
                    const width =
                        entry.borderBoxSize[0].inlineSize ||
                        entry.contentRect.width
                    const maxWidth = 978
                    setListContentLt950(width <= maxWidth)

                    // if (width < 682 && !listContentLt950) {
                    //     setListContentLt950(true)
                    // } else if (width >= 682 && listContentLt950) {
                    //     setListContentLt950(false)
                    // }
                }
            })
        })

        if (scrollListRef?.current) {
            observer.observe(scrollListRef.current)
        }

        return () => {
            observer.disconnect()
        }
    }, [scrollListRef?.current])

    // useUpdateEffect(() => {
    //     if (!isInit) {
    //         loadEntityList(filterListCondition, searchKeyword)
    //     }
    // }, [searchKeyword])

    useEffect(() => {
        const cate_info_req = [
            {
                cate_id: selectedNode?.cate_id || '',
                node_ids: [selectedNode?.id || ''],
            },
        ]
        if (!isInit) {
            loadEntityList({
                ...filterListCondition,
                cate_info_req: selectedNode?.id ? cate_info_req : undefined,
            })
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
            ? businFilterConditionConfig
            : businFilterConditionConfig.filter(
                  (item) =>
                      item.key !== 'is_publish' && item.key !== 'is_online',
              )
    }, [hasDataOperRole])

    // 详情id-服务超市页面-isIntroduces为false,目录详情参数可取路径id
    const id = isIntroduced ? '' : query.get('id')
    // 详情页抽屉的显示/隐藏
    const [detailOpen, setDetailOpen] = useState(false)
    // card中点击某tabkey下关联资源，详情默认展示tabkey下内容
    const [linkDetailTabKey, setLinkDetailTabKey] = useState<any>()
    // 点击详情对应item
    const [detailItem, setDetailItem] = useState<IDataRescItem>()

    const [searchParams, setSearchParams] = useSearchParams()
    // 目录详情 id
    const catalogId = query.get('catalogId') || ''

    useEffect(() => {
        if (id) {
            setDetailOpen(true)
        }
    }, [])

    useEffect(() => {
        if (catalogId) {
            setDetailOpen(true)
        }
    }, [catalogId])

    useImperativeHandle(ref, () => ({
        // updFilterCondition: (keyword: string) => {
        //     setSearchKeyword(keyword)
        //     loadEntityList(filterListCondition, keyword)
        // },
        refresh,
        scrollListId,
    }))

    const refresh = () => {
        loadEntityList(filterListCondition)
    }

    // const getRadarMapData = (
    //     exploreReportData: any,
    //     confTimeliness: any,
    //     pass: boolean,
    // ) => {
    //     const itemList = [
    //         {
    //             item: __('准确性'),
    //             score: getScore(
    //                 exploreReportData?.overview?.accuracy_score,
    //                 false,
    //             ),
    //         },
    //         {
    //             item: __('完整性'),
    //             score: getScore(
    //                 exploreReportData?.overview?.completeness_score,
    //                 false,
    //             ),
    //         },
    //         // {
    //         //     item: __('一致性'),
    //         //     score: getScore(
    //         //         exploreReportData?.overview?.consistency_score,
    //         //         false,
    //         //     ),
    //         // },
    //         {
    //             item: __('规范性'),
    //             score: getScore(
    //                 exploreReportData?.overview?.standardization_score,
    //                 false,
    //             ),
    //         },
    //         {
    //             item: __('唯一性'),
    //             score: getScore(
    //                 exploreReportData?.overview?.uniqueness_score,
    //                 false,
    //             ),
    //         },
    //         {
    //             item: __('及时性'),
    //             score: pass ? 100 : confTimeliness ? 0 : null,
    //         },
    //     ]
    //     return itemList
    // }

    // const getIsTimeLinessPass = (confTimeliness: any, probeTime?: any) => {
    //     let diffHours = -1
    //     if (confTimeliness) {
    //         let startTime: any = null
    //         switch (confTimeliness) {
    //             case 'day':
    //                 startTime = moment().add(-1, 'day').toDate()
    //                 break
    //             case 'week':
    //                 startTime = moment().add(-1, 'week').toDate()
    //                 break
    //             case 'month':
    //                 startTime = moment().add(-1, 'month').toDate()
    //                 break
    //             case 'quarter':
    //                 startTime = moment().add(-1, 'quarter').toDate()
    //                 break
    //             case 'half_a_year':
    //                 startTime = moment().add(-6, 'month').toDate()
    //                 break
    //             case 'year':
    //                 startTime = moment().add(-1, 'year').toDate()
    //                 break
    //             default:
    //                 break
    //         }

    //         diffHours = probeTime?.date
    //             ? moment(probeTime?.date)
    //                   .startOf('hour')
    //                   .diff(moment(startTime).startOf('hour'), 'hour')
    //             : -1
    //     }

    //     return diffHours >= 0
    // }

    // 计算质量评分逻辑（依赖接口较多花费时间太长影响用户体验，暂时注释，不显示质量评分）
    // const calcDataQualityScore = async (viewId: string) => {
    //     try {
    //         let score
    //         let ruleConf
    //         let probe_time
    //         let time

    //         try {
    //             const confRes = await getDatasourceConfig({
    //                 form_view_id: viewId,
    //             })

    //             ruleConf = JSON.parse(confRes?.config || '{}')
    //         } catch (err) {
    //             // console.log(err)
    //         }
    //         const conf = ruleConf?.view?.rules?.find(
    //             (o) => o.dimension === 'timeliness',
    //         )?.rule_config
    //         const confTimeliness = JSON.parse(conf || '{}')?.update_period
    //         try {
    //             const res = await getBusinessUpdateTime(viewId)
    //             time = res?.business_update_time
    //             const fieldInfo = {
    //                 field_id: res?.field_id,
    //                 field_business_name: res?.field_business_name,
    //             }
    //             if (time) {
    //                 const { isTime, date } = isValidTime(time)
    //                 if (isTime) {
    //                     const timeStr = isTime ? date : ''
    //                     const year = new Date(timeStr).getFullYear()
    //                     const month = new Date(timeStr).getMonth() + 1
    //                     const day = new Date(timeStr).getDate()
    //                     const hms = moment(timeStr).format('LTS')
    //                     probe_time = {
    //                         date,
    //                         year,
    //                         month: month < 10 ? `0${month}` : month,
    //                         day: day < 10 ? `0${day}` : day,
    //                         hms,
    //                     }
    //                 }
    //             }
    //         } catch (err) {
    //             // console.log(err)
    //         }

    //         const isTimelinessPass = getIsTimeLinessPass(
    //             confTimeliness,
    //             probe_time,
    //         )

    //         // 获取数据质量信息
    //         let exploreReportData

    //         try {
    //             exploreReportData = await getExploreReport({
    //                 id: viewId,
    //             })
    //         } catch (err) {
    //             // console.log(err)
    //         }

    //         const radarMapData = getRadarMapData(
    //             exploreReportData || {},
    //             confTimeliness,
    //             isTimelinessPass,
    //         )
    //         const validScoreList = radarMapData?.filter(
    //             (item) => typeof item.score === 'number',
    //         )
    //         const count = validScoreList?.length
    //         if (typeof count === 'number' && count > 0) {
    //             const sum = validScoreList
    //                 ?.map((item) => item.score)
    //                 .reduce((num, result) => num + result * 100, 0)
    //             if (sum >= 0) {
    //                 // 取整
    //                 score = Math.trunc(sum / count) / 100
    //             }
    //         }

    //         return score
    //     } catch (e) {
    //         formatError(e)
    //         return {}
    //     }
    // }

    // 获取业务逻辑实体列表
    const loadEntityList = async (params: any, loadMore?: boolean) => {
        try {
            const { keyword, next_flag, ...rest } = params
            const statue = {
                is_publish:
                    params?.is_publish === '2' || params?.is_publish === true
                        ? true
                        : params?.is_publish === '1' ||
                          params?.is_publish === false
                        ? false
                        : undefined,
                is_online:
                    params?.is_online === '2' || params?.is_online === true
                        ? true
                        : params?.is_online === '1' ||
                          params?.is_online === false
                        ? false
                        : undefined,
            }
            const filter = {
                ...rest,
                data_resource_type: !params?.data_resource_type?.[0]
                    ? undefined
                    : params?.data_resource_type,
                updated_at: params?.updated_at?.start_time
                    ? {
                          start: params?.updated_at?.start_time,
                          end: params?.updated_at?.end_time,
                      }
                    : undefined,
                ...statue,
            }
            let reqParams = {
                next_flag,
                filter,
                keyword,
            }

            // 只有加载更多（加载下一页）的时候才传next_flag
            if (!loadMore) {
                setListDataLoading(true)
                delete reqParams.next_flag
            }
            cancelRequest(
                `/api/data-catalog/frontend/v1/data-catalog/search`,
                'post',
            )
            const action =
                // hasDataOperRole
                //     ? reqBusinObjListForOper
                //     :
                reqBusinObjList
            const res = await action(reqParams)

            reqParams = {
                ...reqParams,
                next_flag: res?.next_flag || [],
            }

            const scoreList = res?.entries?.length
                ? await getCatlgScoreSummary(
                      res?.entries?.map((item) => item.id) || [],
                  )
                : []

            // 获取质量评分时，需要将数据资源挂接的库表id传入，获取库表质量评分
            // const tempDataList = await Promise.all(
            //     (res?.entries || []).map(async (item) => {
            //         // 是否挂接库表
            //         const mountView = item?.mount_data_resources?.find(
            //             (mItem) =>
            //                 mItem.data_resources_type ===
            //                 DataRescType.LOGICALVIEW,
            //         )
            //         const viewId = mountView?.data_resources_ids?.[0]
            //         let viewQualityScore

            //         // 处理异步请求
            //         if (viewId) {
            //             try {
            //                 viewQualityScore = await calcDataQualityScore(
            //                     viewId,
            //                 )
            //             } catch (e) {
            //                 formatError(e)
            //             }
            //         }

            //         return {
            //             ...item,
            //             scoreInfo: scoreList.find(
            //                 (s) => s.catalog_id === item.id,
            //             ) || {
            //                 catalog_id: item.id,
            //                 average_score: 0,
            //                 count: 0,
            //             },
            //             viewQualityScore,
            //         }
            //     }),
            // )

            const tempDataList = res?.entries?.map((item) => ({
                ...item,
                scoreInfo: scoreList.find((s) => s.catalog_id === item.id) || {
                    catalog_id: item.id,
                    average_score: 0,
                    count: 0,
                },
            }))

            if (!loadMore) {
                setListData(tempDataList || [])
            } else {
                const listDataTemp = listData || []
                setListData(listDataTemp?.concat(tempDataList || []))
            }
            setTotalCount(res.total_count)

            setFilterListCondition({
                ...reqParams?.filter,
                keyword,
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

    // 进入需求申请页面
    const handleToRequirement = () => {
        const url = `/dataService/requirement/create`
        navigator(url)
    }

    const showDivder = (divdStyle?: any) => {
        return (
            <Divider
                style={{
                    height: '12px',
                    borderRadius: '1px',
                    borderLeft: '1px solid rgba(0,0,0,0.24)',
                    margin: '0px 2px 0px 12px',
                    ...divdStyle,
                }}
                type="vertical"
            />
        )
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

    // 失效数据时重新刷新列表
    const updateData = () => {
        loadEntityList(filterListCondition)
    }

    const getAssetIsOnline = async (item) => {
        getClickAsset(item, ServiceType.DATACATLG)
        // try {
        //     const res = await getRepositoryIsOnline(item?.id)
        //     if (!res.available) {
        //         message.error(
        //             __('当前目录暂不支持在数据资源目录中查看，请查看其他目录'),
        //         )
        //         updateData()
        //     } else {
        //         getClickAsset(item, ServiceType.DATACATLG)
        //     }
        // } catch (error) {
        //     message.error(
        //         __('当前目录暂不支持在数据资源目录中查看，请查看其他目录'),
        //     )
        // }
    }

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

        const listDataTemp = listData?.map((liItem) => {
            if (liItem.id === curItem.id) {
                return {
                    ...liItem,
                    download_access: curItem?.download_access,
                }
            }
            return liItem
        })
        setListData(listDataTemp)
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

    const clickListItem = (item) => {
        setLinkDetailTabKey(undefined)
        setDetailItem(item)
        setCatalogCardOpen(true)
    }

    const clickListItemName = (item) => {
        setLinkDetailTabKey(undefined)
        if (getClickAsset) {
            getAssetIsOnline(item)
            return
        }

        setDetailItem(item)
        setDetailOpen(true)
    }

    const updateInfo = async (dataCatlgCommonInfo) => {
        const catlgId = detailItem?.id || ''
        const scoreInfo = await getCatlgScoreSummary([catlgId])
        setListData(
            listData?.map((item) => {
                if (item.id === catlgId) {
                    return {
                        ...item,
                        scoreInfo: scoreInfo?.[0] || {},
                        is_favored: dataCatlgCommonInfo?.is_favored,
                        favor_id: dataCatlgCommonInfo?.favor_id,
                    }
                }
                return item
            }),
        )
        setDetailItem({
            ...detailItem,
            scoreInfo: scoreInfo?.[0] || {},
            is_favored: dataCatlgCommonInfo?.is_favored,
            favor_id: dataCatlgCommonInfo?.favor_id,
        } as IDataRescItem)
    }

    // 更新列表项收藏状态
    const updateFavoriteInfo = ({ res, item }: { res: any; item?: any }) => {
        setListData(
            listData?.map((i) => {
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
        if (detailItem?.id === item.id) {
            setDetailItem({
                ...detailItem,
                is_favored: res?.is_favored,
                favor_id: res?.favor_id,
            } as IDataRescItem)
        }
    }

    const renderListItem = (item) => {
        const { subject_info = [] } = item || {}
        const subjDomain: Array<any> =
            buildTreeFromSubjectInfo(subject_info, {
                path_id: 'path_id',
                path_name: 'path',
            }) || []
        const department = item?.cate_info?.find(
            (cItem) => cItem.cate_id === SystemCategory.Organization,
        )
        const departmentName = department?.node_name || ''
        // 命中的信息项
        const infoItems = item?.fields?.filter(
            (fItem) =>
                fItem.raw_field_name_zh !== fItem.field_name_zh ||
                fItem.raw_field_name_en !== fItem.field_name_en,
        )
        const showPubTag =
            hasDataOperRole && upPublishedList.includes(item?.published_status)
        const showOnlineTag =
            hasDataOperRole &&
            [
                onLineStatus.UnOnline,
                onLineStatus.OnlineAuditing,
                onLineStatus.OnlineAuditingReject,
                onLineStatus.Offline,
                onLineStatus.OfflinelineAuditing,
                onLineStatus.OfflinelineReject,
            ].includes(item?.online_status) &&
            publishedList.includes(item?.published_status)
        return (
            <List.Item
                key={item.id}
                className={styles.catlgListItem}
                onClick={() => {
                    clickListItem(item)
                }}
            >
                <div className={styles.itemContent}>
                    <div className={styles.itemTop}>
                        <div
                            className={styles.itemTopTitle}
                            onClick={(e) => {
                                e.stopPropagation()
                                clickListItemName(item)
                            }}
                        >
                            <span className={styles.itemTypeTag}>
                                <AppDataContentColored
                                    style={{ fontSize: 20 }}
                                />
                                {__('目录')}
                            </span>

                            {showPubTag ? (
                                <PublishStatusTag
                                    status={item?.published_status}
                                />
                            ) : null}
                            {showOnlineTag ? (
                                <OnlineStatusTag status={item?.online_status} />
                            ) : null}
                            <div
                                className={styles.itemTitle}
                                title={item.raw_name}
                                dangerouslySetInnerHTML={{
                                    __html: item.name,
                                }}
                            />
                        </div>
                    </div>

                    <div className={styles.itemInfoLine}>
                        {/* <div
                            className={classnames(
                                styles.itemDetailInfo,
                                // styles.itemShowAllInfo,
                            )}
                        >
                            <span className={styles.itemDetailInfoTitle}>
                                {__('质量评分')}
                                <Tooltip
                                    title={__('质量评分满分为100分')}
                                    getPopupContainer={(n) => n}
                                >
                                    <QuestionCircleOutlined
                                        style={{ cursor: 'pointer' }}
                                    />
                                </Tooltip>
                                {__('：')}
                            </span>
                            <span className={styles.score}>
                                {isNumber(item?.viewQualityScore)
                                    ? item?.viewQualityScore
                                    : __('暂无')}
                            </span>
                        </div>
                        <Divider
                            type="vertical"
                            className={styles.detlInfoDivider}
                        /> */}

                        <div
                            className={classnames(
                                styles.itemDetailInfo,
                                styles.shareConditionCon,
                            )}
                        >
                            {expeditionQualityGrade(item)}
                        </div>
                        <Divider
                            type="vertical"
                            className={styles.detlInfoDivider}
                        />
                        <div
                            className={classnames(
                                styles.itemDetailInfo,
                                styles.themeCon,
                            )}
                        >
                            <span className={styles.itemDetailInfoTitle}>
                                {__('所属业务对象') + __('：')}
                            </span>
                            <div className={styles.themeTagWrapper}>
                                {/* 只显示选择的L2主题 */}
                                {subjDomain?.length > 0
                                    ? subjDomain.map((tItem) => {
                                          return (
                                              <Tooltip
                                                  title={
                                                      tItem?.children
                                                          ?.map?.((t) => t.name)
                                                          .join('、') ||
                                                      tItem.name
                                                  }
                                                  key={tItem.id}
                                                  // overlayClassName={
                                                  //     styles.unitTooltip
                                                  // }
                                                  overlayStyle={{
                                                      maxWidth: 350,
                                                  }}
                                                  overlayInnerStyle={{
                                                      whiteSpace: 'normal',
                                                  }}
                                                  getPopupContainer={(n) => n}
                                              >
                                                  <span
                                                      key={tItem.id}
                                                      className={
                                                          styles.themeTag
                                                      }
                                                  >
                                                      {tItem.name}
                                                  </span>
                                              </Tooltip>
                                          )
                                      })
                                    : '--'}

                                {subjDomain?.length > 4 && (
                                    <span className={styles.themeTag}>
                                        {`+${
                                            (item.subject_info?.length || 0) - 4
                                        }`}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.itemInfoLine}>
                        <Tooltip
                            title={
                                <div className={styles.unitTooltip}>
                                    <div>{__('目录提供方') + __('：')}</div>
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: department?.node_path,
                                        }}
                                    />
                                </div>
                            }
                            className={styles.toolTip}
                            getPopupContainer={(n) => n}
                            placement="bottom"
                        >
                            <div
                                className={classnames(
                                    styles.itemDetailInfo,
                                    styles.itemDetailProvider,
                                )}
                            >
                                <span className={styles.itemDetailInfoTitle}>
                                    {__('目录提供方') + __('：')}
                                </span>
                                <span className={styles.score}>
                                    {departmentName || '--'}
                                </span>
                            </div>
                        </Tooltip>
                        <Divider
                            type="vertical"
                            className={styles.detlInfoDivider}
                        />
                        <div
                            className={classnames(
                                styles.itemDetailInfo,
                                styles.shareConditionCon,
                            )}
                        >
                            <span className={styles.itemDetailInfoTitle}>
                                {__('共享条件') + __('：')}
                            </span>
                            <span className={styles.shareConditionText}>
                                {shareTypeList?.find(
                                    (sItem) =>
                                        sItem.value === item?.shared_type,
                                )?.label || '--'}
                            </span>
                        </div>
                        <Divider
                            type="vertical"
                            className={styles.detlInfoDivider}
                        />
                        <Tooltip
                            title={
                                <div className={styles.unitTooltip}>
                                    <div>{__('目录更新时间') + __('：')}</div>
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: item?.update_time
                                                ? moment(
                                                      item?.update_time,
                                                  ).format('YYYY-MM-DD')
                                                : __('暂无'),
                                        }}
                                    />
                                </div>
                            }
                            className={styles.toolTip}
                            getPopupContainer={(n) => n}
                            placement="bottom"
                        >
                            <div
                                className={classnames(
                                    styles.itemDetailInfo,
                                    // styles.itemShowAllInfo,
                                )}
                            >
                                <span className={styles.itemDetailInfoTitle}>
                                    {__('目录更新时间') + __('：')}
                                </span>
                                <span>
                                    {item?.update_time
                                        ? moment(item?.update_time).format(
                                              'YYYY-MM-DD',
                                          )
                                        : __('暂无')}
                                </span>
                            </div>
                        </Tooltip>
                        {/* <Divider
                            type="vertical"
                            className={styles.detlInfoDivider}
                        />
                        <Tooltip
                            title={
                                <div className={styles.unitTooltip}>
                                    <div>{__('目录提供方') + __('：')}</div>
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: item?.data_update_time
                                                ? moment(
                                                      item?.data_update_time,
                                                  ).format('YYYY-MM-DD')
                                                : __('暂无'),
                                        }}
                                    />
                                </div>
                            }
                            className={styles.toolTip}
                            getPopupContainer={(n) => n}
                            placement="bottom"
                        >
                            <div
                                className={classnames(
                                    styles.itemDetailInfo,
                                    // styles.itemShowAllInfo,
                                )}
                            >
                                <span className={styles.itemDetailInfoTitle}>
                                    {__('数据更新时间') + __('：')}
                                </span>
                                <span>
                                    {item?.data_update_time
                                        ? moment(item?.data_update_time).format(
                                              'YYYY-MM-DD',
                                          )
                                        : __('暂无')}
                                </span>
                            </div>
                        </Tooltip> */}
                    </div>

                    {/* 有搜到关键词就显示描述 */}
                    {item.raw_description !== item.description && (
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
                    )}

                    {item.data_resource_type !== ResourceType.File &&
                        !!infoItems?.length && (
                            <div style={{ marginTop: '8px', width: '100%' }}>
                                <CatalogInfoItems
                                    dataList={infoItems?.map((it) => ({
                                        ...it,
                                        name: it.raw_field_name_zh,
                                        code: it.raw_field_name_en,
                                        rowName: it.field_name_zh,
                                        rowCode: it.field_name_en,
                                    }))}
                                />
                            </div>
                        )}
                    {/* <CatalogMoreInfo
                        categorys={categorys}
                        infoData={getMoreInfoData(item)}
                    /> */}
                </div>
                {/* <div className={styles.oprContent}>
                    <div className={styles.oprFirstLine}>

                        {listContentLt950 ? (
                            <OprDropDown
                                catalog={item}
                                onCallback={(
                                    oprKey: DCatlgOprType,
                                    value: any,
                                ) => {
                                    if (oprKey === DCatlgOprType.ShareApply) {
                                        setApplyCatalog(value)
                                    }
                                }}
                                onAddFavorite={(res) =>
                                    updateFavoriteInfo({ res, item })
                                }
                                onCancelFavorite={(res) =>
                                    updateFavoriteInfo({ res, item })
                                }
                            />
                        ) : (
                            <>
                                {hasBusinessRoles && (
                            <Tooltip
                                placement="bottom"
                                title={chatTipCatalog(
                                    'normal',
                                    item.is_online,
                                    item.actions?.includes('read'),
                                    item.data_resource_type,
                                )}
                                getPopupContainer={(n) => n}
                            >
                                <FontIcon
                                    name="icon-yinyong1"
                                    className={classnames({
                                        [styles.itemOprIcon]: true,
                                        [styles.itemOprDiabled]: !(
                                            llm &&
                                            item.is_online &&
                                            item.actions?.includes('read') &&
                                            item.data_resource_type ===
                                                ResourceType.DataView
                                        ),
                                    })}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        if (
                                            !(
                                                llm &&
                                                item.is_online &&
                                                item.actions?.includes(
                                                    'read',
                                                ) &&
                                                item.data_resource_type ===
                                                    ResourceType.DataView
                                            )
                                        )
                                            return
                                        updateParams(CogAParamsType.Resource, {
                                            data: [
                                                {
                                                    id: item.id,
                                                    name: item.raw_name,
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
                        )}

                                加入/移出共享清单+共享申请
                                {item.is_online &&
                                    platform === LoginPlatform.drmp && (
                                        <CityShareOperation
                                            catalog={item}
                                            className={styles.listItemOprIcon}
                                            disabledClassName={
                                                styles.itemOprDiabled
                                            }
                                            showClassName={
                                                styles.itemOprIconVisible
                                            }
                                            type="button"
                                            onApply={(value) => {
                                                setApplyCatalog(value)
                                            }}
                                        />
                                    )}

                                <div className={styles.addAssetsToLibrary}>
                        {getAddAsset ? (
                            <div className={styles.assetsIconWrapper}>
                                <Tooltip
                                    title={
                                        addedAssets.find(
                                            (asset) => asset.res_id === item.id,
                                        )
                                            ? '已添加'
                                            : ''
                                    }
                                >
                                    <Button
                                        disabled={addedAssets.find(
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
                                updateData={(type: BusinObjOpr) => {
                                    handleAssetBtnUpdate(type, item)
                                }}
                                errorCallback={handleError}
                            />
                        )}
                    </div>
                            </>
                        )}
                    </div>
                    {!listContentLt950 && (
                        <div className={styles.oprSecLine}>
                            目录反馈
                            {item.is_online && (
                                <FeedbackOperation
                                    catalog={item}
                                    // className={styles.itemOprIcon}
                                    type="button"
                                />
                            )}

                            收藏
                            {item.is_online && (
                                <FavoriteOperation
                                    item={item}
                                    // className={styles.itemOprIcon}
                                    type="button"
                                    resType={ResType.DataCatalog}
                                    onAddFavorite={(res) =>
                                        updateFavoriteInfo({ res, item })
                                    }
                                    onCancelFavorite={(res) =>
                                        updateFavoriteInfo({ res, item })
                                    }
                                />
                            )}
                        </div>
                    )}
                </div> */}
            </List.Item>
        )
    }

    const handleError = (error?: any) => {
        const { code } = error?.data || {}

        // 资源下线-刷新列表（其他错误如服务器错误等，不刷新列表）
        if (code === RescErrorCodeList.ASSETSOFFLINEERROR) {
            updateData()
        }
    }

    return (
        <>
            <div
                className={classnames({
                    [styles.contentWrapper]: true,
                    [styles.businessAssetsWrapper]: true,
                    [styles.dataCatlgContWrapper]: true,
                    [styles.businessAssetsInDrawerWrapper]: getClickAsset,
                })}
            >
                {catlgView === CatlgView.BUSIN ? (
                    <BusinView />
                ) : catlgView === CatlgView.DATA ? (
                    <Row
                        wrap={false}
                        style={{
                            height: '100%',
                            width: '100%',
                        }}
                    >
                        <Col flex={expand ? '280px' : 0}>
                            <div className={styles.leftWrapper}>
                                <ResourcesCustomTree
                                    onChange={setSelectedNode}
                                    defaultCategotyId="00000000-0000-0000-0000-000000000001"
                                    needUncategorized
                                    applyScopeTreeKey="market_left"
                                    applyScopeId="00000000-0000-0000-0000-000000000002"
                                />
                            </div>

                            {/* <span
                                className={styles.expandSwitch}
                                hidden={expand}
                                onClick={() => {
                                    setExpand(true)
                                }}
                            >
                                <ViewOutlined />
                                <span>{__('视角')}</span>
                            </span> */}
                        </Col>
                        <Col flex="auto">
                            <div className={styles.rightWrapper}>
                                {/* 业务逻辑实体列表 */}
                                <div className={styles.catlgListWrapper}>
                                    <ExpandFilterConditionLayout
                                        layoutClassName={
                                            styles.catlgFilterLayout
                                        }
                                        isShowExpSwitch
                                        filterConfig={filterConfig}
                                        updateList={(params: any) => {
                                            setFilterListCondition((pre) => ({
                                                ...pre,
                                                ...params,
                                            }))
                                            loadEntityList({
                                                ...filterListCondition,
                                                ...params,
                                            })
                                        }}
                                        getIsShowClearBtn={(flag) =>
                                            setIsSearch(flag)
                                        }
                                        beforeSearchInputKey={
                                            FilterConditionType.UPDATEAT
                                        }
                                    />
                                    {/* <div style={{ position: 'relative' }}>
                                        <div
                                            className={styles.expandSwitch}
                                            onClick={() => {
                                                setExpand(!expand)
                                            }}
                                        >
                                            {expand ? (
                                                <CaretUpOutlined />
                                            ) : (
                                                <CaretDownOutlined />
                                            )}
                                        </div>
                                    </div> */}
                                    {/* 
                                    <Collapse
                                        activeKey={expand ? ['1'] : undefined}
                                        ghost
                                    >
                                        <Panel
                                            header={
                                                <div
                                                    className={
                                                        styles.expandSwitch
                                                    }
                                                    onClick={() => {
                                                        setExpand(!expand)
                                                    }}
                                                >
                                                    {expand ? (
                                                        <CaretUpOutlined />
                                                    ) : (
                                                        <CaretDownOutlined />
                                                    )}
                                                </div>
                                            }
                                            key="1"
                                        >
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: '200px',
                                                    border: '1px solid pink',
                                                }}
                                            >
                                                展开内容panel
                                            </div>
                                        </Panel>
                                    </Collapse> */}

                                    <div
                                        className={
                                            styles.catlgListContentWrapper
                                        }
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
                                                !catalogCardOpen &&
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
                                            <div
                                                className={
                                                    styles.listLeftWrapper
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles.totalWrapper
                                                    }
                                                    // style={
                                                    //     catalogCardOpen
                                                    //         ? showCardStyle
                                                    //         : {}
                                                    // }
                                                >
                                                    <div>
                                                        共
                                                        <span
                                                            className={
                                                                styles.totalCount
                                                            }
                                                        >{` ${totalCount} `}</span>
                                                        条资源
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.sortWrapper
                                                        }
                                                    >
                                                        {catlgSortOptions?.map(
                                                            (sItem) => {
                                                                return (
                                                                    <div
                                                                        key={
                                                                            sItem.value
                                                                        }
                                                                        className={classnames(
                                                                            styles.sortItem,
                                                                            sortOption?.value ===
                                                                                sItem.value &&
                                                                                styles.sortItemActive,
                                                                        )}
                                                                        // onClick={() => {
                                                                        //     setSortOption(
                                                                        //         ...sortOption,
                                                                        //         ...sItem,
                                                                        //     )
                                                                        // }}
                                                                    >
                                                                        {/* <span>
                                                                            {
                                                                                sItem.label
                                                                            }
                                                                        </span> */}
                                                                        <SortComponent
                                                                            curSortItem={
                                                                                sItem
                                                                            }
                                                                            sortOption={
                                                                                sortOption
                                                                            }
                                                                            defaultOrder={
                                                                                defaultDirection
                                                                            }
                                                                            onChange={(
                                                                                newOrder,
                                                                            ) => {
                                                                                const newSort =
                                                                                    {
                                                                                        ...sortOption,
                                                                                        ...sItem,
                                                                                        direction:
                                                                                            sortOption?.value ===
                                                                                            sItem.value
                                                                                                ? sortOption?.direction ===
                                                                                                  SortDirection.DESC
                                                                                                    ? SortDirection.ASC
                                                                                                    : SortDirection.DESC
                                                                                                : defaultDirection,
                                                                                    }
                                                                                loadEntityList(
                                                                                    {
                                                                                        ...filterListCondition,
                                                                                        orders: [
                                                                                            {
                                                                                                sort: newSort.value,
                                                                                                direction:
                                                                                                    newSort.direction,
                                                                                            },
                                                                                        ],
                                                                                    },
                                                                                )
                                                                                setSortOption(
                                                                                    newSort,
                                                                                )
                                                                            }}
                                                                        />
                                                                    </div>
                                                                )
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                                <div
                                                    className={
                                                        styles.listLoading
                                                    }
                                                    hidden={!listDataLoading}
                                                    // style={
                                                    //     catalogCardOpen
                                                    //         ? {
                                                    //               ...showCardStyle,
                                                    //               height: '100%',
                                                    //               marginTop: 0,
                                                    //           }
                                                    //         : {}
                                                    // }
                                                >
                                                    <Loader />
                                                </div>
                                                <div
                                                    id={scrollListId}
                                                    ref={scrollListRef}
                                                    className={
                                                        styles.listDataWrapper
                                                    }
                                                    hidden={listDataLoading}
                                                    // style={
                                                    //     catalogCardOpen
                                                    //         ? showCardStyle
                                                    //         : {}
                                                    // }
                                                >
                                                    {!listData?.length ? (
                                                        <div
                                                            className={
                                                                styles.listEmpty
                                                            }
                                                        >
                                                            {showListDataEmpty()}
                                                        </div>
                                                    ) : (
                                                        <InfiniteScroll
                                                            dataLength={
                                                                listData.length
                                                            }
                                                            next={() => {
                                                                loadEntityList(
                                                                    filterListCondition,
                                                                    true,
                                                                )
                                                            }}
                                                            hasMore={
                                                                isNumber(
                                                                    listData?.length,
                                                                ) &&
                                                                listData?.length <
                                                                    totalCount
                                                            }
                                                            loader={<div />}
                                                            scrollableTarget={
                                                                scrollListId
                                                            }
                                                            endMessage={
                                                                listData?.length >=
                                                                defaultListSize ? (
                                                                    <div
                                                                        style={{
                                                                            textAlign:
                                                                                'center',
                                                                            color: 'rgba(0,0,0,0.25)',
                                                                            padding:
                                                                                '8px 0',
                                                                            fontSize:
                                                                                '12px',
                                                                            background:
                                                                                '#fff',
                                                                        }}
                                                                    >
                                                                        {__(
                                                                            '已完成全部加载',
                                                                        )}
                                                                    </div>
                                                                ) : undefined
                                                            }
                                                        >
                                                            <List
                                                                dataSource={
                                                                    listData
                                                                }
                                                                renderItem={
                                                                    renderListItem
                                                                }
                                                            />
                                                        </InfiniteScroll>
                                                    )}
                                                </div>
                                                <Tooltip
                                                    title={__('回到顶部')}
                                                    placement="top"
                                                >
                                                    <BackTop
                                                        className={
                                                            styles.backTop
                                                        }
                                                        target={() =>
                                                            document.getElementById(
                                                                scrollListId,
                                                            ) || window
                                                        }
                                                        onClick={() => {
                                                            // 页面置顶
                                                            goBackTop(
                                                                scrollListId,
                                                            )
                                                        }}
                                                    >
                                                        <ReturnTopOutlined />
                                                    </BackTop>
                                                </Tooltip>
                                            </div>
                                            <div
                                                className={
                                                    styles.listRightWrapper
                                                }
                                                hidden={!catalogCardOpen}
                                            >
                                                {catalogCardOpen && (
                                                    <CatalogCard
                                                        catalogId={
                                                            detailItem?.id
                                                        }
                                                        info={detailItem}
                                                        open={catalogCardOpen}
                                                        style={{
                                                            position:
                                                                'relative',
                                                            right: '0px',
                                                            height: '100%',
                                                            zIndex: '999',
                                                            width: '100%',
                                                        }}
                                                        onClose={() => {
                                                            setCatalogCardOpen(
                                                                false,
                                                            )
                                                        }}
                                                        toOpenDetails={(
                                                            tabKey?: DataCatlgTabKey,
                                                        ) => {
                                                            setDetailOpen(true)
                                                            setLinkDetailTabKey(
                                                                tabKey,
                                                            )
                                                        }}
                                                        onAddFavorite={(res) =>
                                                            updateFavoriteInfo({
                                                                res,
                                                                item: detailItem,
                                                            })
                                                        }
                                                        onCancelFavorite={(
                                                            res,
                                                        ) =>
                                                            updateFavoriteInfo({
                                                                res,
                                                                item: detailItem,
                                                            })
                                                        }
                                                    />
                                                )}
                                            </div>
                                        </DragBox>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                ) : null}
            </div>

            {detailOpen && (
                <DataCatlgContent
                    open={detailOpen}
                    onClose={(dataCatlgCommonInfo) => {
                        setDetailOpen(false)
                        if (catalogId) {
                            searchParams.delete('catalogId')
                            setSearchParams(searchParams)
                        }
                        updateInfo(dataCatlgCommonInfo)
                    }}
                    assetsId={detailItem?.id}
                    tabKey={linkDetailTabKey}
                    isIntroduced={isIntroduced}
                    handleAssetBtnUpdate={handleAssetBtnUpdate}
                    errorCallback={handleError}
                    canChat
                    hasAsst={platform === LoginPlatform.default}
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
})

export default DataCatlg
