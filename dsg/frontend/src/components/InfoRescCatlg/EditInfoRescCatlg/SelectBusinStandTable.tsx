import React, { forwardRef, useEffect, useState } from 'react'
import { Space, Table, Tooltip } from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import { isNumber } from 'lodash'

import { useAntdTable, useDebounce } from 'ahooks'
import { Architecture } from '@/components/BusinessArchitecture/const'

import __ from './locale'
import styles from './styles.module.less'
import {
    DataNode,
    defaultMenu,
    editedDefaultMenu,
    editedMenus,
    initBusinFormSerachCondition,
    menus,
} from '../const'
import ArchitectureDirTree from '@/components/BusinessArchitecture/ArchitectureDirTree'
import DropDownFilter from '@/components/DropDownFilter'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import {
    Empty,
    ListPageSizerOptions,
    ListType,
    Loader,
    SearchInput,
} from '@/ui'
import { formatTime } from '@/utils'
import {
    formatError,
    getFormsFieldsList,
    getUneditFormList,
    IBusinFormSerachCondition,
    IInfoCatlgRelateBusinForm,
    SortDirection,
} from '@/core'
import { NewFormType } from '@/components/Forms/const'
import FieldTableView from '@/components/FormGraph/FieldTableView'
import MultiTypeSelectTree from '@/components/MultiTypeSelectTree'
import { TreeType, UNGROUPED } from '@/components/MultiTypeSelectTree/const'

const textLabel = (text: string, defaultTxt: string = '--') => {
    if (typeof text !== 'string') return ''
    return (
        text || <span style={{ color: 'rgba(0,0,0,0.45)' }}>{defaultTxt}</span>
    )
}

interface ISelectBusinStandTable {
    business_form?: IInfoCatlgRelateBusinForm
    onDataChange: (
        selData: IInfoCatlgRelateBusinForm,
        selNode?: DataNode,
    ) => void
}

const SelectBusinStandTable = forwardRef(
    (props: ISelectBusinStandTable, ref) => {
        const { business_form, onDataChange } = props

        // const [selectedNode, setSelectedNode] = useState<DataNode>({
        //     name: '全部',
        //     id: '',
        //     path: '',
        //     type: Architecture.ALL,
        // })
        const [dataSource, setDataSource] = useState<any[]>()

        const [selectedRow, setSelectedRow] = useState<any>()
        // 排序
        const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)
        // 创建表头排序
        const [tableSort, setTableSort] = useState<{
            [key: string]: SortOrder
        }>({
            update_at: 'descend',
        })

        const [searchCondition, setSearchCondition] =
            useState<IBusinFormSerachCondition>(initBusinFormSerachCondition)
        const searchDebounce = useDebounce(searchCondition, { wait: 100 })
        // 业务表点击名称查看对话框
        const [preFormVisible, setPreFormVisible] = useState(false)

        // 已选表 ids
        const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>(
            business_form ? [business_form?.id] : [],
        )
        // 已选表 rows
        const [selectedRows, setSelectedRows] = useState<any[]>([])

        const rowSelection = {
            selectedRowKeys,
            onChange: (selKeys: any, selRows: any) => {
                setSelectedRowKeys(selKeys)
            },
            onSelect: (record, selected, selRows) => {
                onDataChange(record)
            },
            // getCheckboxProps: (record: any) => ({
            //     disabled: record.name === 'Disabled User', // Column configuration not to be checked
            //     name: record.name,
            // }),
        }

        const [clickedForm, setClickedForm] = useState<any>()
        // 字段数据集
        const [fields, setFields] = useState<any[] | undefined>(undefined)

        useEffect(() => {
            if (business_form?.id) {
                setSelectedRowKeys([business_form.id])
            }
        }, [business_form])

        // 获取表单字段信息
        const queryFormFields = async (item?) => {
            try {
                const res = await getFormsFieldsList(item?.id, {
                    limit: 0,
                })
                setFields(res.entries)
            } catch (error) {
                setFields([])
                formatError(error)
            }
        }

        const handleView = (record) => {
            queryFormFields(record)
            setClickedForm(record)
            setPreFormVisible(true)
        }

        // 列表项
        const columns: any = [
            {
                title: __('业务标准表名称/描述'),
                dataIndex: 'name',
                key: 'name',
                showSorterTooltip: false,
                render: (name, record) => {
                    const { description } = record
                    return (
                        <div className={styles.catlgNameCont}>
                            <a
                                className={styles.catlgName}
                                title={name}
                                onClick={() => handleView(record)}
                            >
                                {name}
                            </a>
                            <div
                                className={styles.catlgDesc}
                                title={description}
                            >
                                {description}
                            </div>
                        </div>
                    )
                },
                ellipsis: true,
            },
            {
                title: __('所属组织架构'),
                dataIndex: 'department_name',
                key: 'department_name',
                ellipsis: true,
                render: (text, record) => (
                    <Tooltip title={record.department_path}>
                        <span>{text || '--'}</span>
                    </Tooltip>
                ),
            },
            {
                title: __('关联信息系统'),
                dataIndex: 'related_info_systems',
                key: 'related_info_systems',
                ellipsis: true,
                render: (infoSysList: any, record: any) => {
                    const showCont =
                        infoSysList?.map?.((item) => item.name)?.join() || '--'
                    return (
                        <span
                            title={record?.subject_path || '无'}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <span
                                style={{
                                    width: 'calc(100% - 30px)',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                }}
                            >
                                {showCont}
                            </span>
                        </span>
                    )
                },
            },
            {
                title: __('最终修改人'),
                dataIndex: 'update_by',
                key: 'update_by',
                ellipsis: true,
                render: (value: string, record: any) => (
                    <span title={record?.department_path || '无'}>
                        {textLabel(value)}
                    </span>
                ),
            },

            {
                title: __('最终修改时间'),
                dataIndex: 'update_at',
                key: 'update_at',
                // width: 180,
                ellipsis: true,
                sorter: true,
                sortOrder: tableSort.update_at,
                showSorterTooltip: {
                    title: __('按最终修改时间'),
                    placement: 'bottom',
                    overlayInnerStyle: {
                        color: '#fff',
                    },
                },
                render: (value) => {
                    return isNumber(value) ? formatTime(value) : '--'
                },
            },
        ]

        // 获取列表
        const getListData = async (params) => {
            const { current, keyword, state, publish_status, status, ...rest } =
                params
            try {
                const res = await getUneditFormList({
                    ...params,
                })
                return {
                    total: res.total_count || 0,
                    list: res.entries || [],
                }
            } catch (error) {
                formatError(error)
                return { total: 0, list: [] }
            } finally {
                setSelectedSort(undefined)
            }
        }

        const { tableProps, run, pagination, loading } = useAntdTable(
            getListData,
            {
                defaultPageSize: 10,
                manual: true,
            },
        )

        useEffect(() => {
            run({
                ...searchDebounce,
            })
        }, [searchDebounce])

        // 从树结构中获取选中节点
        const handleSelectedNodeFromTree = (menu: {
            nodeId: string
            treeType: string
            nodeType: string
        }) => {
            const selectNodeId = menu.nodeId
                ? menu.nodeId === UNGROUPED
                    ? ''
                    : menu.nodeId
                : undefined

            switch (menu.treeType) {
                case TreeType.Department:
                    return {
                        department_id: selectNodeId,
                        info_system_id: undefined,
                        node_id: undefined,
                    }
                case TreeType.BArchitecture:
                    return {
                        info_system_id: undefined,
                        node_id: selectNodeId,
                        department_id: undefined,
                    }
                case TreeType.InformationSystem:
                    return {
                        info_system_id: selectNodeId,
                        node_id: undefined,
                        department_id: undefined,
                    }
                default:
                    return {}
            }
        }

        // 获取选中的节点 delNode: 删除的节点(用来判断列表中的选中项是否被删除) 用来刷新列表及详情
        const getSelectedNode = (sn?: any) => {
            // if: 在树结构中操作后获取选中项 else: 在列表中操作后 选中项不变，但要更新列表及详情
            if (sn) {
                // setSelectedNode({ ...sn })
                setSelectedRow(undefined)
                setSearchCondition({
                    ...searchCondition,
                    keyword: '',
                    offset: 1,
                    ...handleSelectedNodeFromTree(sn as any),
                })
            } else {
                // 在列表中删除的情况或重命名时，选中项不变，但是要更新数据
                setSearchCondition({
                    ...searchCondition,
                })
                // 操作成功后，按照左侧树选中节点刷新列表+详情
                setSelectedRow(undefined)
                // setSelectedNode({ ...selectedNode })
            }
        }

        const renderEmpty = () => {
            return <Empty desc={__('暂无数据')} />
        }

        // 表格排序改变
        const handleTableChange = (sorter) => {
            if (sorter.column) {
                setTableSort({
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
                [sorter.columnKey]:
                    searchCondition.sort_by?.direction === SortDirection.ASC
                        ? 'descend'
                        : 'ascend',
            })

            return {
                key: searchCondition.sort_by?.fields?.[0],
                sort:
                    searchCondition.sort_by?.direction === SortDirection.ASC
                        ? SortDirection.DESC
                        : SortDirection.ASC,
            }
        }

        return (
            <div className={styles.selectBusinStandTable}>
                <div className={styles.leftBusinDomain}>
                    {/* <ArchitectureDirTree
                        getSelectedNode={getSelectedNode}
                        filterType={[
                            Architecture.ORGANIZATION,
                            Architecture.DEPARTMENT,
                        ].join()}
                        // placeholder={__('请输入组织架构名称')}
                        needUncategorized
                        unCategorizedKey="00000000-0000-0000-0000-000000000000"
                    /> */}
                    <MultiTypeSelectTree
                        enabledTreeTypes={[
                            TreeType.BArchitecture,
                            TreeType.Department,
                            TreeType.InformationSystem,
                        ]}
                        onSelectedNode={(menu) => {
                            getSelectedNode(menu)
                        }}
                    />
                </div>
                <div className={styles.rightTableWrapper}>
                    <Space size={8} className={styles.filterWrapper}>
                        <SearchInput
                            className={styles.nameInput}
                            placeholder={__('搜索业务标准表名称')}
                            width={280}
                            value={searchCondition.keyword}
                            onKeyChange={(val: string) =>
                                setSearchCondition({
                                    ...searchCondition,
                                    keyword: val,
                                    offset: 1,
                                })
                            }
                        />
                        {/* <SortBtn
                            contentNode={
                                <DropDownFilter
                                    menus={editedMenus}
                                    defaultMenu={editedDefaultMenu}
                                    menuChangeCb={handleMenuChange}
                                    changeMenu={selectedSort}
                                />
                            }
                        /> */}
                        <RefreshBtn
                            onClick={() =>
                                setSearchCondition({
                                    ...searchCondition,
                                    offset: 1,
                                })
                            }
                        />
                    </Space>
                    <div className={styles.tableContentWrap}>
                        {loading || tableProps?.dataSource === undefined ? (
                            <div className={styles.loader}>
                                <Loader />
                            </div>
                        ) : tableProps?.dataSource?.length ||
                          !!searchCondition.keyword ||
                          (!tableProps?.dataSource?.length &&
                              tableProps.pagination.current !== 1) ? (
                            <Table
                                rowKey="id"
                                rowSelection={{
                                    type: 'radio',
                                    ...rowSelection,
                                }}
                                columns={columns}
                                {...tableProps}
                                // dataSource={[
                                //     {
                                //         id: '1',
                                //         name: '1',
                                //         technical_name: '1',
                                //         subject: '1',
                                //         department: '1',
                                //         update_at: 1730797853925,
                                //     },
                                // ]}
                                scroll={{
                                    y: tableProps?.pagination?.total
                                        ? tableProps?.pagination?.total >
                                          initBusinFormSerachCondition?.limit
                                            ? `calc(100vh - 362px)`
                                            : `calc(100vh - 314px)`
                                        : undefined,
                                }}
                                pagination={{
                                    ...tableProps.pagination,
                                    current: searchCondition?.offset,
                                    pageSize: searchCondition?.limit,
                                    hideOnSinglePage:
                                        tableProps.pagination.total <=
                                        ListPageSizerOptions[
                                            ListType.WideList
                                        ][0],
                                    pageSizeOptions:
                                        ListPageSizerOptions[ListType.WideList],
                                    showQuickJumper: true,
                                    responsive: true,
                                    showLessItems: true,
                                    showSizeChanger: true,
                                    showTotal: (count) => {
                                        return `共 ${count} 条记录 第 ${
                                            searchCondition.offset
                                        }/${Math.ceil(
                                            count / searchCondition.limit,
                                        )} 页`
                                    },
                                }}
                                onChange={(newPagination, filters, sorter) => {
                                    const selectedMenu =
                                        handleTableChange(sorter)
                                    setSelectedSort(selectedMenu)
                                    setSearchCondition((prev: any) => ({
                                        ...prev,
                                        sort_by: {
                                            fields: [selectedMenu.key],
                                            direction: selectedMenu.sort,
                                        },
                                        offset: newPagination.current || 1,
                                        limit: newPagination.pageSize,
                                    }))
                                }}
                            />
                        ) : (
                            <div className={styles.emptyWrapper}>
                                {renderEmpty()}
                            </div>
                        )}
                    </div>
                </div>

                {/* {fields && ( */}
                <FieldTableView
                    visible={preFormVisible}
                    formId={clickedForm?.id}
                    items={fields || []}
                    isDrawio
                    model="view"
                    onClose={() => {
                        setPreFormVisible(false)
                        setFields([])
                    }}
                />
                {/* )} */}
            </div>
        )
    },
)

export default SelectBusinStandTable
