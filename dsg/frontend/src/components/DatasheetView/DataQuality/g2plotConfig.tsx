import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Gauge, Line, Radar } from '@antv/g2plot'
import { useUnmount } from 'ahooks'
import __ from './locale'

/**
 * 仪表盘
 */
export const DashBoard: React.FC<{
    dataInfo: number
    height?: number
    titleStyle?: Omit<Partial<CSSStyleDeclaration>, 'opacity'>
    contentStyle?: Omit<Partial<CSSStyleDeclaration>, 'opacity'>
}> = ({ dataInfo, height = 210, titleStyle, contentStyle }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const gaugeIns = useRef<Gauge>()
    const color = ['#E60012', '#FAAC14', '#3A8FF0', '#52C41B']
    const getColor = (percent) => {
        return percent < 0.4
            ? color[0]
            : percent < 0.6
            ? color[1]
            : percent < 0.8
            ? color[2]
            : color[3]
    }
    const [timer, setTimer] = useState<any>()

    useUnmount(() => {
        clearInterval(timer)
    })

    useEffect(() => {
        if (containerRef.current) {
            const gauge = new Gauge(containerRef.current, {
                percent: 0,
                height,
                appendPadding: [0, 0, 80, 0],
                innerRadius: 0.75,
                startAngle: -Math.PI,
                endAngle: 0,
                range: {
                    color: getColor(0.2),
                },
                type: 'meter',
                meter: {
                    steps: 80,
                    stepRatio: 0.3,
                },
                axis: {
                    label: {
                        formatter(v) {
                            return Number(v) * 100
                        },
                    },
                    subTickLine: {
                        count: 3,
                    },
                },
                indicator: {
                    pointer: {
                        style: {
                            stroke: '#D0D0D0',
                            lineWidth: 4,
                        },
                    },
                    pin: undefined,
                },
                statistic: {
                    title: {
                        formatter: (datum) => {
                            return `${Math.floor(dataInfo * 100) / 100}分`
                        },
                        offsetY: 50,
                        style: titleStyle || {
                            fontSize: '26px',
                            color: '#4C4C4C',
                        },
                    },
                    content: {
                        formatter: (datum) => {
                            if (datum?.percent < 0.4) {
                                return __('质量不及格')
                            }
                            if (datum?.percent < 0.6) {
                                return __('质量中等')
                            }
                            if (datum?.percent < 0.8) {
                                return __('质量良好')
                            }
                            if (datum?.percent === 1) {
                                return __('质量优秀')
                            }
                            return __('质量优秀')
                        },
                        offsetY: 90,
                        style: contentStyle || {
                            fontSize: '16px',
                            color: '#626262',
                        },
                    },
                },
            })
            gauge.render()
            gaugeIns.current = gauge
        }
        return () => {
            gaugeIns.current?.destroy()
        }
    }, [])

    useMemo(() => {
        if (dataInfo) {
            let temp = 0
            const percData = dataInfo / 100
            const interval = setInterval(() => {
                if (temp >= percData) {
                    gaugeIns.current?.changeData(percData)
                    gaugeIns.current?.update({
                        range: { color: getColor(percData) },
                    })
                    clearInterval(interval)
                } else {
                    gaugeIns.current?.changeData(temp)
                    gaugeIns.current?.update({
                        range: { color: getColor(temp) },
                    })
                    temp += percData / 10
                }
            }, 50)
            setTimer(interval)
        }
    }, [dataInfo])

    return <div ref={containerRef} />
}

/**
 * 雷达图
 */
export const RadarMap: React.FC<{
    dataInfo: any[]
    padding?: any[]
    height?: number
}> = ({ dataInfo, padding = [20, 0, 0, 0], height = 230 }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const radarIns = useRef<Radar>()

    useEffect(() => {
        if (containerRef.current && dataInfo) {
            const radarPlot = new Radar(containerRef.current, {
                data: dataInfo,
                height,
                appendPadding: padding,
                xField: 'item',
                yField: 'score',
                meta: {
                    score: {
                        alias: '分数',
                        min: 0,
                        max: 100,
                    },
                },
                xAxis: {
                    line: null,
                    tickLine: null,
                    grid: {
                        line: {
                            style: {
                                lineDash: null,
                            },
                        },
                    },
                },
                yAxis: {
                    line: null,
                    tickLine: null,
                    grid: {
                        line: {
                            type: 'line',
                            style: {
                                lineDash: null,
                            },
                        },
                    },
                },
                // 开启面积
                area: {
                    color: 'l(0) 0:#B8E1FF 1:#3D76DD',
                },
                // 开启辅助点
                point: undefined,
            })
            radarPlot.render()
            radarIns.current = radarPlot
        }
        return () => {
            radarIns.current?.destroy()
        }
    }, [dataInfo])

    useMemo(() => {
        if (dataInfo) {
            radarIns.current?.changeData(dataInfo)
        }
    }, [dataInfo])

    return <div ref={containerRef} />
}

/**
 * 线图
 */
export const LineGraph: React.FC<{
    dataInfo: { type: string; value: number }[]
}> = ({ dataInfo }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const lineIns = useRef<Line>()

    useEffect(() => {
        if (containerRef.current) {
            const line = new Line(containerRef.current, {
                data: dataInfo,
                appendPadding: [0, 0, 16, 0],
                height: 230,
                xField: 'explore_time',
                yField: 'score',
                smooth: true,
                limitInPlot: false,
                tooltip: {
                    customContent: (name, data) => {
                        return `<div style="
                                    padding:10px;
                                    max-width:300px;
                                    color:#fff;">
                                <div style="word-break: break-all;margin-bottom:8px">${name}</div>
                                <div>${data[0]?.value} 分</div>
                            </div>`
                    },
                },
                xAxis: false,
                yAxis: {
                    max: 100,
                },
                point: {
                    size: 4,
                    style: {
                        fill: 'white',
                        stroke: '#2593fc',
                        lineWidth: 2,
                    },
                },
            })

            line.render()
            lineIns.current = line
        }
        return () => {
            lineIns.current?.destroy()
        }
    }, [])

    useMemo(() => {
        if (dataInfo) {
            lineIns.current?.changeData(dataInfo)
        }
    }, [dataInfo])

    return <div ref={containerRef} />
}
