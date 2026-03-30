import {
    ExclamationCircleFilled,
    InfoCircleFilled,
    PlusOutlined,
} from '@ant-design/icons'
import { Button, message, Pagination, Space, Table, Tooltip } from 'antd'
import { debounce } from 'lodash'
import React, { useEffect, useState } from 'react'

import { SortOrder } from 'antd/lib/table/interface'
import moment from 'moment'
import {
    checkRecognitionAlgorithmsIsUsed,
    deleteForceRecognitionAlgorithms,
    enableRecognitionAlgorithm,
    exportRecognitionAlgorithm,
    formatError,
    getRecognitionAlgorithms,
    SortDirection,
    stopRecognitionAlgorithm,
} from '@/core'
import {
    Empty,
    LightweightSearch,
    OptionBarTool,
    OptionMenuType,
    SearchInput,
} from '@/ui'
import { streamToFile } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import DropDownFilter from '../DropDownFilter'
import { RefreshBtn, SortBtn } from '../ToolbarComponents'
import AlgorithmDetail from './AlgorithmDetail'
import {
    AlgorithmStatus,
    AlgorithmType,
    defaultMenu,
    menus,
    OperationType,
    OperationTypeMap,
} from './const'
import CreateAlgorithm from './CreateAlgorithm'
import { filterItems, StatusLabel } from './helper'
import __ from './locale'
import styles from './styles.module.less'
import UsedDataModal from './UsedDataModal'

const DataTable = () => {
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        createAt: null,
        updatedAt: 'descend',
    })

    // 数据源
    const [dataSource, setDataSource] = useState<Array<any>>([])

    // 总数
    const [total, setTotal] = useState<number>(0)

    // 查询参数
    const [queryParams, setQueryParams] = useState<any>({
        offset: 1,
        limit: 10,
        keyword: '',
        status: '',
        sort: defaultMenu.key,
        direction: defaultMenu.sort,
    })

    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)

    // 新建算法弹窗
    const [createOpen, setCreateOpen] = useState<boolean>(false)

    // 操作算法id
    const [operationId, setOperationId] = useState<string>('')
    // 算法详情弹窗
    const [showDetail, setShowDetail] = useState<boolean>(false)

    // 选中行id
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    // 编辑弹窗
    const [showEdit, setShowEdit] = useState<boolean>(false)

    // 被使用的数据
    const [usedData, setUsedData] = useState<Array<string>>([])

    // 是否显示被使用数据弹窗
    const [showUsedModal, setShowUsedModal] = useState<boolean>(false)

    // 删除成功数据
    const [deleteSuccessCount, setDeleteSuccessCount] = useState<number>(0)

    // 获取表格数据
    useEffect(() => {
        getTableData()
    }, [queryParams])

    // 表头
    const columns: Array<any> = [
        {
            title: (
                <Tooltip title={__('按照模版名称排序')}>
                    <span className={styles.nameTitleContainer}>
                        {__('模版名称')}
                        <span className={styles.subTitle}>
                            （{__('描述')}）
                        </span>
                    </span>
                </Tooltip>
            ),
            key: 'name',
            ellipsis: true,
            fixed: 'left',
            sorter: true,
            sortOrder: tableSort.name,
            showSorterTooltip: false,
            render: (_, record) => (
                <div className={styles.rowNameContainer}>
                    <div className={styles.nameWrapper}>
                        <span
                            className={styles.name}
                            title={record?.name}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                // onPreview(record.id, record.indicator_type)
                            }}
                        >
                            {record?.name}
                        </span>
                        {record.name === '内置模版' && (
                            <Tooltip
                                title={
                                    <div
                                        className={
                                            styles.introductionTooltipWrapper
                                        }
                                    >
                                        <div className={styles.title}>
                                            {__('说明')}
                                        </div>
                                        <div className={styles.contentWrapper}>
                                            <div>
                                                {__(
                                                    '为保证库表的“探查分类”功能正常使用，最少要有一条识别算法，内置模版不可变更，除非算法依赖的服务不可用。',
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.supplement}>
                                            {__(
                                                '（内置模版的识别算法依赖认知助手相关服务，若服务不可用，则不能使用此算法）',
                                            )}
                                        </div>
                                    </div>
                                }
                                placement="bottomRight"
                                overlayStyle={{ maxWidth: 754 }}
                                overlayInnerStyle={{
                                    color: 'rgba(0, 0, 0, 0.85)',
                                }}
                                color="#fff"
                            >
                                <span className={styles.introduction}>
                                    {__('说明')}
                                </span>
                            </Tooltip>
                        )}
                    </div>
                    <div>
                        <span
                            className={styles.description}
                            title={record?.description}
                        >
                            {record.name === '内置模版'
                                ? __('内置模版不可删除')
                                : record?.description || __('暂无描述')}
                        </span>
                    </div>
                </div>
            ),
            width: 220,
        },
        {
            title: __('数据识别算法信息'),
            key: 'algorithm',
            dataIndex: 'algorithm',
            ellipsis: true,
            fixed: 'left',
            render: (text, record) => {
                return record.name === '内置模版'
                    ? __('通过识别字段名称和属性名称的相似度')
                    : text
            },
        },
        {
            title: __('算法类型'),
            key: 'type',
            dataIndex: 'type',
            ellipsis: true,
            render: (text, record) => {
                return text === AlgorithmType.BUILT_IN
                    ? __('内置')
                    : __('自定义')
            },
        },
        {
            title: __('启用状态'),
            key: 'status',
            dataIndex: 'status',
            ellipsis: true,
            render: (text, record) => {
                return <StatusLabel status={text} />
            },
        },
        {
            title: __('模版创建时间'),
            key: 'created_at',
            dataIndex: 'created_at',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.createAt,
            showSorterTooltip: false,
            render: (text, record) => {
                return moment(text).format('YYYY-MM-DD HH:mm:ss')
            },
        },
        {
            title: __('模版更新时间'),
            key: 'updated_at',
            dataIndex: 'updated_at',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.updatedAt,
            showSorterTooltip: false,
            render: (text, record) => {
                return moment(text).format('YYYY-MM-DD HH:mm:ss')
            },
        },
        {
            title: __('操作'),
            key: 'action',
            width: 240,
            render: (text, record) => {
                // 操作菜单
                const operationMenus = [
                    OperationType.DETAIL,
                    OperationType.EDIT,
                    OperationType.ENABLE,
                    OperationType.DISABLE,
                    OperationType.EXPORT,
                    OperationType.DELETE,
                ]
                    .filter((item) => {
                        // 如果算法状态为启用，则不显示启用操作
                        if (record.status === AlgorithmStatus.ENABLE) {
                            return item !== OperationType.ENABLE
                        }
                        // 如果算法状态为停用，则不显示停用操作
                        if (record.status === AlgorithmStatus.DISABLE) {
                            return item !== OperationType.DISABLE
                        }
                        return true
                    })
                    .map((item) => ({
                        key: item,
                        label: OperationTypeMap[item],
                        menuType: OptionMenuType.Menu,
                    }))
                return (
                    <OptionBarTool
                        menus={
                            record.name === '内置模版'
                                ? [
                                      {
                                          key: OperationType.EXPORT,
                                          label: OperationTypeMap[
                                              OperationType.EXPORT
                                          ],
                                          menuType: OptionMenuType.Menu,
                                      },
                                  ]
                                : operationMenus
                        }
                        onClick={(key) => {
                            setOperationId(record.id)
                            handleOperation(key, record.id)
                        }}
                    />
                )
            },
        },
    ]

    const rowSelection = {
        // 表格rowKey
        selectedRowKeys: selectedIds,
        onChange: (val: React.Key[]) => {
            setSelectedIds(val as string[])
        },
    }

    /**
     * 获取表格数据
     */
    const getTableData = async () => {
        try {
            const res = await getRecognitionAlgorithms(queryParams)
            setDataSource(
                res.entries.sort((a, b) => (a?.name === '内置模版' ? -1 : 0)),
            )
            setTotal(res.total_count)
            setSelectedSort(undefined)
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 导出
     * @param ids
     */
    const handleExport = async (ids: Array<string>) => {
        try {
            const res = await exportRecognitionAlgorithm({ ids })
            streamToFile(res, `识别算法_${moment().format('YYYYMMDD')}.xlsx`)
        } catch (err) {
            formatError(err)
        }
    }

    // 操作
    const handleOperation = (key: string, id: string) => {
        switch (key) {
            // 导出
            case OperationType.EXPORT:
                handleExport([id])
                break
            // 详情
            case OperationType.DETAIL:
                setShowDetail(true)
                break
            // 编辑
            case OperationType.EDIT:
                setShowEdit(true)
                break
            // 启用
            case OperationType.ENABLE:
                confirm({
                    title: __('确定启用当前识别算法吗？'),
                    icon: <InfoCircleFilled style={{ color: '#126ee3' }} />,
                    content: null,
                    onOk: async () => {
                        try {
                            await enableRecognitionAlgorithm(id)
                            message.success(__('启用成功'))
                            setQueryParams({
                                ...queryParams,
                                offset: 1,
                            })
                        } catch (err) {
                            formatError(err)
                        }
                    },
                })
                break
            // 停用
            case OperationType.DISABLE:
                confirm({
                    title: __('确定停用当前识别算法吗？'),
                    icon: (
                        <ExclamationCircleFilled
                            style={{ color: 'rgba(250, 173, 20, 1)' }}
                        />
                    ),
                    content: __(
                        '停用后，之前引用此算法的分类识别规则将受到影响，可能会导致功能不能正常使用，请谨慎操作。',
                    ),
                    onOk: async () => {
                        try {
                            await stopRecognitionAlgorithm(id)
                            message.success(__('停用成功'))
                            setQueryParams({
                                ...queryParams,
                                offset: 1,
                            })
                        } catch (err) {
                            formatError(err)
                        }
                    },
                })
                break
            // 删除
            case OperationType.DELETE:
                handleDelete([id])
                break
            default:
                break
        }
    }

    // 菜单改变
    const handleMenuChange = (selectedMenu: any) => {
        setQueryParams({
            ...queryParams,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            offset: 1,
        })

        onChangeMenuToTableSort(selectedMenu)
    }

    /**
     * 菜单改变时，转换为表格排序
     * @param selectedMenu
     */
    const onChangeMenuToTableSort = (selectedMenu) => {
        switch (selectedMenu.key) {
            case 'name':
                setTableSort({
                    name:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    createAt: null,
                    updatedAt: null,
                })
                break
            case 'updated_at':
                setTableSort({
                    name: null,
                    updatedAt:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    createAt: null,
                })
                break
            case 'created_at':
                setTableSort({
                    name: null,
                    updatedAt: null,
                    createAt:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                })
                break
            default:
                setTableSort({
                    name: null,
                    updatedAt: null,
                    createAt: null,
                })
                break
        }
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            if (sorter.columnKey === 'updated_at') {
                setTableSort({
                    updatedAt: sorter.order || 'ascend',
                    createAt: null,
                    name: null,
                })
            } else if (sorter.columnKey === 'name') {
                setTableSort({
                    updatedAt: null,
                    createAt: null,
                    name: sorter.order || 'ascend',
                })
            } else {
                setTableSort({
                    updatedAt: null,
                    createAt: sorter.order || 'ascend',
                    name: null,
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
        if (queryParams.sort === 'updated_at') {
            setTableSort({
                updatedAt:
                    queryParams.direction === SortDirection.ASC
                        ? 'descend'
                        : 'ascend',
                createAt: null,
                name: null,
            })
        } else if (queryParams.sort === 'name') {
            setTableSort({
                updatedAt: null,
                createAt: null,
                name:
                    queryParams.direction === SortDirection.ASC
                        ? 'descend'
                        : 'ascend',
            })
        } else {
            setTableSort({
                updatedAt: null,
                createAt:
                    queryParams.direction === SortDirection.ASC
                        ? 'descend'
                        : 'ascend',
                name: null,
            })
        }
        return {
            key: queryParams.sort,
            sort:
                queryParams.direction === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC,
        }
    }

    /**
     * 删除
     * @param ids
     */
    const handleDelete = (ids: Array<string>) => {
        confirm({
            title: __('确定要删除模版吗？'),
            onOk: async () => {
                const { working_ids } = await checkRecognitionAlgorithmsIsUsed({
                    ids,
                })
                if (working_ids.length > 0) {
                    setShowUsedModal(true)
                    setUsedData(working_ids)
                }
                const willDeleteIds = ids.filter(
                    (id) => !working_ids.includes(id),
                )
                if (willDeleteIds) {
                    await deleteForceRecognitionAlgorithms({
                        mode: 'safe',
                        ids: willDeleteIds,
                    })
                    setQueryParams({ ...queryParams, offset: 1 })
                    if (working_ids.length === 0) {
                        message.success(__('删除成功'))
                    }
                }
            },
        })
    }

    return (
        <div className={styles.tableContainer}>
            <div className={styles.tableToolbarWrapper}>
                <div>
                    <Space size="small" wrap={false}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setCreateOpen(true)}
                        >
                            {__('新建算法模版')}
                        </Button>
                        <Button
                            disabled={selectedIds.length === 0}
                            onClick={() => {
                                handleExport(selectedIds)
                            }}
                        >
                            {__('导出')}
                        </Button>
                        <Button
                            disabled={
                                // 如果仅选中的是内置模版，则删除按钮不可用
                                selectedIds.filter((id) => {
                                    const findDefaultData = dataSource.find(
                                        (item) => item.name === '内置模版',
                                    )
                                    return findDefaultData?.id !== id
                                }).length === 0
                            }
                            onClick={() => {
                                handleDelete(
                                    selectedIds.filter((id) => {
                                        const findDefaultData = dataSource.find(
                                            (item) => item.name === '内置模版',
                                        )
                                        return findDefaultData?.id !== id
                                    }),
                                )
                            }}
                        >
                            {__('删除')}
                        </Button>
                    </Space>
                </div>
                <div>
                    <Space size="small" wrap={false}>
                        <SearchInput
                            placeholder={__('搜索模版名称')}
                            onKeyChange={debounce((currentKeyword) => {
                                setQueryParams({
                                    ...queryParams,
                                    offset: 1,
                                    keyword: currentKeyword,
                                })
                            }, 500)}
                            style={{
                                width: 280,
                            }}
                            maxLength={128}
                            value={queryParams.keyword}
                            allowClear
                        />

                        <Space size="small" wrap={false}>
                            <LightweightSearch
                                formData={filterItems}
                                onChange={(data, key) =>
                                    setQueryParams({
                                        ...queryParams,
                                        ...data,
                                        offset: 1,
                                    })
                                }
                                defaultValue={{ status: undefined }}
                            />
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
                                    setQueryParams({
                                        ...queryParams,
                                        offset: 1,
                                    })
                                }
                            />
                        </Space>
                    </Space>
                </div>
            </div>
            <Table
                columns={columns}
                dataSource={dataSource}
                pagination={false}
                locale={{
                    emptyText: <Empty />,
                }}
                rowKey="id"
                rowSelection={rowSelection}
                onChange={(pagination, filters, sorter) => {
                    const selectedMenu = handleTableChange(sorter)
                    setSelectedSort(selectedMenu)
                    setQueryParams({
                        ...queryParams,
                        sort: selectedMenu.key,
                        direction: selectedMenu.sort,
                        offset: 1,
                    })
                }}
            />
            <Pagination
                current={queryParams.offset}
                pageSize={queryParams.limit}
                onChange={(page, limit) => {
                    setQueryParams({
                        ...queryParams,
                        offset: page,
                        limit,
                    })
                }}
                className={styles.paginationBox}
                total={total}
                showSizeChanger
                showQuickJumper
                hideOnSinglePage={total <= 10}
                showTotal={(count) => {
                    return `共 ${count} 条记录 第 ${
                        queryParams.offset
                    }/${Math.ceil(count / queryParams.limit)} 页`
                }}
            />

            {createOpen && (
                <CreateAlgorithm
                    open={createOpen}
                    onClose={() => setCreateOpen(false)}
                    onConfirm={() => {
                        setCreateOpen(false)
                        setQueryParams({
                            ...queryParams,
                            offset: 1,
                        })
                    }}
                />
            )}
            {showDetail && (
                <AlgorithmDetail
                    open={showDetail}
                    onClose={() => setShowDetail(false)}
                    dataId={operationId}
                />
            )}
            {showEdit && (
                <CreateAlgorithm
                    open={showEdit}
                    onClose={() => setShowEdit(false)}
                    onConfirm={() => {
                        setShowEdit(false)
                        setQueryParams({
                            ...queryParams,
                            offset: 1,
                        })
                    }}
                    dataId={operationId}
                />
            )}
            {showUsedModal && (
                <UsedDataModal
                    open={showUsedModal}
                    onCancel={() => {
                        setShowUsedModal(false)
                        setQueryParams({
                            ...queryParams,
                            offset: 1,
                        })
                    }}
                    data={usedData}
                    count={1}
                />
            )}
        </div>
    )
}

export default DataTable
