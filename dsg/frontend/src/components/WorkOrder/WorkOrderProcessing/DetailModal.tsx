import { Descriptions, Drawer, Tooltip } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { formatError, getInvestigationReport, getWorkOrderDetail } from '@/core'
import Return from '../Return'
import WorkInfo from '../WorkInfo'
import WorkOrderTaskTable from '../WorkOrderTaskTable'
import __ from './locale'
import styles from './styles.module.less'
import { Loader } from '@/ui'
import { OrderType } from '../helper'
import TaskTable from '../WorkOrderType/AggregationOrder/TaskTable'
import AggregationInfo from './AggregationInfo'
import ReportDetailModal from '@/components/DataPlanManage/Investigation/DetailModal'

function DetailModal({ id, onClose }: any) {
    const [detail, setDetail] = useState<any>()
    const [loading, setLoading] = useState<boolean>(false)
    const [reportVisible, setReportVisible] = useState<any>(false)
    const [reportItem, setReportItem] = useState<any>()
    const getDetail = async () => {
        try {
            setLoading(true)
            const res = await getWorkOrderDetail(id)
            setDetail(res)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    const getReport = async () => {
        try {
            const res = await getInvestigationReport({ work_order_id: id })
            if (res?.entries?.[0]) {
                setReportItem(res?.entries?.[0])
            }
        } catch (error) {
            // formatError(error)
        }
    }

    useEffect(() => {
        if (id) {
            getDetail()
            getReport()
        }
    }, [id])

    const ReportTip = reportItem ? (
        <span>
            {__('查看')}
            <a
                onClick={(e) => {
                    e.stopPropagation()
                    setReportVisible(true)
                }}
            >
                {__('调研报告')}
            </a>
        </span>
    ) : (
        <span>
            {__('查看')}

            <Tooltip title={__('暂无报告')}>
                <span style={{ textDecoration: 'underline' }}>
                    {__('调研报告')}
                </span>
            </Tooltip>
        </span>
    )

    return (
        <Drawer
            open
            contentWrapperStyle={{
                width: '100%',
                height: '100%',
                boxShadow: 'none',
                transform: 'none',
                marginTop: 0,
            }}
            style={{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            }}
            headerStyle={{ display: 'none' }}
            bodyStyle={{
                padding: '0 0 0 0',
                display: 'flex',
                flexDirection: 'column',
            }}
            destroyOnClose
            maskClosable={false}
            mask={false}
        >
            <div className={styles['opt-wrapper']}>
                <div className={styles.header}>
                    <Return
                        onReturn={() => onClose(false)}
                        title={__('工单处理详情')}
                    />
                </div>
                <div className={styles.body}>
                    <div className={styles.detailContent}>
                        <div
                            hidden={!loading}
                            style={{
                                display: 'grid',
                                placeContent: ' center',
                                height: '100%',
                            }}
                        >
                            <Loader />
                        </div>
                        <div className={styles.infoSplit} hidden={loading}>
                            <WorkInfo
                                data={detail}
                                className={
                                    detail?.type === OrderType?.AGGREGATION &&
                                    styles['set-width']
                                }
                            />
                            <div className={styles.infoRight}>
                                {detail?.type === OrderType.AGGREGATION && (
                                    <>
                                        <div
                                            className={styles.moduleTitle}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <h4>{__('归集信息')}</h4>

                                            <span
                                                style={{
                                                    fontSize: '12px',
                                                    color: 'rgba(0,0,0,0.65)',
                                                    marginRight: '10px',
                                                }}
                                            >
                                                {ReportTip}
                                            </span>
                                        </div>
                                        <AggregationInfo
                                            readOnly
                                            data={detail}
                                            fromType={detail?.source_type}
                                        />
                                    </>
                                )}
                                <div className={styles.moduleTitle}>
                                    <h4>{__('工单任务')}</h4>
                                </div>
                                <div>
                                    {detail?.type === OrderType.AGGREGATION ? (
                                        <TaskTable tasks={detail?.tasks} />
                                    ) : (
                                        <WorkOrderTaskTable
                                            workOrderId={id}
                                            readOnly
                                        />
                                    )}
                                </div>
                                <div className={styles.moduleTitle}>
                                    <h4>{__('处理说明')}</h4>
                                </div>
                                <Descriptions
                                    column={2}
                                    labelStyle={{
                                        width: '100px',
                                        color: 'rgba(0, 0, 0, 0.45)',
                                    }}
                                >
                                    <Descriptions.Item label={__('处理说明')}>
                                        {detail?.processing_instructions ||
                                            '--'}
                                    </Descriptions.Item>
                                </Descriptions>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {reportVisible && (
                <ReportDetailModal
                    id={reportItem?.id}
                    onClose={() => {
                        setReportVisible(false)
                    }}
                />
            )}
        </Drawer>
    )
}

export default DetailModal
