import { useAntdTable, useUpdateEffect } from 'ahooks'
import { Button, Space, Table, Modal, Switch, message } from 'antd'
import { InfoCircleFilled } from '@ant-design/icons'
import { useEffect, useState, useMemo } from 'react'
import { SortOrder } from 'antd/lib/table/interface'
import moment from 'moment'
import empty from '@/assets/dataEmpty.svg'
import {
    formatError,
    getObjects,
    tagAuthDetele,
    tagAuthUpdateState,
    getOrgObjectsSyncTime,
    syncOrgObjects,
    SortDirection,
} from '@/core'
import { AddOutlined, FontIcon } from '@/icons'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import { SearchInput, Empty, Loader, LightweightSearch } from '@/ui'
import __ from '../locale'
import styles from './styles.module.less'
// import CreateAuth from '../CreateAuth'
import OrgDetails from '../Details'
import { StateLabel } from '@/components/BusinessTagClassify/helper'
import { stateLableType } from '@/components/BusinessTagClassify/const'
import DropDownFilter from '@/components/DropDownFilter'
import { defaultMenu, OrgType, menus, typeOptions, searchData } from '../const'
import { nodeInfo, Architecture } from '@/components/BusinessArchitecture/const'
import { organizationType } from '../helper'

interface ITagAuthTable {
    selectedNode: any
}
const TagAuthTable = (props: ITagAuthTable) => {
    const { selectedNode } = props
    const [searchKey, setSearchKey] = useState('')
    const [searchCondition, setSearchCondition] = useState<any>({
        limit: 10,
        offset: 1,
        keyword: '',
        sort: 'updated_at',
    })
    const [detailsVisible, setDetailsVisible] = useState<boolean>(false)
    const [syncLoad, setSyncLoad] = useState<boolean>(false)
    const [isInit, setIsInit] = useState<boolean>(false)
    const [toEdit, setToEdit] = useState<boolean>(false)
    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        updated_at: 'descend',
    })
    const [selectedRow, setSelectedRow] = useState<any>()
    const [syncTime, setSyncTime] = useState<string>('')

    const showTopEdit = useMemo(() => {
        const path = window.location.pathname
        return (
            // path.startsWith('/anyfabric/ca/') &&
            selectedNode?.id && selectedNode.type !== Architecture.ORGANIZATION
        )
    }, [selectedNode])

    // 获取列表
    const getTableData = async (params) => {
        const { offset, limit, sort, subtype, direction, keyword } = params
        try {
            const res: any = await getObjects({
                id: selectedNode.id,
                keyword,
                offset,
                limit,
                sort,
                direction,
                subtype,
            })
            return {
                total: res?.total_count,
                list: res?.entries || [],
            }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setIsInit(true)
            setSelectedSort(undefined)
        }
    }
    const { tableProps, run, pagination, loading } = useAntdTable(
        getTableData,
        {
            defaultPageSize: 10,
            manual: true,
        },
    )
    useEffect(() => {
        if (!isInit) return
        run({ ...searchCondition, current: searchCondition.offset })
    }, [searchCondition])

    useEffect(() => {
        getSystems()
    }, [])

    useUpdateEffect(() => {
        run(searchCondition)
    }, [selectedNode?.id])

    useUpdateEffect(() => {
        if (searchKey === searchCondition.keyword) return
        setSearchCondition({
            ...searchCondition,
            keyword: searchKey,
            limit: 10,
            offset: 1,
        })
    }, [searchKey])

    // 获取同步时间
    const getSystems = async () => {
        try {
            const res = await getOrgObjectsSyncTime()
            setSyncTime(
                res?.synced_at
                    ? moment(res?.synced_at).format('YYYY-MM-DD HH:mm:ss')
                    : '--',
            )
        } catch (err) {
            formatError(err)
        }
    }
    // 数据同步
    const onSyncOrgObjects = async () => {
        try {
            setSyncLoad(true)
            await syncOrgObjects()
            getSystems()
            run(searchCondition)
        } catch (err) {
            formatError(err)
        } finally {
            setSyncLoad(false)
        }
    }

    // 空库表
    const renderEmpty = () => {
        const createView = <Empty desc={__('暂无数据')} iconSrc={empty} />
        return searchKey ? <Empty /> : createView
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
            name: null,
            updated_at: null,
            [selectedMenu.key]:
                selectedMenu.sort === SortDirection.ASC ? 'ascend' : 'descend',
        })
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        const sorterKey = sorter.columnKey

        if (sorter.column) {
            setTableSort({
                updated_at: null,
                name: null,
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
            updated_at: null,
            name: null,
            [sorterKey]:
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

    // 列表项
    const columns: any = [
        {
            title: __('名称'),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.name,
            fixed: 'left',
            render: (value, record) => {
                return (
                    <div
                        className={styles.tableName}
                        onClick={() => onClickRow(record)}
                    >
                        {value || '--'}
                    </div>
                )
            },
        },
        {
            title: __('路径'),
            dataIndex: 'path',
            key: 'path',
            ellipsis: true,
            render: (value) => value || '--',
        },
        {
            title: __('类型'),
            dataIndex: 'subtype',
            key: 'subtype',
            ellipsis: true,
            render: (value, record) => organizationType(record),
        },
        {
            title: __('更新时间'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            sorter: true,
            sortOrder: tableSort.updated_at,
            showSorterTooltip: false,
            ellipsis: true,
            width: 220,
            render: (value) =>
                value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : '--',
        },
        {
            title: __('操作'),
            dataIndex: 'action',
            key: 'action',
            width: 160,
            fixed: 'right',
            render: (value, record) => {
                const path = window.location.pathname
                const showEdit =
                    // path.startsWith('/anyfabric/ca/') &&
                    record.type !== Architecture.ORGANIZATION
                return showEdit ? (
                    <Button
                        type="link"
                        onClick={(e) => {
                            e.stopPropagation()
                            onClickRow(record)
                            setToEdit(true)
                        }}
                    >
                        {__('编辑部门职责')}
                    </Button>
                ) : (
                    '--'
                )
            },
        },
    ]

    // 点击选中表格某一行，再次点击取消选中 属性展示树节点信息
    const onClickRow = (record) => {
        // 取消选中，获取选中树节点数据
        // if (selectedRow?.id === record.id) {
        //     setSelectedRow(undefined)
        //     return
        // }
        setSelectedRow(record)
        setDetailsVisible(true)
    }

    return (
        <div className={styles.orgTableWrapper}>
            <div className={styles.top}>
                <div className={styles.titleWrapper}>
                    <span className={styles.name} title={selectedNode?.name}>
                        {selectedNode?.name}
                    </span>
                    <div className={styles.text}>
                        {selectedNode?.id ? (
                            <span>（{organizationType(selectedNode)}）</span>
                        ) : null}
                    </div>
                </div>
                <div className={styles.rightText}>
                    {showTopEdit ? (
                        <Button
                            type="link"
                            onClick={(e) => {
                                e.stopPropagation()
                                onClickRow(selectedNode)
                                setToEdit(true)
                            }}
                        >
                            {__('编辑')}
                        </Button>
                    ) : null}
                </div>
            </div>
            <div className={styles.top}>
                <div className={styles.topLeft}>
                    {/* <Button
                        type="primary"
                        disabled={
                            selectedNode?.state === stateLableType.unenable
                        }
                        className={styles.topLeft}
                        icon={<FontIcon name="icon-shujutongbu" />}
                        loading={syncLoad}
                        onClick={() => onSyncOrgObjects()}
                    >
                        {__('数据同步')}
                    </Button>
                    <div className={styles.text}>
                        {__('数据同步时间：${time}', {
                            time: syncTime || '--',
                        })}
                    </div> */}
                </div>
                <Space
                    size={12}
                    className={styles.topRight}
                    style={{
                        visibility:
                            !searchKey &&
                            !searchCondition?.subtype &&
                            tableProps.dataSource.length === 0
                                ? 'hidden'
                                : 'visible',
                    }}
                >
                    <SearchInput
                        style={{ width: 272 }}
                        placeholder={__('搜索名称')}
                        onKeyChange={(kw: string) => {
                            setSearchKey(kw)
                        }}
                        onPressEnter={(e: any) =>
                            setSearchCondition({
                                ...searchCondition,
                                offset: 1,
                                keyword: e.target.value,
                            })
                        }
                    />
                    <LightweightSearch
                        formData={searchData}
                        onChange={(data, key) =>
                            setSearchCondition({
                                ...searchCondition,
                                ...data,
                                current: 1,
                            })
                        }
                        defaultValue={{ subtype: '' }}
                    />
                    <Space size={0}>
                        <SortBtn
                            contentNode={
                                <DropDownFilter
                                    menus={menus}
                                    defaultMenu={defaultMenu}
                                    menuChangeCb={handleMenuChange}
                                    changeMenu={selectedSort}
                                />
                            }
                        />
                        <RefreshBtn
                            onClick={() =>
                                setSearchCondition({
                                    ...searchCondition,
                                    offset: 1,
                                })
                            }
                        />
                    </Space>
                </Space>
            </div>
            {tableProps.dataSource.length ||
            !!searchKey ||
            (!tableProps.dataSource.length &&
                tableProps.pagination.current !== 1) ? (
                <Table
                    columns={columns}
                    {...tableProps}
                    rowKey="id"
                    scroll={{
                        x: 1340,
                        y:
                            tableProps.dataSource.length === 0
                                ? undefined
                                : `calc(100vh - 278px)`,
                    }}
                    loading={loading ? { tip: __('加载中...') } : false}
                    pagination={{
                        ...tableProps.pagination,
                        current: searchCondition?.offset,
                        pageSize: searchCondition?.limit,
                        pageSizeOptions: [10, 20, 50, 100],
                        showQuickJumper: true,
                        showSizeChanger: true,
                        hideOnSinglePage: tableProps.pagination.total <= 10,
                        showTotal: (totalCount) => {
                            return `共 ${totalCount} 条记录`
                        },
                    }}
                    bordered={false}
                    locale={{
                        emptyText: <Empty />,
                    }}
                    onChange={(currentPagination, filters, sorter) => {
                        const selectedMenu = handleTableChange(sorter)
                        setSelectedSort(selectedMenu)
                        setSearchCondition((prev) => ({
                            ...prev,
                            sort: selectedMenu.key,
                            direction: selectedMenu.sort,
                            offset: currentPagination.current,
                            limit: currentPagination.pageSize,
                        }))
                    }}
                />
            ) : loading ? (
                <Loader />
            ) : (
                <div className={styles.emptyWrapper}>{renderEmpty()}</div>
            )}
            {detailsVisible && (
                <OrgDetails
                    open={detailsVisible}
                    toEdit={toEdit}
                    id={selectedRow?.id}
                    onClose={() => {
                        setToEdit(false)
                        setDetailsVisible(false)
                    }}
                    updateList={() => run(searchCondition)}
                />
            )}
        </div>
    )
}

export default TagAuthTable
