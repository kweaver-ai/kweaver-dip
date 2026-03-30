import { PolicyType } from '@/components/AuditPolicy/const'
import { OrderPolicyMap, OrderType, OrderTypeOptions } from '../helper'
import __ from './locale'
import { IformItem, SearchType as ST } from '@/ui/LightweightSearch/const'
/** 上报审核类型 */
export enum AuditType {
    /** 待审核 */
    Tasks = 'tasks',
    /** 已审核 */
    Historys = 'historys',
}

export const AuditStatusOptions = [
    {
        label: __('不限'),
        value: undefined,
    },
    {
        label: __('已通过'),
        value: 'pass',
        color: 'rgb(75, 190, 71)',
    },
    {
        label: __('已驳回'),
        value: 'reject',
        color: 'rgb(246, 107, 118)',
    },
    {
        label: __('已撤销'),
        value: 'undone',
        color: 'rgb(159, 159, 159)',
    },
]

export const OrderTypes = [
    {
        key: OrderType.AGGREGATION,
        label: __('归集工单'),
        value: OrderType.AGGREGATION,
    },
    {
        key: OrderType.STANDARD,
        label: __('标准化工单'),
        value: OrderType.STANDARD,
    },
    {
        key: OrderType.QUALITY,
        label: __('质量整改'),
        value: OrderType.QUALITY,
    },
    {
        key: OrderType.QUALITY_EXAMINE,
        label: __('检测工单'),
        value: OrderType.QUALITY_EXAMINE,
    },
    {
        key: OrderType.FUNSION,
        label: __('融合工单'),
        value: OrderType.FUNSION,
    },
    {
        key: OrderType.COMPREHENSION,
        label: __('理解工单'),
        value: OrderType.COMPREHENSION,
    },
]

// 质量整改不属于工单类型
export const WorkOrderTypes = OrderTypeOptions.filter(
    (o) => o.key !== OrderType.QUALITY,
)

export const WorkOrderAllType = Object.values(OrderPolicyMap)
    .filter((o) => o !== PolicyType.WorkOrderQuality)
    .join(',')

export const filterItems: IformItem[] = [
    {
        label: __('审核状态'),
        key: 'status',
        options: AuditStatusOptions,
        type: ST.Radio,
    },
]

export const getAuditSearchParams = (orderType: string) => {
    switch (orderType) {
        // case OrderType.FUNSION:
        //     return {
        //         formData: [
        //             {
        //                 label: __('申请编号、工单名称'),
        //                 key: 'keyword',
        //                 type: SearchType.Input,
        //                 isAlone: true,
        //                 itemProps: {
        //                     maxLength: 255,
        //                 },
        //             },
        //         ] as IFormItem[],
        //         menu: [
        //             {
        //                 key: SortType.APPLYTIME,
        //                 label: __('按申请时间排序'),
        //             },
        //         ],
        //         defaultMenu: {
        //             key: SortType.APPLYTIME,
        //             label: __('按申请时间排序'),
        //             sort: SortDirection.DESC,
        //         },
        //     }
        default:
            return {
                formData: [],
                menu: [],
                defaultMenu: undefined,
            }
    }
}
