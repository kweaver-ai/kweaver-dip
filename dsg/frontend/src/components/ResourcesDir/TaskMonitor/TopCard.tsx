import React, { memo } from 'react'
import classnames from 'classnames'
import styles from './styles.module.less'
import { WorkOrderStatus } from '@/core'

const StatusTextMap = {
    Ready: '未开始',
    [WorkOrderStatus.Running]: '进行中',
    [WorkOrderStatus.Completed]: '已完成',
    [WorkOrderStatus.Failed]: '异常',
}

function StatusItem({
    status,
    showCount = false,
    count,
}: {
    status: string
    showCount?: boolean
    count?: number
}) {
    return (
        <div
            className={classnames(
                styles.statusItem,
                styles[status],
                !showCount && styles.onlyState,
            )}
        >
            <div>{StatusTextMap?.[status]}</div>
            {showCount && <div>{count || 0}</div>}
        </div>
    )
}

function TopCard({ data }: { data: any }) {
    const { aggregation, processing, comprehension } = data || {}
    return (
        <div className={styles['monitor-top']}>
            <div
                className={classnames(
                    styles['monitor-top-item'],
                    styles.aggregation,
                )}
            >
                <div className={styles.tag}>归集</div>
                <div className={styles.top}>
                    <div className={styles.count}>
                        任务数: {aggregation?.total_count || 0}
                    </div>
                </div>
                <div className={styles.content}>
                    <div className={styles.item}>
                        <div className={styles.name}>数据归集任务</div>
                        <div className={styles.empty} hidden={!!aggregation}>
                            暂无数据
                        </div>
                        <div className={styles.status} hidden={!aggregation}>
                            <StatusItem
                                status={WorkOrderStatus.Running}
                                showCount
                                count={aggregation?.running_count}
                            />

                            <StatusItem
                                status={WorkOrderStatus.Completed}
                                showCount
                                count={aggregation?.completed_count}
                            />

                            <StatusItem
                                status={WorkOrderStatus.Failed}
                                showCount
                                count={aggregation?.failed_count}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div
                className={classnames(
                    styles['monitor-top-item'],
                    styles.processing,
                )}
            >
                <div className={styles.tag}>加工</div>
                <div className={styles.top}>
                    <div className={styles.count}>
                        任务数: {processing?.total_count || 0}
                    </div>
                </div>
                <div className={styles.content}>
                    <div className={styles.item}>
                        <div className={styles.name}>标准检测任务</div>
                        <div
                            className={styles.empty}
                            hidden={!!processing?.data_standardization_status}
                        >
                            暂无数据
                        </div>
                        <div
                            className={styles.status}
                            hidden={!processing?.data_standardization_status}
                        >
                            <StatusItem
                                status={processing?.data_standardization_status}
                            />
                        </div>
                    </div>
                    <div className={styles.item}>
                        <div className={styles.name}>质量检测任务</div>
                        <div
                            className={styles.empty}
                            hidden={!!processing?.data_quality_audit_status}
                        >
                            暂无数据
                        </div>
                        <div
                            className={styles.status}
                            hidden={!processing?.data_quality_audit_status}
                        >
                            <StatusItem
                                status={processing?.data_quality_audit_status}
                            />
                        </div>
                    </div>
                    <div className={styles.item}>
                        <div className={styles.name}>数据融合任务</div>
                        <div
                            className={styles.empty}
                            hidden={!!processing?.data_fusion_status}
                        >
                            暂无数据
                        </div>
                        <div
                            className={styles.status}
                            hidden={!processing?.data_fusion_status}
                        >
                            <StatusItem
                                status={processing?.data_fusion_status}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div
                className={classnames(
                    styles['monitor-top-item'],
                    styles.comprehension,
                )}
            >
                <div className={styles.tag}>理解</div>
                <div className={styles.top}>
                    <div className={styles.count}>
                        任务数: {comprehension?.total_count || 0}
                    </div>
                </div>
                <div className={styles.content}>
                    <div className={styles.item}>
                        <div className={styles.name}>数据理解任务</div>
                        <div
                            className={styles.empty}
                            hidden={!!comprehension?.data_comprehension_status}
                        >
                            暂无数据
                        </div>
                        <div
                            className={styles.status}
                            hidden={!comprehension?.data_comprehension_status}
                        >
                            <StatusItem
                                status={
                                    comprehension?.data_comprehension_status
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default memo(TopCard)
