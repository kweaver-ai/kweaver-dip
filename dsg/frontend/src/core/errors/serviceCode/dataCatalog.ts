/**
 * 模块： 数据目录  data-catalog
 */
import { combineToKV } from './helper'
// Public Error
const PublicErrorCode = {
    PublicInternalError: 'DataCatalog.Public.InternalError',
    PublicInvalidParameter: 'DataCatalog.Public.InvalidParameter',
    PublicInvalidParameterJson: 'DataCatalog.Public.InvalidParameterJson',
    PublicUnmarshalJson: 'DataCatalog.Public.UnmarshalJson',
    PublicDatabaseError: 'DataCatalog.Public.DatabaseError',
    PublicRequestParameterError: 'DataCatalog.Public.RequestParameterError',
    PublicUniqueIDError: 'DataCatalog.Public.PublicUniqueIDError',
    PublicResourceNotExisted: 'DataCatalog.Public.ResourceNotExisted',
    PublicNoAuthorization: 'DataCatalog.Public.NoAuthorization',
    PublicAssetOfflineError: 'DataCatalog.Public.AssetOfflineError',
    TokenAuditFailed: 'DataCatalog.Public.TokenAuditFailed',
    UserNotActive: 'DataCatalog.Public.UserNotActive',
    GetUserInfoFailed: 'DataCatalog.Public.GetUserInfoFailed',
    GetUserInfoFailedInterior: 'DataCatalog.Public.GetUserInfoFailedInterior',
    GetTokenEmpty: 'DataCatalog.Public.GetTokenEmpty',
    ResourceMountedConflict: 'DataCatalog.Public.ResourceMountedConflict',
    CatalogNameConflict: 'DataCatalog.Public.CatalogNameConflict',
    ResourcePublishDisabled: 'DataCatalog.Public.ResourcePublishDisabled',
    ResourceShareDisabled: 'DataCatalog.Public.ResourceShareDisabled',
    ResourceOpenDisabled: 'DataCatalog.Public.ResourceOpenDisabled',
    PublicAuditApplyFailedError: 'DataCatalog.Public.AuditApplyFailedError',
    PublicAuditApplyNotAllowedError:
        'DataCatalog.Public.AuditApplyNotAllowedError',
    PublicNoAuditDefFoundError: 'DataCatalog.Public.NoAuditDefFoundError',
    PublicResourceEditNotAllowedError:
        'DataCatalog.Public.ResourceEditNotAllowedError',
    PublicResourceDelNotAllowedError:
        'DataCatalog.Public.ResourceDelNotAllowedError',
    PublicAuditTypeConflict: 'DataCatalog.Public.AuditTypeConflict',
    GetThirdPartyAddr: 'DataCatalog.Public.GetThirdPartyAddr',
    GetAccessPermissionError: 'DataCatalog.Public.GetAccessPermissionError',
    UserNotHavePermission: 'DataCatalog.Public.UserNotHavePermission',
    AccessTypeNotSupport: 'DataCatalog.Public.AccessTypeNotSupport',
    PublicAccessPermitted: 'DataCatalog.Public.AccessPermitted',
    PublicDuplicatedAccessApply: 'DataCatalog.Public.DuplicateAccessApply',
    DataSourceInvalid: 'DataCatalog.Public.DataSourceInvalid',
    DataExploreJobUpsertErr: 'DataCatalog.Public.DataExploreJobUpsertErr',
    NoTableMounted: 'DataCatalog.Public.NoTableMounted',
    DataExploreJobDetailGetErr: 'DataCatalog.Public.DataExploreJobDetailGetErr',
    DataExploreJobStatusGetErr: 'DataCatalog.Public.DataExploreJobStatusGetErr',
    DataExploreScoreTrendGetErr:
        'DataCatalog.Public.DataExploreScoreTrendGetErr',
    DataExploreRuleListGetErr: 'DataCatalog.Public.DataExploreRuleListGetErr',
    DataExploreReportGetErr: 'DataCatalog.Public.DataExploreReportGetErr',
    DataSourceNotFound: 'DataCatalog.Public.DataSourceNotFound',
    BigModelSampleRequestErr: 'DataCatalog.Public.BigModelSampleRequestErr',
    DataSourceRequestErr: 'DataCatalog.Public.DataSourceRequestErr',
    VirtualEngineRequestErr: 'DataCatalog.Public.VirtualEngineRequestErr',
    SqlMaskingRequestErr: 'DataCatalog.Public.SqlMaskingRequestErr',
    ConfigCenterTreeOrgRequestErr:
        'DataCatalog.Public.ConfigCenterTreeOrgRequestErr',
    ConfigCenterDepOwnerUsersRequestErr:
        'DataCatalog.Public.ConfigCenterDepOwnerUsersRequestErr',
    OwnerIDNotInDepartmentErr: 'DataCatalog.Public.OwnerIDNotInDepartmentErr',
    BusinessGroomingOwnerRequestErr:
        'DataCatalog.Public.BusinessGroomingOwnerRequestErr',
    CatalogCodeOverConcurrency: 'DataCatalog.Public.CatalogCodeOverConcurrency',
    TableOrColumnNotExisted: 'DataCatalog.Public.TableOrColumnNotExisted',
    DownloadNoPermittedErr: 'DataCatalog.Public.DownloadNoPermittedErr',
    DataCatalogNoOwnerErr: 'DataCatalog.Public.DataCatalogNoOwnerErr',
    ConfigCenterDeptRequestErr: 'DataCatalog.Public.ConfigCenterDeptRequestErr',
    ModelConfigurationCenterUrlError:
        'DataCatalog.Public.ConfigurationCenterUrlError',
    ModelDepartmentNotFound: 'DataCatalog.Public.DepartmentNotFound',
    ModelJsonMarshalError: 'DataCatalog.Public.JsonMarshalError',
    ModelMainBusinessNotFound: 'DataCatalog.Public.MainBusinessNotFound',
    ModelJsonUnMarshalError: 'DataCatalog.Public.JsonUnMarshalError',
    ModelObjectNameAlreadyExist: 'DataCatalog.Public.ObjectNameAlreadyExist',
    ModelCCUrlError: 'DataCatalog.Public.ConfigCenterUrlError',
}

const PublicErrorMap = {
    [PublicErrorCode.PublicInternalError]: {
        description: '内部错误',
    },
    [PublicErrorCode.ModelConfigurationCenterUrlError]: {
        description: '配置中心服务异常，或url地址有误',
    },
    [PublicErrorCode.ModelDepartmentNotFound]: {
        description: '部门或组织不存在',
    },
    [PublicErrorCode.ModelJsonMarshalError]: {
        description: 'json.Marshal转化失败',
    },
    [PublicErrorCode.ModelMainBusinessNotFound]: {
        description: '该业务模型不存在，请刷新页面',
    },
    [PublicErrorCode.ModelObjectNameAlreadyExist]: {
        description: '业务架构下该业务模型名称已存在，请重新输入',
    },
    [PublicErrorCode.ModelCCUrlError]: {
        description: '配置中心服务异常，或url地址有误',
    },
    [PublicErrorCode.ModelJsonUnMarshalError]: {
        description: 'json.UnMarshal转化失败',
    },
    [PublicErrorCode.PublicInvalidParameter]: {
        description: '参数值校验不通过',
    },
    [PublicErrorCode.PublicInvalidParameterJson]: {
        description: '参数值校验不通过：json格式错误',
    },
    [PublicErrorCode.PublicUnmarshalJson]: {
        description: 'json解析失败',
    },
    [PublicErrorCode.PublicDatabaseError]: {
        description: '数据库异常',
    },
    [PublicErrorCode.PublicRequestParameterError]: {
        description: '请求参数格式错误',
    },
    [PublicErrorCode.PublicUniqueIDError]: {
        description: '模型ID生成失败',
    },
    [PublicErrorCode.PublicResourceNotExisted]: {
        description: '资源不存在',
    },
    [PublicErrorCode.PublicNoAuthorization]: {
        description: '无当前操作权限',
    },
    [PublicErrorCode.PublicAssetOfflineError]: {
        description: '该数据目录不再是您的可用资源',
    },
    [PublicErrorCode.TokenAuditFailed]: {
        description: '用户信息验证失败',
    },
    [PublicErrorCode.UserNotActive]: {
        description: '用户登录已过期',
    },
    [PublicErrorCode.GetUserInfoFailed]: {
        description: '获取用户信息失败',
    },
    [PublicErrorCode.GetUserInfoFailedInterior]: {
        description: '获取用户信息失败',
    },
    [PublicErrorCode.GetTokenEmpty]: {
        description: '获取用户信息失败',
    },
    [PublicErrorCode.ResourceMountedConflict]: {
        description: '资源挂接冲突',
    },
    [PublicErrorCode.CatalogNameConflict]: {
        description: '目录名称冲突',
    },
    [PublicErrorCode.ResourcePublishDisabled]: {
        description: '资源已取消发布',
    },
    [PublicErrorCode.ResourceShareDisabled]: {
        description: '资源未开放共享',
    },
    [PublicErrorCode.ResourceOpenDisabled]: {
        description: '资源未向公众开放',
    },
    [PublicErrorCode.PublicAuditApplyFailedError]: {
        description: '当前资源审核申请失败',
    },
    [PublicErrorCode.PublicAuditApplyNotAllowedError]: {
        description: '当前资源不允许进行审核申请',
    },
    [PublicErrorCode.PublicNoAuditDefFoundError]: {
        description: '未找到匹配的审核流程',
    },
    [PublicErrorCode.PublicResourceEditNotAllowedError]: {
        description: '当前资源不允许编目',
    },

    [PublicErrorCode.PublicResourceDelNotAllowedError]: {
        description: '当前资源不允许删除',
    },
    [PublicErrorCode.PublicAuditTypeConflict]: {
        description: '当前审核类型流程绑定已创建，不可重复创建',
    },
    [PublicErrorCode.PublicAccessPermitted]: {
        description: '已拥有权限，不可重复申请',
    },
    [PublicErrorCode.PublicDuplicatedAccessApply]: {
        description: '已申请权限，正在审核中，不可重复申请',
    },
    [PublicErrorCode.DataSourceInvalid]: {
        description: '数据源无效',
    },
    [PublicErrorCode.NoTableMounted]: {
        description: '当前资源未挂接数据表',
    },
    [PublicErrorCode.DataExploreJobUpsertErr]: {
        description: '质量检测作业配置失败',
    },
    [PublicErrorCode.DataExploreJobDetailGetErr]: {
        description: '质量检测作业详情获取失败',
    },
    [PublicErrorCode.DataExploreJobStatusGetErr]: {
        description: '质量检测作业执行状态获取失败',
    },
    [PublicErrorCode.DataExploreScoreTrendGetErr]: {
        description: '质量评分趋势获取失败',
    },
    [PublicErrorCode.DataExploreRuleListGetErr]: {
        description: '质量检测规则获取失败',
    },
    [PublicErrorCode.DataExploreReportGetErr]: {
        description: '质量检测报告获取失败',
    },
    [PublicErrorCode.DataSourceNotFound]: {
        description: '数据源不存在',
    },
    [PublicErrorCode.BigModelSampleRequestErr]: {
        description: 'AI样例数据请求失败',
    },
    [PublicErrorCode.DataSourceRequestErr]: {
        description: '数据源请求失败',
    },
    [PublicErrorCode.VirtualEngineRequestErr]: {
        description: '虚拟化引擎数据请求失败',
    },
    [PublicErrorCode.SqlMaskingRequestErr]: {
        description: 'Sql脱敏数据请求失败',
    },
    [PublicErrorCode.ConfigCenterTreeOrgRequestErr]: {
        description: '配置中心子孙部门数据请求失败',
    },
    [PublicErrorCode.ConfigCenterDepOwnerUsersRequestErr]: {
        description: '配置中心查询部门下Owner角色的用户请求失败',
    },
    [PublicErrorCode.OwnerIDNotInDepartmentErr]: {
        description: 'OwnerID不存在',
    },
    [PublicErrorCode.BusinessGroomingOwnerRequestErr]: {
        description: '获取数据owner请求失败',
    },
    [PublicErrorCode.ConfigCenterDeptRequestErr]: {
        description: '获取部门信息请求失败',
    },
    [PublicErrorCode.CatalogCodeOverConcurrency]: {
        description: '资源目录编码超过最大并发数',
    },
    [PublicErrorCode.TableOrColumnNotExisted]: {
        description: '数据表或数据表对应的字段不存在',
    },
    [PublicErrorCode.DownloadNoPermittedErr]: {
        description: '当前资源无下载权限或下载有效期已过期',
    },
    [PublicErrorCode.DataCatalogNoOwnerErr]: {
        description: '当前目录没有数据Owner',
    },
    [PublicErrorCode.GetAccessPermissionError]: {
        description: '获取访问权限失败',
    },
    [PublicErrorCode.UserNotHavePermission]: {
        description: '暂无权限，您可联系系统管理员配置',
    },
    [PublicErrorCode.AccessTypeNotSupport]: {
        description: '暂不支持的访问类型',
    },
}
// DataComprehension error
const DataComprehensionPreCode = {
    DataComprehensionUnmarshalJsonError:
        'DataCatalog.DataComprehension.UnmarshalJsonError',
    DataComprehensionInvalidContentTypeError:
        'DataCatalog.DataComprehension.InvalidContentTypeError',
    DataComprehensionConfigError: 'DataCatalog.DataComprehension.ConfigError',
    DataComprehensionContentError: 'DataCatalog.DataComprehension.ContentError',
    DimensionConfigIsEmptyError:
        'DataCatalog.DataComprehension.DimensionConfigIsEmpty',
    DataComprehensionCatalogNotExist:
        'DataCatalog.DataComprehension.DataComprehensionCatalogNotExist',
    DataComprehensionCatalogOfflineDeleted:
        'DataCatalog.DataComprehension.DataComprehensionCatalogOfflineDeleted',
}
const DataComprehensionErrorMap = {
    [DataComprehensionPreCode.DataComprehensionUnmarshalJsonError]: {
        description: '数据理解维度${dimension}解析json错误',
    },
    [DataComprehensionPreCode.DataComprehensionInvalidContentTypeError]: {
        description: '数据理解类型错误',
    },
    [DataComprehensionPreCode.DataComprehensionConfigError]: {
        description: '数据理解维度${dimension}错误:${err}',
    },
    [DataComprehensionPreCode.DataComprehensionContentError]: {
        description: '数据理解内容错误',
    },
    [DataComprehensionPreCode.DimensionConfigIsEmptyError]: {
        description: '数据理解配置为空',
    },
    [DataComprehensionPreCode.DataComprehensionCatalogNotExist]: {
        description: '该数据资源目录已删除',
    },
    [DataComprehensionPreCode.DataComprehensionCatalogOfflineDeleted]: {
        description: '该数据资源目录未上线或已删除',
    },
}
// Lineage error
const LineageErrorCode = {
    LineageReqFailed: 'DataCatalog.Lineage.LineageReqFailed',
    CatalogNotFound: 'DataCatalog.Lineage.CatalogNotFound',
    GetTableFailed: 'DataCatalog.Lineage.GetTableFailed',
    TableNotFound: 'DataCatalog.Lineage.TableNotFound',
    GetDataSourceFailed: 'DataCatalog.Lineage.GetDataSourceFailed',
    FulltextSearchFailed: 'DataCatalog.Lineage.FulltextSearchFailed',
    RedisOpeFailed: 'DataCatalog.Lineage.RedisOpeFailed',
}
const LineageErrorMap = {
    [LineageErrorCode.LineageReqFailed]: {
        description: '请求失败，未获取到数据',
    },
    [LineageErrorCode.CatalogNotFound]: {
        description: '数据资源目录或挂载记录不存在',
    },
    [LineageErrorCode.GetTableFailed]: {
        description: '请求失败，未获取到数据',
    },
    [LineageErrorCode.TableNotFound]: {
        description: '请求失败，未获取到数据',
    },
    [LineageErrorCode.GetDataSourceFailed]: {
        description: '请求失败，未获取到数据',
    },
    [LineageErrorCode.FulltextSearchFailed]: {
        description: '请求失败，未获取到数据',
    },
    [LineageErrorCode.RedisOpeFailed]: {
        description: '请求失败，未获取到数据',
    },
}

// tree  error
const TreeErrorCode = {
    TreeNotExist: 'DataCatalog.Tree.TreeNotExist',
    TreeNameRepeat: 'DataCatalog.Tree.TreeNameRepeat',
}
const TreeErrorMap = {
    [TreeErrorCode.TreeNotExist]: {
        description: '树不存在',
    },
    [TreeErrorCode.TreeNameRepeat]: {
        description: '树名称已经存在',
    },
}

// tree Node error TreeNode
const TreeNodeErrorCode = {
    TreeNodeNotExist: 'DataCatalog.TreeNode.TreeNodeNotExist',
    TreeNodeNameRepeat: 'DataCatalog.TreeNode.TreeNodeNameRepeat',
    TreeNodeRootNotAllowedOperate:
        'DataCatalog.TreeNode.TreeNodeRootNotAllowedOperate',
    TreeNodeOverflowMaxLayer: 'DataCatalog.TreeNode.TreeNodeOverflowMaxLayer',
    TreeNodeMoveToSubErr: 'DataCatalog.TreeNode.TreeNodeMoveToSubErr',
}
const TreeNodeErrorMap = {
    [TreeNodeErrorCode.TreeNodeNotExist]: {
        description: '目录分类不存在',
    },
    [TreeNodeErrorCode.TreeNodeNameRepeat]: {
        description: '目录分类名称已经存在',
    },
    [TreeNodeErrorCode.TreeNodeRootNotAllowedOperate]: {
        description: '目录分类根节点不允许被操作',
    },
    [TreeNodeErrorCode.TreeNodeOverflowMaxLayer]: {
        description: '目录层级已超出最大限制',
    },
    [TreeNodeErrorCode.TreeNodeMoveToSubErr]: {
        description: '不允许将目录分类移动到该目录分类及其子目录中',
    },
}

const CategoryNodeErrorCode = {
    CategoryNodeOverflowMaxLayer:
        'DataCatalog.CategoryNode.CategoryNodeOverflowMaxLayer',
    CategoryNodeNameRepeat: 'DataCatalog.CategoryNode.CategoryNodeNameRepeat',
}
const CategoryNodeErrorMap = {
    [CategoryNodeErrorCode.CategoryNodeOverflowMaxLayer]: {
        description: '节点层级已超出最大限制',
    },
    [CategoryNodeErrorCode.CategoryNodeNameRepeat]: {
        description: '节点名称已存在',
    },
}

export const DataCatalogCodeMessage = combineToKV(
    PublicErrorMap,
    DataComprehensionErrorMap,
    LineageErrorMap,
    TreeErrorMap,
    TreeNodeErrorMap,
    CategoryNodeErrorMap,
)
