import { Badge, DatePicker, Select } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Moment } from 'moment'
import { Line, Pie } from '@antv/g2plot'
import { useUpdateEffect } from 'ahooks'
import classNames from 'classnames'
import styles from './styles.module.less'
import __ from '../locale'
import { Empty, SearchInput } from '@/ui'
import { generatePie } from './helper'
import { IInterfaceDailyStatisticsParams } from '@/core/apis/dataApplicationService/index.d'
import { getInterfaceDailyStatistics } from '@/core'
import dataEmpty from '@/assets/dataEmpty.svg'
import DepartmentMultipleChoices from '@/components/DepartmentMultipleChoices'

type RangeValue = [Moment | null, Moment | null] | null

const CallStatistics = () => {
    const pieRef = useRef<HTMLDivElement>(null)
    const lineRef = useRef<HTMLDivElement>(null)
    const [piePlot, setPiePlot] = useState<Pie | null>(null)
    const [linePlot, setLinePlot] = useState<Line | null>(null)
    const [dates, setDates] = useState<RangeValue>(null)
    const [timeRange, setTimeRange] = useState<RangeValue>(null)
    const [isEmpty, setIsEmpty] = useState(false)
    const [searchParams, setSearchParams] =
        useState<IInterfaceDailyStatisticsParams>({
            department_id: '',
            service_type: '',
            key: '',
            start_time: '',
            end_time: '',
        })
    const [data, setData] = useState<{ type: string; value: number }[]>([
        { type: '成功', value: 0 },
        { type: '失败', value: 0 },
    ])

    const isSearchParamsEmpty = useMemo(() => {
        return (
            !searchParams ||
            (!searchParams?.department_id &&
                !searchParams?.service_type &&
                !searchParams?.key &&
                !searchParams?.start_time &&
                !searchParams?.end_time)
        )
    }, [searchParams])

    useUpdateEffect(() => {
        if (timeRange && timeRange[0] && timeRange[1]) {
            setSearchParams({
                ...searchParams,
                start_time: timeRange[0].format('YYYY-MM-DD'),
                end_time: timeRange[1].format('YYYY-MM-DD'),
            })
        } else {
            setSearchParams({
                ...searchParams,
                start_time: '',
                end_time: '',
            })
        }
    }, [timeRange])

    const getCallStatistics = async () => {
        const res = await getInterfaceDailyStatistics(searchParams)
        if (!res.daily_statistics || res.daily_statistics.length === 0) {
            setIsEmpty(true)
            if (piePlot) {
                piePlot.destroy()
                setPiePlot(null)
            }
            if (linePlot) {
                linePlot.destroy()
                setLinePlot(null)
            }
            return
        }

        const successCount = res.daily_statistics.reduce(
            (acc, curr) => acc + curr.success_count,
            0,
        )

        const failCount = res.daily_statistics.reduce(
            (acc, curr) => acc + curr.fail_count,
            0,
        )

        const countData = [
            { type: '成功', value: successCount },
            { type: '失败', value: failCount },
        ]

        const lineData = res.daily_statistics.map((item) => ({
            year: item.record_date,
            value: item.success_count + item.fail_count,
        }))

        setData(countData)
        setIsEmpty(false)

        if (pieRef.current && !piePlot) {
            const plot = generatePie(
                countData,
                pieRef.current,
                __('调用次数总数'),
                ['#7DC45B', '#F4646F'],
            )
            setPiePlot(plot)
        }

        if (piePlot) {
            piePlot.changeData(countData)
        }

        if (lineRef.current && !linePlot) {
            const plot = new Line(lineRef.current, {
                padding: 'auto',
                data: lineData,
                xField: 'year',
                yField: 'value',
                smooth: true,
            })
            plot.render()
            setLinePlot(plot)
        }

        if (linePlot) {
            linePlot.changeData(lineData)
        }
    }

    useEffect(() => {
        getCallStatistics()
    }, [searchParams])

    const getCommonItem = (
        label: string,
        value: number,
        color = '#3AA0FF',
        // percent: number,
    ) => {
        return (
            <div className={styles['data-item']}>
                <Badge color={color} />
                <span className={styles['data-label']}>{label}</span>
                <span className={styles['data-value']}>{value}</span>
                {/* <span className={styles['data-percent']}>{percent}%</span> */}
            </div>
        )
    }

    const disabledDate = (current: Moment) => {
        if (!dates) {
            return false
        }
        const tooLate = dates[0] && current.diff(dates[0], 'days') > 29
        const tooEarly = dates[1] && dates[1].diff(current, 'days') > 29
        return !!tooEarly || !!tooLate
    }

    return (
        <div className={styles['call-statistics']}>
            {isEmpty && isSearchParamsEmpty ? (
                <div className={styles['empty-container']}>
                    <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                </div>
            ) : (
                <>
                    <div className={styles['top-info']}>
                        <div className={styles.title}>
                            {__('接口调用维度统计')}
                        </div>
                        <div className={styles['search-container']}>
                            <DepartmentMultipleChoices
                                onChange={(value) => {
                                    setSearchParams({
                                        ...searchParams,
                                        department_id: value.join(','),
                                    })
                                }}
                            />
                            <Select
                                style={{ width: 134 }}
                                options={[
                                    {
                                        label: __('不限'),
                                        value: '',
                                        showLabel: __('服务类型不限'),
                                    },
                                    {
                                        label: __('注册类型'),
                                        value: 'service_register',
                                        showLabel: __('注册类型'),
                                    },
                                    {
                                        label: __('生成类型'),
                                        value: 'service_generate',
                                        showLabel: __('生成类型'),
                                    },
                                ]}
                                value={searchParams?.service_type}
                                onChange={(value) => {
                                    setSearchParams({
                                        ...searchParams,
                                        service_type: value,
                                    })
                                }}
                                optionLabelProp="showLabel"
                            />
                            <SearchInput
                                placeholder={__('搜索接口服务名称')}
                                style={{ width: 200 }}
                                value={searchParams?.key}
                                onKeyChange={(value) => {
                                    setSearchParams({
                                        ...searchParams,
                                        key: value,
                                    })
                                }}
                            />
                            <DatePicker.RangePicker
                                style={{ width: 236 }}
                                value={dates || timeRange}
                                disabledDate={disabledDate}
                                onCalendarChange={(val) => setDates(val)}
                                onChange={(value) => {
                                    setTimeRange(value)
                                }}
                            />
                        </div>
                    </div>
                    {isEmpty && !isSearchParamsEmpty && (
                        <div className={styles['empty-container']}>
                            <Empty />
                        </div>
                    )}
                    <div
                        className={classNames(
                            styles['bottom-container'],
                            isEmpty &&
                                !isSearchParamsEmpty &&
                                styles['bottom-empty-container'],
                        )}
                    >
                        <div className={styles.left}>
                            <div className={styles['left-title']}>
                                {__('调用次数')}
                            </div>
                            <div
                                className={styles['line-container']}
                                ref={lineRef}
                            />
                        </div>
                        <div className={styles.right}>
                            <div className={styles['right-title']}>
                                {__('调用结果')}
                            </div>
                            <div className={styles['right-content-container']}>
                                <div
                                    className={styles['pie-container']}
                                    ref={pieRef}
                                />
                                <div className={styles['data-info']}>
                                    {getCommonItem(
                                        __('成功'),
                                        data[0].value,
                                        '#7DC45B',
                                    )}
                                    {getCommonItem(
                                        __('失败'),
                                        data[1].value,
                                        '#F4646F',
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default CallStatistics
