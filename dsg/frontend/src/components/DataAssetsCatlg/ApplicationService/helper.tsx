import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import __ from '../locale'
import {
    FilterConditionEleType,
    singleSelDefVal,
} from '../FilterConditionLayout'
import { IFilterCondition } from '../helper'
import { PublishStatus, OnlineStatus } from '@/core'

export enum ViewMode {
    // 主题域
    Domain = 'domain',
    // 组织架构
    Architecture = 'architecture',
}

export const viewModeOptions = [
    { label: __('业务对象'), value: ViewMode.Domain },
    { label: __('组织架构'), value: ViewMode.Architecture },
]

// 数据资源-资源类型
export enum DataRescType {
    NOLIMIT = '',
    // 省级目录-前端定义类型以进行类型区分
    PROVINCE_DATACATLG = 'prvc_catalog',
    // 库表
    LOGICALVIEW = 'data_view',
    // 接口
    INTERFACE = 'interface_svc',

    // 指标
    INDICATOR = 'indicator',

    // 信息资源目录
    INFO_RESC_CATLG = 'info_resc_catlg',
    // 数据资源目录
    DATA_RESC_CATLG = 'data_resc_catlg',
    // 电子证照目录
    LICENSE_CATLG = 'license_catlg',
    // 文件
    FILE = 'file',
}

export const rescTypeOptionList = [
    {
        key: DataRescType.NOLIMIT,
        value: DataRescType.NOLIMIT,
        label: __('不限'),
    },
    {
        key: DataRescType.LOGICALVIEW,
        value: DataRescType.LOGICALVIEW,
        label: __('库表'),
    },
    {
        key: DataRescType.INDICATOR,
        value: DataRescType.INDICATOR,
        label: __('指标'),
    },
    {
        key: DataRescType.INTERFACE,
        value: DataRescType.INTERFACE,
        label: __('接口'),
    },
]

// 单选不限自定义key
export const filterNoLimitKey = 'nolimit'

export enum PublishState {
    UNPUBLISHED = 'unpublished',
    PUBLISHED = 'published',
}

// // 发布状态
// export const stateOptionList = [
//     {
//         key: singleSelDefVal,
//         value: singleSelDefVal,
//         label: __('不限'),
//     },
//     {
//         key: PublishState.UNPUBLISHED,
//         // value: PublishState.UNPUBLISHED,
//         value: false,
//         label: __('未发布'),
//     },
//     {
//         key: PublishState.PUBLISHED,
//         // value: PublishState.PUBLISHED,
//         value: true,
//         label: __('已发布'),
//     },
// ]

// // 上线状态
// export const onlineOptionList = [
//     {
//         key: singleSelDefVal,
//         value: singleSelDefVal,
//         label: __('不限'),
//     },
//     {
//         // 此筛选条件值为false代表筛选未上线，上线审核中，审核未通过，已下线
//         key: OnlineStatus.NOT_ONLINE,
//         value: false,
//         label: __('未上线'),
//     },
//     {
//         key: OnlineStatus.ONLINE,
//         value: true,
//         label: __('已上线'),
//     },
// ]

// 待新建标准过滤项
export const rescSearchData: IformItem[] = [
    {
        label: __('状态'),
        key: 'state',
        options: rescTypeOptionList,
        type: SearchType.Radio,
    },
]

// 未发布状态
export const UnpublishedStatusList = [
    PublishStatus.UNPUBLISHED,
    PublishStatus.PUB_AUDITING,
    PublishStatus.PUB_REJECT,
]

// 未上线状态
export const OfflineStatusList = [
    OnlineStatus.NOT_ONLINE,
    OnlineStatus.UP_AUDITING,
    OnlineStatus.UP_REJECT,
    OnlineStatus.OFFLINE,
]

// 获取数据资源未发布状态
export const getPublishStatus = (status: string) => {
    switch (status) {
        case PublishStatus.PUB_AUDITING:
            return __('发布审核中')
        case PublishStatus.PUB_REJECT:
            return __('发布审核未通过')
        // case PublishStatus.CHANGE_AUDITING:
        //     return __('变更审核中')
        // case PublishStatus.CHANGE_REJECT:
        //     return __('变更审核未通过')
        case PublishStatus.UNPUBLISHED:
        default:
            return ''
    }
}

// export const filterDropDown = (props: DropdownProps) => {
//     return (
//         <Dropdown
//             menu={{
//                 items: rescTypeOptionList,
//                 selectedKeys: [rescType],
//                 onClick: handleRescTypeChange,
//             }}
//             trigger={['click']}
//         onOpenChange={(flag) =>
//         setRescTypeOpen(flag)
//             open={rescTypeOpen}
//             placement="bottomLeft"
//         className={
//         styles.filterDropdown
//             getPopupContainer={(node) => node.parentElement || node}
//         >
//             <span className={styles.filterBtn} title={rescFilterTitle}>
//                 <span className={styles.filterText}>{rescFilterTitle}</span>
//                 <span className={styles.dropIcon}>
//                     {rescTypeOpen ? <UpOutlined /> : <DownOutlined />}
//                 </span>
//             </span>
//         </Dropdown>
//     )
// }

// 主题域/部门-未分类节点
export const Uncategorized = 'Uncategorized '

export const unlimited = { label: __('不限'), value: '', key: '' }
export const publishStatusList = [
    { label: __('不限'), value: '', key: '' },
    { label: __('未发布'), value: '1', key: '1' },
    { label: __('已发布'), value: '2', key: '2' },
]
export const onlineStatusList = [
    { label: __('不限'), value: '', key: '' },
    { label: __('未上线'), value: '1', key: '1' },
    { label: __('已上线'), value: '2', key: '2' },
]

// 数据资源过滤条件
export const rescFilterConditionConfig: Array<IFilterCondition> = [
    {
        key: 'type',
        type: FilterConditionEleType.DROPDOWN,
        open: false,
        label: __('资源类型'),
        expandAll: true,
        options: rescTypeOptionList,
        value: [rescTypeOptionList[0]],
    },
    {
        key: 'is_publish',
        type: FilterConditionEleType.DROPDOWN,
        open: false,
        label: __('发布状态'),
        expandAll: true,
        // options: stateOptionList,
        options: publishStatusList,
        value: [unlimited],
    },
    {
        key: 'is_online',
        type: FilterConditionEleType.DROPDOWN,
        open: false,
        label: __('上线状态'),
        expandAll: true,
        // options: onlineOptionList,
        // value: [onlineOptionList[0]],
        options: onlineStatusList,
        value: [unlimited],
    },
    {
        key: 'online_at',
        type: FilterConditionEleType.DATE,
        label: __('上线时间'),
        expandAll: true,
    },
]
