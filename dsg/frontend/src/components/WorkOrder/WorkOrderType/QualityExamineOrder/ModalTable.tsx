import { Button, Popover, Space, Table, Tooltip } from 'antd'
import { UpOutlined, DownOutlined } from '@ant-design/icons'
import React, { useEffect, useMemo, useState, useRef } from 'react'
import classnames from 'classnames'
import { useAntdTable } from 'ahooks'
import __ from './locale'
import styles from './styles.module.less'
import { FixedType } from '@/components/CommonTable/const'
import { getDepartName } from '../../WorkOrderProcessing/helper'
import { DataViewProvider } from '@/components/DatasheetView/DataViewProvider'
import QualityConfigModal from './QualityConfigModal'
import { Empty, SearchInput } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import { stateType } from '@/components/DatasheetView/const'
import {
    formatError,
    getDatasheetView,
    getFormViewBasicByIds,
    SortDirection,
} from '@/core'
import { RefreshBtn } from '@/components/ToolbarComponents'
import { DataColoredBaseIcon } from '@/core/dataSource'

/**
 * 检测模型表单
 */
const ModalTable = ({ readOnly, workOrderTitle, dataSourceInfo }: any) => {
    const dbsRef = useRef<HTMLDivElement>(null)
    const [isDataSource, setIsDataSource] = useState<boolean>(true)
    const [currentDS, setCurrentDS] = useState<any>()
    const [datasource, setDatasource] = useState<any[]>()
    const [visibleCount, setVisibleCount] = useState<number>(
        dataSourceInfo?.length || 0,
    )
    const [popoverSearchKeyword, setPopoverSearchKeyword] = useState<string>('')
    const [morePopoverVisible, setMorePopoverVisible] = useState<boolean>(false)
    const [condition, setCondition] = useState<any>({
        offset: 1,
        limit: 5,
        keyword: '',
        direction: SortDirection.DESC,
        sort: 'updated_at',
        type: 'datasource',
        include_sub_subject: true,
        // publish_status: 'publish',
    })
    // 存储form_view_ids用于分页请求
    const [formViewIds, setFormViewIds] = useState<string[]>([])
    // 当 isDataSource 为 false 时的分页状态
    const [viewsPagination, setViewsPagination] = useState({
        current: 1,
        pageSize: 5,
        total: 0,
    })

    useEffect(() => {
        if (dataSourceInfo?.length) {
            const curItem = dataSourceInfo?.[0]
            setCurrentDS(curItem)
            const hasViews = !!curItem?.form_view_ids?.length
            setIsDataSource(!hasViews)
            if (hasViews) {
                setFormViewIds(curItem?.form_view_ids || [])
                // 清空之前缓存的基本信息
                setAllViewsBasicInfo([])
                setFilteredViewIds([])
            }
        }
    }, [dataSourceInfo])

    // 计算可见的数据源数量
    useEffect(() => {
        const calculateVisibleCount = () => {
            if (!dbsRef.current || !dataSourceInfo?.length) {
                setVisibleCount(dataSourceInfo?.length || 0)
                return
            }

            const containerWidth = dbsRef.current.offsetWidth
            // 每个item最大宽度120px，gap 8px，更多按钮约40px，留一些边距
            const itemWidth = 120
            const gap = 8
            const moreButtonWidth = 40
            const padding = 16

            let maxVisibleItems = Math.floor(
                (containerWidth - padding - moreButtonWidth) /
                    (itemWidth + gap),
            )
            maxVisibleItems = Math.max(1, maxVisibleItems) // 至少显示1个

            setVisibleCount(Math.min(maxVisibleItems, dataSourceInfo.length))
        }

        calculateVisibleCount()
        window.addEventListener('resize', calculateVisibleCount)
        return () => window.removeEventListener('resize', calculateVisibleCount)
    }, [dataSourceInfo])

    // 计算可见和隐藏的数据源
    const { visibleItems, hiddenItems } = useMemo(() => {
        if (!dataSourceInfo?.length) {
            return { visibleItems: [], hiddenItems: [] }
        }

        const visible = dataSourceInfo.slice(0, visibleCount)
        const hidden = dataSourceInfo.slice(visibleCount)

        // 不在这里过滤 hiddenItems，保持原始数据用于显示"更多"按钮
        return {
            visibleItems: visible,
            hiddenItems: hidden,
        }
    }, [dataSourceInfo, visibleCount])

    // 为 Popover 内容计算过滤后的隐藏项
    const filteredHiddenItems = useMemo(() => {
        if (!hiddenItems?.length) {
            return []
        }

        // 根据 popover 搜索关键字过滤隐藏项
        return popoverSearchKeyword
            ? hiddenItems.filter((item) =>
                  item.datasource_name
                      .toLowerCase()
                      .includes(popoverSearchKeyword.toLowerCase()),
              )
            : hiddenItems
    }, [hiddenItems, popoverSearchKeyword])

    // 当 isDataSource 为 false 时，使用 datasource 数据（已经是分页后的数据）
    const displayDatasource = useMemo(() => {
        if (isDataSource) {
            return []
        }
        return datasource || []
    }, [isDataSource, datasource])

    const getDataList = async (params: any) => {
        try {
            const res = await getDatasheetView(params)
            let entries = res.entries || []
            const ids = entries.map((o) => o.id)
            // 如果当前数据源有form_view_ids，则需要组合getFormViewBasicByIds的数据
            if (ids?.length && entries?.length) {
                entries = await combineViewData(entries, ids)
            }

            return { total: res.total_count, list: entries }
        } catch (error) {
            formatError(error)
            return {
                total: 0,
                list: [],
            }
        }
    }

    const { tableProps, run, refresh } = useAntdTable(getDataList, {
        defaultPageSize: 5,
        manual: true,
    })

    const getViewsByIds = async (ids: string[], params: any) => {
        try {
            // 根据分页参数计算需要请求的ID范围
            const { offset = 1, limit = 5 } = params
            const startIndex = (offset - 1) * limit
            const endIndex = startIndex + limit
            const pageIds = ids.slice(startIndex, endIndex)

            // 只请求当前页的ID，直接获取基本信息
            const basicRes = await getFormViewBasicByIds(pageIds)
            const entries = basicRes?.entries || []

            return { total: ids.length, list: entries }
        } catch (error) {
            formatError(error)
            return {
                total: 0,
                list: [],
            }
        }
    }

    // 组合视图数据 - 将getDatasheetView数据与getFormViewBasicByIds数据按id组合
    const combineViewData = async (viewList: any[], ids: string[]) => {
        try {
            const basicRes = await getFormViewBasicByIds(ids)
            const basicDataMap = new Map()

            // 创建基础数据映射，以id为key
            basicRes?.entries?.forEach((item: any) => {
                basicDataMap.set(item.id, item)
            })

            // 组合数据，将基础数据中的字段合并到视图数据中
            return viewList.map((viewItem) => {
                const basicItem = basicDataMap.get(viewItem.id)
                if (basicItem) {
                    return {
                        ...viewItem,
                        // 这里可以添加需要从getFormViewBasicByIds中获取的字段
                        // 例如：business_name, description 等字段
                        ...basicItem,
                    }
                }
                return viewItem
            })
        } catch (error) {
            formatError(error)
            return viewList
        }
    }

    useEffect(() => {
        if (currentDS) {
            const datasource_id = currentDS?.datasource_id
            if (!currentDS?.form_view_ids?.length) {
                const params = {
                    ...condition,
                    offset: 1,
                    datasource_id,
                }
                setCondition(params)
                run(params)
            } else {
                // 使用分页请求视图数据
                loadViewsByPage(currentDS?.form_view_ids, {
                    offset: 1,
                    limit: 5,
                })
            }
        }
    }, [currentDS])

    // 存储所有视图的基本信息用于搜索
    const [allViewsBasicInfo, setAllViewsBasicInfo] = useState<any[]>([])
    const [filteredViewIds, setFilteredViewIds] = useState<string[]>([])

    // 加载所有视图的基本信息（用于搜索过滤）
    const loadAllViewsBasicInfo = async (ids: string[]) => {
        try {
            const basicRes = await getFormViewBasicByIds(ids)
            const entries = basicRes?.entries || []
            setAllViewsBasicInfo(entries)
            return entries
        } catch (error) {
            formatError(error)
            return []
        }
    }

    // 分页加载视图数据
    const loadViewsByPage = async (
        ids: string[],
        params: { offset: number; limit: number; keyword?: string },
    ) => {
        try {
            let targetIds = ids

            // 如果有关键字搜索，需要先获取所有基本信息进行过滤
            if (params.keyword?.trim()) {
                const keyword = params.keyword.toLowerCase().trim()

                // 如果还没有加载所有基本信息，先加载
                let allInfo = allViewsBasicInfo
                if (allInfo.length === 0 || allInfo.length !== ids.length) {
                    allInfo = await loadAllViewsBasicInfo(ids)
                }

                // 过滤出匹配的ID
                const matchedIds = allInfo
                    .filter((item) => {
                        const businessName =
                            item.business_name?.toLowerCase() || ''
                        const technicalName =
                            item.technical_name?.toLowerCase() || ''
                        return (
                            businessName.includes(keyword) ||
                            technicalName.includes(keyword)
                        )
                    })
                    .map((item) => item.id)

                targetIds = matchedIds
                setFilteredViewIds(matchedIds)
            } else {
                setFilteredViewIds(ids)
            }

            const result = await getViewsByIds(targetIds, params)
            setDatasource(result.list || [])
            setViewsPagination({
                current: params.offset,
                pageSize: params.limit,
                total: result.total,
            })
        } catch (error) {
            formatError(error)
            setDatasource([])
            setViewsPagination({
                current: params.offset,
                pageSize: params.limit,
                total: 0,
            })
        }
    }

    // 当前选中的库表
    const [currentView, setCurrentView] = useState<any>()

    const handleConfig = (record: any) => {
        setCurrentView(record)
    }

    const columns = [
        {
            title: (
                <div>
                    <span>{__('库表业务名称')}</span>
                    <span
                        style={{
                            color: 'rgba(0,0,0,0.45)',
                            fontWeight: 'normal',
                        }}
                    >
                        {__('（编码）')}
                    </span>
                </div>
            ),
            dataIndex: 'business_name',
            key: 'business_name',
            ellipsis: true,
            width: 200,
            render: (text, record) => (
                <div className={styles.twoLine}>
                    <div className={styles.firstLine}>
                        <span className={styles.name} title={text}>
                            {text || '--'}
                        </span>
                        {record?.status === stateType.delete && (
                            <span className={styles.delTag}>
                                {__('已删除')}
                            </span>
                        )}
                    </div>
                    <div
                        className={styles.secondLine}
                        title={record?.uniform_catalog_code}
                    >
                        {record?.uniform_catalog_code || '--'}
                    </div>
                </div>
            ),
        },
        {
            title: __('库表技术名称'),
            dataIndex: 'technical_name',
            key: 'technical_name',
            ellipsis: true,
            width: 180,
            render: (text, record) => text || '--',
        },
        {
            title: __('数据来源'),
            dataIndex: 'datasource_name',
            key: 'datasource_name',
            width: 180,
            ellipsis: true,
            render: (text, record) => text || '--',
        },
        {
            title: __('所属部门'),
            dataIndex: 'department_path',
            key: 'department_path',
            width: 180,
            ellipsis: true,
            render: (text, record) => (
                <span title={text}>{getDepartName(text) || '--'}</span>
            ),
        },
        {
            title: __('检测规则'),
            dataIndex: 'is_audit_rule_configured',
            key: 'is_audit_rule_configured',
            width: 120,
            ellipsis: true,
            render: (text, record) => (
                <span
                    className={classnames({
                        [styles.unConfig]: !text,
                    })}
                >
                    {text ? __('已配置') : __('未配置')}
                </span>
            ),
        },
        {
            title: __('操作'),
            key: 'action',
            width: readOnly ? 120 : 170,
            fixed: FixedType.RIGHT,
            render: (_, record) => {
                return readOnly ? (
                    <Tooltip
                        title={
                            record?.is_audit_rule_configured
                                ? ''
                                : __('规则未配置，无法查看')
                        }
                    >
                        <Button
                            type="link"
                            onClick={() => handleConfig(record)}
                            disabled={!record?.is_audit_rule_configured}
                        >
                            {__('查看规则配置')}
                        </Button>
                    </Tooltip>
                ) : (
                    <Space size={16}>
                        <Button
                            type="link"
                            onClick={() => handleConfig(record)}
                        >
                            {__('配置检测规则')}
                        </Button>
                    </Space>
                )
            },
        },
    ]

    const handleRefresh = () => {
        if (isDataSource) {
            refresh()
        } else {
            loadViewsByPage(formViewIds, {
                offset: viewsPagination.current,
                limit: viewsPagination.pageSize,
                keyword: condition.keyword,
            })
        }
    }

    return (
        <DataViewProvider>
            <>
                <div className={styles.tableHeader}>
                    <div
                        hidden={!dataSourceInfo?.length}
                        style={{ minWidth: '74px' }}
                    >
                        数据源筛选:
                    </div>
                    <div ref={dbsRef} className={styles.dbs}>
                        {visibleItems?.map((it) => (
                            <div
                                className={classnames(
                                    styles.dbItem,
                                    currentDS?.datasource_id ===
                                        it?.datasource_id && styles.active,
                                )}
                                key={it?.datasource_id}
                                onClick={() => {
                                    setCurrentDS(it)
                                    const hasViews = !!it?.form_view_ids?.length
                                    const newIsDataSource = !hasViews
                                    setIsDataSource(newIsDataSource)
                                    // 切换到视图ID分页时重置分页状态
                                    if (!newIsDataSource) {
                                        setFormViewIds(it?.form_view_ids || [])
                                        setViewsPagination({
                                            current: 1,
                                            pageSize: 5,
                                            total: 0,
                                        })
                                        // 清空之前缓存的基本信息
                                        setAllViewsBasicInfo([])
                                        setFilteredViewIds([])
                                    }
                                }}
                                title={it?.datasource_name}
                            >
                                <DataColoredBaseIcon
                                    type={it?.datasource_type}
                                    iconType="Colored"
                                    style={{
                                        fontSize: 14,
                                        marginRight: 8,
                                        flexShrink: 0,
                                    }}
                                />
                                <span
                                    style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {it?.datasource_name}
                                </span>
                            </div>
                        ))}
                        {hiddenItems?.length > 0 && (
                            <Popover
                                placement="bottomRight"
                                trigger="click"
                                overlayClassName={styles.popDB}
                                showArrow={false}
                                open={morePopoverVisible}
                                onOpenChange={(visible) =>
                                    setMorePopoverVisible(visible)
                                }
                                content={
                                    <div
                                        style={{
                                            maxWidth: 300,
                                            maxHeight: 300,
                                            overflowY: 'auto',
                                        }}
                                    >
                                        {/* 搜索框 */}
                                        <div
                                            style={{
                                                padding: '8px',
                                                position: 'sticky',
                                                top: 0,
                                                zIndex: 1,
                                                background: 'white',
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <SearchInput
                                                placeholder="搜索数据源"
                                                value={popoverSearchKeyword}
                                                onKeyChange={(key) =>
                                                    setPopoverSearchKeyword(key)
                                                }
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                                onFocus={(e) =>
                                                    e.stopPropagation()
                                                }
                                                style={{
                                                    width: '100%',
                                                }}
                                            />
                                        </div>
                                        {/* 数据源列表 */}
                                        <div style={{ padding: '4px 0' }}>
                                            {filteredHiddenItems?.length > 0 ? (
                                                filteredHiddenItems?.map(
                                                    (it) => (
                                                        <div
                                                            className={classnames(
                                                                styles.dbItem,
                                                                currentDS?.datasource_id ===
                                                                    it?.datasource_id &&
                                                                    styles.active,
                                                                styles.popoverItem,
                                                            )}
                                                            key={
                                                                it?.datasource_id
                                                            }
                                                            onClick={() => {
                                                                setCurrentDS(it)
                                                                const hasViews =
                                                                    !!it
                                                                        ?.form_view_ids
                                                                        ?.length
                                                                const newIsDataSource =
                                                                    !hasViews
                                                                setIsDataSource(
                                                                    newIsDataSource,
                                                                )
                                                                // 切换到视图ID分页时重置分页状态
                                                                if (
                                                                    !newIsDataSource
                                                                ) {
                                                                    setFormViewIds(
                                                                        it?.form_view_ids ||
                                                                            [],
                                                                    )
                                                                    setViewsPagination(
                                                                        {
                                                                            current: 1,
                                                                            pageSize: 5,
                                                                            total: 0,
                                                                        },
                                                                    )
                                                                    // 清空之前缓存的基本信息
                                                                    setAllViewsBasicInfo(
                                                                        [],
                                                                    )
                                                                    setFilteredViewIds(
                                                                        [],
                                                                    )
                                                                }
                                                                // 关闭 Popover
                                                                setMorePopoverVisible(
                                                                    false,
                                                                )
                                                            }}
                                                            title={
                                                                it?.datasource_name
                                                            }
                                                            style={{
                                                                margin: '4px 0',
                                                            }}
                                                        >
                                                            <DataColoredBaseIcon
                                                                type={
                                                                    it?.datasource_type
                                                                }
                                                                iconType="Colored"
                                                                style={{
                                                                    fontSize: 14,
                                                                    marginRight: 8,
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                            <span
                                                                style={{
                                                                    overflow:
                                                                        'hidden',
                                                                    textOverflow:
                                                                        'ellipsis',
                                                                }}
                                                            >
                                                                {
                                                                    it?.datasource_name
                                                                }
                                                            </span>
                                                        </div>
                                                    ),
                                                )
                                            ) : popoverSearchKeyword ? (
                                                <div
                                                    style={{
                                                        padding: '20px',
                                                        textAlign: 'center',
                                                        color: 'rgba(0,0,0,0.45)',
                                                        fontSize: '12px',
                                                    }}
                                                >
                                                    无搜索结果
                                                </div>
                                            ) : (
                                                <div
                                                    style={{
                                                        padding: '20px',
                                                        textAlign: 'center',
                                                        color: 'rgba(0,0,0,0.45)',
                                                        fontSize: '12px',
                                                    }}
                                                >
                                                    暂无更多数据源
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                }
                            >
                                <div
                                    className={classnames(
                                        styles.dbItem,
                                        styles.moreButton,
                                        morePopoverVisible && styles.active,
                                    )}
                                >
                                    <span>更多</span>
                                    {morePopoverVisible ? (
                                        <UpOutlined />
                                    ) : (
                                        <DownOutlined />
                                    )}
                                </div>
                            </Popover>
                        )}
                    </div>
                    <div
                        className={styles.search}
                        style={{ minWidth: '260px' }}
                    >
                        <SearchInput
                            placeholder="搜索库表业务名称、技术名称"
                            width={240}
                            onKeyChange={(keyword) => {
                                setCondition((prev) => ({
                                    ...prev,
                                    keyword,
                                }))
                                if (isDataSource) {
                                    const params = {
                                        ...condition,
                                        keyword,
                                        offset: 1,
                                    }
                                    run(params)
                                } else {
                                    // 服务端搜索时重置到第一页
                                    loadViewsByPage(formViewIds, {
                                        offset: 1,
                                        limit: viewsPagination.pageSize,
                                        keyword,
                                    })
                                }
                            }}
                        />

                        <RefreshBtn
                            onClick={() => {
                                run(condition)
                            }}
                        />
                    </div>
                </div>
                <Table
                    columns={columns}
                    rowClassName={styles['modal-table-row']}
                    rowKey="id"
                    {...(isDataSource
                        ? tableProps
                        : { dataSource: displayDatasource })}
                    locale={{
                        emptyText: condition?.keyword ? (
                            <Empty />
                        ) : (
                            <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                        ),
                    }}
                    scroll={{ x: '100%' }}
                    pagination={
                        isDataSource
                            ? {
                                  ...tableProps.pagination,
                                  showQuickJumper: true,
                                  showSizeChanger: true,
                                  current: condition.offset,
                                  pageSize: condition.limit,
                                  pageSizeOptions: [5, 10, 20, 50],
                                  showTotal: (count) =>
                                      __('共${count}条', { count }),
                              }
                            : {
                                  current: viewsPagination.current,
                                  pageSize: viewsPagination.pageSize,
                                  total: viewsPagination.total,
                                  showSizeChanger: true,
                                  showQuickJumper: true,
                                  pageSizeOptions: [5, 10, 20, 50],
                                  showTotal: (count) =>
                                      __('共${count}条', { count }),
                              }
                    }
                    bordered={false}
                    onChange={(newPagination, filters, sorter) => {
                        if (isDataSource) {
                            // 服务端分页处理
                            setCondition((per) => ({
                                ...per,
                                offset: newPagination?.current || 1,
                                limit: newPagination?.pageSize || 10,
                            }))
                            run({
                                ...condition,
                                offset: newPagination?.current || 1,
                                limit: newPagination?.pageSize || 10,
                            })
                        } else {
                            // 视图ID分页处理
                            loadViewsByPage(formViewIds, {
                                offset: newPagination?.current || 1,
                                limit: newPagination?.pageSize || 5,
                                keyword: condition.keyword,
                            })
                        }
                    }}
                />
            </>
            {currentView && (
                <QualityConfigModal
                    workOrderTitle={workOrderTitle}
                    readOnly={readOnly}
                    viewData={currentView}
                    open={!!currentView}
                    onClose={(needRefresh) => {
                        if (!readOnly && needRefresh) {
                            handleRefresh()
                        }
                        setCurrentView(undefined)
                    }}
                />
            )}
        </DataViewProvider>
    )
}

export default ModalTable
