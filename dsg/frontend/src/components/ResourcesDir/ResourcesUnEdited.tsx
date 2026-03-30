import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Space, Table, Tooltip } from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import { useAntdTable } from 'ahooks'
import classnames from 'classnames'
import { isNumber } from 'lodash'
import moment from 'moment'
import { OperateType } from '@/utils'
import { SortDirection, formatError, getUnEditRescCatlgList } from '@/core'
import { useResourcesCatlogContext } from '@/components/ResourcesDir/ResourcesCatlogProvider'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import {
    Architecture,
    ISearchCondition,
    RescCatlgType,
    defaultMenu,
    initSearchCondition,
    menus,
    lightweightSearchData,
    resourceTypeList,
    ResTypeEnum,
} from './const'
import styles from './styles.module.less'
import { LightweightSearch, OptionMenuType, Loader, SearchInput } from '@/ui'
import { SortBtn, RefreshBtn } from '@/components/ToolbarComponents'
import { FixedType } from '@/components/CommonTable/const'
import DropDownFilter from '../DropDownFilter'
import __ from './locale'
import { CustomExpandIcon, resourceTypeIcon } from './helper'

interface IResourcesUnEdited {
    selectedTreeNode: any
    treeType?: RescCatlgType | string
}
const ResourcesUnEdited = (props: IResourcesUnEdited) => {
    const { selectedTreeNode, treeType } = props
    const navigator = useNavigate()
    const [loading, setLoading] = useState<boolean>(true)
    const searchValue = useRef<string>('')
    const { setMountResourceData } = useResourcesCatlogContext()

    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        publishAt: 'descend',
    })

    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)

    const [searchCondition, setSearchCondition] = useState<ISearchCondition>({
        ...initSearchCondition,
        sort: 'publish_at',
    })
    const [searchIsExpansion, setSearchIsExpansion] = useState<boolean>(false)
    const [tableHeight, setTableHeight] = useState<number>(0)
    const [initSearch, setInitSearch] = useState<boolean>(true)
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
    const [selectedRows, setSelectedRows] = useState<any[]>([])

    const hasSearchCondition = useMemo(() => {
        return (
            searchCondition.keyword ||
            searchCondition.resource_type ||
            searchCondition.publish_at_start
        )
    }, [searchCondition])

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

    // 自定义 rowSelection 的 getCheckboxProps
    const rowSelection = {
        selectedRowKeys,
        hideSelectAll: true,
        onChange: (selectedKeys, selcRows) => {
            setSelectedRowKeys(selectedKeys)
            setSelectedRows(selcRows)
        },
        getCheckboxProps: (record) => {
            const hide = record.resource_type === ResTypeEnum.API

            // 检查是否已经选择了一个 resource_type 为 1 的记录
            const isDataViewSelected =
                selectedRows.some((rec) => rec.resource_type === 1) &&
                record.resource_type === 1 &&
                !selectedRows.find(
                    (item) => item.resource_id === record.resource_id,
                )

            return {
                disabled: isDataViewSelected, // 根据条件禁用选择框
                style: {
                    display: hide ? 'none' : 'inline-flex', // 根据条件隐藏选择框
                },
            }
        },
    }

    // 获取目录列表
    const getCatlgList = async (params) => {
        try {
            setLoading(true)
            const { current, pageSize, ...rest } = params
            const obj = { ...rest, offset: current, limit: pageSize }
            const res = await getUnEditRescCatlgList(obj)
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

    const { tableProps, run, pagination } = useAntdTable(getCatlgList, {
        defaultPageSize: 10,
        manual: true,
    })

    useEffect(() => {
        if (!initSearch) {
            let searchData: any = {}
            if (treeType === RescCatlgType.ORGSTRUC) {
                searchData = {
                    ...searchCondition,
                    department_id: selectedTreeNode.id,
                }
            } else if (treeType === RescCatlgType.RESC_CLASSIFY) {
                searchData = {
                    ...searchCondition,
                    categoryID: selectedTreeNode.id,
                }
            } else if (treeType === RescCatlgType.DOAMIN) {
                searchData = {
                    ...searchCondition,
                    categoryID: undefined,
                    orgcode: undefined,
                    subject_id: selectedTreeNode.id,
                }
            }
            run(searchData)
        }
    }, [searchCondition])

    useEffect(() => {
        if (!initSearch) {
            let searchData: any = {}
            if (treeType === RescCatlgType.ORGSTRUC) {
                searchData = {
                    ...searchCondition,
                    department_id: selectedTreeNode.id,
                    current: 1,
                }
            } else if (treeType === RescCatlgType.RESC_CLASSIFY) {
                searchData = {
                    ...searchCondition,
                    categoryID: selectedTreeNode.id,
                    current: 1,
                }
            } else if (treeType === RescCatlgType.DOAMIN) {
                searchData = {
                    ...searchCondition,
                    categoryID: undefined,
                    orgcode: undefined,
                    subject_id: selectedTreeNode.id,
                    current: 1,
                }
            }
            run(searchData)
        }
    }, [selectedTreeNode])

    useEffect(() => {
        if (!initSearch) {
            run({
                ...pagination,
                ...searchCondition,
                current: initSearchCondition.offset,
            })
        }
    }, [treeType])

    const handleOperate = async (op: OperateType, item: any) => {
        if (op === OperateType.DETAIL) {
            let linkUrl = ''
            if (item.resource_type === 1) {
                linkUrl = `/datasheet-view/detail?id=${item.resource_id}&model=view&backPrev=true`
            } else if (item.resource_type === 2) {
                linkUrl = `/dataService/interfaceService/api-service-detail?serviceId=${item.resource_id}&backUrl=/dataService/dataContent`
            } else if (item.resource_type === 3) {
                linkUrl = `/data-files/detail?id=${item.resource_id}&backUrl=/dataService/dataContent`
            }

            if (linkUrl) {
                navigator(linkUrl)
            }
        } else if (op === OperateType.EDIT) {
            const url = `/dataService/AddResourcesDirList?id=${item.resource_id}&resourcesType=${item.resource_type}`
            navigator(url)
        }
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            if (sorter.columnKey === 'publish_at') {
                setTableSort({
                    publishAt: sorter.order || 'ascend',
                    name: null,
                })
            } else {
                setTableSort({
                    publishAt: null,
                    name: sorter.order || 'ascend',
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
        if (searchCondition.sort === 'publish_at') {
            if (searchCondition.direction === SortDirection.ASC) {
                setTableSort({
                    publishAt: 'descend',
                    name: null,
                })
            } else {
                setTableSort({
                    publishAt: 'ascend',
                    name: null,
                })
            }
        } else if (searchCondition.sort === SortDirection.ASC) {
            setTableSort({
                publishAt: null,
                name: 'descend',
            })
        } else {
            setTableSort({
                publishAt: null,
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

    const columns: any = [
        {
            title: (
                <div>
                    <span>{__('数据资源名称')}</span>
                    <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                        {__('（编码）')}
                    </span>
                </div>
            ),
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            sortOrder: tableSort.name,
            showSorterTooltip: {
                title: __('按资源名称排序'),
                placement: 'bottom',
                overlayInnerStyle: {
                    color: '#fff',
                },
            },
            render: (text, record) => (
                <div className={styles.catlgName}>
                    <span className={styles.nameIcon}>
                        {resourceTypeIcon(record.resource_type)}
                    </span>
                    <div className={styles.catlgNameCont}>
                        <div
                            onClick={() =>
                                handleOperate(OperateType.DETAIL, record)
                            }
                            title={text}
                            className={styles.names}
                        >
                            {text || '--'}
                        </div>
                        <div className={styles.code} title={record.code}>
                            {record.code}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: __('资源类型'),
            dataIndex: 'resource_type',
            key: 'resource_type',
            ellipsis: true,
            render: (text, record) =>
                resourceTypeList?.find((item) => item.value === text)?.label ||
                '--',
        },
        {
            title: __('目录提供方'),
            dataIndex: 'department',
            key: 'department',
            ellipsis: true,
            render: (text, record) => {
                return <div title={record?.department_path}>{text || '--'}</div>
            },
        },
        {
            title: __('发布时间'),
            dataIndex: 'publish_at',
            key: 'publish_at',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.publishAt,
            showSorterTooltip: {
                title: __('按发布时间排序'),
                placement: 'bottom',
                overlayInnerStyle: {
                    color: '#fff',
                },
            },
            render: (text: any) => {
                return isNumber(text)
                    ? moment(text).format('YYYY-MM-DD HH:mm:ss')
                    : '--'
            },
        },
        {
            title: __('操作'),
            key: 'action',
            width: 120,
            fixed: FixedType.RIGHT,
            render: (_: string, record) => {
                const showEdit = record.resource_type !== ResTypeEnum.API
                const btnList: any[] = [
                    // {
                    //     key: OperateType.DETAIL,
                    //     label: __('详情'),
                    //     show: isAllowDetail,
                    //     tooltipOpen: false,
                    //     menuType: OptionMenuType.More,
                    // },
                    {
                        key: OperateType.EDIT,
                        label: __('编目'),
                        menuType: OptionMenuType.More,
                        show: showEdit,
                    },
                ]
                return [Architecture.BFORM, Architecture.COREBUSINESS].includes(
                    record.type as Architecture,
                ) ? null : (
                    <Space size={16} className={styles.oprColumn}>
                        {btnList
                            .filter((item) => item.show)
                            .map((item) => {
                                return (
                                    <Button
                                        type="link"
                                        key={item.key}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleOperate(item.key, record)
                                        }}
                                    >
                                        {item.label}
                                    </Button>
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
            case 'name':
                setTableSort({
                    name:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    publishAt: null,
                })
                break
            case 'publish_at':
                setTableSort({
                    name: null,
                    publishAt:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                })
                break
            default:
                setTableSort({
                    name: null,
                    publishAt: null,
                })
                break
        }
    }

    const renderEmpty = () => {
        return <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
    }

    const toEdit = () => {
        let tableResourceType = selectedRows.find(
            (row) => row.resource_type === 1,
        )
        if (!tableResourceType) {
            // eslint-disable-next-line prefer-destructuring
            tableResourceType = selectedRows[0]
        }
        setMountResourceData(selectedRows)

        navigator(
            `/dataService/AddResourcesDirList?id=${
                tableResourceType?.resource_id
            }&resourcesType=${tableResourceType?.resource_type || ''}`,
            {
                state: {
                    resourceData: selectedRows,
                },
            },
        )
    }

    return (
        <div className={styles.catlgResourceWrapper}>
            <div className={styles.top}>
                <Tooltip title={!selectedRows?.length ? __('请选择资源') : ''}>
                    <Button
                        type="primary"
                        disabled={!selectedRows?.length}
                        onClick={toEdit}
                    >
                        {__('编目')}
                    </Button>
                </Tooltip>
                <Space className={styles.serachBox}>
                    <SearchInput
                        placeholder={__('搜索数据资源名称、编码')}
                        onKeyChange={(kw: string) => {
                            if (!kw && !searchValue.current) return
                            searchValue.current = kw
                            setSearchCondition({
                                ...searchCondition,
                                current: 1,
                                keyword: kw || '',
                            })
                        }}
                        maxLength={255}
                        value={searchCondition.keyword}
                        className={styles.searchInput}
                        style={{ width: 285 }}
                    />
                    <LightweightSearch
                        formData={lightweightSearchData}
                        onChange={(data, key) => {
                            let params: any = {}
                            if (key === 'resource_type') {
                                params = {
                                    ...searchCondition,
                                    current: 1,
                                    resource_type:
                                        data.resource_type || undefined,
                                }
                            } else if (key === 'publish_at') {
                                params = {
                                    ...searchCondition,
                                    current: 1,
                                    publish_at_start:
                                        data.publish_at?.[0] &&
                                        moment(
                                            data.publish_at[0].format(
                                                'YYYY-MM-DD 00:00:00',
                                            ),
                                        ).valueOf(),
                                    publish_at_end:
                                        data.publish_at?.[1] &&
                                        moment(
                                            data.publish_at[1].format(
                                                'YYYY-MM-DD 23:59:59',
                                            ),
                                        ).valueOf(),
                                }
                            } else {
                                params = {
                                    ...searchCondition,
                                    current: 1,
                                    resource_type: undefined,
                                    publish_at_start: undefined,
                                    publish_at_end: undefined,
                                }
                            }
                            setSearchCondition(params)
                        }}
                        defaultValue={{
                            resource_type: undefined,
                            publish_at: null,
                        }}
                    />
                    <span>
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
                                setSearchCondition({ ...searchCondition })
                            }
                        />
                    </span>
                </Space>
            </div>
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
                            rowKey="resource_id"
                            rowSelection={rowSelection}
                            scroll={{
                                y:
                                    tableProps.dataSource.length === 0
                                        ? undefined
                                        : `calc(100vh - ${tableHeight}px)`,
                            }}
                            pagination={{
                                ...tableProps.pagination,
                                hideOnSinglePage:
                                    tableProps.pagination.total <= 10,
                                showQuickJumper: true,
                                responsive: true,
                                showLessItems: true,
                                showSizeChanger: true,
                                showTotal: (count) =>
                                    __('共${count}条', { count }),
                            }}
                            bordered={false}
                            locale={{
                                emptyText: <Empty />,
                            }}
                            expandable={{
                                expandIcon: CustomExpandIcon,
                            }}
                            onChange={(newPagination, filters, sorter) => {
                                const selectedMenu = handleTableChange(sorter)
                                setSelectedSort(selectedMenu)
                                setSearchCondition((prev) => ({
                                    ...prev,
                                    sort: selectedMenu.key,
                                    direction: selectedMenu.sort,
                                    current: newPagination.current || 1,
                                    pageSize: newPagination.pageSize || 10,
                                }))
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    )
}

export default ResourcesUnEdited
