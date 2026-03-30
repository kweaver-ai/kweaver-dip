import { IListParams, SortDirection, SortType } from '../common'

export interface INewsOrPolicListQuery {
    limit: number
    offset: number
    type: 1 | 2 // type：1 为新闻动态 ；2为政策动态
    status?: string // 状态   1 为发布 2 为下线
    direction?: string
    sort?: string
    title?: string
    home_show?: 0 | 1
}

export interface INewsOrPolicItemQuery {
    id?: string
    file?: any
    Title?: string
    Summary?: string
    Content?: string
    Status?: number | string
    Type?: 1 | 2 // type：1 为新闻动态 ；2为政策动态
    HomeShow?: boolean
}
