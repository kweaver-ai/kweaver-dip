import { ExclamationCircleFilled } from '@ant-design/icons'
import { Space, Tooltip, message } from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import moment from 'moment'
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dataEmpty from '@/assets/dataEmpty.svg'
import DatasourceExploration from '@/components/DatasheetView/DatasourceExploration'
import {
    ExplorationType,
    IDetailsData,
    OperateType,
    defaultMenu,
    explorationContentType,
    explorationTaskStatus,
    explorationTaskStatusList,
} from '@/components/DatasheetView/DatasourceExploration/const'
import {
    DataViewProvider,
    useDataViewContext,
} from '@/components/DatasheetView/DataViewProvider'
import {
    SortDirection,
    SortType,
    cancelExploreTask,
    delExploreTask,
    formatError,
    getExploreTask,
} from '@/core'
import { DatasheetViewColored, FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import {
    LightweightSearch,
    OptionBarTool,
    OptionMenuType,
    SearchInput,
} from '@/ui'
import ReportDetail from './ReportDetail'

import __ from '@/components/DatasheetView/locale'
import styles from '@/components/DatasheetView/styles.module.less'

import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'

import CommonTable from '@/components/CommonTable'

import { getState } from '@/components/BusinessDiagnosis/helper'
import Confirm from '@/components/Confirm'
import {
    dataSourceIsDelNode,
    explorationContentList,
    filterConditionList,
} from '@/components/DatasheetView/DatasourceExploration/helper'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { databaseTypesEleData } from '@/core/dataSource'
import { useGradeLabelState } from '@/hooks/useGradeLabelState'
import DropDownFilter from '@/components/DropDownFilter'
import QualityConfigModal from './QualityConfigModal'

export const menus = [
    { key: SortType.CREATED, label: __('创建时间') },
    { key: SortType.FINISHED, label: __('结束时间') },
]

/**
 * 检测 - 探查任务
 */
const ExamineTaskTable = ({ workOrderId, workOrderTitle }: any) => {
    const [isGradeOpen] = useGradeLabelState()
    const { checkPermission } = useUserPermCtx()
    const navigator = useNavigate()
    const [reportDetailVisible, setReportDetailVisible] = useState<boolean>()

    const [FilterConditions, ExplorationTypeList] = useMemo(() => {
        const filter = filterConditionList.filter((o) => o?.key !== 'type')
        const list = explorationContentList
        return [filter, list]
    }, [filterConditionList])

    const searchList: any = useMemo(
        () =>
            FilterConditions.map((item) => ({
                ...item,
                options: item.options,
            })),
        [isGradeOpen, FilterConditions, checkPermission],
    )

    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        [defaultMenu.key]:
            defaultMenu.sort === SortDirection.DESC ? 'descend' : 'ascend',
    })
    const [searchKey, setSearchKey] = useState<string>('')
    const [searchCondition, setSearchCondition] = useState<any>({
        offset: 1,
        limit: 10,
        sort: defaultMenu.key,
        direction: defaultMenu.sort,
        work_order_id: workOrderId,
        keyword: '',
    })

    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)
    const commonTableRef: any = useRef()
    const [delVisible, setDelVisible] = useState<boolean>(false)
    const [datasourceExplorationOpen, setDatasourceExplorationOpen] =
        useState<boolean>(false)
    const [delBtnLoading, setDelBtnLoading] = useState<boolean>(false)
    const [confirmTitle, setConfirmTitle] = useState<string>('')
    const [confirmText, setConfirmText] = useState<string>('')
    const [taskDetailOpen, setTaskDetailOpen] = useState<boolean>(false)
    const [currentData, setCurrentData] = useState<any>({})
    const [currentOperate, setCurrentOperate] = useState<OperateType>()
    const [explorationErrorDetailsOpen, setExplorationErrorDetailsOpen] =
        useState<boolean>(false)
    const [explorationErrorDetailsData, setExplorationErrorDetailsData] =
        useState<IDetailsData>()
    const [datasourceId, setDatasourceId] = useState<string>()
    const [formView, setFormView] = useState<any>()
    const { setIsValueEvaluation } = useDataViewContext()

    const columns: any = [
        {
            title: '探查库表',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (text, record) => {
                const name = record?.form_view_id
                    ? record?.form_view_name
                    : record?.datasource_name
                return (
                    <div
                        className={classnames(styles.tableName)}
                        style={{ display: 'inline' }}
                    >
                        <span className={styles.ellipsisText} title={name}>
                            {name || dataSourceIsDelNode()}
                        </span>
                    </div>
                )
            },
        },
        {
            title: __('任务状态'),
            dataIndex: 'status',
            key: 'status',
            ellipsis: true,
            render: (text, record) => {
                const remark = record?.remark
                    ? JSON.parse(record.remark)?.details?.[0]?.view_info?.[0]
                          ?.reason ||
                      JSON.parse(record.remark)?.details?.[0]?.exception_desc ||
                      JSON.parse(record.remark)?.description ||
                      __('未知')
                    : __('未知')
                return (
                    <div
                        className={styles.typeWrapper}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        {getState(text, explorationTaskStatusList)}
                        {record?.remark &&
                            record?.status === explorationTaskStatus.Failed &&
                            record?.form_view_id && (
                                <Tooltip title={remark} placement="bottom">
                                    <FontIcon
                                        name="icon-shenheyijian"
                                        type={IconType.COLOREDICON}
                                        className={styles.icon}
                                    />
                                </Tooltip>
                            )}
                    </div>
                )
            },
        },
        {
            title: '所属数据源',
            dataIndex: 'datasource_name',
            key: 'datasource_name',
            ellipsis: true,
            render: (text) => text || '--',
        },
        {
            title: '发起人',
            dataIndex: 'created_by',
            key: 'created_by',
            ellipsis: true,
            render: (text) => text || '--',
        },
        {
            title: __('创建时间'),
            dataIndex: 'created_at',
            key: 'created_at',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.created_at,
            showSorterTooltip: false,
            width: 180,
            render: (text) =>
                text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '--',
        },
        {
            title: '探查时长',
            dataIndex: 'finished_at',
            key: 'finished_at',
            ellipsis: true,
            render: (text, record) => {
                const duration = moment.duration(
                    moment(record?.finished_at).diff(
                        moment(record?.created_at),
                    ),
                )
                const diffText = `${
                    (duration.hours() ? `${duration.hours()}小时` : '') +
                    (duration.hours() || duration.minutes()
                        ? `${duration.minutes()}分`
                        : '')
                }${duration.seconds()}秒`

                return record?.finished_at ? diffText : '--'
            },
        },
        {
            title: '结束时间',
            dataIndex: 'finished_at',
            key: 'finished_at',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.finished_at,
            showSorterTooltip: false,
            width: 180,
            render: (text) =>
                text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '--',
        },
        {
            title: __('操作'),
            dataIndex: 'option',
            key: 'option',
            ellipsis: true,
            width: 150,
            render: (text, record) => {
                const btnList = [
                    {
                        label: '查看报告',
                        status: OperateType.Detail,
                        show: record.status === explorationTaskStatus.Finished,
                    },
                    {
                        label: __('取消探查'),
                        status: OperateType.Cancel,
                        show:
                            record.status === explorationTaskStatus.Queuing ||
                            record.status === explorationTaskStatus.Running,
                        popconfirmTips:
                            record.status === explorationTaskStatus.Queuing
                                ? __('取消探查后，该任务将会直接删除')
                                : __('取消探查后，将不会产生探查报告'),
                    },
                    // 暂时屏蔽
                    // {
                    //     label: __('重新探查'),
                    //     status: OperateType.ReStart,
                    //     show: record.status === explorationTaskStatus.Failed,
                    // },
                ]
                const opList = btnList
                    .filter((item) => item.show)
                    .map((op, idx) => {
                        return {
                            ...op,
                            key: op.status,
                            menuType:
                                idx >= 3
                                    ? OptionMenuType.More
                                    : OptionMenuType.Menu,
                        }
                    })
                return (
                    <OptionBarTool
                        menus={opList as any[]}
                        onClick={(key, e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleOperate(key as OperateType, record)
                        }}
                    />
                )
            },
        },
    ]

    const emptyDesc = () => {
        return <div>{__('暂无数据')}</div>
    }

    // 查询
    const search = () => {
        commonTableRef?.current?.getData()
    }

    const toDataViewDetails = (id: string, type: string) => {
        const url: string = `/datasheet-view/detail?id=${id}&targetTab=${type}`
        navigator(url)
    }

    const handleOperate = (op: OperateType, item: any) => {
        setCurrentData(item)
        setCurrentOperate(op)
        if (op === OperateType.Cancel) {
            setConfirmTitle(__('确定要取消探查吗？'))
            setConfirmText(
                item.status === explorationTaskStatus.Running
                    ? __('取消探查后，将不会产生探查报告')
                    : __('取消探查后，该任务将会直接删除'),
            )
            setDelVisible(true)
        } else if (op === OperateType.Detail) {
            setReportDetailVisible(true)
        } else if (op === OperateType.ReStart) {
            if (item?.form_view_id) {
                // 探查库表
                setFormView({
                    ...item,
                    business_name: item?.form_view_name,
                    id: item?.form_view_id,
                })
                setDatasourceId('')
            } else {
                // 探查数据源
                setDatasourceId(item?.datasource_id)
                setFormView({})
            }
            setDatasourceExplorationOpen(true)
            setIsValueEvaluation(true)
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
            created_at: null,
            finished_at: null,
            [selectedMenu.key]:
                selectedMenu.sort === SortDirection.ASC ? 'ascend' : 'descend',
        })
    }
    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            setTableSort({
                created_at: null,
                finished_at: null,
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

    const FilterDefaultValue = useMemo(() => {
        return { status: undefined }
    }, [])

    const confirmHandle = async () => {
        try {
            if (currentOperate === OperateType.Cancel) {
                await cancelExploreTask({
                    id: currentData.task_id,
                    status: 'canceled',
                })
                message.success(__('取消成功'))
            } else if (currentOperate === OperateType.Del) {
                await delExploreTask(currentData.task_id)
                message.success(__('删除成功'))
            }
        } catch (err) {
            formatError(err)
        } finally {
            search()
            setDelVisible(false)
        }
    }

    return (
        <div className={styles.taskWrapper}>
            <div className={styles.taskBox}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                    }}
                >
                    <div>检测任务</div>
                    <Space size={8} className={styles['taskBox-search']}>
                        <SearchInput
                            maxLength={255}
                            value={searchKey}
                            onKeyChange={(kw: string) => {
                                if (kw) {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        keyword: kw,
                                    })
                                }
                                setSearchKey(kw)
                            }}
                            // 解决清除按钮接口调用2次
                            onChange={(e) => {
                                const { value } = e.target
                                if (!value) {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        keyword: undefined,
                                    })
                                }
                            }}
                            className={styles['taskBox-search-inp']}
                            style={{ width: 272 }}
                            placeholder="搜索探查库表名称"
                        />
                        <LightweightSearch
                            formData={searchList}
                            onChange={(data, key) => {
                                if (key === 'status') {
                                    setSearchCondition((prev) => ({
                                        ...prev,
                                        offset: 1,
                                        status: data.status || undefined,
                                    }))
                                } else {
                                    setSearchCondition((prev) => ({
                                        ...prev,
                                        offset: 1,
                                        status: undefined,
                                    }))
                                }
                            }}
                            defaultValue={FilterDefaultValue}
                            getPopupContainer={(node) => node}
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
                        <RefreshBtn onClick={() => search()} />
                    </Space>
                </div>
                <div>
                    <CommonTable
                        queryAction={getExploreTask}
                        params={searchCondition}
                        baseProps={{
                            columns,
                            rowClassName: styles.tableRow,
                            rowKey: 'task_id',
                            scroll: { y: 'calc(100vh - 274px)' },
                        }}
                        ref={commonTableRef}
                        emptyDesc={emptyDesc()}
                        emptyIcon={dataEmpty}
                        onTableListUpdated={() => {
                            setSelectedSort(undefined)
                        }}
                        onChange={(currentPagination, filters, sorter) => {
                            if (
                                currentPagination.current ===
                                searchCondition.offset
                            ) {
                                const selectedMenu = handleTableChange(sorter)
                                setSelectedSort(selectedMenu)
                                setSearchCondition({
                                    ...searchCondition,
                                    sort: selectedMenu.key,
                                    direction: selectedMenu.sort,
                                    limit: currentPagination?.pageSize,
                                    offset: 1,
                                })
                            } else {
                                setSearchCondition({
                                    ...searchCondition,
                                    offset: currentPagination?.current || 1,
                                    limit: currentPagination?.pageSize || 10,
                                })
                            }
                        }}
                    />
                </div>
            </div>
            {/* 取消、删除 */}
            <Confirm
                open={delVisible}
                title={confirmTitle}
                content={confirmText}
                icon={
                    <ExclamationCircleFilled
                        style={{ color: '#FAAD14', fontSize: '22px' }}
                    />
                }
                onOk={confirmHandle}
                onCancel={() => {
                    setDelVisible(false)
                }}
                width={410}
                okButtonProps={{ loading: delBtnLoading }}
            />

            {/* 探查数据源 */}
            {datasourceExplorationOpen && (
                <DatasourceExploration
                    open={datasourceExplorationOpen}
                    type={ExplorationType.FormView}
                    formView={formView}
                    onClose={() => {
                        setDatasourceExplorationOpen(false)
                    }}
                    hiddenRadio
                    datasourceId={datasourceId}
                />
            )}

            {reportDetailVisible && (
                <DataViewProvider>
                    <ReportDetail
                        item={currentData}
                        visible={reportDetailVisible}
                        onClose={() => {
                            setReportDetailVisible(false)
                            setCurrentData(undefined)
                        }}
                        showCorrection={false}
                        title={workOrderTitle}
                    />
                </DataViewProvider>
            )}
        </div>
    )
}

export default ExamineTaskTable
