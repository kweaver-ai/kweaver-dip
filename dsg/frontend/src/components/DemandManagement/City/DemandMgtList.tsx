import {
    Button,
    Modal,
    Popconfirm,
    Space,
    Table,
    TableProps,
    Tabs,
    TabsProps,
} from 'antd'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAntdTable, useUpdateEffect } from 'ahooks'
import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ExclamationCircleFilled, InfoCircleFilled } from '@ant-design/icons'
import moment from 'moment'
import __ from '../locale'
import {
    DemandProgress,
    DemandStatusEnum,
    defaultMenu,
    DemandProgressItems,
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
    demandMgtStatusList,
} from '../const'
import styles from '../styles.module.less'
import { Empty, LightweightSearch, Loader, SearchInput } from '@/ui'
import DropDownFilter from '../../DropDownFilter'
import {
    SortDirection,
    analysisSignOffV2,
    formatError,
    getDemandMgtListV2,
    getDemands,
    implementSignOffV2,
} from '@/core'
import { formatTime } from '@/utils'
import dataEmpty from '@/assets/dataEmpty.svg'
import DemandStatus from '../DemandStatus'
import { IFormItem } from '../../SearchLayout/const'
import SearchLayout from '../../SearchLayout'
import { RefreshBtn, SortBtn } from '../../ToolbarComponents'
import { IformItem, SearchType as ST } from '@/ui/LightweightSearch/const'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

const DemandMgtList = () => {
    const navigate = useNavigate()
    const [config] = useGeneralConfig()
    const searchRef: any = useRef()
    const isDemandHall = window.location.pathname.includes('demand-hall')
    const [searchParams, setSearchParams] = useSearchParams()
    const tab = searchParams.get('tab') || ''
    const [defaultKeyword, setDefaultKeyword] = useState(
        searchParams.get('keyword') || '',
    )
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)
    const deafultTab = isDemandHall
        ? DemandProgress.ToBeSigned
        : (tab as DemandProgress) || DemandProgress.ToDo
    const [searchCondition, setSearchCondition] = useState<any>({
        keyword: defaultKeyword,
        limit: 10,
        current: 1,
        sort: defaultMenu.key,
        direction: defaultMenu.sort,
        target: deafultTab,
        status: '',
    })
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        finishAt: null,
        createAt: 'descend',
    })
    const [searchIsExpansion, setSearchIsExpansion] = useState<boolean>(false)
    const [hasSearchCondition, setHasSearchCondition] = useState<boolean>(false)

    const isSearchStatus = useMemo(() => {
        return (
            searchCondition.keyword ||
            searchCondition.status ||
            searchCondition.create_begin_time ||
            searchCondition.finish_begin_time
        )
    }, [searchCondition])

    useEffect(() => {
        run({ ...searchCondition })
        const { sort, direction, current, limit, keyword, ...searchObj } =
            searchCondition
        setHasSearchCondition(Object.values(searchObj).some((item) => item))
    }, [searchCondition])

    const goDetails = (id: string, name: string) => {
        const backUrl = searchCondition.target
        navigate(
            `/demand-mgt/details?demandId=${id}&demandName=${name}&view=${DemandDetailView.OPERAOTR}&backUrl=${backUrl}`,
        )
    }

    const columns: any = useMemo(() => {
        const cols = [
            {
                title: __('需求名称（编码）'),
                dataIndex: 'title',
                key: 'title',
                width: 260,
                render: (_, record) => {
                    return (
                        <>
                            <div
                                className={styles.name}
                                onClick={() =>
                                    goDetails(record.id, record.title)
                                }
                                title={record.title}
                            >
                                <span>{record.title}</span>
                            </div>
                            <div className={styles.code} title={record.code}>
                                {record.code}
                            </div>
                        </>
                    )
                },
            },
            {
                title: __('当前状态'),
                dataIndex: 'status',
                key: 'status',
                render: (status) => <DemandStatus status={status} />,
            },
            {
                title: __('申请人'),
                dataIndex: 'applier',
                key: 'applier',
                render: (applier) => applier || '--',
            },
            {
                title: __('申请人联系方式'),
                dataIndex: 'applier_phone',
                key: 'applier_phone',
                render: (phone) => phone || '--',
            },
            {
                title: __('当前处理人'),
                dataIndex: 'processor',
                key: 'processor',
                render: (processor) => processor || '--',
            },
            {
                title: __('处理人联系方式'),
                dataIndex: 'processor_phone',
                key: 'processor_phone',
                render: (phone) => phone || '--',
            },
            {
                title: __('期望完成时间'),
                dataIndex: 'finish_date',
                sorter: true,
                sortOrder: tableSort.finishAt,
                showSorterTooltip: false,
                key: 'finish_date',
                render: (val: number) =>
                    val ? formatTime(val, 'YYYY-MM-DD') : '--',
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
                        {DemandProgressColunmsConfig[
                            searchCondition.target
                        ].opertions.includes(DemandOperate.Analysis) &&
                            DemandStatusEnum.Analysising === record.status && (
                                <a
                                    onClick={() =>
                                        navigate(
                                            `/demand-mgt/analysis?demandId=${record.id}&applierId=${record.applier_id}&demandName=${record.title}`,
                                        )
                                    }
                                >
                                    {__('提交分析结论')}
                                </a>
                            )}
                        {DemandProgressColunmsConfig[
                            searchCondition.target
                        ].opertions.includes(DemandOperate.Implement) &&
                            DemandStatusEnum.Implementing === record.status && (
                                <a
                                    onClick={() =>
                                        navigate(
                                            `/demand-mgt/implement?demandId=${record.id}&demandName=${record.title}`,
                                        )
                                    }
                                >
                                    {__('提交实施结果')}
                                </a>
                            )}
                    </Space>
                ),
            },
        ]
        return cols.filter((col) =>
            DemandProgressColunmsConfig[
                searchCondition.target
            ].columnKeys.includes(col.key),
        )
    }, [searchCondition.target, tableSort])

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

        // setSelectedSort(selectedMenu)
        onChangeMenuToTableSort(selectedMenu)
    }

    const getSearchCondition = (conditions) => {
        setSearchCondition({ ...searchCondition, ...conditions })
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
            finish_begin_time,
            finish_end_time,
            status,
            target,
        } = params

        try {
            const res = await getDemandMgtListV2({
                offset,
                limit,
                sort,
                direction,
                keyword,
                create_begin_time,
                create_end_time,
                finish_begin_time,
                finish_end_time,
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

    const searchData: IformItem[] = useMemo(
        () => [
            {
                label: __('当前状态'),
                key: 'status',
                options:
                    searchCondition.target === DemandProgress.ToDo
                        ? statusListOfToDo
                        : statusListOfHandle,
                type: ST.Radio,
            },
            {
                label: __('创建时间'),
                key: 'created_at',
                type: ST.RangePicker,
                options: [],
            },
        ],
        [searchCondition.target],
    )

    return (
        <div className={classnames(styles['demand-wrapper'])}>
            {/* 未开始省直达开关 */}
            {!config.governmentSwitch.on && (
                <Tabs
                    activeKey={searchCondition.target}
                    items={DemandProgressItems}
                    onChange={(key) => {
                        setDefaultKeyword('')!
                        setSearchCondition({
                            ...searchCondition,
                            target: key,
                        })
                    }}
                />
            )}
            <div className={styles['operate-container']}>
                {config.governmentSwitch.on ? (
                    <Space size={12}>
                        {demandMgtStatusList.map((status) => (
                            <div
                                key={status.value}
                                className={classnames({
                                    [styles.statusItem]: true,
                                    [styles.selectedStatusItem]:
                                        searchCondition.target === status.value,
                                })}
                                onClick={() => {
                                    setSearchCondition({
                                        ...searchCondition,
                                        target: status.value,
                                    })
                                }}
                            >
                                {status.label}
                            </div>
                        ))}
                    </Space>
                ) : (
                    <div />
                )}

                <Space size={16}>
                    <Space size={8}>
                        <SearchInput
                            className={styles.nameInput}
                            value={searchCondition.keyword}
                            style={{ width: 272 }}
                            placeholder={__('搜索需求名称/需求编码')}
                            onKeyChange={(kw: string) => {
                                if (kw === searchCondition.keyword) return
                                setSearchCondition({
                                    ...searchCondition,
                                    keyword: kw,
                                    current: 1,
                                })
                            }}
                        />
                        <LightweightSearch
                            formData={searchData}
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
        </div>
    )
}

export default DemandMgtList
