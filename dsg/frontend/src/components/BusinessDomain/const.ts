import { SortDirection, SortType } from '@/core'
import __ from './locale'
/**
 * 节点类型
 * @Activity 业务活动

 */
export enum NodeType {
    Activity = 'business_activity',
    LogicEntity = 'logic_entity',
    Attribute = 'attribute',
    ReferenceNode = 'reference_node',
}

/**
 * 操作类型
 * @OperateType 操作类型
 * CreateLogicEntity 创建逻辑实体
 * ReferenceBusinessObj 关联业务属性或对象
 * Unfold 展开
 * Fold 收起
 * Rename 重命名
 * SetClassification:设置数据分级
 */
export enum OperateType {
    CreateLogicEntity = 'create_logic_entity',
    ReferenceBusinessObj = 'reference_business_obj',
    Unfold = 'unfold',
    Fold = 'fold',
    Rename = 'rename',
    AddAttribute = 'add_attribute',
    Delete = 'delete',
    SetUniqueFlag = 'set_unique_flag',
    CancelUniqueFlag = 'cancel_unique_flag',
    ReferenceStandard = 'reference_standard',
    UpdateReferenceStandard = 'update_reference_standard',
    DeleteReferenceStandard = 'delete_reference_standard',
    SetClassification = 'set_classfication',
}

export const standardFields = [
    {
        label: __('中文名称：'),
        key: 'name',
    },
    {
        label: __('英文名称：'),
        key: 'name_en',
    },
    {
        label: __('数据类型：'),
        key: 'data_type',
    },
]

export enum BusinessType {
    BusinessObj = 'business_object',
    BusinessActivity = 'business_activity',
}
export enum BusinessDomainType {
    subject_domain_group = 'subject_domain_group',
    subject_domain = 'subject_domain',
    business_object = 'business_object',
    business_activity = 'business_activity',
    logic_entity = 'logic_entity',
}

export const BusinessTypeInfo = [
    {
        name: __('业务对象'),
        desc: __('关于人或物的概念定义，具有唯一标识属性'),
        value: BusinessDomainType.business_object,
    },
    // {
    //     name: __('业务活动'),
    //     desc: __('关于事件或过程的概念定义'),
    //     value: BusinessDomainType.business_activity,
    // },
]

export const ownerRoleId = '00002fb7-1e54-4ce1-bc02-626cb1f85f62'

export const menus = [
    { key: SortType.NAME, label: __('按名称排序') },
    { key: SortType.CREATED, label: __('按创建时间排序') },
    { key: SortType.UPDATED, label: __('按更新时间排序') },
]

export const defaultMenu = {
    key: SortType.UPDATED,
    sort: SortDirection.DESC,
}

// 搜索分类
export const LevelType = {
    [BusinessDomainType.subject_domain_group]: __('业务对象分组'),
    [BusinessDomainType.subject_domain]: __('业务对象分组'),
    [BusinessDomainType.business_object]: __('业务对象'),
    [BusinessDomainType.business_activity]: __('业务活动'),
    [BusinessDomainType.logic_entity]: __('逻辑实体'),
}

// 业务对象tab页
export enum ObjectActiveDetail {
    // 属性信息
    Attribute = 'attribute',
    // 分级分类规则
    Classification = 'classification',
}

// 业务对象tab页
export const ObjectActiveTabs = [
    {
        label: __('属性信息'),
        key: ObjectActiveDetail.Attribute,
    },
    {
        label: __('识别规则'),
        key: ObjectActiveDetail.Classification,
    },
]
