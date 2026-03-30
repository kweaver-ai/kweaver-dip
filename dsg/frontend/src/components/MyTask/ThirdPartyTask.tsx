import { CloseCircleFilled } from '@ant-design/icons'
import { useDebounceFn } from 'ahooks'
import { Pagination, Popover, Space, Table } from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import { trim } from 'lodash'
import { memo, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import { formatError, SortDirection } from '@/core'
import { getFrontWorkOrderTasks } from '@/core/apis/taskCenter'
import { WorkOrderStatus } from '@/core/apis/taskCenter/index.d'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { LightweightSearch, SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import dataEmpty from '../../assets/dataEmpty.svg'
import DropDownFilter from '../DropDownFilter'
import {
    getOptionState,
    orderTaskStatusList,
    OrderType,
} from '../WorkOrder/helper'
import { SortType, ThirdPartyMenus } from './const'
import {
    getDepartName,
    getTaskTabs,
    SearchFilter,
    ThirdPartyTabs,
} from './helper'
import __ from './locale'
import styles from './styles.module.less'
import DetailModal from '../WorkOrder/WorkOrderManage/DetailModal'

/** 第三方任务 */
function ThirdPartyTask() {
    // load显示,【true】显示,【false】隐藏
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)
    // 路径参数
    const [searchParams] = useSearchParams()
    const navigator = useNavigate()

    // 我的任务分类
    const [taskType, setTaskType] = useState<string>(OrderType.AGGREGATION)

    // 工单详情
    const [workOrderVisible, setWorkOrderVisible] = useState<boolean>(false)
    const [currentOrder, setCurrentOrder] = useState<any>(null)

    // 筛选菜单值
    const [menuValue, setMenuValue] = useState<any>(ThirdPartyMenus[0])

    // 搜索关键字
    const [searchKey, setSearchKey] = useState('')

    // 修改表头排序
    const [updateSortOrder, setUpdateSortOrder] = useState<SortOrder>(null)
    // 任务集
    const [taskItems, setTaskItems] = useState<any[]>([])
    // 排序params
    const [sortDire, setSortDire] = useState<any>({
        direction: ThirdPartyMenus[0]?.sort,
        sort: ThirdPartyMenus[0]?.key,
    })
    // 初始params
    const initialQueryParams = {
        offset: 1,
        limit: 10,
        keyword: '',
    }
    // 查询params
    const [queryParams, setQueryParams] = useState<any>(initialQueryParams)

    useEffect(() => {
        setLoading(true)
        getTableData(
            {
                ...initialQueryParams,
            },
            OrderType.AGGREGATION,
        )
    }, [])

    // 获取表格数据
    const getTableData = async (params, work_order_type = taskType) => {
        setFetching(true)
        try {
            const res = await getFrontWorkOrderTasks({
                ...params,
                work_order_type,
            })
            setQueryParams(params)
            setTaskItems(res.entries)
        } catch (e) {
            formatError(e)
            setTaskItems([])
        } finally {
            setLoading(false)
            setFetching(false)
            setMenuValue(undefined)
        }
    }
    // 切换任务分栏
    const changeTaskDivided = (type) => {
        setSearchKey('')

        setUpdateSortOrder(null)
        setMenuValue(ThirdPartyMenus[0])
        setLoading(true)
        getTableData(
            {
                // ...initialQueryParams,
                ...queryParams,
            },
            type,
        )

        setTaskType(type)
    }

    // 搜索的防抖
    const { run } = useDebounceFn(getTableData, {
        wait: 400,
        leading: false,
        trailing: true,
    })

    // 搜索框enter
    const handleSearchPressEnter = (e: any) => {
        const keyword = typeof e === 'string' ? e : trim(e.target.value)
        setSearchKey(keyword)
        run({
            ...queryParams,
            keyword,
            offset: 1,
        })
    }

    // 表格项
    const columns: any = [
        {
            title: __('任务名称'),
            dataIndex: 'name',
            key: 'name',
            fixed: 'left',
            ellipsis: true,
            render: (_, record: any) => (
                <div className={styles.nameWrapper}>
                    <div
                        className={classnames(
                            styles.topInfo,
                            styles.titleUnline,
                        )}
                        title={record.name}
                        onClick={() => {
                            if (record?.link) {
                                window.open(
                                    record?.link,
                                    '_blank',
                                    'noopener,noreferrer',
                                )
                            }
                        }}
                    >
                        {record.name || '--'}
                    </div>
                </div>
            ),
        },
        {
            title: __('状态'),
            dataIndex: 'status',
            key: 'status',
            ellipsis: true,
            width: 140,
            render: (taskStatus, record) => {
                return (
                    <>
                        {getOptionState(taskStatus, orderTaskStatusList)}
                        {taskStatus === WorkOrderStatus.Failed && (
                            <Popover
                                placement="bottomLeft"
                                arrowPointAtCenter
                                overlayClassName={styles.PopBox}
                                content={
                                    <div className={styles.PopTip}>
                                        <div>
                                            <span className={styles.popTipIcon}>
                                                <CloseCircleFilled />
                                            </span>
                                            {__('异常原因')}
                                        </div>
                                        <div
                                            style={{
                                                wordBreak: 'break-all',
                                            }}
                                        >
                                            {record?.reason}
                                        </div>
                                    </div>
                                }
                            >
                                <FontIcon
                                    name="icon-xinxitishi"
                                    type={IconType.FONTICON}
                                    style={{
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        marginLeft: '4px',
                                        color: '#F5222D',
                                    }}
                                />
                            </Popover>
                        )}
                    </>
                )
            },
        },
        {
            title: __('所属部门'),
            dataIndex: 'data_aggregation',
            key: 'aggregation_department',
            ellipsis: true,
            render: (value: any) => {
                const paths = (value || [])
                    .map((item) => getDepartName(item?.department?.path))
                    ?.join(',')
                return (
                    <div className={styles.topInfo} title={paths}>
                        {paths || '--'}
                    </div>
                )
            },
        },
        {
            title: '目标表名称',
            dataIndex: 'data_aggregation',
            key: 'aggregation_target_table',
            ellipsis: true,
            render: (value: any) => {
                const names = (value || [])
                    .map((item) => item?.table_name)
                    ?.join(',')
                return (
                    <div className={styles.topInfo} title={names}>
                        {names || '--'}
                    </div>
                )
            },
        },
        {
            title: '归集数据量',
            dataIndex: 'data_aggregation',
            key: 'aggregation_count',
            ellipsis: true,
            render: (value: any) => {
                const count = (value || []).reduce(
                    (acc, item) => acc + (item?.count ?? 0),
                    0,
                )
                return <div className={styles.topInfo}>{count || '--'}</div>
            },
        },

        {
            title: __('数据表'),
            dataIndex: 'data_quality_audit',
            key: 'quality_data_table',
            ellipsis: true,
            render: (value: any) => {
                const names = (value || [])
                    .map((item) => item?.data_table)
                    ?.join(',')
                return <div className={styles.topInfo}>{names || '--'}</div>
            },
        },
        {
            title: __('检测方案'),
            dataIndex: 'data_quality_audit',
            key: 'quality_detection_scheme',
            ellipsis: true,
            render: (value: any) => {
                const names = (value || [])
                    .map((item) => item?.detection_scheme)
                    ?.join(',')
                return (
                    <div className={styles.topInfo} title={names}>
                        {names || '--'}
                    </div>
                )
            },
        },
        {
            title: __('完成次数'),
            dataIndex: 'data_quality_audit',
            key: 'quality_finished_count',
            ellipsis: true,
            render: (value: any) => {
                const count = (value || []).reduce(
                    (acc, item) => acc + (item?.finished_count ?? 0),
                    0,
                )
                return <div className={styles.topInfo}>{count || 0}</div>
            },
        },

        {
            title: __('检测数据表'),
            dataIndex: 'data_standardization',
            key: 'standardization_data_table',
            ellipsis: true,
            render: (value: any) => {
                const names = (value || [])
                    .map((item) => item?.data_table)
                    ?.join(',')
                return (
                    <div className={styles.topInfo} title={names}>
                        {names || '--'}
                    </div>
                )
            },
        },
        {
            title: __('检测方案'),
            dataIndex: 'data_standardization',
            key: 'standardization_detection_scheme',
            ellipsis: true,
            render: (value: any) => {
                const names = (value || [])
                    .map((item) => item?.detection_scheme)
                    ?.join(',')
                return (
                    <div className={styles.topInfo} title={names}>
                        {names || '--'}
                    </div>
                )
            },
        },

        {
            title: __('数据源'),
            dataIndex: 'data_fusion',
            key: 'fusion_datasource_name',
            ellipsis: true,
            render: (value: any) => {
                const { datasource_name } = value || {}
                return (
                    <div className={styles.topInfo}>
                        {datasource_name || '--'}
                    </div>
                )
            },
        },
        {
            title: __('融合目标表'),
            dataIndex: 'data_fusion',
            key: 'fusion_data_table',
            ellipsis: true,
            render: (value: any) => {
                const { data_table } = value || {}
                return (
                    <div className={styles.topInfo}>{data_table || '--'}</div>
                )
            },
        },
        {
            title: '关联工单',
            dataIndex: 'work_order',
            key: 'work_order',
            ellipsis: true,
            render: (text, record) =>
                record?.work_order?.name ? (
                    <div className={styles.nameWrapper}>
                        <div
                            className={classnames(
                                styles.topInfo,
                                styles.titleUnline,
                            )}
                            title={record?.work_order?.name}
                            onClick={() => {
                                if (record?.work_order?.id) {
                                    setWorkOrderVisible(true)
                                    setCurrentOrder(record?.work_order)
                                }
                            }}
                        >
                            {record?.work_order?.name}
                        </div>
                    </div>
                ) : (
                    '--'
                ),
        },
    ]

    const currentColumns = useMemo(() => {
        const keys = {
            [OrderType.AGGREGATION]: [
                'name',
                'status',
                'aggregation_department',
                'aggregation_target_table',
                'aggregation_count',
                'work_order',
            ],
            [OrderType.QUALITY_EXAMINE]: [
                'name',
                'status',
                'quality_data_table',
                'quality_detection_scheme',
                'quality_finished_count',
                'work_order',
            ],
            [OrderType.STANDARD]: [
                'name',
                'status',
                'standardization_data_table',
                'standardization_detection_scheme',
                'work_order',
            ],
            [OrderType.FUNSION]: [
                'name',
                'status',
                'fusion_datasource_name',
                'fusion_data_table',
                'work_order',
            ],
        }

        return columns.filter((item) => keys[taskType].includes(item.key))
    }, [taskType, columns])

    // 空库表
    const showEmpty = () => {
        const desc = (
            <div style={{ height: 44 }}>
                <div>{__('暂无数据')}</div>
            </div>
        )

        return <Empty desc={desc} iconSrc={dataEmpty} />
    }

    // 排序方式改变
    const handleSortWayChange = (selectedMenu) => {
        const { key, sort } = selectedMenu
        // 默认排序不需要sort,direction
        if (key === SortType.DEFAULT) {
            setUpdateSortOrder(null)
            delete queryParams?.sort
            delete queryParams?.direction
            getTableData({
                ...queryParams,
                offset: 1,
            })
            return
        }
        setUpdateSortOrder(sort === SortDirection.DESC ? 'descend' : 'ascend')
        getTableData({
            ...queryParams,
            sort: key,
            direction: sort,
            offset: 1,
        })
    }

    return (
        <div className={styles.myTaskWrapper}>
            <div className={styles.mt_rightWrapper}>
                <div className={styles.topWrapper}>
                    <div className={styles.tlWrapper}>
                        <div>
                            {getTaskTabs({
                                activeKey: taskType,
                                onCheck: (key) => changeTaskDivided(key),
                                tabItems: ThirdPartyTabs,
                            })}
                        </div>
                    </div>
                    <div
                        className={styles.selectedWrapper}
                        // hidden={!showSearch}
                    >
                        <Space size={12}>
                            <SearchInput
                                placeholder={__('搜索任务名称')}
                                value={searchKey}
                                onKeyChange={(kw: string) =>
                                    handleSearchPressEnter(kw)
                                }
                                onPressEnter={(e) => handleSearchPressEnter(e)}
                                style={{ width: 272 }}
                                maxLength={32}
                            />
                            <LightweightSearch
                                formData={SearchFilter}
                                onChange={(data, key) => {
                                    if (key === 'status') {
                                        getTableData({
                                            ...queryParams,
                                            offset: 1,
                                            status: data.status || undefined,
                                        })
                                    } else {
                                        getTableData({
                                            ...queryParams,
                                            offset: 1,
                                            status: undefined,
                                        })
                                    }
                                }}
                                defaultValue={{
                                    status: undefined,
                                }}
                            />
                            <Space size={0}>
                                <SortBtn
                                    contentNode={
                                        <DropDownFilter
                                            menus={ThirdPartyMenus}
                                            defaultMenu={
                                                menuValue || ThirdPartyMenus[0]
                                            }
                                            changeMenu={menuValue}
                                            menuChangeCb={handleSortWayChange}
                                            overlayStyle={{ minWidth: 128 }}
                                        />
                                    }
                                />
                                <RefreshBtn
                                    onClick={() => getTableData(queryParams)}
                                />
                            </Space>
                        </Space>
                    </div>
                </div>
                <div className={styles.empty} hidden={!loading}>
                    <Loader />
                </div>
                <div
                    className={styles.empty}
                    hidden={loading || taskItems?.length !== 0}
                >
                    {showEmpty()}
                </div>
                <div
                    className={styles.tableWrapper}
                    hidden={loading || taskItems?.length === 0}
                >
                    <Table
                        columns={currentColumns}
                        dataSource={taskItems}
                        loading={fetching}
                        rowClassName={styles.tableRow}
                        pagination={false}
                        scroll={{
                            x: 1280,
                            y: 'calc(100vh - 208px)',
                        }}
                        locale={{
                            emptyText: <Empty />,
                        }}
                        rowKey="id"
                    />
                    <Pagination
                        current={queryParams.offset}
                        pageSize={queryParams.limit}
                        onChange={(page) => {
                            getTableData({
                                ...queryParams,
                                offset: page,
                            })
                        }}
                        className={styles.pagination}
                        // total={tsCount?.total_count || 0}
                        showSizeChanger={false}
                        hideOnSinglePage
                    />
                </div>
                {workOrderVisible && (
                    <DetailModal
                        id={currentOrder?.id}
                        type={taskType}
                        onClose={() => {
                            setWorkOrderVisible(false)
                            setCurrentOrder(null)
                        }}
                    />
                )}
            </div>
        </div>
    )
}

export default memo(ThirdPartyTask)
