import { Button, Popconfirm, Space, Table, Tabs, Tooltip } from 'antd'

import { InfoCircleFilled } from '@ant-design/icons'
import { useDebounce } from 'ahooks'
import classnames from 'classnames'
import { useEffect, useState } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import DropDownFilter from '@/components/DropDownFilter'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import {
    AppReportStatus,
    cancelReportAudit,
    formatError,
    getSSZDReportAppList,
    reportSSZDApp,
    SortDirection,
    SortType,
} from '@/core'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { Empty, LightweightSearch, SearchInput } from '@/ui'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import { formatTime } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import { SortOrder } from '../ApplicationAudit'
import ViewDetail from '../ApplicationManage/ViewDetail'
import {
    DefaultAppReportQuery,
    defaultMenu,
    reportSortMenus,
    ReportTabs,
    ReportType,
    UpdateStatus,
} from '../const'
import __ from '../locale'
import styles from './styles.module.less'

const ApplicationReport = () => {
    // 初始化查询参数，使用默认搜索查询参数
    const [queryParams, setQueryParams] = useState<any>(DefaultAppReportQuery)
    // 初始化关键词状态，开始时为空字符串
    const [activeTab, setActiveTab] = useState(ReportType.UNREPORTED)
    // 初始化关键词状态，开始时为空字符串
    const [keyword, setKeyword] = useState<string>('')
    // 使用防抖钩子处理关键词输入，延迟500毫秒以减少频繁请求
    const debounceKeyword = useDebounce(keyword, {
        wait: 500,
    })

    // 初始化数据源
    const [dataSource, setDataSource] = useState<any[]>([])
    // 初始化总条数
    const [totalCount, setTotalCount] = useState<number>(0)

    // 初始化选中行
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])

    const [tableLoading, setTableLoading] = useState<boolean>(true)

    // 初始化详情弹窗
    const [detailOpen, setDetailOpen] = useState<boolean>(false)
    // 初始化详情数据
    const [detailData, setDetailData] = useState<any>(null)

    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder | undefined
    }>({
        [SortType.UPDATED]: 'descend',
        [SortType.NAME]: undefined,
        [SortType.REPORTEDAT]: undefined,
    })

    /**
     * 初始化排序条件的状态。
     * 使用 useState 钩子来管理排序条件的变化，初始值设置为默认排序条件。
     * 这允许用户在界面中选择不同的排序方式时动态更新排序条件。
     */
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)

    // 过滤条件
    const filterItems: IformItem[] = [
        {
            label: __('更新状态'),
            key: 'status',
            options: [
                {
                    label: __('不限'),
                    value: 'all',
                },
                {
                    label: __('新增'),
                    value: UpdateStatus.CREATED,
                },
                {
                    label: __('更新'),
                    value: UpdateStatus.UPDATED,
                },
            ],
            type: SearchType.Radio,
        },
    ]

    useEffect(() => {
        setQueryParams({
            ...queryParams,
            keyword: debounceKeyword,
        })
    }, [debounceKeyword])

    useEffect(() => {
        getListData(queryParams)
    }, [queryParams])

    useEffect(() => {
        setQueryParams({
            ...queryParams,
            report_type: activeTab,
            offset: 1,
        })
    }, [activeTab])

    /**
     * 处理菜单变化的回调函数
     * @param {Object} value - 菜单项的值，包含排序键和排序方式
     * @param {string} value.key - 排序键
     * @param {string} value.sort - 排序方式，如升序或降序
     *
     * 此函数用于响应菜单选项的变化，更新查询参数中的排序键和排序方式
     * 它通过解构赋值从传入的对象中获取key和sort属性，并使用这些值来更新queryParams对象
     * 这样可以确保在用户选择不同的排序选项时，能够正确地更新后端请求的参数，以反映用户的排序选择
     */
    const handleMenuChange = (value) => {
        const { key, sort } = value
        setQueryParams({
            ...queryParams,
            direction: sort,
            sort: key,
            offset: 1,
        })
        setSelectedSort(value)
        onChangeMenuToTableSort(value)
    }
    /**
     * 菜单变化时，更新表头排序
     * @param selectedMenu 选中的菜单
     */
    const onChangeMenuToTableSort = (selectedMenu) => {
        setTableSort({
            [SortType.UPDATED]: null,
            [SortType.NAME]: null,
            [SortType.REPORTEDAT]: null,
            [selectedMenu.key]:
                selectedMenu.sort === SortDirection.ASC ? 'ascend' : 'descend',
        })
    }

    /**
     * 异步获取列表数据
     *
     * 此函数通过调用getAppsList来获取应用程序列表数据它尝试执行异步操作，
     * 如果成功，将解析出entries和total_count属性如果操作失败，将调用formatError处理错误
     *
     * @param {Object} params - 传递给getAppsList函数的参数对象
     */
    const getListData = async (params) => {
        try {
            const { entries, total_count } = await getSSZDReportAppList({
                ...params,
            })
            setSelectedSort(undefined)
            setDataSource(entries)
            setTotalCount(total_count)
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 获取应用状态标签
     * @param status 状态
     * @returns 标签
     */
    const getAppStatusTag = (status: string) => {
        return (
            <div className={styles.tagContainer}>
                {status ? __('更新') : __('新增')}
            </div>
        )
    }

    /**
     * 获取审核状态标签
     * @param status 状态
     * @returns 标签
     */
    const getAuditStatusTag = (status: string, record?: any) => {
        switch (status) {
            case AppReportStatus.AUDITING:
                return (
                    <div className={styles.auditStatusContainer}>
                        <div className={styles.icon} />
                        <div>{__('审核中')}</div>
                    </div>
                )
            case AppReportStatus.AUDIT_REJECTED:
                return (
                    <div className={styles.auditStatusContainer}>
                        <div
                            className={classnames(
                                styles.icon,
                                styles.errorIcon,
                            )}
                        />
                        <div>{__('未通过')}</div>
                        <Tooltip
                            color="#fff"
                            title={record?.rejected_reason || ''}
                            placement="right"
                            overlayInnerStyle={{
                                color: 'rgba(0, 0, 0, 0.85)',
                            }}
                            overlayStyle={{
                                maxWidth: 500,
                            }}
                        >
                            <FontIcon
                                type={IconType.COLOREDICON}
                                name="icon-shenheyijian"
                            />
                        </Tooltip>
                    </div>
                )
            case AppReportStatus.REPORT_FAILED:
                return (
                    <div className={styles.auditStatusContainer}>
                        <div
                            className={classnames(
                                styles.icon,
                                styles.errorIcon,
                            )}
                        />
                        <div>{__('上报失败')}</div>
                    </div>
                )
            default:
                return '--'
        }
    }

    /** 待上报 表项 */
    const columns = [
        {
            title: __('应用名称'),
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            sortOrder: tableSort.name,
            render: (text, record) => (
                <div className={styles.rawContainer}>
                    <span
                        className={styles.text}
                        title={text}
                        onClick={() => {
                            setDetailData(record)
                            setDetailOpen(true)
                        }}
                    >
                        {text}
                    </span>
                    {getAppStatusTag(record.is_update)}
                </div>
            ),
            ellipsis: true,
        },
        {
            title: __('应用描述'),
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (text, record) => record?.description || '--',
        },
        {
            title: __('所属部门'),
            dataIndex: 'department_name',
            key: 'department_name',
            ellipsis: true,
            render: (value: string, record) => (
                <div title={record.department_path}>{value}</div>
            ),
        },
        {
            title: __('更新时间'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.updated_at,
            showSorterTooltip: false,
            render: (text) => formatTime(text) || '--',
        },
        {
            title: __('审核状态'),
            dataIndex: 'status',
            key: 'status',
            ellipsis: true,
            render: (text, record) => getAuditStatusTag(text, record),
        },

        {
            title: '操作',
            key: 'action',
            width: 150,
            render: (text: string, record) => (
                <Space size={12}>
                    {record.status === AppReportStatus.AUDITING ? (
                        <Button
                            type="link"
                            onClick={() => handleCancelReportAudit(record)}
                        >
                            {__('撤回')}
                        </Button>
                    ) : (
                        <Popconfirm
                            title={__('确认上报吗？')}
                            okText={__('确定')}
                            cancelText={__('取消')}
                            placement="bottomLeft"
                            onConfirm={(e) => {
                                reportApp([record.id])
                            }}
                            icon={
                                <InfoCircleFilled
                                    style={{ color: '#1890FF' }}
                                />
                            }
                        >
                            <Button type="link">{__('上报')}</Button>
                        </Popconfirm>
                    )}
                    <Button
                        type="link"
                        onClick={() => {
                            setDetailData(record)
                            setDetailOpen(true)
                        }}
                    >
                        {__('详情')}
                    </Button>
                </Space>
            ),
        },
    ]

    /** 已上报 表项 */
    const reportedColumns = [
        {
            title: __('应用名称'),
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            sortOrder: tableSort.name,
            render: (text, record) => (
                <div className={styles.rawContainer}>
                    <span
                        className={styles.text}
                        title={text}
                        onClick={() => {
                            setDetailData(record)
                            setDetailOpen(true)
                        }}
                    >
                        {text}
                    </span>
                </div>
            ),
            ellipsis: true,
        },
        {
            title: __('应用描述'),
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (text, record) => record?.description || '--',
        },
        {
            title: __('所属部门'),
            dataIndex: 'department_name',
            key: 'department_name',
            ellipsis: true,
            render: (value: string) => <div>{value}</div>,
        },
        {
            title: __('更新时间'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.updated_at,
            showSorterTooltip: false,
            render: (text) => formatTime(text) || '--',
        },
        {
            title: __('上报时间'),
            dataIndex: 'reported_at',
            key: 'reported_at',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.reported_at,
            showSorterTooltip: false,
            render: (text) => formatTime(text) || '--',
        },

        {
            title: '操作',
            key: 'action',
            width: 150,
            render: (text: string, record) => (
                <Button
                    type="link"
                    onClick={() => {
                        setDetailData(record)
                        setDetailOpen(true)
                    }}
                >
                    {__('详情')}
                </Button>
            ),
        },
    ]

    /**
     * 撤回上报应用审核
     * @param record 记录
     */
    const handleCancelReportAudit = async (record) => {
        try {
            await cancelReportAudit(record.id)
            getListData(queryParams)
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 批量上报
     */
    const handleBatchUpload = () => {
        confirm({
            title: __('确认上报吗？'),
            content: <div>{__('上报后将无法撤回。')}</div>,
            icon: <InfoCircleFilled style={{ color: '#1890FF' }} />,
            onOk: () => {
                reportApp(selectedRowKeys)
            },
        })
    }

    /**
     * 上报应用
     * @param appIds 应用ID数组
     */
    const reportApp = async (appIds: Array<string>) => {
        try {
            await reportSSZDApp({ ids: appIds })
            getListData(queryParams)
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 过滤条件变化
     * @param data 数据
     * @param key 键
     */
    const filterChange = (data, key) => {
        setQueryParams({
            ...queryParams,
            is_update: data.status,
            offset: 1,
        })
    }

    /**
     * 处理表格排序变化的回调函数。
     *
     * 当表格的排序条件发生变化时，此函数将被调用。它会根据排序的列和方向来更新排序状态，
     * 并调用相应的处理函数来应用这些变化。
     *
     * @param pagination 表格的分页信息。当前不直接使用，但保留以支持未来可能的需求。
     * @param sorter 表格的排序信息，包括排序的列和方向。
     */
    const handleTableChange = (sorter) => {
        const sorterKey = sorter.columnKey

        if (sorter.column) {
            setTableSort({
                [SortType.UPDATED]: null,
                [SortType.NAME]: null,
                [SortType.REPORTEDAT]: null,
                [sorterKey]: sorter.order || 'ascend',
            })
            return {
                key: sorterKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }

        setTableSort({
            [SortType.UPDATED]: null,
            [SortType.NAME]: null,
            [SortType.REPORTEDAT]: null,
            [sorterKey]:
                queryParams.direction === SortDirection.ASC
                    ? 'descend'
                    : 'ascend',
        })

        return {
            key: queryParams.sort,
            sort:
                queryParams.direction === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC,
        }
    }

    return (
        <div className={styles.reportContainer}>
            <Tabs
                activeKey={activeTab}
                onChange={(key) => {
                    setActiveTab(key as ReportType)
                    setDetailOpen(false)
                    setDetailData(null)
                }}
                items={ReportTabs}
                style={{ padding: '0 24px' }}
            />
            {dataSource?.length ||
            keyword ||
            queryParams.is_update !== 'all' ? (
                <div className={styles.listWrapper}>
                    <div className={styles.toolBar}>
                        {activeTab === ReportType.UNREPORTED ? (
                            <Button
                                disabled={!selectedRowKeys?.length}
                                onClick={handleBatchUpload}
                            >
                                {__('批量上报')}
                            </Button>
                        ) : (
                            <div />
                        )}

                        <Space size={16}>
                            <SearchInput
                                className={styles.nameInput}
                                style={{ width: 272 }}
                                placeholder={__('搜索应用名称')}
                                onKeyChange={(kw: string) => setKeyword(kw)}
                            />
                            <LightweightSearch
                                formData={filterItems}
                                onChange={(data, key) =>
                                    filterChange(data, key)
                                }
                                defaultValue={{
                                    status: 'all',
                                }}
                            />

                            <Space size={0}>
                                <SortBtn
                                    contentNode={
                                        <DropDownFilter
                                            menus={reportSortMenus.filter(
                                                (item) =>
                                                    item.key !==
                                                        SortType.REPORTEDAT ||
                                                    activeTab !==
                                                        ReportType.UNREPORTED,
                                            )}
                                            defaultMenu={defaultMenu}
                                            menuChangeCb={handleMenuChange}
                                            changeMenu={selectedSort}
                                        />
                                    }
                                />
                                <RefreshBtn
                                    onClick={() => {
                                        getListData(queryParams)
                                    }}
                                />
                            </Space>
                        </Space>
                    </div>
                    <div className={styles.table}>
                        <Table
                            columns={
                                activeTab === ReportType.UNREPORTED
                                    ? columns
                                    : reportedColumns
                            }
                            dataSource={dataSource}
                            rowSelection={
                                activeTab === ReportType.UNREPORTED
                                    ? {
                                          type: 'checkbox',
                                          selectedRowKeys,
                                          onChange: (rowKeys, selectedRows) => {
                                              setSelectedRowKeys(
                                                  rowKeys as string[],
                                              )
                                          },
                                      }
                                    : undefined
                            }
                            rowKey="id"
                            rowClassName={styles.tableRow}
                            pagination={{
                                current: queryParams?.offset,
                                pageSize: queryParams?.limit,
                                total: totalCount,
                                showTotal: (total) =>
                                    __('共${total}条', { total }),
                                pageSizeOptions: [10, 20, 50, 100],
                                showSizeChanger: totalCount > 20,
                                showQuickJumper:
                                    totalCount > (queryParams?.limit || 0) * 8,
                                hideOnSinglePage: totalCount <= 20,
                            }}
                            onChange={(pagination, filters, sorter) => {
                                if (pagination.current === queryParams.offset) {
                                    const selectedMenu: any =
                                        handleTableChange(sorter)
                                    setSelectedSort(selectedMenu)
                                    setQueryParams({
                                        ...queryParams,
                                        sort: selectedMenu.key,
                                        direction: selectedMenu.sort,
                                        offset: 1,
                                        limit: pagination?.pageSize,
                                    })
                                }
                            }}
                        />
                    </div>
                </div>
            ) : (
                <div>
                    <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                </div>
            )}

            {detailOpen && detailData && (
                <ViewDetail
                    appId={detailData.id}
                    onClose={() => {
                        setDetailOpen(false)
                        setDetailData(null)
                    }}
                    open={detailOpen}
                    dataVersion={
                        activeTab === ReportType.UNREPORTED
                            ? 'published'
                            : 'reported'
                    }
                />
            )}
        </div>
    )
}

export default ApplicationReport
