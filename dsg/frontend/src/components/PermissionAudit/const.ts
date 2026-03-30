import { AssetTypeEnum } from '@/core'
import __ from './locale'

/**
 * 根据资源类型配置权限审计所需的字段
 *
 * 此配置对象用于指定不同类型的资源在进行权限审计时需要记录的具体字段
 * 每个资源类型对应一个字段列表，这些字段包括资源的名称、代码、申请人的姓名等信息
 * 这样的配置使得在进行权限审计时能够快速定位和审查相关的信息
 */
export const PermissionAuditConfigByType = {
    [AssetTypeEnum.SubView]: [
        {
            label: __('库表名称'),
            key: 'logic_view_business_name',
        }, // 库表的业务名称
        {
            label: __('行列名称'),
            key: 'sub_view_name',
        }, // 行列名称的名称
        {
            label: __('编码'),
            key: 'logic_view_code',
        }, // 库表的代码
        {
            label: __('申请人'),
            key: 'requester_name',
        }, // 申请人的姓名
        {
            label: __('申请时间'),
            key: 'timestamp',
        }, //
        {
            label: __('有效期至'),
            key: 'expired_at',
        }, // 到期时间
        {
            label: __('申请理由'),
            key: 'reason',
        }, // 申请的原因
        {
            label: __('详情'),
            key: 'details',
        }, // 申请的详细信息
    ],
    [AssetTypeEnum.DataView]: [
        {
            label: __('库表名称'),
            key: 'logic_view_business_name',
        }, // 库表的业务名称
        {
            label: __('编码'),
            key: 'logic_view_code',
        }, // 库表的代码
        {
            label: __('申请人'),
            key: 'requester_name',
        }, // 申请人的姓名
        {
            label: __('申请时间'),
            key: 'timestamp',
        }, // 申请的时间戳

        {
            label: __('申请理由'),
            key: 'reason',
        }, // 申请的原因
        {
            label: __('详情'),
            key: 'details',
        }, // 申请的详细信息
    ],
    [AssetTypeEnum.Indicator]: [
        {
            label: __('指标名称'),
            key: 'indicator_name',
        }, // 指标名称
        {
            label: __('指标类型'),
            key: 'indicator_type',
        }, // 指标类型
        {
            label: __('编码'),
            key: 'indicator_code',
        }, // 指标代码
        {
            label: __('申请人'),
            key: 'requester_name',
        }, // 申请人的姓名
        {
            label: __('申请时间'),
            key: 'timestamp',
        }, // 申请的时间戳
        {
            label: __('有效期至'),
            key: 'expired_at',
        }, // 到期时间
        {
            label: __('申请理由'),
            key: 'reason',
        }, // 申请的原因
        {
            label: __('详情'),
            key: 'details',
        }, // 申请的详细信息
    ],

    [AssetTypeEnum.Api]: [
        {
            label: __('接口名称'),
            key: 'api_name',
        }, // API的名称
        {
            label: __('编码'),
            key: 'api_code',
        }, // API的代码
        {
            label: __('申请人'),
            key: 'requester_name',
        }, // 申请人的姓名
        {
            label: __('申请时间'),
            key: 'timestamp',
        },
        {
            label: __('有效期至'),
            key: 'expired_at',
        }, // 到期时间
        {
            label: __('申请理由'),
            key: 'reason',
        }, // 申请的原因
        {
            label: __('详情'),
            key: 'details',
        },
    ],
}

/**
 * 指标标签活动枚举
 *
 * 该枚举定义了指标标签页中可能的激活状态
 * 每个状态都由一个唯一的字符串标识符标识
 */
export enum IndicatorTabActives {
    DETAILS = 'details', // 详细信息标签页
    RULE = 'rule', // 维度规则标签页
    VISITORS = 'visitors', // 访客信息标签页
}

// 定义指标标签页数组，用于界面中的标签导航
// 该数组列出了所有可供用户切换的标签页，每个标签页都有一个显示的标签和一个对应的键值
export const IndicatorTabs = [
    {
        // 第一个标签页指向指标的详细信息
        label: __('指标定义'),
        key: IndicatorTabActives.DETAILS,
    },
    {
        // 第二个标签页显示访问者列表
        label: __('访问者列表'),
        key: IndicatorTabActives.VISITORS,
    },
]

export const IndicatorDimensionTab = {
    label: __('维度规则'),
    key: IndicatorTabActives.RULE,
}

// 定义指标类型的枚举，用于标识不同类型的指标
export const IndicatorTypes = {
    atomic: __('原子指标'), // 原子指标：最基本的指标，不可再分解
    derived: __('衍生指标'), // 衍生指标：由原子指标经过计算得出的指标
    composite: __('复合指标'), // 复合指标：由多个原子指标或衍生指标组合而成的指标
}

export enum ApiTabActives {
    DETAILS = 'details', // 详细信息标签页
    VISITORS = 'visitors', // 访客信息标签页
}

export const ApiTabs = [
    {
        // 第一个标签页指向指标的详细信息
        label: __('接口信息'),
        key: IndicatorTabActives.DETAILS,
    },
    {
        // 第二个标签页显示访问者列表
        label: __('访问者列表'),
        key: IndicatorTabActives.VISITORS,
    },
]
