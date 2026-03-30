import { useState, useEffect, useMemo } from 'react'
import { Space, Table, Button, message } from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import moment from 'moment'
import { useAntdTable } from 'ahooks'
import { ExclamationCircleFilled } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import { AddOutlined } from '@/icons'
import { OperateType, menus, defaultMenu, titleTipsText } from './const'
import { BusinessDomainType } from '../BusinessDomain/const'
import { GlossaryIcon } from '../BusinessDomain/GlossaryIcons'
import dataEmpty from '@/assets/dataEmpty.svg'
import { SortBtn } from '../ToolbarComponents'
import SearchLayout from '@/components/SearchLayout'
import { Empty, Loader } from '@/ui'
import {
    SortDirection,
    getWhiteList,
    delWhiteList,
    formatError,
    getDataViewDatasouces,
} from '@/core'
import { databaseTypesEleData } from '@/core/dataSource'
import { searchFormData } from './helper'
import DropDownFilter from '../DropDownFilter'
import Details from './Details'
import Create from './Create'
import { TipsLabel } from '../BusinessTagAuthorization/helper'
import Confirm from '../Confirm'
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'

const SensitiveDataWhiteList = () => {
    const [searchCondition, setSearchCondition] = useState<any>({
        offset: 1,
        limit: 10,
        sort: 'updated_at',
        direction: SortDirection.DESC,
    })
    const [detailDialogOpen, setDetailDialogOpen] = useState(false)
    const [createOpen, setCreateOpen] = useState(false)
    const [searchIsExpansion, setSearchIsExpansion] = useState<boolean>(false)
    const [currentRow, setCurrentRow] = useState<any>({})
    const [formData, setFormData] = useState<any>([])
    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        form_view_name: null,
        created_at: null,
        updated_at: 'descend',
    })
    const [dataViewDetailsOpen, setDataViewDetailsOpen] =
        useState<boolean>(false)
    const [delVisible, setDelVisible] = useState<boolean>(false)
    const [delBtnLoading, setDelBtnLoading] = useState<boolean>(false)

    const hasSearchCondition = useMemo(() => {
        return !!(
            searchCondition.datasource_id ||
            searchCondition.keyword ||
            searchCondition.department_id ||
            searchCondition.subject_id
        )
    }, [searchCondition])

    useEffect(() => {
        getDataViewDatasouce()
    }, [])

    const getDataViewDatasouce = async () => {
        try {
            const res = await getDataViewDatasouces({
                limit: 1000,
                direction: 'desc',
                sort: 'updated_at',
            })
            setFormData(
                searchFormData.map((item) => {
                    const obj: any = { ...item }
                    if (obj.key === 'datasource_id') {
                        obj.itemProps.options = res?.entries
                            .filter((it) => it.last_scan)
                            .map((it) => {
                                const { Colored = undefined } = it.type
                                    ? databaseTypesEleData.dataBaseIcons[
                                          it.type
                                      ]
                                    : {}
                                return {
                                    ...it,
                                    icon: <Colored />,
                                }
                            })
                    }
                    return obj
                }),
            )
        } catch (err) {
            //
        }
    }

    const handleOperate = (op: OperateType, item: any) => {
        setCurrentRow(item)
        switch (op) {
            case OperateType.Details:
                setDetailDialogOpen(true)
                break
            case OperateType.View:
                setDataViewDetailsOpen(true)
                break
            case OperateType.Delete:
                setDelVisible(true)
                break
            case OperateType.Eidt:
                setCreateOpen(true)
                break
            default:
                break
        }
    }

    const columns: any = [
        {
            title: (
                <div>
                    <span>{__('策略应用对象')}</span>
                    <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                        {__('（库表）')}
                    </span>
                </div>
            ),
            dataIndex: 'form_view_name',
            key: 'form_view_name',
            width: 300,
            sorter: true,
            sortOrder: tableSort.form_view_name,
            render: (text, record) => {
                return (
                    <div className={styles.catlgBox}>
                        <div className={styles.catlgName}>
                            <div
                                onClick={() =>
                                    handleOperate(OperateType.View, record)
                                }
                                className={styles.ellipsis}
                                title={text}
                            >
                                {text}
                            </div>
                        </div>
                        <div
                            className={classnames(
                                styles.ellipsis,
                                styles.catlgCode,
                            )}
                            title={record.form_view_code}
                            style={{
                                color: 'rgba(0, 0, 0, 0.45)',
                                fontSize: '12px',
                            }}
                        >
                            {record.form_view_code}
                        </div>
                    </div>
                )
            },
            ellipsis: true,
        },
        {
            title: __('策略描述'),
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (text, record) => text || '--',
        },
        {
            title: __('库表所属主题'),
            dataIndex: 'subject_name',
            key: 'subject_name',
            ellipsis: true,
            render: (text) => text || '--',
            // render: (text, record) => {
            //     const map = [
            //         BusinessDomainType.subject_domain_group,
            //         BusinessDomainType.subject_domain,
            //         BusinessDomainType.business_object,
            //         BusinessDomainType.logic_entity,
            //     ]
            //     const level =
            //         (record?.subject_path_id?.split('/')?.length || 0) - 1
            //     return (
            //         <div
            //             className={styles.tableItem}
            //             title={
            //                 record.subject_path
            //                     ? `${__('主题域：')}${record.subject_path}`
            //                     : __('未分配')
            //             }
            //         >
            //             {text && (
            //                 <GlossaryIcon
            //                     width="14px"
            //                     type={map[level]}
            //                     fontSize="14px"
            //                     styles={{ marginRight: '4px' }}
            //                 />
            //             )}
            //             {text || '--'}
            //         </div>
            //     )
            // },
        },
        {
            title: __('库表所属部门'),
            dataIndex: 'department_name',
            key: 'department_name',
            ellipsis: true,
            render: (text) => text || '--',
            // render: (text, record) => (
            //     <div
            //         className={styles.tableItem}
            //         title={
            //             record.department_path ||
            //             record.department_name ||
            //             __('未分配')
            //         }
            //     >
            //         {record.department || '--'}
            //     </div>
            // ),
        },
        {
            title: __('策略创建时间'),
            dataIndex: 'created_at',
            key: 'created_at',
            sorter: true,
            sortOrder: tableSort.created_at,
            showSorterTooltip: false,
            ellipsis: true,
            render: (text) =>
                text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '--',
        },
        {
            title: __('策略更新时间'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            sorter: true,
            sortOrder: tableSort.updated_at,
            showSorterTooltip: false,
            ellipsis: true,
            render: (text) =>
                text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '--',
        },
        {
            title: __('操作'),
            key: 'action',
            fixed: 'right',
            width: 260,
            render: (_, record) => {
                const btnList = [
                    {
                        label: __('查看库表'),
                        status: OperateType.View,
                    },
                    {
                        label: __('策略详情'),
                        status: OperateType.Details,
                    },
                    {
                        label: __('编辑'),
                        status: OperateType.Eidt,
                    },
                    {
                        label: __('删除'),
                        status: OperateType.Delete,
                    },
                ]
                return (
                    <Space size={16}>
                        {btnList.map((item) => {
                            return (
                                <a
                                    key={item.status}
                                    onClick={() =>
                                        handleOperate(item.status, record)
                                    }
                                >
                                    {item.label}
                                </a>
                            )
                        })}
                    </Space>
                )
            },
        },
    ]

    const renderEmpty = () => {
        return <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
    }

    const getDatasource = async (params: any) => {
        try {
            const res = await getWhiteList(params)
            return {
                total: Math.abs(res.total_count),
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
        getDatasource,
        {
            defaultPageSize: 10,
            manual: true,
        },
    )
    const tableHeight = useMemo(() => {
        const { sort, direction, offset, limit, keyword, ...searchObj } =
            searchCondition || {}
        // 是否有筛选条件
        const hasSearchCond = Object.values(searchObj).some((item) => item)
        return hasSearchCond && searchIsExpansion
            ? `calc(100vh - 416px)`
            : undefined
    }, [searchCondition, searchIsExpansion])

    useEffect(() => {
        run(searchCondition)
    }, [searchCondition])

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition({
            ...searchCondition,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            offset: 1,
        })
        setSelectedSort(selectedMenu)
        onChangeMenuToTableSort(selectedMenu)
    }

    const onChangeMenuToTableSort = (selectedMenu) => {
        setTableSort({
            form_view_name: null,
            created_at: null,
            updated_at: null,
            [selectedMenu.key]:
                selectedMenu.sort === SortDirection.ASC ? 'ascend' : 'descend',
        })
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        const sorterKey = sorter.columnKey

        if (sorter.column) {
            setTableSort({
                created_at: null,
                updated_at: null,
                form_view_name: null,
                [sorterKey]: sorter.order || 'ascend',
            })
            return {
                key: sorterKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }

        setTableSort({
            created_at: null,
            updated_at: null,
            form_view_name: null,
            [sorterKey]:
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

    const handleDelete = async () => {
        try {
            setDelBtnLoading(true)
            if (!currentRow) return
            await delWhiteList(currentRow.id)
            setDelBtnLoading(false)
            message.success(__('删除成功'))
        } catch (e) {
            formatError(e)
        } finally {
            setDelBtnLoading(false)
            setDelVisible(false)
            run({ ...searchCondition, offset: 1 })
        }
    }

    return (
        <div className={styles['sensitive-wrapper']}>
            <div className={styles['sensitive-top']}>
                <div className={styles['sensitive-top-title']}>
                    <TipsLabel
                        label={
                            <span style={{ fontWeight: 550 }}>
                                {__('敏感数据白名单')}
                            </span>
                        }
                        maxWidth="1050px"
                        placement="bottomRight"
                        tips={
                            <div>
                                <div style={{ fontWeight: 550 }}>
                                    {__('敏感数据白名单')}
                                </div>
                                {titleTipsText.map((item, index) => (
                                    <div key={index}>{item}</div>
                                ))}
                            </div>
                        }
                    />
                </div>
                <SearchLayout
                    formData={formData}
                    onSearch={(queryData) => {
                        setSearchCondition({
                            ...searchCondition,
                            ...queryData,
                            offset: 1,
                        })
                    }}
                    getExpansionStatus={setSearchIsExpansion}
                    prefixNode={
                        <Button
                            type="primary"
                            onClick={() => {
                                setCreateOpen(true)
                                setCurrentRow({})
                            }}
                            icon={<AddOutlined />}
                        >
                            {__('新建白名单策略')}
                        </Button>
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
                />
            </div>
            {loading ? (
                <div className={styles.loader}>
                    <Loader />
                </div>
            ) : !loading &&
              !hasSearchCondition &&
              tableProps.dataSource.length === 0 ? (
                <div className={styles.emptyWrapper}>{renderEmpty()}</div>
            ) : (
                <Table
                    columns={columns}
                    {...tableProps}
                    rowKey="id"
                    rowClassName={styles.tableRow}
                    className={styles.table}
                    onChange={(currentPagination, filters, sorter) => {
                        const selectedMenu = handleTableChange(sorter)
                        setSelectedSort(selectedMenu)
                        setSearchCondition((prev) => ({
                            ...prev,
                            sort: selectedMenu.key,
                            direction: selectedMenu.sort,
                            offset: currentPagination.current,
                            limit: currentPagination.pageSize,
                        }))
                    }}
                    scroll={{
                        x: 1200,
                        y: tableHeight,
                    }}
                    pagination={{
                        ...tableProps.pagination,
                        showSizeChanger: false,
                        hideOnSinglePage: true,
                    }}
                    locale={{ emptyText: <Empty /> }}
                />
            )}
            {detailDialogOpen && (
                <Details
                    open={detailDialogOpen}
                    id={currentRow?.id || ''}
                    onClose={() => setDetailDialogOpen(false)}
                />
            )}
            {dataViewDetailsOpen && (
                <LogicViewDetail
                    open={dataViewDetailsOpen}
                    onClose={() => {
                        setDataViewDetailsOpen(false)
                    }}
                    id={currentRow?.form_view_id || ''}
                    // isIntroduced
                    isAudit
                />
            )}
            {/* 删除 */}
            <Confirm
                open={delVisible}
                title={__('确定要删除白名单策略吗？')}
                content={
                    <span style={{ color: 'rgb(0 0 0 / 65%)' }}>
                        {__(
                            '删除后，当前库表“${name}”的敏感信息将不再受特殊的数据保护，有权限的人员均可以查询相关信息',
                            { name: currentRow?.form_view_name },
                        )}
                    </span>
                }
                icon={
                    <ExclamationCircleFilled
                        style={{ color: '#FAAD14', fontSize: '22px' }}
                    />
                }
                onOk={handleDelete}
                onCancel={() => {
                    setDelVisible(false)
                }}
                width={410}
                okButtonProps={{ loading: delBtnLoading }}
            />
            {createOpen && (
                <Create
                    open={createOpen}
                    id={currentRow?.id || ''}
                    onClose={(flag) => {
                        if (flag) {
                            run({ ...searchCondition, offset: 1 })
                        }
                        setCreateOpen(false)
                    }}
                />
            )}
        </div>
    )
}

export default SensitiveDataWhiteList
