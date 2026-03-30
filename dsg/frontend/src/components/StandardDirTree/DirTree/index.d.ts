import type { TreeProps } from 'antd'
import * as React from 'react'
import { CatalogType, CatalogOption } from '@/core'
/**
 * 目录树自定义属性
 */
export interface DirConfProps {
    // 目录类型
    dirType: CatalogType

    // 自定义目录/标准文件目录
    catlgClassOption?: CatalogOption

    /** 是否展示搜索  默认: true */
    showSearch: boolean

    /** 是否展示搜索  默认: false */
    isSearchLoading: boolean

    /** 是否展示搜索  默认: false */
    isTreeLoading: boolean

    /** 搜索框提示词  默认: 请输入 */
    placeholder: string

    /** 提示词宽度 默认: 0 */
    placeholderWith: number

    /** 新建按钮提示语 默认：新建目录 */
    addTips: string

    /** 搜索库表内容 */
    inputRender: React.ReactNode

    /** 是否展示"全部"选项 默认: true */
    showTopTitle: boolean

    /** 顶部选项内容 默认: 全部 */
    topTitle: React.ReactNode

    /** 是否能选中顶部选项  默认: true */
    canCheckTopTitle: boolean

    /** 是否选中全部 */
    isCheckTop: boolean

    /** 空库表内容 */
    emptyRender: React.ReactNode

    /** 搜索结果空库表内容 */
    emptySearchRender: React.ReactNode

    /** 搜索结果是否为空 默认: true */
    isSearchEmpty: boolean

    /** 搜索结果内容 */
    searchRender: React.ReactNode

    /** 点击顶部内容事件 */
    onTopTitleClick: () => void

    /** 搜索关键字改变事件 */
    onSearchChange: (value: string) => void

    /** 添加按钮点击回调 */
    onAdd: () => void

    /** 全部节点数量 */
    allCatlgCount?: number
}

/**
 * 目录树属性: 综合 自定义DirConfProps 与 Antd TreeProps
 */
export interface DirTreeProps extends TreeProps {
    conf?: Partial<DirConfProps>
}
