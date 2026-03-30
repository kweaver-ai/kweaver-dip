import { Table } from 'antd'
import { debounce, omit } from 'lodash'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useUpdateEffect } from 'ahooks'
import __ from '../locale'
import { IpView, StatusView } from '@/components/ServiceMonitoring/helper'
import SearchLayout from '@/components/SearchLayout'
import {
    callLogSearchFormInitData,
    lightweightSearchData,
    statusOptions,
} from './helper'
import {
    formatError,
    getAppRegisterList,
    getMonitorList,
    reqInfoSystemList,
    SortDirection,
} from '@/core'
import { IMonitorListRes } from '@/core/apis/dataApplicationService/index.d'
import { Empty, LightweightSearch, Loader } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import { SearchType } from '@/ui/LightweightSearch/const'
import { RefreshBtn } from '@/components/ToolbarComponents'

interface IProps {
    isInDrawer?: boolean
    serviceId?: string
    appId?: string
}
const CallLog = ({ isInDrawer = false, serviceId, appId }: IProps) => {
    const searchFormRef = useRef<any>(null)
    const [searchCondition, setSearchCondition] = useState<any>({
        limit: 10,
        offset: 1,
        sort: 'call_time',
        direction: 'desc',
    })
    const [accessSystemOptions, setAccessSystemOptions] = useState<any[]>([])
    const [accessAppOptions, setAccessAppOptions] = useState<any[]>([])
    // load
    const [loading, setLoading] = useState<boolean>(true)
    const [fetching, setFetching] = useState<boolean>(true)

    // 表格数据
    const [tableData, setTableData] = useState<(IMonitorListRes & any)[]>([])
    // 总条数
    const [total, setTotal] = useState<number>(3)

    // 表格高度
    const [scrollY, setScrollY] = useState<string>(`calc(100vh - 292px)`)

    // 表头排序
    const [tableSort, setTableSort] = useState<any>({
        call_time: 'desc',
    })

    // 初始化搜索条件
    useEffect(() => {
        getTableList(searchCondition)
    }, [])

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

            // 根据 mode 调整请求参数 service_id: appId
            const requestParams = {
                ...params,
                service_id: serviceId,
                call_app_id: appId,
            }

            const res = await getMonitorList(requestParams)

            setTableData(res?.entries || [])
            setTotal(res?.total_count || 0)
        } catch (error) {
            formatError(error)
        } finally {
            setFetching(false)
            setLoading(false)
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
            const res = await getAppRegisterList({
                is_register_gateway: true,
                offset: 1,
                limit: 2000,
                keyword: keyword || '',
            })
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

    // 动态生成搜索表单配置
    const searchFormData = useMemo(() => {
        const filteredFormData = callLogSearchFormInitData

        return filteredFormData.map((item) => {
            if (item.key === 'call_system_id') {
                return {
                    ...item,
                    itemProps: {
                        ...item.itemProps,
                        options: accessSystemOptions,
                        onFocus: () => debouncedLoadAccessSystemOptions(),
                        onSearch: (keyword) =>
                            debouncedLoadAccessSystemOptions(keyword),
                        showSearch: true,
                        filterOption: false,
                    },
                }
            }
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
    }, [accessSystemOptions, accessAppOptions])

    const columns: any = [
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
                <span title={record.service_department_path}>
                    {value || '--'}
                </span>
            ),
        },
        {
            title: __('调用部门'),
            dataIndex: 'call_department_name',
            key: 'call_department_name',
            ellipsis: true,
            render: (value, record) => (
                <span title={record.call_department_path}>{value || '--'}</span>
            ),
        },
        {
            title: __('调用系统'),
            dataIndex: 'call_system_name',
            key: 'call_system_name',
            ellipsis: true,
            render: (value, record) => value || '--',
        },
        {
            title: __('调用应用'),
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
        {
            title: __('调用时长'),
            dataIndex: 'call_average_duration',
            key: 'call_average_duration',
            width: 120,
            ellipsis: true,
            render: (value, record) => (
                <span>{value ? `${value} ${__('毫秒')}` : '--'}</span>
            ),
        },
        {
            title: __('状态'),
            dataIndex: 'status',
            key: 'status',
            width: 80,
            ellipsis: true,
            render: (value, record) => {
                return <StatusView record={record} />
            },
        },
    ]

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

    // 筛选展开状态
    const handleExpansionStatus = (status: boolean) => {
        // 使用 requestAnimationFrame 延迟高度更新
        requestAnimationFrame(() => {
            setScrollY(status ? `calc(100vh - 525px)` : 'calc(100vh - 292px)')
        })
    }

    // 是否有过滤值
    const isSearchStatus = useMemo(() => {
        const ignoreAttr = ['offset', 'limit', 'sort', 'direction', 'status']
        return Object.values(omit(searchCondition, ignoreAttr))?.some(
            (item) => item,
        )
    }, [searchCondition])

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

    const getTopOperate = () => {
        return isInDrawer ? (
            <SearchLayout
                ref={searchFormRef}
                formData={searchFormData}
                onSearch={handleSearch}
                getExpansionStatus={handleExpansionStatus}
            />
        ) : (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: 16,
                    gap: 8,
                }}
            >
                <LightweightSearch
                    formData={lightweightSearchData}
                    onChange={(data, key) => searchChange(data, key)}
                    defaultValue={{
                        status: undefined,
                        call_time: null,
                    }}
                />
                <RefreshBtn onClick={() => getTableList(searchCondition)} />
            </div>
        )
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
        // if (selectedMenu.key) {
        //     setSelectedSort({
        //         key: selectedMenu.key,
        //         sort: selectedMenu.sort,
        //     })
        // } else {
        //     setSelectedSort(defaultMenu)
        // }
    }

    return (
        <div style={{ width: '100%' }}>
            {loading ? (
                <Loader />
            ) : (
                <>
                    {getTopOperate()}
                    {tableData.length === 0 && !isSearchStatus ? (
                        <Empty
                            iconSrc={dataEmpty}
                            desc={__('暂无数据')}
                            style={{ marginTop: 40, width: '100%' }}
                        />
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

export default CallLog
