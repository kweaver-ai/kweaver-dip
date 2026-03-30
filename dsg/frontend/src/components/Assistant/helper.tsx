import { IGetAssistantListParams } from '@/core'

/** 每页加载数量 */
export const PAGE_SIZE = 20

const initSearchParams: IGetAssistantListParams = {
    pagination_marker_str: '',
    category_id: '',
    size: PAGE_SIZE,
    name: '',
    custom_space_id: '',
    is_to_square: 1,
    list_flag: 0,
}

/** 已上架列表的初始搜索参数 */
export const listedSearchParams: IGetAssistantListParams = {
    ...initSearchParams,
    list_flag: 1, // 1: 上架
}

/** 全部列表的初始搜索参数 */
export const allSearchParams: IGetAssistantListParams = {
    ...initSearchParams,
    list_flag: 0, // 0: 全部
}
