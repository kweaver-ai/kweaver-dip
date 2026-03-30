import { SearchType } from '../SearchLayout/const'
import __ from './locale'
import { BusinessDomainType } from '../BusinessDomain/const'

export const searchFormData = [
    {
        label: __('库表名称、编码'),
        key: 'keyword',
        type: SearchType.Input,
        isAlone: true,
        itemProps: {
            maxLength: 255,
        },
    },
    {
        label: __('所属业务对象'),
        key: 'subject_id',
        type: SearchType.SelectThemeDomainTree,
        itemProps: {
            allowClear: true,
            unCategorizedObj: {
                id: '00000000-0000-0000-0000-000000000000',
                name: __('未分类'),
                type: BusinessDomainType.subject_domain_group,
            },
            selectableTypes: [
                BusinessDomainType.subject_domain_group,
                BusinessDomainType.subject_domain,
                BusinessDomainType.business_object,
                BusinessDomainType.business_activity,
            ],
            placeholder: __('请选择'),
        },
    },
    {
        label: __('库表所属部门'),
        key: 'department_id',
        type: SearchType.DepartmentAndOrgSelect,
        itemProps: {
            allowClear: true,
            unCategorizedObj: {
                id: '00000000-0000-0000-0000-000000000000',
                name: __('未分类'),
            },
            placeholder: __('请选择'),
        },
    },
    {
        label: __('所属数据源'),
        key: 'datasource_id',
        type: SearchType.MultipleSelect,
        itemProps: {
            options: [],
            placeholder: __('请选择'),
            searchPlaceholder: __('搜索数据源'),
            titleText: __('显示当前已扫描且存在库表的数据源：'),
            fieldNames: { label: 'name', value: 'id' },
        },
    },
]
