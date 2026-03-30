import React, { memo, useEffect, useState } from 'react'
import { Progress, Statistic, Tooltip } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { formatError, getQualityReportImprovement } from '@/core'
import styles from './styles.module.less'
import { thousandSplit } from '@/components/Asset/AssetPanorama/helper'

function ImprovmentCards() {
    const [improvementData, setImprovementData] = useState<any>()

    useEffect(() => {
        getImprovement()
    }, [])

    const getImprovement = async () => {
        try {
            const res = await getQualityReportImprovement()
            setImprovementData(res)
        } catch (error) {
            formatError(error)
        }
    }
    return (
        <div className={styles['improvment-cards']}>
            {/* 整改工单总数 */}
            <div className={styles['card-item']}>
                <div className={styles['card-item-count']}>
                    <div>整改工单总数</div>
                    <div>
                        {thousandSplit(improvementData?.total_count || 0)}
                    </div>
                </div>
            </div>
            {/* 进行中数量 */}
            <div className={styles['card-item']}>
                <div className={styles['card-item-count']}>
                    <div>进行中数量</div>
                    <div>
                        {thousandSplit(improvementData?.ongoing_count || 0)}
                    </div>
                </div>

                <Progress
                    type="circle"
                    strokeLinecap="butt"
                    percent={Math.ceil(
                        (
                            (Number(improvementData?.ongoing_count || 0) /
                                Number(
                                    improvementData?.total_count || 1,
                                )) as any
                        ).toFixed(2) * 100 || 0,
                    )}
                    width={50}
                />
            </div>
            {/* 已完成数量 */}
            <div className={styles['card-item']}>
                <div className={styles['card-item-count']}>
                    <div>已完成数量</div>
                    <div>
                        {thousandSplit(improvementData?.finished_count || 0)}
                    </div>
                </div>

                <Progress
                    type="circle"
                    strokeLinecap="butt"
                    percent={Math.ceil(
                        (
                            (Number(improvementData?.finished_count || 0) /
                                Number(
                                    improvementData?.total_count || 1,
                                )) as any
                        ).toFixed(2) * 100 || 0,
                    )}
                    width={50}
                    strokeColor="#52c41b"
                />
            </div>
            {/* 告警数量 */}
            <div className={styles['card-item']}>
                <div className={styles['card-item-count']}>
                    <div>告警数量</div>
                    <div>
                        {thousandSplit(improvementData?.alert_count || 0)}
                    </div>
                </div>
                <Progress
                    type="circle"
                    strokeLinecap="butt"
                    percent={Math.ceil(
                        (
                            (Number(improvementData?.alert_count || 0) /
                                Number(
                                    improvementData?.total_count || 1,
                                )) as any
                        ).toFixed(2) * 100 || 0,
                    )}
                    width={50}
                    strokeColor="#e60012"
                />
            </div>
            {/* 及时整改率 */}
            <div className={styles['card-item']}>
                <div className={styles['card-item-count']}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        及时整改率
                        <Tooltip title="及时整改率是在已完成的工单中，没有逾期完成的工单数量与总工单数量的百分比">
                            <InfoCircleOutlined
                                style={{
                                    color: 'rgba(0,0,0,0.45)',
                                    fontSize: 12,
                                }}
                            />
                        </Tooltip>
                    </div>
                    <div>
                        {Math.ceil(
                            (
                                (Number(
                                    improvementData?.not_overdue_count || 0,
                                ) /
                                    Number(
                                        improvementData?.total_count || 1,
                                    )) as any
                            ).toFixed(2) * 100 || 0,
                        )}
                        %
                    </div>
                </div>
            </div>
        </div>
    )
}

export default memo(ImprovmentCards)
