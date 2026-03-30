import { SearchType } from '@/components/SearchLayout/const'
import __ from '../locale'

// 搜索表单
export const CommonSearchFormData = [
    {
        label: __('资源业务名称、技术名称、编码'),
        key: 'keyword',
        type: SearchType.Input,
        isAlone: true,
        itemProps: {
            maxLength: 255,
        },
    },
    {
        label: __('数据Owner'),
        key: 'data_owner',
        type: SearchType.Select,
        itemProps: {
            options: [],
            placeholder: __('请选择'),
            fieldNames: { label: 'name', value: 'id' },
        },
    },
    {
        label: __('指标类型'),
        key: 'indicator_type',
        type: SearchType.Select,
        itemProps: {
            options: [
                {
                    label: __('不限'),
                    value: '',
                },
                {
                    label: __('原子指标'),
                    value: 'atomic',
                },
                {
                    label: __('衍生指标'),
                    value: 'derived',
                },
                {
                    label: __('复合指标'),
                    value: 'composite',
                },
            ],
            placeholder: __('请选择'),
        },
    },
    {
        label: __('所属部门'),
        key: 'org_code',
        type: SearchType.DepartmentAndOrgSelect,
        itemProps: {
            allowClear: true,
            // unCategorizedObj: {
            //     id: '00000000-0000-0000-0000-000000000000',
            //     name: __('未分类'),
            // },
            placeholder: __('请选择'),
        },
    },
    {
        label: __('有效期状态'),
        key: 'policy_status',
        type: SearchType.Select,
        itemProps: {
            placeholder: __('请选择'),
            options: [
                {
                    label: __('不限'),
                    value: '',
                },
                {
                    label: __('无过期'),
                    value: 'Active',
                },
                {
                    label: __('有过期'),
                    value: 'Expired',
                },
            ],
        },
    },
]

/**
 * 资源类型
 */
export enum AssetItemType {
    /** 逻辑视图 */
    DataView = 'data-view',
    /** 接口服务 */
    Api = 'api',

    // 指标
    Indicator = 'indicator',
}

const TypeKeyMap = {
    [AssetItemType.DataView]: [
        'keyword',
        'data_owner',
        'org_code',
        'policy_status',
    ],
    [AssetItemType.Api]: ['keyword', 'data_owner', 'org_code', 'policy_status'],
    [AssetItemType.Indicator]: [
        'keyword',
        'data_owner',
        'org_code',
        'indicator_type',
        'policy_status',
    ],
}

const PlaceholderMap = {
    [AssetItemType.DataView]: __('资源业务名称、技术名称、编码'),
    [AssetItemType.Api]: __('资源名称、编码'),
    [AssetItemType.Indicator]: __('资源名称、编码'),
}

export const getSearchFormData = (type: string) => {
    const items = CommonSearchFormData.filter((item) =>
        TypeKeyMap[type].includes(item.key),
    ).map((item) => {
        const obj: any = { ...item }
        if (obj.key === 'keyword') {
            obj.label = PlaceholderMap[type]
        }
        return obj
    })
    return items
}
