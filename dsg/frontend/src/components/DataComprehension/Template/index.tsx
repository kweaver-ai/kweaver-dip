import { useAntdTable } from 'ahooks'
import { Button, message, Popconfirm, Space, Table, Tooltip } from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import { isNumber } from 'lodash'
import moment from 'moment'
import { useContext, useEffect, useMemo, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import dataEmpty from '@/assets/dataEmpty.svg'
import { FixedType } from '@/components/CommonTable/const'
import { RefreshBtn } from '@/components/ToolbarComponents'
import {
    deleteComprehensionTemplate,
    formatError,
    getComprehensionTemplate,
    SortDirection,
} from '@/core'
import { Loader, ReturnConfirmModal, SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import { OperateType } from '@/utils'
import DetailModal from './DetailModal'
import { DefaultMenu, initSearchCondition } from './helper'
import __ from './locale'
import OptModal from './OptModal'
import styles from './styles.module.less'
import { MicroWidgetPropsContext } from '@/context'

const ComprehensionTemplate = () => {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [loading, setLoading] = useState<boolean>(true)
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        createTime: 'descend',
    })

    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(DefaultMenu)

    const [searchCondition, setSearchCondition] = useState<any>({
        ...initSearchCondition,
    })

    const [tableHeight, setTableHeight] = useState<number>(0)
    const [initSearch, setInitSearch] = useState<boolean>(true)

    const hasSearchCondition = useMemo(() => {
        return searchCondition.keyword
    }, [searchCondition])

    useEffect(() => {
        // 展开/收起查询条件高度
        const defalutHeight: number = 276
        // 已选搜索条件高度
        const searchConditionHeight: number = hasSearchCondition ? 41 : 0
        const height = defalutHeight + searchConditionHeight

        setTableHeight(height)
    }, [hasSearchCondition])

    useEffect(() => {
        run({ ...searchCondition, current: searchCondition.offset })
    }, [])

    // 数据理解模板查询
    const getDataList = async (params) => {
        try {
            setLoading(true)
            const obj = params
            const res = await getComprehensionTemplate(obj)
            return { total: res.total_count, list: res.entries }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setLoading(false)
            setSelectedSort(undefined)
            setInitSearch(false)
        }
    }

    const { tableProps, run, pagination, refresh } = useAntdTable(getDataList, {
        defaultPageSize: 10,
        manual: true,
    })

    useEffect(() => {
        if (!initSearch) {
            run({ ...searchCondition, current: searchCondition.offset })
        }
    }, [searchCondition])

    const [curTemplate, setCurTemplate] = useState<any>()
    const [detailVisible, setDetailVisible] = useState<boolean>(false)
    const [optOpen, setOptOpen] = useState<boolean>(false)

    const handleDelete = async (id: string) => {
        try {
            await deleteComprehensionTemplate(id)
            message.success(__('删除成功'))
        } catch (error) {
            formatError(error)
        } finally {
            run({
                ...searchCondition,
                offset:
                    tableProps.dataSource.length === 1
                        ? pagination.current! - 1 || 1
                        : pagination.current!,
            })
        }
    }

    const handleOperate = async (op: OperateType, item?: any) => {
        switch (op) {
            case OperateType.DETAIL:
                setCurTemplate(item)
                setDetailVisible(true)
                break
            case OperateType.CREATE:
                // 创建
                setOptOpen(true)
                break
            case OperateType.EDIT:
                // 编辑
                setCurTemplate(item)
                setOptOpen(true)
                break
            case OperateType.DELETE:
                // 删除
                ReturnConfirmModal({
                    title: __('确定要删除该数据理解模板吗？'),
                    content: __('删除后已选公司信息将无法找回，请确认操作！'),
                    cancelText: __('取消'),
                    okText: __('确定'),
                    onOK: () => {
                        handleDelete(item?.id)
                    },
                    microWidgetProps,
                })
                break
            default:
                break
        }
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            if (sorter.columnKey === 'created_at') {
                setTableSort({
                    createTime: sorter.order || 'ascend',
                })
            } else {
                setTableSort({
                    createTime: null,
                })
            }
            return {
                key: sorter.columnKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }
        if (searchCondition.sort === 'created_at') {
            if (searchCondition.direction === SortDirection.ASC) {
                setTableSort({
                    createTime: 'descend',
                })
            } else {
                setTableSort({
                    createTime: 'ascend',
                })
            }
        } else if (searchCondition.sort === SortDirection.ASC) {
            setTableSort({
                createTime: null,
            })
        } else {
            setTableSort({
                createTime: null,
            })
        }
        return {
            key: searchCondition.sort,
            sort:
                searchCondition.direction === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC,
        }
    }

    const columns: any = [
        {
            title: __('数据理解模板名称'),
            dataIndex: 'name',
            key: 'name',
            width: 300,
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.ellipsisTitle} title={text}>
                    {text || '--'}
                </div>
            ),
        },
        {
            title: __('描述'),
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.ellipsisTitle} title={text}>
                    {text || '--'}
                </div>
            ),
        },
        {
            title: __('更新人'),
            dataIndex: 'updated_user',
            key: 'updated_user',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.ellipsisTitle} title={text}>
                    {text || '--'}
                </div>
            ),
        },
        {
            title: __('更新时间'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.createTime,
            showSorterTooltip: false,
            render: (text: any) => {
                return isNumber(text) && text
                    ? moment(text).format('YYYY-MM-DD HH:mm:ss')
                    : '--'
            },
        },
        {
            title: __('操作'),
            key: 'action',
            width: 180,
            fixed: FixedType.RIGHT,
            render: (_: string, record) => {
                const btnList: any[] = [
                    {
                        key: OperateType.DETAIL,
                        label: __('详情'),
                    },
                    {
                        key: OperateType.EDIT,
                        label: __('编辑'),
                    },
                    {
                        key: OperateType.DELETE,
                        label: __('删除'),
                        disabled: record?.relation_tag,
                    },
                ]
                return (
                    <Space size={16} className={styles.oprColumn}>
                        {btnList.map((item) => {
                            return (
                                <Tooltip
                                    title={
                                        item.diabled
                                            ? __(
                                                  '已关联数据理解任务,暂不可删除',
                                              )
                                            : ''
                                    }
                                    placement="bottom"
                                >
                                    <Button
                                        type="link"
                                        key={item.key}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleOperate(item.key, record)
                                        }}
                                        disabled={item.diabled}
                                    >
                                        {item.label}
                                    </Button>
                                </Tooltip>
                            )
                        })}
                    </Space>
                )
            },
        },
    ]

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
        switch (selectedMenu.key) {
            case 'created_at':
                setTableSort({
                    createTime:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                })
                break
            default:
                setTableSort({
                    createTime: null,
                })
                break
        }
    }

    const renderEmpty = () => {
        return (
            <Empty
                desc={
                    <div style={{ textAlign: 'center' }}>
                        <div> {__('暂无数据')}</div>
                        <div> {__('点击【新建】可新建数据理解模板')}</div>
                    </div>
                }
                iconSrc={dataEmpty}
            />
        )
    }

    // 翻页
    const pageChange = async (offset, limit) => {
        setSearchCondition({
            ...searchCondition,
            offset,
            limit,
        })
    }

    return (
        <div className={styles['comprehension-template']}>
            <div className={styles['operate-container']}>
                <Button
                    onClick={() => handleOperate(OperateType.CREATE)}
                    type="primary"
                >
                    <PlusOutlined />
                    {__('新建')}
                </Button>
                <Space size={16}>
                    <Space size={8}>
                        <SearchInput
                            className={styles.nameInput}
                            style={{ width: 272 }}
                            placeholder={__('搜索数据理解模板名称')}
                            onKeyChange={(kw: string) =>
                                setSearchCondition({
                                    ...searchCondition,
                                    keyword: kw,
                                    offset: 1,
                                })
                            }
                        />
                    </Space>
                    <span>
                        <RefreshBtn
                            onClick={() =>
                                setSearchCondition({ ...searchCondition })
                            }
                        />
                    </span>
                </Space>
            </div>
            {loading ? (
                <Loader />
            ) : (
                <div className={styles.table}>
                    {tableProps.dataSource.length === 0 &&
                    !hasSearchCondition ? (
                        <div className={styles.emptyWrapper}>
                            {renderEmpty()}
                        </div>
                    ) : (
                        <Table
                            className={classnames(styles.isExpansion)}
                            rowClassName={styles.tableRow}
                            columns={columns}
                            {...tableProps}
                            rowKey="id"
                            scroll={{
                                x: 1340,
                                y:
                                    tableProps.dataSource.length === 0
                                        ? undefined
                                        : `calc(100vh - ${tableHeight}px)`,
                            }}
                            pagination={{
                                ...tableProps.pagination,
                                onChange: pageChange,
                                hideOnSinglePage:
                                    (tableProps.pagination.total || 0) <= 10,
                                current: searchCondition.offset,
                                pageSize: searchCondition.limit,
                                pageSizeOptions: [10, 20, 50, 100],
                                showQuickJumper: true,
                                responsive: true,
                                showLessItems: true,
                                showSizeChanger: true,
                                showTotal: (count) => {
                                    return `共 ${count} 条记录 第 ${
                                        searchCondition.offset
                                    }/${Math.ceil(
                                        count / searchCondition.limit,
                                    )} 页`
                                },
                            }}
                            bordered={false}
                            locale={{
                                emptyText: <Empty />,
                            }}
                            onChange={(newPagination, filters, sorter) => {
                                if (
                                    newPagination.current ===
                                        searchCondition.offset &&
                                    newPagination.pageSize ===
                                        searchCondition.limit
                                ) {
                                    const selectedMenu =
                                        handleTableChange(sorter)
                                    setSelectedSort(selectedMenu)
                                    setSearchCondition({
                                        ...searchCondition,
                                        sort: selectedMenu.key,
                                        direction: selectedMenu.sort,
                                        offset: 1,
                                    })
                                } else {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: newPagination?.current || 1,
                                        limit: newPagination?.pageSize || 10,
                                    })
                                }
                            }}
                        />
                    )}
                </div>
            )}
            {optOpen && (
                <OptModal
                    id={curTemplate?.id}
                    onClose={(isRefresh?: boolean) => {
                        if (isRefresh) {
                            run({ ...searchCondition })
                        }
                        setOptOpen(false)
                        setCurTemplate(undefined)
                    }}
                />
            )}
            {detailVisible && (
                <DetailModal
                    id={curTemplate?.id}
                    onClose={() => {
                        setDetailVisible(false)
                        setCurTemplate(undefined)
                    }}
                    onEdit={() => {
                        setDetailVisible(false)
                        setOptOpen(true)
                    }}
                />
            )}
        </div>
    )
}

export default ComprehensionTemplate
