import __ from './locale'

// 积分类型
export enum IntegralType {
    // 反馈型
    FEEDBACK_TYPE = 'feedback',
    // 任务型
    TASK_TYPE = 'task',
    // 需求型
    REQUIREMENTS_TYPE = 'requirements',
}

// 积分类型映射
export const IntegralTypeMap = {
    [IntegralType.FEEDBACK_TYPE]: __('反馈型'),
    [IntegralType.TASK_TYPE]: __('任务型'),
    [IntegralType.REQUIREMENTS_TYPE]: __('需求型'),
}

/**
 * 积分类型选项
 */
export const IntegralTypeOptions = Object.entries(IntegralTypeMap).map(
    ([key, value]) => ({
        label: value,
        value: key,
    }),
)

/**
 * 反馈模块类型
 */
export enum FeedBackModule {
    // 目录反馈
    DIR_FEEDBACK = 'dir_feedback',
    // 共享申请反馈
    SHARE_REQUEST_FEEDBACK = 'share_request_feedback',
}

/**
 * 需求模块类型
 */
export enum RequirementsModule {
    // 供需申请
    REQUIREMENTS_REQUEST = 'requirements_request',
    // 共享申请
    SHARE_REQUEST = 'share_request',
}

/**
 * 需求模块类型映射
 */
export const RequirementsModuleMap = {
    [RequirementsModule.REQUIREMENTS_REQUEST]: __('供需申请'),
    [RequirementsModule.SHARE_REQUEST]: __('共享申请'),
}

/**
 * 需求模块类型选项
 */
export const RequirementsModuleOptions = Object.entries(
    RequirementsModuleMap,
).map(([key, value]) => ({
    label: value,
    value: key,
}))

/**
 * 反馈模块类型映射
 */
export const FeedBackModuleMap = {
    [FeedBackModule.DIR_FEEDBACK]: __('目录反馈'),
    [FeedBackModule.SHARE_REQUEST_FEEDBACK]: __('共享申请成效反馈'),
}

/**
 * 反馈模块类型选项
 */
export const FeedBackModuleOptions = Object.entries(FeedBackModuleMap).map(
    ([key, value]) => ({
        label: value,
        value: key,
    }),
)

/**
 * 积分对象
 */
export enum IntegralObject {
    // 反馈人
    FEEDBACK_USER = 'feedback_user',
    // 目录所属部门
    DIR_OF_DEPARTMENT = 'dir_of_department',
    // 任务执行人
    TASK_EXECUTOR = 'task_executor',
    // 任务发布人
    TASK_PUBLISHER = 'task_publisher',
    // 资源所属部门
    RESOURCE_OF_DEPARTMENT = 'resource_of_department',
}

/**
 * 积分对象映射
 */
export const IntegralObjectMap = {
    [IntegralObject.FEEDBACK_USER]: __('反馈人'),
    [IntegralObject.DIR_OF_DEPARTMENT]: __('目录所属部门'),
    [IntegralObject.TASK_EXECUTOR]: __('任务执行人'),
    [IntegralObject.TASK_PUBLISHER]: __('任务发布人'),
    [IntegralObject.RESOURCE_OF_DEPARTMENT]: __('资源所属部门'),
}

/**
 * 积分对象选项
 */
export const IntegralObjectOptions = Object.entries(IntegralObjectMap).map(
    ([key, value]) => ({
        label: value,
        value: key,
    }),
)

/**
 * 积分条件
 */
export enum IntegralCondition {
    // 提交反馈
    SUBMIT_FEEDBACK = 'submit_feedback',
    // 目录评分
    CATALOG_SCORING = 'catalog_scoring',
    // 任务完成
    TASK_FINISH = 'task_finish',
    // 任务发布
    TASK_PUBLISH = 'task_publish',
    // 提供目录
    PROVIDE_CATALOG = 'provide_catalog',
    // 提供资源
    PROVIDE_RESOURCES = 'provide_resources',
}

/**
 * 积分条件映射
 */
export const IntegralConditionMap = {
    [IntegralCondition.SUBMIT_FEEDBACK]: __('提交反馈'),
    [IntegralCondition.CATALOG_SCORING]: __('获得目录评分'),
    [IntegralCondition.TASK_FINISH]: __('完成任务'),
    [IntegralCondition.TASK_PUBLISH]: __('发布任务'),
    [IntegralCondition.PROVIDE_CATALOG]: __('提供目录'),
    [IntegralCondition.PROVIDE_RESOURCES]: __('提供资源'),
}

/**
 * 积分条件选项
 */
export const IntegralConditionOptions = Object.entries(
    IntegralConditionMap,
).map(([key, value]) => ({
    label: value,
    value: key,
}))

/**
 * 默认积分规则
 */
export const DefaultIntegralRule = {
    strategy_period: [-1, -1],
    type: IntegralType.FEEDBACK_TYPE,
    business_module: FeedBackModule.DIR_FEEDBACK,
    integral_object: IntegralObject.FEEDBACK_USER,
    integral_condition: IntegralCondition.SUBMIT_FEEDBACK,
    strategy_config: [1],
}

/**
 * 获取默认数据
 * @param allData 所有数据
 * @param value 当前数据
 * @returns 默认数据
 */
export const getDefaultData = (allData: Array<any>) => {
    if (allData.length === 0) {
        return DefaultIntegralRule
    }
    const defaultType = getDefaultType(allData)
    const defaultBusinessModule = getDefaultBusinessModule(defaultType, allData)
    const defaultIntegralObject = getDefaultIntegralObject(
        defaultBusinessModule,
        allData,
    )
    const defaultIntegralCondition = getDefaultIntegralCondition(
        defaultType,
        defaultIntegralObject,
    )
    return {
        strategy_period: [-1, -1],
        type: defaultType,
        business_module: defaultBusinessModule,
        integral_object: defaultIntegralObject,
        integral_condition: defaultIntegralCondition,
        strategy_config:
            defaultIntegralCondition === IntegralCondition.CATALOG_SCORING
                ? [1, 1, 1, 1, 1]
                : [1],
    }
}

/**
 * 获取默认积分类型
 * @param allData 所有数据
 * @param value 当前数据
 * @returns 默认积分类型
 */
export const getDefaultType = (allData: Array<any>) => {
    let defaultTypeFeedBack = 0
    let defaultTypeTask = 0
    let defaultTypeRequirements = 0
    allData.forEach((item) => {
        if (item.type === IntegralType.FEEDBACK_TYPE) {
            defaultTypeFeedBack += 1
        } else if (item.type === IntegralType.TASK_TYPE) {
            defaultTypeTask += 1
        } else {
            defaultTypeRequirements += 1
        }
    })
    switch (true) {
        case defaultTypeFeedBack < 3:
            return IntegralType.FEEDBACK_TYPE
        case defaultTypeTask < 2:
            return IntegralType.TASK_TYPE
        case defaultTypeRequirements < 2:
            return IntegralType.REQUIREMENTS_TYPE
        default:
            return ''
    }
}

/**
 * 获取默认业务模块
 * @param defaultType 默认积分类型
 * @param allData 所有数据
 * @returns 默认业务模块
 */
export const getDefaultBusinessModule = (
    defaultType: string,
    allData: Array<any>,
) => {
    const defaultBusinessModule = {
        [FeedBackModule.DIR_FEEDBACK]: 0,
        [FeedBackModule.SHARE_REQUEST_FEEDBACK]: 0,
        [RequirementsModule.REQUIREMENTS_REQUEST]: 0,
        [RequirementsModule.SHARE_REQUEST]: 0,
        data_connect_task: 0,
    }
    allData.forEach((item) => {
        defaultBusinessModule[item.business_module] += 1
    })
    if (defaultType === IntegralType.FEEDBACK_TYPE) {
        if (defaultBusinessModule[FeedBackModule.DIR_FEEDBACK] < 2) {
            return FeedBackModule.DIR_FEEDBACK
        }
        return FeedBackModule.SHARE_REQUEST_FEEDBACK
    }
    if (defaultType === IntegralType.TASK_TYPE) {
        return 'data_connect_task'
    }
    if (defaultBusinessModule[RequirementsModule.REQUIREMENTS_REQUEST] === 0) {
        return RequirementsModule.REQUIREMENTS_REQUEST
    }
    return RequirementsModule.SHARE_REQUEST
}

/**
 * 获取默认积分对象
 * @param businessModule 业务模块
 * @param allData 所有数据
 * @returns 默认积分对象
 */
const getDefaultIntegralObject = (
    businessModule: string,
    allData: Array<any>,
) => {
    switch (businessModule) {
        case FeedBackModule.DIR_FEEDBACK:
            return allData.find(
                (item) =>
                    item.business_module === businessModule &&
                    item.integral_object === IntegralObject.FEEDBACK_USER,
            )
                ? IntegralObject.DIR_OF_DEPARTMENT
                : IntegralObject.FEEDBACK_USER
        case FeedBackModule.SHARE_REQUEST_FEEDBACK:
            return IntegralObject.FEEDBACK_USER
        case 'data_connect_task':
            return allData.find(
                (item) =>
                    item.business_module === businessModule &&
                    item.integral_object === IntegralObject.TASK_EXECUTOR,
            )
                ? IntegralObject.TASK_PUBLISHER
                : IntegralObject.TASK_EXECUTOR
        case RequirementsModule.REQUIREMENTS_REQUEST:
            return IntegralObject.RESOURCE_OF_DEPARTMENT
        case RequirementsModule.SHARE_REQUEST:
            return IntegralObject.RESOURCE_OF_DEPARTMENT
        default:
            return ''
    }
}

/**
 * 获取默认积分条件
 * @param defaultType 默认积分类型
 * @param defaultIntegralObject 默认积分对象
 * @returns 默认积分条件
 */
const getDefaultIntegralCondition = (
    defaultType: string,
    defaultIntegralObject: string,
) => {
    switch (true) {
        case defaultIntegralObject === IntegralObject.FEEDBACK_USER:
            return IntegralCondition.SUBMIT_FEEDBACK
        case defaultIntegralObject === IntegralObject.DIR_OF_DEPARTMENT &&
            defaultType === IntegralType.FEEDBACK_TYPE:
            return IntegralCondition.CATALOG_SCORING
        case defaultIntegralObject === IntegralObject.TASK_EXECUTOR:
            return IntegralCondition.TASK_FINISH
        case defaultIntegralObject === IntegralObject.TASK_PUBLISHER:
            return IntegralCondition.TASK_PUBLISH
        case defaultIntegralObject === IntegralObject.RESOURCE_OF_DEPARTMENT:
            return IntegralCondition.PROVIDE_RESOURCES
        case defaultIntegralObject === IntegralObject.RESOURCE_OF_DEPARTMENT &&
            defaultType === IntegralType.REQUIREMENTS_TYPE:
            return IntegralCondition.PROVIDE_RESOURCES
        default:
            return ''
    }
}

/**
 * 积分ID
 */
export enum IntegralId {
    // 反馈型-目录-反馈人
    FEEDBACK_USER_CATALOG = 'catalog_feedback',
    // 反馈型-共享申请成效-反馈人
    FEEDBACK_USER_SHARE_REQUEST = 'share_application_feedback',
    // 反馈型-目录-目录所属部门
    FEEDBACK_DEPARTMENT_CATALOG = 'catalog_rating',
    // 任务型-数据连接-任务执行人
    TASK_EXECUTOR_DATA_CONNECT = 'data_aggregation_complete',
    // 任务型-数据连接-任务发布人
    TASK_PUBLISHER_DATA_CONNECT = 'data_aggregation_release',
    // 需求型-供需申请-目录
    REQUIREMENTS_REQUEST_CATALOG = 'supply_and_demand_application_submission_directory',
    // 需求型-共享申请-资源
    REQUIREMENTS_REQUEST_RESOURCE = 'share_application_submission_resource',
}

/**
 * 积分ID映射
 */
export const IntegralIdMap = {
    [IntegralId.FEEDBACK_USER_CATALOG]: {
        type: IntegralType.FEEDBACK_TYPE,
        business_module: FeedBackModule.DIR_FEEDBACK,
        integral_object: IntegralObject.FEEDBACK_USER,
        integral_condition: IntegralCondition.SUBMIT_FEEDBACK,
    },
    [IntegralId.FEEDBACK_USER_SHARE_REQUEST]: {
        type: IntegralType.FEEDBACK_TYPE,
        business_module: FeedBackModule.SHARE_REQUEST_FEEDBACK,
        integral_object: IntegralObject.FEEDBACK_USER,
        integral_condition: IntegralCondition.SUBMIT_FEEDBACK,
    },
    [IntegralId.FEEDBACK_DEPARTMENT_CATALOG]: {
        type: IntegralType.FEEDBACK_TYPE,
        business_module: FeedBackModule.DIR_FEEDBACK,
        integral_object: IntegralObject.DIR_OF_DEPARTMENT,
        integral_condition: IntegralCondition.CATALOG_SCORING,
    },
    [IntegralId.TASK_EXECUTOR_DATA_CONNECT]: {
        type: IntegralType.TASK_TYPE,
        business_module: 'data_connect_task',
        integral_object: IntegralObject.TASK_EXECUTOR,
        integral_condition: IntegralCondition.TASK_FINISH,
    },
    [IntegralId.TASK_PUBLISHER_DATA_CONNECT]: {
        type: IntegralType.TASK_TYPE,
        business_module: 'data_connect_task',
        integral_object: IntegralObject.TASK_PUBLISHER,
        integral_condition: IntegralCondition.TASK_PUBLISH,
    },
    [IntegralId.REQUIREMENTS_REQUEST_CATALOG]: {
        type: IntegralType.REQUIREMENTS_TYPE,
        business_module: RequirementsModule.REQUIREMENTS_REQUEST,
        integral_object: IntegralObject.RESOURCE_OF_DEPARTMENT,
        integral_condition: IntegralCondition.PROVIDE_RESOURCES,
    },
    [IntegralId.REQUIREMENTS_REQUEST_RESOURCE]: {
        type: IntegralType.REQUIREMENTS_TYPE,
        business_module: RequirementsModule.SHARE_REQUEST,
        integral_object: IntegralObject.RESOURCE_OF_DEPARTMENT,
        integral_condition: IntegralCondition.PROVIDE_RESOURCES,
    },
}

/**
 * 根据积分配置获取积分ID
 * @param integralConfig 积分配置
 * @returns 积分ID
 */
export const getIdByIntegralConfig = (integralConfig: any) => {
    const { type, business_module, integral_object, integral_condition } =
        integralConfig
    return Object.keys(IntegralIdMap).find(
        (key) =>
            IntegralIdMap[key].type === type &&
            IntegralIdMap[key].business_module === business_module &&
            IntegralIdMap[key].integral_object === integral_object &&
            IntegralIdMap[key].integral_condition === integral_condition,
    )
}

/**
 * 获取未添加的积分配置数量
 * @param type 积分类型
 * @param allData 所有数据
 * @returns 未添加的积分配置数量
 */
export const getUnAddIntegralConfigCount = (
    type: string,
    key: string,
    allData: Array<any>,
) => {
    if (type === IntegralObject.FEEDBACK_USER) {
        const addedFeedUser = allData.find(
            (item) =>
                item.integral_object === IntegralObject.FEEDBACK_USER &&
                item.business_module === FeedBackModule.DIR_FEEDBACK,
        )
        return addedFeedUser ? 0 : 1
    }
    const typeData = Object.keys(IntegralIdMap).filter(
        (item) => IntegralIdMap[item][key] === type,
    )
    return typeData.filter(
        (item) => !allData.find((data) => data.strategy_code === item),
    ).length
}

/**
 * 积分规则配置选项
 */
export const ruleConfigOptions = [
    { key: 'business_module', label: __('业务模块') },
    { key: 'integral_object', label: __('获得积分对象') },
    { key: 'integral_condition', label: __('获得积分条件') },
    { key: 'strategy_config', label: '积分变化' },
    { key: 'strategy_period', label: '规则有效期' },
]

/**
 * 获取默认数据
 * @param allData 所有数据
 * @param value 当前数据
 * @returns 默认数据
 */
export const getCurrentKeyDefaultData = (allData: Array<any>, type, key) => {
    const currentTypesData = Object.keys(IntegralIdMap).filter(
        (item) => IntegralIdMap[item][key] === type,
    )
    return currentTypesData.filter(
        (item) => !allData.find((data) => data.strategy_code === item),
    )
}

/**
 * 获取当前积分类型默认数据
 * @param allData 所有数据
 * @param type 积分类型
 * @returns 当前积分类型默认数据
 */
export const getCurrentTypeDefaultData = (allData: Array<any>, type) => {
    const currentAllData = getCurrentKeyDefaultData(allData, type, 'type').map(
        (item) => IntegralIdMap[item],
    )
    return currentAllData[0]
}
