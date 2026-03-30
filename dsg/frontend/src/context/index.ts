export * from './LanguageProvider'
export * from './ConfigInfoProvider'
export * from './TaskInfoProvider'
export * from './FrameworkProvider'
export * from './MessageProvider'
export * from './DirTreeProvider'
export * from './DocumentTitleProvider'
export * from './GraphProvider'
export * from './MicroWidgetPropsProvider'
export * from './MicroAppPropsProvider'

// ========== 占位实现：为了兼容遗留代码对认知助手相关导出的引用 ==========
// 认知助手/智能问答相关功能已下线，以下导出仅为占位实现，避免编译和运行时错误。
// 如需彻底移除，可后续逐个文件删除相关调用，再删掉这里的导出。

/**
 * 资源类型枚举（占位实现）
 */
export enum AssetType {
    ALL = 'all',
    DATACATLG = 'data_catalog',
    LOGICVIEW = 'data_view',
    INTERFACESVC = 'interface_svc',
    INDICATOR = 'indicator',
    // 主题模型
    SUBJECT_MODEL = 'subject_model',
    // 专题模型
    THEMATIC_MODEL = 'thematic_model',
}

/**
 * 问答相关参数类型（占位实现）
 */
export enum CogAParamsType {
    Assettype, // 资源类型
    Resource, // 指定资源
    Query, // 问答内容
}
