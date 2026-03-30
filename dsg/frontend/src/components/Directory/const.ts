import { SortDirection } from '@/core/apis/common.d'

export const menus = [
    { key: 'created_at', label: '按创建时间' },
    { key: 'updated_at', label: '按最终修改时间' },
]

export const defaultMenu = {
    key: 'created_at',
    sort: SortDirection.DESC,
}

export enum MoreOperate {
    CREATE = 'create',
    DETAIL = 'detail',
    RENAME = 'rename',
    ADD = 'add',
    EDIT = 'edit',
    DELETE = 'delete',
    MOVETO = 'moveto',
    IMPORT = 'import',
    EXPORT = 'export',
}

export enum TabKey {
    PROCESS = 'process',
    FORM = 'form',
    STANDARD = 'standard',
    INDICATOR = 'indicator',
}

export const tabList = [
    {
        key: TabKey.PROCESS,
        name: '流程',
    },
    {
        key: TabKey.FORM,
        name: '表单',
    },
    {
        key: TabKey.STANDARD,
        name: '标准',
    },
    {
        key: TabKey.INDICATOR,
        name: '指标',
    },
]

/**
 * 传入两个参数
 * @param str 目标字符串（需要被筛选的字符串）
 * @param keyword 筛选条件（筛选需要高亮的字符串）
 * @returns 返回处理后字符串
 */
export const highLight = (
    str: string,
    keyword: string,
    hlClassName?: string,
) => {
    if (!keyword || keyword === '') return str
    return str
        .split(keyword)
        .join(`<span class=${hlClassName || 'dirHighLight'}>${keyword}</span>`)
}
