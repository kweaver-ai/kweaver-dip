import { Bar, Line } from '@antv/g2plot'
import moment from 'moment'
import { useSize } from 'ahooks'
import { useEffect, useRef, useState } from 'react'
import { Card, DatePicker } from 'antd'
import __ from '../locale'
import styles from './styles.module.less'
import {
    formatError,
    getBusinessModuleIntegral,
    getDepartmentIntegralTop5,
    getIntegralGrowth,
} from '@/core'
import { businessModuleDisplay } from '@/components/IntegralConfig/helper'

const Board = () => {
    // 部门积分 TOP 5
    const containerTop5Ref = useRef<HTMLDivElement>(null)
    // 部门积分 TOP 5
    const [top5Data, setTop5Data] = useState<
        Array<{
            name: string
            points: number
        }>
    >([])
    // 部门积分 TOP 5 年份
    const [top5Year, setTop5Year] = useState<string>(moment().format('YYYY'))

    // 部门积分 TOP 5 图表
    const top5ChartRef = useRef<Bar | null>(null)

    // 业务模块积分
    const containerBusinessModuleRef = useRef<HTMLDivElement>(null)
    // 业务模块积分
    const [businessModulePoints, setBusinessModulePoints] = useState<
        Array<{
            name: string
            points: number
        }>
    >([])

    // 业务模块积分年份
    const [businessModuleYear, setBusinessModuleYear] = useState<string>(
        moment().format('YYYY'),
    )
    // 业务模块积分图表
    const businessModuleChartRef = useRef<Bar | null>(null)

    // 积分增长情况图表
    const growthChartRef = useRef<Line | null>(null)
    // 积分增长情况
    const containerGrowthRef = useRef<HTMLDivElement>(null)
    // 积分增长情况
    const [growthData, setGrowthData] = useState<
        Array<{
            date: string
            name: string
            value: string
        }>
    >([])
    // 积分增长情况年份
    const [growthYear, setGrowthYear] = useState<string>(
        moment().format('YYYY'),
    )
    const top5ParentRef = useRef<HTMLDivElement>(null)
    const businessModuleParentRef = useRef<HTMLDivElement>(null)
    const growthParentRef = useRef<HTMLDivElement>(null)
    const top5Size = useSize(top5ParentRef.current)
    const businessModuleSize = useSize(businessModuleParentRef.current)
    const growthSize = useSize(growthParentRef.current)

    useEffect(() => {
        createTop5Chart()
        createBusinessModuleChart()
        createGrowthChart()
    }, [])

    useEffect(() => {
        if (top5ChartRef.current) {
            getTop5Data()
        }
    }, [top5Year, top5ChartRef.current])

    useEffect(() => {
        if (top5Size?.width && top5Size?.height && top5ChartRef.current) {
            top5ChartRef.current.changeSize(top5Size.width, top5Size.height)
            top5ChartRef.current.render()
        }
    }, [top5Size, top5ChartRef.current])

    useEffect(() => {
        if (
            businessModuleSize?.width &&
            businessModuleSize?.height &&
            businessModuleChartRef.current
        ) {
            businessModuleChartRef.current.changeSize(
                businessModuleSize.width,
                businessModuleSize.height,
            )
            businessModuleChartRef.current.render()
        }
    }, [businessModuleSize, businessModuleChartRef.current])

    useEffect(() => {
        if (growthSize?.width && growthSize?.height && growthChartRef.current) {
            growthChartRef.current.changeSize(
                growthSize.width,
                growthSize.height,
            )
        }
    }, [growthSize, growthChartRef.current])
    /**
     * 创建部门积分 TOP 5 图表
     */
    const createTop5Chart = () => {
        if (containerTop5Ref.current) {
            // 获取containerTop5Ref.current的宽高
            const width = containerTop5Ref.current.clientWidth
            const height = containerTop5Ref.current.clientHeight
            top5ChartRef.current = new Bar(containerTop5Ref.current, {
                data: top5Data,
                width,
                height,
                xField: 'points',
                yField: 'name',
                meta: {
                    points: {
                        alias: __('积分'),
                    },
                    name: {
                        alias: __('部门'),
                    },
                },
                minBarWidth: 5,
                maxBarWidth: 40,
                autoFit: false,
            })

            top5ChartRef.current.render()
        }
    }

    /**
     * 创建业务模块积分图表
     */
    const createBusinessModuleChart = () => {
        if (containerBusinessModuleRef.current) {
            // 获取containerBusinessModuleRef.current的宽高
            const width = containerBusinessModuleRef.current.clientWidth
            const height = containerBusinessModuleRef.current.clientHeight
            businessModuleChartRef.current = new Bar(
                containerBusinessModuleRef.current,
                {
                    data: businessModulePoints,
                    width,
                    height,
                    xField: 'points',
                    yField: 'name',
                    meta: {
                        points: {
                            alias: __('积分'),
                        },
                        name: {
                            alias: __('业务模块'),
                        },
                    },
                    minBarWidth: 5,
                    maxBarWidth: 40,
                    autoFit: false,
                },
            )

            businessModuleChartRef.current.render()
        }
    }

    const createGrowthChart = () => {
        if (containerGrowthRef.current) {
            // 获取containerGrowthRef.current的宽高
            const width = containerGrowthRef.current.clientWidth
            const height = containerGrowthRef.current.clientHeight
            growthChartRef.current = new Line(containerGrowthRef.current, {
                data: growthData,
                width,
                height,
                xField: 'date',
                yField: 'value',
                legend: {
                    position: 'bottom',
                },
                seriesField: 'name',
                color: ['#1979C9', '#D62A0D', '#FAA219', '#00875A', '#126E82'],
            })

            growthChartRef.current.render()
        }
    }
    /**
     * 获取部门积分 TOP 5
     */
    const getTop5Data = async () => {
        try {
            const res = await getDepartmentIntegralTop5({
                year: top5Year,
                top: 5,
            })
            setTop5Data(res)
            if (top5ChartRef.current) {
                top5ChartRef.current.changeData(res)
            }
        } catch (err) {
            formatError(err)
        }
    }

    useEffect(() => {
        getBusinessModulePoints()
    }, [businessModuleYear, businessModuleChartRef.current])

    /**
     * 获取业务模块积分
     */
    const getBusinessModulePoints = async () => {
        try {
            const res = await getBusinessModuleIntegral({
                year: businessModuleYear,
            })
            setBusinessModulePoints(res)
            if (businessModuleChartRef.current) {
                businessModuleChartRef.current.changeData(
                    res.map((item) => ({
                        ...item,
                        name: businessModuleDisplay(item.id),
                    })),
                )
            }
        } catch (err) {
            formatError(err)
        }
    }

    useEffect(() => {
        getGrowthData()
    }, [growthYear, growthChartRef.current])

    /**
     * 格式化积分增长数据
     * @param columns
     * @param data
     * @returns
     */
    const formatGrowthData = (
        columns: Array<string>,
        data: Array<Array<string>>,
    ) => {
        const [date, ...rest] = columns
        const result = rest.map((item, index) => {
            return data.map((item2) => {
                return {
                    date: item2[0],
                    name: businessModuleDisplay(item) || '',
                    value: item2[index + 1],
                }
            })
        })
        return result.flat()
    }

    /**
     * 获取积分增长情况
     */
    const getGrowthData = async () => {
        try {
            const { columns, data } = await getIntegralGrowth({
                year: growthYear,
            })
            const result = formatGrowthData(columns, data)

            if (growthChartRef.current) {
                growthChartRef.current.changeData(result)
            }
            setGrowthData(result)
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <div className={styles.boardWrapper}>
            <div className={styles.boardItemWrapper}>
                <div className={styles.boardItem}>
                    <Card
                        title={
                            <div className={styles.titleContainer}>
                                <div className={styles.title}>
                                    {__('部门积分 TOP 5')}
                                </div>
                                <div>
                                    <DatePicker
                                        onChange={(value) => {
                                            setTop5Year(
                                                value?.format('YYYY') ||
                                                    moment().format('YYYY'),
                                            )
                                        }}
                                        picker="year"
                                        value={moment(top5Year, 'YYYY')}
                                        disabledDate={(current) =>
                                            // 选择当前时间之前的年限包含当前年限
                                            current.isAfter(
                                                moment().endOf('year'),
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        }
                        bordered={false}
                        style={{ width: '100%', height: '100%' }}
                        bodyStyle={{ height: 'calc(100% - 64px)' }}
                    >
                        <div
                            style={{ width: '100%', height: '100%' }}
                            ref={top5ParentRef}
                        >
                            <div ref={containerTop5Ref} />
                        </div>
                    </Card>
                </div>

                <div className={styles.boardItem}>
                    <Card
                        title={
                            <div className={styles.titleContainer}>
                                <div className={styles.title}>
                                    {__('业务模块积分')}
                                </div>
                                <div>
                                    <DatePicker
                                        onChange={(value) => {
                                            setBusinessModuleYear(
                                                value?.format('YYYY') ||
                                                    moment().format('YYYY'),
                                            )
                                        }}
                                        picker="year"
                                        value={moment(
                                            businessModuleYear,
                                            'YYYY',
                                        )}
                                        disabledDate={(current) =>
                                            // 选择当前时间之前的年限包含当前年限
                                            current.isAfter(
                                                moment().endOf('year'),
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        }
                        bordered={false}
                        style={{ width: '100%', height: '100%' }}
                        bodyStyle={{ height: 'calc(100% - 64px)' }}
                    >
                        <div
                            ref={businessModuleParentRef}
                            style={{ width: '100%', height: '100%' }}
                        >
                            <div ref={containerBusinessModuleRef} />
                        </div>
                    </Card>
                </div>
            </div>
            <div className={styles.boardItemWrapper}>
                <Card
                    title={
                        <div className={styles.titleContainer}>
                            <div className={styles.title}>
                                {__('积分增长情况')}
                            </div>
                            <div>
                                <DatePicker
                                    onChange={(value) => {
                                        setGrowthYear(
                                            value?.format('YYYY') ||
                                                moment().format('YYYY'),
                                        )
                                    }}
                                    picker="year"
                                    value={moment(growthYear, 'YYYY')}
                                    disabledDate={(current) =>
                                        // 选择当前时间之前的年限包含当前年限
                                        current.isAfter(moment().endOf('year'))
                                    }
                                />
                            </div>
                        </div>
                    }
                    bordered={false}
                    style={{ width: '100%', height: '100%' }}
                    bodyStyle={{ height: 'calc(100% - 64px)' }}
                >
                    <div
                        ref={growthParentRef}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <div ref={containerGrowthRef} />
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default Board
