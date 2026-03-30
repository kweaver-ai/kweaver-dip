import { Button, Table, Tooltip } from 'antd'
import { Key, useEffect, useMemo, useRef, useState } from 'react'

import { useAntdTable, useBoolean } from 'ahooks'
import { ColumnType, SortOrder } from 'antd/lib/table/interface'
import moment from 'moment'
import dataEmpty from '@/assets/dataEmpty.svg'
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'
import { disabledDate } from '@/components/MyAssets/helper'
import {
    addBatchViews,
    delBatchViews,
    formatError,
    getViewsInDataset,
    SortDirection,
} from '@/core'
import { AddOutlined } from '@/icons'
import { Empty } from '@/ui'
import { confirm } from '@/utils/modalHelper'
import { BusinessDomainType } from '../BusinessDomain/const'
import DropDownFilter from '../DropDownFilter'
import SearchLayout from '../SearchLayout'
import { SearchType } from '../SearchLayout/const'
import { SortBtn } from '../ToolbarComponents'
import AddViewModal from './AddViewModal'
import __ from './locale'
import styles from './styles.module.less'

enum SortType {
    UPDATED = 'updated_at',
    NAME = 'business_name',
}

const menus = [
    { key: SortType.UPDATED, label: __('按添加库表时间排序') },
    { key: SortType.NAME, label: __('按库表业务名称排序') },
]

const defaultMenu = {
    key: SortType.UPDATED,
    sort: SortDirection.DESC,
}

const searchFormData = [
    {
        label: __('库表名称、编码'),
        key: 'keyword',
        type: SearchType.Input,
        isAlone: true,
        itemProps: {
            maxLength: 255,
        },
    },
    {
        label: __('所属主题'),
        key: 'subject_id',
        type: SearchType.SelectThemeDomainTree,
        itemProps: {
            allowClear: true,
            unCategorizedObj: {
                id: '00000000-0000-0000-0000-000000000000',
                name: __('未分类'),
                type: BusinessDomainType.subject_domain_group,
            },
            selectableTypes: [
                BusinessDomainType.subject_domain_group,
                BusinessDomainType.subject_domain,
                BusinessDomainType.business_object,
                BusinessDomainType.business_activity,
            ],
            placeholder: __('请选择'),
        },
    },
    {
        label: __('所属部门'),
        key: 'department_id',
        type: SearchType.DepartmentAndOrgSelect,
        itemProps: {
            allowClear: true,
            unCategorizedObj: {
                id: '00000000-0000-0000-0000-000000000000',
                name: __('未分类'),
            },
            placeholder: __('请选择'),
        },
    },
    {
        label: __('添加库表时间'),
        key: 'times',
        type: SearchType.RangePicker,
        itemProps: {
            format: 'YYYY-MM-DD',
            disabledDate: (current: any) => disabledDate(current, {}),
        },
        startTime: 'created_at_start',
        endTime: 'created_at_end',
    },
]

const defaultLimit = 20

interface DatasetViewProps {
    id?: string
}

const DatasetView = (props: DatasetViewProps) => {
    const { id } = props
    const defaultSearch = {
        pageSize: defaultLimit,
        current: 1,
        sort: defaultMenu.key,
        direction: defaultMenu.sort,
        keyword: '',
        subject: '',
        department: '',
        updated_at: '',
    }
    const [searchCondition, setSearchCondition] = useState<any>(defaultSearch)
    // 防止出现竟态条件
    const detailIdRef = useRef<string>()
    const [detailId, setDetailId] = useState<string>()
    const [addView, { setTrue, setFalse }] = useBoolean(false)
    const [logicViewDetail, { setTrue: openDetail, setFalse: closeDetail }] =
        useBoolean(false)
    const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        updateAt: 'descend',
    })

    // 每次id更新重置条件
    useEffect(() => {
        setSearchCondition(defaultSearch)
    }, [id])

    const getRulesList = async (params: any) => {
        const {
            current,
            pageSize = defaultLimit,
            keyword: kd,
            sort,
            direction,
            subject,
            department,
        } = params

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
            const res = await getViewsInDataset({
                id: id!,
                limit: pageSize,
                offset: current,
                sort,
                direction,
                subject,
                department,
                keyword: kd,
            })
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

    const delTemplateReq = async (params: any) => {
        try {
            const res = await delBatchViews(params)

            // if (res.code) return

            run({ ...pagination, ...searchCondition })
        } catch (error) {
            formatError(error)
        }
    }

    const delTemplate = (ids: string[], isBatch = false) => {
        confirm({
            title: __('确定要移除${isBatch}库表吗？', {
                isBatch: isBatch ? __('已选') : '',
            }),
            content: __('移除后不会影响被移除库表的数据，可重新添加'),
            onOk() {
                delTemplateReq({ id, form_view_ids: ids })
            },
        })
    }

    useEffect(() => {
        if (logicViewDetail) {
            setDetailId(detailIdRef.current)
        } else {
            setDetailId(undefined)
        }
    }, [logicViewDetail])

    const columns: ColumnType<any>[] = [
        {
            title: __('库表业务名称（编码）'),
            dataIndex: 'business_name',
            key: 'business_name',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.name,
            showSorterTooltip: false,
            width: 230,
            render(text: string, record: any) {
                return (
                    <>
                        <div
                            title={text}
                            className={`${styles.textOverflow} ${styles.breadcrumb}`}
                            onClick={() => {
                                detailIdRef.current = record.id
                                openDetail()
                            }}
                        >
                            {text}
                        </div>
                        <div
                            title={record.uniform_catalog_code}
                            className={`${styles.descText} ${styles.textOverflow}`}
                        >
                            {record.uniform_catalog_code}
                        </div>
                    </>
                )
            },
        },
        {
            title: __('库表技术名称'),
            dataIndex: 'technical_name',
            key: 'technical_name',
            ellipsis: true,
            render: (text: string) => text || '--',
        },
        {
            title: __('所属主题'),
            dataIndex: 'subject_name',
            key: 'subject_name',
            ellipsis: true,
            render: (text: string) => text || '--',
        },
        {
            title: __('所属部门'),
            dataIndex: 'department_name',
            key: 'department_name',
            ellipsis: true,
            render: (text: string) => text || '--',
        },
        {
            title: __('添加库表时间'),
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
                            onClick={() => {
                                detailIdRef.current = record.id
                                openDetail()
                            }}
                        >
                            {__('详情')}
                        </Button>
                        <Button
                            type="link"
                            onClick={() => {
                                delTemplate([record.id])
                            }}
                        >
                            {__('移除')}
                        </Button>
                    </div>
                )
            },
        },
    ]

    useEffect(() => {
        if (id) {
            run({ ...pagination, ...searchCondition })
        }
    }, [searchCondition, id])

    const isSearch = useMemo(() => {
        const { keyword: kd, subject, department, updated_at } = searchCondition
        return kd || subject || department || updated_at
    }, [searchCondition])

    // 表格排序改变
    const handleTableChange = (sorter) => {
        const sortFieldsMap = {
            updated_at: 'updateAt',
            business_name: 'name',
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
            case 'business_name':
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

    // 选择库表
    const handleChooseView = async (values) => {
        try {
            const ids = values.map((item) => item.id)
            await addBatchViews({ id: id!, form_view_ids: ids })
        } catch (error) {
            formatError(error)
        }
        run({ ...pagination, ...searchCondition })
        setFalse()
    }

    const onSelectChange = (newSelectedRowKeys: Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys)
    }

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    }

    const canRemove = selectedRowKeys.length > 0
    const canAddView = tableProps.pagination.total < 200

    return (
        <div className={styles.datasetView}>
            <div className={styles.pageTitle}>{__('数据集中库表')}</div>
            {!id ? (
                <div className={styles.emptyWrapper}>
                    <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                </div>
            ) : !isSearch &&
              tableProps.dataSource.length === 0 &&
              !tableProps.loading ? (
                <div className={styles.emptyWrapper}>
                    <Empty
                        desc={__('可点击【添加库表】按钮为数据集中添加库表')}
                        iconSrc={dataEmpty}
                    />
                    <div className={styles.mt16}>
                        <Button
                            disabled={!canAddView}
                            type="primary"
                            ghost
                            icon={<AddOutlined />}
                            onClick={() => {
                                setTrue()
                            }}
                        >
                            {__('添加库表')}
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    <div className={styles.headerOperation}>
                        <SearchLayout
                            formData={searchFormData}
                            onSearch={(queryData) => {
                                const {
                                    created_at_end,
                                    created_at_start,
                                    department_id,
                                    subject_id,
                                    keyword: kd,
                                } = queryData ?? {}
                                setSearchCondition((prevCondition) => ({
                                    ...prevCondition,
                                    department: department_id,
                                    subject: subject_id,
                                    updated_at: `${created_at_start},${created_at_end}`,
                                    keyword: kd,
                                }))
                            }}
                            expansion
                            // ref={searchRef}
                            prefixNode={
                                <div className={styles.searchBtnWrapper}>
                                    <Tooltip
                                        title={
                                            canAddView
                                                ? null
                                                : __('仅支持添加200张库表')
                                        }
                                    >
                                        <Button
                                            disabled={!canAddView}
                                            type="primary"
                                            ghost
                                            icon={<AddOutlined />}
                                            onClick={() => {
                                                setTrue()
                                            }}
                                        >
                                            {__('添加库表')}
                                        </Button>
                                    </Tooltip>
                                    <Tooltip
                                        title={
                                            !canRemove
                                                ? __('请先选择要移除的库表')
                                                : null
                                        }
                                        placement="top"
                                    >
                                        <Button
                                            disabled={!canRemove}
                                            onClick={() => {
                                                delTemplate(
                                                    selectedRowKeys.map((key) =>
                                                        key.toString(),
                                                    ),
                                                    true,
                                                )
                                            }}
                                        >
                                            {__('移除')}
                                        </Button>
                                    </Tooltip>
                                </div>
                            }
                            suffixNode={
                                <SortBtn
                                    contentNode={
                                        <DropDownFilter
                                            menus={menus}
                                            defaultMenu={defaultMenu}
                                            menuChangeCb={handleMenuChange}
                                            changeMenu={selectedSort}
                                            overlayStyle={{ width: 170 }}
                                        />
                                    }
                                />
                            }
                        />
                    </div>

                    <div className={styles.bottom}>
                        <Table
                            columns={columns}
                            {...tableProps}
                            rowKey="id"
                            rowSelection={rowSelection}
                            onChange={(currentPagination, filters, sorter) => {
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
                                        pageSize: currentPagination.pageSize,
                                        current: 1,
                                    })
                                } else {
                                    setSearchCondition({
                                        ...searchCondition,
                                        pageSize: currentPagination.pageSize,
                                        current:
                                            currentPagination?.current || 1,
                                    })
                                }
                            }}
                            scroll={{
                                x: 1000,
                                y:
                                    tableProps.dataSource.length === 0
                                        ? undefined
                                        : tableProps.pagination.total > 10
                                        ? 'calc(100vh - 314px)'
                                        : 'calc(100vh - 250px)',
                            }}
                            pagination={{
                                ...tableProps.pagination,
                                hideOnSinglePage:
                                    tableProps.pagination.total <= 10,
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
                    </div>
                </>
            )}
            <AddViewModal
                open={addView}
                dataSetId={id!}
                onClose={() => {
                    setFalse()
                    // setDeletable(true)
                }}
                onSure={handleChooseView}
            />
            <LogicViewDetail
                open={logicViewDetail}
                onClose={() => {
                    closeDetail()
                }}
                id={detailId}
            />
        </div>
    )
}

export default DatasetView
