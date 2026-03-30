import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Gauge, Line, Radar, Options } from '@antv/g2plot'
import { isNumber } from 'lodash'
import { useUnmount } from 'ahooks'
import __ from './locale'
import { DimensionColor, ScoreType } from './helper'

/**
 * 仪表盘
 */
export const DashBoard: React.FC<{
    dataInfo: number
    height?: number
    title?: string
    innerRadius?: number
    titleStyle?: Omit<Partial<CSSStyleDeclaration>, 'opacity'>
    contentStyle?: Omit<Partial<CSSStyleDeclaration>, 'opacity'>
}> = ({
    dataInfo,
    height = 100,
    title,
    titleStyle,
    contentStyle,
    innerRadius,
}) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const gaugeIns = useRef<Gauge>()
    const color = ['#EF5965', '#FFA263', '#FCC966', '#75B0F4', '#85D55F']
    const getColor = (percent) => {
        return percent < 0.6
            ? color[0]
            : percent < 0.75
            ? color[1]
            : percent < 0.8
            ? color[2]
            : percent < 0.85
            ? color[3]
            : color[4]
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
                appendPadding: [0, 0, 0, 0],
                innerRadius: innerRadius || 0.45,
                startAngle: Math.PI,
                endAngle: 2 * Math.PI,
                range: {
                    color: getColor(0.2),
                },
                type: 'meter',
                meter: {
                    steps: 60,
                    stepRatio: 0.3,
                },
                axis: false,
                indicator: {
                    pointer: {
                        style: {
                            stroke: '#00000080',
                            lineWidth: 4,
                        },
                    },
                    pin: undefined,
                },
            })

            gauge.render()
            gaugeIns.current = gauge
        }
        return () => {
            gaugeIns.current?.destroy()
        }
    }, [dataInfo])

    useMemo(() => {
        if (isNumber(dataInfo)) {
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
    radarProps?: Partial<Options>
}> = ({ dataInfo, padding = [0, 0, 0, 0], height = 160, radarProps }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const radarIns = useRef<Radar>()

    const dataList = useMemo(() => {
        return dataInfo?.map((o) => ({ ...o, score: o?.score ?? 0 }))
    }, [dataInfo])

    useEffect(() => {
        if (containerRef.current && dataList) {
            const radarPlot = new Radar(containerRef.current, {
                data: dataList,
                height,
                appendPadding: padding,
                xField: 'item',
                yField: 'score',
                lineStyle: { lineWidth: 2 },
                meta: {
                    score: {
                        alias: '分数',
                        min: 0,
                        max: 100,
                    },
                },
                xAxis: {
                    label: {
                        offset: 10,
                    },
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
                tooltip: {
                    customContent: (title, datum) => {
                        const isConf = ![undefined, null].includes(
                            dataInfo?.find((o) => o.item === title)?.score,
                        )
                        return `<div style="padding: 10px 4px ; line-height: 2; color: rgba(0, 0, 0, 0.75), font-size: 12px">
                            <div style="width: 120px"><div style="color:rgba(0, 0, 0, 0.85)"> ${title}</div></div>
                            <div style="width: 120px">${
                                isConf
                                    ? `<div style="color:rgba(0, 0, 0, 0.85);display:flex;align-items: center;justify-content: space-between">
                                            <span>
                                                <span style="background:rgb(58, 196, 255);width: 8px;height: 8px;border-radius: 50%;display: inline-block;margin-right: 8px;"></span>
                                                分数：
                                            </span>
                                            <span>${datum?.[0]?.value}</span>
                                        </div>`
                                    : `<div style="color:rgba(0, 0, 0, 0.45);text-align: center;">未配置规则</div>`
                            }</div>
                        </div>`
                    },
                },
                label: {
                    offset: 4,
                },
                yAxis: {
                    label: null,
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
                    color: 'l(0) 0:#00ff69 1:#3a8ff0',
                },
                // 开启辅助点
                point: undefined,
                ...radarProps,
            })
            radarPlot.render()
            radarIns.current = radarPlot
        }
        return () => {
            radarIns.current?.destroy()
        }
    }, [dataList])

    useMemo(() => {
        if (dataList) {
            radarIns.current?.changeData(dataList)
        }
    }, [dataList])

    return <div ref={containerRef} />
}

/**
 * 线图
 */
export const LineGraph: React.FC<{
    dataInfo: { name: string; time: string; score: number }[]
}> = ({ dataInfo }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const lineIns = useRef<Line>()
    useEffect(() => {
        if (containerRef.current) {
            const line = new Line(containerRef.current, {
                data: dataInfo,
                appendPadding: [0, 0, 10, 0],
                height: 100,
                xField: 'time',
                yField: 'score',
                seriesField: 'name',
                smooth: true,
                limitInPlot: false,
                color: ({ name }) => {
                    return DimensionColor[name]
                },
                tooltip: {
                    formatter: (datum) => {
                        return {
                            name: ScoreType[datum.name],
                            value: `${datum.score}分`,
                        }
                    },
                },
                legend: false,
                xAxis: false,
                yAxis: {
                    max: 100,
                    grid: {
                        line: {
                            style: {
                                opacity: 0.3,
                            },
                        },
                    },
                },
                point: {
                    color: ({ name }) => {
                        return DimensionColor[name]
                    },
                    size: 3,
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
