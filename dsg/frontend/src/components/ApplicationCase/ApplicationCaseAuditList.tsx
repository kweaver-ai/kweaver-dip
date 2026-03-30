import { Radio, Space, Table, Tabs } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useAntdTable } from 'ahooks'
import __ from './locale'
import styles from './styles.module.less'
import { formatTime } from '@/utils'
import dataEmpty from '@/assets/dataEmpty.svg'
import {
    AppCaseAuditStatus,
    AuditResultStatusEnum,
    AuditResultStatusMap,
} from './const'
import { Empty, Loader } from '@/ui'
import {
    formatError,
    getSSZDAppCaseAuditList,
    IAppCaseAuditItem,
    IAppCaseAuditType,
} from '@/core'
import AuditStatus from './AuditStatus'
import Audit from './Audit'
import AuditDetails from './AuditDetails'

const ApplicationCaseAudit = () => {
    const [searchCondition, setSearchCondition] = useState({
        type: IAppCaseAuditType.All,
        statuses: AppCaseAuditStatus.Pending,
        offset: 1,
        limit: 10,
    })
    const [auditOpen, setAuditOpen] = useState(false)
    const [auditDetailsOpen, setAuditDetailsOpen] = useState(false)
    const [auditAppCaseInfo, setAuditAppCaseInfo] =
        useState<IAppCaseAuditItem>()

    const columns: any = useMemo(() => {
        const cols = [
            {
                title: __('应用案例名称'),
                dataIndex: 'name',
                key: 'name',
                width: 260,
                ellipsis: true,
                render: (val, record: IAppCaseAuditItem) =>
                    record.application_example.name,
            },
            {
                title: __('应用案例提供方'),
                dataIndex: 'department_name',
                key: 'department_name',
                ellipsis: true,
                render: (val, record: IAppCaseAuditItem) =>
                    record.application_example.department_name,
            },
            {
                title: __('审核类型'),
                dataIndex: 'type',
                key: 'type',
                render: (type, record: IAppCaseAuditItem) =>
                    record.type === IAppCaseAuditType.Report
                        ? __('应用案例上报审核')
                        : __('应用案例下架审核'),
            },
            {
                title: __('审核状态'),
                dataIndex: 'audit_status',
                key: 'audit_status',
                render: (status) => (
                    <AuditStatus
                        status={AuditResultStatusEnum.Passed}
                        AuditResultStatusMap={AuditResultStatusMap}
                    />
                ),
            },
            {
                title: __('所属领域'),
                dataIndex: 'field',
                key: 'field',
                render: (val, record: IAppCaseAuditItem) =>
                    // appFieldLabelList[record.application_example.field_type],
                    record.application_example.field_type,
            },
            {
                title: __('其他所属领域'),
                dataIndex: 'field_description',
                key: 'field_description',
                render: (val, record: IAppCaseAuditItem) =>
                    record.application_example.field_description,
            },
            {
                title: __('应用案例描述'),
                dataIndex: 'description',
                key: 'description',
                ellipsis: true,
                render: (val, record: IAppCaseAuditItem) =>
                    record.application_example.description,
            },
            {
                title: __('创建时间'),
                dataIndex: 'create_time',
                key: 'create_time',
                width: 200,
                render: (val: number, record: IAppCaseAuditItem) =>
                    formatTime(record.application_example.creation_timestamp),
            },
            {
                title: __('操作'),
                key: 'action',
                width: 240,
                fixed: 'right',
                render: (_, record) => (
                    <a
                        onClick={() => {
                            if (
                                searchCondition.statuses ===
                                AppCaseAuditStatus.Pending
                            ) {
                                setAuditOpen(true)
                            } else {
                                setAuditDetailsOpen(true)
                            }
                            setAuditAppCaseInfo(record)
                        }}
                    >
                        {searchCondition.statuses === AppCaseAuditStatus.Pending
                            ? __('审核')
                            : __('详情')}
                    </a>
                ),
            },
        ]

        return searchCondition.statuses === AppCaseAuditStatus.Pending
            ? cols.filter((col) => col.key !== 'status')
            : cols
    }, [searchCondition.statuses])

    const renderEmpty = () => {
        return <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
    }

    const getAppCaseAuditList = async (params: any) => {
        try {
            const res = await getSSZDAppCaseAuditList(params)

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
        }
    }

    const { tableProps, run, pagination, loading } = useAntdTable(
        getAppCaseAuditList,
        {
            defaultPageSize: 10,
            manual: true,
        },
    )

    useEffect(() => {
        run(searchCondition)
    }, [searchCondition])

    return (
        <div className={styles['application-case-audit']}>
            <div className={styles['application-case-audit-title']}>
                {__('应用案例审核')}
            </div>
            <Tabs
                activeKey={searchCondition.statuses}
                onChange={(key) => {
                    setSearchCondition({
                        ...searchCondition,
                        offset: 1,
                        statuses: key as AppCaseAuditStatus,
                    })
                }}
            >
                <Tabs.TabPane
                    tab={__('待审核')}
                    key={AppCaseAuditStatus.Pending}
                />
                <Tabs.TabPane
                    tab={__('已审核')}
                    key={AppCaseAuditStatus.Audited}
                />
            </Tabs>
            <Radio.Group
                value={searchCondition.type}
                onChange={(e) => {
                    setSearchCondition({
                        ...searchCondition,
                        type: e.target.value as IAppCaseAuditType,
                        offset: 1,
                    })
                }}
            >
                <Radio.Button value={IAppCaseAuditType.All}>
                    {__('全部审核类型')}
                </Radio.Button>
                <Radio.Button value={IAppCaseAuditType.Report}>
                    {__('应用案例上报审核')}
                </Radio.Button>
                <Radio.Button value={IAppCaseAuditType.Withdraw}>
                    {__('应用案例下架审核')}
                </Radio.Button>
            </Radio.Group>
            {loading ? (
                <div className={styles.loader}>
                    <Loader />
                </div>
            ) : !loading && tableProps.dataSource.length === 0 ? (
                <div className={styles.emptyWrapper}>{renderEmpty()}</div>
            ) : (
                <Table
                    columns={columns}
                    {...tableProps}
                    rowKey="id"
                    rowClassName={styles.tableRow}
                    className={styles.table}
                    onChange={(currentPagination) => {
                        setSearchCondition({
                            ...searchCondition,
                            offset: currentPagination?.current || 1,
                        })
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
            {auditOpen && auditAppCaseInfo && (
                <Audit
                    open={auditOpen}
                    onClose={() => {
                        setAuditOpen(false)
                        setAuditAppCaseInfo(undefined)
                    }}
                    appCaseInfo={auditAppCaseInfo}
                    target={auditAppCaseInfo?.type! as IAppCaseAuditType}
                />
            )}
            {auditDetailsOpen && auditAppCaseInfo && (
                <AuditDetails
                    open={auditDetailsOpen}
                    onClose={() => {
                        setAuditDetailsOpen(false)
                        setAuditAppCaseInfo(undefined)
                    }}
                    id={auditAppCaseInfo.application_example.id}
                    title={auditAppCaseInfo?.application_example.name!}
                />
            )}
        </div>
    )
}

export default ApplicationCaseAudit
