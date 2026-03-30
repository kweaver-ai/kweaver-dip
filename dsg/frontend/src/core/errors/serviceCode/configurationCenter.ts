/**
 * 模块： 配置中心  configuration-center
 */
import { combineToKV } from './helper'

// Public Error
const PublicErrorCode = {
    PublicInternalError: 'ConfigurationCenter.Public.InternalError',
    PublicInvalidParameter: 'ConfigurationCenter.Public.InvalidParameter',
    PublicInvalidParameterJson:
        'ConfigurationCenter.Public.InvalidParameterJson',
    PublicInvalidParameterValue:
        'ConfigurationCenter.Public.InvalidParameterValue',
    PublicDatabaseError: 'ConfigurationCenter.Public.DatabaseError',
    PublicRequestParameterError:
        'ConfigurationCenter.Public.RequestParameterError',
    PublicUniqueIDError: 'ConfigurationCenter.Public.PublicUniqueIDError',
}
const PublicErrorMap = {
    [PublicErrorCode.PublicInternalError]: {
        description: '内部错误',
    },
    [PublicErrorCode.PublicInvalidParameter]: {
        description: '参数值校验不通过',
    },
    [PublicErrorCode.PublicInvalidParameterJson]: {
        description: '参数值校验不通过：json格式错误',
    },
    [PublicErrorCode.PublicInvalidParameterValue]: {
        description: '参数值${param}校验不通过',
    },
    [PublicErrorCode.PublicDatabaseError]: {
        description: '数据库异常',
    },
    [PublicErrorCode.PublicRequestParameterError]: {
        description: '请求参数格式错误',
    },
    [PublicErrorCode.PublicUniqueIDError]: {
        description: 'ID生成失败',
    },
}

// Flowchart Error
const FlowchartErrorCode = {
    FlowchartNameAlreadyExist: 'ConfigurationCenter.Flowchart.NameAlreadyExist',
    FlowchartNotExist: 'ConfigurationCenter.Flowchart.FlowchartNotExist',
    FlowchartNotInEditing:
        'ConfigurationCenter.Flowchart.FlowchartNotInEditing',
    FlowchartAlreadyInEditing:
        'ConfigurationCenter.Flowchart.FlowchartAlreadyInEditing',
    FlowchartAlreadyEdited:
        'ConfigurationCenter.Flowchart.FlowchartAlreadyEdited',
    FlowchartOnlyClonedOne:
        'ConfigurationCenter.Flowchart.FlowchartOnlyClonedOne',
    FlowchartContentInvalid:
        'ConfigurationCenter.Flowchart.FlowchartContentInvalid',
    FlowchartContentIsEmpty: 'ConfigurationCenter.Flowchart.ContentIsEmpty',

    FlowchartVersionNotExist:
        'ConfigurationCenter.Flowchart.FlowchartVersionNotExist',
    FlowchartVersionCanNotDeleteByNotInEditing:
        'ConfigurationCenter.Flowchart.FlowchartVersionCanNotDeleteByNotInEditing',
    FlowchartVersionCanNotDeleteByEdited:
        'ConfigurationCenter.Flowchart.FlowchartVersionCanNotDeleteByEdited',
    FlowchartVersionNotReleased:
        'ConfigurationCenter.Flowchart.FlowchartVersionNotReleased',

    FlowchartNodeAlreadyExistTask:
        'ConfigurationCenter.Flowchart.NodeAlreadyExistTask',
    FlowchartNodeNotExistTask: 'ConfigurationCenter.Flowchart.NodeNotExistTask',

    FlowchartNodeTaskOnlyOneOfRoleAndTool:
        'ConfigurationCenter.Flowchart.NodeTaskOnlyOneOfRoleAndTool',
    FlowchartNodeTaskNotExist: 'ConfigurationCenter.Flowchart.NodeTaskNotExist',
    FlowchartNodeNotExist: 'ConfigurationCenter.Flowchart.NodeNotExist',
    FlowchartNodeNameRepeat: 'ConfigurationCenter.Flowchart.NodeNameRepeat',
    FlowchartNodeCountTooMuch: 'ConfigurationCenter.Flowchart.NodeCountTooMuch',
    FlowchartNodeUnitIDRepeat: 'ConfigurationCenter.Flowchart.NodeUnitIDRepeat',
    FlowchartNodeNotStage: 'ConfigurationCenter.Flowchart.NodeNotStage',
    FlowchartNodeStageNotFound:
        'ConfigurationCenter.Flowchart.NodeStageNotFound',
    FlowchartNodeMultiStart: 'ConfigurationCenter.Flowchart.NodeMultiStart',
    FlowchartNodeMultiEnd: 'ConfigurationCenter.Flowchart.NodeMultiEnd',
    FlowchartNodeHasLoop: 'ConfigurationCenter.Flowchart.NodeHasLoop',
    FlowchartNodeExistFree: 'ConfigurationCenter.Flowchart.NodeExistFree',
    FlowchartNodeExecutorRoleNotExist:
        'ConfigurationCenter.Flowchart.NodeExecutorRoleNotExist',
    FlowchartNodeTaskTypeNotMatched:
        'ConfigurationCenter.Flowchart.NodeTaskTypeNotMatched',

    FlowchartStageNotExist: 'ConfigurationCenter.Flowchart.StageNotExist',
    FlowchartStageUnitIDRepeat:
        'ConfigurationCenter.Flowchart.StageUnitIDRepeat',
    FlowchartStageNameRepeat: 'ConfigurationCenter.Flowchart.StageNameRepeat',
    FlowchartStageCountTooMuch:
        'ConfigurationCenter.Flowchart.StageCountTooMuch',
    FlowchartStagePositionOverlap:
        'ConfigurationCenter.Flowchart.StagePositionOverlap',

    FlowchartConnectorNotExist:
        'ConfigurationCenter.Flowchart.ConnectorNOtExist',
    FlowchartConnectorUnitIDRepeat:
        'ConfigurationCenter.Flowchart.ConnectorUnitIDRepeat',

    FlowchartRoleMissing: 'ConfigurationCenter.Flowchart.FlowchartRoleMissing',
}
const FlowchartErrorMap = {
    [FlowchartErrorCode.FlowchartNameAlreadyExist]: {
        description: '该工作流程名称已存在',
    },
    [FlowchartErrorCode.FlowchartNotExist]: {
        description: '指定的工作流程不存在',
    },
    [FlowchartErrorCode.FlowchartVersionNotExist]: {
        description: '指定的工作流程版本不存在',
    },
    [FlowchartErrorCode.FlowchartVersionCanNotDeleteByNotInEditing]: {
        description: '指定的工作流程版本不能被删除',
    },
    [FlowchartErrorCode.FlowchartVersionCanNotDeleteByEdited]: {
        description: '指定的工作流程版本不能被删除',
    },
    [FlowchartErrorCode.FlowchartVersionNotReleased]: {
        description: '指定的工作流程版本处于未发布状态',
    },
    [FlowchartErrorCode.FlowchartNotInEditing]: {
        description: '当前工作流程不处于编辑中',
    },
    [FlowchartErrorCode.FlowchartAlreadyInEditing]: {
        description: '当前工作流程已经处于编辑中',
    },
    [FlowchartErrorCode.FlowchartAlreadyEdited]: {
        description: '当前工作流程已经被编辑',
    },
    [FlowchartErrorCode.FlowchartNodeAlreadyExistTask]: {
        description: '该工作流程节点已经存在任务配置',
    },
    [FlowchartErrorCode.FlowchartNodeNotExistTask]: {
        description: '该工作流程节点不存在任务配置',
    },
    [FlowchartErrorCode.FlowchartNodeTaskOnlyOneOfRoleAndTool]: {
        description:
            '工作流程节点的任务配置必须配置角色或工具，且不能同时配置角色和工具',
    },
    [FlowchartErrorCode.FlowchartNodeTaskNotExist]: {
        description: '指定的工作流程节点不存在任务配置',
    },
    [FlowchartErrorCode.FlowchartStageNotExist]: {
        description: '指定的工作流程阶段不存在',
    },
    [FlowchartErrorCode.FlowchartNodeNotExist]: {
        description: '指定的工作流程节点不存在',
    },
    [FlowchartErrorCode.FlowchartConnectorNotExist]: {
        description: '指定的工作流程连接不存在',
    },
    [FlowchartErrorCode.FlowchartOnlyClonedOne]: {
        description:
            '新建工作流程时只能在模版和已存在工作流程中选择一个进行复用',
    },
    [FlowchartErrorCode.FlowchartContentInvalid]: {
        description: '无效的工作流程内容',
    },
    [FlowchartErrorCode.FlowchartNodeNameRepeat]: {
        description: '节点${name}名称不唯一',
    },
    [FlowchartErrorCode.FlowchartStageUnitIDRepeat]: {
        description: '阶段${name}单元ID不唯一',
    },
    [FlowchartErrorCode.FlowchartStageNameRepeat]: {
        description: '阶段${name}名称不唯一',
    },
    [FlowchartErrorCode.FlowchartStageCountTooMuch]: {
        description: '阶段数量超过${count}',
    },
    [FlowchartErrorCode.FlowchartNodeCountTooMuch]: {
        description: '节点数量超过${count}',
    },
    [FlowchartErrorCode.FlowchartNodeUnitIDRepeat]: {
        description: '节点${name}单元ID不唯一',
    },
    [FlowchartErrorCode.FlowchartConnectorUnitIDRepeat]: {
        description: '连接线${id}单元ID不唯一',
    },
    [FlowchartErrorCode.FlowchartNodeNotStage]: {
        description: '存在节点没有处于阶段中',
    },
    [FlowchartErrorCode.FlowchartStagePositionOverlap]: {
        description: '存在多个阶段位置重叠',
    },
    [FlowchartErrorCode.FlowchartNodeStageNotFound]: {
        description: '节点${name}所属阶段不存在',
    },
    [FlowchartErrorCode.FlowchartNodeMultiStart]: {
        description: '存在多个开始节点',
    },
    [FlowchartErrorCode.FlowchartNodeMultiEnd]: {
        description: '存在多个结束节点',
    },
    [FlowchartErrorCode.FlowchartNodeHasLoop]: {
        description: '节点之间存在闭环',
    },
    [FlowchartErrorCode.FlowchartNodeExistFree]: {
        description: '存在游离节点',
    },
    [FlowchartErrorCode.FlowchartContentIsEmpty]: {
        description: '画布内容为空',
    },
    [FlowchartErrorCode.FlowchartRoleMissing]: {
        description: '工作流程任务角色缺失',
    },
    [FlowchartErrorCode.FlowchartNodeExecutorRoleNotExist]: {
        description: '存在节点角色被删除，请重新选择',
    },
    [FlowchartErrorCode.FlowchartNodeTaskTypeNotMatched]: {
        description: '第一个节点任务类型需要包含业务建模任务',
    },
}

// Login Error
const LoginErrorCode = {
    TokenAuditFailed: 'ConfigurationCenter.TokenAuditFailed',
    UserNotActive: 'ConfigurationCenter.UserNotActive',
    GetUserInfoFailed: 'ConfigurationCenter.GetUserInfoFailed',
    GetUserInfoFailedInterior: 'ConfigurationCenter.GetUserInfoFailedInterior',
    GetTokenEmpty: 'ConfigurationCenter.GetTokenEmpty',
}
const LoginErrorMap = {
    [LoginErrorCode.TokenAuditFailed]: {
        description: '用户信息验证失败',
    },
    [LoginErrorCode.UserNotActive]: {
        description: '用户登录已过期',
    },
    [LoginErrorCode.GetUserInfoFailed]: {
        description: '获取用户信息失败',
    },
    [LoginErrorCode.GetUserInfoFailedInterior]: {
        description: '获取用户信息失败',
    },
    [LoginErrorCode.GetTokenEmpty]: {
        description: '获取用户信息失败',
    },
}

// Node Config Error
const NodeConfigErrorCode = {
    FlowchartNotFound: 'ConfigurationCenter.NodeConfig.FlowchartNodeFound',
    FlowchartUnitNotFound: 'ConfigurationCenter.NodeConfig.FlowchartUnitFound',

    FlowchartNodeConfigAlreadyExist:
        'ConfigurationCenter.NodeConfig.NodeConfigAlreadyExist',
    FlowchartNodeConfigNotExist:
        'ConfigurationCenter.NodeConfig.NodeConfigNotExist',
}

const NodeConfigErrorMap = {
    [NodeConfigErrorCode.FlowchartNotFound]: {
        description: '工作流程配置不存在',
    },
    [NodeConfigErrorCode.FlowchartUnitNotFound]: {
        description: '工作流程单元不存在',
    },
    [NodeConfigErrorCode.FlowchartNodeConfigAlreadyExist]: {
        description: '当前节点已存在节点配置',
    },
    [NodeConfigErrorCode.FlowchartNodeConfigNotExist]: {
        description: '当前节点还未创建节点配置',
    },
}

// Role Error
const RoleErrorCode = {
    RoleNotExist: 'ConfigurationCenter.Role.RoleNotExist',
    RoleIconNotExist: 'ConfigurationCenter.Role.RoleIconNotExist',
    RoleNameRepeat: 'ConfigurationCenter.Role.RoleNameRepeat',
    DefaultRoleCannotDeleted:
        'ConfigurationCenter.Role.DefaultRoleCannotDeleted',
    DiscardRoleCannotEdit: 'ConfigurationCenter.Role.DiscardRoleCannotEdit',
    DefaultRoleCannotEdit: 'ConfigurationCenter.Role.DefaultRoleCannotEdit',
    RoleDeleteError: 'ConfigurationCenter.Role.RoleDeleteError',
    RoleDeleteMessageSendError:
        'ConfigurationCenter.Role.RoleDeleteMessageSendError',

    UserNotExist: 'ConfigurationCenter.Role.UserNotExist',
    RoleDatabaseError: 'ConfigurationCenter.Role.RoleDatabaseError',
    UserRoleInvalidParameter:
        'ConfigurationCenter.Role.UserRoleInvalidParameter',
    UserRoleInvalidParameterJson:
        'ConfigurationCenter.Role.UserRoleInvalidParameterJson',
    UserRoleDeleteError: 'ConfigurationCenter.Role.UserRoleDeleteError',
    RoleHadDiscard: 'ConfigurationCenter.Role.RoleHadDiscard',
    UserRoleAlReadyDeleted: 'ConfigurationCenter.Role.UserRoleAlReadyDeleted',
    AddRoleUserError: 'ConfigurationCenter.Role.AddRoleUserError',
    UserRoleDeleteMessageSendError:
        'ConfigurationCenter.Role.UserRoleDeleteMessageSendError',
}
const RoleErrorMap = {
    [RoleErrorCode.RoleNotExist]: {
        description: '该角色不存在',
    },
    [RoleErrorCode.RoleIconNotExist]: {
        description: '角色图标不存在',
    },
    [RoleErrorCode.AddRoleUserError]: {
        description: '给角色添加用户失败',
    },
    [RoleErrorCode.RoleNameRepeat]: {
        description: '角色名称重复',
    },
    [RoleErrorCode.UserNotExist]: {
        description: '用户不存在',
    },
    [RoleErrorCode.RoleDatabaseError]: {
        description: '数据库连接错误',
    },
    [RoleErrorCode.UserRoleInvalidParameter]: {
        description: '参数值校验不通过',
    },
    [RoleErrorCode.UserRoleInvalidParameterJson]: {
        description: '参数值校验不通过：json格式错误',
    },
    [RoleErrorCode.UserRoleDeleteError]: {
        description: '用户角色删除失败',
    },
    [RoleErrorCode.RoleHadDiscard]: {
        description: '该角色已抛弃',
    },
    [RoleErrorCode.DefaultRoleCannotDeleted]: {
        description: '内置角色不允许删除',
    },
    [RoleErrorCode.DiscardRoleCannotEdit]: {
        description: '角色已废弃',
    },
    [RoleErrorCode.DefaultRoleCannotEdit]: {
        description: '内置角色不允许修改',
    },
    [RoleErrorCode.RoleDeleteError]: {
        description: '角色删除失败',
    },
    [RoleErrorCode.RoleDeleteMessageSendError]: {
        description: '角色删除消息发送失败',
    },
    [RoleErrorCode.UserRoleDeleteMessageSendError]: {
        description: '用户角色删除消息发送失败',
    },
    [RoleErrorCode.UserRoleAlReadyDeleted]: {
        description: '该角色中用户不存在',
    },
}

// tool_error
const ToolErrorCode = {
    ToolNotExist: 'ConfigurationCenter.Tool.RoleNotExist',
}

const ToolErrorMap = {
    [ToolErrorCode.ToolNotExist]: {
        description: '工具不存在',
    },
}

// User Code
const UserErrorCode = {
    UserDataBaseError: 'ConfigurationCenter.User.UserDataBaseError',
    UserIdNotExistError: 'ConfigurationCenter.User.UserIdNotExistError',
    UIdNotExistError: 'ConfigurationCenter.User.UIdNotExistError',
    AccessTypeNotSupport: 'ConfigurationCenter.User.AccessTypeNotSupport',
    UserNotHavePermission: 'ConfigurationCenter.User.UserNotHavePermission',
    DrivenUserManagementError:
        'ConfigurationCenter.User.DrivenUserManagementError',
    DrivenUserManagementDepartIdNotExist:
        'ConfigurationCenter.User.DrivenUserManagementDepartIdNotExist',
    DrivenDeleteDataSourceFailed:
        'ConfigurationCenter.DrivenDeleteDataSourceFailed',
}
const UserErrorMap = {
    [UserErrorCode.UserDataBaseError]: {
        description: '数据库错误',
    },
    [UserErrorCode.UserIdNotExistError]: {
        description: '用户不存在',
    },
    [UserErrorCode.UIdNotExistError]: {
        description: '用户不存在',
    },
    [UserErrorCode.AccessTypeNotSupport]: {
        description: '暂不支持的访问类型',
    },
    [UserErrorCode.UserNotHavePermission]: {
        description: '暂无权限，您可联系系统管理员配置',
    },
    [UserErrorCode.DrivenUserManagementError]: {
        description: 'id不存在或者用户管理服务异常',
    },
    [UserErrorCode.DrivenUserManagementDepartIdNotExist]: {
        description: '部门id不存在',
    },
    [UserErrorCode.DrivenDeleteDataSourceFailed]: {
        description: '删除数据源失败，请联系管理员',
    },
}

export const ConfigurationCenterCodeMessage = combineToKV(
    PublicErrorMap,
    FlowchartErrorMap,
    LoginErrorMap,
    NodeConfigErrorMap,
    RoleErrorMap,
    ToolErrorMap,
    UserErrorMap,
)
