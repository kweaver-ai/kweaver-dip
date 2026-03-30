import { Drawer, Tooltip } from 'antd'
import classNames from 'classnames'
import { useEffect, useRef, useState } from 'react'
import ReportDetailModal from '@/components/DataPlanManage/Investigation/DetailModal'
import { formatError, getInvestigationReport, getWorkOrderDetail } from '@/core'
import { Loader } from '@/ui'
import { OrderType, StatusType } from '../helper'
import Return from '../Return'
import WorkInfo from '../WorkInfo'
import WorkOrderTaskTable from '../WorkOrderTaskTable'
import __ from './locale'
import styles from './styles.module.less'

function ToProcess({ id, onClose }: any) {
    const [detail, setDetail] = useState<any>()
    const [loading, setLoading] = useState<boolean>(false)
    const aRef = useRef<any>()
    const [reportItem, setReportItem] = useState<any>()
    const [reportVisible, setReportVisible] = useState<any>(false)

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

    const ReportTipElse = reportItem ? (
        <span>
            {__('无法确认归集内容？可前往调研并完成')}
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
            {__('无法确认归集内容？可前往调研并完成')}
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
                        onReturn={
                            () => onClose?.(true) // detail?.status !== StatusType.ONGOING
                        }
                        title={__('处理工单')}
                    />
                </div>
                <div className={styles.body}>
                    <div
                        className={classNames(
                            styles.detailContent,
                            detail?.type === OrderType?.AGGREGATION &&
                                styles['is-aggregation'],
                        )}
                    >
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
                                <div className={styles.moduleTitle}>
                                    <h4>{__('工单任务')}</h4>
                                </div>
                                <div>
                                    <WorkOrderTaskTable
                                        workOrderId={id}
                                        orderType={detail?.type}
                                    />
                                </div>
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

export default ToProcess
