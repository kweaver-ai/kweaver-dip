import classNames from 'classnames'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Space, Table, Tabs, Tooltip } from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import { DownloadOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { useUpdateEffect } from 'ahooks'
import { noop } from 'lodash'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import styles from './styles.module.less'
import __ from '../locale'
import { Empty, LightweightSearch, SearchInput } from '@/ui'
import { SearchType } from '@/ui/LightweightSearch/const'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import DropDownFilter from '@/components/DropDownFilter'
import { InitSearchCondition, placeHolderMap, TabList } from './const'
import {
    downloadApiDoc,
    formatError,
    getDataCatalogFileList,
    getDatasheetView,
    getRescCatlgList,
    queryServiceOverviewList,
    SortDirection,
} from '@/core'
import DataCatlgContent from '@/components/DataAssetsCatlg/DataCatlgContent'
import { ResTypeEnum } from '../const'
import MultiInfo from '../Components/MultiInfo'
import { formatTime, getActualUrl, streamToFile } from '@/utils'
import OrgAndDepartmentFilterTree from '../../OrgAndDepartmentFilterTree'
import { Architecture } from '@/components/BusinessArchitecture/const'
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'
import ApplicationServiceDetail from '@/components/DataAssetsCatlg/ApplicationServiceDetail'
import FileDetail from '@/components/DataAssetsCatlg/FileInfoDetail'
import { FontIcon } from '@/icons'

const OriginSelectComponent: React.FC<{
    value?: any
    onChange?: (value: any) => void
}> = ({ onChange = noop, value }) => {
    return (
        <OrgAndDepartmentFilterTree
            getSelectedNode={(sn) => {
                onChange(sn.id)
            }}
            filterType={[
                Architecture.ORGANIZATION,
                Architecture.DEPARTMENT,
            ].join()}
            isCurrentDept
        />
    )
}

const ResForDep = () => {
    const [activeTab, setActiveTab] = useState(TabList[0].key)
    const [searchCondition, setSearchCondition] = useState(
        InitSearchCondition[activeTab],
    )
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder | undefined
    }>({
        online_time: 'descend',
    })
    const { checkPermission } = useUserPermCtx()

    // 是否拥有管理目录权限
    const hasDataOperRole = useMemo(() => {
        return checkPermission('manageResourceCatalog') ?? false
    }, [checkPermission])

    const dataViewDefaultSort = useMemo(() => {
        return [ResTypeEnum.View].includes(activeTab)
            ? {
                  key: 'publish_at',
                  sort: SortDirection.DESC,
              }
            : activeTab === ResTypeEnum.Api
            ? {
                  key: 'online_time',
                  sort: SortDirection.DESC,
              }
            : activeTab === ResTypeEnum.File
            ? { key: 'published_at', sort: SortDirection.DESC }
            : {
                  key: 'online_time',
                  sort: SortDirection.DESC,
              }
    }, [activeTab])
    const [selectedSort, setSelectedSort] = useState<any>(dataViewDefaultSort)
    const searchValue = useRef('')
    const [catalogCardOpen, setCatalogCardOpen] = useState<boolean>(false)
    const [operateItem, setOperateItem] = useState<any>(null)
    const [viewShareInfoOpen, setViewShareInfoOpen] = useState<boolean>(false)
    const [tableData, setTableData] = useState<any[]>([])
    const [total, setTotal] = useState<number>(0)
    const [scrollY, setScrollY] = useState<string>(`calc(100vh - 327px)`)
    const [loginViewOpen, setLoginViewOpen] = useState(false)
    const [logicViewId, setLoginViewId] = useState<string>('')
    const [applicationServiceOpen, setApplicationServiceOpen] = useState(false)
    const [fileDetailOpen, setFileDetailOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedApiIds, setSelectedApiIds] = useState<string[]>([])

    const dataSortViewMenus = useMemo(() => {
        const commonItem = [
            {
                key: 'name',
                label:
                    activeTab === ResTypeEnum.Catalog
                        ? __('按目录名称排序')
                        : activeTab === ResTypeEnum.View
                        ? __('按表技术名称排序')
                        : activeTab === ResTypeEnum.File
                        ? __('按文件名称排序')
                        : __('按接口名称排序'),
            },
        ]

        const publishTimeItem = {
            key: 'publish_at',
            label: __('按发布时间排序'),
        }
        const onlineTimeItem = {
            key: 'online_time',
            label: __('按上线时间排序'),
        }
        return activeTab === ResTypeEnum.Catalog
            ? [
                  ...commonItem,
                  {
                      key: 'apply_num',
                      label: __('按申请次数排序'),
                  },
                  onlineTimeItem,
                  publishTimeItem,
              ]
            : activeTab === ResTypeEnum.View
            ? [...commonItem, publishTimeItem]
            : activeTab === ResTypeEnum.File
            ? [
                  ...commonItem,
                  {
                      key: 'published_at',
                      label: __('按发布时间排序'),
                  },
              ]
            : activeTab === ResTypeEnum.Api
            ? [...commonItem, onlineTimeItem]
            : commonItem
    }, [activeTab])

    const getTableData = async () => {
        try {
            setLoading(true)
            setTableData([])
            const action =
                activeTab === ResTypeEnum.Catalog
                    ? getRescCatlgList
                    : activeTab === ResTypeEnum.View
                    ? getDatasheetView
                    : activeTab === ResTypeEnum.Api
                    ? queryServiceOverviewList
                    : getDataCatalogFileList
            const res = await action({
                ...InitSearchCondition[activeTab],
                ...searchCondition,
            } as any)
            setTableData(res?.entries || [])
            setTotal(res?.total_count || 0)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
            setSelectedSort(undefined)
        }
    }

    useEffect(() => {
        getTableData()
    }, [])

    useUpdateEffect(() => {
        getTableData()
    }, [searchCondition])

    useUpdateEffect(() => {
        setSelectedSort(dataViewDefaultSort)
        setTableSort(
            activeTab === ResTypeEnum.View
                ? { publish_at: 'descend' }
                : activeTab === ResTypeEnum.Api
                ? { online_time: 'descend' }
                : activeTab === ResTypeEnum.File
                ? { published_at: 'descend' }
                : { online_time: 'descend' },
        )
        setSearchCondition(InitSearchCondition[activeTab])
    }, [activeTab])

    /** 筛选项 */
    const filterItems = useMemo(() => {
        return [
            {
                label:
                    activeTab === ResTypeEnum.Catalog
                        ? __('目录提供方')
                        : __('所属部门'),
                key: 'department_id',
                options: [],
                type: SearchType.Customer,
                Component: OriginSelectComponent as React.ComponentType<{
                    value?: any
                    onChange: (value: any) => void
                }>,
            },
        ]
    }, [activeTab])

    const searchChange = (searchParam, key) => {
        if (!key) {
            // 重置
            setSearchCondition((prev) => ({
                ...prev,
                offset: 1,
                ...searchParam,
            }))
        } else if (searchParam[key]) {
            setSearchCondition((prev) => ({
                ...prev,
                offset: 1,
                [key]: searchParam[key],
            }))
        } else {
            setSearchCondition((prev) => ({
                ...prev,
                offset: 1,
                [key]: undefined,
            }))
        }
    }

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition({
            ...searchCondition,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            offset: 1,
        })
        setSelectedSort(selectedMenu)
        onChangeMenuToTableSort(selectedMenu)
    }

    const onChangeMenuToTableSort = (selectedMenu) => {
        setTableSort({
            [selectedMenu.key]:
                selectedMenu.sort === SortDirection.ASC ? 'ascend' : 'descend',
        })
    }

    // 分页改变
    const onPaginationChange = (page, pageSize) => {
        setSearchCondition((prev) => ({
            ...prev,
            offset: page,
            limit: pageSize,
        }))
    }

    const columns: any = useMemo(() => {
        const catalogCol = {
            title: __('所属目录'),
            dataIndex: 'data_catalog_name',
            key: 'data_catalog_name',
            render: (text, record) => (
                <div className={styles['catalog-info-container']}>
                    <div
                        className={classNames(
                            record.data_catalog_name && styles['catalog-name'],
                            !hasDataOperRole && styles['catalog-name-disabled'],
                        )}
                        title={
                            hasDataOperRole
                                ? record.data_catalog_name
                                : '暂未上线，无法查看'
                        }
                        onClick={() => {
                            if (!record.data_catalog_name || !hasDataOperRole)
                                return
                            setCatalogCardOpen(true)
                            setOperateItem(record)
                        }}
                    >
                        {record.data_catalog_name || '--'}
                    </div>
                </div>
            ),
        }

        const catalogProviderCol = {
            title: __('目录提供方'),
            dataIndex: 'catalog_provider',
            key: 'catalog_provider',
            ellipsis: true,
            render: (catalogProvider, record) => {
                if ([ResTypeEnum.View, ResTypeEnum.Api].includes(activeTab)) {
                    if (!catalogProvider) return '--'
                    const department = catalogProvider?.split('/').pop() || '--'
                    return <span title={catalogProvider}>{department}</span>
                }

                if ([ResTypeEnum.File].includes(activeTab)) {
                    if (!record.catalog_provider_path) return '--'
                    const department =
                        record.catalog_provider_path?.split('/').pop() || '--'
                    return (
                        <span title={record.catalog_provider_path}>
                            {department}
                        </span>
                    )
                }

                if ([ResTypeEnum.Catalog].includes(activeTab)) {
                    return (
                        <span title={record.department_path}>
                            {record.department}
                        </span>
                    )
                }

                return '--'
            },
        }

        const onlineTimeCol = {
            title: __('上线时间'),
            dataIndex: 'online_time',
            key: 'online_time',
            sorter: true,
            sortOrder: tableSort.online_time,
            showSorterTooltip: false,
            sortDirections: ['descend', 'ascend', 'descend'],
            render: (text: any) =>
                text
                    ? typeof text === 'string'
                        ? text
                        : formatTime(text, 'YYYY-MM-DD HH:mm:ss')
                    : '--',
        }

        const applyCountOrder =
            activeTab === ResTypeEnum.View
                ? {}
                : {
                      sorter: true,
                      sortOrder: tableSort.apply_num,
                      showSorterTooltip: false,
                      sortDirections: ['descend', 'ascend', 'descend'],
                  }
        const applyCountCol = {
            title: (
                <div>
                    {__('申请次数')}
                    <Tooltip title={__('统计共享申请的申请次数')}>
                        <QuestionCircleOutlined
                            className={styles['info-icon']}
                        />
                    </Tooltip>
                </div>
            ),
            dataIndex: 'apply_num',
            key: 'apply_num',
            ...applyCountOrder,
        }

        const publishTimeCol = {
            title: __('发布时间'),
            dataIndex: 'publish_at',
            key: 'publish_at',
            sorter: true,
            sortOrder: tableSort.publish_at,
            showSorterTooltip: false,
            sortDirections: ['descend', 'ascend', 'descend'],
            width: 200,
            render: (text: any) => formatTime(text, 'YYYY-MM-DD HH:mm:ss'),
        }

        const catalogColumns = [
            {
                title: (
                    <div>
                        <span>{__('目录名称')}</span>
                        <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                            {__('（编码）')}
                        </span>
                    </div>
                ),
                dataIndex: 'name',
                key: 'name',
                sorter: true,
                sortOrder: tableSort.name,
                showSorterTooltip: false,
                sortDirections: ['descend', 'ascend', 'descend'],
                width: 240,
                render: (text, record) => (
                    <MultiInfo
                        name={record.name}
                        code={record.code}
                        iconName="icon-shujumuluguanli1"
                        onClick={() => {
                            setCatalogCardOpen(true)
                            setOperateItem(record)
                        }}
                    />
                ),
                ellipsis: true,
            },
            catalogProviderCol,
            applyCountCol,
            {
                title: (
                    <div>
                        {__('申请部门数')}
                        <Tooltip title={__('统计共享申请的部门数')}>
                            <QuestionCircleOutlined
                                className={styles['info-icon']}
                            />
                        </Tooltip>
                    </div>
                ),
                dataIndex: 'apply_department_num',
                key: 'apply_department_num',
            },
            {
                title: __('收藏次数'),
                dataIndex: 'favorites_num',
                key: 'favorites_num',
            },
            onlineTimeCol,
            {
                title: __('操作'),
                dataIndex: 'operation',
                key: 'operation',
                width: 80,
                render: (text, record) => (
                    <Button
                        type="link"
                        onClick={() => {
                            setCatalogCardOpen(true)
                            setOperateItem(record)
                        }}
                    >
                        {__('详情')}
                    </Button>
                ),
            },
        ]

        const viewColumns = [
            {
                title: (
                    <div>
                        <span>{__('表技术名称')}</span>
                        <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                            {__('（编码）')}
                        </span>
                    </div>
                ),
                dataIndex: 'name',
                key: 'name',
                sorter: true,
                sortOrder: tableSort.name,
                showSorterTooltip: false,
                sortDirections: ['descend', 'ascend', 'descend'],
                width: 260,
                render: (text, record) => (
                    <MultiInfo
                        name={record.technical_name}
                        code={record.uniform_catalog_code}
                        iconName="icon-shitusuanzi"
                        onClick={() => {
                            setLoginViewOpen(true)
                            setLoginViewId(record.id)
                        }}
                    />
                ),
                ellipsis: true,
            },
            {
                title: __('表业务名称'),
                dataIndex: 'business_name',
                key: 'business_name',
                width: 200,
                ellipsis: true,
            },
            {
                title: __('所属部门'),
                dataIndex: 'department',
                key: 'department',
                ellipsis: true,
                render: (text, record) => {
                    if (typeof record.department !== 'string') return '--'
                    return (
                        <span title={record.department_path}>
                            {record.department}
                        </span>
                    )
                },
            },
            {
                title: __('字段数量'),
                dataIndex: 'field_count',
                key: 'field_count',
                // sorter: true,
                // sortOrder: tableSort.field_count,
            },
            applyCountCol,
            catalogCol,
            catalogProviderCol,
            publishTimeCol,
            {
                title: __('操作'),
                dataIndex: 'operation',
                key: 'operation',
                width: 80,
                render: (text, record) => (
                    <Button
                        type="link"
                        onClick={() => {
                            setLoginViewOpen(true)
                            setLoginViewId(record.id)
                        }}
                    >
                        {__('详情')}
                    </Button>
                ),
            },
        ]

        const apiColumns = [
            {
                title: (
                    <div>
                        <span>{__('接口名称')}</span>
                        <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                            {__('（编码）')}
                        </span>
                    </div>
                ),
                dataIndex: 'name',
                key: 'name',
                sorter: true,
                sortOrder: tableSort.name,
                showSorterTooltip: false,
                sortDirections: ['descend', 'ascend', 'descend'],
                width: 260,
                render: (text, record) => (
                    <MultiInfo
                        name={record.service_name}
                        code={record.service_code}
                        iconName="icon-jiekoufuwuguanli"
                        onClick={() => {
                            setApplicationServiceOpen(true)
                            setLoginViewId(record.service_id)
                        }}
                    />
                ),
            },
            {
                title: __('接口类型'),
                dataIndex: 'service_type',
                key: 'service_type',
                render: (serviceType, record) =>
                    serviceType === 'service_generate'
                        ? __('生成接口')
                        : __('注册接口'),
            },
            catalogCol,
            catalogProviderCol,
            {
                title: __('所属部门'),
                dataIndex: 'department',
                key: 'department',
                ellipsis: true,
                render: (text, record) => {
                    if (typeof record.department === 'string') return '--'
                    const name =
                        record.department?.name?.split('/').pop() || '--'
                    const path = record.department?.name || ''
                    return <span title={path}>{name}</span>
                },
            },
            {
                title: __('调用次数'),
                dataIndex: 'invoke_num',
                key: 'invoke_num',
            },
            onlineTimeCol,
            {
                title: __('操作'),
                dataIndex: 'operation',
                key: 'operation',
                width: 180,
                render: (text, record) => (
                    <Space>
                        <Button
                            type="link"
                            onClick={() => {
                                setApplicationServiceOpen(true)
                                setLoginViewId(record.service_id)
                            }}
                        >
                            {__('详情')}
                        </Button>
                        {activeTab === ResTypeEnum.Api && (
                            <Button
                                type="link"
                                onClick={() => {
                                    batchDownload([record.service_id])
                                }}
                                disabled={
                                    !['down-auditing', 'online'].includes(
                                        record.status,
                                    )
                                }
                            >
                                {__('下载文档')}
                            </Button>
                        )}
                    </Space>
                ),
            },
        ]

        const fileColumns = [
            {
                title: (
                    <div>
                        <span>{__('文件名称')}</span>
                        <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                            {__('（编码）')}
                        </span>
                    </div>
                ),
                dataIndex: 'name',
                key: 'name',
                sorter: true,
                sortOrder: tableSort.name,
                showSorterTooltip: false,
                sortDirections: ['descend', 'ascend', 'descend'],
                width: 280,
                render: (text, record) => (
                    <MultiInfo
                        name={record.name}
                        code={record.code}
                        iconName="icon-wenjianziyuan"
                        onClick={() => {
                            setFileDetailOpen(true)
                            setLoginViewId(record.id)
                        }}
                    />
                ),
            },
            {
                title: __('所属部门'),
                dataIndex: 'department',
                key: 'department',
                ellipsis: true,
                render: (text, record) => {
                    if (typeof record.department !== 'string') return '--'
                    return (
                        <span title={record.department_path}>
                            {record.department}
                        </span>
                    )
                },
            },
            catalogCol,
            catalogProviderCol,
            {
                title: __('发布时间'),
                dataIndex: 'published_at',
                key: 'published_at',
                sorter: true,
                sortOrder: tableSort.published_at,
                showSorterTooltip: false,
                sortDirections: ['descend', 'ascend', 'descend'],
                width: 200,
                render: (text: any) => formatTime(text, 'YYYY-MM-DD HH:mm:ss'),
            },
            {
                title: __('操作'),
                dataIndex: 'operation',
                key: 'operation',
                width: 80,
                render: (text, record) => (
                    <Button
                        type="link"
                        onClick={() => {
                            setFileDetailOpen(true)
                            setLoginViewId(record.id)
                        }}
                    >
                        {__('详情')}
                    </Button>
                ),
            },
        ]

        return activeTab === ResTypeEnum.Catalog
            ? catalogColumns
            : activeTab === ResTypeEnum.View
            ? viewColumns
            : activeTab === ResTypeEnum.Api
            ? apiColumns
            : fileColumns
    }, [activeTab, tableSort, selectedSort])

    const handleTableChange = (sorter) => {
        if (sorter.column) {
            setTableSort({
                [sorter.columnKey]: sorter.order || 'ascend',
            })
            return {
                key: sorter.columnKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }

        setTableSort({
            [sorter.columnKey]:
                searchCondition.direction === SortDirection.ASC
                    ? 'descend'
                    : 'ascend',
        })

        return {
            key: searchCondition.sort,
            sort:
                searchCondition.direction === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC,
        }
    }

    const onTableChange = (currentPagination, filters, sorter, extra) => {
        if (extra.action === 'sort' && !!sorter.column) {
            const selectedMenu = handleTableChange(sorter)
            setSelectedSort(selectedMenu)
            setSearchCondition((prev) => ({
                ...prev,
                sort: selectedMenu.key,
                direction: selectedMenu.sort,
                offset: 1,
            }))
        }
    }

    const batchDownload = async (serviceIds: string[]) => {
        try {
            if (!serviceIds.length) return
            const res = await downloadApiDoc({
                service_ids: serviceIds,
            })

            // 从响应头中提取文件名
            const contentDisposition = res.headers?.['content-disposition']
            let fileName = '' // 默认文件名

            if (contentDisposition) {
                // 解析 filename*=utf-8''encoded-filename 或 filename="filename" 格式
                const filenameStarMatch = contentDisposition.match(
                    /filename\*=utf-8''(.+)/i,
                )
                if (filenameStarMatch) {
                    fileName = decodeURIComponent(filenameStarMatch[1])
                } else {
                    const filenameMatch =
                        contentDisposition.match(/filename="?([^"]+)"?/i)
                    if (filenameMatch?.[1]) {
                        fileName = filenameMatch?.[1]
                    }
                }
            }

            streamToFile(res.data, fileName)
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <div className={styles['res-for-apply-container']}>
            <Tabs
                items={TabList}
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key as ResTypeEnum)}
            />
            <div
                className={classNames(styles.top, {
                    [styles.apiTop]: activeTab === ResTypeEnum.Api,
                })}
            >
                {activeTab === ResTypeEnum.Api && (
                    <Button
                        icon={
                            <FontIcon
                                name="icon-xiazai"
                                style={{ marginRight: 8 }}
                            />
                        }
                        onClick={() => {
                            batchDownload(selectedApiIds)
                        }}
                        type="primary"
                        disabled={!selectedApiIds.length}
                    >
                        {__('批量下载 ${count}/${total}', {
                            count: selectedApiIds?.length.toString(),
                            total: total.toString(),
                        })}
                    </Button>
                )}
                <Space className={styles['top-search']}>
                    <SearchInput
                        placeholder={placeHolderMap[activeTab]}
                        onKeyChange={(kw: string) => {
                            if (!kw && !searchValue.current) return
                            searchValue.current = kw
                            setSearchCondition({
                                ...searchCondition,
                                offset: 1,
                                keyword: kw || '',
                            })
                        }}
                        maxLength={255}
                        value={searchCondition.keyword}
                        className={styles.searchInput}
                        style={{ width: 320 }}
                    />

                    <LightweightSearch
                        key={activeTab}
                        formData={filterItems}
                        onChange={(data, key) => searchChange(data, key)}
                        defaultValue={{
                            department_id: undefined,
                        }}
                    />
                    <span>
                        <SortBtn
                            contentNode={
                                <DropDownFilter
                                    menus={dataSortViewMenus}
                                    defaultMenu={dataViewDefaultSort}
                                    menuChangeCb={handleMenuChange}
                                    changeMenu={selectedSort}
                                />
                            }
                        />
                        <RefreshBtn
                            onClick={() => {
                                setSearchCondition({
                                    ...searchCondition,
                                    offset: 1,
                                })
                            }}
                        />
                    </span>
                </Space>
            </div>
            <div className={styles.bottom}>
                <Table
                    columns={columns}
                    dataSource={tableData}
                    rowKey={activeTab === ResTypeEnum.Api ? 'service_id' : 'id'}
                    loading={loading}
                    rowClassName={styles.tableRow}
                    onChange={onTableChange}
                    rowSelection={
                        activeTab === ResTypeEnum.Api
                            ? {
                                  onChange: (selectedRowKeys, selectedRows) => {
                                      setSelectedApiIds(
                                          selectedRowKeys.map((key) =>
                                              key.toString(),
                                          ),
                                      )
                                  },
                                  type: 'checkbox',
                                  selectedRowKeys: selectedApiIds,
                                  getCheckboxProps: (record) => ({
                                      disabled: ![
                                          'down-auditing',
                                          'online',
                                      ].includes(record.status),
                                  }),
                              }
                            : undefined
                    }
                    showSorterTooltip={false}
                    scroll={{
                        // x: columns.length * 182,
                        y: scrollY,
                    }}
                    pagination={{
                        total,
                        pageSize: searchCondition?.limit,
                        current: searchCondition?.offset,
                        showQuickJumper: true,
                        onChange: (page, pageSize) =>
                            onPaginationChange(page, pageSize),
                        showSizeChanger: true,
                        showTotal: (count) => __('共${count}条', { count }),
                    }}
                    locale={{ emptyText: <Empty /> }}
                />
            </div>
            {catalogCardOpen && (
                <DataCatlgContent
                    open={catalogCardOpen}
                    onClose={() => {
                        setCatalogCardOpen(false)
                        setOperateItem(null)
                    }}
                    assetsId={operateItem?.data_catalog_id || operateItem?.id}
                />
            )}
            {logicViewId && loginViewOpen && (
                <LogicViewDetail
                    open={loginViewOpen}
                    onClose={() => {
                        setLoginViewOpen(false)
                    }}
                    id={logicViewId}
                    isIntroduced
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        top: '50px',
                        left: '0',
                        borderTop: '1px solid rgb(0 0 0 / 10%)',
                        zIndex: 1001,
                    }}
                    isAudit={false}
                    isPersonalCenter
                />
            )}

            {applicationServiceOpen && logicViewId && (
                <ApplicationServiceDetail
                    open={applicationServiceOpen}
                    onClose={() => {
                        setApplicationServiceOpen(false)
                    }}
                    serviceCode={logicViewId}
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        top: '50px',
                        left: '0',
                        borderTop: '1px solid rgb(0 0 0 / 10%)',
                        zIndex: 1001,
                    }}
                />
            )}
            {fileDetailOpen && logicViewId && (
                <FileDetail
                    open={fileDetailOpen}
                    onClose={() => {
                        setFileDetailOpen(false)
                    }}
                    id={logicViewId}
                    isIntroduced
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        top: '50px',
                        left: '0',
                        borderTop: '1px solid rgb(0 0 0 / 10%)',
                        zIndex: 1001,
                    }}
                />
            )}
        </div>
    )
}

export default ResForDep
