import React, { useEffect, useMemo, useRef } from 'react'
import { Space } from 'antd'
import { Pie, Column, Gauge } from '@antv/g2plot'
import { useSize } from 'ahooks'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import __ from './locale'
import dataEmpty from '@/assets/dataEmpty.svg'
import { TitleTipsLabel } from './components/TitleTipsLabel'

/**
 * 环图
 */
export const PieGraph: React.FC<{
    dataInfo: { type: string; value: number }[]
    color: string[]
    lengends: string[]
    title: string
    tips?: string[]
    height?: number
}> = ({ dataInfo, color, lengends, title, tips, height = 298 }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const pieIns = useRef<Pie>()
    const content = dataInfo.reduce((pre, cur) => {
        return pre + cur.value
    }, 0)

    useEffect(() => {
        if (containerRef.current && color) {
            const pie = new Pie(containerRef.current, {
                data: dataInfo,
                color,
                height,
                angleField: 'value',
                colorField: 'type',
                radius: 0.8,
                innerRadius: 0.75,
                legend: false,
                label: {
                    type: 'spider',
                    style: {
                        fontSize: 14,
                    },
                    content: (data) => {
                        return `${Math.round(data.percent * 100)}%\n${
                            data.value
                        }个字段`
                    },
                },
                statistic: {
                    title: false,
                    content: {
                        customHtml: () => {
                            return `<div>
                                        <div style="font-size:14px;
                                                    color:rgba(0, 0, 0, 0.45);
                                                    font-weight:normal"
                                        >总字段数</div>
                                        <div style="margin-top:4px;
                                                    font-size:26px;
                                                    color:rgba(0, 0, 0, 0.85);
                                                    font-weight:400"
                                        >${content}</div>
                                    </div>`
                        },
                    },
                },
                tooltip: false,
            })

            pie.render()
            pieIns.current = pie
        }
        return () => {
            pieIns.current?.destroy()
        }
    }, [dataInfo, color])

    useMemo(() => {
        if (dataInfo) {
            pieIns.current?.changeData(dataInfo)
        }
    }, [dataInfo])

    return (
        <div className={styles['content-pie']}>
            <div>
                <TitleTipsLabel label={title} tips={tips} showDot />
            </div>
            {content === 0 ? (
                <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
            ) : (
                <>
                    <div ref={containerRef} style={{ width: '100%' }} />
                    <Space className={styles['content-pie-lengend']} size={24}>
                        {lengends.map((it, index) => {
                            return (
                                <div
                                    key={index}
                                    className={
                                        styles['content-pie-lengendItem']
                                    }
                                >
                                    <span
                                        className={
                                            styles['content-pie-lengendLine']
                                        }
                                        style={{
                                            background: color[index],
                                        }}
                                    />
                                    <span>{it}</span>
                                </div>
                            )
                        })}
                    </Space>
                </>
            )}
        </div>
    )
}

/**
 * 柱状图
 */
export const ColumnMap: React.FC<{
    dataInfo: any
    disabled?: boolean
}> = ({ dataInfo, disabled }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const ColumnIns = useRef<Column>()
    const formCount = dataInfo.reduce((pre, cur) => {
        return pre + cur.value
    }, 0)
    const boxRef = useRef(null)
    const size = useSize(boxRef) || { width: 200, height: 280 }

    useEffect(() => {
        if (containerRef.current) {
            const column = new Column(containerRef.current, {
                data: dataInfo,
                width: size.width - 40,
                height: 280,
                autoFit: false,
                animation: false,
                xField: 'type',
                yField: 'value',
                color: 'rgb(176 217 255 / 85%)',
                // padding: [10, 0, 20, 20],
                xAxis: {
                    // label: {
                    //     autoHide: true,
                    //     autoRotate: false,
                    // },
                },
                yAxis: {
                    // title: {
                    //     text: __('业务表标准字段数量'),
                    //     spacing: 16,
                    // },
                    grid: {
                        line: {
                            style: {
                                lineDash: [4, 5],
                            },
                        },
                    },
                },
                // meta: {
                //     type: {
                //         alias: __('业务表标准字段数量'),
                //     },
                //     sales: {
                //         alias: __('业务标准表数量'),
                //     },
                // },
                maxColumnWidth: 24,
                tooltip: {
                    customContent: (title, datum) => {
                        return `<div style="font-size: 12px; color: rgba(0, 0, 0, 0.45); padding: 16px 0;">
                                    <div style="margin-bottom: 8px;">
                                            ${__('业务表标准字段数量：')}
                                            <span style="color: rgba(0, 0, 0, 0.65);">${title}
                                            ${__('个')}</span>
                                    </div>
                                    <div style="display: flex;">
                                        ${__('业务标准表数量：')}
                                        <span style="color: rgba(0, 0, 0, 0.65); text-align: right; flex: 1;">${
                                            datum[0]?.value
                                        }${__('张')}</span>
                                    </div>
                                </div>`
                    },
                },
            })
            column.render()
            ColumnIns.current = column
        }
        return () => {
            ColumnIns.current?.destroy()
        }
    }, [])

    useMemo(() => {
        if (ColumnIns?.current && dataInfo && formCount > 0) {
            ColumnIns.current?.changeData(dataInfo)
        }
    }, [dataInfo])

    useMemo(() => {
        if (ColumnIns?.current && size?.width) {
            ColumnIns?.current?.changeSize(size.width - 40, 280)
        }
    }, [size?.width])

    const empty = () => {
        return (
            <Empty
                iconSrc={dataEmpty}
                desc={disabled ? __('未检测') : __('暂无数据')}
                style={{ minHeight: 260 }}
            />
        )
    }

    return (
        <div>
            {formCount === 0 && empty()}
            <div
                className={styles.columnInsBox}
                hidden={formCount === 0}
                ref={boxRef}
            >
                <div className={styles.columnInsYTitle}>
                    {__('业务标准表数量')}
                </div>
                <div className={styles.right}>
                    <div ref={containerRef} />
                    <div className={styles.columnInsXTitle}>
                        {__('业务表标准字段数量')}
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * 仪表盘
 */
export const DashBoard: React.FC<{ dataInfo: number }> = ({ dataInfo }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const gaugeIns = useRef<Gauge>()
    const color = ['#F4664A', '#FAAD14', '#30BF78']
    const getColor = (percent) => {
        return percent < 1 / 3
            ? color[0]
            : percent < 2 / 3
            ? color[1]
            : color[2]
    }
    // const [timer, setTimer] = useState<any>()

    // useUnmount(() => {
    //     clearInterval(timer)
    // })

    useEffect(() => {
        if (containerRef.current) {
            const gauge = new Gauge(containerRef.current, {
                percent: dataInfo / 100,
                width: 180,
                height: 150,
                innerRadius: 0.75,
                padding: [0, 0, 8, 0],
                range: {
                    color: getColor(dataInfo / 100),
                },
                type: 'meter',
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
                indicator: false,
                statistic: {
                    title: {
                        formatter: (datum) => {
                            return `${Number(
                                ((datum?.percent || 0) * 100).toFixed(2),
                            )}%`
                        },
                        offsetY: -40,
                        style: {
                            fontSize: '26px',
                            fontWeight: 550,
                            color: 'rgba(0, 0, 0, 0.85)',
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
        if (gaugeIns.current && dataInfo) {
            const percData = dataInfo / 100
            gaugeIns.current?.changeData(percData)
            gaugeIns.current?.update({
                range: { color: getColor(percData) },
            })
        }
    }, [dataInfo])

    return <div ref={containerRef} />
}
