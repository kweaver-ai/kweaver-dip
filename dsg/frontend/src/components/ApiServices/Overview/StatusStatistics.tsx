import { useEffect, useRef, useState } from 'react'
import { Divider } from 'antd'
import { Column } from '@antv/g2plot'
import classNames from 'classnames'
import { useUpdateEffect } from 'ahooks'
import styles from './styles.module.less'
import __ from '../locale'
import { statusStatisticsFields } from './const'
import {
    IInterfaceAuditStatistics,
    IInterfaceStatusStatisticsItem,
} from '@/core/apis/dataApplicationService/index.d'

interface IStatusStatisticsProps {
    totalStatistics: IInterfaceStatusStatisticsItem & IInterfaceAuditStatistics
}
const StatusStatistics = ({ totalStatistics }: IStatusStatisticsProps) => {
    const containerRef = useRef<HTMLDivElement>(null)

    useUpdateEffect(() => {
        if (containerRef.current && totalStatistics) {
            const data = [
                // 发布审核一组
                {
                    name: __('待审核'),
                    xField: __('发布审核'),
                    yField: totalStatistics.af_data_application_publish_auditing_count,
                },
                {
                    name: __('通过'),
                    xField: __('发布审核'),
                    yField: totalStatistics.af_data_application_publish_pass_count,
                },
                {
                    name: __('未通过'),
                    xField: __('发布审核'),
                    yField: totalStatistics.af_data_application_publish_reject_count,
                },
                // 上线审核一组
                {
                    name: __('待审核'),
                    xField: __('上线审核'),
                    yField: totalStatistics.af_data_application_online_auditing_count,
                },
                {
                    name: __('通过'),
                    xField: __('上线审核'),
                    yField: totalStatistics.af_data_application_online_pass_count,
                },
                {
                    name: __('未通过'),
                    xField: __('上线审核'),
                    yField: totalStatistics.af_data_application_online_reject_count,
                },
                // 下线审核一组
                {
                    name: __('待审核'),
                    xField: __('下线审核'),
                    yField: totalStatistics.af_data_application_offline_auditing_count,
                },
                {
                    name: __('通过'),
                    xField: __('下线审核'),
                    yField: totalStatistics.af_data_application_offline_pass_count,
                },
                {
                    name: __('未通过'),
                    xField: __('下线审核'),
                    yField: totalStatistics.af_data_application_offline_reject_count,
                },
            ]
            const stackedColumnPlot = new Column(containerRef.current, {
                data,
                isGroup: true,
                xField: 'xField',
                yField: 'yField',
                seriesField: 'name',
                autoFit: true,
                // [top, right, bottom, left]
                padding: [50, 20, 20, 40],
                /** 设置颜色 */
                color: ['#3AA0FF', '#A0D7E7', '#8C7BEB'],
                // 设置水平网格线为虚线
                yAxis: {
                    grid: {
                        line: {
                            style: {
                                lineDash: [4, 5],
                            },
                        },
                    },
                },
                /** 设置组内柱子间距 */
                marginRatio: -0.55,
                legend: {
                    position: 'top-right',
                    marker: {
                        symbol: 'circle',
                        style: { r: 6 },
                    },
                },
                columnStyle: {
                    radius: [5, 5, 0, 0],
                },
                maxColumnWidth: 22,
            })

            stackedColumnPlot.render()
        }
    }, [totalStatistics])

    const getCountItem = (
        fIndex: number,
        title: string,
        count: number,
        isDivider = false,
        itemHeight = 64,
    ) => {
        return (
            <div
                className={styles['count-item']}
                style={{
                    height: itemHeight,
                    flexGrow: fIndex > 3 ? 0 : 1,
                }}
            >
                {isDivider && (
                    <Divider
                        type="vertical"
                        dashed
                        style={{
                            height: '100%',
                            margin: 16,
                            borderColor: '#C2C6CE',
                        }}
                    />
                )}
                <div>
                    <div
                        className={classNames(
                            styles['count-item-title'],
                            fIndex > 3 && styles['count-item-title-small'],
                        )}
                    >
                        {title}
                    </div>
                    <div
                        className={classNames(
                            styles['count-item-count'],
                            fIndex > 3 && styles['count-item-count-small'],
                        )}
                    >
                        {count.toLocaleString()}
                    </div>
                </div>
            </div>
        )
    }
    return (
        <div className={styles['status-statistics']}>
            <div className={styles.title}>{__('接口服务状态统计')}</div>
            <div className={styles['count-container']}>
                {statusStatisticsFields.map((item, fIndex) => {
                    return getCountItem(
                        fIndex + 1,
                        item.label,
                        totalStatistics?.[item.key] || 0,
                        item.isDivider,
                        item.itemHeight,
                    )
                })}
            </div>
            <Divider dashed style={{ width: '100%', borderColor: '#C2C6CE' }} />
            <div ref={containerRef} className={styles['chart-container']}>
                <div className={styles['chart-title']}>{__('审批统计')}</div>
            </div>
        </div>
    )
}

export default StatusStatistics
