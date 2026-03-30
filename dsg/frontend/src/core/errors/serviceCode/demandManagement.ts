/**
 *  DemandManagement
 */
import { combineToKV } from './helper'

const publicErrorCode = {
    PublicInternalError: 'DemandManagement.Public.InternalError',
    PublicInvalidParameter: 'DemandManagement.Public.InvalidParameter',
    PublicInvalidParameterDetail: 'DemandManagement.Public.InvalidParam',
    ResInvalid: 'DemandManagement.Public.ResInvalid',
    PublicInvalidParameterJson: 'DemandManagement.Public.InvalidParameterJson',
    PublicInvalidParameterValue:
        'DemandManagement.Public.InvalidParameterValue',
    PublicDatabaseError: 'DemandManagement.Public.DatabaseError',
    PublicRequestParameterError:
        'DemandManagement.Public.RequestParameterError',
    PublicUniqueIDError: 'DemandManagement.Public.PublicUniqueIDError',
    DataNotFound: 'DemandManagement.Public.DataNotFound',
    PublicNoAuthorization: 'DemandManagement.Public.NoAuthorization',
    SystemConfigError: 'DemandManagement.Public.SystemConfigError',
    SystemConfigNotMatchError:
        'DemandManagement.Public.SystemConfigNotMatchError',
    EnumNotMatchError: 'DemandManagement.Public.EnumNotMatchError',
    TokenAuditFailed: 'DemandManagement.Public.TokenAuditFailed',
    UserNotActive: 'DemandManagement.Public.UserNotActive',
    GetUserInfoFailed: 'DemandManagement.Public.GetUserInfoFailed',
    GetUserInfoFailedInterior:
        'DemandManagement.Public.GetUserInfoFailedInterior',
    GetTokenEmpty: 'DemandManagement.Public.GetTokenEmpty',
    DemandTitleDuplicate: 'DemandManagement.Form.DemandTitleDuplicate',
    DemandItemDuplicate: 'DemandManagement.Form.DemandItemDuplicate',
    FormExistRequiredEmpty: 'DemandManagement.Form.FormExistRequiredEmpty',
    FormOpenExcelFileError: 'DemandManagement.Form.FormOpenExcelFileError',
    FormFormatError: 'DemandManagement.Form.FormFormatError',
    FormContentError: 'DemandManagement.Form.FormContentError',
    FormOneMax: 'DemandManagement.Form.FormOneMax',
    FormFileSizeLarge: 'DemandManagement.Form.FormFileSizeLarge',
    FormCreateDirError: 'DemandManagement.Form.FormCreateDirError',
    FormExcelInvalidType: 'DemandManagement.Form.FormExcelInvalidType',
    FormSaveFileError: 'DemandManagement.Form.FormSaveFileError',
    FormReadFileError: 'DemandManagement.Form.FormReadFileError',
    FileDownloadError: 'DemandManagement.Form.FileDownloadError',
    FormNoSuchFile: 'DemandManagement.Form.FormNoSuchFile',
    DeleteDemandError: 'DemandManagement.Form.DeleteDemandError',
    DemandNotExistError: 'DemandManagement.Form.DemandNotExistError',
    DemandNoAuthError: 'DemandManagement.Form.DemandNoAuthError',
    FormGetRuleError: 'DemandManagement.Form.FormGetRuleError',
    ExcelRequiredFieldWithArgsError:
        'DemandManagement.Form.ExcelRequiredFieldWithArgsError',
    ModelTemplatesNotExist: 'DemandManagement.Form.ModelTemplatesNotExist',
    FormGetTemplateError: 'DemandManagement.Form.FormGetTemplateError',
    FormMaxLimitError: 'DemandManagement.Form.FormMaxLimitError',
    FormEmptyError: 'DemandManagement.Form.FormEmptyError',
    PublicAuditApplyFailedError:
        'DemandManagement.Public.AuditApplyFailedError',
    PublicAuditTypeConflict: 'DemandManagement.Public.AuditTypeConflict',
    AuditProcessNotFound: 'DemandManagement.Public.AuditProcessNotFound',
    GetAccessPermissionError:
        'DemandManagement.Public.GetAccessPermissionError',
    UserNotHavePermission: 'DemandManagement.Public.UserNotHavePermission',
    AccessTypeNotSupport: 'DemandManagement.Public.AccessTypeNotSupport',
}

const publicErrorMap = {
    [publicErrorCode.PublicInternalError]: {
        description: '内部错误',
    },
    [publicErrorCode.PublicInvalidParameter]: {
        description: '参数值校验不通过',
    },
    [publicErrorCode.PublicInvalidParameterDetail]: {
        description: '${param}',
    },
    [publicErrorCode.ResInvalid]: {
        description: '${param}',
    },
    [publicErrorCode.PublicInvalidParameterJson]: {
        description: '参数值校验不通过：json格式错误',
    },
    [publicErrorCode.PublicInvalidParameterValue]: {
        description: '参数值${param}校验不通过',
    },
    [publicErrorCode.PublicDatabaseError]: {
        description: '数据库异常',
    },
    [publicErrorCode.PublicRequestParameterError]: {
        description: '请求参数格式错误',
    },
    [publicErrorCode.PublicUniqueIDError]: {
        description: '模型ID生成失败',
    },
    [publicErrorCode.DataNotFound]: {
        description: '数据未找到',
    },
    [publicErrorCode.PublicNoAuthorization]: {
        description: '无当前操作权限',
    },
    [publicErrorCode.SystemConfigError]: {
        description: '未找到传入ID对应的业务架构信息',
    },
    [publicErrorCode.SystemConfigNotMatchError]: {
        description: '业务架构类型不匹配',
    },
    [publicErrorCode.EnumNotMatchError]: {
        description: '枚举值不在有效的范围内',
    },
    [publicErrorCode.TokenAuditFailed]: {
        description: '用户信息验证失败',
    },
    [publicErrorCode.UserNotActive]: {
        description: '用户登录已过期',
    },
    [publicErrorCode.GetUserInfoFailed]: {
        description: '获取用户信息失败',
    },
    [publicErrorCode.GetUserInfoFailedInterior]: {
        description: '获取用户信息失败',
    },
    [publicErrorCode.GetTokenEmpty]: {
        description: '获取用户信息失败',
    },
    [publicErrorCode.DemandTitleDuplicate]: {
        description: '需求标题重复',
    },
    [publicErrorCode.DemandItemDuplicate]: {
        description: '需求项重复',
    },
    [publicErrorCode.FormExistRequiredEmpty]: {
        description: '存在文件内必填项为空',
    },
    [publicErrorCode.FormOpenExcelFileError]: {
        description: '打开文件失败',
    },
    [publicErrorCode.FormFormatError]: {
        description: '导入的文件内容与模板不符',
    },
    [publicErrorCode.FormContentError]: {
        description: '导入文件内容错误',
    },
    [publicErrorCode.FormOneMax]: {
        description: '只能上传一个文件',
    },
    [publicErrorCode.FormFileSizeLarge]: {
        description: '文件不可超过10MB',
    },
    [publicErrorCode.FormCreateDirError]: {
        description: '创建目录失败',
    },
    [publicErrorCode.FormExcelInvalidType]: {
        description: '不支持的文件类型，Excel文件格式有误',
    },
    [publicErrorCode.FormSaveFileError]: {
        description: '保存文件失败',
    },
    [publicErrorCode.FormReadFileError]: {
        description: '读取文件失败',
    },
    [publicErrorCode.FileDownloadError]: {
        description: '下载文件失败',
    },
    [publicErrorCode.FormNoSuchFile]: {
        description: '文件不存在或已提交',
    },
    [publicErrorCode.DeleteDemandError]: {
        description: '删除需求单失败',
    },
    [publicErrorCode.DemandNotExistError]: {
        description: '需求单不存在',
    },
    [publicErrorCode.DemandNoAuthError]: {
        description: '需求单无权限操作',
    },
    [publicErrorCode.FormGetRuleError]: {
        description: '获取规则配置失败',
    },
    [publicErrorCode.ExcelRequiredFieldWithArgsError]: {
        description: '[field]为必填字段',
    },
    [publicErrorCode.ModelTemplatesNotExist]: {
        description: '模板名称不存在',
    },
    [publicErrorCode.FormGetTemplateError]: {
        description: '获取模板配置失败',
    },
    [publicErrorCode.FormMaxLimitError]: {
        description: '每次仅支持最多导入%d条记录',
    },
    [publicErrorCode.FormEmptyError]: {
        description: '导入内容为空，请检查',
    },
    [publicErrorCode.PublicAuditApplyFailedError]: {
        description: '当前需求审核申请失败',
    },
    [publicErrorCode.PublicAuditTypeConflict]: {
        description: '当前审核类型流程绑定已创建，不可重复创建',
    },
    [publicErrorCode.AuditProcessNotFound]: {
        description: '暂未绑定审核流程，请先绑定审核流程',
    },
    [publicErrorCode.GetAccessPermissionError]: {
        description: '获取访问权限失败',
    },
    [publicErrorCode.UserNotHavePermission]: {
        description: '暂无权限，您可联系系统管理员配置',
    },
    [publicErrorCode.AccessTypeNotSupport]: {
        description: '暂不支持的访问类型',
    },
}

export const DemandManagementCodeMessage = combineToKV(publicErrorMap)
