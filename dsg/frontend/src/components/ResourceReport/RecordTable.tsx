/* eslint-disable no-bitwise */
import { useAntdTable } from 'ahooks'
import { message, Table, Tooltip } from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import { isNumber } from 'lodash'
import moment from 'moment'
import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import dataEmpty from '@/assets/dataEmpty.svg'
import SearchLayout from '@/components/SearchLayout'
import { SortBtn } from '@/components/ToolbarComponents'
import {
    createAuditFlow,
    formatError,
    getSSZDRescReportRecord,
    ISSZDReportAuditStatus,
    ISSZDReportRecordType,
    SortDirection,
    SystemCategory,
} from '@/core'
import { IRescItem } from '@/core/apis/dataCatalog/index.d'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { Loader } from '@/ui'
import Empty from '@/ui/Empty'
import { OperateType } from '@/utils'
import DropDownFilter from '../DropDownFilter'
import {
    auditOperationList,
    DefaultMenu,
    IDirTable,
    initSearchCondition,
    ISearchCondition,
    resourceTypeList,
} from './const'
import {
    getReportState,
    getStateItem,
    recordSearchFilter,
    timeStrToTimestamp,
} from './helper'
import __ from './locale'
import styles from './styles.module.less'

const RecordTable = forwardRef((props: IDirTable, ref) => {
    const { selectedNode, treeType } = props

    const navigator = useNavigate()
    const [loading, setLoading] = useState<boolean>(true)

    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        reportTime: 'descend',
    })

    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(DefaultMenu.record)

    const [searchCondition, setSearchCondition] = useState<ISearchCondition>({
        ...initSearchCondition,
        query_type: ISSZDReportRecordType.Record,
    })

    // 修改表头排序
    const [updateSortOrder, setUpdateSortOrder] = useState<SortOrder>('ascend')

    const [searchIsExpansion, setSearchIsExpansion] = useState<boolean>(false)

    const searchFormRef: any = useRef()
    const [currentOpsType, setCurrentOpsType] = useState<OperateType>(
        OperateType.PUBLISH,
    )
    const [tableHeight, setTableHeight] = useState<number>(0)
    const [initSearch, setInitSearch] = useState<boolean>(true)

    const hasSearchCondition = useMemo(() => {
        return (
            searchCondition.keyword ||
            searchCondition.resource_type ||
            searchCondition.org_code ||
            searchCondition.audit_operation ||
            searchCondition.audit_status
        )
    }, [searchCondition])

    useImperativeHandle(ref, () => ({
        handleRefresh,
    }))

    const handleRefresh = () => {
        // 刷新
    }

    useEffect(() => {
        if (!initSearch) {
            let searchData: any = {}
            if (selectedNode.cate_id === SystemCategory.Organization) {
                searchData = {
                    ...searchCondition,
                    department_id: selectedNode.id,
                    info_system_id: undefined,
                    category_node_id: undefined,
                    current: 1,
                }
            } else if (
                selectedNode.cate_id === SystemCategory.InformationSystem
            ) {
                searchData = {
                    ...searchCondition,
                    department_id: undefined,
                    info_system_id: selectedNode.id,
                    category_node_id: undefined,
                    current: 1,
                }
            } else {
                searchData = {
                    ...searchCondition,
                    department_id: undefined,
                    info_system_id: undefined,
                    category_node_id: selectedNode.id,
                    current: 1,
                }
            }
            run(searchData)
        }
    }, [selectedNode])

    useEffect(() => {
        // 展开/收起查询条件高度
        const defalutHeight: number = !searchIsExpansion ? 276 : 384
        // 已选搜索条件高度
        const searchConditionHeight: number = hasSearchCondition ? 41 : 0
        const height = defalutHeight + searchConditionHeight

        setTableHeight(height)
    }, [hasSearchCondition, searchIsExpansion])

    useEffect(() => {
        run({ ...searchCondition })
    }, [])

    // 资源上报记录查询
    const getDataList = async (params) => {
        try {
            setLoading(true)
            const { current, pageSize, ...rest } = params
            const obj = { ...rest, offset: current, limit: pageSize }
            const res = await getSSZDRescReportRecord(obj)
            return { total: res.total_count, list: res.entries }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setLoading(false)
            setSelectedSort(undefined)
            setInitSearch(false)
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getDataList, {
        defaultPageSize: 10,
        manual: true,
    })

    useEffect(() => {
        if (!initSearch) {
            run({ ...searchCondition })
        }
    }, [searchCondition])

    useEffect(() => {
        setUpdateSortOrder(
            initSearchCondition.direction === SortDirection.DESC
                ? 'descend'
                : 'ascend',
        )

        if (!initSearch) {
            run({
                ...pagination,
                ...searchCondition,
                current: initSearchCondition.offset,
            })
        }
    }, [treeType])

    // 点击资源项
    const [curCatlg, setCurCatlg] = useState<IRescItem>()

    const handleOperate = async (op: OperateType, item: IRescItem) => {
        setCurrentOpsType(op)
        setCurCatlg(item)
        if (op === OperateType.DETAIL) {
            const url = `/dataService/dirContent?catlgId=${item.id}&activeTabKey=${treeType}&treeNodeId=${selectedNode.id}&name=${item.name}&resourcesType=${item.resource_type}`
            navigator(url)
        } else if (op === OperateType.EDIT) {
            const url = `/dataService/AddResourcesDirList?id=${item.id}`
            navigator(url)
        }
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            if (sorter.columnKey === 'report_time') {
                setTableSort({
                    reportTime: sorter.order || 'ascend',
                })
            } else {
                setTableSort({
                    reportTime: null,
                })
            }
            return {
                key: sorter.columnKey === 'title' ? 'name' : sorter.columnKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }
        if (searchCondition.sort === 'report_time') {
            if (searchCondition.direction === SortDirection.ASC) {
                setTableSort({
                    reportTime: 'descend',
                })
            } else {
                setTableSort({
                    reportTime: 'ascend',
                })
            }
        } else if (searchCondition.sort === SortDirection.ASC) {
            setTableSort({
                reportTime: null,
            })
        } else {
            setTableSort({
                reportTime: null,
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

    const columns: any = [
        {
            title: (
                <div>
                    <span>{__('资源名称')}</span>
                </div>
            ),
            dataIndex: 'report_resources',
            key: 'report_resources',
            width: 180,
            ellipsis: true,
            render: (arr: any[], record) => {
                const text = arr?.[0]?.name
                return (
                    <div
                        className={styles.catlgTitle}
                        onClick={() =>
                            handleOperate(OperateType.DETAIL, record)
                        }
                        title={text}
                    >
                        {text || '--'}
                    </div>
                )
            },
        },
        {
            title: __('资源类型'),
            dataIndex: 'report_resources',
            key: 'report_resources',
            ellipsis: true,
            /** 当前取第一个 */
            render: (arr: any[], record) =>
                resourceTypeList?.find((item) => item.value === arr?.[0]?.type)
                    ?.label || '--',
        },
        {
            title: __('所属目录名称'),
            dataIndex: 'catalog_title',
            key: 'catalog_title',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.catlgCode} title={text}>
                    {text || '--'}
                </div>
            ),
        },
        {
            title: __('数据提供方'),
            dataIndex: 'org_name',
            key: 'org_name',
            ellipsis: true,
            render: (text, record) => {
                return (
                    <div className={styles.orgCode} title={record?.org_path}>
                        {text || '--'}
                    </div>
                )
            },
        },
        {
            title: __('上报人'),
            dataIndex: 'reporter_name',
            key: 'reporter_name',
            ellipsis: true,
            render: (text, record) => {
                return <div title={record?.reporter_name}>{text || '--'}</div>
            },
        },
        {
            title: __('上报时间'),
            dataIndex: 'report_time',
            key: 'report_time',
            ellipsis: true,
            width: 180,
            sorter: true,
            sortOrder: tableSort.reportTime,
            showSorterTooltip: false,
            render: (text: any) => {
                return isNumber(text)
                    ? moment(text).format('YYYY-MM-DD HH:mm:ss')
                    : '--'
            },
        },

        {
            title: __('上报类型'),
            dataIndex: 'audit_operation',
            key: 'audit_operation',
            render: (text, record) =>
                auditOperationList?.find((item) => item.value === text)
                    ?.label || '--',
        },
        {
            title: __('审核状态'),
            dataIndex: 'audit_status',
            key: 'audit_status',
            ellipsis: true,
            width: 220,
            render: (text, record) => {
                const showMsg =
                    record?.audit_comment &&
                    record?.audit_status === ISSZDReportAuditStatus.Reject
                const title = `${__('审核未通过理由')}：${
                    record?.audit_comment
                }`

                const state = getStateItem({
                    level: record.audit_level,
                    status: record.audit_status,
                    operation: record.audit_operation,
                })

                return (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {state ? getReportState(state) : '--'}
                        {showMsg && (
                            <Tooltip title={title} placement="bottom">
                                <FontIcon
                                    name="icon-shenheyijian"
                                    type={IconType.COLOREDICON}
                                    className={styles.icon}
                                    style={{ fontSize: 20, marginLeft: 4 }}
                                />
                            </Tooltip>
                        )}
                    </div>
                )
            },
        },
    ]

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
            case 'report_time':
                setTableSort({
                    reportTime:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                })
                break
            default:
                setTableSort({
                    reportTime: null,
                })
                break
        }
    }

    const renderEmpty = () => {
        return <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
    }

    // 1：上线、3：下线、4：发布
    const handleOnline = async (data: any, type: OperateType) => {
        const text =
            type === OperateType.ONLINE
                ? __('上线')
                : type === OperateType.OFFLINE
                ? __('下线')
                : __('发布')
        try {
            const flowType =
                type === OperateType.ONLINE
                    ? 'af-data-catalog-online'
                    : type === OperateType.OFFLINE
                    ? 'af-data-catalog-offline'
                    : 'af-data-catalog-publish'

            await createAuditFlow({
                catalogID: data?.id,
                flowType,
            })
            message.success(__('操作成功'))
            run({
                ...searchCondition,
                current: initSearchCondition.offset,
            })
        } catch (error) {
            if (
                error?.data?.code === 'DataCatalog.Public.NoAuditDefFoundError'
            ) {
                message.error({
                    content: __('审核发起失败，未找到匹配的审核流程'),
                    duration: 5,
                })
            } else if (
                error?.data?.code ===
                'DataCatalog.Public.ConfigCenterDepOwnerUsersRequestErr'
            ) {
                message.info({
                    content: `${text}${__('失败，部门不存在')}`,
                })
            } else {
                formatError(error)
            }
        }
    }

    return (
        <div className={styles['dir-report']}>
            <SearchLayout
                ref={searchFormRef}
                formData={recordSearchFilter}
                onSearch={(object) => {
                    const obj = timeStrToTimestamp(object)
                    const params = {
                        ...searchCondition,
                        ...obj,
                        current: 1,
                    }
                    setSearchCondition(params)
                }}
                suffixNode={
                    <SortBtn
                        contentNode={
                            <DropDownFilter
                                menus={[DefaultMenu.record]}
                                defaultMenu={DefaultMenu.record}
                                menuChangeCb={handleMenuChange}
                                changeMenu={selectedSort}
                            />
                        }
                    />
                }
                getExpansionStatus={setSearchIsExpansion}
            />
            {loading ? (
                <Loader />
            ) : (
                <div className={styles.bottom}>
                    {tableProps.dataSource.length === 0 &&
                    !hasSearchCondition ? (
                        <div className={styles.emptyWrapper}>
                            {renderEmpty()}
                        </div>
                    ) : (
                        <Table
                            className={classnames(
                                !searchIsExpansion && styles.isExpansion,
                            )}
                            rowClassName={styles.tableRow}
                            columns={columns}
                            {...tableProps}
                            rowKey="catalog_id"
                            scroll={{
                                x: 1340,
                                y:
                                    tableProps.dataSource.length === 0
                                        ? undefined
                                        : `calc(100vh - ${tableHeight}px)`,
                            }}
                            pagination={{
                                ...tableProps.pagination,
                                showSizeChanger: false,
                                hideOnSinglePage: true,
                            }}
                            bordered={false}
                            locale={{
                                emptyText: <Empty />,
                            }}
                            onChange={(newPagination, filters, sorter) => {
                                if (
                                    newPagination.current ===
                                        searchCondition.current &&
                                    newPagination.pageSize ===
                                        searchCondition.pageSize
                                ) {
                                    const selectedMenu =
                                        handleTableChange(sorter)
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
                                        current: newPagination?.current || 1,
                                        pageSize: newPagination?.pageSize || 10,
                                    })
                                }
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    )
})

export default RecordTable
