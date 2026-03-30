import { Column } from '@antv/g2plot'
import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import { stubFalse } from 'lodash'
import { formatError, getClassification } from '@/core'
import styles from './styles.module.less'
import { Loader } from '@/ui'

const ColumnSize = {
    true: [110, 130],
    false: [70, 85],
}

/**
 * 分类
 */
function TagClassification({ style, size, isGradeOpen }: any) {
    const [data, setData] = useState<any[]>([])
    const containerRef = useRef<HTMLDivElement>(null)
    const columnIns = useRef<Column>()
    const [canScroll, setCanScroll] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const [info, setInfo] = useState<{ len: number; width: number }>({
        len: 7,
        width: 120,
    })

    useEffect(() => {
        setCanScroll(data?.length > (isGradeOpen ? 6 : 12))
    }, [data, isGradeOpen])

    useEffect(() => {
        const isFull = (size?.width || 0) >= 1500
        const curLen = isFull ? 7 : 5

        const curWidth = ColumnSize[`${isFull}`]?.[isGradeOpen ? 0 : 1]
        setInfo({
            len: curLen,
            width: curWidth,
        })
    }, [isGradeOpen, size])
    useEffect(() => {
        if (containerRef.current) {
            const column = new Column(containerRef.current, {
                data,
                autoFit: true,
                padding: [10, 20, 32, 30],
                appendPadding: [4, 10, 24, 30],
                xField: 'name',
                yField: 'classified_num',
                columnWidthRatio: 0.38,
                columnBackground: {
                    style: { fill: 'transparent' },
                },
                tooltip: {
                    showTitle: false,
                    customContent: (title, datum) => {
                        return `<div style="padding: 12px 8px ; line-height: 1.8; color: rgba(0, 0, 0, 0.45), font-size: 12px">
                            <div>主题域分组： <span style="color:rgba(0, 0, 0, 0.85)"> ${title}</span></div>
                            <div>已分类字段： <span style="color:rgba(0, 0, 0, 0.85)"> ${datum?.[0]?.value}个</span></div>
                        </div>`
                    },
                },

                xAxis: {
                    label: {
                        autoRotate: false, // 6 7
                        formatter: (text) =>
                            text?.length > info.len
                                ? `${text.slice(0, info.len)}...`
                                : text,
                    },
                    line: {
                        style: {
                            stroke: 'rgb(217, 217, 217)',
                            lineWidth: 1,
                            lineDash: [0, 0],
                        },
                    },
                },
                yAxis: {
                    title: {
                        text: '',
                        position: 'center',
                        spacing: 16,
                    },
                    grid: {
                        line: {
                            type: 'line',
                            style: {
                                lineDash: [3, 3],
                                lineWidth: 1,
                                stroke: 'rgb(232, 232, 232)',
                            },
                        },
                    },
                },
                columnStyle: {
                    fill: 'rgb(57, 158, 255)',
                    strokeOpacity: 0,
                },
                scrollbar: canScroll
                    ? {
                          type: 'horizontal',
                          categorySize: info.width,
                          animate: false,
                      }
                    : undefined,
                minColumnWidth: 32,
                maxColumnWidth: 48,
                // 添加 中心统计文本 交互
                interactions: [
                    {
                        type: 'element-highlight',
                    },
                ],
            })

            column.render()
            columnIns.current = column
        }
        return () => {
            columnIns.current?.destroy()
        }
    }, [info, canScroll])

    const loadData = async () => {
        try {
            setLoading(true)
            const ret = await getClassification({
                display: 'list',
                open_hierarchy: true,
            })
            setData(ret?.entries || [])
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    useMemo(() => {
        if (data) {
            columnIns.current?.changeData(data)
        }
    }, [data])

    return (
        <div className={styles['classify-box']} style={style}>
            <div style={{ height: '100%' }} hidden={!loading}>
                <Loader />
            </div>

            <div className={styles['classify-box-label']} hidden={loading}>
                已分类字段数量
            </div>
            <div
                ref={containerRef}
                style={{
                    height: '100%',
                    visibility: loading ? 'hidden' : 'visible',
                }}
            />
        </div>
    )
}

export default memo(TagClassification)
