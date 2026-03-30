import { Space, Table, message } from 'antd'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useUpdateEffect } from 'ahooks'
import { trim, omit } from 'lodash'
import { Empty, OptionBarTool, OptionMenuType, SearchInput } from '@/ui'
import {
    formatError,
    getFavoriteList,
    ResType,
    deleteFavorite,
    IGetFavoriteListParams,
    IFavoriteItem,
} from '@/core'
import { formatTime } from '@/utils'
import { RefreshBtn } from '../ToolbarComponents'
import {
    FavoriteTabMap,
    FavoriteOperate,
    renderEmpty,
    renderLoader,
    MultiHeader,
    MultiColumn,
    SubjectView,
    ResourceTypeView,
} from './helper'
import __ from './locale'
import styles from './styles.module.less'
import DataCatlgContent from '@/components/DataAssetsCatlg/DataCatlgContent'
import InfoCatlgDetails from '@/components/DataAssetsCatlg/InfoResourcesCatlg/InfoCatlgDetails'
import ApplicationServiceDetail from '@/components/DataAssetsCatlg/ApplicationServiceDetail'
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'

const FavoriteTable: React.FC<{
    menu: ResType
}> = ({ menu }) => {
    // 初始化 load
    const [loading, setLoading] = useState<boolean>(true)
    // 加载数据 load
    const [fetching, setFetching] = useState<boolean>(true)
    // 表格数据
    const [tableData, setTableData] = useState<IFavoriteItem[]>([])
    // 总条数
    const [total, setTotal] = useState<number>(0)
    // 当前操作项
    const [operateItem, setOperateItem] = useState<IFavoriteItem>()
    // 信息资源目录详情弹窗
    const [infoCatalogVisible, setInfoCatalogVisible] = useState(false)
    // 数据资源目录详情弹窗
    const [dataCatalogVisible, setDataCatalogVisible] = useState(false)
    // 电子证照详情弹窗
    const [elecLicenceCatalogVisible, setElecLicenceCatalogVisible] =
        useState(false)
    // 接口服务详情弹窗
    const [interfaceSvcVisible, setInterfaceSvcVisible] = useState(false)
    // 库表详情
    const [logicViewVisible, setLogicViewVisible] = useState(false)
    // 搜索条件
    const [searchCondition, setSearchCondition] =
        useState<IGetFavoriteListParams>()
    // 获取 搜索条件
    const searchConditionRef = useRef(searchCondition)

    useEffect(() => {
        // 初始化搜索条件
        const { initSearch } = FavoriteTabMap[menu]
        setSearchCondition(initSearch)
    }, [menu])

    useEffect(() => {
        searchConditionRef.current = searchCondition
    }, [searchCondition])

    // 是否有过滤值
    const isSearchStatus = useMemo(() => {
        const ignoreAttr = ['offset', 'limit', 'res_type']
        return Object.values(omit(searchCondition, ignoreAttr)).some(
            (item) => item,
        )
    }, [searchCondition])

    useUpdateEffect(() => {
        if (searchCondition) {
            getTableList({ ...searchCondition })
        }
    }, [searchCondition])

    // 获取表格数据
    const getTableList = async (params: any) => {
        try {
            setFetching(true)
            const res = await getFavoriteList(params)
            setTableData(res?.entries || [])
            setTotal(res?.total_count || 0)
        } catch (error) {
            formatError(error)
        } finally {
            setFetching(false)
            setLoading(false)
        }
    }

    // 取消收藏
    const handleCancelFavorite = async (record: IFavoriteItem) => {
        try {
            await deleteFavorite(record.id)
            getTableList({ ...searchConditionRef.current })
            message.success('取消收藏成功')
        } catch (error) {
            formatError(error)
        }
    }

    // 表格操作事件
    const handleOptionTable = (key: string, record) => {
        setOperateItem(record)
        switch (key) {
            case FavoriteOperate.Details:
                // 如果资源已下线，不允许查看详情（只有 ONLINE 状态才允许）
                if (record?.is_online !== true) {
                    return
                }
                if (menu === ResType.InfoCatalog) {
                    setInfoCatalogVisible(true)
                } else if (menu === ResType.DataCatalog) {
                    setDataCatalogVisible(true)
                } else if (menu === ResType.ElecLicenceCatalog) {
                    setElecLicenceCatalogVisible(true)
                } else if (menu === ResType.InterfaceSvc) {
                    setInterfaceSvcVisible(true)
                } else if (menu === ResType.DataView) {
                    setLogicViewVisible(true)
                }
                break

            case FavoriteOperate.CancelFavorite:
                handleCancelFavorite(record)
                break

            default:
                break
        }
    }

    // 表格操作项
    const getTableOptions = (record?: IFavoriteItem) => {
        // 判断资源是否在线：只有 ONLINE 状态才允许查看详情
        const isOnline = record?.is_online === true
        const allOptionMenus = [
            {
                key: FavoriteOperate.Details,
                label: __('详情'),
                menuType: OptionMenuType.Menu,
                disabled: !isOnline,
                title: !isOnline ? __('资源已下线，无法查看详情') : '',
            },
            {
                key: FavoriteOperate.CancelFavorite,
                label: __('取消收藏'),
                menuType: OptionMenuType.Menu,
            },
        ]

        // 根据 optionKeys 过滤出对应的 optionMenus
        const optionMenus = allOptionMenus.filter((i) =>
            FavoriteTabMap[menu].actionMap.includes(i.key),
        )

        return optionMenus
    }

    const columns: any = useMemo(() => {
        const cols = [
            {
                title: (
                    <MultiHeader
                        mainTitle={FavoriteTabMap[menu].name}
                        subTitle={__('（编码）')}
                    />
                ),
                dataIndex: 'res_name',
                key: 'res_name',
                width: 300,
                ellipsis: true,
                render: (value, record) => (
                    <MultiColumn
                        menu={menu}
                        record={record}
                        onClick={() =>
                            handleOptionTable(FavoriteOperate.Details, record)
                        }
                    />
                ),
            },
            {
                title: FavoriteTabMap[menu]?.columnTitle?.res_type || '',
                dataIndex: 'res_type',
                key: 'res_type',
                width: 200,
                render: (value, record) => {
                    return <ResourceTypeView record={record} />
                },
            },
            {
                title: __('所属业务对象'),
                dataIndex: 'subjects',
                key: 'subjects',
                ellipsis: true,
                render: (value, record) => {
                    return <SubjectView record={record} />
                },
            },
            {
                title: FavoriteTabMap[menu]?.columnTitle?.org_name || '',
                dataIndex: 'org_name',
                key: 'org_name',
                ellipsis: true,
                render: (value, record) => {
                    return value ? (
                        <span title={record?.org_path}>{value}</span>
                    ) : (
                        '--'
                    )
                },
            },
            {
                title: __('综合评分'),
                dataIndex: 'score',
                key: 'score',
                width: 200,
                render: (value, record) => {
                    return (
                        <span className={styles.score}>
                            {value ? __('${value} 分', { value }) : '--'}
                        </span>
                    )
                },
            },
            {
                title: __('上线时间'),
                dataIndex: 'online_at',
                key: 'online_at',
                width: 200,
                ellipsis: true,
                render: (val: number) => (val ? formatTime(val) : '--'),
            },
            {
                title: __('操作'),
                key: 'action',
                width: FavoriteTabMap[menu].actionWidth,
                fixed: 'right',
                render: (_, record) => {
                    return (
                        <OptionBarTool
                            menus={getTableOptions(record) as any[]}
                            onClick={(key, e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleOptionTable(key, record)
                            }}
                        />
                    )
                },
            },
        ]
        return cols.filter((col) =>
            FavoriteTabMap[menu].columnKeys.includes(col.key),
        )
    }, [menu])

    // 关键字搜索
    const handleKwSearch = (kw) => {
        if (kw === searchCondition?.keyword) return
        setSearchCondition({
            ...searchCondition,
            keyword: kw,
            offset: 1,
        } as IGetFavoriteListParams)
    }

    // 刷新
    const handleRefresh = (refresh: boolean = true) => {
        setSearchCondition({
            ...searchCondition,
            offset: refresh ? 1 : searchCondition?.offset,
        } as IGetFavoriteListParams)
    }

    // 分页改变
    const onPaginationChange = (page, pageSize) => {
        setSearchCondition({
            ...searchCondition,
            offset: page || 1,
            limit: pageSize,
        } as IGetFavoriteListParams)
    }

    // 关闭信息资源目录详情弹窗
    const handleCloseDataCatalog = () => {
        handleDetailClose()
        setDataCatalogVisible(false)
    }

    // 关闭信息资源目录详情弹窗
    const handleCloseInfoCatalog = () => {
        handleDetailClose()
        setInfoCatalogVisible(false)
    }

    // 关闭电子证照详情弹窗
    const handleCloseElecLicenceCatalog = () => {
        handleDetailClose()
        setElecLicenceCatalogVisible(false)
    }

    // 关闭详情弹窗
    const handleDetailClose = () => {
        getTableList({ ...searchConditionRef.current })
        setOperateItem(undefined)
    }

    // 顶部左侧操作
    const leftOperate = (
        <div className={styles.topLeft}>{FavoriteTabMap[menu].title}</div>
    )

    // 顶部右侧操作
    const rightOperate = (tableData.length > 0 || isSearchStatus) && (
        <div className={styles.topRight}>
            <Space size={8}>
                <SearchInput
                    value={searchCondition?.keyword}
                    style={{ width: 280 }}
                    placeholder={FavoriteTabMap[menu].searchPlaceholder}
                    onKeyChange={(kw: string) => {
                        handleKwSearch(kw)
                    }}
                    onPressEnter={(
                        e: React.KeyboardEvent<HTMLInputElement>,
                    ) => {
                        handleKwSearch(trim(e.currentTarget.value))
                    }}
                />
                <RefreshBtn onClick={handleRefresh} />
            </Space>
        </div>
    )

    return (
        <div className={styles.favoriteContent}>
            {loading ? (
                renderLoader()
            ) : (
                <>
                    <div className={styles.favoriteOperation}>
                        {leftOperate}
                        {rightOperate}
                    </div>

                    {tableData.length === 0 && !isSearchStatus ? (
                        renderEmpty()
                    ) : (
                        <Table
                            columns={columns}
                            dataSource={tableData}
                            loading={fetching}
                            rowKey="id"
                            rowClassName={styles.tableRow}
                            scroll={{
                                x: columns.length * 180,
                                y: 'calc(100vh - 321px)',
                            }}
                            pagination={{
                                total,
                                pageSize: searchCondition?.limit,
                                current: searchCondition?.offset,
                                showQuickJumper: true,
                                onChange: (page, pageSize) =>
                                    onPaginationChange(page, pageSize),
                                showSizeChanger: true,
                                showTotal: (count) =>
                                    __('共${count}条', { count }),
                            }}
                            locale={{ emptyText: <Empty /> }}
                        />
                    )}
                </>
            )}

            {dataCatalogVisible && (
                <DataCatlgContent
                    open={dataCatalogVisible}
                    onClose={handleCloseDataCatalog}
                    assetsId={operateItem?.res_id || ''}
                />
            )}

            {infoCatalogVisible && (
                <InfoCatlgDetails
                    open={infoCatalogVisible}
                    onClose={handleCloseInfoCatalog}
                    catalogId={operateItem?.res_id || ''}
                    name={operateItem?.res_name || ''}
                />
            )}

            {interfaceSvcVisible && (
                <ApplicationServiceDetail
                    open={interfaceSvcVisible}
                    onClose={(params) => {
                        // cancelFavorite(params || {})
                        setInterfaceSvcVisible(false)
                    }}
                    serviceCode={operateItem?.res_id || ''}
                    isIntroduced={false}
                    hasAsst
                />
            )}
            {logicViewVisible && (
                <LogicViewDetail
                    open={logicViewVisible}
                    onClose={() => {
                        setLogicViewVisible(false)
                    }}
                    id={operateItem?.res_id}
                    showDataConsanguinity={false}
                />
            )}
        </div>
    )
}

export default FavoriteTable
