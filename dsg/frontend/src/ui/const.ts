export enum OptionMenuType {
    // 菜单显示
    Menu = 'menu',
    // 更多显示
    More = 'more',
}

/**
 * 展示组件类型
 */
export enum ComponentType {
    // 文本组件
    Input = 'Input',

    // 判断组件
    Select = 'Select',

    // 文本域组件
    TextArea = 'TextArea',

    // 组合布局
    LayoutGroup = 'LayoutGroup',

    // 数字框
    InputNumber = 'InputNumber',
}

/**
 * 列表模式
 * @params WideList 宽列表
 * @params NarrowList 窄列表
 * @params CardList 卡片模式
 *
 */
export enum ListType {
    WideList = 'wideList',
    NarrowList = 'narrowList',
    CardList = 'cardList',
}

// 列表分页选项
export const ListPageSizerOptions = {
    [ListType.WideList]: [10, 20, 50, 100],
    [ListType.NarrowList]: [10, 20, 50, 100],
    [ListType.CardList]: [12, 24, 60, 120],
}

// 列表默认分页选项
export const ListDefaultPageSize = {
    [ListType.WideList]: 10,
    [ListType.NarrowList]: 20,
    [ListType.CardList]: 12,
}
