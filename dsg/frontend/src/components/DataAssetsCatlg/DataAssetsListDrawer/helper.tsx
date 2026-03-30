import {
    AssetLogicEntitiesOutlined,
    AssetSubjectDomainOutlined,
    AssetSubjectGroupOutlined,
    FontIcon,
} from '@/icons'
import { IconType } from '@/icons/const'
import __ from './locale'

/**
 * 节点类型
 */
export enum AssetNodes {
    SUBJECTGROUP = 'subject_domain_group', // 主题域分组
    SUBJECTGDOMAIN = 'subject_domain', // 主题域
    BUSINESSOBJ = 'business_object', // 业务对象
    BUSINESSACT = 'business_activity', // 业务活动
    LOGICENTITES = 'logic_entity', // 逻辑实体
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
        <FontIcon
            style={{ color: '#14CEAA' }}
            name="icon-L3"
            type={IconType.COLOREDICON}
        />
    ),
    [AssetNodes.BUSINESSACT]: (
        <FontIcon
            style={{ color: '#14CEAA' }}
            name="icon-L3"
            type={IconType.COLOREDICON}
        />
    ),
    [AssetNodes.LOGICENTITES]: (
        <AssetLogicEntitiesOutlined style={{ color: '#3AC4FF' }} />
    ),
}

export enum DataType {
    DATAVIEW = 'data_view', // 库表
    INDICATOR = 'indicator', // 指标
    INTERFACE = 'interface_svc', // 接口
}

export const TitleText = {
    [DataType.DATAVIEW]: __('库表列表'),
    [DataType.INDICATOR]: __('指标列表'),
    [DataType.INTERFACE]: __('接口列表'),
}
