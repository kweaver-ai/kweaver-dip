/**
 * 模块： 任务中心  task-center
 */
import { combineToKV } from './helper'

// Public Error
const PublicErrorCode = {
    InternalError: `TaskCenter.InternalError`,
    MissingUserToken: 'TaskCenter.Common.MissingUserToken',
    InvalidUserToken: 'TaskCenter.Common.InvalidUserToken',
    InvalidUser: 'TaskCenter.Common.InvalidUser',
    PublicServiceError: 'TaskCenter.Common.ServiceError',
    PublicResourceNotFound: 'TaskCenter.Common.ResourceNotFound',
    PublicParseDataError: 'TaskCenter.Common.ParseDataError',
    PublicCallParametersError: 'TaskCenter.Common.CallParametersError',
    PublicDatabaseError: 'TaskCenter.Common.DatabaseError',
}

const PublicErrorMap = {
    [PublicErrorCode.InternalError]: {
        description: '内部错误',
    },
    [PublicErrorCode.MissingUserToken]: {
        description: '用户token必填',
    },
    [PublicErrorCode.InvalidUserToken]: {
        description: '用户token非法',
    },
    [PublicErrorCode.InvalidUser]: {
        description: '该用户不存在',
    },
    [PublicErrorCode.PublicServiceError]: {
        description: '调用服务${service}异常，或url地址有误',
    },
    [PublicErrorCode.PublicResourceNotFound]: {
        description: '从${service}获取资源，${name}:[Id]不存在',
    },
    [PublicErrorCode.PublicParseDataError]: {
        description: '从${service}获取资源，解析数据错误或返回数据错误',
    },
    [PublicErrorCode.PublicCallParametersError]: {
        description: '从${service}获取资源, 参数错误',
    },
    [PublicErrorCode.PublicDatabaseError]: {
        description: '数据库异常',
    },
}

// Driven Error
const DrivenErrorCode = {
    GetGlossaryError: 'TaskCenter.Driven.GetGlossaryError',
}
const DrivenErrorMap = {
    [DrivenErrorCode.GetGlossaryError]: {
        description: '获取术语表下节点失败',
    },
}

// Login Error
const LoginErrorCode = {
    TokenAuditFailed: 'TaskCenter.Login.TokenAuditFailed',
    UserNotActive: 'TaskCenter.Login.UserNotActive',
    GetUserInfoFailed: 'TaskCenter.Login.GetUserInfoFailed',
    GetUserInfoFailedInterior: 'TaskCenter.Login.GetUserInfoFailedInterior',
    GetTokenEmpty: 'TaskCenter.Login.GetTokenEmpty',
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

// Operation Log Error
const OperationLogErrorCode = {
    OperationLogInvalidParameter: 'TaskCenter.OperationLog.InvalidParameter',
    OperationLogDatabaseError: 'TaskCenter.OperationLog.DatabaseError',
}

const OperationLogErrorMap = {
    [OperationLogErrorCode.OperationLogInvalidParameter]: {
        description: '参数值校验不通过',
    },
    [OperationLogErrorCode.OperationLogDatabaseError]: {
        description: '数据库连接错误或者SQL语句错误',
    },
}

// Oss Error
const OssErrorCode = {
    OssFormDataReadError: 'TaskCenter.OSS.FormDataReadError',
    OssInvalidParameter: 'TaskCenter.OSS.InvalidParameter',
    OssMustUploadFile: 'TaskCenter.OSS.MustUploadFile',
    OssFileReadError: 'TaskCenter.OSS.FileReadError',
    OssMaxFileSize: 'TaskCenter.OSS.MaxFileSizeError',
    OssFileFormatNotSupport: 'TaskCenter.OSS.FileFormatNotSupport',
    OssInsertFail: 'TaskCenter.OSS.InsertFail',
    OssQueryFail: 'TaskCenter.OSS.QueryFail',
    OssRecordNotFound: 'TaskCenter.OSS.RecordNotFound',
    OssSaveTableFail: 'TaskCenter.OSS.SvaeFail',
}
const OssErrorMap = {
    [OssErrorCode.OssFormDataReadError]: {
        description: '表单数据读取错误',
    },
    [OssErrorCode.OssSaveTableFail]: {
        description: '表单插入错误',
    },
    [OssErrorCode.OssInsertFail]: {
        description:
            '通过OSS网关上传文件失败,请检查OSS配置和网关是否连接对象存储',
    },
    [OssErrorCode.OssQueryFail]: {
        description:
            '通过OSS网关下载文件失败,请检查OSS配置和网关是否连接对象存储',
    },
    [OssErrorCode.OssInvalidParameter]: {
        description: '参数值校验不通过',
    },
    [OssErrorCode.OssMustUploadFile]: {
        description: '必须上传一个文件',
    },
    [OssErrorCode.OssFileReadError]: {
        description: '文件读取错误',
    },
    [OssErrorCode.OssMaxFileSize]: {
        description: '仅支持JPG、JPEG、PNG格式，且大小不可超过1M',
    },
    [OssErrorCode.OssFileFormatNotSupport]: {
        description: '仅支持JPG、JPEG、PNG格式，且大小不可超过1M',
    },
    [OssErrorCode.OssRecordNotFound]: {
        description: '该对象不存在',
    },
}

// Project Error
const ProjectErrorCode = {
    ProjectInvalidParameter: 'TaskCenter.Project.InvalidParameter',
    ProjectInvalidParameterJson: 'TaskCenter.Project.InvalidParameterJson',
    ProjectNameRepeatError: 'TaskCenter.Project.NameRepeatError',
    ProjectDatabaseError: 'TaskCenter.Project.DatabaseError',
    ProjectStatusError: 'TaskCenter.Project.StatusError',
    ProjectCompletedCantUpdateError: 'TaskCenter.Project.CompletedCantUpdate',
    ProjectStatusCompletedError: 'TaskCenter.Project.StatusCompletedError',
    ProjectRecordNotFoundError: 'TaskCenter.Project.RecordNotFoundError',
    ProjectViewNotFoundError: 'TaskCenter.Project.ViewNotFoundError',
    ProjectNotAllowedError: 'TaskCenter.Project.NotAllowedError',
    ProjectModifiableKeyEmpty: 'TaskCenter.Project.ModifiableKeyEmpty',
    ProjectConfigCenterDataError: 'TaskCenter.Project.ConfigCenterDataError',
    ProjectConfigCenterUrlError: 'TaskCenter.Project.ConfigCenterUrlError',
    ProjectConfigCenterFlowNotFound:
        'TaskCenter.Project.ConfigCenterFlowNotFound',
    ProjectGetAllTaskError: 'TaskCenter.Project.GetAllTaskError',
    ProjectImgNotFound: 'TaskCenter.Project.ProjectImgNotFound',
    ProjectAndViewNotMatchedError:
        'TaskCenter.Project.ProjectAndViewNotMatchedError',

    ProjectGroomingDataError: 'TaskCenter.Project.BusinessGroomingDataError',
    ProjectGroomingUrlError: 'TaskCenter.Project.BusinessGroomingUrlError',
    ProjectRoleNotFoundError: 'TaskCenter.Project.RoleNotFoundError',
    ProjectRelatedFlowChartValid:
        'TaskCenter.Project.ProjectRelatedFlowChartValid',
    ProjectInvalidRole: 'TaskCenter.Project.InvalidRole',
    ProjectCompletedCantDeleteError:
        'TaskCenter.Project.CompletedCantDeleteError',
    ProjectActiveTaskError: 'TaskCenter.Project.ProjectActiveTaskError',
    ProjectHasInvalidTaskError: 'TaskCenter.Project.HasInvalidTaskError',
    ProjectCallBusinessGroomingError:
        'TaskCenter.Project.CallBusinessGroomingError',
    OwnerIdIsNotProjectMgm: 'TaskCenter.Project.OwnerIdIsNotProjectMgm',
}
const ProjectErrorMap = {
    [ProjectErrorCode.ProjectInvalidParameter]: {
        description: '参数值校验不通过',
    },
    [ProjectErrorCode.ProjectInvalidParameterJson]: {
        description: '参数值校验不通过：json格式错误',
    },
    [ProjectErrorCode.ProjectDatabaseError]: {
        description: '数据库连接错误或者SQL语句错误',
    },
    [ProjectErrorCode.ProjectStatusError]: {
        description: '项目状态修改错误，请检查重试',
    },
    [ProjectErrorCode.ProjectCompletedCantUpdateError]: {
        description: '已完成的项目不允许编辑',
    },
    [ProjectErrorCode.ProjectCompletedCantDeleteError]: {
        description: '已完成的项目不允许删除',
    },
    [ProjectErrorCode.ProjectStatusCompletedError]: {
        description: '该项目存在未完成的任务，暂不可变更为已完成状态',
    },
    [ProjectErrorCode.ProjectNameRepeatError]: {
        description: '该项目名称已存在，请重新输入',
    },
    [ProjectErrorCode.ProjectRecordNotFoundError]: {
        description: '该项目不存在',
    },
    [ProjectErrorCode.ProjectViewNotFoundError]: {
        description: '该流水线库表不存在',
    },
    [ProjectErrorCode.ProjectNotAllowedError]: {
        description: '项目不允许删除',
    },
    [ProjectErrorCode.ProjectModifiableKeyEmpty]: {
        description: '可修改属性为空',
    },
    [ProjectErrorCode.ProjectConfigCenterDataError]: {
        description: '配置中心返回的数据有误',
    },
    [ProjectErrorCode.ProjectConfigCenterUrlError]: {
        description: '配置中心服务异常，或url地址有误',
    },
    [ProjectErrorCode.ProjectConfigCenterFlowNotFound]: {
        description: '该版本的流水线不存在',
    },
    [ProjectErrorCode.ProjectGetAllTaskError]: {
        description: '该项目不存在任务，暂不可变更为已完成状态',
    },
    [ProjectErrorCode.ProjectImgNotFound]: {
        description: '该图片不存在',
    },
    [ProjectErrorCode.ProjectAndViewNotMatchedError]: {
        description: '项目和流水线不匹配',
    },

    [ProjectErrorCode.ProjectGroomingDataError]: {
        description: '业务治理服务返回的数据有误',
    },
    [ProjectErrorCode.ProjectGroomingUrlError]: {
        description: '业务治理服务异常，或url地址有误',
    },
    [ProjectErrorCode.ProjectRoleNotFoundError]: {
        description: '项目角色不存在',
    },
    [ProjectErrorCode.ProjectRelatedFlowChartValid]: {
        description: '关联流水线失效，请重新选择',
    },
    [ProjectErrorCode.ProjectInvalidRole]: {
        description: '流水线不存在该角色',
    },
    [ProjectErrorCode.ProjectActiveTaskError]: {
        description: '激活任务失败',
    },
    [ProjectErrorCode.ProjectHasInvalidTaskError]: {
        description: '项目完成前请先删除失效任务',
    },
    [ProjectErrorCode.OwnerIdIsNotProjectMgm]: {
        description: '项目负责人不具备项目管理员角色',
    },
    [ProjectErrorCode.ProjectCallBusinessGroomingError]: {
        description: '调用业务治理服务错误',
    },
}

// Relation Data Error
const RelationDataErrorCode = {
    RelationDataInvalidParameter: 'TaskCenter.RelationData.InvalidParameter',
    RelationDataInvalidParameterJson:
        'TaskCenter.RelationData.InvalidParameterJson',
    RelationDataDatabaseError: 'TaskCenter.RelationData.DatabaseError',
    RelationDataParseJsonError: 'TaskCenter.RelationData.ParseJsonError',
    RelationDataMultiMainBusinessError:
        'TaskCenter.RelationData.MultiMainBusinessError',
    RelationDataNotMatchedMainBusinessError:
        'TaskCenter.RelationData.NotMatchedMainBusinessError',
    RelationDataInvalidIdType: 'TaskCenter.RelationData.InvalidIdType',
    RelationDataInvalidIdExists: 'TaskCenter.RelationData.InvalidIdExists',
    RelatedMainBusinessShouldNotEmpty:
        'TaskCenter.RelationData.MainBusinessShouldNotEmpty',
    RelatedDataNotComprehendedExists:
        'TaskCenter.RelationData.NotComprehendedExists',
}
const RelationDataErrorMap = {
    [RelationDataErrorCode.RelationDataInvalidParameter]: {
        description: '参数值校验不通过',
    },
    [RelationDataErrorCode.RelationDataInvalidParameterJson]: {
        description: '参数值校验不通过：json格式错误',
    },
    [RelationDataErrorCode.RelationDataDatabaseError]: {
        description: '数据库连接错误或者SQL语句错误',
    },
    [RelationDataErrorCode.RelationDataParseJsonError]: {
        description: '关联数据解析错误',
    },
    [RelationDataErrorCode.RelationDataMultiMainBusinessError]: {
        description: '关联数据出现在多个业务模型',
    },
    [RelationDataErrorCode.RelationDataNotMatchedMainBusinessError]: {
        description: '关联数据的业务模型和表单的业务模型不匹配',
    },
    [RelationDataErrorCode.RelationDataInvalidIdType]: {
        description: '不合法的关联数据类型',
    },
    [RelationDataErrorCode.RelationDataInvalidIdExists]: {
        description: '关联数据部分不存在或被删除',
    },
    [RelationDataErrorCode.RelatedMainBusinessShouldNotEmpty]: {
        description: '关联业务模型不能为空',
    },
    [RelationDataErrorCode.RelatedDataNotComprehendedExists]: {
        description: '存在未理解的数据资源目录，请检查',
    },
}

// Task Error
const TaskErrorCode = {
    TaskInvalidParameter: 'TaskCenter.Task.InvalidParameter',
    TaskInvalidParameterJson: 'TaskCenter.Task.InvalidParameterJson',
    TaskNameRepeatError: 'TaskCenter.Task.NameRepeatError',
    TaskDatabaseError: 'TaskCenter.Task.DatabaseError',
    TaskRecordNotFoundError: 'TaskCenter.Task.RecordNotFoundError',
    TaskPanic: 'TaskCenter.Task.Panic',

    TaskToModelError: 'TaskCenter.Task.ToModelError',
    TaskProjectNotFound: 'TaskCenter.Task.ProjectNotFound',
    TaskTaskNotFound: 'TaskCenter.Task.TaskNotFound',
    TaskNodeNotFound: 'TaskCenter.Task.NodeNotFound',
    TaskExecutorUserRoleNotInNode: 'TaskCenter.Task.ExecutorUserRoleNotInNode',
    TaskNodeExecutorRoleIdNotExist:
        'TaskCenter.Task.NodeExecutorRoleIdNotExist',
    TaskExecutorUserNotHasMembersInProject:
        'TaskCenter.Task.ExecutorUserNotHasMembersInProject',
    TaskExecutorUserNotInProjectMembers:
        'TaskCenter.Task.ExecutorUserNotInProjectMembers',
    TaskProjectMembersIsEmpty: 'TaskCenter.Task.ProjectMembersIsEmpty',
    TaskCannotOpening: 'TaskCenter.Task.CannotOpening',
    TaskCannotOpeningNoExecutor: 'TaskCenter.Task.CannotOpeningNoExecutor',
    TaskLackProjectId: 'TaskCenter.Task.LackProjectId',
    TaskExecutorFilteringFailed: 'TaskCenter.Task.ExecutorFilteringFailed',
    TaskFlowNotExist: 'TaskCenter.Task.FlowNotExist',
    TaskNodeNotExist: 'TaskCenter.Task.NodeNotExist',
    TaskUserNotExist: 'TaskCenter.Task.UserNotExist',
    TaskStatusChangesFailed: 'TaskCenter.Task.StatusChangesFailed',
    TaskStageIdIsRequired: 'TaskCenter.Task.StageIdIsRequired',
    TaskFlowHadNodeNoStage: 'TaskCenter.Task.FlowHadNodeNoStage',
    TaskFlowHadNoNode: 'TaskCenter.Task.FlowHadNoNode',
    TaskStageIdIllegality: 'TaskCenter.Task.StageIdIllegality',
    TaskNodeNotBelongStageId: 'TaskCenter.Task.NodeNotBelongStageId',
    TaskNodeIdRequired: 'TaskCenter.Task.NodeIdRequired',
    TaskDeleteFailed: 'TaskCenter.Task.DeleteFailed',
    TaskCanNotDelete: 'TaskCenter.Task.CanNotDelete',
    TaskCanNotChangeExecutor: 'TaskCenter.Task.CanNotChangeExecutor',
    TaskCanNotBothChangeExecutorAndStatus:
        'TaskCenter.Task.CanNotBothChangeExecutorAndStatus',
    TaskCanNotChangeStatusWhenProjectNotStart:
        'TaskCenter.Task.CanNotChangeStatusWhenProjectNotStart',
    TaskOnlyProjectOwnerCanChange: 'TaskCenter.Task.OnlyProjectOwnerCanChange',
    TaskHasPreNodeNotExist: 'TaskCenter.Task.HasPreNodeNotExist',
    TaskHasPreNodeTasksEmpty: 'TaskCenter.Task.HasPreNodeTasksEmpty',
    TaskAllPreNodeTasksEmpty: 'TaskCenter.Task.AllPreNodeTasksEmpty',
    TaskCannotOpening1: 'TaskCenter.Task.TaskCannotOpening1',
    TaskCannotOpening2: 'TaskCenter.Task.TaskCannotOpening2',
    TaskProjectCompletedNoCreate:
        'TaskCenter.Task.TaskProjectCompletedNoCreate',
    TaskProjectCompletedNoModify:
        'TaskCenter.Task.TaskProjectCompletedNoModify',
    TaskProjectCompletedNoDelete:
        'TaskCenter.Task.TaskProjectCompletedNoDelete',
    TaskCompletedNoModify: 'TaskCenter.Task.TaskCompletedNoModify',
    TaskCannotCreate: 'TaskCenter.Task.TaskCannotCreate',
    TaskTypeNotMathNode: 'TaskCenter.Task.TaskTypeNotMathNode',

    TaskDomainNotEmpty: 'TaskCenter.Task.TaskDomainNotEmpty',
    TaskDomainMustEmpty: 'TaskCenter.Task.TaskDomainMustEmpty',
    TaskDomainNotExist: 'TaskCenter.Task.TaskDomainNotExist',
    TaskMainBusinessNotExist: 'TaskCenter.Task.TaskMainBusinessNotExist',
    TaskMainBusinessNotDeleted: 'TaskCenter.Task.TaskMainBusinessDeleted',
    TaskMainBusinessNotEmpty: 'TaskCenter.Task.TaskMainBusinessNotEmpty',
    TaskActiveFollowError: 'TaskCenter.Task.TaskActiveFollowError',
    FieldTaskStandaloneNotAllowed:
        'TaskCenter.Task.FieldTaskStandaloneNotAllowed',
    ParentTaskIdEmpty: 'TaskCenter.Task.ParentTaskIdEmpty',
    ParentTaskMustMatched: 'TaskCenter.Task.ParentTaskMustMatched',
    SubTaskMustFinished: 'TaskCenter.Task.SubTaskMustFinished',
    FieldStandardMustFinished: 'TaskCenter.Task.FieldStandardMustFinished',
    ParentTaskIdNotExists: 'TaskCenter.Task.ParentTaskIdNotExists',
    ParentTaskIdNotOnGoing: 'TaskCenter.Task.ParentTaskIdNotOnGoing',
    StandardTaskFinisRateQueryError:
        'TaskCenter.Task.StandardTaskFinisRateQueryError',
    TaskModelShouldBeMainBusiness:
        'TaskCenter.Task.TaskModelShouldBeMainBusiness',
    TaskRelationDataInvalid: 'TaskCenter.Task.RelationDataInvalid',
    TaskRelationDataEmpty: 'TaskCenter.Task.RelationDataEmpty',
    TaskRelationDataQueryError: 'TaskCenter.Task.RelationDataQueryError',
    TaskRelationDataDeleteError: 'TaskCenter.Task.RelationDataDeleteError',
    TaskExecutorRoleIdNotExist: 'TaskCenter.Task.TaskExecutorRoleIdNotExist',
    TaskDataCatalogJsonError: 'TaskCenter.Task.DataCatalogJsonError',
    TaskDataCatalogUrlError: 'TaskCenter.Task.DataCatalogUrlError',
    TaskDataCatalogQueryError: 'TaskCenter.Task.DataCatalogQueryError',
}

const TaskErrorMap = {
    [TaskErrorCode.TaskInvalidParameter]: {
        description: '参数值校验不通过',
    },
    [TaskErrorCode.TaskInvalidParameterJson]: {
        description: '参数值校验不通过：json格式错误',
    },
    [TaskErrorCode.TaskDatabaseError]: {
        description: '数据库连接错误或者SQL语句错误',
    },
    [TaskErrorCode.TaskNameRepeatError]: {
        description: '该任务名称已存在，请重新输入',
    },
    [TaskErrorCode.TaskRecordNotFoundError]: {
        description: '该任务不存在',
    },

    [TaskErrorCode.TaskToModelError]: {
        description: '任务信息不合法',
    },
    [TaskErrorCode.TaskProjectNotFound]: {
        description: '该项目不存在',
    },
    [TaskErrorCode.TaskTaskNotFound]: {
        description: '该任务不存在',
    },
    [TaskErrorCode.TaskNodeNotFound]: {
        description: '该节点不存在',
    },
    [TaskErrorCode.TaskExecutorUserRoleNotInNode]: {
        description: '所选任务执行人角色不属于该节点的角色',
    },
    [TaskErrorCode.TaskNodeExecutorRoleIdNotExist]: {
        description: '该流水线节点的可执行角色在角色列表中不存在',
    },
    [TaskErrorCode.TaskExecutorUserNotHasMembersInProject]: {
        description: '该项目中没有所选任务执行人角色的项目成员',
    },
    [TaskErrorCode.TaskExecutorUserNotInProjectMembers]: {
        description: '所选任务执行人不在项目成员中',
    },
    [TaskErrorCode.TaskProjectMembersIsEmpty]: {
        description: '暂未添加该节点可执行角色的项目成员',
    },
    [TaskErrorCode.TaskCannotOpening]: {
        description: '任务不能开启，请完成序节点状态',
    },
    [TaskErrorCode.TaskCannotOpeningNoExecutor]: {
        description: '任务不能开启，任务缺少任务执行人',
    },
    [TaskErrorCode.TaskLackProjectId]: {
        description: '缺少项目标识',
    },
    [TaskErrorCode.TaskExecutorFilteringFailed]: {
        description: '我执行的任务不能按任务执行人筛选',
    },
    [TaskErrorCode.TaskFlowNotExist]: {
        description: '流水线不存在',
    },
    [TaskErrorCode.TaskNodeNotExist]: {
        description: '该节点不存在',
    },
    [TaskErrorCode.TaskUserNotExist]: {
        description: '该任务执行人不存在',
    },
    [TaskErrorCode.TaskStatusChangesFailed]: {
        description:
            '该任务状态切换失败,只能按照未开启->进行中->已完成流程切换状态',
    },
    [TaskErrorCode.TaskStageIdIsRequired]: {
        description: '该流水线有阶段，阶段id必填',
    },
    [TaskErrorCode.TaskFlowHadNodeNoStage]: {
        description: '该流水线存在某个节点不属于某个阶段',
    },
    [TaskErrorCode.TaskFlowHadNoNode]: {
        description: '该流水线没有节点',
    },
    [TaskErrorCode.TaskStageIdIllegality]: {
        description: '该阶段id不存在该项目的流水线中',
    },
    [TaskErrorCode.TaskNodeNotBelongStageId]: {
        description: '该节点不属于该阶段',
    },
    [TaskErrorCode.TaskNodeIdRequired]: {
        description: '编辑关联项目，节点必选',
    },
    [TaskErrorCode.TaskDeleteFailed]: {
        description: '该任务不存在',
    },
    [TaskErrorCode.TaskCanNotDelete]: {
        description: '任务已完成，不允许删除',
    },
    [TaskErrorCode.TaskCanNotChangeExecutor]: {
        description: '该状态的任务不能修改执行人',
    },
    [TaskErrorCode.TaskCanNotBothChangeExecutorAndStatus]: {
        description: '任务不能同时开启任务和修改执行人为空',
    },
    [TaskErrorCode.TaskCanNotChangeStatusWhenProjectNotStart]: {
        description: '项目未开启情况下任务也不能开启',
    },
    [TaskErrorCode.TaskOnlyProjectOwnerCanChange]: {
        description: '只有项目管理员才能从完成切换到',
    },
    [TaskErrorCode.TaskHasPreNodeNotExist]: {
        description: '存在不合法的前序节点',
    },
    [TaskErrorCode.TaskHasPreNodeTasksEmpty]: {
        description: '该节点的前序节点并未添加任务，请先添加任务',
    },
    [TaskErrorCode.TaskAllPreNodeTasksEmpty]: {
        description: '该节点的全部前序节点并未添加任务，请先添加任务',
    },
    [TaskErrorCode.TaskCannotOpening1]: {
        description: '该节点的前序节点中任务并未全部完成，请检查',
    },
    [TaskErrorCode.TaskCannotOpening2]: {
        description: '该节点的全部前序节点中存在未完成的任务，请检查',
    },
    [TaskErrorCode.TaskProjectCompletedNoCreate]: {
        description: '已完成的项目不允许新建',
    },
    [TaskErrorCode.TaskProjectCompletedNoModify]: {
        description: '已完成的项目不允许修改',
    },
    [TaskErrorCode.TaskProjectCompletedNoDelete]: {
        description: '已完成的项目不允许删除',
    },
    [TaskErrorCode.TaskCompletedNoModify]: {
        description: '已完成的任务不允许编辑',
    },
    [TaskErrorCode.TaskCannotCreate]: {
        description: '当前项目中该节点状态为“已完成”，无法新建任务',
    },
    [TaskErrorCode.TaskTypeNotMathNode]: {
        description: '无法新建与节点任务类型不匹配的任务',
    },

    [TaskErrorCode.TaskDomainNotEmpty]: {
        description: '建模类任务，必须关联业务领域',
    },
    [TaskErrorCode.TaskDomainMustEmpty]: {
        description: '非建模类任务，业务领域必须为空',
    },
    [TaskErrorCode.TaskDomainNotExist]: {
        description: '该业务领域不存在',
    },
    [TaskErrorCode.TaskMainBusinessNotExist]: {
        description: '该业务模型不存在',
    },
    [TaskErrorCode.TaskMainBusinessNotDeleted]: {
        description: '该业务模型已被删除',
    },
    [TaskErrorCode.TaskMainBusinessNotEmpty]: {
        description: '必须关联业务模型',
    },
    [TaskErrorCode.FieldTaskStandaloneNotAllowed]: {
        description: '单个任务不支持新建标准任务',
    },
    [TaskErrorCode.ParentTaskIdEmpty]: {
        description: '新建标准任务关联的业务表标准化任务不能为空',
    },
    [TaskErrorCode.ParentTaskMustMatched]: {
        description: '新建标准任务只能关联的业务表标准化任务',
    },
    [TaskErrorCode.SubTaskMustFinished]: {
        description: '新建标准任务必须都完成才可以完成业务表标准化任务',
    },
    [TaskErrorCode.FieldStandardMustFinished]: {
        description: '字段标准必须都创建完毕才可以完成新建标准任务',
    },
    [TaskErrorCode.ParentTaskIdNotExists]: {
        description: '父任务不存在',
    },
    [TaskErrorCode.ParentTaskIdNotOnGoing]: {
        description: '父任务未开启',
    },
    [TaskErrorCode.StandardTaskFinisRateQueryError]: {
        description: '新建标准任务字段完成详情查询错误',
    },
    [TaskErrorCode.TaskModelShouldBeMainBusiness]: {
        description: '指标类任务必须关联业务模型对应的业务模型',
    },
    [TaskErrorCode.TaskActiveFollowError]: {
        description: '激活后续任务失败',
    },
    [TaskErrorCode.TaskRelationDataInvalid]: {
        description: '任务关联的数据非法',
    },
    [TaskErrorCode.TaskRelationDataEmpty]: {
        description: '任务关联的数据为空',
    },
    [TaskErrorCode.TaskRelationDataQueryError]: {
        description: '任务关联数据查询错误',
    },
    [TaskErrorCode.TaskRelationDataDeleteError]: {
        description: '任务关联数据删除错误',
    },
    [TaskErrorCode.TaskExecutorRoleIdNotExist]: {
        description: '该任务的可执行角色在角色列表中不存在',
    },
    [TaskErrorCode.TaskDataCatalogJsonError]: {
        description: '数据资源目录接口数据错误',
    },
    [TaskErrorCode.TaskDataCatalogUrlError]: {
        description: '数据资源目录服务异常，或url地址有误',
    },
    [TaskErrorCode.TaskDataCatalogQueryError]: {
        description: '数据资源目录查询失败',
    },
}

// User Error
const UserErrorCode = {
    UserDataBaseError: 'TaskCenter.User.UserDataBaseError',
    UserIdNotExistError: 'TaskCenter.User.UserIdNotExistError',
    UIdNotExistError: 'TaskCenter.User.UIdNotExistError',
    UserMgmCallError: 'TaskCenter.User.UserMgmCallError',
    AccessTypeNotSupport: 'TaskCenter.User.AccessTypeNotSupport',
    UserNotHavePermission: 'TaskCenter.User.UserNotHavePermission',
    GetAccessPermissionError: 'TaskCenter.User.GetAccessPermissionError',
    AddUsersToRoleError: 'TaskCenter.User.AddUsersToRoleError',
    DeleteUsersToRoleError: 'TaskCenter.User.DeleteUsersToRoleError',
    GetProjectMgmRoleUsers: 'TaskCenter.User.GetRoleUsers',
    UserIsInProjectMgm: 'TaskCenter.User.UserIsInRole',
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
    [UserErrorCode.UserMgmCallError]: {
        description: '用户管理获取用户失败',
    },
    [UserErrorCode.AccessTypeNotSupport]: {
        description: '暂不支持的访问类型',
    },
    [UserErrorCode.UserNotHavePermission]: {
        description: '暂无权限，您可联系系统管理员配置',
    },
    [UserErrorCode.GetAccessPermissionError]: {
        description: '获取访问权限失败',
    },
    [UserErrorCode.AddUsersToRoleError]: {
        description: '添加用户角色失败',
    },
    [UserErrorCode.DeleteUsersToRoleError]: {
        description: '删除用户角色失败',
    },
    [UserErrorCode.GetProjectMgmRoleUsers]: {
        description: '获取项目管理员角色下用户失败',
    },
    [UserErrorCode.UserIsInProjectMgm]: {
        description: '获取该用户是否项目管理员角色',
    },
}

export const TaskCenterCodeMessage = combineToKV(
    PublicErrorMap,
    DrivenErrorMap,
    LoginErrorMap,
    OperationLogErrorMap,
    OssErrorMap,
    ProjectErrorMap,
    RelationDataErrorMap,
    TaskErrorMap,
    UserErrorMap,
)
