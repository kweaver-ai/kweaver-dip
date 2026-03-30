// 发布状态
export enum PublishStatus {
    // 创建模型
    CreateModel = 'createModel',
    // 模型发布
    ModePublish = 'modelPublish',

    // 整体发布
    AllPublish = 'allPubish',

    // 重置
    ModeReset = 'modeReset',

    // 模型发布，logic更新
    HasUpdateLogic = 'logicHasChange',
}

export enum TabViewType {
    FORM = 'form',
    CODE = 'code',
}

export enum ExecError {
    EMPTY = 'empty',

    SERVER = 'server',
}
