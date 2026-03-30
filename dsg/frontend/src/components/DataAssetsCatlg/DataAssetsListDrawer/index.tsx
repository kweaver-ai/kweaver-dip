import { FC, useEffect, useRef, useState, useContext, useMemo } from 'react'
import moment from 'moment'
import { Drawer, Space, Tooltip } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import InfiniteScroll from 'react-infinite-scroll-component'

import dataEmpty from '@/assets/dataEmpty.svg'
import styles from './styles.module.less'
import __ from './locale'
import { AssetIcons, DataType, TitleText } from './helper'
import {
    formatError,
    getDataRescList,
    getDataRescListByOper,
    HasAccess,
} from '@/core'
import {
    DatasheetViewColored,
    DepartmentOutlined,
    InterfaceColored,
    ThemeOutlined,
} from '@/icons'
import IndicatorManagementOutlined from '@/icons/IndicatorManagementOutlined'
import LogicViewCard from '../LogicViewDetail/LogicViewCard'
import InterfaceCard from '../ApplicationServiceDetail/InterfaceCard'
import IndicatorViewCard from '../IndicatorViewDetail/IndicatorViewCard'
import LogicViewDetail from '../LogicViewDetail'
import IndicatorViewDetail from '../IndicatorViewDetail'
import ApplicationServiceDetail from '../ApplicationServiceDetail'
import { Empty, Loader } from '@/ui'
import { MicroWidgetPropsContext } from '@/context'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IDataAssetsListDrawer {
    type: string
    domainId: string
    onClose: () => void
    open: boolean
    domainName?: string
    domainType?: string
}
const DataAssetsListDrawer: FC<IDataAssetsListDrawer> = ({
    domainId,
    type,
    onClose,
    open,
    domainName = '',
    domainType = '',
}) => {
    const [loading, setLoading] = useState<boolean>(false)
    const [listData, setListData] = useState<Array<any>>([])
    const [listDataLoading, setListDataLoading] = useState<boolean>(false)
    const [totalCount, setTotalCount] = useState<number>(0)
    const scrollRef: any = useRef()
    const [viewDetailOpen, setViewDetailOpen] = useState<boolean>(false)
    // 数据库表卡片详情
    const [viewCardOpen, setViewCardOpen] = useState<boolean>(false)
    // 接口详情
    const [interfaceDetailOpen, setInterfaceDetailOpen] =
        useState<boolean>(false)
    // 接口卡片详情
    const [interfaceCardOpen, setInterfaceCardOpen] = useState<boolean>(false)
    // 指标详情
    const [indicatorDetailOpen, setIndicatorDetailOpen] =
        useState<boolean>(false)
    // 指标卡片详情
    const [indicatorCardOpen, setIndicatorCardOpen] = useState<boolean>(false)
    const [onlineTime, setOnlineTime] = useState<any>()
    const [nextFlag, setNextFlag] = useState<Array<string>>([])
    const [selectedResc, setSelectedResc] = useState<any>()

    const [selectedServiceCode, setSelectedServiceCode] = useState<string>('')
    const [authInfoOpen, setAuthInfoOpen] = useState<boolean>(false)
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)

    const scrollListId = 'scrollableDiv'

    // 默认加载条数
    const defaultListSize = 20

    const { checkPermissions } = useUserPermCtx()
    const [{ using }] = useGeneralConfig()
    // 是否拥有数据运营工程师
    const hasDataOperRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermissions])

    useEffect(() => {
        if (type && domainId) {
            setSelectedResc(undefined)
            getApplicationData([])
        }
    }, [type, domainId, hasDataOperRole])

    const getDataRescTypeIcon = (currentType) => {
        switch (currentType) {
            case DataType.INTERFACE:
                return <InterfaceColored className={styles.itemIcon} />
            case DataType.DATAVIEW:
                return <DatasheetViewColored className={styles.itemIcon} />
            case DataType.INDICATOR:
                return (
                    <div className={styles.iconContainer}>
                        <IndicatorManagementOutlined
                            style={{
                                color: '#fff',
                                fontSize: 20,
                            }}
                        />
                    </div>
                )
            default:
                return ''
        }
    }

    /**
     *  获取字段Label
     * @param type  数据类型
     * @param count 总数
     * @returns
     */
    const getFieldLabelData = (currentType: DataType, count = 0) => {
        switch (currentType) {
            case DataType.DATAVIEW:
                return __('字段信息(${count}):', {
                    count: (count || 0).toString(),
                })
            case DataType.INTERFACE:
                return __('出参字段(${count}):', {
                    count: (count || 0).toString(),
                })
            case DataType.INDICATOR:
                return __('分析维度：')
            default:
                return ''
        }
    }

    /**
     *  获取字段的显示
     * @param item
     * @returns
     */
    const getFieldsInfo = (item) => {
        const fieldData = item.fields || []

        return fieldData?.length
            ? fieldData?.slice(0, 3)?.map((fItem: any) => (
                  <Tooltip
                      title={
                          <div>
                              <div>
                                  <span>{__('业务名称：')}</span>
                                  <span>{fItem?.business_name}</span>
                              </div>

                              <div>
                                  <span>{__('技术名称：')}</span>
                                  <span>
                                      {fItem?.raw_technical_name ||
                                          fItem?.technical_name}
                                  </span>
                              </div>
                          </div>
                      }
                      color="#fff"
                      overlayInnerStyle={{
                          color: 'rgba(0,0,0,0.85)',
                      }}
                  >
                      <div
                          className={styles.fieldTag}
                          dangerouslySetInnerHTML={{
                              __html: `${fItem?.business_name}` || '--',
                          }}
                      />
                  </Tooltip>
              ))
            : '--'
    }

    const renderListItem = (item: any) => {
        let {
            subject_domain_name,
            subject_domain_path,
            department_name,
            department_path,
        } = item
        subject_domain_name = subject_domain_name || '--'
        subject_domain_path = subject_domain_path || '--'
        department_name = department_name || '--'
        department_path = department_path || '--'
        return (
            <div
                className={classnames(
                    styles.rescItem,
                    selectedResc?.id === item.id && styles.selRescItem,
                )}
                onClick={(e) => {
                    setSelectedResc(item)
                    setSelectedServiceCode(item.id)
                    if (
                        item.type === DataType.INDICATOR &&
                        !indicatorCardOpen
                    ) {
                        setInterfaceCardOpen(false)
                        setViewCardOpen(false)
                        setIndicatorCardOpen(true)
                    } else if (
                        item.type === DataType.DATAVIEW &&
                        !viewCardOpen
                    ) {
                        setIndicatorCardOpen(false)
                        setInterfaceCardOpen(false)
                        setViewCardOpen(true)
                    } else if (
                        item.type === DataType.INTERFACE &&
                        !interfaceCardOpen
                    ) {
                        setIndicatorCardOpen(false)
                        setViewCardOpen(false)
                        setInterfaceCardOpen(true)
                    }
                }}
            >
                <div className={styles.nameContent}>
                    {getDataRescTypeIcon({
                        type: item.type,
                        indicator_type: item.indicator_type,
                    })}
                    <div
                        title={item.name}
                        className={styles.name}
                        dangerouslySetInnerHTML={{
                            __html: item.name,
                        }}
                        onClick={() => {
                            setSelectedResc(item)
                            if (item.type === DataType.DATAVIEW) {
                                setViewDetailOpen(true)
                            } else if (item.type === DataType.INTERFACE) {
                                setInterfaceDetailOpen(true)
                            } else if (item.type === DataType.INDICATOR) {
                                setIndicatorDetailOpen(true)
                            }
                        }}
                    />

                    {/* {item.has_permission && (
                        <div className={styles.nameBtn}>
                            {item?.type ===
                            DataType.INDICATOR ? null : item?.type ===
                              DataType.INTERFACE ? (
                                <InterfaceOutlined
                                    className={styles.itemOprIcon}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setSelectedResc(item)
                                        setSelectedServiceCode(item.id)
                                        setAuthInfoOpen(true)
                                    }}
                                />
                            ) : (
                                <FontIcon
                                    name="icon-xiazai"
                                    className={styles.itemOprIcon}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setSelectedResc(item)
                                        setDownloadOpen(true)
                                    }}
                                />
                            )}
                        </div>
                    )} */}
                </div>
                <div
                    title={item.description || '--'}
                    className={styles.description}
                    dangerouslySetInnerHTML={{
                        __html: `${
                            item.type === DataType.INDICATOR
                                ? __('指标定义：')
                                : __('描述：')
                        }${item.description || '--'}`,
                    }}
                />
                <div className={styles.filedInfoWrapper}>
                    <div className={styles.fieldTitle}>
                        {getFieldLabelData(
                            item.type as DataType,
                            item?.field_count || item?.fields?.length || 0,
                        )}
                    </div>
                    <Space size={4} className={styles.fieldTagWrapper}>
                        {getFieldsInfo(item)}
                    </Space>
                </div>
                <div className={styles.otherInfo}>
                    <div>
                        {using === 1
                            ? `${__('发布时间')} ${
                                  item.published_at
                                      ? moment(item.published_at).format(
                                            'YYYY-MM-DD',
                                        )
                                      : '--'
                              }`
                            : `${__('上线时间')} ${
                                  item.online_at
                                      ? moment(item.online_at).format(
                                            'YYYY-MM-DD',
                                        )
                                      : '--'
                              }`}
                    </div>

                    <div className={styles.line} />
                    <div className={styles.itemOtherInfoWrapper}>
                        <div className={styles.itemOtherInfo}>
                            <Tooltip
                                title={__('所属主题：${text}', {
                                    text: subject_domain_path,
                                })}
                                className={styles.toolTip}
                            >
                                <div className={styles.icon}>
                                    <ThemeOutlined />
                                </div>
                                <div className={styles.infoContent}>
                                    {subject_domain_name}
                                </div>
                            </Tooltip>
                        </div>
                        <div className={styles.itemOtherInfo}>
                            <Tooltip
                                title={__('所属部门：${text}', {
                                    text: department_path,
                                })}
                                className={styles.toolTip}
                            >
                                <div className={styles.icon}>
                                    <DepartmentOutlined
                                        className={styles.commonIcon}
                                        style={{
                                            fontSize: 16,
                                        }}
                                    />
                                </div>
                                <div className={styles.infoContent}>
                                    {department_name}
                                </div>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    /**
     * 异步获取应用数据列表。
     * @param initData 初始数据数组，用于加载更多数据时的拼接。
     */
    const getApplicationData = async (initData: Array<any>) => {
        try {
            // 设置加载状态为true，开启加载动画。
            setListDataLoading(true)
            // 初始化界面卡片状态为关闭。
            setViewCardOpen(false)
            setInterfaceCardOpen(false)
            setIndicatorCardOpen(false)

            // 构建请求过滤条件对象。
            const obj: any = {
                filter: {
                    published_at: onlineTime,
                    type,
                    subject_domain_id: domainId,
                },
            }

            let res
            // 根据是否有数据操作角色，调用不同的接口获取数据。
            if (hasDataOperRole) {
                res = await getDataRescListByOper(
                    initData.length ? { ...obj, next_flag: nextFlag } : obj,
                )
            } else {
                res = await getDataRescList(
                    initData.length ? { ...obj, next_flag: nextFlag } : obj,
                )
            }

            // 解析响应数据，更新界面状态。
            const { total_count, next_flag, entries } = res
            setNextFlag(next_flag || [])
            const newListData = entries ? [...initData, ...entries] : []
            setListData(newListData)
            setTotalCount(total_count)

            // 如果是首次加载且只有一条数据，打开对应类型的卡片详情。
            // 搜索接口只有一条数据，则打开侧边详情框xxx
            if (!initData?.length && newListData?.length === 1) {
                const onlyRes = newListData?.[0]
                setSelectedResc(onlyRes)
                // 根据数据类型打开相应的卡片。
                if (onlyRes?.type === DataType.DATAVIEW) {
                    setInterfaceCardOpen(false)
                    setViewCardOpen(true)
                    setIndicatorCardOpen(false)
                } else if (onlyRes?.type === DataType.INTERFACE) {
                    setViewCardOpen(false)
                    setInterfaceCardOpen(true)
                    setIndicatorCardOpen(false)
                } else if (onlyRes?.type === DataType.INDICATOR) {
                    setViewCardOpen(false)
                    setInterfaceCardOpen(false)
                    setIndicatorCardOpen(true)
                }
            }
        } catch (e) {
            // 错误处理，使用toast组件显示错误信息。
            formatError(e, microWidgetProps?.components?.toast)
        } finally {
            // 无论成功或失败，最终都关闭加载状态。
            setListDataLoading(false)
        }
    }

    return (
        <div className={styles.dataListWrapper}>
            <Drawer
                destroyOnClose
                maskClosable={false}
                maskStyle={{ display: 'none', backgroundColor: 'transparent' }}
                // style={{ position: 'absolute' }}
                push={{ distance: 0 }}
                headerStyle={{ display: 'none' }}
                // bodyStyle={{
                //     padding: 0,
                //     display: 'flex',
                //     flexDirection: 'column',
                //     alignItems: 'center',
                //     minWidth: 1280,
                // }}
                contentWrapperStyle={{
                    width: '100%',
                    // boxShadow: 'none',
                }}
                getContainer={false}
                open={open}
                // 显示抽屉自带title
                title={undefined}
                onClose={onClose}
                // className={bodyClassName}
                bodyStyle={{
                    width: 840,
                    padding: 0,
                    // flexDirection: 'column',
                }}
                style={{
                    position: 'relative',
                    width: 840,
                    right: '0',
                    height: '100%',
                }}
                // {...cardProps}
                // customBodyStyle={{ height: 'calc(100% - 125px)' }}
                // title={viewInfo?.service_name || '--'}
            >
                <div
                    id="customDrawerBody"
                    className={classnames(styles.body)}
                    style={{
                        flexDirection: 'column',
                        height: '100%',
                    }}
                >
                    <div className={styles.viewHeaderWrapper}>
                        <div className={styles.viewTitle} title={domainName}>
                            <span className={styles.icon}>
                                {AssetIcons[domainType]}
                            </span>
                            <span className={styles.text}>{domainName}</span>
                        </div>
                        <div className={styles.headerBtnWrapper}>
                            <Tooltip title={__('关闭')} placement="bottom">
                                <CloseOutlined
                                    className={styles.closeIcon}
                                    onClick={() => {
                                        onClose()
                                    }}
                                />
                            </Tooltip>
                        </div>
                    </div>
                    <div className={styles.viewContentWrapper}>
                        <div
                            className={styles.listLoading}
                            hidden={!listDataLoading}
                        >
                            <Loader />
                        </div>
                        <div
                            className={styles.listContentWrapper}
                            hidden={listDataLoading}
                        >
                            <div className={styles.leftWrapper}>
                                <div className={styles.listTitle}>
                                    <span>{TitleText[type]}</span>
                                    <span>
                                        {__('（${count}）', {
                                            count: totalCount || '0',
                                        })}
                                    </span>
                                </div>
                                <div
                                    className={styles.listEmpty}
                                    hidden={listData?.length > 0}
                                >
                                    <Empty
                                        iconSrc={dataEmpty}
                                        desc={__('暂无数据')}
                                    />
                                </div>
                                <div
                                    id={scrollListId}
                                    className={styles.contentList}
                                    ref={scrollRef}
                                    hidden={!listData?.length}
                                >
                                    <InfiniteScroll
                                        hasMore={listData.length < totalCount}
                                        endMessage={
                                            listData.length >=
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
                                        loader={
                                            <div className={styles.listLoading}>
                                                <Loader />
                                            </div>
                                        }
                                        next={() => {
                                            getApplicationData(listData)
                                        }}
                                        dataLength={listData.length}
                                        scrollableTarget={scrollListId}
                                    >
                                        {listData.map((item = {}) =>
                                            renderListItem(item),
                                        )}
                                    </InfiniteScroll>
                                </div>
                            </div>
                            {viewCardOpen ? (
                                <div className={styles.rightWrapper}>
                                    <LogicViewCard
                                        open={viewCardOpen}
                                        onClose={() => {
                                            setViewCardOpen(false)
                                        }}
                                        onSure={() => {}}
                                        id={selectedResc?.id}
                                        onFullScreen={() => {
                                            setViewDetailOpen(true)
                                        }}
                                        inAssetPanorama
                                        allowDownload={
                                            selectedResc?.has_permission
                                        }
                                    />
                                </div>
                            ) : null}
                            {interfaceCardOpen ? (
                                <div className={styles.rightWrapper}>
                                    <InterfaceCard
                                        open={interfaceCardOpen}
                                        onClose={() => {
                                            setInterfaceCardOpen(false)
                                        }}
                                        onSure={() => {}}
                                        interfaceId={selectedResc?.id}
                                        onFullScreen={() => {
                                            setInterfaceDetailOpen(true)
                                        }}
                                        inAssetPanorama
                                    />
                                </div>
                            ) : null}
                            {indicatorCardOpen ? (
                                <div className={styles.rightWrapper}>
                                    <IndicatorViewCard
                                        open={indicatorCardOpen}
                                        onClose={() => {
                                            setIndicatorCardOpen(false)
                                        }}
                                        onSure={() => {}}
                                        indicatorId={selectedResc?.id}
                                        onFullScreen={() => {
                                            setIndicatorDetailOpen(true)
                                        }}
                                        inAssetPanorama
                                    />
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </Drawer>

            {viewDetailOpen && (
                <LogicViewDetail
                    open={viewDetailOpen}
                    onClose={() => {
                        setViewDetailOpen(false)
                    }}
                    hasPermission={selectedResc?.has_permission}
                    id={selectedResc?.id}
                    // isIntroduced={isIntroduced}
                    canChat
                />
            )}
            {indicatorDetailOpen && (
                <IndicatorViewDetail
                    open={indicatorDetailOpen}
                    // isIntroduced={isIntroduced}
                    id={selectedResc?.id}
                    onClose={() => {
                        setIndicatorDetailOpen(false)
                    }}
                    indicatorType={selectedResc?.indicator_type || ''}
                    canChat
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
                        hasPermission={selectedResc?.has_permission}
                        serviceCode={selectedResc?.id}
                        // isIntroduced={isIntroduced}
                    />
                </div>
            )}
        </div>
    )
}

export default DataAssetsListDrawer
