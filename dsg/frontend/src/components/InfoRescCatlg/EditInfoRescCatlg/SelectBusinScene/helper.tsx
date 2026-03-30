import __ from './locale'

// 应用场景
export enum SceneTypeEnum {
    // 政务服务
    ZWSF = 'government_service',
    // 公共服务
    GGSF = 'public_service',
    // 监管
    JG = 'supervision',
    // 其他
    QT = 'other',
}

export const sceneTypeList: Array<any> = [
    {
        key: SceneTypeEnum.ZWSF,
        label: __('政务服务'),
    },
    {
        key: SceneTypeEnum.GGSF,
        label: __('公共服务'),
    },
    {
        key: SceneTypeEnum.JG,
        label: __('监管'),
    },
    {
        key: SceneTypeEnum.QT,
        label: __('其他'),
    },
]
