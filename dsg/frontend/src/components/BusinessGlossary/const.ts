import __ from '../BusinessDomain/locale'
/**
 * @params glossary 术语表
 * @params category 类别
 * @params terms 术语
 */
export enum GlossaryType {
    GLOSSARY = 'glossary',
    CATEGORIES = 'category',
    TERMS = 'term',
}

export const GlossaryTypeOptions = [
    { label: __('术语表'), value: GlossaryType.GLOSSARY },
    { label: __('类别'), value: GlossaryType.CATEGORIES },
    { label: __('术语'), value: GlossaryType.TERMS },
]
/**
 * @params GLOSSARY 术语表
 * @params CATEGORIES 类别
 * @params TERMS 术语
 */
export enum GlossaryStatus {
    Uncertified = 'uncertified',
    Deprecated = 'deprecated',
    Draft = 'draft',
    Certified = 'certified',
}
export const ClossaryStatusList = [
    {
        label: __('草稿中'),
        value: GlossaryStatus.Draft,
        color: 'rgba(191, 191, 191, 1)',
        bgColor: 'rgba(191, 191, 191, 0.1)',
    },
    // {
    //     label: '弃用',
    //     value: GlossaryStatus.Deprecated,
    //     color: 'rgba(191, 191, 191, 1)',
    //     bgColor: 'rgba(191, 191, 191, 0.1)',
    // },
    {
        label: __('未认证'),
        value: GlossaryStatus.Uncertified,
        color: 'rgba(250, 172, 20, 1)',
        bgColor: 'rgba(250, 172, 20, 0.1)',
    },
    {
        label: __('已认证'),
        value: GlossaryStatus.Certified,
        color: 'rgba(82, 196, 27, 1)',
        bgColor: 'rgba(82, 196, 27, 0.1)',
    },
]
export interface IGetObject {
    id: string
    keyword?: string
}

export const allNodeInfo = {
    id: '',
    type: 'all',
    path: '',
    name: __('全部'),
}

// 组织架构/资源目录-通用树节点
export interface CatlgTreeNode {
    id: string
    name: string
    path?: string
    type?: string
    parent_id?: string
    expansion?: boolean
    expansion_flag?: boolean
    level?: number
    glossary_id?: string
    children?: CatlgTreeNode[]
    isExpand?: boolean
    status: string
}
export enum optionType {
    Move = 'move',
    AddRelation = 'addRelation',
}
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
    if (!keyword) return str
    const pattern = new RegExp(
        keyword.replace(/[.[*?+^$|()/]|\]|\\/g, '\\$&'),
        'gi',
    )
    return str?.replace(pattern, `<span class=${hlClassName}>$&</span>`)
}

/**
 * @param key 目录节点key
 * @param data 目录datat
 * @param aimItemPrams 匹配key值为参数key的节点并向其中加上aimItemPrams
 * @param hasNoChildParms 没有孩子的节点添加hasNoChildParms
 * @param otherItemParms otherItemParms
 * @returns
 */
export const oprTreeData = (
    key: string,
    data: [],
    aimItemPrams: {},
    hasNoChildParms?: {},
    otherItemParms?: {},
) => {
    data?.forEach((item: any) => {
        if (item.id === key) {
            Object.assign(item, aimItemPrams)
        } else if (otherItemParms) {
            Object.assign(item, otherItemParms)
        }
        if (item.children) {
            oprTreeData(
                key,
                item.children,
                aimItemPrams,
                hasNoChildParms,
                otherItemParms,
            )
        } else {
            Object.assign(item, hasNoChildParms)
        }
    })
    return data
}
