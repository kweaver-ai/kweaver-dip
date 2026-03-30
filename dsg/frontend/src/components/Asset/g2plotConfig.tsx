import React, { useEffect, useMemo, useRef } from 'react'
import { Pie, Line, Radar, G2 } from '@antv/g2plot'

const { registerTheme } = G2
registerTheme('custom-theme', {
    colors10: [
        '#4C94FD',
        '#6ADFB0',
        '#FFCA64',
        '#FF8F55',
        '#A2BFF8',
        '#2BB9DB',
        '#8980F8',
        '#C7E488',
        '#EF5B58',
        '#8FDEFA',
    ],
    colors20: [
        '#4C94FD',
        '#6ADFB0',
        '#FFCA64',
        '#FF8F55',
        '#A2BFF8',
        '#2BB9DB',
        '#8980F8',
        '#C7E488',
        '#EF5B58',
        '#8FDEFA',
        '#CCF1FF',
        '#FFDFA2',
        '#FFBC99',
        '#D5ACFF',
        '#BFDFD5',
        '#DBC38F',
        '#8098C2',
        '#9C68BF',
        '#259895',
        '#FD7AAE',
    ],
})

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
                height: 320,
                xField: 'item',
                yField: 'score',
                seriesField: 'user',
                theme: 'custom-theme',
                appendPadding: 10,
                meta: {
                    score: {
                        alias: '分数',
                        min: 50,
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
                // 开启辅助点
                point: {
                    size: 2,
                },
                legend: {
                    layout: 'vertical',
                    position: 'right',
                    itemHeight: 28,
                    padding: [0, 50, 0, 0],
                    pageNavigator: {
                        marker: {
                            style: {
                                size: 10,
                            },
                        },
                    },
                },
                tooltip: {
                    offset: 20,
                },
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
 * 环图
 */
export const PieGraph: React.FC<{
    dataInfo: { type: string; value: number }[]
    title: string
    content: number
}> = ({ dataInfo, title, content }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const pieIns = useRef<Pie>()
    const valueData = dataInfo.filter((item) => item.value)
    const nullData = dataInfo.filter((item) => !item.value)
    if (nullData && nullData.length) {
        valueData.push({
            type: '其他',
            value: 0,
        })
    }

    useEffect(() => {
        if (containerRef.current) {
            const pie = new Pie(containerRef.current, {
                data: valueData,
                // autoFit: true,
                height: 290,
                padding: 20,
                appendPadding: 10,
                angleField: 'value',
                colorField: 'type',
                radius: 1,
                innerRadius: 0.8,
                legend: false,
                theme: 'custom-theme',
                label: {
                    type: 'spider',
                    labelHeight: 18,
                    style: {
                        fontSize: 14,
                    },
                    formatter: (text, data, index) => {
                        return `${text.type}: ${text.value}`
                    },
                },
                interactions: [{ type: 'element-active' }],
                statistic: {
                    title: false,
                    content: {
                        style: {
                            whiteSpace: 'pre-wrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        },
                        customHtml: (container, view, datum) => {
                            return `<div style="margin-top:4px;font-size:18px;">${title}</div>`
                        },
                    },
                },
                state: {
                    // 设置【active】激活状态样式 - 无描边
                    active: {
                        style: {
                            lineWidth: 0,
                        },
                    },
                },
                tooltip: {
                    customContent: (name, data) => {
                        return name === '其他'
                            ? `<div style="padding:10px;max-width:300px">
                                <span style="
                                width:10px;
                                height:10px;
                                border-radius:50%;
                                margin-right: 10px;
                                display:inline-block;
                                background:${data[0]?.color}"></span>
                                <span style="word-break: break-all;">其他</span>
                                ${nullData
                                    .map((item) => {
                                        return `<div style="margin:10px 0;word-break: break-all;">${item.type} ： ${item.value}（个）</div>`
                                    })
                                    .join('')}</div>`
                            : `<div style="padding:10px;max-width:300px">
                            <span style="
                                width:10px;
                                height:10px;
                                border-radius:50%;
                                margin-right: 10px;
                                display:inline-block;
                                background:${data[0]?.color}"></span>
                            <span style="word-break: break-all;">${name}</span>
                            <div style="margin:10px 0">数量：${
                                data[0]?.value
                            }（个）</div>
                            <div>占比：${(
                                ((Number(data[0]?.value) || 0) / content) *
                                100
                            ).toFixed(2)}%</div>
                        </div>`
                    },
                },
            })

            pie.render()
            pieIns.current = pie
        }
        return () => {
            pieIns.current?.destroy()
        }
    }, [dataInfo])

    useMemo(() => {
        if (dataInfo) {
            pieIns.current?.changeData(dataInfo)
        }
    }, [dataInfo])

    return <div ref={containerRef} />
}

/**
 * 折线图
 */
export const LineMap: React.FC<{
    dataInfo: any
}> = ({ dataInfo }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const LineIns = useRef<Line>()

    useEffect(() => {
        if (containerRef.current) {
            const line = new Line(containerRef.current, {
                data: dataInfo,
                height: 280,
                xField: 'date',
                yField: 'value',
                yAxis: {
                    // nice: '11',
                    min: 60,
                    max: 90,
                },
                meta: {
                    value: {
                        formatter: (text) => {
                            return `${text}%`
                        },
                    },
                },
                seriesField: 'type',
                legend: {
                    layout: 'horizontal',
                    position: 'bottom',
                    itemHeight: 28,
                },
            })
            line.render()
            LineIns.current = line
        }
        return () => {
            LineIns.current?.destroy()
        }
    }, [])

    useMemo(() => {
        if (dataInfo) {
            LineIns.current?.changeData(dataInfo)
        }
    }, [dataInfo])

    return <div ref={containerRef} />
}
