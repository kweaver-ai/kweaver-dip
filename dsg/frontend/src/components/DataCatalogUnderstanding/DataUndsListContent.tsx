import React, { useContext, useEffect, useMemo, useState } from 'react'
import { Input, message, Pagination, Select, Space, Table, Tooltip } from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import { useDebounceFn } from 'ahooks'
import { isNumber, trim } from 'lodash'
import { ExclamationCircleOutlined, SearchOutlined } from '@ant-design/icons'
import { ColumnsType } from 'antd/es/table'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { formatTime, getActualUrl, OperateType } from '@/utils'
import dataEmpty from '../../assets/dataEmpty.svg'
import {
    dataKindList,
    typeAll,
    CatlgTreeNode,
    labelText,
    initSearchCondition,
} from '../ResourcesDir/const'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import {
    deleteDataComprehension,
    formatError,
    getRescCatlgList,
    SortDirection,
    SortType,
    TaskType,
    updateComprehensionMark,
} from '@/core'
import { IRescCatlg } from '@/core/apis/dataCatalog/index.d'
import __ from './locale'
import Confirm from '../Confirm'
import {
    Loader,
    OptionBarTool,
    OptionMenuType,
    SearchInput,
    LightweightSearch,
} from '@/ui'
import {
    defaultMenu,
    menus,
    TabKey,
    ViewMode,
    totalOperates,
    products,
    searchData,
} from './const'
import CreateTask from '../TaskComponents/CreateTask'
import DropDownFilter from '../DropDownFilter'
import CreateTaskSelect from '../TaskComponents/CreateTaskSelect'
import { UndsLabel } from './helper'
import { TaskInfoContext } from '@/context'
import { useTaskCheck } from '@/hooks/useTaskCheck'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import ResourceIcon from './ResourceIcon'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IDataUndsListContent {
    activeTabKey?: string
    selectedNode: CatlgTreeNode
}

const DataUndsListContent: React.FC<IDataUndsListContent> = ({
    activeTabKey,
    selectedNode,
}) => {
    const { taskInfo } = useContext(TaskInfoContext)
    const { checkTask } = useTaskCheck(totalOperates, products, taskInfo)
    const navigator = useNavigate()
    const { checkPermission } = useUserPermCtx()
    const [searchParams] = useSearchParams()
    const backUrl = searchParams.get('backUrl')
    // 搜索关键字
    const [searchKey, setSearchKey] = useState('')
    // 加载
    const [loading, setLoading] = useState(true)
    const [fetching, setFetching] = useState(true)
    // 数据总数
    const [total, setTotal] = useState(0)
    // 目录数据集
    const [items, setItems] = useState<any[]>([])
    // 操作的目录
    const [curCatlg, setCurCatlg] = useState<IRescCatlg>()
    const [menuValue, setMenuValue] = useState<
        { key: string; sort: SortDirection } | undefined
    >(defaultMenu)
    // 筛选值
    const [selectValue, setSelectValue] = useState<number>(0)
    // 重置显示/隐藏
    const [delVisible, setDelVisible] = useState(false)
    // 重置加载
    const [delBtnLoading, setDelBtnLoading] = useState(false)
    // 创建任务显示/隐藏
    const [createTaskVisible, setCreateTaskVisible] = useState(false)
    // 请求参数
    const [queryParams, setQueryParams] = useState<any>({
        ...initSearchCondition,
    })
    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)

    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        updatedAt: 'descend',
        mountSourceName: null,
    })
    // 选中目录集
    const [selectedItems, setSelectedItems] = useState<any[]>([])
    // 表格选项属性
    const rowSelection = {
        selectedRowKeys: selectedItems.map((i) => i.id),
        onChange: (val: React.Key[], selectedRows) => {
            if (val.length === 0 || val.length === items.length) {
                const ids = items.map((i) => i.id)
                let filterItems = selectedItems.filter(
                    (k) => !ids.includes(k.id),
                )
                if (val.length === items.length) {
                    filterItems = [...filterItems, ...selectedRows]
                }
                setSelectedItems(filterItems)
            }
        },
        onSelect: (record, selected, selectedRows) => {
            if (selected) {
                setSelectedItems([...selectedItems, record])
            } else {
                setSelectedItems([
                    ...selectedItems.filter((i) => i.id !== record.id),
                ])
            }
        },
    }
    let sortWay: boolean = false
    // 排序相关值
    const [sortDire, setSortDire] = useState<any>({
        direction: defaultMenu.sort,
        sort: defaultMenu.key,
    })
    // 表格更新时间排序值
    const [updateSortOrder, setUpdateSortOrder] = useState<SortOrder>('ascend')

    // 搜索栏显示/隐藏
    const isSearch = useMemo(
        () =>
            fetching ||
            queryParams.keyword !== '' ||
            selectValue !== 0 ||
            items?.length > 0,
        [fetching, queryParams.keyword, selectValue, items],
    )

    // 新建任务默认值
    const createTaskData = useMemo(() => {
        return [
            {
                name: 'task_type',
                value: TaskType.DATACOMPREHENSION,
                disabled: true,
            },
            {
                name: 'assets_cat',
                value: selectedItems.map((i) => ({
                    id: i.id,
                    name: i.title,
                    path: i.orgname,
                })),
                disabled: true,
            },
        ]
    }, [selectedItems])

    useEffect(() => {
        if (activeTabKey) {
            setLoading(true)
            setSearchKey('')
            setSelectValue(0)
            setUpdateSortOrder('descend')
            setMenuValue(defaultMenu)
            setTotal(0)
            setItems([])
            setSelectedItems([])
            getCatlgList({
                ...initSearchCondition,
                orgcode: selectedNode.id,
                comprehension_status: '1,2',
            })
        }
    }, [activeTabKey, selectedNode])

    // 获取目录列表
    const getCatlgList = async (params) => {
        try {
            setFetching(true)
            const res = await getRescCatlgList({
                ...params,
                offset: params.current,
                limit: params.pageSize,
                task_id: taskInfo?.taskId || '',
                state: 5,
            })
            setQueryParams({ ...params })
            sortWay = false
            setItems(res?.entries || [])
            setTotal(res?.total_count || 0)
        } catch (error) {
            formatError(error)
            setItems([])
            setTotal(0)
        } finally {
            setFetching(false)
            setLoading(false)
            setMenuValue(undefined)
            setSelectedSort(undefined)
        }
    }

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        getCatlgList({
            ...queryParams,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            current: 1,
        })
        // setSelectedSort(selectedMenu)
        onChangeMenuToTableSort(selectedMenu)
    }

    const onChangeMenuToTableSort = (selectedMenu) => {
        switch (selectedMenu.key) {
            case 'mount_source_name':
                setTableSort({
                    createAt: null,
                    name: null,
                    mountSourceName:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                })
                break
            case 'name':
                setTableSort({
                    name:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    updatedAt: null,
                    mountSourceName: null,
                })
                break
            case 'updated_at':
                setTableSort({
                    name: null,
                    updatedAt:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    mountSourceName: null,
                })
                break
            default:
                setTableSort({
                    name: null,
                    updatedAt: null,
                    mountSourceName: null,
                })
                break
        }
    }

    // 表格排序改变
    // const handleTableChange = (sorter) => {
    //     let sortFields = {}
    //     if (sorter.column) {
    //         setUpdateSortOrder(null)
    //         if (sorter.columnKey === 'updated_at') {
    //             setUpdateSortOrder(sorter.order || 'ascend')
    //         }
    //         sortFields = {
    //             direction:
    //                 sorter.order === 'descend'
    //                     ? SortDirection.DESC
    //                     : SortDirection.ASC,
    //             sort: sorter.columnKey,
    //         }
    //         setMenuValue({
    //             key: sorter.columnKey,
    //             sort:
    //                 sorter.order === 'descend'
    //                     ? SortDirection.DESC
    //                     : SortDirection.ASC,
    //         })
    //     } else {
    //         sortFields = sortDire
    //         if (sortDire.sort === 'updated_at') {
    //             setUpdateSortOrder('ascend')
    //             sortFields = { ...sortDire, direction: SortDirection.ASC }
    //             setMenuValue({
    //                 key: sorter.columnKey,
    //                 sort: SortDirection.ASC,
    //             })
    //         }
    //     }
    //     setSortDire(sortFields)
    //     getCatlgList({
    //         ...queryParams,
    //         sort: sorter.columnKey,
    //         direction:
    //             sorter.order === 'descend'
    //                 ? SortDirection.DESC
    //                 : SortDirection.ASC,
    //         current: 1,
    //     })
    // }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            if (sorter.columnKey === 'updated_at') {
                setTableSort({
                    updatedAt: sorter.order || 'ascend',
                    name: null,
                    mountSourceName: null,
                })
            } else if (sorter.columnKey === 'mount_source_name') {
                setTableSort({
                    updatedAt: null,
                    mountSourceName: sorter.order || 'ascend',
                    name: null,
                })
            } else {
                setTableSort({
                    updatedAt: null,
                    name: sorter.order || 'ascend',
                    mountSourceName: null,
                })
            }
            return {
                key: sorter.columnKey === 'title' ? 'name' : sorter.columnKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }
        if (queryParams.sort === 'updated_at') {
            if (queryParams.direction === SortDirection.ASC) {
                setTableSort({
                    updatedAt: 'descend',
                    mountSourceName: null,
                    name: null,
                })
            } else {
                setTableSort({
                    updatedAt: 'ascend',
                    mountSourceName: null,
                    name: null,
                })
            }
        } else if (queryParams.sort === 'mount_source_name') {
            if (queryParams.direction === SortDirection.ASC) {
                setTableSort({
                    updatedAt: null,
                    mountSourceName: 'descend',
                    name: null,
                })
            } else {
                setTableSort({
                    updatedAt: null,
                    mountSourceName: 'ascend',
                    name: null,
                })
            }
        } else if (queryParams.sort === SortDirection.ASC) {
            setTableSort({
                updatedAt: null,
                name: 'descend',
                mountSourceName: null,
            })
        } else {
            setTableSort({
                updatedAt: null,
                name: 'ascend',
                mountSourceName: null,
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

    // 筛选onChange
    const handleSelectChange = (value: number) => {
        setSelectValue(value)
        getCatlgList({
            ...queryParams,
            current: 1,
            comprehension_status: value === 0 ? '1,2' : value,
        })
    }

    // 搜索防抖
    const { run: searchFn } = useDebounceFn(getCatlgList, {
        wait: 400,
        leading: false,
        trailing: true,
    })

    // 搜索框enter
    const handleSearchPressEnter = (e: any) => {
        const keyword = typeof e === 'string' ? e : trim(e.target.value)
        setSearchKey(keyword)
        searchFn({
            ...queryParams,
            keyword,
            current: 1,
        })
    }

    // 排序方式改变
    const handleSortWayChange = (selectedMenu) => {
        if (isSearch) {
            sortWay = true
            if (selectedMenu.key === SortType.CREATED) {
                setUpdateSortOrder(null)
            } else {
                setUpdateSortOrder(
                    selectedMenu.sort === SortDirection.DESC
                        ? 'descend'
                        : 'ascend',
                )
            }
            getCatlgList({
                ...queryParams,
                sort: selectedMenu.key,
                direction: selectedMenu.sort,
                current: 1,
            })
        }
    }

    // 去掉红点标记
    const remarkRed = (item: IRescCatlg) => {
        if (item.comprehension?.has_change) {
            updateComprehensionMark(item.id, taskInfo?.taskId)
        }
    }

    // 进入画布url拼接
    const getUrlQuery = (url: string) => {
        // 任务信息
        if (taskInfo?.taskId) {
            return `${url}&backUrl=${backUrl}&projectId=${taskInfo.projectId}&taskId=${taskInfo.taskId}&taskExecutableStatus=${taskInfo?.taskExecutableStatus}&arch=`
        }
        return `${url}&arch=`
    }

    // 操作处理
    const handleOperate = async (
        op: OperateType | string,
        item: IRescCatlg,
    ) => {
        setCurCatlg(item)
        switch (op) {
            case OperateType.PREVIEW:
                remarkRed(item)
                navigator(
                    getUrlQuery(
                        `/dataUnderstandingContent?cid=${item.id}&tab=${TabKey.CANVAS}`,
                    ),
                )
                break
            case OperateType.EDIT:
                remarkRed(item)
                navigator(
                    getUrlQuery(
                        `/dataUnderstandingContent?mode=${ViewMode.EDIT}&cid=${item.id}&tab=${TabKey.CANVAS}`,
                    ),
                )
                break
            case OperateType.DELETE:
                setDelVisible(true)
                break
            case 'createTask':
                setSelectedItems([item])
                setCreateTaskVisible(true)
                break
            case 'report':
                navigator(
                    getUrlQuery(
                        `/dataUnderstandingContent?cid=${item.id}&tab=${TabKey.REPORT}`,
                    ),
                )
                break
            default:
                break
        }
    }

    // 重置请求
    const handleDelete = async () => {
        try {
            setDelBtnLoading(true)
            if (!curCatlg) return
            await deleteDataComprehension(curCatlg.id)
            setDelBtnLoading(false)
            message.success(__('重置成功'))
        } catch (e) {
            formatError(e)
        } finally {
            setDelBtnLoading(false)
            setDelVisible(false)
            getCatlgList(queryParams)
        }
    }

    // 列表操作项
    const getOptionMenus = (record) => {
        let optionMenus: any[] = [
            {
                key: OperateType.EDIT,
                label: __('理解'),
                menuType: OptionMenuType.Menu,
                isNeedBadge: !!record.comprehension?.has_change,
                access: 'manageDataResourceCatalog',
            },
            // {
            //     key: 'createTask',
            //     label: __('新建任务'),
            //     menuType: OptionMenuType.Menu,
            //     access: `${ResourceType.task}.${RequestType.post}`,
            // },
            {
                key: OperateType.DELETE,
                label: __('重置'),
                menuType: OptionMenuType.Menu,
                access: 'manageDataResourceCatalog',
            },
        ]

        if (record?.comprehension?.status === 2) {
            optionMenus = [
                ...optionMenus,
                {
                    key: 'report',
                    label: __('查看报告'),
                    menuType: OptionMenuType.Menu,
                    ignoreTask: true,
                },
            ]
        }

        optionMenus = optionMenus
            .filter((op) => checkPermission(op.access))
            .filter((op) => checkTask(op.key, !!op.ignoreTask))
        if (optionMenus.length > 4) {
            return optionMenus.map((op, idx) => {
                if (idx >= 3) {
                    return { ...op, menuType: OptionMenuType.More }
                }
                return op
            })
        }
        return optionMenus
    }

    // 操作项宽度
    const opearteWi = (menuItems) => {
        const isHaveMore = menuItems.find(
            (item) => item.menuType === OptionMenuType.More,
        )
        if (isHaveMore) {
            return (
                (menuItems.filter(
                    (item) => item.menuType !== OptionMenuType.More,
                )?.length || 0) + 1
            )
        }
        return menuItems?.length
    }

    // 列表项
    const columns = (): ColumnsType<any> => {
        const menuItems = getOptionMenus({})
        return [
            {
                title: __('目录名称'),
                dataIndex: 'name',
                sorter: true,
                sortOrder: tableSort.name,
                showSorterTooltip: false,
                width: 200,
                key: 'name',
                render: (value, record) => (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div
                            className={styles.catlgName}
                            title={labelText(value)}
                            onClick={() =>
                                handleOperate(OperateType.PREVIEW, record)
                            }
                        >
                            {labelText(value)}
                        </div>
                        <Tooltip
                            title={record.comprehension?.exception_message}
                            placement="bottom"
                        >
                            <ExclamationCircleOutlined
                                className={styles.errorIcon}
                                hidden={
                                    !record.comprehension?.exception_message
                                }
                            />
                        </Tooltip>
                    </div>
                ),
                ellipsis: true,
            },
            {
                title: __('挂接资源'),
                dataIndex: 'resource_name',
                key: 'resource_name',
                sorter: true,
                sortOrder: tableSort.mountSourceName,
                showSorterTooltip: false,
                ellipsis: true,
                render: (_, record) => (
                    <div className={styles.resourceName}>
                        <ResourceIcon type={record.resource_type} />
                        <span
                            className={styles.resourceNameText}
                            title={record.comprehension?.mount_source_name}
                        >
                            {labelText(record.comprehension?.mount_source_name)}
                        </span>
                    </div>
                ),
            },
            // {
            //     title: __('主题分类'),
            //     dataIndex: 'data_kind',
            //     key: 'data_kind',
            //     ellipsis: true,
            //     render: (value) => {
            //         const showList = dataKindList.filter(
            //             // eslint-disable-next-line no-bitwise
            //             (item) => item.key !== typeAll && item.key & value,
            //         )
            //         return showList.length > 0 ? (
            //             <div
            //                 className={styles.dulc_tagWrap}
            //                 title={showList
            //                     .map((item) => item.label)
            //                     .join('；')}
            //             >
            //                 {showList.map((info, idx) => (
            //                     <span
            //                         className={styles.dulc_tag}
            //                         style={{
            //                             color: '#6B798D',
            //                             background: 'rgba(214,221,237,0.25)',
            //                         }}
            //                         key={idx}
            //                     >
            //                         {info.label}
            //                     </span>
            //                 ))}
            //             </div>
            //         ) : (
            //             '--'
            //         )
            //     },
            // },
            {
                title: __('理解状态'),
                dataIndex: 'comprehension_state',
                key: 'comprehension_state',
                width: 120,
                render: (_, record) => (
                    <UndsLabel type={record.comprehension?.status || 1} />
                ),
            },
            // {
            //     title: __('表含义'),
            //     dataIndex: 'description',
            //     key: 'description',
            //     ellipsis: true,
            //     render: (value) => labelText(value),
            // },
            {
                title: __('理解创建人'),
                dataIndex: 'creator',
                key: 'creator',
                ellipsis: true,
                render: (_, record) => labelText(record.comprehension?.creator),
            },
            {
                title: __('更新时间'),
                dataIndex: 'updated_at',
                key: 'updated_at',
                width: 180,
                ellipsis: true,
                sorter: true,
                sortOrder: tableSort.updatedAt,
                showSorterTooltip: false,
                render: (_, record) => {
                    return isNumber(
                        record.comprehension?.comprehension_update_time,
                    )
                        ? formatTime(
                              record.comprehension?.comprehension_update_time,
                          )
                        : '--'
                },
            },
            {
                title: __('操作'),
                key: 'action',
                width: 180,
                fixed: 'right',
                render: (_, record) => (
                    <OptionBarTool
                        menus={getOptionMenus(record) as any[]}
                        onClick={(key, e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleOperate(key, record)
                        }}
                    />
                ),
            },
        ]
    }

    return (
        <div className={styles.dataUndsListContentWrap}>
            <div className={styles.topWrapper}>
                <div className={styles.leftWrapper}>
                    <div className={styles.leftTitle}>
                        {__('数据资源目录理解')}
                    </div>
                    <div>
                        {/* <CreateTaskSelect
                            style={{ marginTop: 16 }}
                            taskItems={[TaskType.DATACOMPREHENSION]}
                            disabled={selectedItems.length === 0}
                            onSelected={(type) => {
                                setCreateTaskVisible(true)
                            }}
                            hidden={
                                taskInfo?.taskId ||
                                !getAccess(
                                    `${ResourceType.task}.${RequestType.post}`,
                                ) ||
                                loading ||
                                !isSearch
                            }
                        /> */}
                    </div>
                </div>
                <div className={styles.dulc_top} hidden={loading || !isSearch}>
                    <div className={styles.topRight}>
                        <Space size={12}>
                            <SearchInput
                                placeholder={__('搜索目录名称')}
                                value={searchKey}
                                onKeyChange={(kw: string) =>
                                    handleSearchPressEnter(kw)
                                }
                                onPressEnter={(e) => handleSearchPressEnter(e)}
                                style={{ width: 272 }}
                            />
                            <LightweightSearch
                                formData={searchData}
                                onChange={(data, key: string = '') =>
                                    handleSelectChange(data[key])
                                }
                                defaultValue={{ status: 0 }}
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
                                    searchFn({
                                        ...queryParams,
                                        keyword: searchKey,
                                        current: 1,
                                    })
                                }
                            />
                        </Space>
                    </div>
                </div>
            </div>
            {loading ? (
                <Loader />
            ) : (
                <div className={styles.dulc_bottom}>
                    {isSearch ? (
                        <>
                            <Table
                                columns={columns()}
                                dataSource={items}
                                loading={fetching}
                                pagination={{ position: [] }}
                                rowClassName={styles.tableRow}
                                scroll={{
                                    x: 1000,
                                    y:
                                        items?.length > 0
                                            ? total > 10
                                                ? 'calc(100vh - 296px)'
                                                : 'calc(100vh - 248px)'
                                            : undefined,
                                }}
                                rowKey="id"
                                rowSelection={
                                    !taskInfo?.taskId &&
                                    checkPermission(
                                        'manageDataOperationProject',
                                    )
                                        ? rowSelection
                                        : undefined
                                }
                                locale={{
                                    emptyText: <Empty />,
                                }}
                                // onChange={(pagination, filters, sorter) =>
                                //     handleTableChange(sorter)
                                // }
                                onChange={(
                                    currentPagination,
                                    filters,
                                    sorter,
                                ) => {
                                    const selectedMenu =
                                        handleTableChange(sorter)
                                    setSelectedSort(selectedMenu)
                                    getCatlgList({
                                        ...queryParams,
                                        sort: selectedMenu.key,
                                        direction: selectedMenu.sort,
                                        current: 1,
                                    })
                                }}
                            />
                            <Pagination
                                current={queryParams.current}
                                pageSize={queryParams.pageSize}
                                onChange={(page) => {
                                    getCatlgList({
                                        ...queryParams,
                                        current: page,
                                    })
                                }}
                                className={styles.pagination}
                                total={total}
                                showSizeChanger={false}
                                hideOnSinglePage
                            />
                        </>
                    ) : (
                        <div className={styles.empty}>
                            <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                        </div>
                    )}
                </div>
            )}
            <Confirm
                open={delVisible}
                title={__('确认要重置理解吗？')}
                content={__('重置后该资源目录的理解将无法找回，请谨慎操作！')}
                onOk={handleDelete}
                onCancel={() => {
                    setDelVisible(false)
                }}
                okText={__('确定')}
                cancelText={__('取消')}
                okButtonProps={{ loading: delBtnLoading }}
            />
            <CreateTask
                show={createTaskVisible}
                operate={OperateType.CREATE}
                title={__('新建任务')}
                defaultData={createTaskData}
                isSupportFreeTask
                onClose={() => {
                    setCreateTaskVisible(false)
                    setSelectedItems([])
                }}
            />
        </div>
    )
}

export default DataUndsListContent
