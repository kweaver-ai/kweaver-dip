import { Popconfirm, Space, Table } from 'antd'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAntdTable, useUpdateEffect } from 'ahooks'
import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { InfoCircleFilled } from '@ant-design/icons'
import __ from '../locale'
import {
    DemandProgress,
    DemandStatusEnum,
    defaultMenu,
    menus,
    lightweightSearchData,
    getSearchFormData,
    statusListOfToBeSigned,
    statusListOfToDo,
    DemandProgressColunmsConfig,
    DemandOperate,
    DemandType,
    statusListOfHandle,
    DemandDetailView,
    BackUrlType,
} from '../const'
import styles from '../styles.module.less'
import { Empty, LightweightSearch, Loader, SearchInput } from '@/ui'
import DropDownFilter from '../../DropDownFilter'
import {
    ISSZDDemandItem,
    SortDirection,
    analysisSignoffSSZDDemand,
    formatError,
    getSSZDDemand,
    implementSignoffSSZDDemand,
} from '@/core'
import { formatTime } from '@/utils'
import dataEmpty from '@/assets/dataEmpty.svg'
import DemandStatus from '../DemandStatus'
import { IFormItem } from '../../SearchLayout/const'
import { RefreshBtn, SortBtn } from '../../ToolbarComponents'

interface IDemandHallList {
    showTitle?: boolean
}
const DemandHallList = ({ showTitle = true }: IDemandHallList) => {
    const navigate = useNavigate()
    const searchRef: any = useRef()
    const [searchParams, setSearchParams] = useSearchParams()
    const tab = searchParams.get('tab') || ''
    const [defaultKeyword, setDefaultKeyword] = useState(
        searchParams.get('keyword') || '',
    )
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)

    const [searchCondition, setSearchCondition] = useState<any>({
        keyword: defaultKeyword,
        limit: 10,
        current: 1,
        sort: defaultMenu.key,
        direction: defaultMenu.sort,
        target: DemandProgress.ToBeSigned,
        status: '',
    })
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        finishAt: null,
        createAt: 'descend',
    })
    const [hasSearchCondition, setHasSearchCondition] = useState<boolean>(false)

    const isSearchStatus = useMemo(() => {
        return (
            searchCondition.keyword ||
            searchCondition.status ||
            searchCondition.create_begin_time
        )
    }, [searchCondition])

    useEffect(() => {
        run({ ...searchCondition })
        const { sort, direction, current, limit, keyword, ...searchObj } =
            searchCondition
        setHasSearchCondition(Object.values(searchObj).some((item) => item))
    }, [searchCondition])

    const goDetails = (id: string, name: string) => {
        const backUrl = BackUrlType.Sign
        navigate(
            `/demand-mgt/details?demandId=${id}&demandName=${name}&view=${DemandDetailView.OPERAOTR}&backUrl=${backUrl}`,
        )
    }

    // 分析签收
    const analysisSign = async (record: ISSZDDemandItem) => {
        navigate(
            `/demand-mgt/province/analysis?demandId=${record.id}&demandName=${record.title}`,
        )
        // try {
        //     await analysisSignoffSSZDDemand(id)
        //     navigate('/demand-mgt?isProvince=1')
        // } catch (error) {
        //     formatError(error)
        // }
    }

    // 实施签收
    const implementSign = async (id: string) => {
        try {
            await implementSignoffSSZDDemand(id)
            navigate('/demand-mgt?isProvince=1')
        } catch (error) {
            formatError(error)
        }
    }

    const columns: any = useMemo(() => {
        return [
            {
                title: __('需求名称'),
                dataIndex: 'title',
                key: 'title',
                width: 260,
                render: (_, record) => {
                    return (
                        <span
                            className={styles.name}
                            onClick={() => goDetails(record.id, record.title)}
                            title={record.title}
                        >
                            {record.title}
                        </span>
                    )
                },
            },
            {
                title: __('当前状态'),
                dataIndex: 'status',
                key: 'status',
                // render: (status) => <DemandStatus status={status} />,
            },
            {
                title: __('需求部门'),
                dataIndex: 'org_name',
                key: 'org_name',
            },
            {
                title: __('需求联系人'),
                dataIndex: 'contact',
                key: 'contact',
                render: (contact) => contact || '--',
            },
            {
                title: __('需求联系人电话'),
                dataIndex: 'phone',
                key: 'phone',
                render: (phone) => phone || '--',
            },
            {
                title: __('责任部门'),
                dataIndex: 'duty_org_name',
                key: 'duty_org_name',
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
                width: 240,
                fixed: 'right',
                render: (_, record) => (
                    <Space size="middle">
                        <a onClick={() => goDetails(record.id, record.title)}>
                            {__('详情')}
                        </a>
                        {/* DemandStatusEnum.AnalysisSigning === record.status */}
                        <a onClick={() => analysisSign(record)}>
                            {__('分析签收')}
                        </a>
                        {/* DemandStatusEnum.ImplementationSigning === record.status */}
                        <Popconfirm
                            placement="topLeft"
                            title={
                                <div>
                                    {__('确认实施签收吗？')}
                                    <div className={styles['sign-instruction']}>
                                        {__(
                                            '签收后，进入需求处理页面进行实施操作',
                                        )}
                                    </div>
                                </div>
                            }
                            onConfirm={() => implementSign(record.id)}
                            okText={__('确定')}
                            cancelText={__('取消')}
                            icon={
                                <InfoCircleFilled
                                    style={{ color: '#126EE3' }}
                                />
                            }
                            trigger={['click']}
                        >
                            <a>{__('实施签收')}</a>
                        </Popconfirm>
                    </Space>
                ),
            },
        ]
    }, [tableSort])

    const onChangeMenuToTableSort = (selectedMenu) => {
        switch (selectedMenu.key) {
            case 'created_at':
                setTableSort({
                    createAt:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    finishAt: null,
                })
                break
            case 'finish_date':
                setTableSort({
                    finishAt:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    createAt: null,
                })
                break
            default:
                setTableSort({
                    name: null,
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
        onChangeMenuToTableSort(selectedMenu)
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            if (sorter.columnKey === 'created_at') {
                setTableSort({
                    createAt: sorter.order || 'ascend',
                    finishAt: null,
                })
            } else {
                setTableSort({
                    createAt: null,
                    finishAt: sorter.order || 'ascend',
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
                    finishAt: null,
                })
            } else {
                setTableSort({
                    createAt: 'ascend',
                    finishAt: null,
                })
            }
        } else if (searchCondition.sort === SortDirection.ASC) {
            setTableSort({
                createAt: null,
                finishAt: 'descend',
            })
        } else {
            setTableSort({
                createAt: null,
                finishAt: 'ascend',
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
            target,
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
                target,
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

    return (
        <div className={classnames(styles['demand-wrapper'])}>
            <div className={styles.title}>{__('需求大厅')}</div>
            <div className={styles['operate-container']}>
                <Space size={12}>
                    {statusListOfToBeSigned.map((status) => (
                        <div
                            key={status.value}
                            className={classnames({
                                [styles.statusItem]: true,
                                [styles.selectedStatusItem]:
                                    searchCondition.status === status.value,
                            })}
                            onClick={() => {
                                setSearchCondition({
                                    ...searchCondition,
                                    status: status.value,
                                })
                            }}
                        >
                            {status.label}
                        </div>
                    ))}
                </Space>

                <Space size={16}>
                    <SearchInput
                        className={styles.nameInput}
                        value={searchCondition.keyword}
                        style={{ width: 272 }}
                        placeholder={__('搜索需求名称')}
                        onKeyChange={(kw: string) => {
                            if (kw === searchCondition.keyword) return
                            setSearchCondition({
                                ...searchCondition,
                                keyword: kw,
                                current: 1,
                            })
                        }}
                    />
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
                                      hasSearchCondition ? 320 : 278
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
        </div>
    )
}

export default DemandHallList
