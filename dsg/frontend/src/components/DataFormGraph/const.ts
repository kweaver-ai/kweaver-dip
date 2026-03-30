import { FormTableKind } from '../Forms/const'
import __ from './locale'

// 表单列表tab类型
export enum FormListTabType {
    // 库表
    LogicView = 'LOGIC_VIEW',
    // 业务表
    BusinessForm = 'BUSINESS_FORM',
}

// 表单列表tab项
export const FormListTabItems = [
    {
        label: __('数据标准表'),
        key: FormTableKind.DATA_STANDARD,
    },
    {
        label: __('数据原始表'),
        key: FormTableKind.DATA_ORIGIN,
    },
]

// 字段编辑信息
export const FieldEditInfoKeys = {
    [FormTableKind.BUSINESS]: [
        {
            label: __('基本信息'),
            items: [
                'name',
                'name_en',
                'description',
                'is_primary_key',
                'is_required',
                'is_current_business_generation',
            ],
            key: 'baseModel',
        },
        {
            label: __('技术属性'),
            items: ['data_type', 'value_range', 'field_relationship'],
            key: 'businessModel',
        },
        {
            label: __('安全信息'),
            items: [
                'label_id',
                'confidential_attribute',
                'is_incremental_field',
                'shared_attribute',
                'open_attribute',
            ],
            key: 'shareInfoModel',
        },
    ],
    [FormTableKind.DATA_ORIGIN]: [
        {
            label: __('基本信息'),
            items: [
                'name_detail',
                'name_en_detail',
                'is_primary_key_detail',
                'is_required_detail',
            ],
            key: 'baseModel',
        },
        {
            label: __('技术属性'),
            items: ['data_type', 'code_table_detail'],
            key: 'businessModel',
        },
        {
            label: __('更多属性'),
            items: [
                'value_range',
                'encoding_rule',
                'field_relationship',
                'is_current_business_generation',
                'description',
            ],
            key: 'shareInfoModel',
        },
    ],
    [FormTableKind.STANDARD]: [
        {
            label: __('基本信息'),
            items: [
                'name',
                'name_en',
                'description',
                'is_primary_key',
                'is_required',
                'is_current_business_generation',
            ],
            key: 'baseModel',
        },
        {
            label: __('技术属性'),
            items: [
                'standard_id',
                'data_type',
                'value_range',
                'field_relationship',
            ],
            key: 'businessModel',
        },
        {
            label: __('安全信息'),
            items: [
                'label_id',
                'confidential_attribute',
                'is_incremental_field',
                'shared_attribute',
                'open_attribute',
            ],
            key: 'shareInfoModel',
        },
    ],
    [FormTableKind.DATA_STANDARD]: [
        {
            label: __('基本信息'),
            items: [
                'name',
                'name_en',
                'description',
                'is_primary_key',
                'is_required',
                'is_current_business_generation',
            ],
            key: 'baseModel',
        },
        {
            label: __('技术属性'),
            items: [
                'is_standardization_required',
                'standard_id',
                'data_type',
                'code_table',
                'value_range',
                'encoding_rule',
                'field_relationship',
            ],
            key: 'businessModel',
        },
        {
            label: __('安全信息'),
            items: [
                'sensitive_attribute',
                'confidential_attribute',
                'shared_attribute',
                'open_attribute',
            ],
            key: 'shareInfoModel',
        },
    ],
    [FormTableKind.DATA_FUSION]: [
        {
            label: __('基本信息'),
            items: [
                'name',
                'name_en',
                'description',
                'is_primary_key',
                'is_required',
                'is_current_business_generation',
            ],
            key: 'baseModel',
        },
        {
            label: __('技术属性'),
            items: [
                'is_standardization_required',
                'standard_id',
                'data_type',
                'code_table',
                'value_range',
                'encoding_rule',
                'field_relationship',
            ],
            key: 'businessModel',
        },
        {
            label: __('安全信息'),
            items: [
                'sensitive_attribute',
                'confidential_attribute',
                'shared_attribute',
                'open_attribute',
            ],
            key: 'shareInfoModel',
        },
    ],
}

export const DataOriginFieldsConfig = ['name', 'data_type', 'description']

// 数据表类型显示
export const TableCurrentKindLabel = {
    [FormTableKind.DATA_ORIGIN]: __('当前数据表（原始表）'),
    [FormTableKind.DATA_STANDARD]: __('当前数据表（标准表）'),
    [FormTableKind.DATA_FUSION]: __('当前数据表（融合表）'),
}

// 数据表类型显示
export const TableFromKindLabel = {
    [FormTableKind.STANDARD]: __('业务表（标准表）'),
    [FormTableKind.DATA_ORIGIN]: __('数据表（原始表）'),
    [FormTableKind.DATA_STANDARD]: __('数据表（标准表）'),
    [FormTableKind.DATA_FUSION]: __('数据表（融合表）'),
}

export const TableInfoTitle = {
    [FormTableKind.STANDARD]: __('业务标准表信息'),
    [FormTableKind.DATA_ORIGIN]: __('数据原始表信息'),
    [FormTableKind.DATA_STANDARD]: __('数据标准表信息'),
    [FormTableKind.DATA_FUSION]: __('数据融合表信息'),
}

/**
 * 枚举定义了目标规则的几种类型，用于标识数据处理或验证的策略。
 *
 * @enum {string}
 */
export enum DestRule {
    /**
     * 表示唯一性规则，确保数据的唯一性。
     */
    UNIQUE = 'unique',

    /**
     * 表示时效性规则，可能涉及数据的新鲜度或时间敏感性。
     */
    TIMELINESS = 'timeliness',

    /**
     * 表示一致性规则，确保数据遵循某种一致性的标准或模式。
     */
    CONFORMITY = 'conformity',
}

export const DestRuleOptions = [
    {
        label: __('唯一性'),
        value: DestRule.UNIQUE,
    },
    {
        label: __('时间性'),
        value: DestRule.TIMELINESS,
    },
    {
        label: __('从众性'),
        value: DestRule.CONFORMITY,
    },
]
