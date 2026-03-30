import { resourceUtilizationOptions } from '../Apply/helper'
import { ApplyResource, applyResourceMap } from '../const'
import { DownloadFile } from '../Details/helper'
import __ from '../locale'

enum ResourceDetailsFieldType {
    Link = 'link',
    TimeRange = 'time_range',
    Table = 'table',
    Other = 'other',
}

export const analysisConfigViewFields = [
    {
        groupTitle: __('资源信息'),
        fields: [
            {
                key: ['res_name'],
                label: __('资源名称'),
                span: 12,
            },
            {
                key: ['res_code'],
                label: __('编码'),
                span: 12,
            },
            {
                key: ['org_path'],
                label: __('所属部门'),
                span: 12,
                title: ['org_path'],
            },
            {
                key: ['report'],
                label: __('数据质量报告'),
                span: 12,
                type: 'link',
            },
        ],
    },
    {
        groupTitle: __('资源使用配置'),
        fields: [
            {
                key: ['apply_conf', 'supply_type'],
                label: __('资源提供方式'),
                span: 12,
                render: (value: ApplyResource) =>
                    value ? applyResourceMap[value]?.text : '--',
            },
            {
                key: ['apply_conf', 'view_apply_conf', 'data_res_name'],
                label: __('数据资源名称'),
                span: 12,
            },
            {
                key: ['apply_conf', 'view_apply_conf', 'area_range'],
                label: __('期望空间范围'),
                span: 12,
            },
            {
                key: ['apply_conf', 'view_apply_conf', 'time_range'],
                label: __('期望时间范围'),
                span: 12,
            },
            {
                key: ['apply_conf', 'view_apply_conf', 'push_frequency'],
                label: __('期望推送频率'),
                span: 12,
            },
            {
                key: ['apply_conf', 'available_date_type'],
                label: __('资源使用期限'),
                span: 12,
                render: (val: number) =>
                    val || val === 0
                        ? resourceUtilizationOptions.find(
                              (item) => item.value === val,
                          )?.label
                        : '--',
            },
        ],
    },
    {
        groupTitle: __('数据推送配置'),
        fields: [
            {
                key: 'name',
                label: __('目标数据源'),
                span: 12,
                type: ResourceDetailsFieldType.Other,
            },
            {
                key: 'type',
                label: __('数据库类型'),
                span: 12,
                type: ResourceDetailsFieldType.Other,
            },
            {
                key: ['apply_conf', 'view_apply_conf', 'dst_view_name'],
                label: __('目标数据表'),
                span: 12,
            },
            {
                key: ['apply_conf', 'view_apply_conf', 'push_type'],
                label: __('推送机制'),
                span: 12,
                render: (val: string) =>
                    val === 'full' ? __('全量') : __('增量'),
            },
        ],
    },
]

export const analysisConfigApiFields = [
    {
        groupTitle: __('资源信息'),
        fields: [
            {
                key: ['res_name'],
                label: __('资源名称'),
                span: 12,
            },
            {
                key: ['apply_conf', 'api_apply_conf', 'data_res_code'],
                label: __('编码'),
                span: 12,
            },
            {
                key: ['org_path'],
                label: __('所属部门'),
                span: 24,
                title: 'org_path',
            },
        ],
    },
    {
        groupTitle: __('资源使用配置'),
        fields: [
            {
                key: ['apply_conf', 'supply_type'],
                label: __('资源提供方式'),
                span: 12,
                render: (value: ApplyResource) =>
                    value ? applyResourceMap[value]?.text : '--',
            },
            {
                key: ['apply_conf', 'api_apply_conf', 'data_res_name'],
                label: __('数据资源名称'),
                span: 12,
            },
            {
                key: ['apply_conf', 'api_apply_conf', 'call_frequency'],
                label: __('预计调用频率'),
                span: 12,
            },
            {
                key: ['apply_conf', 'available_date_type'],
                label: __('资源使用期限'),
                span: 12,
                render: (val: number) =>
                    val || val === 0
                        ? resourceUtilizationOptions.find(
                              (item) => item.value === val,
                          )?.label
                        : '--',
            },
        ],
    },
]

export const analysisConfigApiFieldsWithAppInfo = [
    ...analysisConfigApiFields,
    {
        groupTitle: __('申请方调用信息'),
        fields: [
            {
                key: ['app_name'],
                label: __('应用名称'),
                span: 24,
            },
            {
                key: ['passid'],
                label: 'PassID',
                span: 24,
            },
            {
                key: ['token'],
                label: 'Token',
                span: 24,
            },
            {
                key: ['ip_addr'],
                label: 'IP',
                span: 24,
            },
            {
                key: ['apply_conf', 'api_apply_conf', 'call_frequency'],
                label: __('调用频率'),
                span: 24,
            },
        ],
    },
    {
        groupTitle: __('提供方服务信息'),
        fields: [
            {
                key: ['service_name'],
                label: __('接口名称'),
                span: 24,
            },
            {
                key: ['service_path'],
                label: __('服务地址'),
                span: 24,
            },
        ],
    },
]

export const analysisConclusionConfig = [
    {
        label: __('可行'),
        value: 'feasible',
    },
    {
        label: __('部分可行'),
        value: 'partial',
    },

    {
        label: __('不可行'),
        value: 'unfeasible',
    },
]

export const analysisFieldsConfig = [
    {
        key: 'feasibility',
        label: __('分析结论'),
        value: '',
        span: 24,
        render: (val, record) =>
            analysisConclusionConfig.find(
                (item) => item.value === record.feasibility,
            )?.label,
    },
    {
        key: 'analyst',
        label: __('分析人'),
        value: '',
        span: 12,
    },
    {
        key: 'analyst_phone',
        label: __('分析人联系方式'),
        value: '',
    },
    {
        key: 'conclusion',
        label: __('分析及确认结果'),
        value: '',
        span: 24,
    },
    {
        key: 'usage',
        label: __('数据用途'),
        value: '',
        span: 24,
    },
]
