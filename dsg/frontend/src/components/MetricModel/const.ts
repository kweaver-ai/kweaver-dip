const enum ViewModel {
    // 编辑
    ModelEdit = 'ModelEdit',

    // 预览
    ModelView = 'ModelView',
}

// 节点属性
const enum NodeAttribute {
    // 入表
    InForm = 'inForm',

    // 出表
    outForm = 'outForm',
}

/**
 * 操作编辑模式下的显示
 */
const enum OptionModel {
    // 创建模型
    CreateModel = 'createModel',

    // 编辑模型
    EditModel = 'EditModel',

    // 新建指标
    CreateMetric = 'createMetric',

    // 编辑指标
    EditMetric = 'editMetric',

    // 指标详情
    MetricDetail = 'metricDetail',
}
export { ViewModel, NodeAttribute, OptionModel }
