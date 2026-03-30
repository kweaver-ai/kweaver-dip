import { Pie } from '@antv/g2plot'

export const generatePie = (
    data: any,
    domRef: string | HTMLElement,
    title: string,
    color: string[] = ['#5B91FF', '#A5D9E8'],
) => {
    const piePlot = new Pie(domRef, {
        appendPadding: 10,
        data,
        angleField: 'value',
        colorField: 'type',
        radius: 1,
        innerRadius: 0.64,
        meta: {
            value: {
                formatter: (v) => `${v}`,
            },
        },
        color,
        label: false,
        legend: false,
        statistic: {
            title: {
                content: title,
                offsetY: -8,
            },
            content: {
                offsetY: -4,
            },
        },
    })
    piePlot.render()
    return piePlot
}
