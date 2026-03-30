import { useEffect, useState } from 'react'
import { Button, Table, Tabs } from 'antd'
import __ from '../locale'
import styles from './styles.module.less'
import {
    AuditDataTypeLabel,
    AuditTabs,
    AuditTabType,
    AuditType,
    DefaultAppApplyAuditQuery,
} from '../const'
import { formatTime } from '@/utils'
import {
    formatError,
    getAppStatusAuditProcessList,
    getSSZDDemandAuditProcess,
    getSSZDReportAuditList,
    SortDirection,
} from '@/core'
import Auditing from './Auditing'
import AuditDetail from './AuditDetail'
import ViewDetail from '../ApplicationManage/ViewDetail'

interface ApplicationAuditProps {
    auditType: AuditType | string
}

export type SortOrder = 'descend' | 'ascend' | null

const ApplicationAudit = ({ auditType }: ApplicationAuditProps) => {
    // 初始化查询参数，使用默认搜索查询参数
    const [queryParams, setQueryParams] = useState<any>(
        DefaultAppApplyAuditQuery,
    )
    // 当前激活的标签
    const [activeTab, setActiveTab] = useState<AuditTabType>(
        AuditTabType.TO_AUDIT,
    )
    // 数据源
    const [dataSource, setDataSource] = useState<any[]>([])

    // 总条数
    const [totalCount, setTotalCount] = useState<number>(0)

    // 审核数据
    const [auditData, setAuditData] = useState<any>('')

    // 审核详情ID
    const [auditDetailId, setAuditDetailId] = useState<string>('')

    // 数据详情ID
    const [dataDetailId, setDataDetailId] = useState<string>('')

    const [applyTimeSort, setApplyTimeSort] = useState<'descend' | 'ascend'>(
        'descend',
    )
    useEffect(() => {
        getDataList()
    }, [queryParams, auditType])

    /**
     * 获取数据列表
     */
    const getDataList = () => {
        if (auditType === AuditType.APP_APPLY) {
            getApplyListData(queryParams)
        } else if (auditType === AuditType.APP_REPORT_ESCALATE) {
            getReportListData(queryParams)
        }
    }

    const columns = [
        {
            title: __('申请编号'),
            dataIndex: 'task_id',
            key: 'task_id',
            render: (text, record) => text,
            ellipsis: true,
        },
        {
            title: __('应用名称'),
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div className={styles.rawContainer}>
                    <span
                        className={styles.text}
                        title={text}
                        onClick={() => {
                            setDataDetailId(record.id)
                        }}
                    >
                        {text}
                    </span>
                </div>
            ),
            ellipsis: true,
        },
        {
            title: __('类型'),
            dataIndex: 'report_type',
            key: 'report_type',
            render: (text, record) => AuditDataTypeLabel?.[text] || '--',
            ellipsis: true,
            width: 120,
        },
        {
            title: __('申请人'),
            dataIndex: 'applyer',
            key: 'applyer',
            render: (text, record) => text || '--',
            ellipsis: true,
            width: 120,
        },
        {
            title: __('申请时间'),
            dataIndex: 'apply_time',
            key: 'apply_time',
            ellipsis: true,
            // sorter: true,
            // sortOrder: applyTimeSort,
            // showSorterTooltip: false,
            render: (text) => formatTime(text) || '--',
        },
        {
            title: '操作',
            key: 'action',
            width: 120,
            render: (text: string, record) =>
                activeTab === AuditTabType.TO_AUDIT ? (
                    <Button
                        type="link"
                        onClick={() => {
                            setAuditData(record)
                        }}
                    >
                        {__('审核')}
                    </Button>
                ) : (
                    <Button
                        type="link"
                        onClick={() => {
                            setAuditDetailId(record.task_id)
                        }}
                    >
                        {__('审核详情')}
                    </Button>
                ),
        },
    ]

    /**
     * 异步获取申请列表数据
     *
     * 此函数通过调用getAppsList来获取应用程序列表数据它尝试执行异步操作，
     * 如果成功，将解析出entries和total_count属性如果操作失败，将调用formatError处理错误
     *
     * @param {Object} params - 传递给getAppsList函数的参数对象
     */
    const getApplyListData = async (params) => {
        try {
            const { entries, total_count } = await getAppStatusAuditProcessList(
                {
                    ...params,
                    target: activeTab,
                },
            )
            setDataSource(entries)
            setTotalCount(total_count)
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 异步获取上报审核列表数据
     * @param params
     */
    const getReportListData = async (params) => {
        try {
            const { entries, total_count } = await getSSZDReportAuditList({
                ...params,
                target: activeTab,
            })
            setDataSource(entries)
            setTotalCount(total_count)
        } catch (err) {
            formatError(err)
        }
    }
    /**
     * 表格排序
     * @param pagination 分页
     * @param filters 过滤
     * @param sorter 排序
     */
    const handleTableChange = (pagination, filters, sorter) => {
        setQueryParams({
            ...queryParams,
            offset: pagination.current,
            direction:
                sorter.order === 'descend'
                    ? SortDirection.DESC
                    : SortDirection.ASC,
        })
        setApplyTimeSort(sorter.order === 'descend' ? 'descend' : 'ascend')
    }

    return (
        <div className={styles.auditContainer}>
            <Tabs
                activeKey={activeTab}
                onChange={(key) => {
                    setActiveTab(key as AuditTabType)
                    setQueryParams({
                        ...queryParams,
                        offset: 1,
                    })
                    // setDetailOpen(false)
                    // setDetailData(null)
                }}
                items={AuditTabs}
                style={{ padding: '0 24px' }}
            />
            <div className={styles.listWrapper}>
                <div className={styles.table}>
                    <Table
                        columns={columns}
                        dataSource={dataSource}
                        rowClassName={styles.tableRow}
                        onChange={handleTableChange}
                        pagination={{
                            current: queryParams?.offset,
                            pageSize: queryParams?.limit,
                            total: totalCount,
                            showTotal: (total) => __('共${total}条', { total }),
                            pageSizeOptions: [10, 20, 50, 100],
                            showSizeChanger: totalCount > 20,
                            showQuickJumper:
                                totalCount > (queryParams?.limit || 0) * 8,
                            hideOnSinglePage: totalCount <= 20,
                        }}
                    />
                </div>
            </div>
            {auditData && (
                <Auditing
                    auditData={auditData}
                    open={!!auditData}
                    auditType={auditType}
                    onClose={() => {
                        setAuditData(null)
                    }}
                    onUpdateList={getDataList}
                />
            )}
            {auditDetailId && (
                <AuditDetail
                    auditId={auditDetailId}
                    open={!!auditDetailId}
                    onClose={() => {
                        setAuditDetailId('')
                    }}
                />
            )}
            {dataDetailId && (
                <ViewDetail
                    appId={dataDetailId}
                    onClose={() => {
                        setDataDetailId('')
                    }}
                    open={!!dataDetailId}
                    dataVersion={
                        auditType === AuditType.APP_APPLY
                            ? activeTab === AuditTabType.TO_AUDIT
                                ? 'editing'
                                : 'published'
                            : activeTab === AuditTabType.TO_AUDIT
                            ? 'published'
                            : 'reported'
                    }
                />
            )}
        </div>
    )
}

export default ApplicationAudit
