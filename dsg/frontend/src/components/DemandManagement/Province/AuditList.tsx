import { Space, Table } from 'antd'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAntdTable } from 'ahooks'
import classnames from 'classnames'
import { useNavigate, useSearchParams } from 'react-router-dom'
import moment from 'moment'
import __ from '../locale'
import {
    AuditResultStatusEnum,
    AuditResultStatusMap,
    demandAuditTargetList,
} from './const'
import styles from '../styles.module.less'
import { Empty, Loader } from '@/ui'
import {
    formatError,
    getSSZDDemandAuditList,
    IGetSSZDDemandAuditList,
    ISSZDDemandAuditItem,
    SSZDDemandAuditTarget,
    SSZDDemandAuditType,
} from '@/core'
import { formatTime } from '@/utils'
import dataEmpty from '@/assets/dataEmpty.svg'
import ApplyAudit from './ApplyAudit'
import AuditStatus from './AuditStatus'

const AuditList = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [searchCondition, setSearchCondition] =
        useState<IGetSSZDDemandAuditList>({
            target: SSZDDemandAuditTarget.Tasks,
            audit_type: SSZDDemandAuditType.Escalate,
            limit: 10,
            offset: 1,
        })
    const [auditOpen, setAuditOpen] = useState(false)
    const [auditDemandInfo, setAuditDemandInfo] =
        useState<ISSZDDemandAuditItem>()

    const columns: any = useMemo(() => {
        const cols = [
            {
                title: __('需求名称'),
                dataIndex: 'title',
                key: 'title',
                width: 260,
                ellipsis: true,
            },
            {
                title: __('审核状态'),
                dataIndex: 'status',
                key: 'status',
                render: (status) => (
                    <AuditStatus
                        status={AuditResultStatusEnum.Passed}
                        AuditResultStatusMap={AuditResultStatusMap}
                    />
                ),
            },
            {
                title: __('需求部门'),
                dataIndex: 'org_name',
                key: 'org_name',
            },
            {
                title: __('需求联系人'),
                dataIndex: 'contact',
                key: 'contact',
            },
            {
                title: __('需求联系人电话'),
                dataIndex: 'phone',
                key: 'phone',
            },
            {
                title: __('责任部门'),
                dataIndex: 'duty_org_name',
                key: 'duty_org_name',
            },
            {
                title: __('申请时间'),
                dataIndex: 'apply_time',
                key: 'apply_time',
                width: 200,
                render: (val: number) => formatTime(val),
            },
            {
                title: __('操作'),
                key: 'action',
                width: 240,
                fixed: 'right',
                render: (_, record: ISSZDDemandAuditItem) =>
                    searchCondition.target ===
                    SSZDDemandAuditTarget.Historys ? (
                        <a
                            onClick={() => {
                                setAuditOpen(true)
                                setAuditDemandInfo(record)
                            }}
                        >
                            {__('详情')}
                        </a>
                    ) : (
                        <a
                            onClick={() => {
                                setAuditOpen(true)
                                setAuditDemandInfo(record)
                            }}
                        >
                            {__('审核')}
                        </a>
                    ),
            },
        ]

        return searchCondition.target === SSZDDemandAuditTarget.Tasks
            ? cols.filter((col) => col.key !== 'status')
            : cols
    }, [searchCondition.target])

    const renderEmpty = () => {
        return <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
    }

    const getDemandList = async (params: any) => {
        try {
            const res = await getSSZDDemandAuditList(params)

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
        }
    }

    const { tableProps, run, pagination, loading } = useAntdTable(
        getDemandList,
        {
            defaultPageSize: 10,
            manual: true,
        },
    )

    useEffect(() => {
        run(searchCondition)
    }, [searchCondition])

    return (
        <div className={classnames(styles['demand-wrapper'])}>
            <div className={styles.title}>{__('需求审核')}</div>
            <div className={styles['operate-container']}>
                <Space size={12}>
                    {demandAuditTargetList.map((status) => (
                        <div
                            key={status.value}
                            className={classnames({
                                [styles.statusItem]: true,
                                [styles.selectedStatusItem]:
                                    searchCondition.target === status.value,
                            })}
                            onClick={() => {
                                setSearchCondition({
                                    ...searchCondition,
                                    target: status.value as SSZDDemandAuditTarget,
                                })
                            }}
                        >
                            {status.label}
                        </div>
                    ))}
                </Space>
            </div>

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
                    onChange={(currentPagination, filters, sorter) => {
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
            {auditDemandInfo && auditOpen && (
                <ApplyAudit
                    open={auditOpen}
                    onClose={() => {
                        setAuditOpen(false)
                        setAuditDemandInfo(undefined)
                    }}
                    demandInfo={auditDemandInfo}
                />
            )}
        </div>
    )
}

export default AuditList
