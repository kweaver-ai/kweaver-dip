import classNames from 'classnames'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DownloadOutlined } from '@ant-design/icons'
import { Button, Space, Table, Tabs } from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import { useUpdateEffect } from 'ahooks'
import styles from './styles.module.less'
import __ from '../locale'
import { Empty, LightweightSearch, SearchInput } from '@/ui'
import { SearchType } from '@/ui/LightweightSearch/const'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import DropDownFilter from '@/components/DropDownFilter'
import { dataSortViewMenus, dataViewDefaultSort, TabList } from './const'
import {
    downloadApiDoc,
    formatError,
    getAppliedApiList,
    getAppliedViewList,
    IAppliedApiItem,
    IAppliedViewItem,
    SortDirection,
} from '@/core'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import DataCatlgContent from '@/components/DataAssetsCatlg/DataCatlgContent'
import ViewShareInfo from '../Components/ViewShareInfo'
import { ResTypeEnum } from '../const'
import CallLogDrawer from '../Components/CallLogDrawer'
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'
import ApplicationServiceDetail from '@/components/DataAssetsCatlg/ApplicationServiceDetail'

import { streamToFile } from '@/utils'

const ResForApply = () => {
    const [searchCondition, setSearchCondition] = useState({
        keyword: '',
        offset: 1,
        limit: 10,
        sort: 'name',
        direction: SortDirection.DESC,
    })
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder | undefined
    }>({
        name: 'descend',
    })
    const [selectedSort, setSelectedSort] = useState<any>(dataViewDefaultSort)
    const searchValue = useRef('')
    const [catalogCardOpen, setCatalogCardOpen] = useState<boolean>(false)
    const [operateItem, setOperateItem] = useState<
        IAppliedViewItem | IAppliedApiItem
    >()
    const [viewShareInfoOpen, setViewShareInfoOpen] = useState<boolean>(false)
    const [viewCallLogOpen, setViewCallLogOpen] = useState<boolean>(false)
    const [tableData, setTableData] = useState<any[]>([])
    const [total, setTotal] = useState<number>(0)
    const [scrollY, setScrollY] = useState<string>(`calc(100vh - 327px)`)
    const [loginViewOpen, setLoginViewOpen] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const [applicationServiceOpen, setApplicationServiceOpen] = useState(false)
    const [logicViewId, setLoginViewId] = useState<string>('')
    const [activeTab, setActiveTab] = useState(TabList[0].key)
    const [selectedApiIds, setSelectedApiIds] = useState<string[]>([])

    const getTableList = async (params: any) => {
        try {
            setLoading(true)
            const req =
                activeTab === ResTypeEnum.Api
                    ? getAppliedApiList
                    : getAppliedViewList
            const res = await req({
                ...params,
                sort:
                    activeTab === ResTypeEnum.Api
                        ? 'res_code'
                        : 'res_tech_name',
            })
            setTableData(res.entries)
            setTotal(res.total_count)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
            setSelectedSort(undefined)
        }
    }

    useEffect(() => {
        getTableList(searchCondition)
    }, [])

    useUpdateEffect(() => {
        getTableList(searchCondition)
    }, [searchCondition])

    useUpdateEffect(() => {
        setSearchCondition({ ...searchCondition, offset: 1, keyword: '' })
    }, [activeTab])

    /** 筛选项 */
    const filterItems = [
        {
            label: __('所属目录状态'),
            key: 'catalog_status',
            initLabel: __('已上线'),
            options: [
                {
                    label: __('全部'),
                    value: '',
                },
                {
                    label: __('已上线'),
                    value: 'online',
                },
                {
                    label: __('已下线'),
                    value: 'offline',
                },
            ],
            type: SearchType.Radio,
        },
    ]

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
            dataIndex: 'catalog_name',
            key: 'catalog_name',
            render: (text, record) => (
                <div className={styles['catalog-info-container']}>
                    <div
                        className={classNames(
                            styles['catalog-name'],
                            typeof record.is_catalog_online === 'boolean' &&
                                !record.is_catalog_online &&
                                styles['catalog-name-offline'],
                            typeof record.is_catalog_online === 'boolean' &&
                                !record.is_catalog_online &&
                                styles['name-offline'],
                        )}
                        title={record.catalog_name}
                        onClick={() => {
                            setCatalogCardOpen(true)
                            setOperateItem(record)
                        }}
                    >
                        {record.catalog_name || '--'}
                    </div>
                    {typeof record.is_catalog_online === 'boolean' &&
                        !record.is_catalog_online &&
                        record.catalog_name && (
                            <div className={styles['offline-flag']}>
                                {__('已下线')}
                            </div>
                        )}
                </div>
            ),
        }

        const catalogProviderCol = {
            title: __('目录提供方'),
            dataIndex: 'supply_org_name',
            key: 'supply_org_name',
            ellipsis: true,
            render: (provider, record) =>
                typeof record.is_catalog_online === 'boolean' &&
                !record.is_catalog_online ? (
                    <span className={styles['name-offline']}>{provider}</span>
                ) : (
                    provider
                ),
        }

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
                width: '30%',
                render: (text, record) => (
                    <div
                        className={styles['technical-info-container']}
                        onClick={() => {
                            setLoginViewOpen(true)
                            setOperateItem(record)
                        }}
                    >
                        <FontIcon
                            name="icon-shitusuanzi"
                            type={IconType.COLOREDICON}
                            style={{ fontSize: 20 }}
                        />
                        <div className={styles['technical-info']}>
                            <div
                                className={classNames(
                                    styles['technical-name'],
                                    !record.is_catalog_online &&
                                        styles['name-offline'],
                                )}
                                title={record.res_tech_name}
                            >
                                {record.res_tech_name}
                            </div>
                            <div
                                className={styles['technical-code']}
                                title={record.res_code}
                            >
                                {record.res_code}
                            </div>
                        </div>
                    </div>
                ),

                ellipsis: true,
            },
            {
                title: __('表业务名称'),
                dataIndex: 'res_name',
                key: 'res_name',
                width: '30%',
                ellipsis: true,
                render: (text, record) =>
                    record.is_catalog_online ? (
                        <span className={styles['business-name']}>{text}</span>
                    ) : (
                        <span className={styles['name-offline']}>{text}</span>
                    ),
            },
            catalogCol,
            catalogProviderCol,
            {
                title: __('操作'),
                dataIndex: 'operation',
                key: 'operation',
                width: 130,
                render: (text, record) => (
                    <Button
                        type="link"
                        onClick={() => {
                            setViewShareInfoOpen(true)
                            setOperateItem(record)
                        }}
                    >
                        {__('查看共享信息')}
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
                width: 350,
                render: (text, record) => (
                    <div className={styles['technical-info-container']}>
                        <FontIcon
                            name="icon-jiekoufuwuguanli"
                            type={IconType.COLOREDICON}
                            style={{ fontSize: 20 }}
                        />
                        <div className={styles['technical-info']}>
                            <div
                                className={classNames(
                                    styles['api-technical-name'],
                                    typeof record.is_catalog_online ===
                                        'boolean' &&
                                        !record.is_catalog_online &&
                                        styles['name-offline'],
                                )}
                            >
                                <div
                                    title={record.res_name}
                                    className={styles['technical-name-text']}
                                    onClick={() => {
                                        setApplicationServiceOpen(true)
                                        setLoginViewId(record.res_id)
                                    }}
                                >
                                    {record.res_name}
                                </div>
                                {typeof record.is_res_online === 'boolean' &&
                                    !record.is_res_online && (
                                        <div
                                            className={
                                                styles['api-offline-flag']
                                            }
                                        >
                                            {__('已下线')}
                                        </div>
                                    )}
                            </div>
                            <div
                                className={styles['technical-code']}
                                title={record.res_code}
                            >
                                {record.res_code}
                            </div>
                        </div>
                    </div>
                ),
                ellipsis: true,
            },
            {
                title: __('接口类型'),
                dataIndex: 'api_type',
                key: 'api_type',
                render: (text, record) => (
                    <span
                        className={
                            typeof record.is_catalog_online === 'boolean' &&
                            !record.is_catalog_online
                                ? styles['name-offline']
                                : ''
                        }
                    >
                        {text === 'service_register'
                            ? __('注册接口')
                            : __('生成接口')}
                    </span>
                ),
            },
            catalogCol,
            catalogProviderCol,
            {
                title: __('操作'),
                dataIndex: 'operation',
                key: 'operation',
                width: 360,
                render: (text, record) => (
                    <Space size={10}>
                        <Button
                            type="link"
                            onClick={() => {
                                setViewShareInfoOpen(true)
                                setOperateItem(record)
                            }}
                        >
                            {__('查看共享信息')}
                        </Button>
                        <Button
                            type="link"
                            onClick={() => {
                                setViewCallLogOpen(true)
                                setOperateItem(record)
                            }}
                        >
                            {__('查看调用日志')}
                        </Button>
                        <Button
                            type="link"
                            onClick={() => {
                                batchDownload([record.res_id])
                            }}
                            disabled={
                                typeof record.is_res_online === 'boolean' &&
                                !record.is_res_online
                            }
                        >
                            {__('下载文档')}
                        </Button>
                    </Space>
                ),
            },
        ]

        return activeTab === ResTypeEnum.Api ? apiColumns : viewColumns
    }, [activeTab, tableSort])

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
    // 批量下载文档
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
                        placeholder={
                            activeTab === ResTypeEnum.Api
                                ? __('搜索接口编码、目录编码')
                                : __('搜索表技术名称、表编码、目录编码')
                        }
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

                    {/* <LightweightSearch
                        formData={filterItems}
                        onChange={(data, key) => searchChange(data, key)}
                        defaultValue={{
                            catalog_status: 'online',
                        }}
                    /> */}
                    <span>
                        {/* <SortBtn
                            contentNode={
                                <DropDownFilter
                                    menus={dataSortViewMenus}
                                    defaultMenu={dataViewDefaultSort}
                                    menuChangeCb={handleMenuChange}
                                    changeMenu={selectedSort}
                                />
                            }
                        /> */}
                        <RefreshBtn
                            onClick={() =>
                                setSearchCondition({ ...searchCondition })
                            }
                        />
                    </span>
                </Space>
            </div>
            <div className={styles.bottom}>
                <Table
                    columns={columns}
                    dataSource={tableData}
                    rowKey="res_id"
                    loading={loading}
                    rowClassName={styles.tableRow}
                    onChange={onTableChange}
                    scroll={{
                        x: columns.length * 182,
                        y: scrollY,
                    }}
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
                                      disabled:
                                          typeof record.is_res_online ===
                                              'boolean' &&
                                          !record.is_res_online,
                                  }),
                              }
                            : undefined
                    }
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
                        setOperateItem(undefined)
                    }}
                    assetsId={operateItem?.catalog_id}
                />
            )}
            {viewShareInfoOpen && operateItem?.res_id && (
                <ViewShareInfo
                    open={viewShareInfoOpen}
                    onClose={() => {
                        setViewShareInfoOpen(false)
                        setOperateItem(undefined)
                    }}
                    id={operateItem?.res_id}
                    type={
                        activeTab === ResTypeEnum.Api
                            ? ResTypeEnum.Api
                            : ResTypeEnum.View
                    }
                    serviceId={operateItem?.res_id || ''}
                />
            )}
            {viewCallLogOpen && operateItem?.res_id && (
                <CallLogDrawer
                    id={operateItem?.res_id}
                    open={viewCallLogOpen}
                    onClose={() => {
                        setViewCallLogOpen(false)
                        setOperateItem(undefined)
                    }}
                />
            )}
            {loginViewOpen && operateItem?.res_id && (
                <LogicViewDetail
                    open={loginViewOpen}
                    onClose={() => {
                        setLoginViewOpen(false)
                        setOperateItem(undefined)
                    }}
                    id={operateItem?.res_id}
                    isIntroduced
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        top: '52px',
                        borderTop: '1px solid rgb(0 0 0 / 10%)',
                        // zIndex: 1001,
                    }}
                    hasAsst={false}
                    isPersonalCenter
                />
            )}
            {applicationServiceOpen && logicViewId && (
                <ApplicationServiceDetail
                    open={applicationServiceOpen}
                    onClose={() => {
                        setApplicationServiceOpen(false)
                        setLoginViewId('')
                    }}
                    serviceCode={logicViewId}
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        top: '50px',
                        left: '0',
                        borderTop: '1px solid rgb(0 0 0 / 10%)',
                        // zIndex: 1001,
                    }}
                />
            )}
        </div>
    )
}

export default ResForApply
