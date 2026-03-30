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
        label: __('业务表'),
        key: FormListTabType.BusinessForm,
    },
    {
        label: __('库表'),
        key: FormListTabType.LogicView,
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
    [FormTableKind.STANDARD]: [
        {
            label: __('基本信息'),
            items: [
                'name',
                'name_en',
                'description',
                'is_primary_key',
                'is_required',
                'is_standardization_required',
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
}
