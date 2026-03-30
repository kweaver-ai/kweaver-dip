import { Button, Space, Spin, Table } from 'antd'

import { useDebounce, useInfiniteScroll } from 'ahooks'
import { ColumnType, SortOrder } from 'antd/lib/table/interface'
import moment from 'moment'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import {
    delDataset,
    formatError,
    getDatasetList,
    IDataset,
    SortDirection,
} from '@/core'
import { AddOutlined } from '@/icons'
import { Empty, SearchInput } from '@/ui'
import { confirm } from '@/utils/modalHelper'
import DropDownFilter from '../DropDownFilter'
import { RefreshBtn, SortBtn } from '../ToolbarComponents'
import CreateModal from './CreateModal'
import DatasetView from './DatasetView'
import __ from './locale'
import styles from './styles.module.less'

enum SortType {
    UPDATED = 'updated_at',
    NAME = 'data_set_name',
}

const menus = [
    { key: SortType.UPDATED, label: __('按更新时间排序') },
    { key: SortType.NAME, label: __('按数据集名称排序') },
]

const defaultMenu = {
    key: SortType.UPDATED,
    sort: SortDirection.DESC,
}

const defaultLimit = 10

const Dataset = () => {
    const createRef = useRef<{ setTrue: () => void }>(null)
    const [searchCondition, setSearchCondition] = useState<any>({
        sort: defaultMenu.key,
        direction: defaultMenu.sort,
        keyword: '',
    })
    const debounceCondition = useDebounce(searchCondition)
    const [loading, setLoading] = useState(false)
    const [dataSource, setDataSource] = useState<any>([])
    const [selectedRow, setSelectedRow] = useState<string>()
    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        updateAt: 'descend',
    })
    const [editItem, setEditItem] = useState<IDataset & { id: string }>()
    const curOffset = useRef<number>(1)

    const getRulesList = async (offset, limit = defaultLimit) => {
        try {
            // const res = {
            //     entries: [
            //         {
            //             name: '这里是存为模板的名称模板的名称很长占位符…',
            //             id: '1',
            //             data_catalog_name: 'custom',
            //         },
            //         {
            //             name: '这里是存为模板的名称模板的名称很长占位符…',
            //             id: '2',
            //             data_catalog_name: 'custom',
            //         },
            //         {
            //             name: '这里是存为模板的名称模板的名称很长占位符…',
            //             id: '3',
            //             data_catalog_name: 'custom',
            //         },
            //         {
            //             name: '这里是存为模板的名称模板的名称很长占位符…',
            //             id: '4',
            //             data_catalog_name: 'custom',
            //         },
            //         {
            //             name: '这里是存为模板的名称模板的名称很长占位符…',
            //             id: '5',
            //             data_catalog_name: 'custom',
            //         },
            //         {
            //             name: '这里是存为模板的名称模板的名称很长占位符…',
            //             id: '6',
            //             data_catalog_name: 'custom',
            //         },
            //     ],
            //     total_count: 100,
            // }
            setLoading(true)
            const res = await getDatasetList({
                limit,
                offset,
                ...searchCondition,
            })
            return {
                total: res.total_count,
                data: res.entries,
                list: res.entries,
            }
        } catch (error) {
            formatError(error)
            return { total: 0, data: [], list: [] }
        } finally {
            setSelectedSort(undefined)
        }
    }

    const {
        data,
        loading: initLoading,
        loadingMore,
        noMore,
        loadMore,
        reload: updateList,
        error,
    } = useInfiniteScroll<{
        data: any[]
        list: any[]
        total: number
    }>(
        () => {
            return getRulesList(curOffset.current)
        },
        {
            target: () =>
                document.querySelector(
                    '#dataset-table .any-fabric-ant-table-body',
                ),
            manual: true,
            isNoMore: (d: any) => {
                return d?.data?.length < defaultLimit || false
            },
            onSuccess: (d) => {
                curOffset.current += 1
            },
            onFinally: () => {
                setLoading(false)
            },
            // reloadDeps: [debounceCondition],
        },
    )

    useEffect(() => {
        const list: any[] = data?.data ?? []
        if (curOffset.current === 1) {
            setSelectedRow(list[0]?.id)
            setDataSource(list)
        } else {
            setDataSource([...dataSource, ...list])
        }
    }, [data])

    const delTemplateReq = async (id: string) => {
        try {
            await delDataset(id)
            curOffset.current = 1
            updateList()
        } catch (err) {
            formatError(err)
        }
    }

    const delTemplate = (ids: string) => {
        confirm({
            title: __('确定要删除数据集吗？'),
            content: __('删除数据集后，其所包含的库表均会被移除，请确认操作！'),
            onOk() {
                delTemplateReq(ids)
            },
        })
    }

    const columns: ColumnType<any>[] = [
        {
            title: __('数据集名称（描述）'),
            dataIndex: 'data_set_name',
            key: 'data_set_name',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.name,
            showSorterTooltip: false,
            render(text: string, record: any) {
                return (
                    <>
                        <div title={text} className={styles.textOverflow}>
                            {text}
                        </div>
                        <div
                            title={record.data_set_description}
                            className={`${styles.descText} ${styles.textOverflow}`}
                        >
                            {record.data_set_description || __('暂无描述')}
                        </div>
                    </>
                )
            },
        },
        {
            title: __('更新时间'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.updateAt,
            showSorterTooltip: false,
            width: 180,
            render(text: string) {
                return moment(text).format('YYYY-MM-DD HH:mm:ss')
            },
        },
        {
            title: __('操作'),
            dataIndex: 'operation',
            key: 'operation',
            ellipsis: true,
            width: 90,
            render(_, record: any) {
                return (
                    <div className={styles.tableOperation}>
                        <Button
                            type="link"
                            onClick={(e) => {
                                e.stopPropagation()
                                setEditItem({
                                    ...record,
                                    description: record.data_set_description,
                                })
                                if (createRef.current) {
                                    createRef.current.setTrue()
                                }
                            }}
                        >
                            {__('编辑')}
                        </Button>
                        <Button
                            type="link"
                            onClick={(e) => {
                                e.stopPropagation()
                                delTemplate(record.id)
                            }}
                        >
                            {__('删除')}
                        </Button>
                    </div>
                )
            },
        },
    ]

    useEffect(() => {
        curOffset.current = 1
        updateList()
    }, [searchCondition])

    const isSearch = useMemo(() => {
        const { keyword: kd } = searchCondition
        return kd !== undefined && kd !== null && kd !== ''
    }, [searchCondition])

    // 表格排序改变
    const handleTableChange = (sorter) => {
        const sortFieldsMap = {
            updated_at: 'updateAt',
            data_set_name: 'name',
        }
        const switchSortColumn = (
            source: { [key: string]: SortOrder },
            selectedKey: string,
            sortValue: SortOrder,
        ) => {
            const newState = { ...source }

            Object.keys(source).forEach((key) => {
                if (sortFieldsMap[selectedKey] === key) {
                    newState[key] = sortValue
                } else {
                    newState[key] = null
                }
            })
            return newState
        }
        if (sorter.column) {
            setTableSort((prevState) =>
                switchSortColumn(
                    prevState,
                    sorter.columnKey,
                    sorter.order || 'ascend',
                ),
            )
            return {
                key: sorter.columnKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }
        // 当表格排序字段为undefined
        const { sort } = searchCondition
        setTableSort((prevState) => {
            return switchSortColumn(
                prevState,
                sort,
                searchCondition.direction === SortDirection.ASC
                    ? 'descend'
                    : 'ascend',
            )
        })
        return {
            key: searchCondition.sort,
            sort:
                searchCondition.direction === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC,
        }
    }

    const onChangeMenuToTableSort = (selectedMenu) => {
        switch (selectedMenu.key) {
            case 'data_set_name':
                setTableSort({
                    name:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    updateAt: null,
                })
                break
            case 'updated_at':
                setTableSort({
                    name: null,
                    updateAt:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                })
                break
            default:
                setTableSort({
                    name: null,
                    updateAt: null,
                })
                break
        }
    }

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition({
            ...searchCondition,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
        })
        setSelectedSort(selectedMenu)
        onChangeMenuToTableSort(selectedMenu)
    }

    const onClickRow = (record) => {
        setSelectedRow(record.id)
    }

    const createDataset = () => {
        setEditItem(undefined)
        if (createRef.current) {
            createRef.current.setTrue()
        }
    }

    const defaultView = (
        <div className={styles.defaultView}>
            <div className={styles.pageTitle}>{__('我的数据集')}</div>
            <div className={styles.emptyWrapper}>
                <Empty
                    desc={
                        <div>
                            <div>
                                {__('点击【新建数据集】按钮创建数据集后，')}
                            </div>
                            <div>{__('添加库表至数据集中')}</div>
                        </div>
                    }
                    iconSrc={dataEmpty}
                />
                <div className={styles.mt16}>
                    <Button
                        icon={<AddOutlined />}
                        type="primary"
                        onClick={createDataset}
                    >
                        {__('新建数据集')}
                    </Button>
                </div>
            </div>
        </div>
    )

    return (
        <div className={styles.datasetWrapper}>
            {!isSearch && dataSource.length === 0 && !initLoading ? (
                defaultView
            ) : (
                <>
                    <div className={styles.myDataset}>
                        <div className={styles.pageTitle}>
                            {__('我的数据集')}
                        </div>
                        <div className={styles.top}>
                            <div className={styles.topLeft}>
                                <Button
                                    type="primary"
                                    icon={<AddOutlined />}
                                    onClick={createDataset}
                                >
                                    {__('新建数据集')}
                                </Button>
                            </div>
                            <Space size={12} className={styles.topRight}>
                                <SearchInput
                                    style={{ width: 272 }}
                                    placeholder={__('搜索数据集名称')}
                                    onKeyChange={(kw: string) => {
                                        if (kw === searchCondition?.keyword)
                                            return
                                        setSearchCondition({
                                            ...searchCondition,
                                            current: 1,
                                            keyword: kw,
                                        })
                                    }}
                                />
                                <Space size={0}>
                                    <SortBtn
                                        contentNode={
                                            <DropDownFilter
                                                menus={menus}
                                                defaultMenu={defaultMenu}
                                                menuChangeCb={handleMenuChange}
                                                changeMenu={selectedSort}
                                                overlayStyle={{ width: 160 }}
                                            />
                                        }
                                    />
                                    <RefreshBtn
                                        onClick={() => {
                                            setSearchCondition({
                                                ...searchCondition,
                                                current: 1,
                                            })
                                        }}
                                    />
                                </Space>
                            </Space>
                        </div>

                        <div className={styles.bottom}>
                            <Table
                                columns={columns}
                                dataSource={dataSource}
                                loading={initLoading}
                                rowKey="id"
                                id="dataset-table"
                                onChange={(
                                    currentPagination,
                                    filters,
                                    sorter,
                                ) => {
                                    if (
                                        currentPagination.current ===
                                        searchCondition.current
                                    ) {
                                        const selectedMenu =
                                            handleTableChange(sorter)
                                        setSelectedSort(selectedMenu)
                                        setSearchCondition({
                                            ...searchCondition,
                                            sort: selectedMenu.key,
                                            direction: selectedMenu.sort,
                                        })
                                    } else {
                                        setSearchCondition({
                                            ...searchCondition,
                                        })
                                    }
                                    curOffset.current = 1
                                }}
                                scroll={{
                                    x: 500,
                                    y:
                                        dataSource.length === 0
                                            ? undefined
                                            : 'calc(100vh - 250px)',
                                }}
                                pagination={false}
                                bordered={false}
                                summary={() =>
                                    (dataSource?.length > 0 && (
                                        <div className={styles['text-center']}>
                                            {loadingMore && (
                                                <Spin size="small" />
                                            )}
                                            {noMore && <span>没有更多了</span>}
                                            {error && (
                                                <span
                                                    className={
                                                        styles[
                                                            'text-center-retry'
                                                        ]
                                                    }
                                                >
                                                    加载失败
                                                    <br />
                                                    <a
                                                        onClick={() => {
                                                            loadMore()
                                                        }}
                                                    >
                                                        重试
                                                    </a>
                                                </span>
                                            )}
                                        </div>
                                    )) as any
                                }
                                rowClassName={(record) =>
                                    record.id === selectedRow
                                        ? 'any-fabric-ant-table-row-selected'
                                        : ''
                                }
                                onRow={(record) => ({
                                    onClick: () => onClickRow(record),
                                })}
                                locale={{
                                    emptyText: loading ? (
                                        <div style={{ height: 300 }} />
                                    ) : (
                                        <Empty />
                                    ),
                                }}
                            />
                        </div>
                    </div>
                    <DatasetView id={selectedRow} />
                </>
            )}
            <CreateModal
                ref={createRef}
                defaultValue={editItem}
                onConfirm={(id) => {
                    if (id) {
                        setSelectedRow(id)
                    }
                    curOffset.current = 1
                    updateList()
                }}
            />
        </div>
    )
}

export default memo(Dataset)
