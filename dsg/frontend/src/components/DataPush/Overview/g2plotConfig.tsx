import React, { useEffect, useMemo, useRef } from 'react'
import { Column, G2 } from '@antv/g2plot'

const colors10 = [
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
]

const colors20 = [
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
]

const { registerTheme } = G2
registerTheme('custom-theme', {
    colors10,
    colors20,
})

/**
 * 柱状图
 */
export const ColumnMap: React.FC<{
    dataInfo: any
}> = ({ dataInfo }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const ColumnIns = useRef<Column>()

    useEffect(() => {
        if (containerRef.current) {
            const column = new Column(containerRef.current, {
                data: dataInfo,
                height: 280,
                xField: 'name',
                yField: 'value',
                color: '#1890FF',
                xAxis: {
                    label: {
                        autoHide: true,
                        autoRotate: false,
                    },
                },
                yAxis: {
                    grid: {
                        line: {
                            style: {
                                lineDash: [4, 5],
                            },
                        },
                    },
                },
                maxColumnWidth: 34,
                tooltip: {
                    customContent: (title, datum) => {
                        return `<div style="font-size:12px;
                                            color:rgba(0, 0, 0, 0.45);
                                            padding:16px 0;">
                                    <div >
                                        推送数量：
                                        <span style="color:rgba(0, 0, 0, 0.65);">${datum[0]?.value}</span>
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
        if (dataInfo) {
            ColumnIns.current?.changeData(dataInfo)
        }
    }, [dataInfo])

    return <div ref={containerRef} />
}
