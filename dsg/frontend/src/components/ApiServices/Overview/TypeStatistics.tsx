import { useEffect, useRef, useState } from 'react'
import { Badge, Space } from 'antd'
import { useUpdateEffect } from 'ahooks'
import styles from './styles.module.less'
import __ from '../locale'
import { generatePie } from './helper'
import { IInterfaceStatusStatisticsItem } from '@/core/apis/dataApplicationService/index.d'

interface ITypeStatisticsProps {
    generateStatistics: IInterfaceStatusStatisticsItem
    registerStatistics: IInterfaceStatusStatisticsItem
}
const TypeStatistics = ({
    generateStatistics,
    registerStatistics,
}: ITypeStatisticsProps) => {
    const ref1 = useRef<HTMLDivElement>(null)
    const ref2 = useRef<HTMLDivElement>(null)

    useUpdateEffect(() => {
        if (ref1.current && registerStatistics) {
            generatePie(
                [
                    {
                        type: __('已发布'),
                        value: registerStatistics.published_count,
                    },
                    {
                        type: __('未发布'),
                        value: registerStatistics.unpublished_count,
                    },
                ],
                ref1.current,
                __('注册类型总数'),
            )
        }
    }, [registerStatistics])

    useUpdateEffect(() => {
        if (ref2.current && generateStatistics) {
            generatePie(
                [
                    {
                        type: __('已发布'),
                        value: generateStatistics.published_count,
                    },
                    {
                        type: __('未发布'),
                        value: generateStatistics.unpublished_count,
                    },
                ],
                ref2.current,
                __('生成类型总数'),
            )
        }
    }, [generateStatistics])

    const getPercent = (value: number, total: number) => {
        if (total === 0 || value === 0) {
            return 0
        }
        return ((value / total) * 100).toFixed(2)
    }

    const getCommonItem = (
        label: string,
        value: number,
        percent: number | string,
        color = '#3AA0FF',
    ) => {
        return (
            <div className={styles['data-item']}>
                <Badge color={color} />
                <span className={styles['data-label']}>{label}</span>
                <span className={styles['data-value']}>{value}</span>
                <span className={styles['data-percent']}>{percent}%</span>
            </div>
        )
    }

    return (
        <div className={styles['type-statistics']}>
            <div className={styles.title}>{__('接口服务类型统计')}</div>
            <div className={styles.content}>
                <div className={styles['left-container']}>
                    <div ref={ref1} className={styles['pie-container']} />
                    <div className={styles['data-info']}>
                        {getCommonItem(
                            __('已发布'),
                            registerStatistics.published_count,
                            getPercent(
                                registerStatistics.published_count,
                                registerStatistics.service_count,
                            ),
                            '#3AA0FF',
                        )}
                        <Space size={12} className={styles['tag-container']}>
                            {[
                                {
                                    label: __('未上线'),
                                    value: registerStatistics.notline_count,
                                },
                                {
                                    label: __('已上线'),
                                    value: registerStatistics.online_count,
                                },
                                {
                                    label: __('已下线'),
                                    value: registerStatistics.offline_count,
                                },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className={styles['tag-item']}
                                >
                                    <span className={styles['tag-label']}>
                                        {item.label}
                                    </span>
                                    <span className={styles['tag-value']}>
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </Space>
                        {getCommonItem(
                            __('未发布'),
                            registerStatistics.unpublished_count,
                            getPercent(
                                registerStatistics.unpublished_count,
                                registerStatistics.service_count,
                            ),
                            '#A5D9E8',
                        )}
                    </div>
                </div>
                <div className={styles['right-container']}>
                    <div ref={ref2} className={styles['pie-container']} />
                    <div className={styles['data-info']}>
                        {getCommonItem(
                            __('已发布'),
                            generateStatistics.published_count,
                            getPercent(
                                generateStatistics.published_count,
                                generateStatistics.service_count,
                            ),
                            '#3AA0FF',
                        )}
                        <Space size={12} className={styles['tag-container']}>
                            {[
                                {
                                    label: __('未上线'),
                                    value: generateStatistics.notline_count,
                                },
                                {
                                    label: __('已上线'),
                                    value: generateStatistics.online_count,
                                },
                                {
                                    label: __('已下线'),
                                    value: generateStatistics.offline_count,
                                },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className={styles['tag-item']}
                                >
                                    <span className={styles['tag-label']}>
                                        {item.label}
                                    </span>
                                    <span className={styles['tag-value']}>
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </Space>
                        {getCommonItem(
                            __('未发布'),
                            generateStatistics.unpublished_count,
                            getPercent(
                                generateStatistics.unpublished_count,
                                generateStatistics.service_count,
                            ),
                            '#A5D9E8',
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TypeStatistics
