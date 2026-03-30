import { Button, message, Modal, Space, Table, Tooltip } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useAntdTable } from 'ahooks'
import classnames from 'classnames'
import { SortOrder } from 'antd/lib/table/interface'
import RequirementSearch from './Search'
import styles from './styles.module.less'
import DropDownFilter from '../DropDownFilter'
import { statusList, defaultMenu, menus, StatusEnum } from './const'
import Empty from '@/ui/Empty'
import empty from '@/assets/dataEmpty.svg'
import {
    formatError,
    getDemandAnalyseInfoCount,
    getDemands,
    IDemandCount,
    getObjects,
    IObject,
    SortDirection,
} from '@/core'
import { Architecture } from '../BusinessArchitecture/const'
import { formatTime, getActualUrl, OperateType } from '@/utils'
import Status from '../Requirement/Status'
import Loader from '@/ui/Loader'
import { SortBtn } from '../ToolbarComponents'
import SearchLayout from '@/components/SearchLayout'
import { SearchType, IFormItem } from '@/components/SearchLayout/const'
import { OperateAuthority } from '../Requirement/const'
import __ from './locale'

const RequirementAnalysis = () => {
    const navigator = useNavigate()
    const searchRef: any = useRef()
    const [depts, setDepts] = useState<IObject[]>()
    const [searchIsExpansion, setSearchIsExpansion] = useState<boolean>(false)
    const [hasSearchCondition, setHasSearchCondition] = useState<boolean>(false)

    const [searchCondition, setSearchCondition] = useState<any>({
        keyword: '',
        limit: 10,
        current: 1,
        tag_filter: StatusEnum.ALL,
        sort: defaultMenu.key,
        direction: defaultMenu.sort,
    })
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        createAt: 'descend',
    })

    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)

    const [demandStatusCount, setDemandStatusCount] = useState<IDemandCount[]>(
        [],
    )
    const isSearchStatus = useMemo(() => {
        return (
            searchCondition.keyword ||
            searchCondition.org_code ||
            searchCondition.status ||
            searchCondition.apply_date_greater_than
        )
    }, [searchCondition])

    const getDemandsCount = async () => {
        try {
            const res = await getDemandAnalyseInfoCount(2)
            setDemandStatusCount(res.entries)
        } catch (err) {
            formatError(err)
        }
    }
    useEffect(() => {
        getDemandsCount()
        getDepts()
    }, [])

    const getSearchCondition = (conditions) => {
        setSearchCondition({ ...searchCondition, ...conditions })
    }

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition({
            ...searchCondition,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            current: 1,
        })
        setSelectedSort(selectedMenu)
        onChangeMenuToTableSort(selectedMenu)
    }

    const onChangeMenuToTableSort = (selectedMenu) => {
        switch (selectedMenu.key) {
            case 'created_at':
                setTableSort({
                    createAt:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    name: null,
                })
                break
            case 'name':
                setTableSort({
                    name:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    createAt: null,
                })
                break
            case 'updated_at':
                setTableSort({
                    name: null,
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

    useEffect(() => {
        run({ ...searchCondition })
        const {
            sort,
            direction,
            current,
            limit,
            tag_filter,
            keyword,
            ...searchObj
        } = searchCondition
        setHasSearchCondition(Object.values(searchObj).some((item) => item))
    }, [searchCondition])

    const getRequirements = async (params: any) => {
        const {
            current: offset,
            limit,
            keyword,
            sort,
            direction,
            tag_filter: p,
            org_code,
            apply_date_greater_than,
            apply_date_less_than,
            status,
        } = params

        try {
            const res = await getDemands({
                offset,
                limit,
                sort,
                direction,
                keyword,
                tag_filter: p,
                org_code,
                apply_date_greater_than,
                apply_date_less_than,
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
        getRequirements,
        {
            defaultPageSize: 10,
            manual: true,
        },
    )

    const handleAnalysis = (id?: string) => {
        const url = `/dataService/requirementAnalysis?id=${id || ''}`
        navigator(url)
    }

    const goDetails = (id: string) => {
        const url = `/dataService/requirementAnalysis?id=${id || ''}&mode=${
            OperateType.DETAIL
        }`
        navigator(url)
    }

    const columns: any = [
        {
            title: (
                <div>
                    <span>{__('需求名称')}</span>
                    <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                        {__('（编号）')}
                    </span>
                </div>
            ),
            dataIndex: 'demand_title',
            key: 'demand_title',
            // ellipsis: true,
            sorter: true,
            sortOrder: tableSort.name,
            showSorterTooltip: {
                title: __('按需求名称排序'),
                placement: 'bottom',
            },
            width: 160,
            render: (_, record) => {
                return (
                    <>
                        <div
                            className={styles.topInfo}
                            onClick={() => goDetails(record.id)}
                            title={record.demand_title}
                        >
                            <span>{record.demand_title}</span>
                        </div>
                        <div
                            className={styles.bottomInfo}
                            title={record.demand_code}
                        >
                            {record.demand_code}
                        </div>
                    </>
                )
            },
        },
        {
            title: '当前状态',
            dataIndex: 'status',
            key: 'status',
            width: 160,
            render: (val) => <Status status={val} />,
        },
        {
            title: '申请部门',
            dataIndex: 'org_name',
            key: 'org_name',
            ellipsis: true,
            width: 120,
            render: (val) => val || '--',
        },
        {
            title: '申请人',
            dataIndex: 'apply_user_name',
            key: 'apply_user_name',
            ellipsis: true,
            width: 120,
        },
        {
            title: '申请人联系方式',
            dataIndex: 'apply_user_phone',
            key: 'apply_user_phone',
            ellipsis: true,
            width: 140,
            render: (val) => val || '--',
        },
        {
            title: '资源数量',
            dataIndex: 'resource_count',
            key: 'resource_count',
            width: 120,
        },
        {
            title: '创建时间',
            dataIndex: 'created_at',
            sorter: true,
            sortOrder: tableSort.createAt,
            showSorterTooltip: false,
            key: 'created_at',
            width: 180,
            render: (val: number) => formatTime(val),
        },
        {
            title: '操作',
            key: 'action',
            width: 180,
            fixed: 'right',
            render: (_: string, record) => {
                // 转二进制数组
                const authority = record.operations
                    .toString(2)
                    .split('')
                    .reverse()

                return (
                    <Space size={16}>
                        {(authority[3] === OperateAuthority.Yes ||
                            authority[4] === OperateAuthority.Yes) && (
                            <a onClick={() => handleAnalysis(record.id)}>
                                {authority[3] === OperateAuthority.Yes
                                    ? '开始分析'
                                    : '继续分析'}
                            </a>
                        )}
                        {authority[2] === OperateAuthority.Yes && (
                            <a onClick={() => goDetails(record.id)}>
                                {__('分析详情')}
                            </a>
                        )}
                    </Space>
                )
            },
        },
    ]

    // 查询form参数
    const searchFormData: IFormItem[] = [
        {
            label: '需求名称、编号',
            key: 'keyword',
            type: SearchType.Input,
            isAlone: true,
            // defaultValue: '',
        },
        {
            label: '申请部门',
            key: 'org_code',
            type: SearchType.Select,
            // defaultValue: '',
            itemProps: {
                fieldNames: { label: 'name', value: 'id' },
                options: depts,
            },
        },
        {
            label: '创建时间',
            key: 'times',
            type: SearchType.RangePicker,
            defaultValue: '',
            startTime: 'apply_date_greater_than',
            endTime: 'apply_date_less_than',
            isTimestamp: true,
            itemProps: {
                format: 'YYYY-MM-DD',
            },
        },
    ]

    // 获取申请部门
    const getDepts = async () => {
        try {
            const res = await getObjects({
                limit: 0,
                id: '',
                is_all: true,
                type: Architecture.DEPARTMENT,
            })
            // setDepts([{ name: '全部', id: '', path: '', type: '' }, ...res.entries])
            setDepts(res.entries)
        } catch (err) {
            formatError(err)
        }
    }

    const getCount = (status: StatusEnum) => {
        return (
            demandStatusCount.find((item) => item.tag_filter === status)
                ?.count || 0
        )
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            if (sorter.columnKey === 'created_at') {
                setTableSort({
                    createAt: sorter.order || 'ascend',
                    name: null,
                })
            } else {
                setTableSort({
                    createAt: null,
                    name: sorter.order || 'ascend',
                })
            }
            return {
                key:
                    sorter.columnKey === 'demand_title'
                        ? 'name'
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
                    name: null,
                })
            } else {
                setTableSort({
                    createAt: 'ascend',
                    name: null,
                })
            }
        } else if (searchCondition.sort === SortDirection.ASC) {
            setTableSort({
                createAt: null,
                name: 'descend',
            })
        } else {
            setTableSort({
                createAt: null,
                name: 'ascend',
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

    return (
        <div className={styles.requirementWrapper}>
            <div className={styles.title}>需求分析</div>
            {/* <RequirementSearch getSearchCondition={getSearchCondition} /> */}
            <SearchLayout
                ref={searchRef}
                prefixNode={
                    // <div className={styles.operateRow}>
                    <Space size={12}>
                        {statusList.map((status) => (
                            <div
                                key={status.key}
                                className={classnames({
                                    [styles.statusItem]: true,
                                    [styles.selectedStatusItem]:
                                        searchCondition.tag_filter ===
                                        status.key,
                                })}
                                onClick={() => {
                                    searchRef.current?.resetHandel()
                                    setSearchCondition({
                                        ...searchCondition,
                                        tag_filter: status.key,
                                    })
                                }}
                            >
                                {status.key === StatusEnum.ALL
                                    ? status.name
                                    : `${status.name}(${getCount(status.key)})`}
                            </div>
                        ))}
                    </Space>
                }
                suffixNode={
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
                }
                formData={searchFormData}
                onSearch={(obj) => {
                    getSearchCondition(obj)
                }}
                getExpansionStatus={setSearchIsExpansion}
            />

            {/* </div> */}
            {loading ? (
                <div className={styles.loader}>
                    <Loader />
                </div>
            ) : tableProps.dataSource.length === 0 && !isSearchStatus ? (
                <div className={styles.emptyWrapper}>
                    <Empty iconSrc={empty} desc="暂无数据" />
                </div>
            ) : (
                <div className={styles.list}>
                    <Table
                        columns={columns}
                        {...tableProps}
                        rowKey="id"
                        scroll={{
                            x: 1000,
                            y:
                                tableProps.dataSource.length === 0
                                    ? undefined
                                    : `calc(100vh - ${
                                          !searchIsExpansion
                                              ? hasSearchCondition
                                                  ? 278 + 41
                                                  : 278
                                              : hasSearchCondition
                                              ? 388 + 41
                                              : 388
                                      }px)`,
                        }}
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
                        rowClassName={styles.tableRow}
                        pagination={{
                            ...tableProps.pagination,
                            showSizeChanger: false,
                            hideOnSinglePage: true,
                        }}
                        locale={{ emptyText: <Empty /> }}
                    />
                </div>
            )}
        </div>
    )
}
export default RequirementAnalysis
