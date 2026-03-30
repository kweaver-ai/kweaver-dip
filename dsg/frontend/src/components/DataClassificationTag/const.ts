import { DataGradeLabelType, IGradeLabel } from '@/core'
import __ from './locale'

export enum CreateType {
    Group = 2,
    Tag = 1,
}

export const colorList = [
    '#5B91FF',
    '#3AC4FF',
    '#14CE65',
    '#FF822F',
    '#FFBA30',
    '#8D6F63',
    '#8894FF',
    '#1DD0ED',
    '#14CEAA',
    '#F25D5D',
    '#EF7DE3',
    '#617AAB',
]

export const tagInstructions = [
    __('标签在列表中的顺序决定标签的优先级，越靠上标签的优先级就越高。'),
    __('改变顺序可通过拖动列表行来实现。'),
    __('标签层级最多不超过3级'),
]

export const titleTipsText = [
    __(
        '1、数据分级标签即「密级」标签，根据数据的业务属性，可以对不同敏感级别的数据进行打标分级。',
    ),
    __(
        '2、级别的高低：标签在列表中的顺序决定标签的优先级，越靠上的级别越高，和标签组无关，改变顺序可通过拖动列表行来实现。',
    ),
    __('3、标签层级最多不超过三层。'),
]

export const ItemTypes = 'DraggableBodyRow'

export enum OperateType {
    ADD = 'add',
    EDIT = 'edit',
    CREATE = 'create',
    DELETE = 'delete',
    DETAIL = 'detail',
    MOVE = 'move',
    MOVEUP = 'move_up',
    MOVEDOWN = 'move_down',
}
// 操作类型
export const optionsTyps = {
    didDrop: 'didDrop', // 拖拽出区域
    hover: 'hover',
    drop: 'drop', // 放置
}

// 数据类型
export const dataType = {
    group: 'group',
    child: 'child',
}

export const classifiedOptoins = [
    { label: __('涉密'), value: 'secret' },
    { label: __('非涉密'), value: 'non-secret' },
]
export const sensitiveOptions = [
    { label: __('敏感'), value: 'sensitive' },
    { label: __('不敏感'), value: 'insensitive' },
]
export const shareTypeOptoins = [
    { label: __('无条件共享'), value: 'unconditional_share' },
    { label: __('有条件共享'), value: 'conditional_share' },
    { label: __('不予共享'), value: 'no_share' },
]
export enum GradeLabelBindType {
    BusinessFrom = 'Business_from_field', // 业务表
    BusinessAttri = 'business_attri', // 业务属性
    DataCatalog = 'data_catalog', // 数据目录
    DataStandardization = 'data_standardization', // 数据标准
    DataView = 'data_view', // 数据库表
}
export const gradeLabelBindInfoTypes = [
    GradeLabelBindType.BusinessFrom,
    GradeLabelBindType.BusinessAttri,
    GradeLabelBindType.DataCatalog,
    GradeLabelBindType.DataStandardization,
    GradeLabelBindType.DataView,
]
export const gradeLabelBindInfoTypeMap = {
    [GradeLabelBindType.BusinessFrom]: __('业务表'),
    [GradeLabelBindType.BusinessAttri]: __('属性'),
    [GradeLabelBindType.DataCatalog]: __('数据目录'),
    [GradeLabelBindType.DataStandardization]: __('数据标准'),
    [GradeLabelBindType.DataView]: __('数据库表'),
}
export const findFromData = (data, id) => {
    let row
    let index
    let parentIndex
    data.forEach((item, i) => {
        // 父节点拖拽
        if (item.id === id) {
            row = item
            index = i
            parentIndex = null
        }

        // 子节点拖拽
        const ele = item.children || []
        ele.forEach((it, j) => {
            if (it.id === id) {
                row = it
                index = j
                parentIndex = i
            }
        })
    })

    return {
        row,
        index,
        parentIndex,
    }
}

export const generateData = (data: any[], disabledFn) => {
    data.forEach((item) => {
        // eslint-disable-next-line
        item.disabled = disabledFn(item)

        if (item.children) {
            generateData(item.children, disabledFn)
        }
    })
}

export const getTagsData = (data: IGradeLabel[], tags: IGradeLabel[]) => {
    data.forEach((item) => {
        if (item.node_type === DataGradeLabelType.Node) {
            tags.push(item)
        }
        if (item.children) {
            getTagsData(item.children, tags)
        }
    })
}
export const bindInfoIsEmpty = (bindInfo) => {
    const flag = gradeLabelBindInfoTypes.every(
        (item) => bindInfo?.[item]?.entries?.length === 0,
    )
    return flag
}
