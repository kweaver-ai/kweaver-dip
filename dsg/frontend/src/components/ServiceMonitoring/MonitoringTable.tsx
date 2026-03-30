import { Table } from 'antd'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import { omit, debounce } from 'lodash'
import __ from './locale'
import {
    searchFormInitData,
    initSearch,
    defaultMenu,
    sortMenus,
    TabMode,
} from './const'
import styles from './styles.module.less'
import { Empty } from '@/ui'
import {
    SortDirection,
    formatError,
    getMonitorList,
    getAppRegisterList,
    getIntegratedAppList,
    reqInfoSystemList,
} from '@/core'
import {
    IMonitorListRes,
    MonitoringStatus,
} from '@/core/apis/dataApplicationService/index.d'
import { formatTime } from '@/utils'
import {
    StatusView,
    renderEmpty,
    renderLoader,
    timeStrToTimestamp,
    IpView,
} from './helper'
import SearchLayout from '../SearchLayout'
import { SortBtn } from '../ToolbarComponents'
import DropDownFilter from '../DropDownFilter'

interface MonitoringTableProps {
    mode?: TabMode
    id?: string
}

const MonitoringTable: React.FC<MonitoringTableProps> = ({
    mode = TabMode.Log,
    id,
}): React.ReactElement => {
    // 搜索条件
    const [searchCondition, setSearchCondition] = useState<any>({})
    // 表头排序
    const [tableSort, setTableSort] = useState<any>({
        call_time: 'desc',
    })

    // load
    const [loading, setLoading] = useState<boolean>(true)
    const [fetching, setFetching] = useState<boolean>(true)

    // 表格数据
    const [tableData, setTableData] = useState<IMonitorListRes[]>([])
    // 总条数
    const [total, setTotal] = useState<number>(0)

    // 表格高度
    const [scrollY, setScrollY] = useState<string>(`calc(100vh - 292px)`)
    const searchFormRef: any = useRef()

    // 接入系统选项
    const [accessSystemOptions, setAccessSystemOptions] = useState<any[]>([])
    // 接入应用选项
    const [accessAppOptions, setAccessAppOptions] = useState<any[]>([])
    // 下拉排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)

    // 动态生成搜索表单配置
    const searchFormData = useMemo(() => {
        // 根据 mode 过滤搜索表单数据
        let filteredFormData = searchFormInitData
        if (mode === TabMode.Error) {
            // 错误监控模式下，过滤掉状态筛选项
            filteredFormData = searchFormInitData.filter(
                (item) => item.key !== 'status',
            )
        }

        return filteredFormData.map((item) => {
            // if (item.key === 'call_system_id') {
            //     return {
            //         ...item,
            //         itemProps: {
            //             ...item.itemProps,
            //             options: accessSystemOptions,
            //             onFocus: () => debouncedLoadAccessSystemOptions(),
            //             onSearch: (keyword) =>
            //                 debouncedLoadAccessSystemOptions(keyword),
            //             showSearch: true,
            //             filterOption: false,
            //         },
            //     }
            // }
            if (item.key === 'call_app_id') {
                return {
                    ...item,
                    itemProps: {
                        ...item.itemProps,
                        options: accessAppOptions,
                        onFocus: () => debouncedLoadAccessAppOptions(),
                        onSearch: (keyword) =>
                            debouncedLoadAccessAppOptions(keyword),
                        showSearch: true,
                        filterOption: false,
                    },
                }
            }
            return item
        })
    }, [accessSystemOptions, accessAppOptions, mode])

    // 初始化搜索条件
    useEffect(() => {
        setSearchCondition(initSearch)
    }, [])

    // 是否有过滤值
    const isSearchStatus = useMemo(() => {
        const ignoreAttr = ['offset', 'limit', 'sort', 'direction', 'status']
        return Object.values(omit(searchCondition, ignoreAttr))?.some(
            (item) => item,
        )
    }, [searchCondition])

    // 根据条件请求数据
    useUpdateEffect(() => {
        if (searchCondition) {
            getTableList({ ...searchCondition })
        }
    }, [searchCondition])

    // 获取表格数据
    const getTableList = async (params: any) => {
        try {
            setFetching(true)

            // 根据 mode 调整请求参数
            const requestParams = { ...params }
            if (mode === TabMode.Error) {
                // 错误监控模式下，只获取状态为失败的服务
                requestParams.status = MonitoringStatus.Fail
            }
            // 只获取指定服务的监控数据
            if (id) {
                requestParams.service_id = id
            }

            const res = await getMonitorList(requestParams)

            setTableData(res?.entries || [])
            setTotal(res?.total_count || 0)
        } catch (error) {
            formatError(error)
        } finally {
            setFetching(false)
            setLoading(false)
            setSelectedSort(undefined)
        }
    }

    // 获取接入系统选项
    const loadAccessSystemOptions = async (keyword?: string) => {
        try {
            const res = await reqInfoSystemList({
                is_register_gateway: true,
                offset: 1,
                limit: 2000,
                keyword: keyword || '',
            })
            setAccessSystemOptions(res?.entries || [])
        } catch (error) {
            formatError(error)
        }
    }

    // 获取接入应用选项
    const loadAccessAppOptions = async (keyword?: string) => {
        try {
            // const res = await getAppRegisterList({
            //     is_register_gateway: true,
            //     offset: 1,
            //     limit: 2000,
            //     keyword: keyword || '',
            // })
            const res = await getIntegratedAppList()
            setAccessAppOptions(res?.entries || [])
        } catch (error) {
            formatError(error)
        }
    }

    // 防抖版本的搜索函数
    const debouncedLoadAccessSystemOptions = useMemo(
        () => debounce(loadAccessSystemOptions, 300),
        [],
    )

    const debouncedLoadAccessAppOptions = useMemo(
        () => debounce(loadAccessAppOptions, 300),
        [],
    )

    const columns: any = useMemo(() => {
        const cols = [
            {
                title: __('服务名称'),
                dataIndex: 'service_name',
                key: 'service_name',
                ellipsis: true,
                render: (value, record) => value || '--',
            },
            {
                title: __('服务所属部门'),
                dataIndex: 'service_department_name',
                key: 'service_department_name',
                ellipsis: true,
                render: (value, record) => (
                    <span
                        title={record.service_department_path || value || '--'}
                    >
                        {value || '--'}
                    </span>
                ),
            },
            // {
            //     title: __('调用部门'),
            //     dataIndex: 'call_department_name',
            //     key: 'call_department_name',
            //     ellipsis: true,
            //     render: (value, record) => (
            //         <span title={record.call_department_path || value || '--'}>
            //             {value || '--'}
            //         </span>
            //     ),
            // },
            // {
            //     title: __('调用系统'),
            //     dataIndex: 'call_system_name',
            //     key: 'call_system_name',
            //     ellipsis: true,
            //     render: (value, record) => value || '--',
            // },
            {
                title: __('应用账户'),
                dataIndex: 'call_app_name',
                key: 'call_app_name',
                ellipsis: true,
                render: (value, record) => value || '--',
            },
            {
                title: __('调用IP及端口'),
                dataIndex: 'call_host_and_port',
                key: 'call_host_and_port',
                width: 200,
                ellipsis: true,
                render: (value, record) => <IpView record={record} />,
            },
            // {
            //     title: __('平均调用时长'),
            //     dataIndex: 'call_average_duration',
            //     key: 'call_average_duration',
            //     // sorter: true,
            //     // sortOrder: tableSort?.call_time,
            //     // showSorterTooltip: false,
            //     // sortDirections: ['descend', 'ascend', 'descend'],
            //     width: 120,
            //     ellipsis: true,
            //     render: (value, record) => (
            //         <span>{value ? `${value} ${__('毫秒')}` : '--'}</span>
            //     ),
            // },
            // {
            //     title: __('调用次数'),
            //     dataIndex: 'call_num',
            //     key: 'call_num',
            //     width: 120,
            //     ellipsis: true,
            //     render: (value, record) => value || '--',
            // },
            // {
            //     title: __('状态'),
            //     dataIndex: 'status',
            //     key: 'status',
            //     width: 80,
            //     ellipsis: true,
            //     render: (value, record) => {
            //         return <StatusView record={record} />
            //     },
            // },
        ]

        return cols
    }, [tableSort, searchCondition])

    // 筛选顺序变化
    const onChangeMenuToTableSort = (selectedMenu) => {
        const newSort: any = {
            call_time: null,
        }

        const key = selectedMenu?.key
        newSort[key] =
            selectedMenu.sort === SortDirection.DESC ? 'descend' : 'ascend'

        setTableSort(newSort)

        return {
            key,
            sort: selectedMenu?.sort,
        }
    }

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu: any) => {
        setSearchCondition((prev) => ({
            ...prev,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            offset: 1,
        }))
        onChangeMenuToTableSort(selectedMenu)
    }

    // 表格排序改变
    const onTableChange = (sorter) => {
        const newSort = {
            call_time: null,
        }

        if (sorter.column) {
            const key = sorter.columnKey
            newSort[key] = sorter.order || 'ascend'
        }

        setTableSort(newSort)

        return {
            key: sorter?.columnKey,
            sort:
                sorter?.order === 'ascend'
                    ? SortDirection.ASC
                    : SortDirection.DESC,
        }
    }

    // 表格排序改变
    const handleTableChange = (currentPagination, filters, sorter, extra) => {
        const selectedMenu = onTableChange(sorter)
        setSearchCondition((prev) => ({
            ...prev,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            offset: currentPagination?.current || 1,
            limit: currentPagination?.pageSize || 10,
        }))

        // 同步 SortBtn 的选中项
        if (selectedMenu.key) {
            setSelectedSort({
                key: selectedMenu.key,
                sort: selectedMenu.sort,
            })
        } else {
            setSelectedSort(defaultMenu)
        }
    }

    // 筛选展开状态
    const handleExpansionStatus = (status: boolean) => {
        // 使用 requestAnimationFrame 延迟高度更新
        requestAnimationFrame(() => {
            setScrollY(status ? `calc(100vh - 525px)` : 'calc(100vh - 292px)')
        })
    }

    // 添加防抖处理
    const handleSearch = debounce((values: any) => {
        // const obj = timeStrToTimestamp(values)
        const params = {
            ...searchCondition,
            // ...obj,
            ...values,
            offset: 1,
        }

        setSearchCondition(params)
    }, 300)

    // 获取顶部操作区域
    const getTopOperate = () => {
        return (
            <SearchLayout
                ref={searchFormRef}
                formData={searchFormData}
                onSearch={handleSearch}
                // suffixNode={
                //     <SortBtn
                //         contentNode={
                //             <DropDownFilter
                //                 menus={sortMenus}
                //                 defaultMenu={defaultMenu}
                //                 menuChangeCb={handleMenuChange}
                //                 changeMenu={selectedSort}
                //             />
                //         }
                //     />
                // }
                getExpansionStatus={handleExpansionStatus}
            />
        )
    }

    return (
        <div className={classnames(styles.serviceMonitoringTable)}>
            <div className={styles.title}>{__('服务监控')}</div>
            {loading ? (
                renderLoader()
            ) : (
                <>
                    {getTopOperate()}
                    {tableData.length === 0 && !isSearchStatus ? (
                        renderEmpty()
                    ) : (
                        <Table
                            columns={columns}
                            dataSource={tableData}
                            loading={fetching}
                            rowKey="id"
                            onChange={handleTableChange}
                            scroll={{ y: scrollY }}
                            pagination={{
                                total,
                                pageSize: searchCondition?.limit,
                                current: searchCondition?.offset,
                                showQuickJumper: true,
                                showSizeChanger: true,
                                showTotal: (count) =>
                                    __('共${count}条', { count }),
                            }}
                            locale={{ emptyText: <Empty /> }}
                        />
                    )}
                </>
            )}
        </div>
    )
}

export default MonitoringTable
