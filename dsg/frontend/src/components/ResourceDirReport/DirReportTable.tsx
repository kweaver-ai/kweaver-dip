/* eslint-disable no-bitwise */
import { useAntdTable } from 'ahooks'
import { Button, message, Space, Table, Tooltip } from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import { isNumber } from 'lodash'
import moment from 'moment'
import {
    forwardRef,
    Key,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import dataEmpty from '@/assets/dataEmpty.svg'
import { FixedType } from '@/components/CommonTable/const'
import SearchLayout from '@/components/SearchLayout'
import { SortBtn } from '@/components/ToolbarComponents'
import {
    cancelSSZDCatlgReport,
    createAuditFlow,
    createSSZDCatlgReport,
    formatError,
    getSSZDReportRecord,
    ISSZDAuditLevel,
    ISSZDAuditOperation,
    ISSZDReportAuditStatus,
    ISSZDReportRecordType,
    revocationSSZDCatlgReport,
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
    DefaultMenu,
    IDirTable,
    initSearchCondition,
    ISearchCondition,
    resourceTypeList,
    statusList,
    StatusType,
} from './const'
import {
    getReportMsgConfig,
    getReportState,
    getStateItem,
    reportSearchFilter,
    timeStrToTimestamp,
} from './helper'
import __ from './locale'
import styles from './styles.module.less'
import CatlgAuditDetail from '../ResourceDirReportAudit/CatlgAuditDetail'
import { PromptModal } from '../ResourceDirReportAudit/helper'

const DirReportTable = forwardRef((props: IDirTable, ref) => {
    const { selectedNode, treeType } = props

    const navigator = useNavigate()
    const [loading, setLoading] = useState<boolean>(true)

    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        reportTime: 'descend',
    })
    // 选中项
    const [selectedItems, setSelectedItems] = useState<any[]>([])
    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(DefaultMenu.reported)

    const [searchCondition, setSearchCondition] = useState<ISearchCondition>({
        ...initSearchCondition,
        query_type: ISSZDReportRecordType.Reported,
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
            searchCondition.catalog_status ||
            searchCondition.audit_status
        )
    }, [searchCondition])

    useImperativeHandle(ref, () => ({
        handleRefresh,
    }))

    const handleRefresh = () => {
        setSearchCondition({
            ...searchCondition,
            offset: 1,
        })
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

    // 目录上报记录查询
    const getDataList = async (params) => {
        try {
            setLoading(true)
            const { current, pageSize, ...rest } = params
            const obj = { ...rest, offset: current, limit: pageSize }
            const res = await getSSZDReportRecord(obj)
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

    const { tableProps, run, pagination, refresh } = useAntdTable(getDataList, {
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

    // 点击目录项
    const [curCatlg, setCurCatlg] = useState<IRescItem>()
    const [previewOpen, setPreviewOpen] = useState<boolean>(false)

    const handleReport = async (params: {
        catalog_id: string
        operation: ISSZDAuditOperation.Report | ISSZDAuditOperation.ReReport
    }) => {
        try {
            await createSSZDCatlgReport(params)
            // 提示
            message.success(getReportMsgConfig(__('重新上报')))
            refresh()
        } catch (error) {
            formatError(error)
        }
    }
    const handleRevocation = async (id: string) => {
        try {
            await revocationSSZDCatlgReport(id)
            // 提示
            message.success(getReportMsgConfig(__('撤销上报')))
            refresh()
        } catch (error) {
            formatError(error)
        }
    }
    const handleCancel = async (id: string) => {
        try {
            await cancelSSZDCatlgReport(id)
            // 提示
            message.success(__('撤回成功'))
            refresh()
        } catch (error) {
            formatError(error)
        }
    }

    const handleOperate = async (op: OperateType, item: any) => {
        switch (op) {
            case OperateType.DETAIL:
                setCurCatlg(item)
                setPreviewOpen(true)
                break
            case OperateType.REPORT:
                // 重新上报
                handleReport({
                    catalog_id: item?.catalog_id,
                    operation: ISSZDAuditOperation.ReReport,
                })
                break
            case OperateType.REVOCATION:
                PromptModal({
                    title: __('提示'),
                    content: __('确定撤回省级目录上报申请吗？'),
                    async onOk() {
                        // 撤销上报
                        handleRevocation(item?.catalog_id)
                    },
                    onCancel() {},
                })

                break
            case OperateType.CANCEL:
                PromptModal({
                    title: __('提示'),
                    content: __('确定撤回市级目录上报申请吗？'),
                    async onOk() {
                        // 撤回
                        handleCancel(item?.catalog_id)
                    },
                    onCancel() {},
                })
                break
            default:
                break
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
                    <span>{__('数据资源目录名称')}</span>
                </div>
            ),
            dataIndex: 'catalog_title',
            key: 'catalog_title',
            width: 220,
            ellipsis: true,
            render: (text, record) => (
                <div
                    className={styles.catlgTitle}
                    onClick={() => handleOperate(OperateType.DETAIL, record)}
                    title={text}
                >
                    {text || '--'}
                </div>
            ),
        },
        {
            title: __('目录编码'),
            dataIndex: 'catalog_code',
            key: 'catalog_code',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.catlgCode} title={record.catalog_code}>
                    {text || '--'}
                </div>
            ),
        },
        {
            title: __('资源类型'),
            dataIndex: 'resource_type',
            key: 'resource_type',
            ellipsis: true,
            /** 当前取第一个 */
            render: (arr: string[], record) =>
                resourceTypeList?.find((item) => item.value === arr?.[0])
                    ?.label || '--',
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
                return <div title={record?.reporter_name}>{text}</div>
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
            title: __('上线状态'),
            dataIndex: 'catalog_status',
            key: 'catalog_status',
            render: (text, record) => {
                const statusItem = statusList?.find(
                    (item) => item.value === text,
                )
                return (
                    <div>{statusItem ? getReportState(statusItem) : '--'}</div>
                )
            },
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
        {
            title: __('操作'),
            key: 'action',
            width: 220,
            fixed: FixedType.RIGHT,
            render: (_: string, record) => {
                // 正在审核
                const isAuditing =
                    record.audit_status === ISSZDReportAuditStatus.Auditing
                // 可撤回  市级且处于审核中
                const canCancel =
                    record.audit_level === ISSZDAuditLevel.City && isAuditing

                const btnList: any[] = [
                    {
                        key: OperateType.REPORT,
                        label: __('重新上报'),
                        show: true,
                        disabled:
                            isAuditing ||
                            record?.catalog_status === StatusType.Offline, // 审核中或已下线
                        tip:
                            record?.catalog_status === StatusType.Offline
                                ? __('已下线目录,不能重新上报')
                                : __('变更上报审核中,不能重复操作'),
                    },
                    {
                        key: OperateType.REVOCATION,
                        label: __('撤销上报'),
                        show: true,
                        disabled: isAuditing, // 非审核中可撤销上报
                        tip:
                            record?.audit_operation ===
                            ISSZDAuditOperation.Revocation
                                ? __('撤销上报审核中,不能重复操作')
                                : __('变更上报审核中,不能重复操作'),
                    },
                    {
                        key: OperateType.CANCEL,
                        label: __('撤回'),
                        show: canCancel,
                    },
                ]
                return (
                    <Space size={16} className={styles.oprColumn}>
                        {btnList
                            .filter((item) => item.show)
                            .map((item) => {
                                return (
                                    <Tooltip
                                        title={item.disabled ? item.tip : ''}
                                    >
                                        <Button
                                            type="link"
                                            key={item.key}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleOperate(item.key, record)
                                            }}
                                            disabled={item.disabled}
                                        >
                                            {item.label}
                                        </Button>
                                    </Tooltip>
                                )
                            })}
                    </Space>
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

    // 表格选项属性
    const rowSelection = {
        selectedRowKeys: selectedItems.map((i) => i.catalog_id),
        onChange: (val: Key[], selectedRows) => {
            if (
                val.length === 0 ||
                val.length === tableProps.dataSource?.length
            ) {
                const ids = tableProps.dataSource?.map((i) => i.catalog_id)
                let filterItems = selectedItems.filter(
                    (k) => !ids.includes(k.catalog_id),
                )
                if (val.length === tableProps.dataSource?.length) {
                    filterItems = [...filterItems, ...selectedRows]
                }
                setSelectedItems(filterItems)
            }
        },
        onSelect: (record, selected, selectedRows) => {
            if (selected) {
                setSelectedItems([...selectedItems, record])
            } else {
                setSelectedItems([
                    ...selectedItems.filter(
                        (i) => i.catalog_id !== record.catalog_id,
                    ),
                ])
            }
        },
    }

    const handleBatchReport = () => {
        const filterRepeat = selectedItems?.filter(
            (o) =>
                o.audit_status !== ISSZDReportAuditStatus.Auditing ||
                o?.catalog_status === StatusType.Offline,
        )

        const allReq = filterRepeat?.map((o) =>
            createSSZDCatlgReport({
                catalog_id: o?.catalog_id,
                operation: ISSZDAuditOperation.ReReport,
            }),
        )
        const hasRepeat = filterRepeat?.length !== selectedItems?.length
        if (allReq?.length) {
            Promise.allSettled(allReq).then((values) => {
                const errorLen = values?.filter(
                    (o) => o.status === 'rejected',
                )?.length
                if (errorLen) {
                    message.error(
                        __('${num}条${type}申请提交失败', {
                            num: errorLen,
                            type: __('重新上报'),
                        }),
                    )
                } else {
                    message.success(
                        getReportMsgConfig(__('重新上报'), hasRepeat),
                    )
                }
                refresh()
            })
            return
        }
        message.success(getReportMsgConfig(__('重新上报'), hasRepeat))
    }

    const handleBatchCancel = () => {
        const filterRepeat = selectedItems?.filter(
            (o) => o.audit_status !== ISSZDReportAuditStatus.Auditing,
        )

        const allReq = filterRepeat?.map((o) =>
            revocationSSZDCatlgReport(o?.catalog_id),
        )
        const hasRepeat = filterRepeat?.length !== selectedItems?.length
        if (allReq?.length) {
            Promise.allSettled(allReq).then((values) => {
                const errorLen = values?.filter(
                    (o) => o.status === 'rejected',
                )?.length
                if (errorLen) {
                    message.error(
                        __('${num}条${type}申请提交失败', {
                            num: errorLen,
                            type: __('撤销上报'),
                        }),
                    )
                } else {
                    message.success(
                        getReportMsgConfig(__('撤销上报'), hasRepeat),
                    )
                }
                refresh()
            })
            return
        }
        message.success(getReportMsgConfig(__('撤销上报'), hasRepeat))
    }

    return (
        <div className={styles['dir-report']}>
            <SearchLayout
                ref={searchFormRef}
                prefixNode={
                    <Space direction="horizontal" size={8}>
                        <Tooltip
                            title={
                                selectedItems?.length ? '' : __('请先勾选目录')
                            }
                        >
                            <Button
                                disabled={!selectedItems?.length}
                                onClick={handleBatchReport}
                            >
                                {__('重新上报')}
                            </Button>
                        </Tooltip>
                        <Tooltip
                            title={
                                selectedItems?.length ? '' : __('请先勾选目录')
                            }
                        >
                            <Button
                                disabled={!selectedItems?.length}
                                onClick={handleBatchCancel}
                            >
                                {__('撤销上报')}
                            </Button>
                        </Tooltip>
                    </Space>
                }
                formData={reportSearchFilter}
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
                                menus={[DefaultMenu.reported]}
                                defaultMenu={DefaultMenu.reported}
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
                            rowSelection={rowSelection}
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
                                        pageSize: newPagination.pageSize || 10,
                                    })
                                }
                            }}
                        />
                    )}
                </div>
            )}
            {previewOpen && (
                <CatlgAuditDetail
                    item={curCatlg}
                    onClose={() => {
                        setPreviewOpen(false)
                        setCurCatlg(undefined)
                    }}
                />
            )}
        </div>
    )
})
export default DirReportTable
