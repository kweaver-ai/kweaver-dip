import { Column, ColumnOptions, measureTextWidth, Pie } from '@antv/g2plot'
import { round } from 'lodash'
import { ShareTypeEnum } from '../const'
import __ from './locale'
import { formatNumber } from '@/utils'

export const OverviewTabKey = {
    OVERVIEW: '1',
    CATEGORY_STATISTICS: '2',
}

export const datePickerOptions = [
    {
        value: 'month',
        label: __('按月'),
    },
    {
        value: 'quarter',
        label: __('按季度'),
    },
    {
        value: 'year',
        label: __('按年'),
    },
]

export enum StaticsType {
    // 审核中
    Aduiting = 'aduiting',
    // 已通过
    AuditPass = 'audit_pass',
    // 未通过
    AuditFail = 'audit_reject',
}

// 分类统计分类大类-审核、已通过、未通过
export enum ClassStaticsType {
    // 审核中
    Aduiting = 'aduiting',
    // 已通过
    Passed = 'pass',
    // 未通过
    Failed = 'reject',
}

// 分类统计大类项细分-发布、上线、下线
export enum ClassStaticsInnerType {
    Publish = 'publish',
    Online = 'online',
    Offline = 'offline',
}

// 挂接资源类型 1 库表 2 接口 3 文件 4 手工表
export const enum OverviewResTypeEnum {
    ALL = 'resource',
    VIEW = 'view',
    API = 'api',
    FILE = 'file',
    MANUAL = 'manual_form',
}

export const columnColorList = {
    [StaticsType.Aduiting]: '#3AA0FF',
    [StaticsType.AuditPass]: '#A0D7E7',
    [StaticsType.AuditFail]: '#8C7BEB',
    [ShareTypeEnum.UNCONDITION]: '#3AA0FF',
    [ShareTypeEnum.CONDITION]: '#A0D7E7',
    [ShareTypeEnum.NOSHARE]: '#8C7BEB',
    [OverviewResTypeEnum.VIEW]: '#3AA0FF',
    [OverviewResTypeEnum.API]: '#A0D7E7',
    [OverviewResTypeEnum.FILE]: '#8C7BEB',
    [OverviewResTypeEnum.MANUAL]: '#8C7BEB',
}

// 业务标准表统计-部门悬浮展示字段
export const formDepartTooltipItemKeys = ['rate', 'total_num', 'publish_num']

export const businFormStaticsItems = [
    {
        label: __('编目完成率'),
        key: 'rate',
    },
    {
        label: __('业务标准表总数'),
        key: 'total_num',
    },
    {
        label: __('未编目业务标准表'),
        key: 'uncataloged_num',
    },
    {
        label: __('已发布信息资源目录'),
        key: 'publish_num',
    },
]

// 部门提供目录统计-部门悬浮展示字段
export const departStaticsTooltipItems = [
    {
        label: __('提供目录占比'),
        key: 'rate',
    },
    {
        label: __('目录总数'),
        key: 'total_num',
    },
    {
        label: __('提供目录数'),
        key: 'publish_num',
    },
]

// 分组柱状图
export const StackedColumnPlot = (
    container: any,
    data: Array<any>,
    props?: Partial<ColumnOptions>,
): any => {
    if (!container) return undefined

    const { xField = 'x_audit_type', yField = 'y_type_count' } = props || {}

    // y轴最大值
    const yAxisMaxNum =
        10 **
        (Math.ceil(Math.max(...data.map((item) => item[yField]))).toString()
            .length || 2)
    // const yAxisMaxNum = Math.max(...data?.map((item) => item[yField]))
    const column = new Column(container, {
        data,
        isGroup: true,
        xField,
        yField,
        seriesField: 'name',
        padding: [32, 0, 32, 48],
        minColumnWidth: 22,
        maxColumnWidth: 22,
        // 分组柱状图 组内柱子间的间距 (像素级别)
        dodgePadding: 2,
        // 分组柱状图 组间的间距 (像素级别)
        // intervalPadding: 20,
        columnStyle: {
            radius: [4, 4, 0, 0],
            strokeOpacity: 0,
        },
        // 概览数据右上角展示
        legend: {
            visible: true,
            layout: 'horizontal',
            position: 'top-right',
            marker: {
                symbol: 'circle',
            },
        },
        color: ['#3AA0FF', '#A0D7E7', '#8C7BEB'],
        xAxis: {
            label: {
                autoRotate: false,
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
            min: 0,
            max: yAxisMaxNum || 1000,
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
        ...props,
    })

    return column
}

// 单个柱状图
export const ColumnPlot = (
    columnContainer: any,
    data: any,
    props?: Partial<ColumnOptions>,
): any => {
    if (!columnContainer) return undefined
    // y轴最大值
    const yAxisMaxNum =
        10 **
        (Math.ceil(Math.max(...data.map((item) => item.value))).toString()
            .length || 2)
    const column = new Column(columnContainer, {
        data,
        // isGroup: true,
        xField: 'label',
        yField: 'value',
        // seriesField: 'name',

        // title: {
        //     visible: true,
        //     text: '分组柱状图',
        // },
        // forceFit: true,
        // label: {
        //     visible: true,
        // },
        // groupField: 'name',
        // seriesField: 'x_audit_type',
        minColumnWidth: 22,
        maxColumnWidth: 22,
        // 分组柱状图 组内柱子间的间距 (像素级别)
        dodgePadding: 2,
        // 分组柱状图 组间的间距 (像素级别)
        intervalPadding: 20,
        // label: {
        //     // 可手动配置 label 数据标签位置
        //     position: 'middle', // 'top', 'middle', 'bottom'
        //     // 可配置附加的布局方法
        //     layout: [
        //         // 柱形图数据标签位置自动调整
        //         { type: 'interval-adjust-position' },
        //         // 数据标签防遮挡
        //         { type: 'interval-hide-overlap' },
        //         // 数据标签文颜色自动调整
        //         { type: 'adjust-color' },
        //     ],
        // },
        columnStyle: {
            radius: [4, 4, 0, 0],
            // fill: columnColorList[StaticsType.Aduiting],
            strokeOpacity: 0,
        },
        // legend: {
        //     visible: true,
        //     position: 'top-right',
        // },
        // color: ['#3AA0FF', '#A0D7E7', '#8C7BEB'],
        color: '#3AA0FF',
        // minColumnWidth: 24,
        // maxColumnWidth: 24,
        // tooltip,
        // label: {
        //     // 可手动配置 label 数据标签位置
        //     position: 'middle', // 'top', 'middle', 'bottom'
        //     // 可配置附加的布局方法
        //     layout: [
        //         // 柱形图数据标签位置自动调整
        //         { type: 'interval-adjust-position' },
        //         // 数据标签防遮挡
        //         { type: 'interval-hide-overlap' },
        //         // 数据标签文颜色自动调整
        //         { type: 'adjust-color' },
        //     ],
        // },
        xAxis: {
            label: {
                autoRotate: false,
                // formatter: (text) =>
                //     (text?.length || 0) > barChartInfo.len
                //         ? `${text.slice(0, barChartInfo.len)}...`
                //         : text,
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
            min: 0,
            max: yAxisMaxNum || 1000,
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
        ...props,
    })
    return column
}

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

const DefaultColor = 'rgba(0, 0, 0, 0.25)'

export const PiePlot = (chartContainer: any, data: any, props?: any) => {
    const { total = 0, angleField = 'value', colorField = 'type' } = props || {}

    return new Pie(chartContainer, {
        data,
        height: 180,
        appendPadding: [10, 0, 0, 10],
        angleField,
        colorField,
        color: (cField) => {
            const color =
                data?.find((o) => o[colorField] === cField?.[colorField])
                    ?.color || DefaultColor
            return color
        },
        radius: 0.8,
        innerRadius: 0.7,
        label: false,
        legend: {
            offsetX: -80,
            position: 'right',
            maxItemWidth: 200,
            itemHeight: 18,
            itemMarginBottom: 24,
            flipPage: true,
            radio: undefined,
            itemValue: {
                formatter: (text, item) => {
                    const newItem = data.filter(
                        (d) => d.type === item[angleField],
                    )?.[0]
                    return `    ${formatNumber(
                        newItem.value,
                        true,
                        '0',
                    )}   ${round(
                        ((newItem?.value || 0) / (total || 1)) * 100,
                        1,
                    )}%`
                },
            },
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
                const num = datum?.[0]?.[angleField] || 0
                const color = datum?.[0]?.data?.color || DefaultColor
                return `<div style="color: #fff; line-height: 1.8;font-size: 12px; disaply: inline-flex; align-items: center; gap: 16px;padding: 8px 0;line-height: 16px;">
                    <div style="display: inline-flex; align-items: flex-start;column-gap:8px; word-break:break-all">
                        <span style="width:8px;min-width:8px; height:8px;margin-top: 4px;border-radius:50%;background:${color}"></span>
                        ${title}
                    </div>
                    <span style=""> ${formatNumber(num, true, '0')}</span>
                    <span style="margin-left: 8px;"> ${round(
                        (num / (total || 1)) * 100,
                        1,
                    )}%</span>
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
                    const { width, height } = container.getBoundingClientRect()
                    const d = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2)
                    const text = datum ? datum.name : '目录总数'
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
                        ? `${datum?.[angleField]}  ${datum?.[angleField]}`
                        : `${formatNumber(
                              curdata?.reduce(
                                  (r, d) => r + (d?.[angleField] || 0),
                                  0,
                              ) || 0,
                              true,
                              '0',
                          )}`
                    return renderStatistic(width, text, {
                        fontSize: 16,
                    })
                },
            },
        },
        interactions: [{ type: 'element-active' }],
    })
}

// 共享统计
export const shareStaticsList = [
    {
        key: 'all_num',
        type: '无条件共享',
        color: '#3AA0FF',
    },
    {
        key: 'partial_num',
        type: '有条件共享',
        color: '#A0D7E7',
    },
    {
        key: 'none_num',
        type: '不予共享',
        color: '#8C7BEB',
    },
]

export const auditTypeListToColumnConfig = {
    publish_auditing_num: {
        name: '待审核',
        color: '#3AA0FF',
        x_audit_type: '发布审核',
        groupId: 'publish',
    },
    publish_pass_num: {
        name: '通过',
        color: '#A0D7E7',
        x_audit_type: '发布审核',
        groupId: 'publish',
    },
    publish_reject_num: {
        name: '未通过',
        color: '#8C7BEB',
        x_audit_type: '发布审核',
        groupId: 'publish',
    },
    online_auditing_num: {
        name: '待审核',
        color: '#3AA0FF',
        x_audit_type: '上线审核',
        groupId: 'online',
    },
    online_pass_num: {
        name: '通过',
        color: '#A0D7E7',
        x_audit_type: '上线审核',
        groupId: 'online',
    },
    online_reject_num: {
        name: '未通过',
        color: '#8C7BEB',
        x_audit_type: '上线审核',
        groupId: 'online',
    },
    offline_auditing_num: {
        name: '待审核',
        color: '#3AA0FF',
        x_audit_type: '下线审核',
        groupId: 'offline',
    },
    offline_pass_num: {
        name: '通过',
        color: '#A0D7E7',
        x_audit_type: '下线审核',
        groupId: 'offline',
    },
    offline_reject_num: {
        name: '未通过',
        color: '#8C7BEB',
        x_audit_type: '下线审核',
        groupId: 'offline',
    },
}
