import { Space, Table, Button, Tooltip } from 'antd'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useUpdateEffect } from 'ahooks'
import { PlusOutlined } from '@ant-design/icons'
import { trim, omit } from 'lodash'
import { SortOrder } from 'antd/lib/table/interface'
import { Empty, OptionBarTool, OptionMenuType, SearchInput } from '@/ui'
import {
    SortDirection,
    formatError,
    getFirmList,
    IGetFirmListParams,
    deleteFirm,
    SortType,
} from '@/core'
import { formatTime } from '@/utils'
import { RefreshBtn } from '../../ToolbarComponents'
import {
    FirmTabMap,
    FirmOperate,
    renderEmpty,
    renderLoader,
    getConfirmModal,
} from '../helper'
import Create from '../operate/Create'
import Import from '../operate/Import'
import __ from '../locale'
import styles from '../styles.module.less'

const FirmTable: React.FC<{
    menu: string
}> = ({ menu }) => {
    // 初始化 load
    const [loading, setLoading] = useState<boolean>(true)
    // 加载数据 load
    const [fetching, setFetching] = useState<boolean>(true)
    // 表格数据
    const [tableData, setTableData] = useState<any[]>([])
    // 总条数
    const [total, setTotal] = useState<number>(0)
    // 当前操作项
    const [operateItem, setOperateItem] = useState<any>()
    // 表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>(FirmTabMap[menu].defaultTableSort)
    // 新建弹窗
    const [createVisible, setCreateVisible] = useState(false)
    // 编辑弹窗
    const [editVisible, setEditVisible] = useState(false)
    // 导入弹窗
    const [importVisible, setImportVisible] = useState(false)
    // 搜索条件
    const [searchCondition, setSearchCondition] = useState<IGetFirmListParams>()
    // 获取 搜索条件
    const searchConditionRef = useRef(searchCondition)

    const searchRef = useRef<any>(null)

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedKeys: React.Key[]) => {
            setSelectedRowKeys(selectedKeys)
        },
    }

    useEffect(() => {
        // 初始化搜索条件
        const { initSearch } = FirmTabMap[menu]
        setSearchCondition(initSearch)
    }, [menu])

    useEffect(() => {
        searchConditionRef.current = searchCondition
    }, [searchCondition])

    // 是否有过滤值
    const isSearchStatus = useMemo(() => {
        const ignoreAttr = ['offset', 'limit', 'sort', 'direction']
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
            const res = await getFirmList(params)
            setTableData(res?.entries || [])
            setTotal(res?.total_count || 0)
        } catch (error) {
            formatError(error)
        } finally {
            setFetching(false)
            setLoading(false)
        }
    }

    // 表格操作事件
    const handleOptionTable = (key: string, record) => {
        setOperateItem(record)
        switch (key) {
            case FirmOperate.Edit:
                setEditVisible(true)
                break

            case FirmOperate.Delete:
                handleDeleteFirm([record?.id])
                break

            default:
                break
        }
    }

    // 表格操作项
    const getTableOptions = () => {
        const allOptionMenus = [
            {
                key: FirmOperate.Edit,
                label: __('编辑'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: FirmOperate.Delete,
                label: __('删除'),
                menuType: OptionMenuType.Menu,
            },
        ]

        // 根据 optionKeys 过滤出对应的 optionMenus
        const optionMenus = allOptionMenus.filter((i) =>
            FirmTabMap[menu].actionMap.includes(i.key),
        )

        return optionMenus
    }

    const columns: any = useMemo(() => {
        const commonProps = {
            ellipsis: true,
            render: (value) => value || '--',
        }

        const sortableColumn = (dataIndex: string) => ({
            sorter: true,
            sortOrder: tableSort?.[dataIndex],
            showSorterTooltip: false,
            sortDirections: ['descend', 'ascend', 'descend'],
            width: 200,
        })

        const cols = [
            {
                title: __('公司名称'),
                dataIndex: 'name',
                key: 'name',
                ...sortableColumn('name'),
                width: 300,
                ...commonProps,
            },
            {
                title: __('统一社会信用代码'),
                dataIndex: 'uniform_code',
                key: 'uniform_code',
                ...commonProps,
            },
            {
                title: __('法定代表/负责人'),
                dataIndex: 'legal_represent',
                key: 'legal_represent',
                ...commonProps,
            },
            {
                title: __('联系电话'),
                dataIndex: 'contact_phone',
                key: 'contact_phone',
                ...commonProps,
            },
            {
                title: __('更新时间'),
                dataIndex: 'updated_at',
                key: 'updated_at',
                ...sortableColumn('updated_at'),
                ...commonProps,
                render: (val: number) => (val ? formatTime(val) : '--'),
            },
            {
                title: __('操作'),
                key: 'action',
                width: FirmTabMap[menu].actionWidth,
                fixed: 'right',
                render: (_, record) => {
                    return (
                        <OptionBarTool
                            menus={getTableOptions() as any[]}
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
            FirmTabMap[menu].columnKeys.includes(col.key),
        )
    }, [menu, tableSort])

    // 关键字搜索
    const handleKwSearch = (kw) => {
        if (kw === searchCondition?.keyword) return
        setSearchCondition({
            ...searchCondition,
            keyword: kw,
            offset: 1,
        } as IGetFirmListParams)
    }

    // 刷新
    const handleRefresh = (refresh: boolean = true) => {
        setSearchCondition({
            ...searchCondition,
            offset: refresh ? 1 : searchCondition?.offset,
        } as IGetFirmListParams)
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        const newSort = {
            name: null,
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
    const onTableChange = (currentPagination, filters, sorter, extra) => {
        const selectedMenu = handleTableChange(sorter)
        if (extra.action === 'sort' && !!sorter.column) {
            setSearchCondition({
                ...searchCondition,
                sort: selectedMenu.key,
                direction: selectedMenu.sort,
                offset: 1,
            } as IGetFirmListParams)
        }
    }

    // 分页改变
    const onPaginationChange = (page, pageSize) => {
        setSearchCondition({
            ...searchCondition,
            offset: page || 1,
            limit: pageSize,
        } as IGetFirmListParams)
    }

    // 确认删除
    const confirmDelete = async (delData) => {
        try {
            await deleteFirm(delData)
            setSelectedRowKeys([])

            // 先查询当前页数据
            const currentPageData = await getFirmList(
                searchConditionRef?.current as IGetFirmListParams,
            )

            // 当当前页数据为空且不是第一页时重置到第一页
            if (
                currentPageData?.entries?.length === 0 &&
                (searchConditionRef?.current?.offset || 1) > 1
            ) {
                setSearchCondition({
                    ...searchConditionRef.current,
                    offset: 1,
                } as IGetFirmListParams)
            } else {
                // 当前页有数据，或者已经是第一页，直接用当前的查询结果更新表格
                setTableData(currentPageData.entries || [])
                setTotal(currentPageData.total_count || 0)
            }
        } catch (error) {
            formatError(error)
        }
    }

    // 删除
    const handleDeleteFirm = (delData) => {
        getConfirmModal({
            title: '确定要删除已选公司信息吗？',
            content: '删除后已选公司信息将无法找回，请确认操作！',
            onOk: () => confirmDelete(delData),
        })
    }

    // 顶部左侧操作
    const leftOperate = (
        <div className={styles.topLeft}>
            <Space>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateVisible(true)}
                >
                    {__('新建')}
                </Button>
                {/* <Button onClick={() => setImportVisible(true)}>
                    {__('导入')}
                </Button> */}
                <Tooltip
                    title={
                        selectedRowKeys?.length === 0
                            ? __('选择公司信息后可点击删除')
                            : null
                    }
                    placement="bottom"
                >
                    <Button
                        disabled={selectedRowKeys?.length === 0}
                        onClick={() => handleDeleteFirm(selectedRowKeys)}
                    >
                        {__('删除')}
                    </Button>
                </Tooltip>
            </Space>
        </div>
    )

    // 顶部右侧操作
    const rightOperate = (tableData.length > 0 || isSearchStatus) && (
        <div className={styles.topRight}>
            <Space size={8}>
                <Tooltip
                    placement="bottom"
                    title={__('搜索公司名称、统一社会信用代码、法定代表')}
                >
                    <SearchInput
                        value={searchCondition?.keyword}
                        style={{ width: 280 }}
                        placeholder={__(
                            '搜索公司名称、统一社会信用代码、法定代表',
                        )}
                        onKeyChange={(kw: string) => {
                            handleKwSearch(kw)
                        }}
                        onPressEnter={(
                            e: React.KeyboardEvent<HTMLInputElement>,
                        ) => {
                            handleKwSearch(trim(e.currentTarget.value))
                        }}
                    />
                </Tooltip>
                <RefreshBtn onClick={handleRefresh} />
            </Space>
        </div>
    )

    return (
        <div className={styles.firmContent}>
            {loading ? (
                renderLoader()
            ) : (
                <>
                    <div className={styles.firmOperation}>
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
                            onChange={onTableChange}
                            rowSelection={rowSelection}
                            scroll={{
                                x: columns.length * 180,
                                y: 'calc(100vh - 270px)',
                            }}
                            pagination={{
                                total,
                                pageSize: searchCondition?.limit,
                                current: searchCondition?.offset,
                                showQuickJumper: true,
                                onChange: onPaginationChange,
                                showSizeChanger: true,
                                showTotal: (count) =>
                                    __('共${count}条', { count }),
                            }}
                            locale={{ emptyText: <Empty /> }}
                        />
                    )}
                </>
            )}
            {createVisible && (
                <Create
                    open={createVisible}
                    onCreateClose={() => setCreateVisible(false)}
                    onCreateSuccess={() => {
                        setCreateVisible(false)
                        getTableList({ ...searchCondition })
                    }}
                />
            )}

            {editVisible && (
                <Create
                    open={editVisible}
                    item={operateItem}
                    onCreateClose={() => setEditVisible(false)}
                    onCreateSuccess={() => {
                        setEditVisible(false)
                        getTableList({ ...searchCondition })
                    }}
                />
            )}

            {importVisible && (
                <Import
                    open={importVisible}
                    onImportClose={() => setImportVisible(false)}
                    onImportSuccess={() => {
                        setImportVisible(false)
                        getTableList({ ...searchCondition })
                    }}
                />
            )}
        </div>
    )
}

export default FirmTable
