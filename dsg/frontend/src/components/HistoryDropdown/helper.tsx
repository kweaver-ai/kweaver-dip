import { DropdownProps } from 'antd'
import { ReactNode } from 'react'

// 历史记录详情
export interface IHistoryItem {
    // 搜素id
    qid: string

    // 搜素关键字
    qword: string

    // 搜素关键字高亮
    qhighlight: string

    // 搜素时间
    qdatetime: string
}

export interface IHistoryDropdown extends DropdownProps {
    // 搜索关键字
    keyword: string

    // 点击搜素记录
    onClickHistory: (item: IHistoryItem) => void

    // children
    children: ReactNode

    // 是否显示历史记录
    showHistory: boolean

    // 点击获取认知助手回答
    onClickCogSearchQA?: (keyword: string) => void

    // 点击获取所有搜索结果
    onClickCogSearchAll?: (keyword: string) => void
}
