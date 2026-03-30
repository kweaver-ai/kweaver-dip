import { SortDirection } from '@/core'
import { publishStatusList } from '../ResourcesDir/const'
import __ from './locale'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import { PolicyType } from '../AuditPolicy/const'

export const editedDefaultMenu = {
    key: 'created_at',
    sort: SortDirection.DESC,
}
export const lightweightSearchData: any[] = [
    {
        label: __('资源类型'),
        key: 'resource_type',
        options: publishStatusList,
        type: SearchType.Checkbox,
    },
]
export const auditTypeList = [
    {
        label: __('发布审核'),
        value: PolicyType.CatalogPublish,
    },
    {
        label: __('上线审核'),
        value: PolicyType.CatalogOnline,
    },
    {
        label: __('下线审核'),
        value: PolicyType.CatalogOffline,
    },
    {
        label: __('变更审核'),
        value: PolicyType.CatalogChange,
    },
]
