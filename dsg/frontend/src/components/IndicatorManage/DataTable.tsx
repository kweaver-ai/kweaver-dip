import { CaretDownOutlined, ExclamationCircleFilled } from '@ant-design/icons'
import { useGetState } from 'ahooks'
import {
    Button,
    Dropdown,
    message,
    Pagination,
    Space,
    Table,
    Tooltip,
} from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import {
    FC,
    forwardRef,
    useContext,
    useEffect,
    useImperativeHandle,
    useMemo,
    useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import dataEmpty from '@/assets/dataEmpty.svg'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import { TaskInfoContext } from '@/context'
import {
    deleteIndictor,
    formatError,
    getIndictorList,
    handleParams,
    SortDirection,
    TaskExecutableStatus,
} from '@/core'
import { AddOutlined } from '@/icons'
import { OptionBarTool, OptionMenuType, SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import { getActualUrl, getInnerUrl, rewriteUrl, useQuery } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import DropDownFilter from '../DropDownFilter'
import {
    changeUrlData,
    CreateItems,
    defaultMenu,
    IndicatorType,
    IndicatorTypes,
    menus,
    OperateType,
    OptionType,
    SelectFilterMenu,
    TabsKey,
} from './const'
import CreateDrawer from './CreateIDrawer'
import { getColumns } from './helper'
import __ from './locale'
import styles from './styles.module.less'

// 初始params
const initialQueryParams: any = {
    offset: 1,
    limit: 10,
    direction: defaultMenu.sort,
    sort: defaultMenu.key,
    keyword: '',
    indicator_type: '',
}

interface DataTableType {
    ref?: any
    filterSearch: {
        id: string
        type: SelectFilterMenu
        isAll: boolean
    }
    tabKey: TabsKey
    collapsed?: boolean
    getContainer?: any
}
const DataTable: FC<DataTableType> = forwardRef((props: any, ref) => {
    const {
        filterSearch,
        tabKey,
        collapsed = true,
        getContainer = false,
    } = props

    const navigate = useNavigate()
    const query = useQuery()

    const operation = query.get('operation')
    const taskId = query.get('taskId') || ''
    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)

    // 查询params
    const [queryParams, setQueryParams, getQueryParams] = useGetState<any>({
        ...initialQueryParams,
        indicator_type: tabKey === TabsKey.ALL ? '' : tabKey,
    })
    const [total, setTotal] = useState(0)

    // 指标列表
    const [dataSource, setDataSource] = useState<Array<any>>([])

    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        createAt: null,
        updatedAt: 'descend',
    })

    const [loading, setLoading] = useState(true)
    const [columns, setColumns] = useState<Array<any>>([])

    // 窗口状态
    const [configShow, setConfigShow] = useState<boolean>(false)

    // 编辑类型
    const [editType, setEditType] = useState<TabsKey>(TabsKey.ATOMS)

    // 查看指标详情
    const [viewDetailId, setViewDetailId] = useState<string>('')
    const [viewDetailType, setViewDetailType] = useState<TabsKey>(TabsKey.ATOMS)

    const [editIndicatorId, setEditIndicatorId] = useState<string>('')
    const [allDataExist, setAllDataExist] = useState<boolean>(false)
    const [operationMethod, setOperationMethod] = useState<
        OperateType | undefined
    >()
    const [optionMenu, setOptionMenu, getOptionMenu] = useGetState<Array<any>>([
        {
            key: OptionType.DETAIL,
            label: __('详情'),
            menuType: OptionMenuType.Menu,
        },
        {
            key: OptionType.EDIT,
            label: __('编辑'),
            menuType: OptionMenuType.Menu,
        },

        {
            key: OptionType.DELETE,
            label: __('删除'),
            menuType: OptionMenuType.Menu,
        },
    ])
    const [filterData, setFilterData] = useState<{
        id: string
        type: SelectFilterMenu
        tabKey: TabsKey
    }>({
        id: '',
        type: SelectFilterMenu.BUSSINESSDOMAIN,
        tabKey,
    })

    const { taskInfo } = useContext(TaskInfoContext)

    const isTaskCompleted = useMemo(() => {
        return taskInfo?.taskStatus === TaskExecutableStatus.COMPLETED
    }, [taskInfo])

    useEffect(() => {
        if (taskInfo?.id) {
            setOptionMenu(
                optionMenu.filter((menuItem) => {
                    // 任务完成屏蔽删除和编辑按钮
                    if (
                        taskInfo?.taskStatus ===
                            TaskExecutableStatus.COMPLETED &&
                        [OptionType.EDIT, OptionType.DELETE].includes(
                            menuItem.key,
                        )
                    ) {
                        return false
                    }
                    return true
                }),
            )
        }
    }, [taskInfo?.id])

    useEffect(() => {
        if (operation) {
            setConfigShow(true)
            setEditType(query.get('indicatorType') as TabsKey)
            if (operation === OperateType.EDIT) {
                setEditIndicatorId(query.get('indicatorId') || '')
            }
        }
        setOperationMethod(operation as OperateType)
    }, [operation])

    useEffect(() => {
        if (filterData.id) {
            if (filterData.type === SelectFilterMenu.DIMENSIONALMODEL) {
                setQueryParams({
                    ...initialQueryParams,
                    dimensional_model_id: filterData.id,
                    indicator_type:
                        filterData.tabKey === TabsKey.ALL ? '' : tabKey,
                    offset: 1,
                })
            } else if (
                filterData.type === SelectFilterMenu.BUSSINESSDOMAIN ||
                filterData.type === SelectFilterMenu.SUBJECTDOMAIN
            ) {
                const tmpParams = {
                    ...initialQueryParams,
                    subject_id: filterData.id,
                    indicator_type:
                        filterData.tabKey === TabsKey.ALL ? '' : tabKey,
                    offset: 1,
                }
                const queryParamsRes = handleParams(
                    tmpParams,
                    'subject_id',
                    filterData.id,
                )
                setQueryParams(queryParamsRes)
            } else if (
                filterData.type === SelectFilterMenu.ORGNIZATION ||
                filterData.type === SelectFilterMenu.DEPARTMENT
            ) {
                const tmpParams = {
                    ...initialQueryParams,
                    management_department_id: filterData.id,
                    indicator_type:
                        filterData.tabKey === TabsKey.ALL ? '' : tabKey,
                    offset: 1,
                }
                const queryParamsRes = handleParams(
                    tmpParams,
                    'management_department_id',
                    filterData.id,
                )
                setQueryParams(queryParamsRes)
            } else {
                setQueryParams({
                    ...initialQueryParams,
                    indicator_type:
                        filterData.tabKey === TabsKey.ALL ? '' : tabKey,
                    offset: 1,
                })
            }
        } else {
            setQueryParams({
                ...initialQueryParams,
                indicator_type: filterData.tabKey === TabsKey.ALL ? '' : tabKey,
                offset: 1,
            })
        }
        setViewDetailId('')
        if (tabKey) {
            setColumns(
                getColumns(
                    filterData.tabKey,
                    tableSort,
                    optionsComponent,
                    (id, indicator_type) => {
                        // const url = `/business/indicatorManage/indicatorDetail?indicatorId=${id}&indicatorType=${indicator_type}`
                        // navigate(url)
                        viewIndicatorDetail(id, indicator_type)
                    },
                ),
            )
        }
    }, [filterData])

    useEffect(() => {
        setColumns(
            getColumns(
                filterData.tabKey,
                tableSort,
                optionsComponent,
                (id, indicator_type) => {
                    // const url = `/business/indicatorManage/indicatorDetail?indicatorId=${id}&indicatorType=${indicator_type}`
                    // navigate(url)
                    viewIndicatorDetail(id, indicator_type)
                },
            ),
        )
    }, [optionMenu])

    useEffect(() => {
        if (tabKey) {
            setFilterData({
                ...filterSearch,
                tabKey,
            })
        }
    }, [filterSearch.id, filterSearch.type, tabKey])

    useEffect(() => {
        getlist(queryParams)
    }, [queryParams])

    const gotoPage = (path: string) => {
        if (taskId) {
            navigate(getInnerUrl(path))
            return
        }
        rewriteUrl(path)
    }

    const viewIndicatorDetail = (dataId, dataType) => {
        setEditIndicatorId(dataId)
        setConfigShow(true)
        setOperationMethod(OperateType.DETAIL)
        setEditType(dataType)
        gotoPage(
            changeUrlData({
                indicatorType: dataType,
                operation: OperateType.DETAIL,
                indicatorId: dataId,
            }),
        )
    }
    useEffect(() => {
        if (tabKey) {
            setColumns(
                getColumns(
                    tabKey,
                    tableSort,
                    optionsComponent,
                    (id, indicator_type) => {
                        // const url = `/business/indicatorManage/indicatorDetail?indicatorId=${id}&indicatorType=${indicator_type}`
                        viewIndicatorDetail(id, indicator_type)
                    },
                ),
            )
        }
    }, [tableSort])

    useImperativeHandle(ref, () => ({
        onCloseDetail: () => {
            setViewDetailId('')
        },
    }))

    /**
     * 初始获取列表
     * @param params
     */
    const getlist = async (params) => {
        try {
            setLoading(true)
            const { entries, count } = await getIndictorList(params)
            if (!params.keyword) {
                if (entries.length) {
                    setAllDataExist(true)
                } else {
                    setAllDataExist(false)
                }
            }
            setDataSource(entries)
            setTotal(count)
            setLoading(false)
        } catch (ex) {
            formatError(ex)
        } finally {
            setSelectedSort(undefined)
        }
    }

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setQueryParams({
            ...queryParams,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            offset: 1,
        })
        // setSelectedSort(selectedMenu)
        onChangeMenuToTableSort(selectedMenu)
    }

    const optionsComponent = (record) => {
        return (
            <OptionBarTool
                menus={getOptionMenu().map((currentMenu) =>
                    currentMenu.key === OptionType.DELETE
                        ? {
                              ...currentMenu,
                              label: record.refer_count ? (
                                  <Tooltip
                                      title={__('被其他指标引用，暂不可删除')}
                                  >
                                      <div className={styles.deleteBtn}>
                                          {__('删除')}
                                      </div>
                                  </Tooltip>
                              ) : (
                                  __('删除')
                              ),
                          }
                        : currentMenu,
                )}
                onClick={(key, e) => {
                    switch (key) {
                        case OptionType.DELETE:
                            if (!record.refer_count) {
                                confirm({
                                    width: 432,
                                    title: (
                                        <span
                                            style={{
                                                color: '#000',
                                                fontWeight: '550',
                                            }}
                                        >
                                            {__('确认要删除指标吗？')}
                                        </span>
                                    ),
                                    icon: (
                                        <ExclamationCircleFilled
                                            style={{ color: 'rgb(250 173 20)' }}
                                        />
                                    ),
                                    content:
                                        __(
                                            '删除后该指标将无法找回，请谨慎操作！',
                                        ),
                                    okText: __('确定'),
                                    cancelText: __('取消'),
                                    onOk: () => {
                                        deleteData(record.id)
                                    },
                                })
                            }
                            break

                        case OptionType.EDIT:
                            setEditIndicatorId(record.id)
                            setConfigShow(true)
                            setEditType(record.indicator_type)
                            setOperationMethod(OperateType.EDIT)

                            // 非复合指标
                            if (
                                record.indicator_type !== TabsKey.RECOMBINATION
                            ) {
                                gotoPage(
                                    changeUrlData(
                                        {
                                            type:
                                                record.indicator_type ===
                                                TabsKey.ATOMS
                                                    ? IndicatorType.ATOM
                                                    : IndicatorType.DERIVED,
                                            operate: OperateType.EDIT,
                                            indicatorId: record.id,
                                            sceneId: record.scene_analysis_id,
                                        },
                                        undefined,
                                        getActualUrl(
                                            '/business/indicatorManage/indicatorGraph',
                                        ),
                                    ),
                                )
                                return
                            }

                            gotoPage(
                                changeUrlData({
                                    indicatorType: record.indicator_type,
                                    operation: OperateType.EDIT,
                                    indicatorId: record.id,
                                }),
                            )
                            // 换一个新的页面
                            // navigate(
                            //     `/business/indicatorManage/indicatorEdit?indicatorId=${record.id}&indicatorType=${record.indicator_type}`,
                            // )
                            break
                        case OptionType.DETAIL:
                            e.preventDefault()
                            e.stopPropagation()
                            viewIndicatorDetail(
                                record.id,
                                record.indicator_type,
                            )
                            // 换一个新的页面
                            // navigate(
                            //     `/business/indicatorManage/indicatorDetail?indicatorId=${record.id}&indicatorType=${record.indicator_type}`,
                            // )
                            // setViewDetailId(record.id)
                            // setViewDetailType(record.indicator_type)
                            break
                        default:
                            break
                    }
                }}
            />
        )
    }

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

    const deleteData = async (id: string) => {
        try {
            await deleteIndictor(id)
            message.success(__('删除成功'))
            setQueryParams({
                ...getQueryParams(),
                offset:
                    dataSource.length === 1
                        ? queryParams.offset! - 1 || 1
                        : queryParams.offset!,
            })
        } catch (ex) {
            formatError(ex)
        }
    }

    const createIndicator = (indicatorType: TabsKey) => {
        setConfigShow(true)
        setEditType(indicatorType)

        let param = {}

        if (
            filterSearch?.id &&
            filterSearch?.type !== SelectFilterMenu.BUSSINESSDOMAIN // 主题域不能绑定主题域分组
        ) {
            const key =
                filterSearch.type === SelectFilterMenu.SUBJECTDOMAIN
                    ? 'domainId'
                    : 'departmentId'
            param = {
                [key]: filterSearch?.id,
            }
        }

        // 非复合指标
        if (indicatorType !== TabsKey.RECOMBINATION) {
            gotoPage(
                changeUrlData(
                    {
                        type:
                            indicatorType === TabsKey.ATOMS
                                ? IndicatorType.ATOM
                                : IndicatorType.DERIVED,
                        operate: OperateType.CREATE,
                        ...param,
                    },
                    undefined,
                    getActualUrl('/business/indicatorManage/indicatorGraph'),
                ),
            )
            return
        }

        gotoPage(
            changeUrlData({
                indicatorType,
                operation: OperateType.CREATE,
                ...param,
            }),
        )
        // navigate(
        //     `/business/indicatorManage/indicatorEdit?indicatorType=${indicatorType}`,
        // )
    }

    const getPlaceholderComponents = (indicatorType) => {
        switch (indicatorType) {
            case TabsKey.ATOMS:
                return __('搜索原子指标名称、编码、关联业务指标名称')
            case TabsKey.DERIVE:
                return __('搜索衍生指标名称、编码、关联业务指标名称')
            case TabsKey.RECOMBINATION:
                return __('搜索复合指标名称、编码、关联业务指标名称')
            default:
                return __('搜索指标名称、编码、关联业务指标名称')
        }
    }

    return (
        <div className={styles.dataTableContainer}>
            {allDataExist ? (
                <div className={styles.toolBar}>
                    {isTaskCompleted ? (
                        <div />
                    ) : (
                        <div>
                            {tabKey === TabsKey.ALL ? (
                                <Dropdown
                                    menu={{
                                        items: CreateItems,
                                        onClick: ({ key }) => {
                                            createIndicator(key as TabsKey)
                                        },
                                    }}
                                    trigger={['hover']}
                                >
                                    <Button
                                        type="primary"
                                        icon={<AddOutlined />}
                                    >
                                        {__('新建')}
                                        <CaretDownOutlined />
                                    </Button>
                                </Dropdown>
                            ) : (
                                <Button
                                    onClick={() => {
                                        createIndicator(tabKey)
                                    }}
                                    type="primary"
                                    icon={<AddOutlined />}
                                >
                                    {__('新建')}
                                </Button>
                            )}
                        </div>
                    )}
                    <Space size="small" wrap={false}>
                        <Tooltip
                            placement="top"
                            title={getPlaceholderComponents(tabKey)}
                            overlayInnerStyle={{
                                width: 'fit-content',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <SearchInput
                                placeholder={getPlaceholderComponents(tabKey)}
                                onKeyChange={(currentKeyword) => {
                                    setQueryParams({
                                        ...queryParams,
                                        offset: 1,
                                        keyword: currentKeyword,
                                    })
                                }}
                                style={{
                                    width: 280,
                                }}
                                maxLength={128}
                                value={queryParams.keyword}
                                allowClear
                            />
                        </Tooltip>

                        {/* <Input
                            prefix={<SearchOutlined />}
                            placeholder={getPlaceholderComponents(tabKey)}
                            onChange={(e) => {
                                setKeyword(trim(e.target.value))
                            }}
                            style={{
                                width: 280,
                            }}
                            maxLength={128}
                            allowClear
                        /> */}

                        <div>
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
                        </div>
                    </Space>
                </div>
            ) : null}
            <div className={styles.tableContainer}>
                {!allDataExist ? (
                    isTaskCompleted ? (
                        <div className={styles.empty}>
                            <Empty
                                desc={
                                    <div>
                                        <span>{__('暂无数据')}</span>
                                    </div>
                                }
                                iconSrc={dataEmpty}
                            />
                        </div>
                    ) : (
                        <div className={styles.empty}>
                            <Empty
                                desc={
                                    <div>
                                        <span>
                                            {__(
                                                '点击【新建】按钮，可新建一个${type}',
                                                {
                                                    type:
                                                        tabKey === TabsKey.ALL
                                                            ? __('指标')
                                                            : IndicatorTypes[
                                                                  tabKey
                                                              ],
                                                },
                                            )}
                                        </span>
                                    </div>
                                }
                                iconSrc={dataEmpty}
                            />
                            <div className={styles.button}>
                                {tabKey === TabsKey.ALL ? (
                                    <Dropdown
                                        menu={{
                                            items: CreateItems,
                                            onClick: ({ key }) => {
                                                createIndicator(key as TabsKey)
                                            },
                                        }}
                                        trigger={['hover']}
                                    >
                                        <Button
                                            type="primary"
                                            icon={<AddOutlined />}
                                        >
                                            {__('新建')}
                                            <CaretDownOutlined />
                                        </Button>
                                    </Dropdown>
                                ) : (
                                    <Button
                                        onClick={() => {
                                            createIndicator(tabKey)
                                        }}
                                        type="primary"
                                        icon={<AddOutlined />}
                                    >
                                        {__('新建')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )
                ) : (
                    <div>
                        {!(queryParams.keyword || dataSource.length) &&
                        loading ? (
                            <Loader />
                        ) : (
                            <>
                                <Table
                                    dataSource={dataSource}
                                    columns={columns}
                                    pagination={false}
                                    rowClassName={styles.tableRow}
                                    onChange={(pagination, filters, sorter) => {
                                        const selectedMenu =
                                            handleTableChange(sorter)
                                        setSelectedSort(selectedMenu)
                                        setQueryParams({
                                            ...queryParams,
                                            sort: selectedMenu.key,
                                            direction: selectedMenu.sort,
                                            offset: 1,
                                        })
                                    }}
                                    locale={{
                                        emptyText: <Empty />,
                                    }}
                                    loading={loading}
                                    scroll={{
                                        x: 1200,
                                        y: taskInfo?.id
                                            ? dataSource.length > 0
                                                ? total > 10
                                                    ? `calc(100vh - 331px)`
                                                    : `calc(100vh -  263px)`
                                                : undefined
                                            : dataSource.length > 0
                                            ? total > 10
                                                ? `calc(100vh - 263px)`
                                                : `calc(100vh -  215px)`
                                            : undefined,
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
                                    className={styles.pagination}
                                    total={total}
                                    showSizeChanger
                                    showQuickJumper
                                    hideOnSinglePage={total <= 10}
                                    showTotal={(count) => {
                                        return `共 ${count} 条记录 第 ${
                                            queryParams.offset
                                        }/${Math.ceil(
                                            count / queryParams.limit,
                                        )} 页`
                                    }}
                                />
                            </>
                        )}
                    </div>
                )}
            </div>
            <CreateDrawer
                visible={configShow}
                onClose={(needReload: boolean) => {
                    setConfigShow(false)
                    setEditIndicatorId('')
                    if (needReload) {
                        setQueryParams({
                            ...queryParams,
                            offset: 1,
                        })
                    }

                    gotoPage(
                        changeUrlData({}, [
                            'indicatorType',
                            'operation',
                            'indicatorId',
                        ]),
                    )
                }}
                indicatorType={editType}
                domainId={
                    filterSearch.type === SelectFilterMenu.SUBJECTDOMAIN
                        ? filterSearch.id
                        : ''
                }
                modelId={
                    filterSearch.type === SelectFilterMenu.DIMENSIONALMODEL
                        ? filterSearch.id
                        : ''
                }
                configType={operationMethod}
                indicatorId={editIndicatorId}
                getContainer={document.getElementById('root')}
            />
            {/* {viewDetailId && (
                <IndicatorView
                    onClose={() => {
                        setViewDetailId('')
                    }}
                    indicatorId={viewDetailId}
                    visible={!!viewDetailId}
                />
            )} */}
        </div>
    )
})

export default DataTable
