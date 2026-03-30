import { DemandFieldType } from '../Details/const'

export interface IBasicInfoFields {
    label: string
    value: string
    type?: DemandFieldType
    col?: number
}
// 需求详情-基础信息
export const DemandInfoFields: IBasicInfoFields[] = [
    {
        label: '需求名称：',
        value: 'title',
    },
    {
        label: '需求联系人：',
        value: 'contact',
    },
    {
        label: '需求描述：',
        value: 'description',
        col: 24,
    },
    {
        label: '数据来源依据：',
        value: 'data_source_basic',
    },
    {
        label: '需求部门：',
        value: 'org_name',
    },
    {
        label: '责任部门：',
        value: 'duty_org_name',
    },
    {
        label: '期望更新周期：',
        value: 'update_cycle',
    },
    {
        label: '附件：',
        value: 'attachment_name',
        type: DemandFieldType.FILE,
    },
]

// 需求详情-部门信息
export const DepartmentInfoFields: IBasicInfoFields[] = [
    {
        label: '需求部门：',
        value: 'org_name',
    },
    {
        label: '需求联系人：',
        value: 'contact',
    },
    {
        label: '需求联系人电话：',
        value: 'phone',
        col: 24,
    },
    {
        label: '需求联系人邮箱：',
        value: 'mail',
    },
    {
        label: '责任部门：',
        value: 'duty_org_name',
    },
]

// 需求详情-场景信息
export const SceneInfoFields: IBasicInfoFields[] = [
    {
        label: '应用场景类型：',
        value: 'scene_type',
    },
    {
        label: '应用场景：',
        value: 'scene',
    },
    {
        label: '高效办成“一件事”：',
        value: 'one_thing_code',
        col: 24,
    },
    {
        label: '其他“一件事”：',
        value: 'other_one_thing_desc',
    },
]

// 需求详情-需求分析结论
export const AnalysisInfoFields: IBasicInfoFields[] = [
    {
        label: '提供时间：',
        value: 'provide_time',
        type: DemandFieldType.TIME,
    },
    {
        label: '资源类型：',
        value: 'duty_resource_type',
    },
    {
        label: '分析人：',
        value: 'analyzer',
        col: 24,
    },
    {
        label: '分析人电话：',
        value: 'phone',
    },
    {
        label: '分析结论说明：',
        value: 'comment',
    },
]

enum SSZDOperateType {
    Create = 1,
    ReportForReview = 6,
    AnalysisSignature = 11,
    Analysis = 16,
    ImplementSignature = 21,
    Implement = 26,
    Revocation = 31,
}
export interface IOperateRecordField {
    label: string
    key: string
    type?: DemandFieldType
}
// 操作记录不同节点展示不同的信息  省平台无op_type 市有op_type
export const OperateRecordFields: Record<number, IOperateRecordField[]> = {
    [SSZDOperateType.Create]: [
        { label: '需求部门：', key: 'op_org' },
        { label: '提交时间：', key: 'op_time', type: DemandFieldType.TIME },
    ],
    [SSZDOperateType.AnalysisSignature]: [
        { label: '签收人：', key: 'op_user' },
        { label: '签收部门：', key: 'op_org' },
        { label: '签收时间：', key: 'op_time', type: DemandFieldType.TIME },
    ],
    [SSZDOperateType.Analysis]: [
        { label: '分析结论：', key: 'op_result' },
        { label: '分析人：', key: 'op_user' },
        { label: '分析部门：', key: 'op_org' },
        { label: '分析时间：', key: 'op_time', type: DemandFieldType.TIME },
    ],
    [SSZDOperateType.ImplementSignature]: [
        { label: '签收人：', key: 'op_user' },
        { label: '签收部门：', key: 'op_org' },
        { label: '签收时间：', key: 'op_time', type: DemandFieldType.TIME },
    ],
    [SSZDOperateType.Implement]: [
        { label: '实施人：', key: 'op_user' },
        { label: '实施部门：', key: 'op_org' },
        { label: '实施时间：', key: 'op_time', type: DemandFieldType.TIME },
    ],
}

export const ProvinceOperateFields: IOperateRecordField[] = [
    { label: '审核结果：', key: 'op_result' },
    { label: '审核部门：', key: 'op_org' },
    { label: '审核时间：', key: 'op_time', type: DemandFieldType.TIME },
    { label: '审核备注：', key: 'op_comment' },
]
