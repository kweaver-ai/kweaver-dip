import __ from '../locale'

// 规则类型
export enum AlgorithmType {
    BUILT_IN = 'inner',
    CUSTOM = 'custom',
}

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
    // 批量删除
    BATCHDELETE = 'batchDelete',
}

// 算法状态
export enum AlgorithmStatus {
    // 启用的
    ENABLE = 1,
    // 停用的
    DISABLE = 0,
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

// 分类类型
export enum ClassifyType {
    // 分类
    CLASSIFY = 'classify',
    // 分级
    GRADE = 'grade',
}
export const allGroup = {
    id: 'all',
    name: '全部规则',
}
export const unGroup = {
    id: '',
    name: '未分组',
}
