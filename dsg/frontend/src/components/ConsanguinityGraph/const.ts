import { DataTableType } from '@/core'
import { NodeType } from '@/core/consanguinity'
import __ from './locale'

// 库表详情配置
export const TableConfig = {
    [NodeType.FORM_VIEW]: [
        {
            label: __('基本属性'),
            list: [
                {
                    label: __('库表业务名称'),
                    value: '',
                    key: 'business_name',
                    span: 24,
                },
                {
                    label: __('编码'),
                    value: '',
                    key: 'uniform_catalog_code',
                    span: 24,
                },
                {
                    label: __('库表技术名称'),
                    value: '',
                    key: 'technical_name',
                    span: 24,
                },
                {
                    label: __('描述'),
                    value: '',
                    key: 'description',
                    span: 24,
                },
                {
                    label: __('发布状态'),
                    value: '',
                    key: 'status',
                    span: 24,
                },
                {
                    label: __('上线状态'),
                    value: '',
                    key: 'online_status',
                    span: 24,
                },
                {
                    label: __('所属主题'),
                    value: '',
                    key: 'subject',
                    span: 24,
                },
                {
                    label: __('所属部门'),
                    value: '',
                    key: 'department',
                    span: 24,
                },
                {
                    label: __('数据Owner'),
                    value: '',
                    key: 'owner',
                    span: 24,
                },
                {
                    label: __('数据源名称'),
                    value: '',
                    key: 'datasource_name',
                    span: 24,
                },
                {
                    label: 'catalog',
                    value: '',
                    key: 'view_source_catalog_name',
                    span: 24,
                },
                {
                    label: __('库名称'),
                    value: '',
                    key: 'schema',
                    span: 24,
                },
                {
                    label: __('关联信息系统'),
                    value: '',
                    key: 'info_system',
                    span: 24,
                },
            ],
        },
        {
            label: __('其他信息'),
            list: [
                {
                    label: __('创建人'),
                    value: '',
                    key: 'created_by',
                    span: 24,
                },
                {
                    label: __('创建时间'),
                    value: '',
                    key: 'created_at',
                    span: 24,
                },
                {
                    label: __('更新人'),
                    value: '',
                    key: 'updated_by',
                    span: 24,
                },
                {
                    label: __('更新时间'),
                    value: '',
                    key: 'updated_at',
                    span: 24,
                },
                {
                    label: __('业务数据更新时间'),
                    value: '',
                    key: 'data_updated_at',
                    span: 24,
                },
            ],
        },
    ],
}

// 数据表详情配置
export const ExcelDetailConfig = [
    {
        label: __('基本属性'),
        list: [
            {
                label: __('库表业务名称'),
                value: '',
                key: 'business_name',
                span: 24,
            },
            {
                label: __('编码'),
                value: '',
                key: 'uniform_catalog_code',
                span: 24,
            },
            {
                label: __('库表技术名称'),
                value: '',
                key: 'technical_name',
                span: 24,
            },
            {
                label: __('描述'),
                value: '',
                key: 'description',
                span: 24,
            },
            {
                label: __('发布状态'),
                value: '',
                key: 'status',
                span: 24,
            },
            {
                label: __('上线状态'),
                value: '',
                key: 'online_status',
                span: 24,
            },
            {
                label: __('所属主题'),
                value: '',
                key: 'subject',
                span: 24,
            },
            {
                label: __('所属部门'),
                value: '',
                key: 'department',
                span: 24,
            },
            {
                label: __('数据Owner'),
                value: '',
                key: 'owner',
                span: 24,
            },
            {
                label: __('数据源名称'),
                value: '',
                key: 'datasource_name',
                span: 24,
            },
            {
                label: __('所属文件'),
                value: '',
                key: 'excel_file_name',
                span: 24,
            },
            {
                label: __('关联信息系统'),
                value: '',
                key: 'info_system',
                span: 24,
            },
        ],
    },
    {
        label: __('数据范围'),
        list: [
            {
                label: __('Sheet页'),
                value: '',
                key: 'sheet',
                span: 24,
            },
            {
                label: __('单元格范围'),
                value: '',
                key: 'cell_range',
                span: 24,
            },
            {
                label: __('库表字段配置'),
                value: '',
                key: 'has_headers',
                span: 24,
            },
            {
                label: __('Sheet名作字段'),
                value: '',
                key: 'sheet_as_new_column',
                span: 24,
            },
        ],
    },
    {
        label: __('其他信息'),
        list: [
            {
                label: __('创建人'),
                value: '',
                key: 'created_by',
                span: 24,
            },
            {
                label: __('创建时间'),
                value: '',
                key: 'created_at',
                span: 24,
            },
            {
                label: __('更新人'),
                value: '',
                key: 'updated_by',
                span: 24,
            },
            {
                label: __('更新时间'),
                value: '',
                key: 'updated_at',
                span: 24,
            },
            {
                label: __('业务数据更新时间'),
                value: '',
                key: 'data_updated_at',
                span: 24,
            },
        ],
    },
]

export const FieldDataConfig = [
    {
        label: __('字段名称'),
        fields: [
            {
                key: 'business_name',
                label: __('业务名称'),
                value: '',
                span: 24,
            },
            {
                key: 'technical_name',
                label: __('技术名称'),
                value: '',
                span: 24,
            },
        ],
    },
    {
        label: __('源字段技术属性'),
        fields: [
            {
                key: 'standard',
                label: __('关联数据标准'),
                value: '',
                span: 24,
            },
            {
                key: 'code_table',
                label: __('关联码表'),
                span: 24,
            },
            {
                key: 'data_type',
                label: __('数据类型'),
                span: 24,
            },
            {
                key: 'reset_convert_rules',
                label: __('数据解析规则'),
                span: 24,
            },
            {
                key: 'original_data_type',
                label: __('原始数据类型'),
                span: 24,
            },
            {
                key: 'data_length',
                label: __('数据长度'),
                span: 24,
            },
            {
                key: 'data_accuracy',
                label: __('数据精度'),
                span: 24,
            },
            {
                key: 'primary_key',
                label: __('是否主键'),
                span: 24,
                options: [
                    {
                        label: __('是'),
                        key: true,
                    },
                    {
                        label: __('否'),
                        key: false,
                    },
                ],
            },
        ],
    },
]
