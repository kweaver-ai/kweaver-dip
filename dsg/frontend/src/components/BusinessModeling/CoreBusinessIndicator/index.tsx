import { useAntdTable, useClickAway, useUpdateEffect } from 'ahooks'
import { Button, Space, Table, message } from 'antd'
import { SortOrder } from 'antd/es/table/interface'
import { TableRowSelection } from 'antd/lib/table/interface'
import { isNumber } from 'lodash'
import { memo, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Confirm from '@/components/Confirm'
import DropDownFilter from '@/components/DropDownFilter'
import {
    IBusinessIndicator,
    SortDirection,
    SortType,
    deleteCoreBusinessIndicator,
    formatError,
    getCoreBusinessIndicatorDetail,
    getCoreBusinessIndicators,
    TaskStatus,
    TaskType,
    BizModelType,
    LoginPlatform,
    getCoreBusinessDetails,
    transformQuery,
} from '@/core'
import { AddOutlined } from '@/icons'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import { OptionMenuType, SearchInput, Empty, Loader } from '@/ui'
import { OperateType, formatTime, getPlatformNumber } from '@/utils'
import { labelText } from '../helper'
import __ from '../locale'
import styles from './styles.module.less'
import dataEmpty from '@/assets/dataEmpty.svg'
import empty from '@/assets/emptyAdd.svg'
import { defaultMenu, menus, operatingKeyList } from '../const'
import Detail from './Detail'
import OperationModel from './OperationModel'
import { TaskInfoContext } from '@/context'
import ModelOperate from '../ModelOperate'
import CreateTaskSelect from '@/components/TaskComponents/CreateTaskSelect'
import CreateTask from '@/components/TaskComponents/CreateTask'
import { useTaskCheck } from '@/hooks/useTaskCheck'
import { OptionType } from '@/components/FormGraph/helper'
import { useBusinessModelContext } from '../BusinessModelProvider'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import OperationDataIndicatorModel from './OperationComponent/OperationDataIndicatorModel'

const CoreBusinessIndicator = ({
    modelId,
    coreBizName,
}: {
    modelId: string
    coreBizName: string
}) => {
    const { taskInfo } = useContext(TaskInfoContext)
    const [searchParams, setSearchParams] = useSearchParams()
    // 数据运营工程师角色
    const { checkPermission } = useUserPermCtx()
    const hasTaskPermission = useMemo(
        () => checkPermission('manageDataOperationProject'),
        [checkPermission],
    )
    const hasOprPermission = useMemo(
        () => checkPermission('manageBusinessModelAndBusinessDiagnosis'),
        [checkPermission],
    )
    const indicatorOpt = searchParams.get('optType') || ''
    const [operationVisible, setOperationVisible] = useState(false)
    const [dataIndicatorOperationVisible, setDataIndicatorOperationVisible] =
        useState(false)
    const [delVisible, setDelVisible] = useState(false)
    const [operateType, setOperateType] = useState<OperateType | undefined>(
        OperateType.CREATE,
    )
    const [delBtnLoading, setDelBtnLoading] = useState(false)
    const [operateItem, setOperateItem] = useState<IBusinessIndicator>()
    const [searchKey, setSearchKey] = useState('')
    const [searchCondition, setSearchCondition] = useState<any>({
        limit: 10,
        offset: 1,
        sort: defaultMenu.key,
        direction: defaultMenu.sort,
        keyword: '',
    })

    // 创建任务
    const [createTaskVisible, setCreateTaskVisible] = useState(false)
    const [createTaskType, setCreateTaskType] = useState<string>()

    const [selectedIdicator, setSelectedIndicator] = useState<Array<any>>([])
    const {
        businessModelType,
        isDraft,
        refreshDraft,
        selectedVersion,
        refreshCoreBusinessDetails,
        isButtonDisabled,
    } = useBusinessModelContext()

    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])

    // 表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        created_at: null,
        updated_at: null,
        [defaultMenu.key]:
            defaultMenu.sort === SortDirection.DESC ? 'descend' : 'ascend',
    })

    const platform = getPlatformNumber()
    // 是否为cs 平台
    const isCSPlatform = useMemo(() => {
        return platform !== LoginPlatform.default
    }, [platform])

    // 新建任务默认值
    const createTaskData = useMemo(() => {
        return [
            {
                name: 'task_type',
                value: createTaskType,
                disabled: true,
            },
            {
                name: 'main_biz',
                value: { id: modelId, name: coreBizName },
                disabled: true,
            },
            {
                name: 'biz_indicator',
                value: selectedIdicator.map((i) => ({
                    id: i.id,
                    name: i.name,
                })),
                disabled: true,
            },
        ]
    }, [createTaskType])

    const rowSelection: TableRowSelection<any> = {
        type: 'checkbox',
        fixed: true,
        onSelect: (record, selected, selectedRows) => {
            setSelectedIndicator(selectedRows)
        },
        onSelectAll: (selected, selectedRows, changeRows) => {
            // 多选更新选中项
            setSelectedIndicator(selectedRows)
        },
        selectedRowKeys: selectedIdicator.map(
            (currentSelectedData) => currentSelectedData.id,
        ),
    }

    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)

    // 获取业务指标列表
    const getDimModelListData = async (params) => {
        const { limit, offset, sort, direction, keyword } = params
        if (!modelId) {
            return { total: 0, list: [] }
        }
        try {
            const res: any = await getCoreBusinessIndicators({
                mid: modelId,
                limit,
                offset,
                sort,
                direction,
                keyword,
                ...versionParams,
            })
            return { total: res.total_count, list: res.entries || [] }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setSelectedSort(undefined)
        }
    }

    useEffect(() => {
        if (indicatorOpt) {
            setOperateType(indicatorOpt as OperateType)
            setOperationVisible(true)
            // 移除optType
            searchParams.delete('optType')
            setSearchParams(searchParams)
        }
    }, [indicatorOpt])

    const { tableProps, run, loading, pagination } = useAntdTable(
        getDimModelListData,
        {
            defaultPageSize: 10,
            manual: true,
        },
    )

    useEffect(() => {
        if (modelId) {
            run(searchCondition)
        }
    }, [modelId, isDraft, selectedVersion])

    useEffect(() => {
        run({ ...searchCondition, current: searchCondition.offset })
    }, [searchCondition])

    useUpdateEffect(() => {
        if (searchKey === searchCondition.keyword) return
        setSearchCondition({
            ...searchCondition,
            keyword: searchKey,
            limit: 24,
            offset: 1,
        })
    }, [searchKey])

    // 根据草稿是否变化，刷新列表
    const refreshListWithDraft = async (params) => {
        try {
            const res = await getCoreBusinessDetails(modelId)
            // 草稿状态发生变化，刷新草稿，通过监听isDraft的变化触发getList
            if (res.has_draft !== undefined && res.has_draft !== isDraft) {
                refreshDraft?.(res.has_draft)
            } else {
                // 草稿状态不变，刷新列表
                setSearchCondition(params)
            }
            refreshCoreBusinessDetails?.(res)
        } catch (error) {
            formatError(error)
        }
    }

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition({
            ...searchCondition,
            offset: 1,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
        })
        onChangeMenuToTableSort(selectedMenu)
    }

    const onChangeMenuToTableSort = (selectedMenu) => {
        setTableSort({
            name: null,
            created_at: null,
            updated_at: null,
            [selectedMenu.key]:
                selectedMenu.sort === SortDirection.ASC ? 'ascend' : 'descend',
        })
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            setTableSort({
                created_at: null,
                updated_at: null,
                name: null,
                [sorter.columnKey]: sorter.order || 'ascend',
            })
            return {
                key: sorter.columnKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }

        setTableSort({
            created_at: null,
            updated_at: null,
            name: null,
            [sorter.columnKey]:
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

    // 业务指标操作处理
    const handleOperate = async (op: OperateType, item?: any) => {
        setOperateItem(item)
        setOperateType(op)
        switch (op) {
            case OperateType.CREATE:
                setOperationVisible(true)
                break
            case OperateType.DETAIL:
                break
            case OperateType.EDIT:
                setOperationVisible(true)
                break
            case OperateType.CREATETASK:
                setCreateTaskType(TaskType.INDICATORPROCESSING)
                setCreateTaskVisible(true)
                setSelectedIndicator([item])
                break
            case OperateType.DELETE:
                setDelVisible(true)
                break
            default:
                break
        }
    }

    /**
     * 数据指标操作
     * @param op 操作类型
     * @param item 操作项
     */
    const handleDataIndicatorOperate = (op: OperateType, item?: any) => {
        setOperateItem(item)
        setOperateType(op)

        switch (op) {
            case OperateType.CREATE:
                setDataIndicatorOperationVisible(true)
                break
            case OperateType.DETAIL:
                setDataIndicatorOperationVisible(true)
                break
            case OperateType.EDIT:
                setDataIndicatorOperationVisible(true)
                break
            case OperateType.CREATETASK:
                setCreateTaskType(TaskType.INDICATORPROCESSING)
                setCreateTaskVisible(true)
                setSelectedIndicator([item])
                break
            case OperateType.DELETE:
                setDelVisible(true)
                break
            default:
                break
        }
    }

    // 删除业务指标
    const handleDelete = async () => {
        try {
            setDelBtnLoading(true)
            if (!operateItem) return
            await deleteCoreBusinessIndicator(operateItem.id, {
                mid: modelId,
            })
            setDelBtnLoading(false)
            message.success(__('删除成功'))
            refreshListWithDraft({
                ...searchCondition,
                offset:
                    tableProps.dataSource?.length === 1 &&
                    tableProps.pagination.current !== 1
                        ? (searchCondition.offset ?? 1) - 1
                        : searchCondition.offset,
            })
        } catch (error) {
            formatError(error)
        } finally {
            setDelBtnLoading(false)
            setDelVisible(false)
        }
    }

    // 新建/编辑 业务指标
    const handleCreateEdit = () => {
        refreshListWithDraft({
            ...searchCondition,
            offset:
                operateType === OperateType.CREATE ? 1 : searchCondition.offset,
        })
    }

    // 空库表
    const renderEmpty = () => {
        if (
            taskInfo.taskStatus === TaskStatus.COMPLETED ||
            !hasOprPermission // 非运营工程师
        ) {
            return (
                <Empty
                    iconSrc={dataEmpty}
                    desc={
                        businessModelType === BizModelType.BUSINESS
                            ? __('暂无业务指标')
                            : __('暂无数据指标')
                    }
                />
            )
        }
        const createView = (
            <Empty
                desc={
                    <div>
                        <div>
                            {__('点击')}
                            {__('【新建】')}
                            {businessModelType === BizModelType.BUSINESS
                                ? __('按钮可新建一个业务指标')
                                : __('按钮可新建一个数据指标')}
                        </div>
                        <Button
                            style={{ marginTop: 16 }}
                            type="primary"
                            onClick={() => {
                                if (
                                    businessModelType === BizModelType.BUSINESS
                                ) {
                                    handleOperate(OperateType.CREATE)
                                } else {
                                    handleDataIndicatorOperate(
                                        OperateType.CREATE,
                                    )
                                }
                            }}
                            disabled={isButtonDisabled}
                            title={
                                isButtonDisabled ? __('审核中，无法操作') : ''
                            }
                        >
                            <AddOutlined />
                            {__('新建')}
                        </Button>
                    </div>
                }
                iconSrc={empty}
            />
        )
        return searchKey ? <Empty /> : createView
    }

    // 列表项
    const columns: any = () => {
        const cols = [
            {
                title:
                    businessModelType === BizModelType.BUSINESS
                        ? __('业务指标名称')
                        : __('数据指标名称'),
                dataIndex: 'name',
                key: 'name',
                sorter: true,
                sortOrder: tableSort.name,
                showSorterTooltip: false,
                render: (value, record) => (
                    <div
                        className={styles.bizIndicatorName}
                        title={labelText(value) as any}
                        onClick={(e) => {
                            handleOperate(OperateType.DETAIL, record)
                            e.stopPropagation()
                        }}
                    >
                        <span>{labelText(value)}</span>
                    </div>
                ),
                ellipsis: true,
            },
            {
                title: __('指标编号'),
                dataIndex: 'code',
                key: 'code',
                ellipsis: true,
                render: (value) => labelText(value),
            },
            {
                title: __('描述'),
                dataIndex: 'description',
                key: 'description',
                ellipsis: true,
                render: (value) => labelText(value, __('暂无描述')),
            },
            {
                title: __('创建时间'),
                dataIndex: 'created_at',
                key: 'created_at',
                width: 180,
                ellipsis: true,
                sorter: true,
                sortOrder: tableSort.created_at,
                showSorterTooltip: false,
                render: (value) => {
                    return isNumber(value) ? formatTime(value) : '--'
                },
            },
            {
                title: __('更新人'),
                dataIndex: 'updater_name',
                key: 'updater_name',
                ellipsis: true,
                render: (value) => labelText(value),
            },
            {
                title: __('更新时间'),
                dataIndex: 'updated_at',
                key: 'updated_at',
                width: 180,
                ellipsis: true,
                sorter: true,
                sortOrder: tableSort.updated_at,
                showSorterTooltip: false,
                render: (value) => {
                    return isNumber(value) ? formatTime(value) : '--'
                },
            },
            {
                title: __('操作'),
                key: 'action',
                width:
                    taskInfo?.taskStatus === TaskStatus.COMPLETED ||
                    !hasOprPermission
                        ? 90
                        : 220,
                fixed: 'right',
                render: (_, record) => {
                    const menuList = [
                        {
                            key: OperateType.DETAIL,
                            label: __('详情'),
                            menuType: OptionMenuType.Menu,
                        },
                        {
                            key: OperateType.EDIT,
                            label: __('编辑'),
                            menuType: OptionMenuType.Menu,
                            disabled: isButtonDisabled,
                            title: isButtonDisabled
                                ? __('审核中，无法操作')
                                : '',
                        },
                        // {
                        //     key: OperateType.CREATETASK,
                        //     label: __('新建任务'),
                        //     menuType: OptionMenuType.Menu,
                        //     disabled: isButtonDisabled,
                        //     title: isButtonDisabled
                        //         ? __('审核中，无法操作')
                        //         : '',
                        // },
                        {
                            key: OperateType.DELETE,
                            label: __('删除'),
                            menuType: OptionMenuType.Menu,
                            disabled: isButtonDisabled,
                            title: isButtonDisabled
                                ? __('审核中，无法操作')
                                : '',
                        },
                    ].filter((menuOption) => {
                        if (
                            taskInfo?.taskStatus === TaskStatus.COMPLETED ||
                            !hasOprPermission
                        ) {
                            return menuOption.key === OperateType.DETAIL
                        }

                        if (
                            (taskInfo?.id ||
                                businessModelType === BizModelType.DATA) &&
                            menuOption.key === OperateType.CREATETASK
                        ) {
                            return false
                        }
                        return true
                    })
                    return (
                        <Space size={12}>
                            {menuList.map((item) => (
                                <Button
                                    key={item.key}
                                    type="link"
                                    ghost
                                    disabled={item.disabled}
                                    title={item.title}
                                    style={{ padding: 0 }}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleOperate(
                                            item.key as OperateType,
                                            record,
                                        )
                                    }}
                                >
                                    {item.label}
                                </Button>
                            ))}
                        </Space>
                    )
                },
            },
        ]

        const dataCols = [
            {
                title: __('数据指标名称/描述'),
                dataIndex: 'name',
                key: 'name',
                sorter: true,
                sortOrder: tableSort.name,
                showSorterTooltip: false,
                render: (value, record) => (
                    <div
                        className={styles.dataIndicatorName}
                        title={labelText(value) as any}
                        onClick={(e) => {
                            handleOperate(OperateType.DETAIL, record)
                            e.stopPropagation()
                        }}
                    >
                        <div
                            className={styles.bizIndicatorName}
                            title={labelText(value) as any}
                        >
                            {labelText(value)}
                        </div>
                        <div
                            className={styles.dataIndicatorDesc}
                            title={record.description || ''}
                        >
                            {record.description || '--'}
                        </div>
                    </div>
                ),
                ellipsis: true,
            },
            {
                title: __('指标编号'),
                dataIndex: 'code',
                key: 'code',
                ellipsis: true,
                render: (value) => labelText(value),
            },
            {
                title: __('来源表'),
                dataIndex: 'source_table_name',
                key: 'source_table_name',
                ellipsis: true,
                render: (value) => value,
            },
            {
                title: __('来源字段'),
                dataIndex: 'source_field_name',
                key: 'source_field_name',
                ellipsis: true,
                render: (value) => value,
            },
            {
                title: __('运算逻辑'),
                dataIndex: 'operation_logic',
                key: 'operation_logic',
                ellipsis: true,
                render: (value) => {
                    const operationLogics = value
                        .split('\\')
                        .map((item) => {
                            const operationLogic = operatingKeyList.find(
                                (itemOperation) => itemOperation.value === item,
                            )
                            return operationLogic?.label || item
                        })
                        .filter((item) => item)
                        .join('\\')
                    return operationLogics
                },
            },
            {
                title: __('取值规则'),
                dataIndex: 'source_rule',
                key: 'source_rule',
                ellipsis: true,
                render: (value) => value,
            },
            {
                title: __('取值说明'),
                dataIndex: 'source_rule_desc',
                key: 'source_rule_desc',
                ellipsis: true,
                render: (value) => value,
            },
            {
                title: __('检验规则'),
                dataIndex: 'check_rule',
                key: 'check_rule',
                ellipsis: true,
                render: (value) => value,
            },

            {
                title: __('最终修改人/时间'),
                dataIndex: 'updater_name',
                key: 'updater_name',
                ellipsis: true,
                render: (value, record) => (
                    <div className={styles.dataIndicatorName}>
                        <div>{labelText(value)}</div>
                        <div className={styles.dataIndicatorDesc}>
                            {isNumber(record.updated_at)
                                ? formatTime(record.updated_at)
                                : '--'}
                        </div>
                    </div>
                ),
            },
            {
                title: __('操作'),
                key: 'action',
                width:
                    taskInfo?.taskStatus === TaskStatus.COMPLETED ||
                    !hasOprPermission
                        ? 90
                        : 220,
                fixed: 'right',
                render: (_, record) => {
                    const menuList = [
                        {
                            key: OperateType.DETAIL,
                            label: __('详情'),
                            menuType: OptionMenuType.Menu,
                        },
                        {
                            key: OperateType.EDIT,
                            label: __('编辑'),
                            menuType: OptionMenuType.Menu,
                            disabled: isButtonDisabled,
                            title: isButtonDisabled
                                ? __('审核中，无法操作')
                                : '',
                        },
                        // {
                        //     key: OperateType.CREATETASK,
                        //     label: __('新建任务'),
                        //     menuType: OptionMenuType.Menu,
                        //     disabled: isButtonDisabled,
                        //     title: isButtonDisabled
                        //         ? __('审核中，无法操作')
                        //         : '',
                        // },
                        {
                            key: OperateType.DELETE,
                            label: __('删除'),
                            menuType: OptionMenuType.Menu,
                            disabled: isButtonDisabled,
                            title: isButtonDisabled
                                ? __('审核中，无法操作')
                                : '',
                        },
                    ].filter((menuOption) => {
                        if (
                            taskInfo?.taskStatus === TaskStatus.COMPLETED ||
                            !hasOprPermission
                        ) {
                            return menuOption.key === OperateType.DETAIL
                        }

                        if (
                            (taskInfo?.id ||
                                businessModelType === BizModelType.DATA) &&
                            menuOption.key === OperateType.CREATETASK
                        ) {
                            return false
                        }
                        return true
                    })
                    return (
                        <Space size={12}>
                            {menuList.map((item) => (
                                <Button
                                    key={item.key}
                                    type="link"
                                    ghost
                                    disabled={item.disabled}
                                    title={item.title}
                                    style={{ padding: 0 }}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleDataIndicatorOperate(
                                            item.key as OperateType,
                                            record,
                                        )
                                    }}
                                >
                                    {item.label}
                                </Button>
                            ))}
                        </Space>
                    )
                },
            },
        ]

        return businessModelType === BizModelType.BUSINESS ? cols : dataCols
    }

    return (
        <div className={styles['business-indicator']}>
            <div
                style={{ height: '100%' }}
                onClick={() => {
                    if (operateType === OperateType.DETAIL) {
                        setOperateType(OperateType.CREATE)
                    }
                }}
            >
                <div className={styles['business-indicator-title']}>
                    <div>
                        {businessModelType === BizModelType.BUSINESS
                            ? __('业务指标')
                            : __('数据指标')}
                    </div>
                    {taskInfo.taskId &&
                        taskInfo.taskStatus !== TaskStatus.COMPLETED && (
                            <ModelOperate modelId={modelId} />
                        )}
                </div>
                <div className={styles['business-indicator-content']}>
                    <div
                        className={styles['business-indicator-content-top']}
                        style={{
                            visibility:
                                !searchKey && tableProps.dataSource.length === 0
                                    ? 'hidden'
                                    : 'visible',
                        }}
                    >
                        <Space>
                            <div
                                className={
                                    styles[
                                        'business-indicator-content-top-left'
                                    ]
                                }
                            >
                                <Button
                                    type="primary"
                                    icon={<AddOutlined />}
                                    onClick={() => {
                                        if (
                                            businessModelType ===
                                            BizModelType.BUSINESS
                                        ) {
                                            handleOperate(OperateType.CREATE)
                                        } else {
                                            handleDataIndicatorOperate(
                                                OperateType.CREATE,
                                            )
                                        }
                                    }}
                                    hidden={
                                        taskInfo?.taskStatus ===
                                            TaskStatus.COMPLETED ||
                                        !hasOprPermission
                                    }
                                    disabled={isButtonDisabled}
                                    title={
                                        isButtonDisabled
                                            ? __('审核中，无法操作')
                                            : ''
                                    }
                                >
                                    {__('新建')}
                                </Button>
                            </div>
                            <div
                                className={
                                    styles[
                                        'business-indicator-content-top-left'
                                    ]
                                }
                            >
                                {!isCSPlatform && (
                                    <CreateTaskSelect
                                        taskItems={[
                                            TaskType.INDICATORPROCESSING,
                                        ]}
                                        disabled={
                                            selectedIdicator.length === 0 ||
                                            isButtonDisabled
                                        }
                                        onSelected={(type) => {
                                            setCreateTaskType(type)
                                            setCreateTaskVisible(true)
                                        }}
                                        btnText={__('新建指标开发任务')}
                                        hidden={
                                            taskInfo?.id || !hasTaskPermission
                                        }
                                        title={
                                            isButtonDisabled
                                                ? __('审核中，无法操作 ')
                                                : selectedIdicator.length === 0
                                                ? __(
                                                      '选择业务指标创建指标开发任务',
                                                  )
                                                : ''
                                        }
                                    />
                                )}
                            </div>
                        </Space>
                        <Space
                            size={12}
                            className={
                                styles['business-indicator-content-top-right']
                            }
                        >
                            <SearchInput
                                style={{ width: 272 }}
                                placeholder={__('搜索业务指标名称、指标编号')}
                                onKeyChange={(kw: string) => {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        keyword: kw,
                                    })
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
                            columns={columns()}
                            {...tableProps}
                            loading={loading ? { tip: __('加载中...') } : false}
                            rowKey="id"
                            pagination={{
                                ...tableProps.pagination,
                                showSizeChanger: false,
                                hideOnSinglePage: true,
                            }}
                            rowSelection={
                                taskInfo?.taskStatus === TaskStatus.COMPLETED ||
                                !hasOprPermission ||
                                isCSPlatform
                                    ? undefined
                                    : rowSelection
                            }
                            scroll={{
                                x: 900,
                                y:
                                    tableProps.dataSource.length > 0
                                        ? tableProps.dataSource.total > 10
                                            ? 'calc(100vh - 350px)'
                                            : 'calc(100vh - 308px)'
                                        : undefined,
                            }}
                            bordered={false}
                            locale={{
                                emptyText: <Empty />,
                            }}
                            onChange={(newPagination, filters, sorter) => {
                                const selectedMenu = handleTableChange(sorter)
                                setSelectedSort(selectedMenu)
                                setSearchCondition({
                                    ...searchCondition,
                                    sort: selectedMenu.key,
                                    direction: selectedMenu.sort,
                                    offset: newPagination.current,
                                })
                            }}
                        />
                    ) : loading ? (
                        <div style={{ marginTop: '140px' }}>
                            <Loader />
                        </div>
                    ) : (
                        <div className={styles.emptyWrapper}>
                            {renderEmpty()}
                        </div>
                    )}
                </div>
            </div>
            <Confirm
                open={delVisible}
                title={
                    businessModelType === BizModelType.BUSINESS
                        ? __('确认要删除业务指标吗?')
                        : __('确认要删除数据指标吗?')
                }
                content={
                    businessModelType === BizModelType.BUSINESS
                        ? __('删除后该业务指标将无法找回，请谨慎操作!')
                        : __('删除后该数据指标将无法找回，请谨慎操作!')
                }
                onOk={handleDelete}
                onCancel={() => {
                    setDelVisible(false)
                }}
                width={432}
                okButtonProps={{ loading: delBtnLoading }}
            />

            {operateType === OperateType.DETAIL &&
                businessModelType === BizModelType.BUSINESS && (
                    <Detail
                        id={operateItem?.id}
                        onClose={() => {
                            setOperateType(undefined)
                        }}
                    />
                )}

            <OperationModel
                visible={operationVisible}
                item={operateItem}
                operate={operateType as OperateType}
                mId={modelId}
                onClose={() => {
                    setOperationVisible(false)
                    setOperateItem(undefined)
                }}
                onSure={handleCreateEdit}
            />
            <OperationDataIndicatorModel
                visible={dataIndicatorOperationVisible}
                operate={operateType as OperateType}
                item={operateItem}
                mId={modelId}
                onClose={() => {
                    setDataIndicatorOperationVisible(false)
                    setOperateItem(undefined)
                }}
                onSure={handleCreateEdit}
            />
            <CreateTask
                show={createTaskVisible}
                operate={OperateType.CREATE}
                title={__('新建任务')}
                defaultData={createTaskData}
                isSupportFreeTask
                onClose={(val) => {
                    if (val) {
                        setSelectedIndicator([])
                    }
                    setCreateTaskVisible(false)
                    setCreateTaskType(undefined)
                }}
            />
        </div>
    )
}

export default memo(CoreBusinessIndicator)
