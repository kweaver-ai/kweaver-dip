import {
    Button,
    Space,
    Table,
    TableProps,
    Tabs,
    TabsProps,
    Tooltip,
} from 'antd'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useAntdTable } from 'ahooks'
import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import __ from '../locale'
import {
    DemandProgress,
    DemandStatusEnum,
    defaultMenu,
    DemandProgressItems,
    menus,
    lightweightSearchData,
    DemandOperateType,
    DemandType,
    DemandStatusMap,
    DemandDetailView,
    BackUrlType,
} from '../const'
import styles from '../styles.module.less'
import { Empty, LightweightSearch, SearchInput, Loader } from '@/ui'
import DropDownFilter from '../../DropDownFilter'
import {
    IDemandListItem,
    SortDirection,
    formatError,
    getApplyDemandsV2,
    isMicroWidget,
} from '@/core'
import { formatTime } from '@/utils'
import dataEmpty from '@/assets/dataEmpty.svg'
import DemandStatus from '../DemandStatus'
import { AddOutlined, FontIcon } from '@/icons'
import Revocate from '../Revocate'
import { IconType } from '@/icons/const'
import { RefreshBtn, SortBtn } from '../../ToolbarComponents'
import { MicroWidgetPropsContext } from '@/context'

interface IDemandApplyList {
    showTitle?: boolean
}
const DemandApplyList = ({ showTitle = true }: IDemandApplyList) => {
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
    const [operateId, setOperateId] = useState<string>('')
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)

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

    const handleOperate = (demandItem, operateType: DemandOperateType) => {
        setOperateId(demandItem.id)
        switch (operateType) {
            case DemandOperateType.Revocation:
                setRevocationOpen(true)
                break
            default:
                break
        }
    }

    const goDetails = (id: string, name: string) => {
        navigate(
            `/demand-mgt/details?demandId=${id}&demandName=${name}&view=${DemandDetailView.APPLIER}&backUrl=${BackUrlType.Apply}`,
        )
    }

    const columns: TableProps<any>['columns'] = [
        {
            title: __('需求名称（编码）'),
            dataIndex: 'title',
            key: 'title',
            width: 260,
            render: (_, record: IDemandListItem) => {
                return (
                    <>
                        <div
                            className={styles.name}
                            onClick={() => goDetails(record.id, record.title)}
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
            render: (status, record) => (
                <div className={styles['status-container']}>
                    <DemandStatus status={status} />
                    {status === DemandStatusEnum.Revoked && (
                        <Tooltip
                            title={`${__('撤销原因：')}${
                                record.canceled_reason
                            }`}
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
        // {
        //     title: __('需求类型'),
        //     dataIndex: 'dmd_type',
        //     key: 'dmd_type',
        //     render: (type) =>
        //         type === DemandType.DataApply ? __('数据应用需求') : '',
        // },
        {
            title: __('当前处理人'),
            dataIndex: 'processor',
            key: 'processor',
            ellipsis: true,
            render: (val) => val || '--',
        },
        {
            title: __('处理人联系方式'),
            dataIndex: 'processor_phone',
            key: 'processor_phone',
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
                    {DemandStatusMap[record.status].operation.includes(
                        DemandOperateType.AnalysisConfirm,
                    ) && (
                        <a
                            onClick={() =>
                                navigate(
                                    `/demand-mgt/analysisConfirm?demandId=${record.id}&demandName=${record.title}`,
                                )
                            }
                        >
                            {__('分析确认')}
                        </a>
                    )}
                    {DemandStatusMap[record.status].operation.includes(
                        DemandOperateType.ImplementationAcceptance,
                    ) && (
                        <a
                            onClick={() =>
                                navigate(
                                    `/demand-mgt/implementAcceptance?demandId=${record.id}&demandName=${record.title}`,
                                )
                            }
                        >
                            {__('实施验收')}
                        </a>
                    )}

                    {DemandStatusMap[record.status].operation.includes(
                        DemandOperateType.Revocation,
                    ) && (
                        <a
                            onClick={() =>
                                handleOperate(
                                    record,
                                    DemandOperateType.Revocation,
                                )
                            }
                        >
                            {__('撤销')}
                        </a>
                    )}
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
            const res = await getApplyDemandsV2({
                offset,
                limit,
                sort,
                direction,
                keyword,
                create_begin_time,
                create_end_time,
                status,
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
        navigate(`/demand-mgt/create`)
    }

    return (
        <div
            className={classnames(
                styles['demand-wrapper'],
                isMicroWidget({ microWidgetProps }) &&
                    styles['as-demand-wrapper'],
            )}
        >
            {isMicroWidget({ microWidgetProps }) ? null : showTitle ? (
                <div className={styles.title}>{__('需求申请')}</div>
            ) : null}
            <div className={styles['operate-container']}>
                <Button
                    icon={<AddOutlined />}
                    type="primary"
                    onClick={() => handleCreate()}
                >
                    {__('新建')}
                </Button>
                <Space size={16}>
                    <Space size={8}>
                        <SearchInput
                            className={styles.nameInput}
                            style={{ width: 272 }}
                            placeholder={__('搜索需求名称/需求编码')}
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
            <Revocate
                open={revocationOpen}
                demandId={operateId}
                onClose={() => setRevocationOpen(false)}
                onOk={() => setSearchCondition({ ...searchCondition })}
            />
        </div>
    )
}

export default DemandApplyList
