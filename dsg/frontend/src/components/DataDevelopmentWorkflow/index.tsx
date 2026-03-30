import {
    ExclamationCircleFilled,
    ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useDebounceFn } from 'ahooks'
import { Button, message, Select, Space, Switch, Table, Tooltip } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import { trim } from 'lodash'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import {
    LabelSelect,
    RefreshBtn,
    SortBtn,
} from '@/components/ToolbarComponents'
import { TaskInfoContext } from '@/context'
import {
    deleteWorkFlow,
    editWorkFlowStatus,
    formatError,
    IWorkflowItem,
    queryWorkFlowList,
    SortDirection,
    SortType,
} from '@/core'
import { useTaskCheck } from '@/hooks/useTaskCheck'
import { AddOutlined } from '@/icons'
import { OptionBarTool, OptionMenuType, SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import { confirm } from '@/utils/modalHelper'
import DropDownFilter from '../DropDownFilter'
import CreateWorkflow from './CreateWorkflow'
import EditTimePlan from './EditTimePlan'
import WorkflowContent from './WorkflowContent'
import WorkflowLogs from './WorkflowLogs'
import {
    defaultMenu,
    menus,
    OperateType,
    products,
    stateList,
    totalOperates,
} from './const'
import { handleExecuteWf } from './helper'
import __ from './locale'
import styles from './styles.module.less'

/**
 * 查询参数
 */
interface IQueryParams {
    current?: number
    pageSize?: number
    direction?: SortDirection
    keyword?: string
    sort?: string
    data_range?: number
    overall_priority_rule?: number
    rate?: number
}

// 初始params
const initialQueryParams = {
    current: 1,
    pageSize: 10,
    direction: defaultMenu.sort,
    // sort: defaultMenu.key,
    keyword: '',
}

/**
 * 数据开发工作流
 */
const DataDevelopmentWorkflow: React.FC<{ collapsed: boolean }> = ({
    collapsed,
}) => {
    const { taskInfo } = useContext(TaskInfoContext)
    const { checkTask } = useTaskCheck(totalOperates, products, taskInfo)

    const [loading, setLoading] = useState(true)
    const [fetching, setFetching] = useState(false)
    const [deleteing, setDeleteing] = useState(false)
    const [createVisible, setCreateVisible] = useState(false)
    const [timeVisible, setTimeVisible] = useState(false)
    const [logsVisible, setLogsVisible] = useState(false)
    const [contentVisible, setContentVisible] = useState(false)
    // 操作类型
    const [operate, setOperate] = useState<OperateType>()
    // 搜索关键字
    const [searchKey, setSearchKey] = useState('')
    // 总数
    const [total, setTotal] = useState(0)
    // 工作流列表
    const [items, setItems] = useState<IWorkflowItem[]>([])
    // 操作的工作流
    const [operateItem, setOperateItem] = useState<any>()
    // 筛选值
    const [selectValue, setSelectValue] = useState<string>('')
    // 菜单排序值
    const [menuValue, setMenuValue] = useState<
        { key: SortType; sort: SortDirection } | undefined
    >(defaultMenu)
    // 是否为DropDownFilter控制的排序
    let sortWay: boolean = false
    // 排序params
    const [sortDire, setSortDire] = useState<any>({
        direction: defaultMenu.sort,
        sort: defaultMenu.key,
    })
    // 查询params
    const [queryParams, setQueryParams] =
        useState<IQueryParams>(initialQueryParams)

    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
    })

    // 显示/隐藏搜索框
    const showSearch = useMemo(
        () =>
            fetching ||
            queryParams.keyword !== '' ||
            selectValue !== '' ||
            items.length > 0,
        [fetching, queryParams.keyword, selectValue, items],
    )

    useEffect(() => {
        setLoading(true)
        setSearchKey('')
        setSelectValue('')
        getList(initialQueryParams)
    }, [])

    // 获取表单列表
    const getList = async (params) => {
        try {
            setFetching(true)
            const res = await queryWorkFlowList({
                ...params,
                offset: params.current,
                limit: params.pageSize,
                task_id: taskInfo?.taskId,
            })
            setQueryParams({ ...params })
            sortWay = false
            setTotal(res.total_count)
            setItems(res?.entries || [])
        } catch (e) {
            formatError(e)
            setTotal(0)
            setItems([])
        } finally {
            setLoading(false)
            setFetching(false)
            setMenuValue(undefined)
        }
    }

    // 状态筛选
    const handleSelectChange = (value: string) => {
        setSelectValue(value)
        // getList({
        //     ...queryParams,
        //     current: 1,
        //     status: value === 'true' ? 'on' : value === 'false' ? 'off' : 'all',
        // })
    }

    // 搜索框搜索
    const handleSearchPressEnter = (e: any) => {
        const keyword = typeof e === 'string' ? e : trim(e.target.value)
        getList({
            ...queryParams,
            keyword,
            current: 1,
        })
    }

    // 新建/编辑成功
    const handleCreateEdit = (info) => {
        if (info && operate === OperateType.CREATE) {
            setOperateItem(info)
            setCreateVisible(false)
            setContentVisible(true)
        } else {
            getList({
                ...queryParams,
                current:
                    operate === OperateType.CREATE ? 1 : queryParams.current,
            })
        }
    }

    // 操作处理
    const handleOperate = async (
        type: OperateType,
        item?,
        checked: boolean = true,
    ) => {
        setOperate(type)
        setOperateItem(item)
        switch (type) {
            case OperateType.CREATE:
            case OperateType.DETAIL: {
                setCreateVisible(true)
                break
            }
            case OperateType.PREVIEW:
            case OperateType.EDIT: {
                setContentVisible(true)
                break
            }
            case OperateType.EXECUTE:
                handleExecuteWf(item.id, 'wf')
                break
            case OperateType.CHANGED:
                setItems([
                    ...items.map((info) => {
                        if (info.id === item.id) {
                            return {
                                ...info,
                                activation: checked,
                            }
                        }
                        return info
                    }),
                ])
                try {
                    await editWorkFlowStatus(item.id, checked, taskInfo?.taskId)
                    message.success(
                        checked === true ? __('启用成功') : __('禁用成功'),
                    )
                } catch (err) {
                    formatError(err)
                    setItems([
                        ...items.map((info) => {
                            if (info.id === item.id) {
                                return {
                                    ...info,
                                    activation: !item.activation,
                                }
                            }
                            return info
                        }),
                    ])
                }
                break
            case OperateType.TIMEPLAN:
                setTimeVisible(true)
                break
            case OperateType.LOGS:
                setLogsVisible(true)
                break
            case OperateType.DELETE:
                confirm({
                    title: `${__('确定要删除工作流吗？')}`,
                    icon: (
                        <ExclamationCircleFilled style={{ color: '#F5222D' }} />
                    ),
                    content: __('删除后该工作流及日志将无法找回，请谨慎操作！'),
                    okText: __('确定'),
                    cancelText: __('取消'),
                    okButtonProps: { loading: deleteing },
                    async onOk() {
                        try {
                            setDeleteing(true)
                            await deleteWorkFlow(item.id, taskInfo?.taskId)
                            message.success(__('删除成功'))
                            getList({
                                ...queryParams,
                                current:
                                    items.length === 1
                                        ? queryParams.current! - 1 || 1
                                        : queryParams.current!,
                            })
                        } catch (err) {
                            formatError(err)
                        } finally {
                            setDeleteing(false)
                        }
                    },
                })
                break
            default:
                break
        }
    }
    // 表格项操作的防抖
    const { run: debounceHandleOperate, cancel } = useDebounceFn(
        handleOperate,
        {
            wait: 500,
            leading: true,
            trailing: false,
        },
    )

    // 操作取消处理
    const handleOperateCancel = () => {
        setOperate(undefined)
        setOperateItem(undefined)
        setCreateVisible(false)
        setTimeVisible(false)
        setLogsVisible(false)
        setContentVisible(false)
    }

    // 操作项
    const getOptionMenus = (record) => {
        let optionMenus = [
            {
                key: OperateType.EDIT,
                label: __('编辑'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: OperateType.EXECUTE,
                label: __('立即执行'),
                menuType: OptionMenuType.Menu,
                disabled: record?.node_count === 0,
            },
            {
                key: OperateType.TIMEPLAN,
                label: __('时间计划'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: OperateType.LOGS,
                label: __('日志'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: OperateType.DETAIL,
                label: __('基本信息'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: OperateType.DELETE,
                label: __('删除'),
                menuType: OptionMenuType.Menu,
            },
        ]
        optionMenus = optionMenus.filter((op) => {
            if (
                [
                    OperateType.EXECUTE,
                    OperateType.TIMEPLAN,
                    OperateType.LOGS,
                ].includes(op.key)
            ) {
                return checkTask(op.key, true)
            }
            return checkTask(op.key)
        })
        if (optionMenus.length > 5) {
            return optionMenus.map((op, idx) => {
                if (idx >= 4) {
                    return { ...op, menuType: OptionMenuType.More }
                }
                return op
            })
        }
        return optionMenus
    }

    // 业务表格项
    const columns: ColumnsType<any> = [
        {
            title: __('工作流名称'),
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            sortOrder: tableSort.name,
            showSorterTooltip: false,
            fixed: 'left',
            render: (value, record) => (
                <div className={styles.nameWrap}>
                    <div
                        className={classnames(styles.name, styles.link)}
                        title={value}
                        onClick={() =>
                            debounceHandleOperate(OperateType.PREVIEW, record)
                        }
                    >
                        {value || '--'}
                    </div>
                    <Tooltip title={__('该工作流中节点均被删除')}>
                        <ExclamationCircleOutlined
                            className={styles.errorIcon}
                            hidden={record?.node_count !== 0}
                        />
                    </Tooltip>
                </div>
            ),
        },
        {
            title: __('描述'),
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (value) => (
                <div
                    className={styles.infoWrap}
                    style={{
                        color: value ? 'rgb(0 0 0 / 85%)' : 'rgb(0 0 0 / 45%)',
                    }}
                    title={value}
                >
                    {value || __('暂无描述')}
                </div>
            ),
        },
        {
            title: __('周期'),
            dataIndex: 'frequency',
            key: 'frequency',
            width: 120,
            render: (value, record) => (value > 0 ? `${value} 天` : '--'),
        },
        {
            title: __('执行时间'),
            dataIndex: 'execution_time',
            key: 'execution_time',
            width: 120,
            render: (value) =>
                value && value !== 0 && value !== '' ? value : '--',
        },
        {
            title: __('执行开始于'),
            dataIndex: 'start_date',
            key: 'start_date',
            width: 120,
            render: (value) => value || '--',
        },
        {
            title: __('执行结束于'),
            dataIndex: 'end_date',
            key: 'end_date',
            width: 120,
            render: (value) => value || '--',
        },
        {
            title: __('状态'),
            dataIndex: 'activation',
            key: 'activation',
            width: 60,
            render: (value, record) => (
                <div className={styles.switchWrap}>
                    <Switch
                        title={value ? __('禁用') : __('启用')}
                        checked={value}
                        size="small"
                        onChange={(checked) =>
                            debounceHandleOperate(
                                OperateType.CHANGED,
                                record,
                                checked,
                            )
                        }
                    />
                </div>
            ),
        },
        {
            title: __('操作'),
            fixed: 'right',
            key: 'action',
            width: checkTask(OperateType.EDIT) ? 288 : 206,
            render: (_, record) => (
                <OptionBarTool
                    menus={getOptionMenus(record) as any[]}
                    onClick={(key, e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        debounceHandleOperate(key as OperateType, record)
                    }}
                />
            ),
        },
    ]

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        getList({
            ...queryParams,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            current: 1,
        })
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
                })
                break

            default:
                setTableSort({
                    name: null,
                })
                break
        }
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            if (sorter.columnKey === 'name') {
                setTableSort({
                    name: sorter.order || 'ascend',
                })
            } else {
                setTableSort({
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
        if (queryParams.sort === 'name') {
            setTableSort({
                name:
                    queryParams.direction === SortDirection.ASC
                        ? 'descend'
                        : 'ascend',
            })
        } else {
            setTableSort({
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

    // 空白显示
    const showEmpty = () => {
        const desc = !checkTask(OperateType.CREATE) ? (
            <span>{__('暂无数据')}</span>
        ) : (
            <div>
                {__('点击')}
                <a onClick={() => debounceHandleOperate(OperateType.CREATE)}>
                    {__('【新建】')}
                </a>
                {__('按钮可新建工作流')}
            </div>
        )
        return <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
    }

    return (
        <div className={styles.ddWorkflowWrap}>
            <div className={styles.topWrap}>
                <div className={styles.topLeftWrap}>
                    <div
                        className={styles.title}
                        style={{
                            marginBottom: checkTask(OperateType.CREATE)
                                ? 16
                                : 0,
                            height: checkTask(OperateType.CREATE) ? 20 : 32,
                        }}
                    >
                        {__('工作流')}
                    </div>
                    <Button
                        type="primary"
                        icon={<AddOutlined />}
                        onClick={() =>
                            debounceHandleOperate(OperateType.CREATE)
                        }
                        hidden={!checkTask(OperateType.CREATE)}
                    >
                        {__('新建')}
                    </Button>
                </div>
                <Space
                    size={12}
                    className={styles.topRightWrap}
                    hidden={loading || !showSearch}
                >
                    <LabelSelect
                        contentNode={
                            <Select
                                onChange={handleSelectChange}
                                value={selectValue}
                                optionLabelProp="label"
                                getPopupContainer={(node) => node.parentNode}
                                onSelect={(value) => {
                                    getList({
                                        ...queryParams,
                                        current: 1,
                                        status:
                                            value === 'true'
                                                ? 'on'
                                                : value === 'false'
                                                ? 'off'
                                                : 'all',
                                    })
                                }}
                            >
                                {stateList.map((item: any) => (
                                    <Select.Option
                                        value={item.value}
                                        key={item.value}
                                        title={item.label}
                                        label={
                                            <span>
                                                <span>{__('状态')}：</span>
                                                {item.label}
                                            </span>
                                        }
                                    >
                                        {item.label}
                                    </Select.Option>
                                ))}
                            </Select>
                        }
                    />
                    <SearchInput
                        placeholder={__('搜索工作流名称')}
                        onKeyChange={(value: string) => {
                            setSearchKey(value)
                            handleSearchPressEnter(value)
                        }}
                        onPressEnter={handleSearchPressEnter}
                        style={{ width: 272 }}
                    />
                    <Space size={0}>
                        <SortBtn
                            contentNode={
                                <DropDownFilter
                                    menus={menus}
                                    defaultMenu={defaultMenu}
                                    changeMenu={menuValue}
                                    menuChangeCb={handleMenuChange}
                                />
                            }
                        />
                        <RefreshBtn
                            onClick={() =>
                                getList({
                                    ...queryParams,
                                    keyword: searchKey,
                                    current: 1,
                                })
                            }
                        />
                    </Space>
                </Space>
            </div>
            <div className={styles.bottomWrap}>
                {loading ? (
                    <Loader />
                ) : showSearch ? (
                    <Table
                        columns={columns}
                        dataSource={items}
                        loading={fetching}
                        rowClassName={styles.tableRow}
                        pagination={{
                            current: queryParams.current,
                            pageSize: queryParams.pageSize,
                            total,
                            showSizeChanger: false,
                            hideOnSinglePage: true,
                            onChange: (page) => {
                                getList({
                                    ...queryParams,
                                    current: page,
                                })
                            },
                        }}
                        onChange={(pagination, filters, sorter) => {
                            if (pagination.current === queryParams.current) {
                                const selectedMenu = handleTableChange(sorter)
                                setMenuValue(selectedMenu)
                                getList({
                                    ...queryParams,
                                    sort: selectedMenu.key,
                                    direction: selectedMenu.sort,
                                    current: 1,
                                })
                            }
                        }}
                        scroll={{
                            x: checkTask(OperateType.EDIT) ? 1100 : 982,
                            y:
                                items.length > 0
                                    ? total > 10
                                        ? `calc(100vh - ${
                                              checkTask(OperateType.CREATE)
                                                  ? 263
                                                  : 227
                                          }px)`
                                        : `calc(100vh - ${
                                              checkTask(OperateType.CREATE)
                                                  ? 215
                                                  : 179
                                          }px)`
                                    : undefined,
                        }}
                        locale={{
                            emptyText: <Empty />,
                        }}
                    />
                ) : (
                    <div className={styles.empty}>{showEmpty()}</div>
                )}
            </div>
            <CreateWorkflow
                visible={createVisible}
                operate={operate}
                item={operateItem}
                taskId={taskInfo?.taskId}
                onClose={handleOperateCancel}
                onSure={(info) => handleCreateEdit(info)}
            />
            <EditTimePlan
                visible={timeVisible}
                data={operateItem}
                taskId={taskInfo?.taskId}
                onClose={handleOperateCancel}
                onSure={(info) => {
                    getList(queryParams)
                }}
            />
            <WorkflowLogs
                visible={logsVisible}
                collapsed={collapsed}
                id={operateItem?.id}
                data={operateItem}
                onClose={handleOperateCancel}
            />
            <WorkflowContent
                visible={contentVisible}
                operateType={operate}
                id={operateItem?.id}
                data={operateItem}
                onClose={() => {
                    handleOperateCancel()
                    getList({ ...queryParams })
                }}
            />
        </div>
    )
}

export default DataDevelopmentWorkflow
