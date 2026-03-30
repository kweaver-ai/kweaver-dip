import { ExclamationCircleFilled, SearchOutlined } from '@ant-design/icons'
import { useDebounce } from 'ahooks'
import { Button, Input, Pagination, Space, Table, message } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import { SortOrder } from 'antd/lib/table/interface'
import moment from 'moment'
import { FC, useContext, useEffect, useState } from 'react'
import { confirm } from '@/utils/modalHelper'
import Empty from '@/ui/Empty'
import { OptionBarTool, OptionMenuType } from '@/ui'
import { AddOutlined } from '@/icons'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import addEmpty from '@/assets/emptyAdd.svg'
import {
    EditStatus,
    OptionType,
    defaultMenu,
    menus,
} from '../DataSynchronization/const'
import DropDownFilter from '../DropDownFilter'
import styles from './styles.module.less'

import { TaskInfoContext } from '@/context'
import {
    IFormEnumConfigModel,
    SortDirection,
    TaskExecutableStatus,
    deleteProcessDataModel,
    editProcessModelInfo,
    formatError,
    formsEnumConfig,
    getProcessDataList,
} from '@/core'
import {
    DataProcessParams,
    DataSyncInfo,
} from '@/core/apis/businessGrooming/index.d'
import Loader from '@/ui/Loader'
import WorkflowLogs from '../DataDevelopmentWorkflow/WorkflowLogs'
import DataProcessPage from './DataProcessPage'
import EditData from './EditData'
import __ from './locale'

const DataProcess: FC<{
    collapsed: boolean
}> = ({ collapsed }) => {
    // 初始params
    const initialQueryParams: DataProcessParams = {
        offset: 1,
        limit: 10,
        direction: defaultMenu.sort,
        sort: defaultMenu.key,
        keyword: '',
        with_path: false,
    }
    const [loading, setLoading] = useState(true)
    // 新建加工模型
    const [editData, setEditData] = useState<any>(null)
    const [editType, setEditType] = useState<EditStatus>(EditStatus.NONE)
    const { taskInfo } = useContext(TaskInfoContext)
    // 搜索
    const [keyword, setKeyword] = useState<string>('')
    const debounceValue = useDebounce(keyword, { wait: 500 })
    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)

    // 加工模型列表
    const [dataSource, setDataSource] = useState<Array<DataSyncInfo>>([])

    // 打开画布
    const [open, setOpen] = useState<boolean>(false)
    // 编辑模型信息
    const [editModelInfo, setEditModelInfo] = useState<any>(null)

    useEffect(() => {
        setQueryParams({
            ...queryParams,
            keyword: debounceValue,
        })
    }, [debounceValue])
    // 查询params
    const [queryParams, setQueryParams] =
        useState<DataProcessParams>(initialQueryParams)
    const [total, setTotal] = useState(0)

    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        createAt: null,
        updatedAt: 'descend',
    })

    const [viewLogsId, setViewLogsId] = useState<string>('')

    const [configEnum, setConfigEnum] = useState<
        IFormEnumConfigModel | undefined
    >()

    useEffect(() => {
        getConfigEnum()
    }, [])
    const getConfigEnum = async () => {
        const res = await formsEnumConfig()
        setConfigEnum(res)
    }

    // 表格字段
    const columns: ColumnsType<any> = [
        {
            title: __('数据加工名称'),
            key: 'name',
            ellipsis: true,
            fixed: 'left',
            sorter: true,
            sortOrder: tableSort.name,
            showSorterTooltip: false,
            render: (_, record) =>
                (
                    <span
                        onClick={() => {
                            setOpen(true)
                            setEditModelInfo(record)
                        }}
                        className={styles.textName}
                    >
                        {record?.name}
                    </span>
                ) || '--',
        },
        {
            title: __('描述'),
            key: 'description',
            dataIndex: 'description',
            ellipsis: true,
            render: (value, record) => (
                <span
                    style={{
                        color: value ? 'rgb(0 0 0 / 85%)' : 'rgb(0 0 0 / 45%)',
                    }}
                    title={value}
                >
                    {value || __('暂无描述')}
                </span>
            ),
        },
        {
            title: __('创建人'),
            key: 'created_by',
            ellipsis: true,
            render: (_, record) => record?.created_by || '--',
            width: 120,
        },
        {
            title: __('创建时间'),
            key: 'created_at',
            sorter: true,
            sortOrder: tableSort.createAt,
            showSorterTooltip: false,
            render: (_, record) =>
                record?.created_at
                    ? moment(record.created_at).format('YYYY-MM-DD HH:mm:ss')
                    : '--',
            width: 180,
        },
        {
            title: __('更新人'),
            key: 'updated_by',
            ellipsis: true,
            render: (_, record) => record?.updated_by || '--',
            width: 120,
        },
        {
            title: __('更新时间'),
            key: 'updated_at',
            sorter: true,
            sortOrder: tableSort.updatedAt,
            showSorterTooltip: false,
            render: (_, record) =>
                record?.updated_at
                    ? moment(record.updated_at).format('YYYY-MM-DD HH:mm:ss')
                    : '--',
            width: 180,
        },
        {
            title: __('操作'),
            key: 'option',
            fixed: 'right',
            render: (_, record) => {
                return (
                    <OptionBarTool
                        menus={
                            taskInfo.status === TaskExecutableStatus.COMPLETED
                                ? [
                                      {
                                          key: OptionType.SYNCLOGS,
                                          label: __('加工日志'),
                                          menuType: OptionMenuType.Menu,
                                      },
                                  ]
                                : [
                                      {
                                          key: OptionType.EDIT,
                                          label: __('编辑'),
                                          menuType: OptionMenuType.Menu,
                                      },
                                      {
                                          key: OptionType.SYNCLOGS,
                                          label: __('加工日志'),
                                          menuType: OptionMenuType.Menu,
                                      },
                                      {
                                          key: OptionType.DETAIL,
                                          label: __('基本信息'),
                                          menuType: OptionMenuType.Menu,
                                      },
                                      {
                                          key: OptionType.DELETE,
                                          label: __('删除'),
                                          menuType: OptionMenuType.Menu,
                                      },
                                  ]
                        }
                        onClick={(key, e) => {
                            switch (key) {
                                case OptionType.DELETE:
                                    confirm({
                                        width: 432,
                                        title: (
                                            <span
                                                style={{
                                                    color: '#000',
                                                    fontWeight: '550',
                                                }}
                                            >
                                                {__('确认要删除数据加工吗？')}
                                            </span>
                                        ),
                                        icon: (
                                            <ExclamationCircleFilled
                                                style={{
                                                    color: 'rgb(250 173 20)',
                                                }}
                                            />
                                        ),
                                        content: __(
                                            '删除后该数据加工模型、加工逻辑及日志将无法找回，且可能会对引用该数据加工的工作流造成影响，请谨慎操作！',
                                        ),
                                        okText: __('确定'),
                                        cancelText: __('取消'),
                                        onOk: () => {
                                            deleteFormData(record.id)
                                        },
                                    })
                                    break
                                case OptionType.SYNCLOGS:
                                    setViewLogsId(record.id)
                                    break
                                case OptionType.EDIT:
                                    setOpen(true)
                                    setEditModelInfo(record)
                                    break
                                case OptionType.DETAIL:
                                    setEditData(record)
                                    setEditType(EditStatus.EDIT)
                                    break
                                default:
                                    break
                            }
                        }}
                    />
                )
            },
            width:
                taskInfo.status === TaskExecutableStatus.COMPLETED ? 120 : 260,
        },
    ]

    useEffect(() => {
        getlist(queryParams)
    }, [queryParams])

    /**
     * 初始获取列表
     * @param params
     */
    const getlist = async (params) => {
        try {
            setLoading(true)
            const { entries, total_count } = await getProcessDataList(params)
            setDataSource(entries)
            setTotal(total_count)
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
     * 修改同步模型信息
     * @param values
     */
    const editProcessDataInfo = async (values) => {
        try {
            await editProcessModelInfo(editData.id, {
                task_id: taskInfo.taskId,
                ...values,
            })
            setDataSource(
                dataSource.map((item) =>
                    item.id === editData.id ? { ...item, ...values } : item,
                ),
            )
            setEditData(null)
            setEditType(EditStatus.NONE)
            message.success(__('编辑成功'))
        } catch (ex) {
            formatError(ex)
        }
    }

    const deleteFormData = async (id: string) => {
        try {
            await deleteProcessDataModel(id, { task_id: taskInfo.id })
            message.success(__('删除成功'))
            setQueryParams({
                ...queryParams,
                offset:
                    dataSource.length === 1
                        ? queryParams.offset! - 1 || 1
                        : queryParams.offset!,
            })
        } catch (ex) {
            formatError(ex)
        }
    }

    return (
        <div className={styles.container}>
            {taskInfo.status === TaskExecutableStatus.COMPLETED ? null : (
                <div className={styles.title}>{__('数据加工')}</div>
            )}

            <div
                className={styles.toolBar}
                style={{
                    marginTop:
                        taskInfo.status === TaskExecutableStatus.COMPLETED
                            ? 16
                            : 0,
                }}
            >
                <div>
                    {taskInfo.status === TaskExecutableStatus.COMPLETED ? (
                        <div className={styles.title}>{__('数据加工')}</div>
                    ) : (
                        <Button
                            onClick={() => {
                                setEditData({
                                    name: undefined,
                                    description: undefined,
                                })
                                setEditType(EditStatus.CREATE)
                            }}
                            type="primary"
                            icon={<AddOutlined />}
                        >
                            {__('新建')}
                        </Button>
                    )}
                </div>
                {debounceValue === '' && !dataSource.length ? (
                    <div />
                ) : (
                    <Space size="small" wrap={false}>
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder={__('搜索数据加工名称')}
                            onChange={(e) => {
                                setKeyword(e.target.value)
                            }}
                            style={{
                                width: 280,
                            }}
                            maxLength={128}
                            allowClear
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
                                })
                            }
                        />
                    </Space>
                )}
            </div>
            <div className={styles.tableContainer}>
                {debounceValue === '' && !dataSource.length ? (
                    <div className={styles.empty}>
                        <Empty
                            desc={
                                taskInfo.status ===
                                TaskExecutableStatus.COMPLETED ? (
                                    __('暂无数据')
                                ) : (
                                    <div>
                                        <span>{__('点击')}</span>
                                        <span
                                            style={{
                                                color: '#126ee3',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => {
                                                setEditData({
                                                    name: undefined,
                                                    description: undefined,
                                                })
                                                setEditType(EditStatus.CREATE)
                                            }}
                                        >
                                            {__('【新建】')}
                                        </span>
                                        <span>{__('按钮可新建数据加工')}</span>
                                    </div>
                                )
                            }
                            iconSrc={addEmpty}
                        />
                    </div>
                ) : (
                    <div>
                        {loading ? (
                            <Loader />
                        ) : (
                            <>
                                <Table
                                    dataSource={dataSource}
                                    columns={columns}
                                    pagination={{ position: [] }}
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
                                    scroll={{
                                        x:
                                            taskInfo.status ===
                                            TaskExecutableStatus.COMPLETED
                                                ? 982
                                                : 1200,
                                        y:
                                            dataSource.length > 0
                                                ? total > 10
                                                    ? `calc(100vh - ${
                                                          taskInfo.status ===
                                                          TaskExecutableStatus.COMPLETED
                                                              ? 227
                                                              : 263
                                                      }px)`
                                                    : `calc(100vh - ${
                                                          taskInfo.status ===
                                                          TaskExecutableStatus.COMPLETED
                                                              ? 179
                                                              : 215
                                                      }px)`
                                                : undefined,
                                    }}
                                />
                                <Pagination
                                    current={queryParams.offset}
                                    pageSize={queryParams.limit}
                                    onChange={(page) => {
                                        setQueryParams({
                                            ...queryParams,
                                            offset: page,
                                        })
                                    }}
                                    className={styles.pagination}
                                    total={total}
                                    showSizeChanger={false}
                                    hideOnSinglePage
                                />
                            </>
                        )}
                    </div>
                )}
            </div>
            <EditData
                type={editType}
                initData={editData}
                onClose={() => {
                    setEditData(null)
                    setEditType(EditStatus.NONE)
                }}
                onConfirm={(values) => {
                    if (editType === EditStatus.CREATE) {
                        // 打开绘图抽屉
                        setEditModelInfo(values)
                        setOpen(true)
                        setEditType(EditStatus.NONE)
                    } else {
                        editProcessDataInfo(values)
                    }
                }}
            />
            <DataProcessPage
                open={open}
                onClose={() => {
                    setOpen(false)
                    setEditModelInfo(null)
                    getlist(queryParams)
                }}
                modelInfo={editModelInfo}
                taskId={taskInfo.taskId}
                taskStatus={taskInfo.status}
                configEnum={configEnum}
            />

            <WorkflowLogs
                visible={!!viewLogsId}
                collapsed={collapsed}
                id={viewLogsId}
                onClose={() => {
                    setViewLogsId('')
                }}
                model="proc"
            />
        </div>
    )
}
export default DataProcess
