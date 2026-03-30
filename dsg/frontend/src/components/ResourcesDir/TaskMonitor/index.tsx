import React, { memo, useEffect, useMemo, useState } from 'react'
import classnames from 'classnames'
import styles from '../styles.module.less'
import { formatError, getTaskMonitorInfo } from '@/core'
import TopCard from './TopCard'
import TaskProcessing from './TaskProcessing'
import { Empty, Loader } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import { NodeDataType } from './const'
import { TabKey } from '../const'

function TaskMonitor({
    catalogId,
    updateActiveKey,
}: {
    catalogId: string
    updateActiveKey?: (key: TabKey) => void
}) {
    const [data, setData] = useState<any>()
    const [loading, setLoading] = useState(false)

    // 获取任务详情
    const getData = async () => {
        try {
            setLoading(true)
            const res = await getTaskMonitorInfo(catalogId)
            setData(res)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (catalogId) {
            getData()
        } else {
            setData(undefined)
        }
    }, [catalogId])

    // 数值结构转换
    const [topData, canvasData] = useMemo(() => {
        if (!data) return []
        const { data_aggregation, processing, data_comprehension } = data
        // 顶部数据
        const top = {
            aggregation: {
                total_count: data_aggregation?.total_count,
                completed_count: data_aggregation?.completed_count,
                failed_count: data_aggregation?.failed_count,
                running_count: data_aggregation?.running_count,
            },
            processing: {
                total_count: processing?.total_count,
                data_quality_audit_status:
                    processing?.data_quality_audit?.data_quality_audit_status,
                data_standardization_status:
                    processing?.data_standardization
                        ?.data_standardization_status,
                data_fusion_status: processing?.data_fusion?.data_fusion_status,
            },
            comprehension: {
                total_count: data_comprehension?.total_count,
                data_comprehension_status:
                    data_comprehension?.data_comprehension_status,
            },
        }
        const catalog: any = {
            id: `catalog-${data?.catalog_id}`,
            type: NodeDataType.Catalog,
            catalog_id: data?.catalog_id,
            catalog_code: data?.code,
            catalog_name: data?.catalog_name,
            source_form_id: data?.form_id,
            source_form_name: data?.form_name,
            source_type: data?.source_type,
        }
        const childs: any[] = []
        if (processing?.data_fusion) {
            const {
                data_fusion_status,
                data_fusion_source_form,
                data_fusion_source_field,
            } = processing?.data_fusion || {}
            // 融合任务状态
            catalog.taskStatus = data_fusion_status
            catalog.taskType = NodeDataType.Fusion
            ;(data_fusion_source_form || []).forEach(
                (item: any, idx: number) => {
                    const child = {
                        hasBro:
                            data_fusion_source_form?.length > 1 ||
                            !!data_fusion_source_field?.length, // 存在字段融合
                        id: `fusion-${idx}`,
                        type: NodeDataType.Fusion,
                        source_form_id: item.source_form_id,
                        source_form_name: item.source_form_name,
                        source_type: item.source_type,
                        taskStatus: item.data_aggregation_status, // 归集任务状态
                        taskType: NodeDataType.Aggregation,
                        children: (item.data_aggregation_source_info || []).map(
                            (it: any, i: number) => {
                                return {
                                    hasBro:
                                        item.data_aggregation_source_info
                                            .length > 1,
                                    id: `aggregation-${idx}-${i}`,
                                    type: NodeDataType.Aggregation,
                                    source_form_id: it.source_form_id,
                                    source_form_name: it.source_form_name,
                                    source_type: it.source_type,
                                }
                            },
                        ),
                    }
                    childs.push(child)
                },
            )

            if (!data_fusion_source_form?.length) {
                childs.push({
                    hasBro: false,
                    id: `fusion-1`,
                    type: NodeDataType.Fusion,
                    source_form_id: undefined,
                    source_form_name: undefined,
                    source_type: undefined,
                })
            }
            // 存在字段融合
            if (data_fusion_source_field?.length) {
                childs.push({
                    hasBro: !!data_fusion_source_form?.length,
                    id: `fusion-fields`,
                    type: NodeDataType.Fusion,
                    source_form_id: undefined,
                    source_form_name: undefined,
                    source_type: undefined,
                })
            }
        } else if (data_aggregation) {
            // 归集任务状态
            const { data_aggregation_status, data_aggregation_source_info } =
                data_aggregation || {}
            catalog.taskStatus = data_aggregation_status
            catalog.taskType = NodeDataType.Aggregation
            ;(data_aggregation_source_info || []).forEach(
                (item: any, idx: number) => {
                    const child = {
                        hasBro: data_aggregation_source_info.length > 1,
                        id: `aggregation-${idx}`,
                        type: NodeDataType.Aggregation,
                        source_form_id: item.source_form_id,
                        source_form_name: item.source_form_name,
                        source_type: item.source_type,
                    }
                    childs.push(child)
                },
            )
        }
        catalog.children = childs

        // 画布数据
        const canvas = {
            tree: catalog,
            standardization: processing?.data_standardization
                ? {
                      taskStatus:
                          processing?.data_standardization
                              ?.data_standardization_status,
                      taskType: NodeDataType.Standardization,
                      report_updated_at:
                          processing?.data_standardization?.report_updated_at,
                  }
                : undefined,
            comprehension: data_comprehension
                ? {
                      taskStatus: data_comprehension?.data_comprehension_status,
                      taskType: NodeDataType.Comprehension,
                      auditStatus:
                          data_comprehension?.data_comprehension_report_status,
                      auditTip: data_comprehension?.audit_advice,
                      report_updated_at: data_comprehension?.report_updated_at,
                  }
                : undefined,
            quality: processing?.data_quality_audit
                ? {
                      taskStatus:
                          processing?.data_quality_audit
                              ?.data_quality_audit_status,
                      taskType: NodeDataType.Quality,
                      report_updated_at:
                          processing?.data_quality_audit?.report_updated_at,
                  }
                : undefined,
        }

        return [top, canvas]
    }, [data])

    return (
        <div className={styles['task-monitor']}>
            {loading ? (
                <div className={styles['task-monitor-loading']}>
                    <Loader />
                </div>
            ) : !data ? (
                <div className={styles['task-monitor-empty']}>
                    <Empty desc="暂无数据" iconSrc={dataEmpty} />
                </div>
            ) : (
                <div className={styles['task-monitor-wrapper']}>
                    <TopCard data={topData} />
                    <TaskProcessing
                        data={canvasData}
                        viewItem={
                            data?.form_id
                                ? {
                                      form_view_id: data?.form_id,
                                      business_name: data?.form_name,
                                  }
                                : undefined
                        }
                        catalogId={catalogId}
                        updateActiveKey={updateActiveKey}
                    />
                </div>
            )}
        </div>
    )
}

export default memo(TaskMonitor)
