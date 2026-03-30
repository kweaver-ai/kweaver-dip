import { Key } from 'react'
import { IDirItem, StdFileCatlgType } from '@/core'
import { SortDirection, SortType } from '@/core/apis/common.d'

export const menus = [
    { key: 'created_at', label: '按创建时间' },
    { key: 'updated_at', label: '按最终修改时间' },
]

export const defaultMenu = {
    key: SortType.CREATED,
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

/**
 * 数据获取类别
 */
export enum StdTreeDataOpt {
    Init,
    Load,
    Search,
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

// 将标准文件目录数据格式({catalogs:{id, catalog_name, children}, files:{filed_id, file_name}})转为标准树结构格式({id, catalog_name, children})
export const fileCatlgTreeToStdTreeData = (data?: any) => {
    return data?.map((node) => {
        const { children, files, ...props } = node
        const newFiles: any[] = []
        const newChildren: any[] = []

        files?.forEach((fItem) => {
            newFiles.push({
                id: fItem.file_id,
                catalog_name: fItem.file_name,
                // count: fItem.file_count,
                isLeaf: true,
                stdFileCatlgType: StdFileCatlgType.FILE,
            })
        })

        const newNode = { ...node }

        if (newNode.children?.length || newNode.files?.length) {
            const myChildren = (newNode.children || []).concat(newFiles || [])
            return {
                ...newNode,
                isLeaf: !newNode.have_children,
                children: fileCatlgTreeToStdTreeData(myChildren),
            }
        }

        return { ...node }
    })
}

/**
 * 更新目录树数据
 * @param list 当前目录树列表
 * @param id 选中项id
 * @param children 选中项子目录
 * @returns 更新后的目录树数据
 */
export const updateTreeData = (
    list: IDirItem[],
    id: string,
    children: IDirItem[],
): IDirItem[] =>
    list.map((node) => {
        // children是数组，即使是[]也会展示“展开”按钮（不管isLeaf的值）
        if (node.id === id) {
            return {
                ...node,
                isLeaf: !children?.length,
                children: children?.map((child) => ({
                    ...child,
                })),
            }
        }
        if (node.children?.length) {
            return {
                ...node,
                children: updateTreeData(node.children, id, children),
            }
        }
        return { ...node }
    })

/**
 * @param key 目录节点key
 * @param data 目录datat
 * @param aimItemPrams 匹配key值为参数key的节点并向其中加上aimItemPrams
 * @param otherItemParms otherItemParms
 * @returns
 */
export const oprTreeData = (
    key: string,
    data: [],
    aimItemPrams: {},
    otherItemParms?: {},
) => {
    data.forEach((item: any) => {
        if (item.id === key) {
            Object.assign(item, aimItemPrams)
        } else if (otherItemParms) {
            Object.assign(item, otherItemParms)
        }
        if (item.children) {
            oprTreeData(key, item.children, aimItemPrams, otherItemParms)
        }
    })
    return data
}

// 通过key获取目录
export const findDirByKey = (
    value: Key,
    data: any[],
    objKey?: string,
): IDirItem | undefined => {
    let dir
    const newObjKey = objKey || 'id'
    data.forEach((item: any) => {
        if (item[newObjKey] === value) {
            dir = item
        } else if (item.children) {
            const res = findDirByKey(value, item.children, objKey)
            if (res) {
                dir = res
            }
        }
    })
    return dir
}
