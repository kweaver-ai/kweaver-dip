import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Pie, measureTextWidth } from '@antv/g2plot'
import { IHierarchy, formatError, getClassificationStats } from '@/core'
import { FontIcon } from '@/icons'
import styles from './styles.module.less'
import { Loader } from '@/ui'

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

const IHierarchyLabel = ({
    item,
    style,
}: {
    item: IHierarchy
    style: React.CSSProperties
}) => {
    const { color, name } = item
    return (
        <div className={styles['hierarchy-label']}>
            <FontIcon
                name="icon-biaoqianicon"
                className={styles['hierarchy-label-icon']}
                style={{ color }}
            />
            <span
                className={styles['hierarchy-label-name']}
                title={name}
                style={style}
            >
                {name}
            </span>
        </div>
    )
}

const DefaultColor = 'rgba(0, 0, 0, 0.25)'

type ITagGrading = {
    size: any
}
/**
 * 分级
 */
function TagGrading({ size }: ITagGrading) {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [total, setTotal] = useState<number>()
    const containerRef = useRef<HTMLDivElement>(null)
    const columnIns = useRef<Pie>()
    // 是否高分辨率  1920  > 1500
    const [isHigh, setIsHigh] = useState<boolean>(true)

    useEffect(() => {
        setIsHigh(size?.width >= 1500)
    }, [size])

    useEffect(() => {
        if (containerRef.current) {
            const column = new Pie(containerRef.current, {
                data,
                autoFit: true,
                padding: isHigh ? [35, 50, 35, 50] : [15, 30, 15, 30],
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
                legend: false,
                label: false,
                // label: {
                //     type: 'spider',
                //     content: '{name}: {percentage}',
                // },
                state: {
                    active: {
                        style: {
                            lineWidth: 0,
                            fillOpacity: 0.65,
                        },
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
                statistic: {
                    title: {
                        offsetY: -4,
                        style: {
                            fontSize: '14px',
                            fontWeight: 'normal',
                            color: 'rgba(0,0,0,0.45)',
                        },
                        customHtml: (container, view, datum) => {
                            const { width, height } =
                                container.getBoundingClientRect()
                            const d = Math.sqrt(
                                (width / 2) ** 2 + (height / 2) ** 2,
                            )
                            const text = datum ? datum.name : '总字段数'
                            return renderStatistic(d, text, { fontSize: 14 })
                        },
                    },
                    content: {
                        offsetY: 4,
                        style: {
                            fontSize: '32px',
                            fontWeight: 'normal',
                            color: 'rgba(0,0,0,0.85)',
                        },
                        customHtml: (container, view, datum, curdata) => {
                            const { width } = container.getBoundingClientRect()
                            const text = datum
                                ? `${datum.count}`
                                : `${curdata?.reduce((r, d) => r + d.count, 0)}`
                            return renderStatistic(width, text, {
                                fontSize: 32,
                            })
                        },
                    },
                },
                // 添加 中心统计文本 交互
                interactions: [{ type: 'element-active' }],
            })

            column.render()
            columnIns.current = column
        }
        return () => {
            columnIns.current?.destroy()
        }
    }, [data, isHigh])

    const loadData = async () => {
        try {
            setLoading(true)
            const ret = await getClassificationStats()
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
    }, [])

    // useMemo(() => {
    //     if (data) {
    //         columnIns.current?.changeData(data)
    //     }
    // }, [data])

    return (
        <div className={styles['grading-container']}>
            <div style={{ height: '100%' }} hidden={!loading}>
                <Loader />
            </div>
            <div
                className={styles['grading-container-graph']}
                style={{ visibility: loading ? 'hidden' : 'visible' }}
            >
                <div ref={containerRef} />
            </div>
            <div className={styles['tag-grading']} hidden={loading}>
                {data?.map((item) => (
                    <IHierarchyLabel
                        key={item.id}
                        item={item}
                        style={{ maxWidth: isHigh ? '120px' : '70px' }}
                    />
                ))}
            </div>
        </div>
    )
}

export default memo(TagGrading)
