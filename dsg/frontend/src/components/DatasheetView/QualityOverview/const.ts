import { SortDirection } from '@/core'

/**
 * 部门质量概览默认参数
 */
export const DefaultDepartParams = {
    limit: 10,
    offset: 1,
    sort: 'f_total_score',
    direction: SortDirection.DESC,
}
