import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Gauge, Pie, measureTextWidth, Radar, RadialBar } from '@antv/g2plot'
import { useUnmount } from 'ahooks'
import { valuesIn } from 'lodash'

/**
 * 仪表盘
 */
export const DashBoard: React.FC<{ dataInfo: number }> = ({ dataInfo }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const gaugeIns = useRef<Gauge>()
    const color = ['#F4664A', '#FAAD14', '#30BF78']
    const getColor = (percent) => {
        return percent < 0.4 ? color[0] : percent < 0.8 ? color[1] : color[2]
    }
    const [timer, setTimer] = useState<any>()

    useUnmount(() => {
        clearInterval(timer)
    })

    useEffect(() => {
        if (containerRef.current) {
            const gauge = new Gauge(containerRef.current, {
                percent: 0,
                // width: 300,
                height: 280,
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
                            return `${((datum?.percent || 0) * 100).toFixed(
                                0,
                            )}分`
                        },
                        offsetY: 50,
                        style: {
                            fontSize: '26px',
                            fontWeight: 550,
                            color: '#4C4C4C',
                        },
                    },
                    content: {
                        formatter: (datum) => {
                            if (datum?.percent < 0.4) {
                                return '评分较差，请抓紧提高分数'
                            }
                            if (datum?.percent < 0.8) {
                                return '待提升，有较大优化空间，请继续努力'
                            }
                            if (datum?.percent === 1) {
                                return '评分优秀，请继续加油保持'
                            }
                            return '质量评分较好，请争取优秀'
                        },
                        offsetY: 90,
                        style: {
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
}> = ({ dataInfo }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const radarIns = useRef<Radar>()

    useEffect(() => {
        if (containerRef.current && dataInfo) {
            const radarPlot = new Radar(containerRef.current, {
                data: dataInfo,
                height: 280,
                appendPadding: [20, 0, 0, 0],
                xField: 'dimension_name',
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

    // useMemo(() => {
    //     if (dataInfo) {
    //         radarIns.current?.changeData(dataInfo)
    //     }
    // }, [dataInfo])

    return <div ref={containerRef} />
}

/**
 * 环图
 */
export const RingGraph: React.FC<{
    dataInfo: { type: string; value: number }[]
}> = ({ dataInfo }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const pieIns = useRef<Pie>()

    function renderStatistic(containerWidth, text, style) {
        const textWidth = measureTextWidth(text, style)
        const textHeight = style.lineHeight || style.fontSize
        const R = containerWidth / 2
        // r^2 = (w / 2)^2 + (h - offsetY)^2
        let scale = 1
        if (containerWidth < textWidth) {
            scale = Math.min(
                Math.sqrt(
                    Math.abs(R ** 2 / ((textWidth / 2) ** 2 + textHeight ** 2)),
                ),
                1,
            )
        }
        const textStyleStr = `width:${containerWidth - 4}px;`
        return `<div style="${textStyleStr};font-size:${
            textHeight || 12
        }px;line-height:${
            scale < 1 ? 1 : 'inherit'
        }; white-space: nowrap; text-overflow: ellipsis;overflow:hidden;">${text}</div>`
    }

    useEffect(() => {
        if (containerRef.current) {
            const pie = new Pie(containerRef.current, {
                data: dataInfo,
                // width: 300,
                height: 280,
                angleField: 'value',
                colorField: 'type',
                radius: 0.9,
                innerRadius: 0.7,
                label: {
                    type: 'inner',
                    offset: '-50%',
                    content: '{value}',
                    style: {
                        textAlign: 'center',
                        fontSize: 14,
                    },
                },
                interactions: [
                    { type: 'element-selected' },
                    { type: 'element-active' },
                    // { type: 'pie-statistic-active' },
                ],
                statistic: {
                    title: {
                        offsetY: -4,
                        style: {
                            fontSize: '32px',
                            color: '#666666',
                            fontWeight: 550,
                        },
                        customHtml: (container, view, datum, data) => {
                            const { width } = container.getBoundingClientRect()

                            const text = datum
                                ? `${datum.value}`
                                : `${data?.reduce((r, d) => r + d.value, 0)}`
                            return text
                        },
                    },
                    content: {
                        offsetY: 8,
                        style: {
                            fontSize: '16px',
                            color: '#666666',
                            fontWeight: 550,
                        },
                        customHtml: (container, view, datum) => {
                            const { width, height } =
                                container.getBoundingClientRect()
                            const d = Math.sqrt(
                                (width / 2) ** 2 + (height / 2) ** 2,
                            )
                            const text = datum ? datum.type : '执行规则总数'
                            return text
                        },
                    },
                },
            })

            pie.render()
            pieIns.current = pie
        }
        return () => {
            pieIns.current?.destroy()
        }
    }, [])

    useMemo(() => {
        if (dataInfo) {
            pieIns.current?.changeData(dataInfo)
        }
    }, [dataInfo])

    return <div ref={containerRef} />
}

/**
 * 玉玦图
 */
export const JadeRingMap: React.FC<{
    dataInfo: { type: string; value: number }[]
}> = ({ dataInfo }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const radialBarIns = useRef<RadialBar>()

    const getCount = (data: any[]): string =>
        `${data?.reduce((r, d) => r + (valuesIn(d)?.[1] || 0), 0)}`

    useEffect(() => {
        if (containerRef.current) {
            const bar = new RadialBar(containerRef.current, {
                data: dataInfo,
                xField: 'type',
                yField: 'value',
                height: 280,
                radius: 0.8,
                innerRadius: 0.7,
                barBackground: {},
                tooltip: {
                    formatter: (datum) => {
                        return { name: '数量', value: datum.value }
                    },
                },
                annotations: [
                    {
                        type: 'text',
                        position: ['50%', '45%'],
                        content: getCount([]),
                        style: {
                            textAlign: 'center',
                            fontSize: 32,
                            fontWeight: 550,
                            color: '#666666',
                        },
                    },
                    {
                        type: 'text',
                        position: ['50%', '58%'],
                        content: '执行规则总数',
                        style: {
                            textAlign: 'center',
                            fontSize: 16,
                            fontWeight: 550,
                        },
                    },
                ],
            })
            bar.render()

            radialBarIns.current = bar
        }
        return () => {
            radialBarIns.current?.destroy()
        }
    }, [])

    useMemo(() => {
        if (dataInfo) {
            radialBarIns.current?.changeData(dataInfo)
            radialBarIns.current?.update({
                annotations: [
                    {
                        type: 'text',
                        position: ['50%', '45%'],
                        content: getCount(dataInfo),
                        style: {
                            textAlign: 'center',
                            fontSize: 32,
                            fontWeight: 550,
                            color: '#666666',
                        },
                    },
                    {
                        type: 'text',
                        position: ['50%', '58%'],
                        content: '执行规则总数',
                        style: {
                            textAlign: 'center',
                            fontSize: 16,
                            fontWeight: 550,
                        },
                    },
                ],
            })
        }
    }, [dataInfo])

    return <div ref={containerRef} />
}
