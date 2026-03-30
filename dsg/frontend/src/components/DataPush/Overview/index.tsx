import React, { memo, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DatePicker, Progress, Space, Statistic } from 'antd'
import classnames from 'classnames'
import moment from 'moment'
import { useUpdateEffect } from 'ahooks'
import { omit } from 'lodash'
import styles from './styles.module.less'
import __ from '../locale'
import ResourceTable from '../DataPushTable'
import { DataPushStatus, dataPushStatusMap, DataPushTab } from '../const'
import { LightweightSearch } from '@/ui'
import {
    formatError,
    getDataPushAnnualStatistics,
    getDataPushOverview,
} from '@/core'
import { dataPushTabMap, renderEmpty } from '../helper'
import { FontIcon } from '@/icons'
import { ColumnMap } from './g2plotConfig'
import { cancelRequest } from '@/utils'

/**
 * 数据推送概览
 */
const DataPushOverview = () => {
    const menu = DataPushTab.Overview
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    // 总览数据
    const [overviewData, setOverviewData] = useState<any>()
    // 图表数据
    const [chartData, setChartData] = useState<any[]>([])
    // 筛选条件
    const [searchCondition, setSearchCondition] = useState<any>({})

    useEffect(() => {
        setSearchCondition({
            start_time: moment().subtract(1, 'year').valueOf(),
            end_time: moment().valueOf(),
        })
        getYearData()
    }, [])

    useUpdateEffect(() => {
        getOverview(searchCondition)
    }, [searchCondition])

    const getOverview = async (params: any) => {
        try {
            setLoading(true)
            cancelRequest('/api/data-catalog/v1/data-push/overview', 'get')
            const res = await getDataPushOverview(params)
            setOverviewData(res)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    const getYearData = async () => {
        try {
            setLoading(true)
            const res = await getDataPushAnnualStatistics()
            setChartData(res)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 转换卡片数据
    const statistics = useMemo(() => {
        return [
            {
                label: __('数据推送记录总数'),
                value: 'total',
                key: 'total',
            },
            {
                label: __('待发布'),
                value: 'waiting',
                key: DataPushStatus.Pending,
            },
            {
                label: __('未开始'),
                value: 'starting',
                key: DataPushStatus.NotStarted,
            },
            {
                label: __('进行中'),
                value: 'going',
                key: DataPushStatus.InProgress,
            },
            {
                label: __('已停用'),
                value: 'stopped',
                key: DataPushStatus.Stopped,
            },
            {
                label: __('已结束'),
                value: 'end',
                key: DataPushStatus.Ended,
            },
        ].map((item) => ({
            ...item,
            value: overviewData?.[item.value] || 0,
        }))
    }, [overviewData])

    // 转换图表数据
    const transformChartData = useMemo(() => {
        if (!chartData.length) {
            return []
        }
        return chartData
            .map((item) => ({
                name: `${
                    item.month.slice(4, 6) < 10
                        ? item.month.slice(5, 6)
                        : item.month.slice(4, 6)
                }${__('月')}`,
                value: item.count,
            }))
            .reverse()
    }, [chartData])

    // 统计卡片
    const renderStatisticsCard = (item: any) => {
        return (
            <div
                key={item.key}
                className={classnames(
                    styles.statisticsItem,
                    item.key === 'total' && styles.statisticsTotal,
                )}
            >
                <div className={styles.statisticsValue} title={item.value}>
                    <Statistic
                        title={item.label}
                        value={item.value}
                        className={styles.statisticsValue}
                    />
                </div>
                {item.key === 'total' ? (
                    <div className={styles.auditPending}>
                        <FontIcon name="icon-a-shenhedaibanxianxing" />
                        <span className={styles.auditPendingText}>
                            {__('审核中')}
                        </span>
                        {overviewData?.auditing || 0}
                    </div>
                ) : (
                    <div className={styles.progressContainer}>
                        <div
                            className={styles.divider}
                            style={{
                                background: dataPushStatusMap[item.key].color,
                                left: `${
                                    overviewData?.total
                                        ? (item.value / overviewData.total) *
                                          100
                                        : 0
                                }%`,
                            }}
                        />
                        <Progress
                            percent={
                                overviewData?.total
                                    ? (item.value / overviewData.total) * 100
                                    : 0
                            }
                            showInfo={false}
                            strokeLinecap="butt"
                            trailColor="#F0F2F5"
                            strokeColor={dataPushStatusMap[item.key].color}
                        />
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className={styles.dataPushOverview}>
            <div className={styles.dataPushOverviewContent}>
                <div className={styles.subHeader}>
                    <div className={styles.title}>{__('数据推送概览')}</div>
                    <Space size={8}>
                        <DatePicker.RangePicker
                            getPopupContainer={(n) => n}
                            value={[
                                moment(searchCondition?.start_time),
                                moment(searchCondition?.end_time),
                            ]}
                            placeholder={[__('开始时间'), __('结束时间')]}
                            onChange={(date, dateString) => {
                                setSearchCondition((prev) => ({
                                    ...prev,
                                    start_time:
                                        date?.[0] &&
                                        moment(
                                            date[0].format(
                                                'YYYY-MM-DD 00:00:00',
                                            ),
                                        ).valueOf(),
                                    end_time:
                                        date?.[1] &&
                                        moment(
                                            date[1].format(
                                                'YYYY-MM-DD 23:59:59',
                                            ),
                                        ).valueOf(),
                                }))
                            }}
                        />
                        <LightweightSearch
                            formData={dataPushTabMap[menu].searchFormData}
                            onChange={(data, key) => {
                                if (!key) {
                                    // 重置
                                    setSearchCondition((prev) => {
                                        const obj = {
                                            ...prev,
                                            ...data,
                                        }
                                        return omit(obj, [
                                            'source_department_id',
                                            'dest_department_id',
                                        ])
                                    })
                                } else {
                                    const value = data[key]
                                    if (value === 'not-select') {
                                        setSearchCondition((prev) => ({
                                            ...omit(prev, [key]),
                                        }))
                                    } else {
                                        setSearchCondition((prev) => ({
                                            ...prev,
                                            [key]: value,
                                        }))
                                    }
                                }
                            }}
                            defaultValue={dataPushTabMap[menu].defaultSearch}
                        />
                    </Space>
                </div>

                {/* 统计 */}
                <div className={styles.statisticsContainer}>
                    <div className={styles.cardContainer}>
                        {statistics.map((item) => renderStatisticsCard(item))}
                    </div>
                    <div className={styles.chartContainer}>
                        <div className={styles.title}>
                            {__('近一年推送的数据总量')}
                        </div>
                        {chartData ? (
                            <ColumnMap dataInfo={transformChartData} />
                        ) : (
                            renderEmpty()
                        )}
                    </div>
                </div>

                {/* 列表 */}
                <div className={styles.subHeader}>
                    <div className={styles.title}>{__('最新10条数据推送')}</div>
                    <a
                        onClick={() => {
                            navigate('/dataPush/manage')
                        }}
                    >
                        {__('查看全部')}
                    </a>
                </div>
                <ResourceTable menu={DataPushTab.Overview} />
            </div>
        </div>
    )
}

export default memo(DataPushOverview)
