import { SortDirection, SortType } from '@/core'
import __ from './locale'
// 操作类型
export enum OperationType {
    DETAIL = 'detail',
    // 编辑
    EDIT = 'edit',
    // 启用
    ENABLE = 'enable',
    // 停用
    DISABLE = 'disable',
    // 导出
    EXPORT = 'export',
    // 删除
    DELETE = 'delete',
}

// 算法状态
export enum AlgorithmStatus {
    // 启用的
    ENABLE = 1,
    // 停用的
    DISABLE = 0,
}

// 算法类型
export enum AlgorithmType {
    // 内置
    BUILT_IN = 'inner',
    // 自定义
    CUSTOM = 'custom',
}

// 算法类型映射
export const AlgorithmTypeMap = {
    [AlgorithmType.BUILT_IN]: __('内置'),
    [AlgorithmType.CUSTOM]: __('自定义'),
}

// 算法状态映射
export const AlgorithmStatusMap = {
    [AlgorithmStatus.ENABLE]: __('启用'),
    [AlgorithmStatus.DISABLE]: __('停用'),
}

// 操作类型映射
export const OperationTypeMap = {
    [OperationType.DETAIL]: __('详情'),
    [OperationType.EDIT]: __('编辑'),
    [OperationType.ENABLE]: __('启用'),
    [OperationType.DISABLE]: __('停用'),
    [OperationType.EXPORT]: __('导出'),
    [OperationType.DELETE]: __('删除'),
}

/*
 * 排序菜单 标准
 */
export const menus = [
    { key: SortType.NAME, label: __('按名称排序') },
    { key: SortType.CREATED, label: __('按创建时间排序') },
    { key: SortType.UPDATED, label: __('按更新时间排序') },
]

/**
 * 默认排序表单
 */
export const defaultMenu = {
    key: SortType.UPDATED,
    sort: SortDirection.DESC,
}

// 内置算法类型
export enum BuiltInAlgorithmType {
    // 身份证
    ID_CARD = 'id_card',
    // 手机号
    PHONE_NUMBER = 'phone_number',
    // 邮箱
    EMAIL = 'email',
    // 银行卡号
    BANK_CARD = 'bank_card',
}

export const BuiltInAlgorithmTypeMap = {
    [BuiltInAlgorithmType.ID_CARD]: __('身份证'),
    [BuiltInAlgorithmType.PHONE_NUMBER]: __('手机号'),
    [BuiltInAlgorithmType.EMAIL]: __('邮箱'),
    [BuiltInAlgorithmType.BANK_CARD]: __('银行卡号'),
}
