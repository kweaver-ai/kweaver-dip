import { SortDirection } from '@/core'
import __ from './locale'

export const menus = [
    { key: 'name', label: __('按需求名称排序') },
    { key: 'created_at', label: __('按创建时间排序') },
    { key: 'updated_at', label: __('按更新时间排序') },
]

export const defaultMenu = {
    key: 'created_at',
    sort: SortDirection.DESC,
}

export enum StatusEnum {
    ALL = 5,
    TOBEANALYZED = 6,
    ANALYSISING = 7,
    ANALYZED = 8,
}

export interface IStatus {
    name: string
    key: StatusEnum
}
export const statusList = [
    {
        key: StatusEnum.ALL,
        name: '全部',
    },
    {
        key: StatusEnum.TOBEANALYZED,
        name: '待分析',
    },
    {
        key: StatusEnum.ANALYSISING,
        name: '分析中',
    },
    {
        key: StatusEnum.ANALYZED,
        name: '已分析',
    },
]

// 用于列表展示
export const requireStatus = {
    2: {
        name: '待分析',
        class: 'tobeanalyzed',
    },
    3: {
        name: '分析中',
        class: 'analysising',
    },
    4: {
        name: '分析驳回',
        class: 'reject',
    },
    5: {
        name: '待审核',
        class: 'tobereviewed',
    },
    // 6: {
    //     name: '审核驳回',
    //     class: 'analysising',
    // },
    // 7: {
    //     name: '待确认',
    //     class: 'analysising',
    // },
    // 8: {
    //     name: '确认驳回',
    //     class: 'analysising',
    // },
}

export enum RequirementFieldType {
    TIME = 'time',
    TAG = 'tag',
    FILE = 'file',
}

export const requirementDetailsInfo = [
    {
        title: '需求信息',
        key: 1,
        fields: [
            {
                label: '需求名称：',
                value: 'demand_title',
            },
            {
                label: '需求描述：',
                value: 'description',
            },
            {
                label: '应用方向分类：',
                value: 'app_direction',
            },
            {
                label: '业务应用场景：',
                value: 'rela_scenes',
                type: RequirementFieldType.TAG,
            },
            {
                label: '关联信息系统：',
                value: 'rela_business_system',
            },
            // {
            //     label: '关联业务事项：',
            //     value: 'rela_matters',
            //     type: RequirementFieldType.TAG,
            // },
            // {
            //     label: '业务应用领域：',
            //     value: 'rela_domains',
            // },
            {
                label: '期望完成日期：',
                value: 'finish_date',
                type: RequirementFieldType.TIME,
            },
            {
                label: '预期应用价值：',
                value: 'app_value',
            },
            {
                label: '预期应用成效：',
                value: 'app_effect',
            },
        ],
    },
    {
        title: '单位信息',
        key: 2,
        fields: [
            {
                label: '申请部门：',
                value: 'dept_name',
            },
            {
                label: '分管领导姓名：',
                value: 'dept_leader_name',
            },
            {
                label: '领导联系方式：',
                value: 'dept_leader_phone',
            },
            {
                label: '领导职务：',
                value: 'dept_leader_pos',
            },
            {
                label: '领导邮箱：',
                value: 'dept_leader_email',
            },
            {
                label: '部门联系人姓名：',
                value: 'BD_user_name',
            },
            {
                label: '部门联系方式：',
                value: 'BD_user_phone',
            },
            {
                label: '技术对接人姓名：',
                value: 'tech_user_name',
            },
            {
                label: '技术对接人联系方式：',
                value: 'tech_user_phone',
            },
            {
                label: '承建商名称：',
                value: 'developer_name',
            },
            {
                label: '统一社会信用代码：',
                value: 'developer_code',
            },
            {
                label: '申请函件：',
                value: 'reference_files',
                col: 24,
                type: RequirementFieldType.FILE,
                typeValue: 1,
            },
        ],
    },
]

export const analysisReasonableFields = [
    {
        radioLabel: '数据内容匹配性',
        radioField: 'data_content_match',
        descLabel: '说明',
        descField: 'data_content_match_desc',
    },
    {
        radioLabel: '数据完整性',
        radioField: 'data_completion',
        descLabel: '说明',
        descField: 'data_completion_desc',
    },

    {
        radioLabel: '数据时效性',
        radioField: 'data_timeliness',
        descLabel: '说明',
        descField: 'data_timeliness_desc',
    },
    {
        radioLabel: '数据空间范围',
        radioField: 'data_space_range',
        descLabel: '说明',
        descField: 'data_space_range_desc',
    },
]

export const jsonComparedFields = ['filter_items', 'info_items']
