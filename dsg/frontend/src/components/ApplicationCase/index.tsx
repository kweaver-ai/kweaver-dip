import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Button, message, Space, Table, Tooltip } from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import { useNavigate } from 'react-router-dom'
import { useAntdTable } from 'ahooks'
import { SyncOutlined } from '@ant-design/icons'
import { AddOutlined, FontIcon } from '@/icons'
import { OperateType } from '@/utils'
import ArchitectureDirTree from '../BusinessArchitecture/ArchitectureDirTree'
import { Architecture, DataNode } from '../BusinessArchitecture/const'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import {
    ISSZDOrganization,
    SortDirection,
    formatError,
    getCurUserDepartment,
    queryAppCaseList,
    AppCaseItem,
    delAppCaseById,
    delAudit,
    createSSZDSyncTask,
    SSZDSyncTaskEnum,
    getSSZDSyncTask,
} from '@/core'
import {
    Empty,
    LightweightSearch,
    Loader,
    OptionBarTool,
    OptionMenuType,
    SearchInput,
} from '@/ui'
import {
    AppCaseSource,
    allOprList,
    appFieldLabelList,
    caseStatusBtnList,
    caseStatusColorList,
    caseStatusList,
    caseStatusTextList,
    defaultMenu,
    menus,
    searchData,
} from './const'
import __ from './locale'
import styles from './styles.module.less'
import dataEmpty from '@/assets/dataEmpty.svg'
import { RefreshBtn, SortBtn } from '../ToolbarComponents'
import DropDownFilter from '../DropDownFilter'
import { FixedType } from '../CommonTable/const'
import { IQueryList } from '@/core/apis/applicationCase/index.d'
import DragBox from '../DragBox'
import Confirm from '../Confirm'
import ProvinceOrganTree from '../ProvincialOriganizationalStructure/ProvinceOrganTree'
import { IconType } from '@/icons/const'

export interface ISearchCondition {
    id: string
    type?: string
    keyword?: string
    offset?: number
    limit?: number
    direction?: SortDirection
    sort?: string
    name?: string
}

const ApplicationCase = () => {
    // 是否是应用实例上报
    const isReport = window.location.pathname.includes('report')
    const navigate = useNavigate()
    const ref: any = useRef()
    const lightweightSearchRef: any = useRef()

    const [defaultSize, setDefaultSize] = useState<Array<number>>([12, 88])
    const [selectedNode, setSelectedNode] = useState<DataNode>({
        name: '全部',
        id: '',
        path: '',
        type: Architecture.ALL,
    })
    const [searchCondition, setSearchCondition] = useState<IQueryList>({
        source: AppCaseSource.LOCAL,
        department_id: selectedNode.id,
        status: undefined,
        name: '',
        offset: 1,
        limit: 10,
    })
    const [isSyncing, setIsSyncing] = useState(false)

    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        createAt: 'descend',
    })

    // 查询form参数
    const [searchFormData, setSearchFormData] = useState<any[]>([
        // {
        //     label: __('状态'),
        //     key: 'status',
        //     options: [
        //         { value: '', label: '不限' },
        //         ...caseStatusList.map((item) => {
        //             return {
        //                 value: item.key,
        //                 label: item.value,
        //             }
        //         }),
        //     ],
        //     type: SearchType.Radio,
        //     isAlone: true,
        // },
        {
            label: __('状态'),
            key: 'status',
            type: SearchType.Select,
            // defaultValue: '',
            itemProps: {
                options: [
                    { value: '', label: '不限' },
                    ...caseStatusList.map((item) => {
                        return {
                            value: item.key,
                            label: item.value,
                        }
                    }),
                ],
            },
            clearKey: 'status',
            isAlone: true,
        },
    ])

    const [selectedRow, setSelectedRow] = useState<DataNode>()

    const [defaultValue, setDefaultValue] = useState<any>({
        is_all: true,
        type: '',
    })
    // 当前用户部门
    const [currentDepart, setCurrentDepart] = useState<any>()

    const [cancelItem, setCancelItem] = useState<AppCaseItem>()
    const [delItem, setDelItem] = useState<AppCaseItem>()
    const [offItem, setOffItem] = useState<AppCaseItem>()
    const [syncTime, setSyncTime] = useState(0)

    const CreateSyncTask = async () => {
        try {
            await createSSZDSyncTask(SSZDSyncTaskEnum.Example)
            setIsSyncing(true)
        } catch (error) {
            formatError(error)
        }
    }

    const getSyncTask = async () => {
        try {
            const res = await getSSZDSyncTask(SSZDSyncTaskEnum.Example)
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
        if (isReport) {
            getCurDepartment()
        }
        setSearchCondition({
            ...searchCondition,
            source: isReport ? AppCaseSource.LOCAL : AppCaseSource.PROVINCE,
        })
    }, [isReport])

    const columns: any = [
        {
            title: __('应用案例名称'),
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: __('应用案例提供方'),
            dataIndex: 'department_path',
            key: 'department_path',
            ellipsis: true,
        },
        {
            title: __('当前状态'),
            dataIndex: 'status',
            ellipsis: true,
            key: 'status',
            render: (status, record: AppCaseItem) => (
                <>
                    <Badge
                        color={caseStatusColorList[status]}
                        text={caseStatusTextList[status]}
                    />
                    {record.audit_rejection && (
                        <Tooltip title={record.audit_rejection}>
                            <FontIcon
                                name="icon-shenheyijian"
                                type={IconType.COLOREDICON}
                                style={{ marginLeft: 4 }}
                            />
                        </Tooltip>
                    )}
                </>
            ),
            width: 160,
        },
        {
            title: __('所属领域'),
            dataIndex: 'field_type',
            key: 'field_type',
            ellipsis: true,
            render: (field) => appFieldLabelList[field] || '--',
        },
        {
            title: __('其他所属领域'),
            dataIndex: 'field_description',
            key: 'field_description',
            ellipsis: true,
        },
        {
            title: __('应用案例描述'),
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (text) => text || '--',
        },
        {
            title: __('创建时间'),
            dataIndex: 'creation_timestamp',
            key: 'creation_timestamp',
            sorter: true,
            sortOrder: tableSort.createAt,
            showSorterTooltip: false,
            ellipsis: true,
            width: 220,
        },
        {
            title: __('操作'),
            key: 'action',
            width: 160,
            fixed: FixedType.RIGHT,
            render: (text: string, record) => {
                // 应用案例上报相关操作-详情、撤销上报、重新上报、下架、删除，省级应用案例操作-详情
                const oprList = isReport
                    ? caseStatusBtnList[record?.status]
                    : [OperateType.DETAIL]
                const buttonMenus = oprList.map((opr) => ({
                    key: opr,
                    label: allOprList[opr],
                    menuType: OptionMenuType.Menu,
                }))
                return (
                    <OptionBarTool
                        menus={buttonMenus}
                        onClick={(key, e) => {
                            handleOperate(key as OperateType, record.id, record)
                        }}
                        getPopupContainer={(node) => node}
                    />
                )
            },
        },
    ]

    // 获取当前用户所属部门
    const getCurDepartment = async () => {
        try {
            const res = await getCurUserDepartment()
            // 当前树能根据id匹配到部门，根据id显示部门，不能匹配到，显示部门名称
            if (res?.length === 1) {
                const [dept] = res
                setCurrentDepart(dept)
            }
        } catch (error) {
            formatError(error)
        }
    }

    // 获取选中的节点 delNode: 删除的节点(用来判断列表中的选中项是否被删除) 用来刷新列表及详情
    const getSelectedNode = (sn?: DataNode, delNode?: DataNode) => {
        // if: 在树结构中操作后获取选中项 else: 在列表中操作后 选中项不变，但要更新列表及详情
        if (sn) {
            setSelectedNode({ ...sn })
            setSelectedRow(undefined)
            setSearchCondition({
                ...searchCondition,
                name: '',
                status: undefined,
                department_id:
                    sn.id.endsWith('SC') || sn.id.endsWith('MC')
                        ? sn.id.substring(0, sn.id.length - 3)
                        : sn.id,
                offset: 1,
            })
            lightweightSearchRef.offset?.reset()
        } else {
            // 在列表中删除的情况或重命名时，选中项不变，但是要更新数据
            setSearchCondition({
                ...searchCondition,
            })
            // 操作成功后，按照左侧树选中节点刷新列表+详情
            setSelectedRow(undefined)
            setSelectedNode({ ...selectedNode })
        }
    }

    const getProvinceSelectedNode = (code: string) => {
        setSearchCondition({
            ...searchCondition,
            department_id: code,
        })
    }

    // 操作处理
    const handleOperate = async (
        type: OperateType,
        id?: string,
        record?: any,
    ) => {
        if (type === OperateType.CREATE) {
            navigate(`/applicationCase/edit`)
        }
        if (type === OperateType.RESUBMIT) {
            navigate(`/applicationCase/edit?id=${id}`)
        }
        if (type === OperateType.DETAIL) {
            navigate(
                `/applicationCase/detail?id=${record.id}&isLocal=${isReport}`,
            )
        }
        if (type === OperateType.UNDOSUBMIT) {
            setCancelItem(record)
        }
        if (type === OperateType.DELETE) {
            setDelItem(record)
        }

        if (type === OperateType.OFFLINE) {
            setOffItem(record)
        }
    }

    const searchChange = (data, key) => {
        // handleStatusChange(data[key])
        setSearchCondition({
            ...searchCondition,
            [key]: data[key],
        })
    }

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
        switch (selectedMenu.key) {
            case 'creation_timestamp':
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
            case 'update_time':
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

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            if (sorter.columnKey === 'creation_timestamp') {
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
                    sorter.columnKey === 'service_name'
                        ? 'name'
                        : sorter.columnKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }
        if (searchCondition.sort === 'creation_timestamp') {
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

    const getCaseList = async (params: any) => {
        const {
            current: offset,
            limit,
            name,
            sort,
            direction,
            status,
            department_id,
        } = params

        try {
            const res = await queryAppCaseList({
                offset,
                limit,
                sort,
                direction,
                name,
                status,
                department_id,
            })

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

    const { tableProps, run, pagination, loading } = useAntdTable(getCaseList, {
        defaultPageSize: 10,
        manual: true,
    })

    useEffect(() => {
        run(searchCondition)
    }, [searchCondition])

    // 撤销上报
    const handleCancel = async () => {
        try {
            await delAudit(cancelItem!.id)
            setCancelItem(undefined)
            message.success(__('撤销成功'))
        } catch (error) {
            formatError(error)
        }
    }

    // 删除应用案例
    const handleDel = async () => {
        try {
            await delAppCaseById(delItem!.id, AppCaseSource.LOCAL)
            setDelItem(undefined)
            message.success(__('删除成功'))
        } catch (error) {
            formatError(error)
        }
    }

    // 下架应用案例
    const handleOff = async () => {
        try {
            await delAppCaseById(offItem!.id, AppCaseSource.PROVINCE)
            setOffItem(undefined)
            message.success(__('下架成功'))
        } catch (error) {
            formatError(error)
        }
        setOffItem(undefined)
    }

    return (
        <div className={styles.applicationCaseWrapper}>
            <DragBox
                defaultSize={defaultSize}
                minSize={[220, 270]}
                maxSize={[800, Infinity]}
                onDragEnd={(size) => {
                    setDefaultSize(size)
                }}
            >
                <div className={styles.leftWrapper}>
                    {isReport ? (
                        <ArchitectureDirTree
                            getSelectedNode={getSelectedNode}
                            ref={ref}
                            // isShowOperate
                            // initParams={{
                            //     id: currentDepart?.id || '',
                            // }}
                            filterType={[
                                Architecture.ORGANIZATION,
                                Architecture.DEPARTMENT,
                            ].join()}
                        />
                    ) : (
                        <ProvinceOrganTree
                            getSelectedNode={getProvinceSelectedNode}
                        />
                    )}
                </div>
                <div className={styles.rightWrapper}>
                    <div className={styles.caseTitle}>
                        {isReport ? __('应用案例上报') : __('省级应用案例')}
                    </div>
                    <div className={styles.oprWrapper}>
                        <div className={styles.btnWrapper}>
                            {isReport ? (
                                <Button
                                    key={OperateType.CREATE}
                                    type="primary"
                                    className={styles.operateBtn}
                                    onClick={() =>
                                        handleOperate(OperateType.CREATE)
                                    }
                                >
                                    <AddOutlined />
                                    <span className={styles.operateText}>
                                        {__('新建')}
                                    </span>
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        className={styles.operateBtn}
                                        disabled={isSyncing}
                                        onClick={() => CreateSyncTask()}
                                        icon={<SyncOutlined spin={isSyncing} />}
                                    >
                                        <span className={styles.operateText}>
                                            {__('数据同步')}
                                        </span>
                                    </Button>
                                    <div className={styles.synchTime}>
                                        {__('数据同步时间：${text}', {
                                            text: syncTime,
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        <Space size={8} className={styles.filterWrapper}>
                            <SearchInput
                                className={styles.nameInput}
                                placeholder={__('搜索应用案例名称')}
                                width={280}
                                value={searchCondition.name}
                                onKeyChange={(val: string) =>
                                    setSearchCondition({
                                        ...searchCondition,
                                        name: val,
                                    })
                                }
                            />
                            {isReport && (
                                <LightweightSearch
                                    formData={searchData}
                                    onChange={(data, key) =>
                                        searchChange(data, key)
                                    }
                                    defaultValue={{ status: '' }}
                                />
                            )}
                            <Space size={0}>
                                <div className={styles.sortBtn}>
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
                                </div>
                                <div className={styles.refreshBtn}>
                                    <RefreshBtn
                                        onClick={() =>
                                            setSearchCondition({
                                                ...searchCondition,
                                                offset: 1,
                                            })
                                        }
                                    />
                                </div>
                            </Space>
                        </Space>
                    </div>
                    {loading ? (
                        <div className={styles.loader}>
                            <Loader />
                        </div>
                    ) : (
                        <Table
                            columns={columns}
                            {...tableProps}
                            rowKey="id"
                            rowClassName={styles.tableRow}
                            onChange={(currentPagination, filters, sorter) => {
                                if (
                                    currentPagination.current ===
                                    searchCondition.offset
                                ) {
                                    const selectedMenu =
                                        handleTableChange(sorter)
                                    setSelectedSort(selectedMenu)
                                    setSearchCondition({
                                        ...searchCondition,
                                        sort: selectedMenu.key,
                                        direction: selectedMenu.sort,
                                        offset: 1,
                                    })
                                } else {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: currentPagination?.current || 1,
                                    })
                                }
                            }}
                            scroll={{
                                x: 1200,
                                y:
                                    tableProps.dataSource.length === 0
                                        ? undefined
                                        : `calc(100vh - 278px)`,
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
            </DragBox>
            <Confirm
                title={__('确定要撤销上报${name}应用案例吗', {
                    name: cancelItem?.name,
                })}
                content={__('撤销上报无须经过审核，请确认')}
                open={!!cancelItem}
                onOk={handleCancel}
                onCancel={() => setCancelItem(undefined)}
            />
            <Confirm
                title={__('确定要删除${name}应用案例吗', {
                    name: delItem?.name,
                })}
                content={__('确定删除后，应用案例将不被保留。')}
                open={!!delItem}
                onOk={handleDel}
                onCancel={() => setDelItem(undefined)}
            />
            <Confirm
                title={__('确定要下架${name}应用案例吗', {
                    name: offItem?.name,
                })}
                content={__('下架审核通过后，该应用案例将从省平台下架。')}
                open={!!offItem}
                onOk={handleOff}
                onCancel={() => setOffItem(undefined)}
            />
        </div>
    )
}

export default ApplicationCase
