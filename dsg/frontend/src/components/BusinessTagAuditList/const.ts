import __ from './locale'
import { PolicyType } from '../AuditPolicy/const'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'

export const auditType = [
    PolicyType.BigdataCreateCategoryLabel,
    PolicyType.BigdataUpdateCategoryLabel,
    PolicyType.BigdataDeleteCategoryLabel,
    PolicyType.BigdataAuthCategoryLabel,
]
export const auditTypeOptions = [
    {
        value: PolicyType.BigdataCreateCategoryLabel,
        label: __('业务标签分类发布审核申请'),
    },
    {
        value: PolicyType.BigdataUpdateCategoryLabel,
        label: __('业务标签分类变更审核申请'),
    },
    {
        value: PolicyType.BigdataDeleteCategoryLabel,
        label: __('业务标签分类删除审核申请'),
    },
    {
        value: PolicyType.BigdataAuthCategoryLabel,
        label: __('业务标签授权审核申请'),
    },
]

export const searchData: IformItem[] = [
    {
        label: __('申请类型'),
        key: 'type',
        options: [{ value: '', label: '不限' }, ...auditTypeOptions],
        type: SearchType.Radio,
    },
]
