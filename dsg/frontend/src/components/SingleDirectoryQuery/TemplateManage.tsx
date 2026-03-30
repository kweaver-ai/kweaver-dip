import { Button, Space, Table, Tooltip } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useAntdTable, useBoolean } from 'ahooks'
import { ColumnType, SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import moment from 'moment'
import dataEmpty from '@/assets/dataEmpty.svg'
import DropDownFilter from '@/components/DropDownFilter'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import {
    SortDirection,
    delSingleCatalog,
    formatError,
    getSingleCatalogList,
} from '@/core'
import { AddOutlined, InfotipOutlined } from '@/icons'
import { ListDefaultPageSize, ListType, SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import { confirm } from '@/utils/modalHelper'
import BreadcrumbNav from './BreadcrumbNav'
import Details from './Details'
import __ from './locale'
import { useRouter } from './RouterStack'
import styles from './styles.module.less'

enum SortType {
    UPDATED = 'updated_at',
    NAME = 'name',
}

const menus = [
    { key: SortType.UPDATED, label: __('按更新时间排序') },
    { key: SortType.NAME, label: __('按模板名称排序') },
]

const defaultMenu = {
    key: SortType.UPDATED,
    sort: SortDirection.DESC,
}

const defaultLimit = ListDefaultPageSize[ListType.WideList]

export const errMsg = [
    '',
    __('权限变更'),
    __('该目录已下线'),
    __('该目录所属部门已变更'),
    __('您所在部门已变更，目录无法查询'),
]

const TemplateManage = () => {
    const { push } = useRouter()
    const [keyword, setKeyword] = useState('')
    const [searchCondition, setSearchCondition] = useState<any>({
        pageSize: defaultLimit,
        current: 1,
        sort: defaultMenu.key,
        direction: defaultMenu.sort,
        keyword,
    })
    const detailsRef = useRef<string>('')
    const [open, { setTrue, setFalse }] = useBoolean(false)
    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        updateAt: 'descend',
    })

    const getRulesList = async (params: any) => {
        const {
            current,
            pageSize = defaultLimit,
            keyword: kd,
            sort,
            direction,
        } = params

        try {
            const res = await getSingleCatalogList({
                offset: current,
                limit: pageSize,
                keyword: kd,
                sort,
                direction,
            })
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
            return { total: res.total_count, list: res.entries }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setSelectedSort(undefined)
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getRulesList, {
        defaultPageSize: defaultLimit,
        manual: true,
    })

    const delTemplateReq = async (id: string) => {
        const res = await delSingleCatalog(id)

        if (res.code) return

        run({ ...pagination, ...searchCondition })
    }

    const delTemplate = (ids: string) => {
        confirm({
            title: __('确定要删除模板吗？'),
            content: __('删除后该模板将无法被找回，请确认操作！'),
            onOk() {
                delTemplateReq(ids)
            },
        })
    }

    const columns: ColumnType<any>[] = [
        {
            title: __('模板名称（说明）'),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.name,
            showSorterTooltip: false,
            render(text: string, record: any) {
                const isDisabled = record.error_type !== 0
                return (
                    <>
                        <div title={text} className={styles.textOverflow}>
                            <span
                                className={classnames(styles.mr4, {
                                    [styles.disabled]: isDisabled,
                                })}
                            >
                                {text}
                            </span>
                            {isDisabled && (
                                <Tooltip
                                    title={errMsg[record.error_type]}
                                    color="#fff"
                                    placement="top"
                                    overlayInnerStyle={{
                                        color: 'rgba(0, 0, 0, 0.85)',
                                    }}
                                >
                                    <InfotipOutlined
                                        style={{ color: '#F5222D' }}
                                    />
                                </Tooltip>
                            )}
                        </div>
                        <div
                            title={record.description}
                            className={`${styles.descText} ${styles.textOverflow}`}
                        >
                            {record.description}
                        </div>
                    </>
                )
            },
        },
        {
            title: __('查询数据目录'),
            dataIndex: 'data_catalog_name',
            key: 'data_catalog_name',
            ellipsis: true,
        },
        {
            title: '更新时间',
            dataIndex: 'updated_at',
            key: 'updated_at',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.updateAt,
            showSorterTooltip: false,
            render(text: string) {
                return moment(text).format('YYYY-MM-DD HH:mm:ss')
            },
        },
        {
            title: __('操作'),
            dataIndex: 'operation',
            key: 'operation',
            ellipsis: true,
            width: 220,
            render(_, record: any) {
                const isDisabled = record.error_type !== 0
                return (
                    <div className={styles.tableOperation}>
                        <Button
                            type="link"
                            onClick={() => {
                                detailsRef.current = record.id
                                setTrue()
                            }}
                        >
                            {__('详情')}
                        </Button>
                        <Tooltip
                            title={isDisabled ? __('暂时无法进行编辑') : null}
                            overlayInnerStyle={{
                                color: 'rgba(0, 0, 0, 0.85)',
                            }}
                            color="#fff"
                            placement="top"
                        >
                            <Button
                                type="link"
                                disabled={isDisabled}
                                onClick={() => {
                                    push(`editSingleDirectory?id=${record.id}`)
                                }}
                            >
                                {__('编辑')}
                            </Button>
                        </Tooltip>
                        <Tooltip
                            title={
                                isDisabled ? __('暂时无法导入查询数据') : null
                            }
                            overlayInnerStyle={{
                                color: 'rgba(0, 0, 0, 0.85)',
                            }}
                            color="#fff"
                            placement="top"
                        >
                            <Button
                                type="link"
                                disabled={isDisabled}
                                onClick={() => {
                                    push(`importQueryCondition?q=${record.id}`)
                                }}
                            >
                                {__('导入')}
                            </Button>
                        </Tooltip>
                        <Button
                            type="link"
                            onClick={() => {
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
        run({ ...pagination, ...searchCondition })
    }, [searchCondition])

    const isSearch = useMemo(() => {
        const { keyword: kd } = searchCondition
        return kd !== undefined && kd !== null && kd !== ''
    }, [searchCondition])

    // 表格排序改变
    const handleTableChange = (sorter) => {
        const sortFieldsMap = {
            updated_at: 'updateAt',
            name: 'name',
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
            case 'name':
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
            current: 1,
        })
        setSelectedSort(selectedMenu)
        onChangeMenuToTableSort(selectedMenu)
    }

    return (
        <div className={styles.templateManageWrapper}>
            <div className={styles.pageTitle}>
                <BreadcrumbNav />
            </div>
            <div className={styles.top}>
                <div className={styles.topLeft}>
                    <Button
                        type="primary"
                        icon={<AddOutlined />}
                        onClick={() => {
                            push('createSingleDirectory')
                        }}
                    >
                        {__('新建')}
                    </Button>
                </div>
                <Space size={12} className={styles.topRight}>
                    <SearchInput
                        style={{ width: 272 }}
                        placeholder={__('搜索模板名称、查询数据目录')}
                        onKeyChange={(kw: string) => {
                            if (kw === searchCondition?.keyword) return
                            setSearchCondition({
                                ...searchCondition,
                                current: 1,
                                keyword: kw,
                            })
                            setKeyword(kw)
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
                                setFalse()
                            }}
                        />
                    </Space>
                </Space>
            </div>

            <div className={styles.bottom}>
                {!isSearch &&
                tableProps.dataSource.length === 0 &&
                !tableProps.loading ? (
                    <div className={styles.emptyWrapper}>
                        <Empty desc="暂无数据" iconSrc={dataEmpty} />
                    </div>
                ) : (
                    <Table
                        columns={columns}
                        {...tableProps}
                        rowKey="id"
                        onChange={(currentPagination, filters, sorter) => {
                            if (
                                currentPagination.current ===
                                searchCondition.current
                            ) {
                                const selectedMenu = handleTableChange(sorter)
                                setSelectedSort(selectedMenu)
                                setSearchCondition({
                                    ...searchCondition,
                                    sort: selectedMenu.key,
                                    direction: selectedMenu.sort,
                                    pageSize: currentPagination.pageSize,
                                    current: 1,
                                })
                            } else {
                                setSearchCondition({
                                    ...searchCondition,
                                    pageSize: currentPagination.pageSize,
                                    current: currentPagination?.current || 1,
                                })
                            }
                        }}
                        scroll={{
                            x: 500,
                            y:
                                tableProps.dataSource.length === 0
                                    ? undefined
                                    : tableProps.pagination.total > 20
                                    ? 'calc(100vh - 273px)'
                                    : 'calc(100vh - 273px)',
                        }}
                        pagination={{
                            ...tableProps.pagination,
                            hideOnSinglePage: tableProps.pagination.total <= 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            onChange(current, pageSize) {
                                setSearchCondition({
                                    ...searchCondition,
                                    current,
                                    pageSize,
                                })
                            },
                            showTotal(total, range) {
                                return `共 ${total} 条`
                            },
                        }}
                        bordered={false}
                        locale={{
                            emptyText: tableProps.loading ? (
                                <div style={{ height: 300 }} />
                            ) : (
                                <Empty />
                            ),
                        }}
                    />
                )}
            </div>
            <Details
                open={open}
                detailId={detailsRef.current}
                onClose={() => {
                    setFalse()
                }}
            />
        </div>
    )
}

export default TemplateManage
