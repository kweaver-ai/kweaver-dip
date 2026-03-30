import { Button, Space, Table, TableProps, Tooltip, message } from 'antd'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useAntdTable } from 'ahooks'
import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import { SyncOutlined } from '@ant-design/icons'
import __ from '../locale'
import { defaultMenu, menus, DemandDetailView, BackUrlType } from '../const'
import {
    lightweightSearchData,
    DemandProcessStateEnum,
    DemandOperateType,
} from './const'
import styles from '../styles.module.less'
import { Empty, LightweightSearch, SearchInput, Loader } from '@/ui'
import DropDownFilter from '../../DropDownFilter'
import {
    ISSZDDemandItem,
    SSZDSyncTaskEnum,
    SortDirection,
    createSSZDSyncTask,
    escalateSSZDDemand,
    formatError,
    getSSZDDemand,
    getSSZDSyncTask,
} from '@/core'
import { formatTime } from '@/utils'
import dataEmpty from '@/assets/dataEmpty.svg'
import { AddOutlined, FontIcon } from '@/icons'
import Revocate from '../Revocate'
import { IconType } from '@/icons/const'
import { RefreshBtn, SortBtn } from '../../ToolbarComponents'
import { MicroWidgetPropsContext } from '@/context'
import ProcessState from './ProcessState'
import Confirm from '@/components/Confirm'

const DemandApplyList = () => {
    const navigate = useNavigate()
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)
    const [searchCondition, setSearchCondition] = useState<any>({
        keyword: '',
        limit: 10,
        current: 1,
        sort: defaultMenu.key,
        direction: defaultMenu.sort,
    })
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        finishedAt: null,
        createAt: 'descend',
    })
    const [searchIsExpansion, setSearchIsExpansion] = useState<boolean>(false)
    const [hasSearchCondition, setHasSearchCondition] = useState<boolean>(false)
    const [revocationOpen, setRevocationOpen] = useState(false)
    const [operateItem, setOperateItem] = useState<ISSZDDemandItem>()
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [isSyncing, setIsSyncing] = useState(false)
    const [syncTime, setSyncTime] = useState(0)
    const [reportOpen, setReportOpen] = useState(false)

    const isSearchStatus = useMemo(() => {
        return (
            searchCondition.keyword ||
            searchCondition.status ||
            searchCondition.create_begin_time
        )
    }, [searchCondition])

    const CreateSyncTask = async () => {
        try {
            await createSSZDSyncTask(SSZDSyncTaskEnum.Demand)
            setIsSyncing(true)
        } catch (error) {
            formatError(error)
        }
    }

    const getSyncTask = async () => {
        try {
            const res = await getSSZDSyncTask(SSZDSyncTaskEnum.Demand)
            setIsSyncing(!!res.id)
            setSyncTime(res.last_sync_time)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getSyncTask()
        // 每30秒调用一次
        const interval = setInterval(getSyncTask, 30 * 1000)
        // 组件卸载时清除定时器
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        run({ ...searchCondition })
        const { sort, direction, current, limit, keyword, ...searchObj } =
            searchCondition
        setHasSearchCondition(Object.values(searchObj).some((item) => item))
    }, [searchCondition])

    const handleOperate = (
        demandItem: ISSZDDemandItem,
        operateType: DemandOperateType,
    ) => {
        setOperateItem(demandItem)
        switch (operateType) {
            case DemandOperateType.Revocation:
                setRevocationOpen(true)
                break
            case DemandOperateType.Rereport:
                setReportOpen(true)
                break
            default:
                break
        }
    }

    const goDetails = (id: string, name: string) => {
        navigate(
            `/demand-mgt/province/details?demandId=${id}&demandName=${name}&view=${DemandDetailView.APPLIER}&backUrl=${BackUrlType.Apply}`,
        )
    }

    const columns: TableProps<ISSZDDemandItem>['columns'] = [
        {
            title: __('需求名称'),
            dataIndex: 'title',
            key: 'title',
            width: 260,
            ellipsis: true,
            render: (_, record: ISSZDDemandItem) => (
                <span onClick={() => goDetails(record.id, record.title)}>
                    {record.title}
                </span>
            ),
        },
        {
            title: __('处理进度'),
            dataIndex: 'status',
            key: 'status',
            render: (status, record: ISSZDDemandItem) => (
                <div className={styles['status-container']}>
                    <ProcessState
                        status={DemandProcessStateEnum.ReportForReview}
                    />
                    {status === DemandProcessStateEnum.DemandRejected && (
                        <Tooltip
                            title={`${__('撤销原因：')}${record.cancel_reason}`}
                            placement="bottom"
                            overlayStyle={{ maxWidth: 700 }}
                        >
                            <FontIcon
                                name="icon-shenheyijian"
                                type={IconType.COLOREDICON}
                                className={styles['cancel-icon']}
                            />
                        </Tooltip>
                    )}
                </div>
            ),
        },
        {
            title: __('需求部门'),
            dataIndex: 'org_name',
            key: 'org_name',
            ellipsis: true,
            render: (val) => val || '--',
        },
        {
            title: __('需求联系人'),
            dataIndex: 'contact',
            key: 'contact',
            ellipsis: true,
            render: (val) => val || '--',
        },
        {
            title: __('需求联系人电话'),
            dataIndex: 'phone',
            key: 'phone',
            ellipsis: true,
            render: (val) => val || '--',
        },
        {
            title: __('责任部门'),
            dataIndex: 'duty_org_name',
            key: 'duty_org_name',
            ellipsis: true,
            render: (val) => val || '--',
        },
        {
            title: __('创建时间'),
            dataIndex: 'created_at',
            sorter: true,
            sortOrder: tableSort.createAt,
            showSorterTooltip: false,
            key: 'created_at',
            width: 200,
            render: (val: number) => formatTime(val),
        },
        {
            title: __('操作'),
            key: 'action',
            width: 280,
            fixed: 'right',
            render: (_, record) => (
                <Space size="middle">
                    <a onClick={() => goDetails(record.id, record.title)}>
                        {__('详情')}
                    </a>
                    {/* {DemandProcessStateMap[record.status].operation.includes(
                        DemandProcessStateEnum.ReportedWithdrawn,
                    ) && 11} */}
                    <a
                        onClick={() =>
                            handleOperate(record, DemandOperateType.Revocation)
                        }
                    >
                        {__('撤销')}
                    </a>
                    <a
                        onClick={() =>
                            handleOperate(record, DemandOperateType.Rereport)
                        }
                    >
                        {__('重新上报')}
                    </a>
                </Space>
            ),
        },
    ]

    const onChangeMenuToTableSort = (selectedMenu) => {
        switch (selectedMenu.key) {
            case 'created_at':
                setTableSort({
                    createAt:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                })
                break
            default:
                setTableSort({
                    createAt: null,
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
        // setSelectedSort(selectedMenu)
        onChangeMenuToTableSort(selectedMenu)
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            if (sorter.columnKey === 'created_at') {
                setTableSort({
                    createAt: sorter.order || 'ascend',
                    finishedAt: null,
                })
            } else {
                setTableSort({
                    createAt: null,
                    finishedAt: sorter.order || 'ascend',
                })
            }
            return {
                key:
                    sorter.columnKey === 'finish_date'
                        ? 'finish_date'
                        : sorter.columnKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }
        if (searchCondition.sort === 'created_at') {
            if (searchCondition.direction === SortDirection.ASC) {
                setTableSort({
                    createAt: 'descend',
                    finishedAt: null,
                })
            } else {
                setTableSort({
                    createAt: 'ascend',
                    finishedAt: null,
                })
            }
        } else if (searchCondition.sort === SortDirection.ASC) {
            setTableSort({
                createAt: null,
                finishedAt: 'descend',
            })
        } else {
            setTableSort({
                createAt: null,
                finishedAt: 'ascend',
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

    const renderEmpty = () => {
        return <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
    }

    const getDemandList = async (params: any) => {
        const {
            current: offset,
            limit,
            keyword,
            sort,
            direction,
            create_begin_time,
            create_end_time,
            status,
        } = params

        try {
            const res = await getSSZDDemand({
                offset,
                limit,
                sort,
                direction,
                keyword,
                create_begin_time,
                create_end_time,
                status,
                target: 'apply',
            })

            return {
                total: res.total_count,
                list: res.entries,
            }
        } catch (error) {
            formatError(error)
            return {
                total: 0,
                list: [],
            }
        } finally {
            setSelectedSort(undefined)
        }
    }

    const { tableProps, run, pagination, loading } = useAntdTable(
        getDemandList,
        {
            defaultPageSize: 10,
            manual: true,
        },
    )

    const handleCreate = () => {
        navigate(`/demand-mgt/province/create`)
    }

    const handleReport = async () => {
        try {
            await escalateSSZDDemand(operateItem?.id!)
            message.success(__('上报成功'))
            setReportOpen(false)
            setOperateItem(undefined)
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <div
            className={classnames(
                styles['demand-wrapper'],
                styles['province-demand-wrapper'],
            )}
        >
            <div className={styles.title}>{__('需求申请')}</div>
            <div className={styles['operate-container']}>
                <Space size={16}>
                    <Button
                        icon={<AddOutlined />}
                        type="primary"
                        onClick={() => handleCreate()}
                    >
                        {__('新建')}
                    </Button>
                    <Tooltip title={isSyncing ? __('同步中') : ''}>
                        <Button
                            icon={<SyncOutlined spin={isSyncing} />}
                            className={styles['sync-btn']}
                            disabled={isSyncing}
                            onClick={() => CreateSyncTask()}
                        >
                            {__('数据同步')}
                        </Button>
                    </Tooltip>
                    <span className={styles['sync-time']}>
                        {__('数据同步时间：')}
                        {syncTime
                            ? moment(syncTime).format('YYYY-MM-DD HH:mm:ss')
                            : '--'}
                    </span>
                </Space>
                <Space size={16}>
                    <Space size={8}>
                        <SearchInput
                            className={styles.nameInput}
                            style={{ width: 272 }}
                            placeholder={__('搜索需求名称')}
                            onKeyChange={(kw: string) =>
                                setSearchCondition({
                                    ...searchCondition,
                                    keyword: kw,
                                    offset: 1,
                                    current: 1,
                                })
                            }
                        />
                        <LightweightSearch
                            formData={lightweightSearchData}
                            onChange={(data, key) => {
                                if (key === 'status') {
                                    setSearchCondition({
                                        ...searchCondition,
                                        current: 1,
                                        status: data.status || undefined,
                                    })
                                } else if (key === 'created_at') {
                                    setSearchCondition({
                                        ...searchCondition,
                                        current: 1,
                                        create_begin_time:
                                            data.created_at?.[0] &&
                                            moment(
                                                data.created_at[0].format(
                                                    'YYYY-MM-DD 00:00:00',
                                                ),
                                            ).valueOf(),
                                        create_end_time:
                                            data.created_at?.[1] &&
                                            moment(
                                                data.created_at[1].format(
                                                    'YYYY-MM-DD 23:59:59',
                                                ),
                                            ).valueOf(),
                                    })
                                } else {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        status: undefined,
                                        create_begin_time: undefined,
                                        create_end_time: undefined,
                                    })
                                }
                            }}
                            defaultValue={{
                                status: '',
                                created_at: null,
                            }}
                        />
                    </Space>
                    <span>
                        <SortBtn
                            contentNode={
                                <DropDownFilter
                                    menus={menus.filter(
                                        (menu) => menu.key === 'created_at',
                                    )}
                                    defaultMenu={defaultMenu}
                                    menuChangeCb={handleMenuChange}
                                    changeMenu={selectedSort}
                                />
                            }
                        />
                        <RefreshBtn
                            onClick={() =>
                                setSearchCondition({ ...searchCondition })
                            }
                        />
                    </span>
                </Space>
            </div>
            {loading ? (
                <div className={styles.loader}>
                    <Loader />
                </div>
            ) : !loading &&
              tableProps.dataSource.length === 0 &&
              !isSearchStatus ? (
                <div className={styles.emptyWrapper}>{renderEmpty()}</div>
            ) : (
                <Table
                    columns={columns}
                    {...tableProps}
                    rowKey="id"
                    rowClassName={styles.tableRow}
                    onChange={(currentPagination, filters, sorter) => {
                        if (
                            currentPagination.current ===
                            searchCondition.current
                        ) {
                            const selectedMenu = handleTableChange(sorter)
                            setSelectedSort(selectedMenu)
                            setSearchCondition({
                                ...searchCondition,
                                sort: selectedMenu.key,
                                direction: selectedMenu.sort,
                                current: 1,
                            })
                        } else {
                            setSearchCondition({
                                ...searchCondition,
                                current: currentPagination?.current || 1,
                            })
                        }
                    }}
                    scroll={{
                        x: 1200,
                        y:
                            tableProps.dataSource.length === 0
                                ? undefined
                                : `calc(100vh - ${
                                      !searchIsExpansion
                                          ? hasSearchCondition
                                              ? 320
                                              : 278
                                          : hasSearchCondition
                                          ? 430
                                          : 388
                                  }px)`,
                    }}
                    pagination={{
                        ...tableProps.pagination,
                        showSizeChanger: false,
                        hideOnSinglePage: true,
                    }}
                    locale={{ emptyText: <Empty /> }}
                />
            )}
            {/* 撤销 */}
            {operateItem && (
                <Revocate
                    open={revocationOpen}
                    demandId={operateItem.id}
                    onClose={() => {
                        setRevocationOpen(false)
                        setOperateItem(undefined)
                    }}
                    onOk={() => setSearchCondition({ ...searchCondition })}
                    isProvince
                />
            )}

            <Confirm
                open={reportOpen}
                title={__('确定要重新上报${name}需求吗？', {
                    name: operateItem?.title,
                })}
                content={__('需求将上报至省平台，请确认。')}
                onOk={() => handleReport()}
                onCancel={() => {
                    setReportOpen(false)
                    setOperateItem(undefined)
                }}
                width={432}
            />
        </div>
    )
}

export default DemandApplyList
