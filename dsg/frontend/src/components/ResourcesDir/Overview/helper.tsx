import { Column, ColumnOptions, measureTextWidth, Pie } from '@antv/g2plot'
import { round } from 'lodash'
import { ResTypeEnum, ShareTypeEnum } from '../const'
import __ from './locale'

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

export const resTypeList = [
    {
        label: '资源总数',
        value: OverviewResTypeEnum.ALL,
    },
    {
        label: '库表',
        value: OverviewResTypeEnum.VIEW,
    },
    {
        label: '接口服务',
        value: OverviewResTypeEnum.API,
    },
    // {
    //     label: '文件',
    //     value: OverviewResTypeEnum.FILE,
    // },
    // {
    //     label: '手工表',
    //     value: OverviewResTypeEnum.MANUAL,
    // },
]

// 分组柱状图
export const StackedColumnPlot = (
    container: any,
    data: Array<any>,
    props?: Partial<ColumnOptions>,
): any => {
    if (!container) return undefined

    const {
        xField = 'x_audit_type',
        yField = 'y_type_count',
        color,
        legend,
    } = props || {}

    // y轴最大值
    const yAxisMaxNum =
        10 **
        (Math.ceil(Math.max(...data.map((item) => item[yField]))).toString()
            .length || 2)
    // const yAxisMaxNum = Math.max(...data?.map((item) => item[yField]))
    const column = new Column(container, {
        data,
        // 有两个类别才能在分组中正常显示
        // isGroup: _.uniq(data?.map((item) => item[xField]) || [])?.length > 1,
        isGroup: true,
        xField: 'x_audit_type',
        yField: 'y_type_count',
        seriesField: 'name',
        padding: [32, 0, 32, 48],

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
        // 确保当只有一条数据时也能显示
        // meta: {
        //     [xField]: {
        //         min: 0,
        //     },
        //     [yField]: {
        //         min: 0,
        //     },
        // },
        // 分组柱状图 组内柱子间的间距 (像素级别)
        dodgePadding: 2,
        // 分组柱状图 组间的间距 (像素级别)
        // intervalPadding: 20,
        // 柱状图中柱子内文字显示
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
        // 概览数据右上角展示
        legend: legend || {
            visible: true,
            layout: 'horizontal',
            position: 'top-right',
            marker: {
                symbol: 'circle',
            },
        },
        color: color || ['#3AA0FF', '#A0D7E7', '#8C7BEB'],
        // minColumnWidth: 24,
        // maxColumnWidth: 24,
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
    // return new Pie(ref, {
    //     appendPadding: 10,
    //     data,
    //     angleField: 'value',
    //     colorField: 'type',
    //     radius: 1,
    //     innerRadius: 0.6,
    //     label: {
    //         type: 'inner',
    //         offset: '-50%',
    //         content: '{value}',
    //         style: {
    //             textAlign: 'center',
    //             fontSize: 14,
    //         },
    //     },
    //     interactions: [
    //         { type: 'element-selected' },
    //         { type: 'element-active' },
    //     ],
    //     statistic: {
    //         title: false,
    //         content: {
    //             style: {
    //                 whiteSpace: 'pre-wrap',
    //                 overflow: 'hidden',
    //                 textOverflow: 'ellipsis',
    //             },
    //             content: 'AntV\nG2Plot',
    //         },
    //     },
    // })

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
        // meta: {
        //     [angleField]: {
        //         alias: angleField,
        //         formatter: (v) => {
        //             return `${v}个`
        //         },
        //     },
        //     [colorField]: {
        //         alias: colorField,
        //         formatter: (v, index) => {
        //             const color =
        //                 data?.find((o) => o[colorField] === v)?.color ||
        //                 DefaultColor
        //             const num =
        //                 data?.find((o) => o[colorField] === v)?.value || 0
        //             return `${v}    ${num}  ${(
        //                 (num * 100) /
        //                 (total || 1)
        //             ).toFixed(2)}%`
        //             // return `<div>
        //             //  <div style="width: 108px;display: inline-flex; align-items: flex-start;column-gap:8px;color:rgba(0, 0, 0, 0.85); word-break:break-all">
        //             //     <span style="width:8px;min-width:8px; height:8px;margin-top: 7px;border-radius:50%;background:${color}"></span>
        //             //     ${v}
        //             // </div>
        //             // <span style="color:rgba(0, 0, 0, 0.85); margin-left: 16px;"> ${num}</span>
        //             // <span style="color:rgba(0, 0, 0, 0.85); margin-left: 8px;"> ${(
        //             //     (num * 100) /
        //             //     (total || 1)
        //             // ).toFixed(2)}%</span>
        //             // </div>`
        //         },
        //     },
        // },
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
                    return `    ${newItem.value}   ${round(
                        ((newItem?.value || 0) / (total || 1)) * 100,
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
                    <span style=""> ${num}</span>
                    <span style="margin-left: 8px;"> ${(
                        (num * 100) /
                        (total || 1)
                    ).toFixed(2)}%</span>
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
                        : `${curdata?.reduce(
                              (r, d) => r + (d?.[angleField] || 0),
                              0,
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

export enum CatlgUseTypeEnum {
    // 供需对接
    SupplyAndDemandConnection = 'supply_and_demand_connection',
    // 共享申请
    SharingApplication = 'sharing_application',
    // 数据分析
    DataAnalysis = 'data_analysis',
}

export const catlgUseStaticsList = [
    {
        type: CatlgUseTypeEnum.SupplyAndDemandConnection,
        label: '供需对接',
    },
    {
        type: CatlgUseTypeEnum.SharingApplication,
        label: '共享申请',
    },
    {
        type: CatlgUseTypeEnum.DataAnalysis,
        label: '数据分析',
    },
]

export enum CatlgFeedbackTypeEnum {
    // 目录反馈统计
    CatlgFeedback = 'catalog_feedback_statistics',
    // 数据质量问题
    CatlgDataQuality = 'data_quality_issues',
    // 不一致问题
    CatlgInconsistency = 'resource_catalog_mismatch',
    // 接口问题
    ApiProblem = 'interface_issues',
    // 其他问题
    Other = 'other',
}

export const catlgFeedbackList = [
    {
        label: __('目录信息错误'),
        value: CatlgFeedbackTypeEnum.CatlgFeedback,
    },
    {
        label: __('数据质量问题'),
        value: CatlgFeedbackTypeEnum.CatlgDataQuality,
    },
    {
        label: __('挂接字段和目录不一致'),
        value: CatlgFeedbackTypeEnum.CatlgInconsistency,
    },
    {
        label: __('接口问题'),
        value: CatlgFeedbackTypeEnum.ApiProblem,
    },
    {
        label: __('其他'),
        value: CatlgFeedbackTypeEnum.Other,
    },
]

export const rescCatlgStaticsGroupIds = {
    publish_auditing_catalog_count: {
        name: '待审核',
        color: '#3AA0FF',
        x_audit_type: '发布审核',
        groupId: 'publish',
    },
    publish_pass_catalog_count: {
        name: '通过',
        color: '#A0D7E7',
        x_audit_type: '发布审核',
        groupId: 'publish',
    },
    publish_reject_catalog_count: {
        name: '未通过',
        color: '#8C7BEB',
        x_audit_type: '发布审核',
        groupId: 'publish',
    },
    online_auditing_catalog_count: {
        name: '待审核',
        color: '#3AA0FF',
        x_audit_type: '上线审核',
        groupId: 'online',
    },
    online_pass_catalog_count: {
        name: '通过',
        color: '#A0D7E7',
        x_audit_type: '上线审核',
        groupId: 'online',
    },
    online_reject_catalog_count: {
        name: '未通过',
        color: '#8C7BEB',
        x_audit_type: '上线审核',
        groupId: 'online',
    },
    offline_auditing_catalog_count: {
        name: '待审核',
        color: '#3AA0FF',
        x_audit_type: '下线审核',
        groupId: 'offline',
    },
    offline_pass_catalog_count: {
        name: '通过',
        color: '#A0D7E7',
        x_audit_type: '下线审核',
        groupId: 'offline',
    },
    offline_reject_catalog_count: {
        name: '未通过',
        color: '#8C7BEB',
        x_audit_type: '下线审核',
        groupId: 'offline',
    },
}

// 共享统计
export const shareStaticsList = [
    {
        key: 'unconditional_shared',
        type: '无条件共享',
        // value: 380000,
        color: '#3AA0FF',
    },
    {
        key: 'conditional_shared',
        type: '有条件共享',
        // value: 52000,
        color: '#A0D7E7',
    },
    {
        key: 'not_shared',
        type: '不予共享',
        // value: 61000,
        color: '#8C7BEB',
    },
]

export const catlgFedbkStaticsList = [
    {
        type: CatlgFeedbackTypeEnum.CatlgFeedback,
        label: __('目录信息错误'),
    },
    {
        type: CatlgFeedbackTypeEnum.CatlgDataQuality,
        label: __('数据质量问题'),
    },
    {
        type: CatlgFeedbackTypeEnum.CatlgInconsistency,
        label: __('挂接资源和目录不一致'),
    },
    {
        type: CatlgFeedbackTypeEnum.ApiProblem,
        label: __('接口问题'),
    },
    {
        type: CatlgFeedbackTypeEnum.Other,
        label: __('其他'),
    },
]

export const rescTypeMap = {
    [ResTypeEnum.TABLE]: '库表',
    [ResTypeEnum.API]: '接口',
    [ResTypeEnum.FILE]: '文件',
    [ResTypeEnum.MANUAL]: '手工表',
}

export const classifiyRescTypeColorMap = {
    [rescTypeMap[ResTypeEnum.TABLE]]: '#A0D7E7',
    [rescTypeMap[ResTypeEnum.API]]: '#8894FF',
    [rescTypeMap[ResTypeEnum.FILE]]: '#79ADF7',
    [rescTypeMap[ResTypeEnum.MANUAL]]: '#59A3FF',
}
