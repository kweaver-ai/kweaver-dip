import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Pie, measureTextWidth } from '@antv/g2plot'
import { IHierarchy, formatError, getClassificationStats } from '@/core'
import { Empty, Loader } from '@/ui'
import styles from './styles.module.less'
import dataEmpty from '@/assets/dataEmpty.svg'

const DefaultColor = 'rgba(0, 0, 0, 0.25)'

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

/**
 * 分级字段占比
 */
function TagPie({ id }: { id: string }) {
    const [data, setData] = useState<any[]>([])
    const [total, setTotal] = useState<number>()
    const [loading, setLoading] = useState<boolean>()
    const containerRef = useRef<HTMLDivElement>(null)
    const columnIns = useRef<Pie>()
    useEffect(() => {
        if (containerRef.current) {
            const column = new Pie(containerRef.current, {
                data,
                height: 180,
                appendPadding: [10, 0, 0, 10],
                angleField: 'count',
                colorField: 'name',
                color: ({ name }) => {
                    const color =
                        data?.find((o) => o.name === name)?.color ||
                        DefaultColor
                    return color
                },
                radius: 1,
                innerRadius: 0.8,
                label: false,
                legend: {
                    offsetX: -20,
                    position: 'right',
                    maxItemWidth: 110,
                    itemHeight: 18,
                    itemMarginBottom: 24,
                    flipPage: true,
                    radio: undefined,
                    pageNavigator: {
                        marker: {
                            style: {
                                fill: 'rgb(0, 0, 0)',
                                opacity: 0.85,
                                inactiveFill: 'rgb(0, 0, 0)',
                                inactiveOpacity: 0.2,
                            },
                        },
                    },
                    background: {
                        padding: [32, 0, 0, 0],
                        style: { opacity: 0 },
                    },
                },
                tooltip: {
                    showTitle: false,
                    customContent: (title, datum) => {
                        const num = datum?.[0]?.value || 0
                        const color = datum?.[0]?.data?.color || DefaultColor
                        return `<div style="padding: 12px 4px ; line-height: 1.8; color: rgba(0, 0, 0, 0.45), font-size: 12px">
                            <div style="display: inline-flex; align-items: flex-start;column-gap:8px;color:rgba(0, 0, 0, 0.85);font-weight: 600; word-break:break-all">
                                <span style="width:8px;min-width:8px; height:8px;margin-top: 7px;border-radius:50%;background:${color}"></span>
                                ${title}
                            </div>
                            <div>数量: <span style="color:rgba(0, 0, 0, 0.85)"> ${num}</span></div>
                            <div>占比: <span style="color:rgba(0, 0, 0, 0.85)"> ${(
                                (num * 100) /
                                (total || 1)
                            ).toFixed(2)}%</span></div>
                        </div>`
                    },
                },
                state: {
                    active: {
                        style: {
                            lineWidth: 0,
                            fillOpacity: 0.65,
                        },
                    },
                },
                statistic: {
                    title: {
                        offsetY: -4,
                        style: {
                            fontSize: '12px',
                            fontWeight: 'normal',
                            color: 'rgb(0,0,0)',
                        },
                        customHtml: (container, view, datum) => {
                            const { width, height } =
                                container.getBoundingClientRect()
                            const d = Math.sqrt(
                                (width / 2) ** 2 + (height / 2) ** 2,
                            )
                            const text = datum ? datum.name : '字段总数'
                            return renderStatistic(d, text, { fontSize: 12 })
                        },
                    },
                    content: {
                        offsetY: 4,
                        style: {
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: 'rgb(0,0,0)',
                        },
                        customHtml: (container, view, datum, curdata) => {
                            const { width } = container.getBoundingClientRect()
                            const text = datum
                                ? `${datum.count}`
                                : `${curdata?.reduce((r, d) => r + d.count, 0)}`
                            return renderStatistic(width, text, {
                                fontSize: 16,
                            })
                        },
                    },
                },
                interactions: [{ type: 'element-active' }],
            })

            column.render()
            columnIns.current = column
        }
        return () => {
            columnIns.current?.destroy()
        }
    }, [data, total])

    const loadData = async () => {
        setLoading(true)
        try {
            const ret = await getClassificationStats(id)
            setTotal(ret?.total || 1)
            setData(ret?.hierarchy_tag || [])
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [id])

    // useMemo(() => {
    //     if (data) {
    //         columnIns.current?.changeData(data)
    //     }
    // }, [data])

    return (
        <div className={styles['tag-pie']} style={{ position: 'relative' }}>
            {loading && (
                <div
                    style={{ position: 'absolute', top: '70px', width: '100%' }}
                >
                    <Loader />
                </div>
            )}
            {!loading && !data?.length && (
                <div style={{ position: 'absolute', width: '100%' }}>
                    <Empty iconSrc={dataEmpty} desc="暂无数据" />
                </div>
            )}
            <div
                ref={containerRef}
                style={{
                    padding: '0 32px',
                    visibility: loading || !data?.length ? 'hidden' : 'visible',
                }}
            />
        </div>
    )
}

export default memo(TagPie)
