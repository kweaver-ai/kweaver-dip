import React, { useEffect, useState, useRef, useMemo } from 'react'
import { Tooltip, Space, message } from 'antd'
import moment from 'moment'
import classnames from 'classnames'
import { useNavigate } from 'react-router-dom'
import { ExclamationCircleFilled, InfoCircleOutlined } from '@ant-design/icons'
import { SortOrder } from 'antd/lib/table/interface'
import styles from './styles.module.less'
import __ from '../locale'
import { DatasheetViewColored, FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { SortBtn, RefreshBtn } from '@/components/ToolbarComponents'
import {
    Empty,
    SearchInput,
    LightweightSearch,
    OptionBarTool,
    OptionMenuType,
} from '@/ui'
import {
    OperateType,
    defaultMenu,
    menus,
    explorationTaskStatusList,
    explorationTaskStatus,
    IDetailsData,
    explorationContentType,
    ExplorationType,
} from './const'
import dataEmpty from '@/assets/dataEmpty.svg'
import CommonTable from '@/components/CommonTable'
import {
    formatError,
    SortDirection,
    getExploreTask,
    cancelExploreTask,
    delExploreTask,
} from '@/core'
import { getState } from '@/components/BusinessDiagnosis/helper'
import Confirm from '@/components/Confirm'
import ExplorationTaskDetails from './ExplorationTaskDetails'
import DropDownFilter from '../../DropDownFilter'
import { databaseTypesEleData } from '@/core/dataSource'
import {
    explorationContentList,
    filterConditionList,
    dataSourceIsDelNode,
} from './helper'
import ExplorationErrorDetails from './ExplorationErrorDetails'
import { useGradeLabelState } from '@/hooks/useGradeLabelState'
import DatasourceExploration from './index'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { useDataViewContext } from '../DataViewProvider'

const ExplorationTask = (props: { onClose?: () => void; taskType: string }) => {
    const { taskType, onClose } = props
    const [isGradeOpen] = useGradeLabelState()
    const { checkPermission } = useUserPermCtx()
    const navigator = useNavigate()

    const [FilterConditions, ExplorationTypeList] = useMemo(() => {
        // 评估任务 无探查内容筛选
        const filter =
            taskType === explorationContentType.Quality
                ? filterConditionList.filter((o) => o?.key !== 'type')
                : filterConditionList
        const list =
            taskType === explorationContentType.Quality
                ? explorationContentList?.filter(
                      (o) => o.value === explorationContentType.Quality,
                  )
                : explorationContentList?.filter(
                      (o) => o.value !== explorationContentType.Quality,
                  )
        return [filter, list]
    }, [filterConditionList, taskType])

    const searchList: any = useMemo(
        () =>
            FilterConditions.map((item) => ({
                ...item,
                options:
                    item.key === 'type'
                        ? [
                              ...item.options,
                              ...ExplorationTypeList.map((it) => ({
                                  value: it.value,
                                  label:
                                      !isGradeOpen &&
                                      it.value ===
                                          explorationContentType.Classification
                                          ? it.subStatusLabel
                                          : it.statusLabel,
                              })).filter((it) => {
                                  if (
                                      it.value ===
                                      explorationContentType.Classification
                                  ) {
                                      return checkPermission(
                                          'manageDataClassification',
                                      )
                                  }
                                  return true
                              }),
                          ]
                        : item.options,
            })),
        [isGradeOpen, FilterConditions, checkPermission],
    )

    const FilterDefaultValue = useMemo(() => {
        return taskType === explorationContentType.Quality
            ? {
                  status: undefined,
              }
            : {
                  type: taskType,
                  status: undefined,
              }
    }, [taskType])

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
        type: taskType,
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
    const [isEmpty, setIsEmpty] = useState<boolean>(false)
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
            title: __('探查对象'),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (text, record) => {
                const { Colored = undefined } = record?.datasource_type
                    ? databaseTypesEleData.dataBaseIcons[
                          record?.datasource_type
                      ]
                    : {}
                const name = record?.form_view_id
                    ? record?.form_view_name
                    : record?.datasource_name
                // 跳转至库表详情 -数据预览
                const dataView = [
                    explorationTaskStatus.Queuing,
                    explorationTaskStatus.Running,
                ]
                // 其他状态跳转至详情
                const type = dataView.includes(record?.status) ? '7' : '0'
                return (
                    <div
                        className={classnames(styles.tableName, {
                            [styles.clickable]: record?.form_view_id,
                        })}
                        onClick={() => {
                            if (!record?.form_view_id) {
                                onClose?.()
                                navigator(
                                    `/datasheet-view?datasourceId=${record?.datasource_id}`,
                                )
                            } else {
                                toDataViewDetails(record?.form_view_id, type)
                            }
                        }}
                    >
                        {record?.form_view_id ? (
                            <DatasheetViewColored className={styles.nameIcon} />
                        ) : (
                            record?.datasource_type && (
                                <Colored className={styles.nameIcon} />
                            )
                        )}
                        {/* <InfoCircleOutlined className={styles.nameIcon}/> */}
                        <span className={styles.ellipsisText} title={name}>
                            {name || dataSourceIsDelNode()}
                        </span>
                    </div>
                )
            },
        },
        {
            title: __('探查内容'),
            dataIndex: 'type',
            key: 'type',
            ellipsis: true,
            width: 190,
            render: (text, record) => {
                const name = ExplorationTypeList.map((item) => ({
                    ...item,
                    statusLabel:
                        item.value === explorationContentType.Classification &&
                        !isGradeOpen
                            ? item.subStatusLabel
                            : item.statusLabel,
                }))
                    .filter((it) => {
                        if (
                            it.value === explorationContentType.Classification
                        ) {
                            return checkPermission('manageDataClassification')
                        }
                        return true
                    })
                    ?.find((item) => item.value === text)?.statusLabel
                return (
                    <div className={styles.typeWrapper}>
                        <div title={name} className={styles.tagsLabel}>
                            {name || '--'}
                        </div>
                    </div>
                )
            },
        },
        {
            title: __('任务状态'),
            dataIndex: 'status',
            key: 'status',
            ellipsis: true,
            width: 120,
            render: (text, record) => {
                const remark = record?.remark
                    ? JSON.parse(record.remark)?.details?.[0]?.view_info?.[0]
                          ?.reason ||
                      JSON.parse(record.remark)?.details?.[0]?.exception_desc ||
                      JSON.parse(record.remark)?.description ||
                      __('未知')
                    : __('未知')
                return (
                    <div className={styles.typeWrapper}>
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
            title: __('创建时间'),
            dataIndex: 'created_at',
            key: 'created_at',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.created_at,
            width: 180,
            showSorterTooltip: false,
            render: (text) =>
                text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '--',
        },
        {
            title: __('操作'),
            dataIndex: 'option',
            key: 'option',
            ellipsis: true,
            width: 275,
            render: (text, record) => {
                const btnList = [
                    {
                        label: __('任务详情'),
                        status: OperateType.Detail,
                        show: true,
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
                    {
                        label: __('异常库表'),
                        status: OperateType.Failed,
                        show:
                            record.status === explorationTaskStatus.Failed &&
                            record?.remark &&
                            !record?.form_view_id,
                    },
                    {
                        label: __('重新探查'),
                        status: OperateType.ReStart,
                        show: record.status === explorationTaskStatus.Failed,
                    },
                    {
                        label: __('删除探查记录'),
                        status: OperateType.Del,
                        show: !(
                            record.status === explorationTaskStatus.Queuing ||
                            record.status === explorationTaskStatus.Running
                        ),
                        popconfirmTips: __(
                            '探查记录删除后不会影响已经产生的探查报告',
                        ),
                    },
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
                    // <Space size={16}>
                    //     {btnList
                    //         .filter((item) => item.show)
                    //         .map((item: any) => {
                    //             return (
                    //                 <a
                    //                     onClick={() => {
                    //                         handleOperate(item.status, record)
                    //                     }}
                    //                 >
                    //                     {item.label}
                    //                 </a>
                    //             )
                    //         })}
                    // </Space>
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
        } else if (op === OperateType.Del) {
            setConfirmTitle(__('确定要删除探查记录吗？'))
            setConfirmText(__('探查记录删除后不会影响已经产生的探查报告'))
            setDelVisible(true)
        } else if (op === OperateType.Detail) {
            setTaskDetailOpen(true)
        } else if (op === OperateType.Failed) {
            const data = JSON.parse(item?.remark)
            setExplorationErrorDetailsData(data)
            setExplorationErrorDetailsOpen(true)
        } else if (op === OperateType.ReStart) {
            if (item?.form_view_id) {
                // 探查库表
                setFormView({
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
            if (taskType === explorationContentType.Quality) {
                setIsValueEvaluation(true)
            }
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

    const renderEmpty = () => {
        return (
            <Empty
                style={{ marginTop: '100px' }}
                desc={__('暂无数据')}
                iconSrc={dataEmpty}
            />
        )
    }

    return (
        <div className={styles.taskWrapper}>
            <div className={styles.taskBox}>
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
                        placeholder={__('搜索探查对象名称')}
                    />
                    <LightweightSearch
                        formData={searchList}
                        onChange={(data, key) => {
                            if (key === 'type') {
                                setSearchCondition((prev) => ({
                                    ...prev,
                                    offset: 1,
                                    type: data.type || taskType,
                                }))
                            } else if (key === 'status') {
                                setSearchCondition((prev) => ({
                                    ...prev,
                                    offset: 1,
                                    status: data.status || undefined,
                                }))
                            } else {
                                setSearchCondition((prev) => ({
                                    ...prev,
                                    offset: 1,
                                    type: taskType,
                                    status: undefined,
                                }))
                            }
                        }}
                        defaultValue={FilterDefaultValue}
                    />
                    {/* <SortBtn
                        contentNode={
                            <DropDownFilter
                                menus={menus}
                                defaultMenu={defaultMenu}
                                menuChangeCb={handleMenuChange}
                                changeMenu={selectedSort}
                            />
                        }
                    /> */}
                    <RefreshBtn onClick={() => search()} />
                </Space>
                <div>
                    {isEmpty ? (
                        renderEmpty()
                    ) : (
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
                            getEmptyFlag={(flag) => {
                                setIsEmpty(flag)
                            }}
                            onChange={(currentPagination, filters, sorter) => {
                                if (
                                    currentPagination.current ===
                                    searchCondition.offset
                                ) {
                                    const selectedMenu =
                                        handleTableChange(sorter)
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
                                        limit:
                                            currentPagination?.pageSize || 10,
                                    })
                                }
                            }}
                        />
                    )}
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
            {/* 详情 */}
            {taskDetailOpen && (
                <ExplorationTaskDetails
                    id={currentData?.task_id || ''}
                    onClose={() => setTaskDetailOpen(false)}
                    open={taskDetailOpen}
                />
            )}
            {/* 探查错误详情 */}
            {explorationErrorDetailsOpen && (
                <ExplorationErrorDetails
                    onClose={() => setExplorationErrorDetailsOpen(false)}
                    open={explorationErrorDetailsOpen}
                    detailsData={explorationErrorDetailsData}
                />
            )}
            {/* 探查数据源 */}
            {datasourceExplorationOpen && (
                <DatasourceExploration
                    open={datasourceExplorationOpen}
                    type={
                        currentData?.form_view_id
                            ? ExplorationType.FormView
                            : ExplorationType.Datasource
                    }
                    formView={formView}
                    onClose={() => {
                        setDatasourceExplorationOpen(false)
                    }}
                    datasourceId={datasourceId}
                />
            )}
        </div>
    )
}

export default ExplorationTask
