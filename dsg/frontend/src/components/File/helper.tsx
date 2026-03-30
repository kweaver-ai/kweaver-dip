import { trim } from 'lodash'
import { AttachmentType, StateType, SortDirection } from '@/core'
import __ from './locale'

// 文件列表中的排序字段类型
export enum FileSorterType {
    CREATED = 'create_time',
    UPDATED = 'update_time',
    ACTDATE = 'act_date',
    DISABLEDATE = 'disable_date',
    STATE = 'state',
}

/**
 * 查询参数
 */
export interface ISearchCondition {
    // 选择目录的id
    catalog_id: number | string
    // 页数，默认1
    offset?: number
    // 每页数量，默认5条
    limit?: number
    // 标准组织类型
    org_type?: number
    // 启用状态
    state?: StateType
    // 搜索关键字
    keyword?: string
    // 排序字段
    sort: FileSorterType
    // 排序方向
    direction?: SortDirection
}

// 标准文件-标准维护中对话框类型
export enum FileModalType {
    // 标准文件
    FileList = 'fileList',

    // 标准维护
    Maintainance = 'maintenance',

    // 数据元
    DataElement = 'dataElement',

    // 码表
    CodeTable = 'codeTable',

    // 编码标准
    CodeRule = 'codeRule',
}

// 文件图标类型
export enum FileIconType {
    PDF = 'pdf',
    DOC = 'doc',
    DOCX = 'docx',
    LINK = 'link',
}

// 支持文件格式
export const supportFileTypeList = [
    FileIconType.DOC,
    FileIconType.DOCX,
    FileIconType.PDF,
]

// 文件类型
export const fileTypeOptions = [
    {
        label: __('上传文件'),
        value: AttachmentType.FILE,
        typeLabel: __('文件'),
    },
    {
        label: __('添加链接'),
        value: AttachmentType.URL,
        typeLabel: __('链接'),
    },
]

/**
 * 检查地址合法性(from AF)
 */

export const checkWebsiteUrl = (rule: any, value: any) => {
    if (rule.test(trim(value))) {
        return Promise.resolve()
    }
    return Promise.reject(new Error(__('链接格式不符合要求，请重新输入')))
}
