import { ReactNode } from 'react'
import { ISearchLogicViewReturn } from '@/core'
import {
    AssetAttributeOutlined,
    AssetBusinessActivityOutlined,
    AssetBusinessObjectOutlined,
    AssetLogicEntitiesOutlined,
    AssetSubjectDomainOutlined,
    AssetSubjectGroupOutlined,
    FontIcon,
} from '@/icons'
import __ from './locale'
import styles from './styles.module.less'
import { IconType } from '@/icons/const'
import { BusinessDomainType } from '@/components/BusinessDomain/const'

export type IDataViewItem = ISearchLogicViewReturn

export type ICardItem = {
    label: string
    value: number
    key: string
    tip?: ReactNode
    icon: ReactNode
}
/**
 * 千分位格式化
 */
export const thousandSplit = (str: string | number) => {
    return `${str ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, `,`) ?? '--'
}

/**
 * 节点类型
 */
export enum AssetNodes {
    SUBJECTGROUP = 'subject_domain_group', // 主题域分组
    SUBJECTGDOMAIN = 'subject_domain', // 主题域
    BUSINESSOBJ = 'business_object', // 业务对象
    BUSINESSACT = 'business_activity', // 业务活动
    LOGICENTITES = 'logic_entity', // 逻辑实体
    DATAVIEW = 'data_view', // 库表
    INDICATOR = 'indicator', // 指标
    INTERFACE = 'interface', // 接口
    ATTRIBUTE = 'attribute', // 属性
}

/**
 * 资产ICONS
 */
export const AssetIcons = {
    [AssetNodes.SUBJECTGROUP]: (
        <AssetSubjectGroupOutlined style={{ color: '#8C7BEB' }} />
    ),
    [AssetNodes.SUBJECTGDOMAIN]: (
        <AssetSubjectDomainOutlined style={{ color: '#FFBA30' }} />
    ),
    [AssetNodes.BUSINESSOBJ]: (
        <AssetBusinessObjectOutlined style={{ color: '#14CEAA' }} />
    ),
    [AssetNodes.BUSINESSACT]: (
        <AssetBusinessActivityOutlined style={{ color: '#14CEAA' }} />
    ),
    [AssetNodes.LOGICENTITES]: (
        <AssetLogicEntitiesOutlined style={{ color: '#3AC4FF' }} />
    ),
    [AssetNodes.ATTRIBUTE]: (
        <AssetAttributeOutlined style={{ color: '#FF822F' }} />
    ),
    [AssetNodes.DATAVIEW]: (
        <FontIcon
            style={{
                color: '#8492A6',
            }}
            name="icon-luojishitu-mianxing1"
            type={IconType.COLOREDICON}
        />
    ),
    [AssetNodes.INDICATOR]: (
        <FontIcon
            style={{
                color: '#8492A6',
            }}
            name="icon-zhibiao-mianxing"
            type={IconType.COLOREDICON}
        />
    ),
    [AssetNodes.INTERFACE]: (
        <FontIcon
            style={{
                color: '#8492A6',
            }}
            name="icon-jiekou-mianxing"
            type={IconType.COLOREDICON}
        />
    ),
}

/**
 * 顶部统计项
 */
export const TopItems = [
    {
        key: 'subject_domain_group',
        label: __('主题域分组'),
        value: 'level_business_domain',
        icon: AssetIcons[AssetNodes.SUBJECTGROUP],
    },
    {
        key: 'subject_domain',
        label: __('主题域'),
        value: 'level_subject_domain',
        icon: AssetIcons[AssetNodes.SUBJECTGDOMAIN],
    },
    {
        key: 'business_object',
        label: __('业务对象/活动'),
        value: 'level_business_obj',
        icon: AssetIcons[AssetNodes.BUSINESSOBJ],
    },
    {
        key: 'logic_entities',
        label: __('逻辑实体'),
        value: 'level_logic_entities',
        icon: AssetIcons[AssetNodes.LOGICENTITES],
    },
    {
        key: 'logic_view',
        label: __('库表'),
        value: 'total_logical_view',
        tip: __('仅统计关联到主题的资源数量'),
        icon: AssetIcons[AssetNodes.DATAVIEW],
    },
    {
        key: 'interface',
        label: __('接口'),
        value: 'total_interface_service',
        tip: __('仅统计关联到主题的资源数量'),
        icon: AssetIcons[AssetNodes.INTERFACE],
    },
    {
        key: 'indicator',
        label: __('指标'),
        value: 'total_indicator',
        tip: __('仅统计关联到主题的资源数量'),
        icon: AssetIcons[AssetNodes.INDICATOR],
    },
]

/**
 * 高亮匹配
 * @param str 文本
 * @param keyword 关键字
 * @returns
 */
export const hightLightMatch = (str: string, keyword?: string) => {
    if (!keyword) return str
    const pattern = new RegExp(
        keyword.replace(/[.[*?+^$|()/]|\]|\\/g, '\\$&'),
        'gi',
    )
    return str?.replace(pattern, `<span  style="color: #FF6304">$&</span>`)
}

// 搜索分类
export const LevelType = {
    [BusinessDomainType.subject_domain_group]: __('主题域分组'),
    [BusinessDomainType.subject_domain]: __('主题域'),
    [BusinessDomainType.business_object]: __('业务对象'),
    [BusinessDomainType.business_activity]: __('业务活动'),
    [BusinessDomainType.logic_entity]: __('逻辑实体'),
}

export const FilterType = [
    BusinessDomainType.subject_domain,
    BusinessDomainType.business_activity,
    BusinessDomainType.business_object,
    BusinessDomainType.logic_entity,
]
