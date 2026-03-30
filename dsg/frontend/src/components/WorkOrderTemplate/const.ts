import { SearchType } from '@/ui/LightweightSearch/const'
import type { WorkOrderTemplateType } from '@/core/apis/taskCenter/index.d'

/**
 * 工单类型配置
 */
export const WORK_ORDER_TYPES = [
    {
        value: 'research' as const,
        label: '调研工单',
    },
    {
        value: 'frontend-machine' as const,
        label: '前置机工单',
    },
    {
        value: 'data-collection' as const,
        label: '数据归集工单',
    },
    {
        value: 'data-standardization' as const,
        label: '数据标准化工单',
    },
    {
        value: 'data-quality-audit' as const,
        label: '数据质量稽核工单',
    },
    {
        value: 'data-fusion' as const,
        label: '数据融合加工工单',
    },
    {
        value: 'data-understanding' as const,
        label: '数据理解工单',
    },
    {
        value: 'data-resource-catalog' as const,
        label: '数据资源编目工单',
    },
] as const

/**
 * 工单模板状态配置
 */
export const TEMPLATE_STATUS = [
    {
        value: 1 as const,
        label: '启用',
        color: '#52c41a',
    },
    {
        value: 0 as const,
        label: '禁用',
        color: '#ff4d4f',
    },
] as const

/**
 * 表单字段配置
 */
export interface FormField {
    name: string
    label: string
    type:
        | 'input'
        | 'textarea'
        | 'select'
        | 'date'
        | 'dateRange'
        | 'radio'
        | 'custom'
    required: boolean
    showTime?: boolean
    options?: Array<{ value: string; label: string }>
    placeholder?: string
}

export const FORM_FIELDS_CONFIG: Record<WorkOrderTemplateType, FormField[]> = {
    // 调研工单模板
    research: [
        {
            name: 'research_unit',
            label: '调研单位',
            type: 'input',
            required: true,
            placeholder: '请输入调研单位名称',
        },
        {
            name: 'research_time',
            label: '调研时间',
            type: 'date',
            required: true,
            placeholder: '请选择调研时间',
        },
        {
            name: 'research_content',
            label: '调研内容',
            type: 'textarea',
            required: true,
            placeholder: '请输入调研内容描述',
        },
        {
            name: 'research_purpose',
            label: '调研目的',
            type: 'textarea',
            required: true,
            placeholder: '请输入调研目的说明',
        },
    ],

    // 前置机工单模板
    'frontend-machine': [
        {
            name: 'apply_department',
            label: '申请部门',
            type: 'input',
            required: true,
            placeholder: '请输入申请部门',
        },
        {
            name: 'frontend_machine_address',
            label: '前置机地址',
            type: 'input',
            required: true,
            placeholder: '请输入前置机地址',
        },
        {
            name: 'apply_requirement',
            label: '申请要求',
            type: 'textarea',
            required: true,
            placeholder: '请输入申请要求',
        },
    ],

    // 数据归集工单模板
    'data-collection': [
        {
            name: 'data_source',
            label: '数据来源',
            type: 'input',
            required: true,
            placeholder: '请输入数据来源',
        },
        {
            name: 'collection_time',
            label: '数据采集时间',
            type: 'dateRange',
            required: true,
            placeholder: '请选择数据采集时间范围',
        },
        {
            name: 'sync_frequency',
            label: '数据同步频率',
            type: 'select',
            required: true,
            placeholder: '请选择数据同步频率',
            options: [
                { value: 'real_time', label: '实时同步' },
                { value: 'hourly', label: '每小时同步' },
                { value: 'daily', label: '每日同步' },
                { value: 'weekly', label: '每周同步' },
                { value: 'monthly', label: '每月同步' },
            ],
        },
        {
            name: 'collection_method',
            label: '采集方式',
            type: 'select',
            required: true,
            placeholder: '请选择采集方式',
            options: [
                { value: 'api', label: 'API接口' },
                { value: 'database', label: '数据库连接' },
                { value: 'file', label: '文件导入' },
                { value: 'manual', label: '手动录入' },
            ],
        },
        {
            name: 'department',
            label: '所属部门',
            type: 'input',
            required: true,
            placeholder: '请输入所属部门',
        },
        {
            name: 'work_order_description',
            label: '工单描述',
            type: 'textarea',
            required: true,
            placeholder: '请输入工单描述',
        },
    ],

    // 数据标准化工单模板
    'data-standardization': [
        {
            name: 'data_source',
            label: '数据源',
            type: 'input',
            required: true,
            placeholder: '请输入数据源',
        },
        {
            name: 'data_table',
            label: '数据表',
            type: 'input',
            required: true,
            placeholder: '请输入数据表',
        },
        {
            name: 'standard_data_elements',
            label: '标准数据元',
            type: 'input',
            required: true,
            placeholder: '请输入标准数据元',
        },
        {
            name: 'business_table_fields',
            label: '业务表字段',
            type: 'input',
            required: true,
            placeholder: '请输入业务表字段',
        },
        {
            name: 'table_fields',
            label: '表字段',
            type: 'textarea',
            required: true,
            placeholder: '请输入表字段，多个字段用逗号分隔',
        },

        {
            name: 'business_table_standard',
            label: '业务表标准',
            type: 'textarea',
            required: false,
            placeholder: '请输入业务表标准',
        },
        {
            name: 'remark',
            label: '备注信息',
            type: 'textarea',
            required: false,
            placeholder: '请输入备注信息',
        },
        {
            name: 'work_order_description',
            label: '工单描述',
            type: 'textarea',
            required: true,
            placeholder: '请输入工单描述',
        },
    ],

    // 数据质量稽核工单模板
    'data-quality-audit': [
        {
            name: 'data_source',
            label: '数据源',
            type: 'input',
            required: true,
            placeholder: '请输入数据源',
        },
        {
            name: 'data_table',
            label: '数据表',
            type: 'input',
            required: true,
            placeholder: '请输入数据表',
        },
        {
            name: 'table_fields',
            label: '表字段',
            type: 'textarea',
            required: true,
            placeholder: '请输入表字段，多个字段用逗号分隔',
        },
        {
            name: 'related_business_rules',
            label: '关联业务规则',
            type: 'textarea',
            required: true,
            placeholder: '请输入关联业务规则',
        },
    ],

    // 数据融合加工工单模板 - 去掉字段融合画布
    'data-fusion': [
        {
            name: 'source_data_source',
            label: '源数据源',
            type: 'input',
            required: true,
            placeholder: '请输入源数据源',
        },
        {
            name: 'source_table',
            label: '源表',
            type: 'input',
            required: true,
            placeholder: '请输入源表',
        },
        {
            name: 'target_table',
            label: '目标表',
            type: 'input',
            required: true,
            placeholder: '请输入目标表',
        },
        {
            name: 'field_fusion_rules',
            label: '字段融合规则',
            type: 'textarea',
            required: true,
            placeholder: '请输入字段融合规则',
        },
    ],

    // 数据理解工单模板
    'data-understanding': [
        {
            name: 'work_order_name',
            label: '工单名称',
            type: 'input',
            required: true,
            placeholder: '请输入工单名称',
        },
        {
            name: 'task_name',
            label: '任务名称',
            type: 'input',
            required: true,
            placeholder: '请输入任务名称',
        },
        {
            name: 'task_executor',
            label: '任务执行人',
            type: 'input',
            required: true,
            placeholder: '请输入任务执行人',
        },
        {
            name: 'manage_resource_catalog',
            label: '管理资源目录',
            type: 'input',
            required: true,
            placeholder: '请输入管理资源目录',
        },
    ],

    // 数据资源编目工单模板 - 属性配置改为输入框
    'data-resource-catalog': [
        {
            name: 'basic_info',
            label: '基本信息',
            type: 'textarea',
            required: true,
            placeholder: '请输入基本信息',
        },
        {
            name: 'info_items',
            label: '信息项',
            type: 'textarea',
            required: true,
            placeholder: '请输入信息项',
        },
        {
            name: 'share_attributes',
            label: '共享属性',
            type: 'textarea',
            required: true,
            placeholder: '请输入共享属性',
        },
    ],
}

/**
 * 不限选项
 */
const NotLimit = {
    value: undefined,
    label: '不限',
}

/**
 * 搜索表单配置
 */
export const SEARCH_FILTER_CONFIG = [
    {
        key: 'template_type',
        label: '工单类型',
        type: SearchType.Radio,
        options: [NotLimit, ...WORK_ORDER_TYPES],
    },
]

/**
 * 分页配置
 */
export const PAGINATION_CONFIG = {
    defaultPageSize: 10,
    pageSizeOptions: ['10', '20', '50', '100'] as string[],
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) => `共 ${total} 条`,
}
