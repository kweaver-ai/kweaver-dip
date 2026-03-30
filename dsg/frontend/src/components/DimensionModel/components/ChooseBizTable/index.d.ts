import { ReactNode } from 'react'
import { ICatalog } from '../../../Requirement/const'
// 数据目录单元
export type IDataCatalogItem = {
    id: string
    technical_name: string
    business_name: string
    uniform_catalog_code: string
}

// 数据目录项
export interface ICatalogItem {
    /**
     * 数据单元
     */
    item: IDataCatalogItem
    /**
     * 是否已关联
     */
    selected?: boolean
    /**
     * 是否选中
     */
    checked?: boolean
    /**
     * 选中事件
     * @param isChecked 是否选中
     * @param item 选中单元
     * @returns
     */
    onCheck?: (isChecked: boolean, item: IDataCatalogItem) => void

    isCheckedbox?: boolean

    handleChangeCheckbox?: (e, item: IDataCatalogItem) => void
}

// 数据目录列表
export interface ICatalogList {
    /**
     * 标题
     */
    title: string
    /**
     * 是否显示搜索框  默认: true
     */
    search: boolean
    /**
     * 已关联ID数组
     */
    bindIds: string[]
    /**
     * 选中项
     */
    selected: IDataCatalogItem
    /**
     * 选中事件
     * @param isSelected 是否选中
     * @param item  选中单元
     * @returns
     */
    onSelect: (isSelected: boolean, item: IDataCatalogItem) => void
    /**
     * 列表初始化为空
     */
    onInitEmpty?: (flag: boolean) => void
    /**
     * owner模式
     */
    owner?: boolean

    multiChecked?: (arr) => void
}

// 字段单元
export type IFieldItem = {
    id: string
    business_name: string
    technical_name: string
    // 0:数字型 1:字符型 2:日期型 3:日期时间型 4:时间戳型 5:布尔型 6:二进制
    data_type: string
    data_length: string
    business_def: string
    business_rule: string
    ai_description: string
}

// 字段属性列表
export interface IFieldList {
    /**
     * 标题
     */
    title: string | ReactNode
    /**
     * 是否显示搜索框  默认: true
     */
    search: boolean
    /**
     * 选中项ID
     */
    selectedId: string
    /**
     * 是否显示code，默认false
     */
    showCode: boolean
    /**
     * 返回切换后的库表列表
     */
    onSwitchNode: (fields: IFieldItem[] | undefined) => void
    /**
     * 是否检查读取权限
     */
    checkReadablePerm?: boolean
    // 是否使用数据预览接口
    useDataPreviewApi?: boolean
}
