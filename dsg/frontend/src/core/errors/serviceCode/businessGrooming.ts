/**
 * 模块： business-grooming
 */
import { combineToKV } from './helper'

// Authority Error
const AuthorityErrorCode = {
    AuthorityInternalError: 'BusinessGrooming.BusinessAuthority.InternalError',
    AuthorityInvalidParameter:
        'BusinessGrooming.BusinessAuthority.InvalidParameter',
    AuthorityInvalidParameterValue:
        'BusinessGrooming.BusinessAuthority.InvalidParameterValue',
    AuthorityInvalidParameterJson:
        'BusinessGrooming.BusinessAuthority.InvalidParameterJson',
    AuthorityNameAlreadyExist:
        'BusinessGrooming.BusinessAuthority.NameAlreadyExist',
    AuthorityUserNotExist: 'BusinessGrooming.BusinessAuthority.UserNotExist',
    AuthorityDomainNotExist:
        'BusinessGrooming.BusinessAuthority.DomainNotExist',
    AuthorityNotExist: 'BusinessGrooming.BusinessAuthority.AuthorityNotExist',
    AuthorityOrModelNotExist:
        'BusinessGrooming.BusinessAuthority.AuthorityOrModelNotExist',
    AuthorityDatabaseError: 'BusinessGrooming.BusinessAuthority.DatabaseError',
}

const AuthorityErrorMap = {
    [AuthorityErrorCode.AuthorityInternalError]: {
        description: 'internal error',
    },
    [AuthorityErrorCode.AuthorityInvalidParameter]: {
        description: '参数值校验不通过',
    },
    [AuthorityErrorCode.AuthorityInvalidParameterValue]: {
        description: '参数${param}校验不通过',
    },
    [AuthorityErrorCode.AuthorityInvalidParameterJson]: {
        description: '参数值校验不通过：json格式错误',
    },
    [AuthorityErrorCode.AuthorityNameAlreadyExist]: {
        description: '角色名称重复',
    },
    [AuthorityErrorCode.AuthorityUserNotExist]: {
        description: '用户${user}不存在',
    },
    [AuthorityErrorCode.AuthorityDomainNotExist]: {
        description: '业务领域${domain}不存在',
    },
    [AuthorityErrorCode.AuthorityNotExist]: {
        description: '业务角色不存在',
    },
    [AuthorityErrorCode.AuthorityOrModelNotExist]: {
        description: '业务领域或业务角色不存在',
    },
    [AuthorityErrorCode.AuthorityDatabaseError]: {
        description: '数据库异常',
    },
}

// Domain Error
const DomainErrorCode = {
    BusinessDomainPanic: 'BusinessGrooming.BusinessDomain.Panic',
    BusinessDomainIdEmpty:
        'BusinessGrooming.BusinessDomain.BusinessDomainIdEmpty',
    BusinessDomainInvalidParameter:
        'BusinessGrooming.BusinessDomain.InvalidParameters',
    BusinessDomainInvalidParameterJson:
        'BusinessGrooming.BusinessDomain.InvalidParameterJson',
    BusinessDomainDataBaseError:
        'BusinessGrooming.BusinessDomain.DataBaseError',
    DeleteBusinessDomainFailed:
        'BusinessGrooming.BusinessDomain.DeleteBusinessDomainFailed',
    ModifyBusinessDomainFailed:
        'BusinessGrooming.BusinessDomain.ModifyBusinessDomainFailed',
    BusinessDomainNameError:
        'BusinessGrooming.BusinessDomain.BusinessDomainNameError',
    BusinessDomainIdIllegal:
        'BusinessGrooming.BusinessDomain.BusinessDomainIdIllegal',
    BusinessDomainIdNameBothEmpty:
        'BusinessGrooming.BusinessDomain.BusinessDomainIdNameBothEmpty',
    BusinessDomainModelsNotEmpty:
        'BusinessGrooming.BusinessDomain.BusinessDomainModelsNotEmpty',
}

const DomainErrorMap = {
    [DomainErrorCode.BusinessDomainPanic]: {
        description: '服务异常',
    },
    [DomainErrorCode.BusinessDomainIdEmpty]: {
        description: '业务领域标识为空',
    },
    [DomainErrorCode.BusinessDomainInvalidParameter]: {
        description: '参数不合法',
    },
    [DomainErrorCode.BusinessDomainInvalidParameterJson]: {
        description: '参数值校验不通过：json格式错误',
    },
    [DomainErrorCode.BusinessDomainDataBaseError]: {
        description: '数据库异常',
    },
    [DomainErrorCode.DeleteBusinessDomainFailed]: {
        description: '该业务领域不存在',
    },
    [DomainErrorCode.ModifyBusinessDomainFailed]: {
        description: '该业务领域不存在',
    },
    [DomainErrorCode.BusinessDomainNameError]: {
        description: '该业务领域名称已存在，请重新输入',
    },
    [DomainErrorCode.BusinessDomainIdIllegal]: {
        description: '该业务领域不存在',
    },
    [DomainErrorCode.BusinessDomainIdNameBothEmpty]: {
        description: '业务领域名称和描述不能同时为空',
    },
    [DomainErrorCode.BusinessDomainModelsNotEmpty]: {
        description: '业务领域下存在业务模型，不能删除',
    },
}

// DataProcess Error
const DataProcessErrorCode = {
    DataProcessingInvalidParameter:
        'BusinessGrooming.DataProcessing.InvalidParameter',
    DataProcessingDatabaseError:
        'BusinessGrooming.DataProcessing.DatabaseError',
    DataProcessingInvalidParameterJson:
        'BusinessGrooming.Form.InvalidParameterJson',
    DataProcessingFieldsNameDuplicate:
        'BusinessGrooming.Form.FieldsNameDuplicate',
    DataProcessingTaskNotMatch: 'BusinessGrooming.Form.TaskNotMatch',
    DataProcessingMetadataUrlError:
        'BusinessGrooming.DataProcessing.MetadataUrlError',
    DataProcessingVirtualEngineUrlError:
        'BusinessGrooming.DataProcessing.VirtualEngineUrlError',
    DataProcessingMetadataDataError:
        'BusinessGrooming.DataProcessing.MetadataDataError',
    DataProcessingVirtualEngineDataError:
        'BusinessGrooming.DataProcessing.VirtualEngineDataError',
    DataProcessingMetadataTableNotFound:
        'BusinessGrooming.DataProcessing.MetadataTableNotFound',
    DataProcessingDataTableNotFound:
        'BusinessGrooming.DataProcessing.DataTableNotFound',
    DataProcessingDatasourceNotFound:
        'BusinessGrooming.DataProcessing.DatasourceNotFound',
    DataProcessingDataTableNotConnect:
        'BusinessGrooming.DataProcessing.DataTableNotConnect',
    DataProcessingDataTableLengthNotMatch:
        'BusinessGrooming.DataProcessing.DataTableLengthNotMatch',
    DataProcessingFieldTypeNotExist:
        'BusinessGrooming.DataProcessing.FieldTypeNotExist',
    DataProcessingFieldTypeLengthError:
        'BusinessGrooming.DataProcessing.FieldTypeLengthError',
    DataProcessingFieldTypeLengthError2:
        'BusinessGrooming.DataProcessing.FieldTypeLengthError2',
    DataProcessingFieldTypeLengthError3:
        'BusinessGrooming.DataProcessing.FieldTypeLengthError3',
    DataProcessingFieldTypeLengthError4:
        'BusinessGrooming.DataProcessing.FieldTypeLengthError4',
    DataProcessingFieldTypeLengthError5:
        'BusinessGrooming.DataProcessing.FieldTypeLengthError5',
    DataProcessingFieldTypeLengthError6:
        'BusinessGrooming.DataProcessing.FieldTypeLengthError6',
    DataProcessingFieldTypeNotMatch:
        'BusinessGrooming.DataProcessing.FieldTypeNotMatch',
    DataProcessingSourceIdNotExist:
        'BusinessGrooming.DataProcessing.SourceIdNotExist',
    DataProcessingStdFieldIdNotExist:
        'BusinessGrooming.DataProcessing.StdFieldIdNotExist',
    DataProcessingCanvasNotExist:
        'BusinessGrooming.DataProcessing.CanvasNotExist',
    DataProcessingBusinessFieldNotExist:
        'BusinessGrooming.DataProcessing.BusinessFieldNotExist',
    DataProcessingSourceFieldNotExist:
        'BusinessGrooming.DataProcessing.SourceFieldNotExist',
    DataProcessingStandardizationConnection:
        'BusinessGrooming.DataProcessing.StandardizationConnection',
    DataProcessingCompleteModelError:
        'BusinessGrooming.DataProcessing.CompleteModelError',
    DataProcessingSourceTableDeletedError:
        'BusinessGrooming.DataProcessing.SourceTableDeletedError',
    DataProcessingMetadataIdError:
        'BusinessGrooming.DataProcessing.MetadataIdError',
    DataProcessingDataSourceNotConfigured:
        'BusinessGrooming.DataProcessing.DataSourceNotConfigured',
    DataProcessingDataSourceNotConfigured2:
        'BusinessGrooming.DataProcessing.DataSourceNotConfigured2',
    DataProcessingSourceTableNoFields:
        'BusinessGrooming.DataProcessing.SourceTableNoFields',
    DataProcessingSourceTableNoConnections:
        'BusinessGrooming.DataProcessing.SourceTableConnections',
    DataProcessingDwFieldNotExist:
        'BusinessGrooming.DataProcessing.DwFieldNotExist',
    // 同步模型
    CollectingModelNotExist: 'BusinessGrooming.DataProcessing.ModelNotExist',
    CollectingModelTargetNotHive:
        'BusinessGrooming.DataProcessing.TargetNotHive',
    CollectingTableMustNotEmpty:
        'BusinessGrooming.DataProcessing.TableMustNotEmpty',
    CollectingNameRepeat:
        'BusinessGrooming.DataProcessing.CollectingNameRepeat',
    CollectingTaskNotMatch: 'BusinessGrooming.DataProcessing.TaskNotMatch',

    WorkflowNotExist: 'BusinessGrooming.DataProcessing.WorkflowNotExist',
    WorkflowNameRepeat: 'BusinessGrooming.DataProcessing.WorkflowNameRepeat',
    PlanDateDiffError: 'BusinessGrooming.DataProcessing.DateDiffError',
    PlanDateError: 'BusinessGrooming.DataProcessing.DateError',
    DataProcessingCsCollectingUrlError:
        'BusinessGrooming.DataProcessing.CsCollectingUrlError',
    DataProcessingCsCollectingDataError:
        'BusinessGrooming.DataProcessing.CsCollectingDataError',
    DataProcessingCsCollectingError:
        'BusinessGrooming.DataProcessing.CsCollectingError',
    DataProcessingTableExist: 'BusinessGrooming.DataProcessing.TableExistError',
    // 加工模型
    ProcessingModelNotExist:
        'BusinessGrooming.DataProcessing.ProcessingModelNotExist',
    ProcessingNameRepeat:
        'BusinessGrooming.DataProcessing.ProcessingNameRepeat',
}

const DataProcessErrorMap = {
    [DataProcessErrorCode.CollectingModelNotExist]: {
        description: '数据同步不存在',
    },
    [DataProcessErrorCode.CollectingModelTargetNotHive]: {
        description:
            '当前版本数据同步仅支持从MySQL/MariaDB同步到Hive；数据加工仅支持Hive作为目标数据源',
    },
    [DataProcessErrorCode.CollectingTableMustNotEmpty]: {
        description: '目标表字段不可为空',
    },
    [DataProcessErrorCode.CollectingNameRepeat]: {
        description: '该数据同步名称已存在，请重新输入',
    },
    [DataProcessErrorCode.CollectingTaskNotMatch]: {
        description: '参数的任务ID与采集模型或调度计划所属任务ID不匹配',
    },

    [DataProcessErrorCode.WorkflowNotExist]: {
        description: '工作流不存在',
    },
    [DataProcessErrorCode.WorkflowNameRepeat]: {
        description: '该工作流名称已存在，请重新输入',
    },
    [DataProcessErrorCode.PlanDateDiffError]: {
        description: '结束日期不得早于开始日期，结束日期不得早于当前日期',
    },
    [DataProcessErrorCode.PlanDateError]: {
        description: '时间参数错误，[开始日期/结束日期/执行时间]为不存在的时间',
    },
    [DataProcessErrorCode.DataProcessingCsCollectingUrlError]: {
        description: '采集中间件服务异常，或url地址有误',
    },
    [DataProcessErrorCode.DataProcessingCsCollectingDataError]: {
        description: '采集中间件服务返回的数据有误',
    },
    [DataProcessErrorCode.DataProcessingCsCollectingError]: {
        description: '采集中间件报错',
    },
    [DataProcessErrorCode.DataProcessingTableExist]: {
        description: '该数据表已存在',
    },
    // 加工模型
    [DataProcessErrorCode.ProcessingModelNotExist]: {
        description: '数据加工不存在',
    },
    [DataProcessErrorCode.ProcessingNameRepeat]: {
        description: '该数据加工名称已存在，请重新输入',
    },

    [DataProcessErrorCode.DataProcessingInvalidParameter]: {
        description: '参数值校验不通过',
    },
    [DataProcessErrorCode.DataProcessingDatabaseError]: {
        description: '数据库异常',
    },
    [DataProcessErrorCode.DataProcessingInvalidParameterJson]: {
        description: '参数值校验不通过：json格式错误',
    },
    [DataProcessErrorCode.DataProcessingFieldsNameDuplicate]: {
        description: '数据表字段名${name}不能重复',
    },
    [DataProcessErrorCode.DataProcessingTaskNotMatch]: {
        description: '任务类型需要匹配',
    },
    [DataProcessErrorCode.DataProcessingMetadataUrlError]: {
        description: '元数据平台服务异常，或url地址有误',
    },
    [DataProcessErrorCode.DataProcessingVirtualEngineUrlError]: {
        description: '虚拟化引擎服务异常，或url地址有误',
    },
    [DataProcessErrorCode.DataProcessingMetadataDataError]: {
        description: '元数据平台返回的数据有误',
    },
    [DataProcessErrorCode.DataProcessingVirtualEngineDataError]: {
        description: '虚拟化平台返回的数据有误',
    },
    [DataProcessErrorCode.DataProcessingMetadataTableNotFound]: {
        description: '数据表不存在',
    },
    [DataProcessErrorCode.DataProcessingDataTableNotFound]: {
        description: '数据表不存在',
    },
    [DataProcessErrorCode.DataProcessingDatasourceNotFound]: {
        description: '该数据源不存在',
    },
    [DataProcessErrorCode.DataProcessingDataTableNotConnect]: {
        description: '业务表中存在字段未配置映射关系，不能发布',
    },
    [DataProcessErrorCode.DataProcessingDataTableLengthNotMatch]: {
        description: '标准表字段个数与业务表字段个数需要一致',
    },
    [DataProcessErrorCode.DataProcessingFieldTypeNotExist]: {
        description: '该字段类型不存在',
    },
    [DataProcessErrorCode.DataProcessingFieldTypeLengthError]: {
        description: 'char长度必填，仅支持 1~255 之间的整数',
    },
    [DataProcessErrorCode.DataProcessingFieldTypeLengthError2]: {
        description: 'varchar长度必填，仅支持 1~65535 之间的整数',
    },
    [DataProcessErrorCode.DataProcessingFieldTypeLengthError3]: {
        description: 'decimal精度必填，仅支持 1～38 之间的整数',
    },
    [DataProcessErrorCode.DataProcessingFieldTypeLengthError4]: {
        description: '非decimal、char、varchar、binary类型，不能有长度',
    },
    [DataProcessErrorCode.DataProcessingFieldTypeLengthError5]: {
        description: '非decimal类型，不能有标度',
    },
    [DataProcessErrorCode.DataProcessingFieldTypeLengthError6]: {
        description: 'decimal标度必填，仅支持 0～38 之间的整数',
    },
    [DataProcessErrorCode.DataProcessingFieldTypeNotMatch]: {
        description: '数据表和业务表的字段类型不匹配',
    },
    [DataProcessErrorCode.DataProcessingSourceIdNotExist]: {
        description: '该标准表连线的源字段${source_id}在贴源表中不存在',
    },
    [DataProcessErrorCode.DataProcessingStdFieldIdNotExist]: {
        description: '标准表字段id${source_id}需和业务表id一致',
    },
    [DataProcessErrorCode.DataProcessingCanvasNotExist]: {
        description: '该画布不存在',
    },
    [DataProcessErrorCode.DataProcessingBusinessFieldNotExist]: {
        description: '该业务表字段${field_id}不存在',
    },
    [DataProcessErrorCode.DataProcessingSourceFieldNotExist]: {
        description: '贴源表字段${field_id}不存在',
    },
    [DataProcessErrorCode.DataProcessingStandardizationConnection]: {
        description: '字段${field}需要标准化，但未标准化，不能连线',
    },
    [DataProcessErrorCode.DataProcessingCompleteModelError]: {
        description: '该采集模型存在一致性校验未通过的贴源表，不可完成',
    },
    [DataProcessErrorCode.DataProcessingSourceTableDeletedError]: {
        description: '贴源表${table}在采集模型中不存在，或已被删除',
    },
    [DataProcessErrorCode.DataProcessingMetadataIdError]: {
        description: '元数据id${id}不是整型，不符合规范',
    },
    [DataProcessErrorCode.DataProcessingDataSourceNotConfigured]: {
        description: '存在未配置数据源与数据表间的映射关系',
    },
    [DataProcessErrorCode.DataProcessingDataSourceNotConfigured2]: {
        description: '存在数据表${table}未配置数据源',
    },
    [DataProcessErrorCode.DataProcessingSourceTableNoFields]: {
        description: '数据表中无任何字段',
    },
    [DataProcessErrorCode.DataProcessingSourceTableNoConnections]: {
        description: '存在数据表无任何连线',
    },
    [DataProcessErrorCode.DataProcessingDwFieldNotExist]: {
        description: '数据表字段${f}不存在',
    },
}

// Driven Error
const DrivenErrorCode = {
    GetThirdPartyAddr: 'BusinessGrooming.Driven.GetThirdPartyAddr',
    GetRolesInfo: 'BusinessGrooming.Driven.GetRolesInfo',
}
const DrivenErrorMap = {
    [DrivenErrorCode.GetThirdPartyAddr]: {
        description: '获取配置中心用户角色信息失败',
    },
    [DrivenErrorCode.GetRolesInfo]: {
        description: '获取配置中心第三方地址失败',
    },
}

// Excel Error
const ExcelErrorCode = {
    ExcelDatabaseError: 'BusinessGrooming.Model.DatabaseError',
    ExcelFileNotFind: 'BusinessGrooming.Model.FileEmptyError',
    ExcelFileOpenError: 'BusinessGrooming.Model.FileOpenError',
    ExcelFileTooLarge: 'BusinessGrooming.Model.FileTooLarge',
    ExcelFileReadError: 'BusinessGrooming.Model.FileReadError',
    ExcelFileSaveError: 'BusinessGrooming.Model.FileSaveError',
    ExcelTypeNotSupported: 'BusinessGrooming.Model.TypeError',
    ExcelFileModelNameDuplicate: 'BusinessGrooming.Model.ModelNameDuplicate',
    ExcelUnsupportedRuleType: 'BusinessGrooming.Model.UnsupportedRuleType',
    ParamTypeNotSupported: 'BusinessGrooming.Model.ParamTypeError',
    ExcelJsonMarshalError: 'BusinessGrooming.Model.JsonMarshalError',
    ExcelRequiredFieldError: 'BusinessGrooming.Model.RequiredFieldEmpty',
    ExcelContentError: 'BusinessGrooming.Model.ExcelContentError',
    ExcelRequiredError: 'BusinessGrooming.Model.ExcelRequiredError',
    ExcelFileEmptyLine: 'BusinessGrooming.Model.ExcelFileEmptyLine',
    ExcelTransformError: 'BusinessGrooming.Model.ExcelTransformError',
    ExcelImportDuplicate: 'BusinessGrooming.Model.ExcelImportDuplicate',
    ExcelModelsCountMax20: 'BusinessGrooming.Model.ExcelModelsCountMax20',
    ExcelFileEmpty: 'BusinessGrooming.Model.ExcelFileEmpty',
    ExcelModelNameExistError: 'BusinessGrooming.Model.ExcelModelNameExistError',
    ExcelRequiredFieldWithArgsError:
        'BusinessGrooming.Model.RequiredFieldWithArgs',
}

const ExcelErrorMap = {
    [ExcelErrorCode.ExcelDatabaseError]: {
        description: '数据库异常',
    },
    [ExcelErrorCode.ExcelFileNotFind]: {
        description: '至少上传1个文件',
    },
    [ExcelErrorCode.ExcelFileOpenError]: {
        description: '打开文件失败',
    },
    [ExcelErrorCode.ExcelFileTooLarge]: {
        description: '文件过大',
    },
    [ExcelErrorCode.ExcelFileReadError]: {
        description: '读取文件失败',
    },
    [ExcelErrorCode.ExcelFileSaveError]: {
        description: '保存文件失败',
    },
    [ExcelErrorCode.ExcelTypeNotSupported]: {
        description: '不支持的文件类型，Excel文件格式有误',
    },
    [ExcelErrorCode.ExcelFileModelNameDuplicate]: {
        description: '存在文件内主干业务名称重复，或与已存在的业务模型名称重复',
    },
    [ExcelErrorCode.ExcelUnsupportedRuleType]: {
        description: '不支持的解析规则类型',
    },
    [ExcelErrorCode.ParamTypeNotSupported]: {
        description: '不支持的参数类型，参数校验失败',
    },
    [ExcelErrorCode.ExcelJsonMarshalError]: {
        description: 'json.Marshal转化失败',
    },
    [ExcelErrorCode.ExcelRequiredFieldError]: {
        description: '文件内存在必填项为空，或文件内容与模板不符',
    },
    [ExcelErrorCode.ExcelContentError]: {
        description: '文件内容与模板不符',
    },
    [ExcelErrorCode.ExcelRequiredError]: {
        description: '存在文件必填项为空',
    },
    [ExcelErrorCode.ExcelFileEmptyLine]: {
        description: '存在空行，或存在文件必填项为空',
    },
    [ExcelErrorCode.ExcelTransformError]: {
        description: '根据配置文件解析失败，文件中多行值超过最大限制',
    },
    [ExcelErrorCode.ExcelImportDuplicate]: {
        description: '存在 (${%s}) 重复，请重试',
    },
    [ExcelErrorCode.ExcelModelsCountMax20]: {
        description: '每次仅支持最多导入20个业务模型',
    },
    [ExcelErrorCode.ExcelFileEmpty]: {
        description: '文件为空',
    },
    [ExcelErrorCode.ExcelModelNameExistError]: {
        description: 'excel中没有配置中的模型名称，或者未配置模型名称字段',
    },
    [ExcelErrorCode.ExcelRequiredFieldWithArgsError]: {
        description: '${field}为必填字段',
    },
}

//  Flowchart  Error
const FlowchartErrorCode = {
    FlowchartNodeBindOneModelOnly:
        'BusinessGrooming.Flowchart.FlowchartNodeBindOneModelOnly',
    FlowchartFormNotExist: 'BusinessGrooming.Flowchart..FlowchartFormNotExist',
    FlowchartLoopReferenceError:
        'BusinessGrooming.Flowchart..FlowchartLoopReference',
    FlowchartInternalError: 'BusinessGrooming.Flowchart.InternalError',
    FlowchartNoSuchFile: 'BusinessGrooming.Flowchart.NoSuchFile',
    FlowchartOneMax: 'BusinessGrooming.Flowchart.OneMax',
    FlowchartTypeNotExist: 'BusinessGrooming.Flowchart.TypeNotExist',
    FlowchartNotExistInAncestor:
        'BusinessGrooming.Flowchart.FlowchartNotExistInAncestor',
    FlowchartInvalidType: 'BusinessGrooming.Flowchart.FlowchartInvalidType',
    FlowchartInvalidParameter: 'BusinessGrooming.Flowchart.InvalidParameter',
    FlowchartInvalidParameterValue:
        'BusinessGrooming.Flowchart.InvalidParameterValue',
    FlowchartInvalidParameterJson:
        'BusinessGrooming.Flowchart.InvalidParameterJson',
    FlowchartModelNotFound: 'BusinessGrooming.Flowchart.ModelNotFound',
    FlowchartNameAlreadyExist: 'BusinessGrooming.Flowchart.NameAlreadyExist',
    FlowchartNotExist: 'BusinessGrooming.Flowchart.FlowchartNotExist',
    FlowchartFileNotExist: 'BusinessGrooming.Flowchart.FlowchartFileNotExist',
    FlowchartDatabaseError: 'BusinessGrooming.Flowchart.DatabaseError',
    FlowchartTemplateNameEmpty: 'BusinessGrooming.Flowchart.TemplateNameEmpty',
    FlowchartCreateUpdateFailed:
        'BusinessGrooming.Flowchart.CreateUpdateFailed',
    FlowchartSaveFailed: 'BusinessGrooming.Flowchart.SaveFileFailed',
    FlowchartRequiredFieldEmpty:
        'BusinessGrooming.Flowchart.RequiredFieldEmpty',
    FlowchartDeleteFailed: 'BusinessGrooming.Flowchart.DeleteFailed',
    FlowchartUserQueryFailed: 'BusinessGrooming.Flowchart.UserQueryFailed',
    FlowchartFileReadError: 'BusinessGrooming.Flowchart.ReadError',
    FlowchartAutoSaveFailed: 'BusinessGrooming.Flowchart.AutoSaveFailed',
    FlowchartOpenXmlFailed: 'BusinessGrooming.Flowchart.FlowchartOpenXmlFailed',
    FlowchartReadXmlFailed: 'BusinessGrooming.Flowchart.FlowchartReadXmlFailed',
    FlowchartReadXmlFormatFailed:
        'BusinessGrooming.Flowchart.FlowchartReadXmlFormatFailed',
    FlowchartCreateError: 'BusinessGrooming.Flowchart.FlowchartCreateError',
    FlowchartNodeNotFound: 'BusinessGrooming.Flowchart.FlowchartNodeNotFound',
    FlowchartNodeIsNotNormal:
        'BusinessGrooming.Flowchart.FlowchartNodeIsNotNormal',
    FlowchartNodeIsNotSubFlow:
        'BusinessGrooming.Flowchart.FlowchartNodeIsNotSubFlow',
    FlowchartNodeFormOtherNodeOccupancy:
        'BusinessGrooming.Flowchart.FlowchartNodeFormOtherNodeOccupancy',
    FlowchartNodeModelIsNotMainBusiness:
        'BusinessGrooming.Flowchart.FlowchartNodeModelIsNotMainBusiness',
    FlowchartRelationNotFound: 'BusinessGrooming.Flowchart.RelationNotFound',
    FlowchartNodeIDEmpty: 'BusinessGrooming.Flowchart.FlowchartNodeIDEmpty',
    FlowchartNodeNameEmpty: 'BusinessGrooming.Flowchart.FlowchartNodeNameEmpty',
    FlowchartPathIDEmpty: 'BusinessGrooming.Flowchart.FlowchartPathIDEmpty',
}
const FlowchartErrorMap = {
    [FlowchartErrorCode.FlowchartNodeBindOneModelOnly]: {
        description: '子流程节点仅允许绑定一个业务模型',
    },

    [FlowchartErrorCode.FlowchartFormNotExist]: {
        description: '该业务表单不存在',
    },

    [FlowchartErrorCode.FlowchartLoopReferenceError]: {
        description: '关联失败，无法关联包含自身的流程',
    },

    [FlowchartErrorCode.FlowchartInternalError]: {
        description: 'internal error',
    },
    [FlowchartErrorCode.FlowchartNoSuchFile]: {
        description: '导入流程图文件不存在',
    },
    [FlowchartErrorCode.FlowchartOneMax]: {
        description: '仅支持每次上传一个文件',
    },
    [FlowchartErrorCode.FlowchartTypeNotExist]: {
        description: '流程图文件类型不存在',
    },
    [FlowchartErrorCode.FlowchartNotExistInAncestor]: {
        description: '流程图的父级流程图中有不存在的，不能引用',
    },
    [FlowchartErrorCode.FlowchartInvalidType]: {
        description: '不支持的文件类型，流程图文件格式有误',
    },
    [FlowchartErrorCode.FlowchartInvalidParameter]: {
        description: '参数值校验不通过',
    },
    [FlowchartErrorCode.FlowchartInvalidParameterValue]: {
        description: '参数${param}校验不通过',
    },
    [FlowchartErrorCode.FlowchartInvalidParameterJson]: {
        description: '参数值校验不通过：json格式错误',
    },
    [FlowchartErrorCode.FlowchartModelNotFound]: {
        description: '业务模型不存在',
    },
    [FlowchartErrorCode.FlowchartNameAlreadyExist]: {
        description: '该业务流程图名称已存在，请重新输入',
    },
    [FlowchartErrorCode.FlowchartNotExist]: {
        description: '业务流程图不存在',
    },

    [FlowchartErrorCode.FlowchartFileNotExist]: {
        description: '流程图文件不存在',
    },

    [FlowchartErrorCode.FlowchartDatabaseError]: {
        description: '数据库异常',
    },

    [FlowchartErrorCode.FlowchartTemplateNameEmpty]: {
        description: '模板名为空',
    },
    [FlowchartErrorCode.FlowchartCreateUpdateFailed]: {
        description: '流程图创建或更新失败',
    },
    [FlowchartErrorCode.FlowchartSaveFailed]: {
        description: '流程图文件创建或保存失败',
    },
    [FlowchartErrorCode.FlowchartRequiredFieldEmpty]: {
        description: '必填项为空',
    },
    [FlowchartErrorCode.FlowchartDeleteFailed]: {
        description: '流程图删除失败，流程图不存在',
    },
    [FlowchartErrorCode.FlowchartUserQueryFailed]: {
        description: '流程图用户查询失败',
    },
    [FlowchartErrorCode.FlowchartFileReadError]: {
        description: '读取流程图文件失败',
    },
    [FlowchartErrorCode.FlowchartAutoSaveFailed]: {
        description: '流程图自动保存失败',
    },
    [FlowchartErrorCode.FlowchartOpenXmlFailed]: {
        description: '流程图文件打开失败',
    },
    [FlowchartErrorCode.FlowchartReadXmlFailed]: {
        description: '流程图文件读取失败',
    },
    [FlowchartErrorCode.FlowchartReadXmlFormatFailed]: {
        description: '流程图格式错误',
    },
    [FlowchartErrorCode.FlowchartCreateError]: {
        description: '主干业务下只能新建一个流程图',
    },
    [FlowchartErrorCode.FlowchartNodeNotFound]: {
        description: '未找到对应流程图节点',
    },
    [FlowchartErrorCode.FlowchartNodeIsNotNormal]: {
        description: '该流程图节点不是普通节点',
    },
    [FlowchartErrorCode.FlowchartNodeIsNotSubFlow]: {
        description: '该流程图节点不是子流程节点',
    },
    [FlowchartErrorCode.FlowchartNodeFormOtherNodeOccupancy]: {
        description: '移除失败，该业务表已关联至节点',
    },
    [FlowchartErrorCode.FlowchartNodeModelIsNotMainBusiness]: {
        description: '非主干业务流程图不可绑定',
    },
    [FlowchartErrorCode.FlowchartRelationNotFound]: {
        description: '未找到对应关联关系',
    },
    [FlowchartErrorCode.FlowchartNodeIDEmpty]: {
        description: 'node_id不能为空',
    },
    [FlowchartErrorCode.FlowchartNodeNameEmpty]: {
        description: 'node_name不能为空',
    },
    [FlowchartErrorCode.FlowchartPathIDEmpty]: {
        description: 'path_id不能为空',
    },
}

//  Form Error
const FormErrorCode = {
    FormJsonUnmarshal: 'BusinessGrooming.Form.JsonUnmarshalFailed',
    FormExcelVerify: 'BusinessGrooming.Form.ExcelVerifyFailed',
    FormInternalError: 'BusinessGrooming.Form.InternalError',
    FormInvalidParameter: 'BusinessGrooming.Form.InvalidParameter',
    FormInvalidParameterValue: 'BusinessGrooming.Form.InvalidParameterValue',
    FormNotSupportType: 'BusinessGrooming.Form.NotSupportFormType',
    FormStandardNameAlreadyExist: 'BusinessGrooming.Form.NameAlreadyExist',
    FormUserNotExist: 'BusinessGrooming.Form.UserNotExist',
    FormModelNotExist: 'BusinessGrooming.Form.ModelNotExist',
    FormFormNotExist: 'BusinessGrooming.Form.FormNotExist',
    FormFieldIdRequired: 'BusinessGrooming.Form.FormFieldIdRequired',
    FormFormNotExistWithoutId: 'BusinessGrooming.Form.FormNotExistWithoutId',
    FormIDNameNotMatch: 'BusinessGrooming.Form.FormIDNameNotMatch',
    FormFieldRefFormNotExist: 'BusinessGrooming.Form.RefFormNotExist',
    FormIndicatorSourceFormNotExist:
        'BusinessGrooming.Form.IndicatorSourceFormNotExist',
    FormModelOrFormNotExist: 'BusinessGrooming.Form.ModelOrFormNotExists',
    FormDatabaseError: 'BusinessGrooming.Form.DatabaseError',
    FormInvalidTypeEnum: 'BusinessGrooming.Form.InvalidTypeEnum',
    FormOpenExcelFileError: 'BusinessGrooming.Form.FormOpenExcelFileError',
    FormContentError: 'BusinessGrooming.Form.FormContentError',
    FormMaxLimitError: 'BusinessGrooming.Form.FormMaxLimitError',
    FormFeildMaxLimitError: 'BusinessGrooming.Form.FormFeildMaxLimitError',
    FormEmptyError: 'BusinessGrooming.Form.FormEmptyError',
    FormHasEmptLine: 'BusinessGrooming.Form.FormHasEmptLine',
    FormTransformError: 'BusinessGrooming.Form.FormTransformError',
    FormJsonMarshalError: 'BusinessGrooming.Form.FormJsonMarshalError',
    FormJsonUnMarshalError: 'BusinessGrooming.Form.FormJsonUnMarshalError',
    FormGetTemplateError: 'BusinessGrooming.Form.FormGetTemplateError',
    FormGetRuleError: 'BusinessGrooming.Form.FormGetRuleError',
    FormPanic: 'BusinessGrooming.Form.FormPanic',
    FormModelIdInvalid: 'BusinessGrooming.Form.FormModelIdInvalid',
    FormInvalidParameters: 'BusinessGrooming.Form.FormInvalidParameters',
    FormFileSizeLarge: 'BusinessGrooming.Form.FormFileSizeLarge',
    FormCreateDirError: 'BusinessGrooming.Form.FormCreateDirError',
    FormImportError: 'BusinessGrooming.Form.FormImportError',
    DSFormImportError: 'BusinessGrooming.Form.DSFormImportError',
    FormIDataLengthError: 'BusinessGrooming.Form.FormIDataLengthError',
    FormExistRequiredEmpty: 'BusinessGrooming.Form.FormExistRequiredEmpty',
    FormNoSuchFile: 'BusinessGrooming.Form.FormNoSuchFile',
    FormOneMax: 'BusinessGrooming.Form.FormOneMax',
    FormSaveFileError: 'BusinessGrooming.Form.FormSaveFileError',
    FormFieldRelateFormError: 'BusinessGrooming.Form.FieldRelateFormError',
    FieldRefCannotModifyError:
        'BusinessGrooming.Form.FieldRefCannotModifyError',
    FormFieldDuplicateError: 'BusinessGrooming.Form.FormFieldDuplicateError',
    FormBusinessTableFileDuplicateError:
        'BusinessGrooming.Form.FormBusinessTableFileDuplicateError',
    FormGeneralError: 'BusinessGrooming.Form.FormGeneralError',
    FormFusionDuplicateError: 'BusinessGrooming.Form.FormFusionDuplicateError',
    FormBusinessTableDBDuplicateError:
        'BusinessGrooming.Form.FormBusinessTableDBDuplicateError',
    FormBusinessTableSingleDuplicateError:
        'BusinessGrooming.Form.FormBusinessTableSingleDuplicateError',
    FormImportEmptFileError: 'BusinessGrooming.Form.FormImportEmptFileError',
    FormInvalidParameterJson: 'BusinessGrooming.Form.InvalidParameterJson',
    FormStandardNotExist: 'BusinessGrooming.Form.FormStandardNotExist',
    FormFusionFieldNotExist: 'BusinessGrooming.Form.FormFusionFieldNotExist',
    FormFieldNotExist: 'BusinessGrooming.Form.FormFieldNotExist',
    FormInfoSystemNotExist: 'BusinessGrooming.Form.FormInfoSystemNotExist',
    FormFieldRefNotMatch: 'BusinessGrooming.Form.FieldRefNotMatch',
    FormRefStatusError: 'BusinessGrooming.Form.FormRefStatusError',
    FormRefDuplicateError: 'BusinessGrooming.Form.FormRefDuplicateError',
    FormImportDuplicate: 'BusinessGrooming.Form.FormImportDuplicate',
    FormExcelInvalidType: 'BusinessGrooming.Form.FormExcelInvalidType',
    FormOpenTemplateFileError:
        'BusinessGrooming.Form.FormOpenTemplateFileError',
    FormExcelFileWriteError:
        'BusinessGrooming.Indicator.FormExcelFileWriteError',
    FormImportReNameTypeError:
        'BusinessGrooming.Indicator.FormImportReNameTypeError',
    FormImportModifyOnlyOneTable:
        'BusinessGrooming.Indicator.FormImportModifyOnlyOneTable',
    FormBusinessTableDataLengthError:
        'BusinessGrooming.Form.FormBusinessTableDataLengthError',
    FormBusinessTableDataAccuracyError:
        'BusinessGrooming.Form.FormBusinessTableDataAccuracyError',
    FormFieldStandardNameENError:
        'BusinessGrooming.Form.FormFieldStandardNameENError',
    FormFieldStandardNameError:
        'BusinessGrooming.Form.FormFieldStandardNameError',
    FormFieldStandardUnit: 'BusinessGrooming.Form.FormFieldStandardUnit',
    FormFieldStandardValueRange:
        'BusinessGrooming.Form.FormFieldStandardValueRange',
    FormFieldStandardDescription:
        'BusinessGrooming.Form.FormFieldStandardDescription',
    FormCreateMessageSendError: 'BusinessGrooming.Form.CreateMessageSendError',
    FormRenameMessageSendError: 'BusinessGrooming.Form.RenameMessageSendError',
    FormDeleteMessageSendError: 'BusinessGrooming.Form.DeleteMessageSendError',
    FormDataCatalogJsonError: 'BusinessGrooming.Form.DataCatalogJsonError',
    FormDataCatalogUrlError: 'BusinessGrooming.Model.DataCatalogUrlError',
    FormDataCatalogCreateError: 'BusinessGrooming.Model.DataCatalogCreateError',
    FormDataCatalogUpdateError: 'BusinessGrooming.Model.DataCatalogUpdateError',
    FormDataCatalogQueryError: 'BusinessGrooming.Model.DataCatalogQueryError',
    FormDataCatalogEmptyError:
        'BusinessGrooming.Model.FormDataCatalogEmptyError',
    FormCatalogNotExistsError: 'BusinessGrooming.Model.CatalogNotExistsError',
    FormDataKindError: 'BusinessGrooming.Model.DataKindError',
    FormImportPropError: 'BusinessGrooming.Model.FormImportPropError',
    FormExportPropError: 'BusinessGrooming.Model.FormExportPropError',
    RefBusinessObjectNotExistError:
        'BusinessGrooming.Model.RefBusinessObjectNotExistError',
    RefAttributeNotExistError:
        'BusinessGrooming.Model.RefAttributeNotExistError',
    FieldNotInFormExistError: 'BusinessGrooming.Model.FieldNotInFormExistError',
    AttributeNotInObjectError:
        'BusinessGrooming.Model.AttributeNotInObjectError',
    AttributeHadBindError: 'BusinessGrooming.Model.AttributeHadBindError',
    AttributeBindMustDataSourceImport:
        'BusinessGrooming.Model.AttributeBindMustDataSourceImport',
    RefBusinessObjectNotExist:
        'BusinessGrooming.Model.RefBusinessObjectNotExist',
    OhtersRefBusinessModelNotExist:
        'BusinessGrooming.Model.OhtersRefBusinessModelNotExist',
    OhtersRefBusinessFormNotExist:
        'BusinessGrooming.Model.OhtersRefBusinessFormNotExist',
}

const FormErrorMap = {
    [FormErrorCode.FormJsonUnmarshal]: {
        description: 'json.Marshal转化失败',
    },
    [FormErrorCode.FormExcelVerify]: {
        description: '存在文件内必填项为空，或文件内容与模板不符',
    },
    [FormErrorCode.FormInternalError]: {
        description: 'internal error',
    },
    [FormErrorCode.FormInvalidParameter]: {
        description: '参数值校验不通过',
    },
    [FormErrorCode.FormInvalidParameterValue]: {
        description: '参数值${param}校验不通过',
    },
    [FormErrorCode.FormNotSupportType]: {
        description: '该表单类型不支持相关操作',
    },
    [FormErrorCode.FormStandardNameAlreadyExist]: {
        description: '该业务表名称已存在',
    },

    [FormErrorCode.FormUserNotExist]: {
        description: '用户${user}不存在',
    },
    [FormErrorCode.FormModelNotExist]: {
        description: '业务模型${model}不存在',
    },
    [FormErrorCode.FormFormNotExist]: {
        description: '该业务模型下，业务表${form}不存在',
    },
    [FormErrorCode.FormFieldIdRequired]: {
        description: '业务表字段id不可为空',
    },
    [FormErrorCode.FormFormNotExistWithoutId]: {
        description: '该业务表不存在',
    },
    [FormErrorCode.FormIDNameNotMatch]: {
        description: '表单id与name不匹配',
    },
    [FormErrorCode.FormFieldRefFormNotExist]: {
        description: '该字段对应的业务表单不存在',
    },
    [FormErrorCode.FormIndicatorSourceFormNotExist]: {
        description: '有来源业务表不存在',
    },

    [FormErrorCode.FormModelOrFormNotExist]: {
        description: '业务模型或业务表单不存在',
    },
    [FormErrorCode.FormDatabaseError]: {
        description: '数据库连接错误或者SQL语句错误',
    },
    [FormErrorCode.FormInvalidTypeEnum]: {
        description: '表单类型不合法',
    },
    [FormErrorCode.FormOpenExcelFileError]: {
        description: '打开文件失败',
    },
    [FormErrorCode.FormContentError]: {
        description: '文件内容与模板不符',
    },
    [FormErrorCode.FormMaxLimitError]: {
        description: '每次仅支持最多导入${%d}个业务表单',
    },
    [FormErrorCode.FormFeildMaxLimitError]: {
        description: '每次仅支持最多导入${%d}个业务表单字段',
    },
    [FormErrorCode.FormEmptyError]: {
        description: '业务表单为空请检查',
    },
    [FormErrorCode.FormHasEmptLine]: {
        description: '数据存在空行',
    },
    [FormErrorCode.FormTransformError]: {
        description: '根据配置文件解析失败，文件中多行值超过最大限制',
    },
    [FormErrorCode.FormJsonMarshalError]: {
        description: 'json.Marshal转化失败',
    },
    [FormErrorCode.FormJsonUnMarshalError]: {
        description: 'json.UnMarshal转化失败',
    },
    [FormErrorCode.FormGetTemplateError]: {
        description: '获取模板配置失败',
    },
    [FormErrorCode.FormGetRuleError]: {
        description: '获取规则配置失败',
    },
    [FormErrorCode.FormPanic]: {
        description: '服务异常',
    },
    [FormErrorCode.FormModelIdInvalid]: {
        description: '业务模型ID不合法',
    },
    [FormErrorCode.FormInvalidParameters]: {
        description: '参数不合法',
    },
    [FormErrorCode.FormFileSizeLarge]: {
        description: '文件不可超过10MB',
    },
    [FormErrorCode.FormCreateDirError]: {
        description: '创建目录失败',
    },
    [FormErrorCode.FormImportError]: {
        description: '表单导入失败',
    },
    [FormErrorCode.DSFormImportError]: {
        description: '导入失败，选择导入的数据表已经存在',
    },
    [FormErrorCode.FormIDataLengthError]: {
        description: '数据长度不是1~65535范围内的整数',
    },
    [FormErrorCode.FormExistRequiredEmpty]: {
        description: '存在文件内必填项为空',
    },
    [FormErrorCode.FormNoSuchFile]: {
        description: '导入文件不存在',
    },
    [FormErrorCode.FormOneMax]: {
        description: '仅支持每次上传一个文件',
    },
    [FormErrorCode.FormSaveFileError]: {
        description: '保存文件失败',
    },
    [FormErrorCode.FormFieldRelateFormError]: {
        description: '字段列表中指向的业务表名称在业务表清单中不存在',
    },
    [FormErrorCode.FieldRefCannotModifyError]: {
        description: '${form}字段为引用字段，不允许修改',
    },
    [FormErrorCode.FormFieldDuplicateError]: {
        description: '同一个业务表下，存在字段名称重复',
    },
    [FormErrorCode.FormBusinessTableFileDuplicateError]: {
        description: '文件内的业务表名称不能重复',
    },
    [FormErrorCode.FormGeneralError]: {
        description:
            '%v 长度必须在1-128之间，仅支持中英文、数字及键盘上的特殊字符',
    },
    [FormErrorCode.FormFusionDuplicateError]: {
        description: '存在文件内业务表名称重复，或与已存在的业务表名称重复',
    },
    [FormErrorCode.FormBusinessTableDBDuplicateError]: {
        description: '一个业务模型下的业务表名称重复',
    },
    [FormErrorCode.FormBusinessTableSingleDuplicateError]: {
        description: '选择重命名，修改还是取消',
    },
    [FormErrorCode.FormImportEmptFileError]: {
        description: '必须上传1个文件',
    },
    [FormErrorCode.FormInvalidParameterJson]: {
        description: '参数值校验不通过：json格式错误',
    },
    [FormErrorCode.FormStandardNotExist]: {
        description: '业务表不存在',
    },
    [FormErrorCode.FormFusionFieldNotExist]: {
        description: '融合字段中：字段${param}在业务表不存在',
    },
    [FormErrorCode.FormFieldNotExist]: {
        description: '业务字段不存在',
    },
    [FormErrorCode.FormInfoSystemNotExist]: {
        description: '该信息系统${param}不存在',
    },
    [FormErrorCode.FormFieldRefNotMatch]: {
        description: '存在被引用字段与引用字段的属性不匹配',
    },
    [FormErrorCode.FormRefStatusError]: {
        description: '状态不对，修改字段时，不能带引用字段id',
    },
    [FormErrorCode.FormRefDuplicateError]: {
        description: '同一业务表，两个字段不能引用同一个源表字段',
    },
    [FormErrorCode.FormImportDuplicate]: {
        description: '存在 (${%s}) 重复，请重试',
    },
    [FormErrorCode.FormExcelInvalidType]: {
        description: '不支持的文件类型，Excel文件格式有误',
    },
    [FormErrorCode.FormOpenTemplateFileError]: {
        description: '打开模板文件失败',
    },
    [FormErrorCode.FormExcelFileWriteError]: {
        description: 'Excel文件写入错误',
    },
    [FormErrorCode.FormImportReNameTypeError]: {
        description: '重命名导入只支持',
    },
    [FormErrorCode.FormImportModifyOnlyOneTable]: {
        description: '导入修改只能每次导入一张表',
    },
    [FormErrorCode.FormBusinessTableDataLengthError]: {
        description:
            '数据长度只有在数据类型为数字型和字符型时生效，数字型数据长度为0~65位，字符型/二进制数据长度为0~65535位',
    },
    [FormErrorCode.FormBusinessTableDataAccuracyError]: {
        description:
            '数据精度只有在数据类型为数字型时生效，0~30，且不能大于数据长度',
    },
    [FormErrorCode.FormFieldStandardNameENError]: {
        description:
            '字段英文名长度必须不超过128，仅支持英文、数字、下划线、中划线，且不能以下划线和中划线开头',
    },
    [FormErrorCode.FormFieldStandardNameError]: {
        description:
            '字段中文名长度必须不超过128，仅支持中英文、数字及键盘上的特殊符号',
    },
    [FormErrorCode.FormFieldStandardUnit]: {
        description:
            '计量单位长度必须不超过128，仅支持中英文、数字及键盘上的特殊符号',
    },
    [FormErrorCode.FormFieldStandardValueRange]: {
        description:
            '值域长度必须不超过128，仅支持中英文、数字及键盘上的特殊符号',
    },
    [FormErrorCode.FormFieldStandardDescription]: {
        description:
            '字段注释长度必须不超过300，仅支持中英文、数字及键盘上的特殊符号',
    },
    [FormErrorCode.FormCreateMessageSendError]: {
        description: '新建表单消息发送失败',
    },
    [FormErrorCode.FormRenameMessageSendError]: {
        description: '重命名表单消息发送失败',
    },
    [FormErrorCode.FormDeleteMessageSendError]: {
        description: '删除表单消息发送失败',
    },
    [FormErrorCode.FormDataCatalogJsonError]: {
        description: '数据资源目录接口数据错误',
    },
    [FormErrorCode.FormDataCatalogUrlError]: {
        description: '数据资源目录服务异常，或url地址有误',
    },
    [FormErrorCode.FormDataCatalogCreateError]: {
        description: '数据资源目录创建失败',
    },
    [FormErrorCode.FormDataCatalogUpdateError]: {
        description: '数据资源目录更新失败',
    },
    [FormErrorCode.FormDataCatalogQueryError]: {
        description: '数据资源目录查询失败',
    },
    [FormErrorCode.FormDataCatalogEmptyError]: {
        description: '业务表不存在或未加工',
    },
    [FormErrorCode.FormCatalogNotExistsError]: {
        description: '数据资源编目不存在',
    },
    [FormErrorCode.FormDataKindError]: {
        description: "基础信息分类错误，'其他' 只能单独存在",
    },
    [FormErrorCode.FormImportPropError]: {
        description: '导入${sheet}第${row}条数据，${key}：${error}',
    },
    [FormErrorCode.FormExportPropError]: {
        description: '导出业务表错误，${prop}查询错误',
    },
    [FormErrorCode.RefBusinessObjectNotExistError]: {
        description: '关联的业务对象/活动被删除，请重新选择',
    },
    [FormErrorCode.RefAttributeNotExistError]: {
        description: '部分属性被删除，重置列表后请重新保存',
    },
    [FormErrorCode.FieldNotInFormExistError]: {
        description: '字段不存在或者暂未保存',
    },
    [FormErrorCode.AttributeNotInObjectError]: {
        description: '属性不在该业务活动下',
    },
    [FormErrorCode.AttributeHadBindError]: {
        description: '属性${test}已被关联，重置列表后请重新保存',
    },
    [FormErrorCode.AttributeBindMustDataSourceImport]: {
        description: '表字段关联属性必须为数据源导入的表',
    },
    [FormErrorCode.RefBusinessObjectNotExist]: {
        description: '关联业务对象/活动已不存在',
    },
    [FormErrorCode.OhtersRefBusinessModelNotExist]: {
        description: '该业务对象/活动下属性已在其他表下关联的主干业务已不存在',
    },
    [FormErrorCode.OhtersRefBusinessFormNotExist]: {
        description: '该业务对象/活动下属性关联的其他表已不存在',
    },
}

// Glossary Error
const GlossaryErrorCode = {
    NameRepeat: 'BusinessGrooming.Glossary.NameRepeat',
    ParentNotExist: 'BusinessGrooming.Glossary.ParentNotExist',
    ObjectNotExist: 'BusinessGrooming.Glossary.ObjectNotExist',
    UnsupportedCreate: 'BusinessGrooming.Glossary.UnsupportedCreate',
    UnsupportedUpdate: 'BusinessGrooming.Glossary.UnsupportedUpdate',
    UnsupportedAddOwner: 'BusinessGrooming.Glossary.UnsupportedAddOwner',
    UnsupportedUpdateType: 'BusinessGrooming.Glossary.UnsupportedUpdateType',
    OwnersNotExist: 'BusinessGrooming.Glossary.OwnersNotExist',
    TypeNotExist: 'BusinessGrooming.Glossary.TypeNotExist',
    UniqueErr: 'BusinessGrooming.Glossary.UniqueErr',
    UniqueNotExist: 'BusinessGrooming.Glossary.UniqueNotExist',
    RefObjectNotExist: 'BusinessGrooming.Glossary.RefObjectNotExist',
    OwnersIncorrect: 'BusinessGrooming.Glossary.OwnersIncorrect',
}

const GlossaryErrorMap = {
    [GlossaryErrorCode.NameRepeat]: {
        description: '名称已存在，请重新输入',
    },
    [GlossaryErrorCode.ParentNotExist]: {
        description: '父节点不存在',
    },
    [GlossaryErrorCode.ObjectNotExist]: {
        description: '目标节点不存在',
    },
    [GlossaryErrorCode.UnsupportedCreate]: {
        description: '当前节点下不支持新建该类型节点',
    },
    [GlossaryErrorCode.UnsupportedUpdate]: {
        description: '当前节点下不支持修改',
    },
    [GlossaryErrorCode.UnsupportedAddOwner]: {
        description: '当前节点下不支持添加/修改拥有者',
    },
    [GlossaryErrorCode.UnsupportedUpdateType]: {
        description: '当前节点下不支持修改对象类型',
    },
    [GlossaryErrorCode.OwnersNotExist]: {
        description: 'owners为必填项',
    },
    [GlossaryErrorCode.TypeNotExist]: {
        description: 'type为必填项',
    },
    [GlossaryErrorCode.UniqueErr]: {
        description: '业务对象/业务活动最多只能有一个唯一标识',
    },
    [GlossaryErrorCode.UniqueNotExist]: {
        description: '业务对象必须要有一个唯一标识',
    },
    [GlossaryErrorCode.RefObjectNotExist]: {
        description: '引用的业务对象/业务活动不存在',
    },
    [GlossaryErrorCode.OwnersIncorrect]: {
        description: 'owners不是数据owner下的用户',
    },
}

// Indicator Error
const IndicatorErrorCode = {
    IndicatorBusinessFormNotRelation:
        'BusinessGrooming.Indicator.IndicatorBusinessFormNotRelation',
    IndicatorNotNotExists: 'BusinessGrooming.Indicator.IndicatorNotNotExists',
    IndicatorWhereOpNotAllowed: 'BusinessGrooming.Model.WhereOpNotAllowed',
    IndicatorGroupFormatNotAllowed:
        'BusinessGrooming.Model.GroupFormatNotAllowed',
    IndicatorOpenLookEngQueryFaild:
        'BusinessGrooming.Model.OpenLookEngQueryFaild',
    IndicatorMetaDataNotFound: 'BusinessGrooming.Model.MetaDataNotFound',
    IndicatorFormNotProcess: 'BusinessGrooming.Indicator.FormNotProcess',
    IndicatorFormNotExists: 'BusinessGrooming.Indicator.FormNotExists',
    IndicatorExcelInvalidType:
        'BusinessGrooming.Indicator.IndicatorExcelInvalidType',
    IndicatorImportError: 'BusinessGrooming.Indicator.IndicatorImportError',
    IndicatorNameRepeatError: 'BusinessGrooming.Indicator.NameRepeatError',
    IndicatorDatabaseError: 'BusinessGrooming.Indicator.DatabaseError',
    IndicatorValueRepeatError: 'BusinessGrooming.Indicator.ValueRepeatError',
    IndicatorModelNotExistsError:
        'BusinessGrooming.Indicator.ModelNotExistsError',
    IndicatorRecordNotFoundError:
        'BusinessGrooming.Indicator.RecordNotFoundError',
    IndicatorInvalidParameter: 'BusinessGrooming.Indicator.InvalidParameter',
    IndicatorInvalidParameterJson:
        'BusinessGrooming.Indicator.InvalidParameterJson',
    IndicatorFormFileReadError: 'BusinessGrooming.Indicator.FormFileReadError',
    IndicatorFormExcelFileOneMax:
        'BusinessGrooming.Indicator.FormExcelFileOneMax',
    IndicatorInternalError: 'BusinessGrooming.Indicator.InternalError',
    IndicatorModifiableKeyEmpty:
        'BusinessGrooming.Indicator.ModifiableKeyEmpty',
    IndicatorParseExcelRuleError:
        'BusinessGrooming.Indicator.ParseExcelRuleError',
    IndicatorUnSupportParseRuleError:
        'BusinessGrooming.Indicator.UnSupportParseRuleError',
    IndicatorExcelRowNameRepeatError:
        'BusinessGrooming.Indicator.ExcelRowNameRepeatError',
    IndicatorExcelNameRepeatError:
        'BusinessGrooming.Indicator.ExcelNameRepeatError',
    IndicatorExcelRowReadError: 'BusinessGrooming.Indicator.ExcelRowReadError',
    IndicatorExcelContentNotMatchedError:
        'BusinessGrooming.Indicator.ExcelContentNotMatchedError',
    IndicatorExcelRequiredNotEmpty:
        'BusinessGrooming.Indicator.ExcelRequiredNotEmpty',
    IndicatorExcelMax200Error: 'BusinessGrooming.Indicator.Max200Error',
    IndicatorTemplateNotFoundError:
        'BusinessGrooming.Indicator.TemplateNotFoundError',
    IndicatorOpenTemplateFileError:
        'BusinessGrooming.Indicator.OpenTemplateFileError',
    IndicatorTemplateFileError: 'BusinessGrooming.Indicator.TemplateFileError',
    IndicatorMaxLineReachedError:
        'BusinessGrooming.Indicator.MaxLineReachedError',
    IndicatorExcelFileWriteError:
        'BusinessGrooming.Indicator.ExcelFileWriteError',
    IndicatorSourceTableInfoError:
        'BusinessGrooming.Indicator.ExcelFileWriteError',
    IndicatorSourceTableNotExist:
        'BusinessGrooming.Indicator.IndicatorSourceTableNotExist',
    IndicatorSourceTableNotExists:
        'BusinessGrooming.Indicator.SourceTableNotExists',
    IndicatorSourceTableFieldsNotExists:
        'BusinessGrooming.Indicator.SourceTableFieldsNotExists',
    IndicatorSourceTableFieldsNotMatched:
        'BusinessGrooming.Indicator.SourceTableFieldsNotMatched',
    IndicatorTemplateError: 'BusinessGrooming.Indicator.IndicatorTemplateError',
    IndicatorExportError: 'BusinessGrooming.Indicator.IndicatorExportError',
    IndicatorFieldsMustMatch:
        'BusinessGrooming.Indicator.IndicatorFieldsMustMatch',
    IndicatorFieldsMustMatchTwo:
        'BusinessGrooming.Indicator.IndicatorFieldsMustMatchTwo',
    IndicatorTablesMustMatch:
        'BusinessGrooming.Indicator.IndicatorTablesMustMatch',
    IndicatorOutputFieldsMustMatch:
        'BusinessGrooming.Indicator.IndicatorOutputFieldsMustMatch',
    IndicatorDraftNotAllowedChange:
        'BusinessGrooming.Indicator.DraftNotAllowedChange',
    IndicatorReleaseNotAllowedChange:
        'BusinessGrooming.Indicator.ReleaseNotAllowedChange',
    IndicatorSingleTaskNotAllowedChange:
        'BusinessGrooming.Indicator.SingleTaskNotAllowedChange',
    IndicatorNotAllowedChangeOther:
        'BusinessGrooming.Indicator.NotAllowedChangeOther',
    IndicatorOtherTaskTypeForbiddenQuery:
        'BusinessGrooming.Indicator.OtherTaskTypeForbiddenQuery',
    IndicatorTaskCenterTaskNotFound:
        'BusinessGrooming.Model.TaskCenterTaskNotFoundError',
}
const IndicatorErrorMap = {
    [IndicatorErrorCode.IndicatorBusinessFormNotRelation]: {
        description: '业务表之间添加关联关系',
    },
    [IndicatorErrorCode.IndicatorNotNotExists]: {
        description: '指标不存在',
    },
    [IndicatorErrorCode.IndicatorWhereOpNotAllowed]: {
        description: '非法指标限定选项',
    },
    [IndicatorErrorCode.IndicatorGroupFormatNotAllowed]: {
        description: '非法分组格式选项',
    },
    [IndicatorErrorCode.IndicatorOpenLookEngQueryFaild]: {
        description: '指标查询失败',
    },
    [IndicatorErrorCode.IndicatorMetaDataNotFound]: {
        description: '元数据平台未获取到数据源',
    },
    [IndicatorErrorCode.IndicatorFormNotProcess]: {
        description: '指标模型中业务表单未加工',
    },
    [IndicatorErrorCode.IndicatorFormNotExists]: {
        description: '指标模型中业务表单不存在',
    },
    [IndicatorErrorCode.IndicatorExcelInvalidType]: {
        description: '不支持的文件类型，Excel文件格式有误',
    },
    [IndicatorErrorCode.IndicatorImportError]: {
        description: '业务指标导入失败',
    },
    [IndicatorErrorCode.IndicatorNameRepeatError]: {
        description: '该指标名称已存在，请重新输入',
    },
    [IndicatorErrorCode.IndicatorDatabaseError]: {
        description: '数据库连接错误或者SQL语句错误',
    },
    [IndicatorErrorCode.IndicatorValueRepeatError]: {
        description: '输入值在数据库中重复',
    },
    [IndicatorErrorCode.IndicatorModelNotExistsError]: {
        description: '业务模型${%s}不存在',
    },
    [IndicatorErrorCode.IndicatorRecordNotFoundError]: {
        description: '该指标不存在',
    },
    [IndicatorErrorCode.IndicatorInvalidParameter]: {
        description: '参数值校验不通过',
    },
    [IndicatorErrorCode.IndicatorInvalidParameterJson]: {
        description: '参数值校验不通过：json格式错误',
    },
    [IndicatorErrorCode.IndicatorFormFileReadError]: {
        description: '表单文件读取错误',
    },
    [IndicatorErrorCode.IndicatorFormExcelFileOneMax]: {
        description: '必须上传一个文件',
    },
    [IndicatorErrorCode.IndicatorInternalError]: {
        description: '业务指标模块内部错误',
    },
    [IndicatorErrorCode.IndicatorModifiableKeyEmpty]: {
        description: '可修改属性为空',
    },
    [IndicatorErrorCode.IndicatorParseExcelRuleError]: {
        description: '解析Excel模板错误',
    },
    [IndicatorErrorCode.IndicatorUnSupportParseRuleError]: {
        description: '不支持的解析规则类型',
    },
    [IndicatorErrorCode.IndicatorExcelRowNameRepeatError]: {
        description: '第${row}行名称出现重复',
    },
    [IndicatorErrorCode.IndicatorExcelNameRepeatError]: {
        description: '存在文件内指标名称重复，或与已存在的指标名称重复',
    },
    [IndicatorErrorCode.IndicatorExcelRowReadError]: {
        description: '读取Excel文件行错误',
    },
    [IndicatorErrorCode.IndicatorExcelContentNotMatchedError]: {
        description: '文件内容与模板不符',
    },
    [IndicatorErrorCode.IndicatorExcelRequiredNotEmpty]: {
        description: '存在文件内必填项为空',
    },
    [IndicatorErrorCode.IndicatorExcelMax200Error]: {
        description: '每次最多导入200个指标',
    },
    [IndicatorErrorCode.IndicatorTemplateNotFoundError]: {
        description: '没有找到解析模板',
    },
    [IndicatorErrorCode.IndicatorOpenTemplateFileError]: {
        description: '打开解析模板错误',
    },
    [IndicatorErrorCode.IndicatorTemplateFileError]: {
        description: '模板文件错误',
    },
    [IndicatorErrorCode.IndicatorMaxLineReachedError]: {
        description: '根据配置文件解析失败，文件中多行值超过最大限制',
    },
    [IndicatorErrorCode.IndicatorExcelFileWriteError]: {
        description: 'Excel文件写入错误',
    },
    [IndicatorErrorCode.IndicatorSourceTableInfoError]: {
        description: '来源业务表、业务表字段、字段英文名不匹配',
    },
    [IndicatorErrorCode.IndicatorSourceTableNotExist]: {
        description: '有来源业务表不存在',
    },
    [IndicatorErrorCode.IndicatorSourceTableNotExists]: {
        description: '指标来源表${source_table}不存在',
    },
    [IndicatorErrorCode.IndicatorSourceTableFieldsNotExists]: {
        description: '指标来源表${source_table}字段${field_cn}不存在',
    },
    [IndicatorErrorCode.IndicatorSourceTableFieldsNotMatched]: {
        description:
            '指标来源表${source_table}字段${field_cn}和字段${field_en}不匹配',
    },
    [IndicatorErrorCode.IndicatorTemplateError]: {
        description: '文件内容与模板不符',
    },
    [IndicatorErrorCode.IndicatorExportError]: {
        description: '指标导出失败，因为指标不存在',
    },
    [IndicatorErrorCode.IndicatorFieldsMustMatch]: {
        description: '运算逻辑、字段英文名称与来源字段的个数需要一致',
    },
    [IndicatorErrorCode.IndicatorFieldsMustMatchTwo]: {
        description: '取值规则与来源字段的个数需要一致',
    },
    [IndicatorErrorCode.IndicatorTablesMustMatch]: {
        description: '来源业务表、中文字段和英文字段相对应的业务表个数需要一致',
    },
    [IndicatorErrorCode.IndicatorOutputFieldsMustMatch]: {
        description: '输出字段与输出字段说明的个数需要一致',
    },
    [IndicatorErrorCode.IndicatorDraftNotAllowedChange]: {
        description: '草稿状态的指标只能在同项目的任务或游离任务中操作',
    },
    [IndicatorErrorCode.IndicatorReleaseNotAllowedChange]: {
        description: '已发布指标不能在项目中修改',
    },
    [IndicatorErrorCode.IndicatorSingleTaskNotAllowedChange]: {
        description: '单个任务不能修改其他任务的未完成指标',
    },
    [IndicatorErrorCode.IndicatorNotAllowedChangeOther]: {
        description: '项目中只能修改自己项目内的指标',
    },
    [IndicatorErrorCode.IndicatorOtherTaskTypeForbiddenQuery]: {
        description: '非指标类任务无法查询指标列表',
    },
    [IndicatorErrorCode.IndicatorTaskCenterTaskNotFound]: {
        description: '该任务不存在',
    },
}

// IndicatorModel Error
const IndicatorModelErrorCode = {
    IndicatorModelNameRepeatError:
        'BusinessGrooming.IndicatorModel.NameRepeatError',
    IndicatorModelDatabaseError:
        'BusinessGrooming.IndicatorModel.DatabaseError',
    IndicatorModelBusinessModelNotExist:
        'BusinessGrooming.IndicatorModel.ModelNotExistsError',
    IndicatorModelRecordNotFoundError:
        'BusinessGrooming.IndicatorModel.RecordNotFoundError',
    IndicatorModelInvalidParameter:
        'BusinessGrooming.IndicatorModel.InvalidParameter',
    IndicatorModelInvalidParameterJson:
        'BusinessGrooming.IndicatorModel.InvalidParameterJson',
    IndicatorModelConnectWithTwoFields:
        'BusinessGrooming.IndicatorModel.ConnectWithTwoFields',
    IndicatorModelConnectWithStandards:
        'BusinessGrooming.IndicatorModel.ConnectWithStandards',
    IndicatorModelFieldWithTwoLines:
        'BusinessGrooming.IndicatorModel.FieldWithTwoLines',
    IndicatorModelNameRepeat: 'BusinessGrooming.IndicatorModel.NameRepeat',
    IndicatorFormNotExist:
        'BusinessGrooming.Indicator.IndicatorFormNotExistsError',
}
const IndicatorModelErrorMap = {
    [IndicatorModelErrorCode.IndicatorModelNameRepeatError]: {
        description: '该指标模型名称已存在，请重新输入',
    },
    [IndicatorModelErrorCode.IndicatorModelDatabaseError]: {
        description: '数据库连接错误或者SQL语句错误',
    },
    [IndicatorModelErrorCode.IndicatorModelBusinessModelNotExist]: {
        description: '主干业务${%s}不存在',
    },
    [IndicatorModelErrorCode.IndicatorModelRecordNotFoundError]: {
        description: '该指标模型不存在',
    },
    [IndicatorModelErrorCode.IndicatorModelInvalidParameter]: {
        description: '参数值校验不通过',
    },
    [IndicatorModelErrorCode.IndicatorModelInvalidParameterJson]: {
        description: '参数值校验不通过：json格式错误',
    },
    [IndicatorModelErrorCode.IndicatorModelConnectWithTwoFields]: {
        description: '两张业务表之间，不能同时有两个字段连接',
    },
    [IndicatorModelErrorCode.IndicatorModelConnectWithStandards]: {
        description: '类型一致的字段，才能建立连接关系',
    },
    [IndicatorModelErrorCode.IndicatorModelFieldWithTwoLines]: {
        description: '不能存在多条连线指向同一字段',
    },
    [IndicatorModelErrorCode.IndicatorModelNameRepeat]: {
        description: '该业务指标模型名称已存在，请重新输入',
    },
    [IndicatorModelErrorCode.IndicatorFormNotExist]: {
        description: '业务表或业务字段不存在，请刷新页面',
    },
}

// Report Error
const ReportErrorCode = {
    ReportInvalidParameter: 'BusinessGrooming.Report.InvalidParameter',
    ReportInvalidParameterValue:
        'BusinessGrooming.Report.InvalidParameterValue',
    ReportDatabaseError: 'BusinessGrooming.Report.DatabaseError',
    ReportModelNotExist: 'BusinessGrooming.Report.ModelNotExist',
    ReportObjectNotExist: 'BusinessGrooming.Report.ObjectNotExist',
    ReportJsonMarshalError: 'BusinessGrooming.Report.JsonMarshalError',
    ReportJsonUnMarshalError: 'BusinessGrooming.Report.JsonUnMarshalError',
    ReportADUrlError: 'BusinessGrooming.Report.ADUrlError',
    ReportADDataError: 'BusinessGrooming.Report.ADDataError',
}
const ReportErrorMap = {
    [ReportErrorCode.ReportInvalidParameter]: {
        description: '参数值校验不通过',
    },
    [ReportErrorCode.ReportInvalidParameterValue]: {
        description: '参数${param}校验不通过',
    },
    [ReportErrorCode.ReportDatabaseError]: {
        description: '数据库连接错误或者SQL语句错误',
    },
    [ReportErrorCode.ReportModelNotExist]: {
        description: '业务模型${model}不存在',
    },
    [ReportErrorCode.ReportObjectNotExist]: {
        description: '对象${object}不存在',
    },
    [ReportErrorCode.ReportJsonMarshalError]: {
        description: 'json.Marshal转化失败',
    },
    [ReportErrorCode.ReportJsonUnMarshalError]: {
        description: 'json.UnMarshal转化失败',
    },
    [ReportErrorCode.ReportADUrlError]: {
        description: 'AnyData服务异常，或url地址有误',
    },
    [ReportErrorCode.ReportADDataError]: {
        description: 'AnyData返回的数据有误',
    },
}

// Scene Error
const SceneErrorCode = {
    SceneNotExist: 'BusinessGrooming.SceneAnalysis.SceneNotExist',
    SceneNameRepeatError: 'BusinessGrooming.SceneAnalysis.SceneNameRepeatError',
    SceneDatabaseError: 'BusinessGrooming.SceneAnalysis.SceneDatabaseError',
    FormNotExist: 'BusinessGrooming.SceneAnalysis.FormNotExist',
    InvalidParameter: 'BusinessGrooming.SceneAnalysis.InvalidParameter',
    NodeRepeatError: 'BusinessGrooming.SceneAnalysis.NodeRepeatError',
    InvalidConfig: 'BusinessGrooming.SceneAnalysis.InvalidConfig',
    MetaDataNotFound: 'BusinessGrooming.SceneAnalysis.MetaDataNotFound',
    FormNotProcess: 'BusinessGrooming.SceneAnalysis.FormNotProcess',
    ProcessingTableFieldsNotExists:
        'BusinessGrooming.SceneAnalysis.ProcessingTableFieldsNotExists',
}
const SceneErrorMap = {
    [SceneErrorCode.SceneNotExist]: {
        description: '业务场景不存在',
    },
    [SceneErrorCode.SceneNameRepeatError]: {
        description: '场景名称重复',
    },
    [SceneErrorCode.SceneDatabaseError]: {
        description: '数据库异常',
    },
    [SceneErrorCode.FormNotExist]: {
        description: '业务表不存在',
    },
    [SceneErrorCode.InvalidParameter]: {
        description: '参数校验不通过',
    },
    [SceneErrorCode.NodeRepeatError]: {
        description: '节点重复',
    },
    [SceneErrorCode.InvalidConfig]: {
        description: '无效配置',
    },
    [SceneErrorCode.MetaDataNotFound]: {
        description: '元数据平台未获取到数据源',
    },
    [SceneErrorCode.FormNotProcess]: {
        description: '业务表单未加工',
    },
    [SceneErrorCode.ProcessingTableFieldsNotExists]: {
        description: '加工表字段${field_name}不存在',
    },
}

// Standard Error
const StandardErrorCode = {
    StandardCreateTask: 'BusinessGrooming.Standard.StandardCreatTask',
    StandardUnsupportedUpdate: 'BusinessGrooming.Standard.UnsupportedUpdate',
    StandardInvalidDataAccuracy:
        'BusinessGrooming.Standard.InvalidDataAccuracy',
    StandardDatabaseError: 'BusinessGrooming.Standard.DatabaseError',
    StandardInvalidParameterValue:
        'BusinessGrooming.Standard.InvalidParameterValue',
    StandardInvalidParameter: 'BusinessGrooming.Standard.InvalidParameter',
    StandardInvalidParameterJson:
        'BusinessGrooming.Standard.InvalidParameterJson',
    StandardNameExist: 'BusinessGrooming.Standard.NameExist',
    StandardNameENExist: 'BusinessGrooming.Standard.NameENExist',
    StandardNameBothEmpty: 'BusinessGrooming.Standard.NameBothEmpty',
    StandardDataTypeError: 'BusinessGrooming.Standard.DataTypeError',
    StandardStandardNotExit: 'BusinessGrooming.Standard.StandardNotExist',
    StandardAccuracyError: 'BusinessGrooming.Standard.AccuracyError',
    StandardDataLengthError: 'BusinessGrooming.Standard.DataLengthError',
    StandardStandardIDEmpty: 'BusinessGrooming.Standard.StandardIDEmpty',
    StandardModelingTask: 'BusinessGrooming.Standard.StandardModelingTask',
    StandardUnsupportedTaskType:
        'BusinessGrooming.Standard.UnsupportedTaskType',
    StandardUrlError: 'BusinessGrooming.Standard.UrlError',
    StandardNotExit: 'BusinessGrooming.Standard.StandardNotExit',
}
const StandardErrorMap = {
    [StandardErrorCode.StandardCreateTask]: {
        description: '创建标准任务失败',
    },
    [StandardErrorCode.StandardUnsupportedUpdate]: {
        description: '不支持的更新',
    },
    [StandardErrorCode.StandardInvalidDataAccuracy]: {
        description: '数据精度${data_accuracy}超出范围',
    },
    [StandardErrorCode.StandardDatabaseError]: {
        description: '数据库异常',
    },
    [StandardErrorCode.StandardInvalidParameterValue]: {
        description: '参数${param}校验不通过',
    },
    [StandardErrorCode.StandardInvalidParameter]: {
        description: '参数校验不通过',
    },
    [StandardErrorCode.StandardInvalidParameterJson]: {
        description: '参数值校验不通过：json格式错误',
    },
    [StandardErrorCode.StandardNameExist]: {
        description: '该字段中文名称已存在，请重新输入',
    },
    [StandardErrorCode.StandardNameENExist]: {
        description: '该字段英文名称已存在，请重新输入',
    },
    [StandardErrorCode.StandardNameBothEmpty]: {
        description: '字段中文名称、英文名称不能同时为空',
    },
    [StandardErrorCode.StandardDataTypeError]: {
        description: '数据类型${data_type}不存在',
    },
    [StandardErrorCode.StandardStandardNotExit]: {
        description: '该字段不存在，请检查后刷新重试',
    },
    [StandardErrorCode.StandardAccuracyError]: {
        description:
            '数据精度只有在数据类型为高精度型时生效，且不能大于数据长度',
    },
    [StandardErrorCode.StandardDataLengthError]: {
        description:
            '数据长度只有在数据类型为字符型、高精度型时生效，高精度型数据长度为1~38,字符型数据长度为1~65535',
    },
    [StandardErrorCode.StandardStandardIDEmpty]: {
        description: '无效的standard_id',
    },
    [StandardErrorCode.StandardModelingTask]: {
        description: '业务建模任务无法进行标准化操作',
    },
    [StandardErrorCode.StandardUnsupportedTaskType]: {
        description: '不支持的任务类型',
    },
    [StandardErrorCode.StandardUrlError]: {
        description: '标准化平台服务异常，或url地址有误',
    },
    [StandardErrorCode.StandardNotExit]: {
        description: '该标准不存在，请检查后刷新重试',
    },
}

// User Error
const UserErrorCode = {
    UserDataBaseError: 'BusinessGrooming.User.UserDataBaseError',
    UserIdNotExistError: 'BusinessGrooming.User.UserIdNotExistError',
    UIdNotExistError: 'BusinessGrooming.User.UIdNotExistError',
    UserMgmCallError: 'BusinessGrooming.User.UserMgmCallError',
    AccessTypeNotSupport: 'BusinessGrooming.User.AccessTypeNotSupport',
    UserNotHavePermission: 'BusinessGrooming.User.UserNotHavePermission',
    GetAccessPermissionError: 'BusinessGrooming.User.GetAccessPermissionError',
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
}

// Model Error
const ModelErrorCode = {
    ModelInternalError: 'BusinessGrooming.Model.InternalError',
    ModelInvalidParameter: 'BusinessGrooming.Model.InvalidParameter',
    ModelInvalidParameterValue: 'BusinessGrooming.Model.InvalidParameterValue',
    ModelInvalidParameterJson: 'BusinessGrooming.Model.InvalidParameterJson',
    ModelNameAlreadyExist: 'BusinessGrooming.Model.NameAlreadyExist',
    ModelObjectNameAlreadyExist:
        'BusinessGrooming.Model.ObjectNameAlreadyExist',
    ModelUserNotExist: 'BusinessGrooming.Model.UserNotExist',
    ModelNotExist: 'BusinessGrooming.Model.ModelNotExist',
    BusinessModelNotExist: 'BusinessGrooming.Model.BusinessModelNotExist',
    ModelDomainNotExist: 'BusinessGrooming.Model.DomainNotExist',
    ModelDatabaseError: 'BusinessGrooming.Model.DatabaseError',
    ModelTemplateNameEmpty: 'BusinessGrooming.Model.TemplateNameEmpty',
    ModelCreateFailed: 'BusinessGrooming.Model.CreateFailed',
    ModelUpdateFailed: 'BusinessGrooming.Model.UpdateFailed',
    ModelRequiredFieldEmpty: 'BusinessGrooming.Model.RequiredFieldEmpty',
    ModelDeleteFailed: 'BusinessGrooming.Model.DeleteFailed',
    ModelUnmarshallFailed: 'BusinessGrooming.Model.UnmarshalFailed',
    ModelNameVerifyFailed: 'BusinessGrooming.Model.ModelNameVerifyFailed',
    ModelTemplatesNotExist: 'BusinessGrooming.Model.ModelTemplatesNotExist',
    ModelTaskCenterUrlError: 'BusinessGrooming.Model.TaskCenterUrlError',
    ModelTaskCenterTaskNotFound:
        'BusinessGrooming.Model.TaskCenterTaskNotFoundError',
    ModelTaskCenterProjectNotFound:
        'BusinessGrooming.Model.TaskCenterProjectNotFoundError',
    ModelTaskCenterDataError: 'BusinessGrooming.Model.TaskCenterDataError',
    ModelTaskCenterCallError: 'BusinessGrooming.Model.TaskCenterCallError',
    ModelADUrlError: 'BusinessGrooming.Model.ADUrlError',
    ModelADDataError: 'BusinessGrooming.Model.ADDataError',
    ModelProjectCantModifyError:
        'BusinessGrooming.Model.ProjectCantModifyError',
    ModelCCUrlError: 'BusinessGrooming.Model.ConfigCenterUrlError',
    ModelCCDataError: 'BusinessGrooming.Model.ConfigCenterDataError',
    ModelTaskCantModifyError: 'BusinessGrooming.Model.TaskCantModifyError',
    ModelTaskCantModifyError2: 'BusinessGrooming.Model.TaskCantModifyError2',
    OtherTaskCantModifyError: 'BusinessGrooming.Model.OtherTaskCantModifyError',
    ModelTaskCantModifyError3: 'BusinessGrooming.Model.TaskCantModifyError3',
    ModelTaskCantModifyError4: 'BusinessGrooming.Model.TaskCantModifyError4',
    ModelTaskCantModifyError5: 'BusinessGrooming.Model.TaskCantModifyError5',
    ModelTaskCantModifyError6: 'BusinessGrooming.Model.TaskCantModifyError6',
    ModelTaskCantModifyError7: 'BusinessGrooming.Model.TaskCantModifyError7',
    ModelTaskCantModifyError8: 'BusinessGrooming.Model.TaskCantModifyError8',
    ModelResourceCantModifyError:
        'BusinessGrooming.Model.ModelResourceCantModifyError',
    ModelConfigurationCenterUrlError:
        'BusinessGrooming.Model.ConfigurationCenterUrlError',
    ModelMainBusinessNotFound: 'BusinessGrooming.Model.MainBusinessNotFound',
    ModelJsonMarshalError: 'BusinessGrooming.Model.JsonMarshalError',
    ModelJsonUnMarshalError: 'BusinessGrooming.Model.JsonUnMarshalError',
    ModelTaskCantModifyBusinessDomainError:
        'BusinessGrooming.Model.TaskCantModifyBusinessDomainError',
    ModelBusinessSystemError: 'BusinessGrooming.Model.BusinessSystemError',
    ModelBusinessMattersError: 'BusinessGrooming.Model.BusinessMatterError',
    ModelModifyDepartmentError: 'BusinessGrooming.Model.ModifyDepartmentError',
    ModelCreateMessageSendError:
        'BusinessGrooming.Model.CreateMessageSendError',
    ModelModifyMessageSendError:
        'BusinessGrooming.Model.ModifyMessageSendError',
    ModelDeleteMessageSendError:
        'BusinessGrooming.Model.DeleteMessageSendError',
    ModelDepartmentNotFound: 'BusinessGrooming.Model.DepartmentNotFound',
    ModelDepartmentError: 'BusinessGrooming.Model.DepartmentError',
    ModelQueryError: 'BusinessGrooming.Model.QueryError',
    ModelMainBusinessOnlyOneError:
        'BusinessGrooming.Model.MainBusinessOnlyOneError',
    ModelTaskTypeForbiddenModifyError:
        'BusinessGrooming.Model.TaskTypeForbiddenModifyError',
    ModelTaskTypeForbiddenModifyError2:
        'BusinessGrooming.Model.TaskTypeForbiddenModifyError2',
}
const ModelErrorMap = {
    [ModelErrorCode.ModelInternalError]: {
        description: 'internal error',
    },
    [ModelErrorCode.ModelInvalidParameter]: {
        description: '参数值校验不通过',
    },
    [ModelErrorCode.ModelInvalidParameterValue]: {
        description: '参数${param}校验不通过',
    },
    [ModelErrorCode.ModelInvalidParameterJson]: {
        description: '参数值校验不通过：json格式错误',
    },
    [ModelErrorCode.ModelNameAlreadyExist]: {
        description: '业务领域下该主干业务名称已存在，请重新输入',
    },
    [ModelErrorCode.ModelObjectNameAlreadyExist]: {
        description: '同一组织架构下该主干业务名称已存在，请重新输入',
    },
    [ModelErrorCode.ModelUserNotExist]: {
        description: '用户${user}不存在',
    },
    [ModelErrorCode.ModelNotExist]: {
        description: '该主干业务不存在，请刷新页面',
    },
    [ModelErrorCode.BusinessModelNotExist]: {
        description: '业务模型不存在',
    },
    [ModelErrorCode.ModelDomainNotExist]: {
        description: '该主题域不存在，请刷新页面',
    },
    [ModelErrorCode.ModelDatabaseError]: {
        description: '数据库异常',
    },
    [ModelErrorCode.ModelTemplateNameEmpty]: {
        description: '模板名为空',
    },
    [ModelErrorCode.ModelCreateFailed]: {
        description: '主干业务创建失败',
    },
    [ModelErrorCode.ModelUpdateFailed]: {
        description: '主干业务更新失败',
    },
    [ModelErrorCode.ModelRequiredFieldEmpty]: {
        description: '必填项为空',
    },
    [ModelErrorCode.ModelDeleteFailed]: {
        description: '主干业务删除失败',
    },
    [ModelErrorCode.ModelUnmarshallFailed]: {
        description: '主干业务详情获取失败',
    },
    [ModelErrorCode.ModelNameVerifyFailed]: {
        description:
            '主干业务名称长度最多128字符，仅支持中英文、数字、下划线及中划线',
    },
    [ModelErrorCode.ModelTemplatesNotExist]: {
        description: '模板名称不存在',
    },
    [ModelErrorCode.ModelTaskCenterUrlError]: {
        description: '任务中心服务异常，或url地址有误',
    },
    [ModelErrorCode.ModelTaskCenterTaskNotFound]: {
        description: '该任务不存在',
    },
    [ModelErrorCode.ModelTaskCenterProjectNotFound]: {
        description: '该项目不存在',
    },
    [ModelErrorCode.ModelTaskCenterDataError]: {
        description: '任务中心返回的数据有误',
    },
    [ModelErrorCode.ModelTaskCenterCallError]: {
        description: '任务中心请求错误',
    },
    [ModelErrorCode.ModelADUrlError]: {
        description: 'AnyData服务异常，或url地址有误',
    },
    [ModelErrorCode.ModelADDataError]: {
        description: 'AnyData返回的数据有误',
    },
    [ModelErrorCode.ModelProjectCantModifyError]: {
        description: '项目未开始或已完成，无法新建、删除、修改资源',
    },
    [ModelErrorCode.ModelCCUrlError]: {
        description: '配置中心服务异常，或url地址有误',
    },
    [ModelErrorCode.ModelCCDataError]: {
        description: '配置中心返回的数据有误',
    },
    [ModelErrorCode.ModelTaskCantModifyError]: {
        description: '任务未开始或已完成，无法新建、删除、修改资源',
    },
    [ModelErrorCode.ModelTaskCantModifyError2]: {
        description: '无法新建、删除、修改其他项目的资源',
    },
    [ModelErrorCode.OtherTaskCantModifyError]: {
        description: '其他类型任务无法新建、删除、修改指标',
    },
    [ModelErrorCode.ModelTaskCantModifyError3]: {
        description: '任务中，无法新建、删除、修改已发布资源',
    },
    [ModelErrorCode.ModelTaskCantModifyError4]: {
        description: '该建模任务，无法修改、删除其他主题域的模型',
    },
    [ModelErrorCode.ModelTaskCantModifyError5]: {
        description: '非建模任务，无法新建、修改、删除业务模型',
    },
    [ModelErrorCode.ModelTaskCantModifyError6]: {
        description: '非新建主干业务任务，无法新建、修改、删除主干业务',
    },
    [ModelErrorCode.ModelTaskCantModifyError7]: {
        description: '任务缺少执行人，无法新建、修改、删除任务内数据',
    },
    [ModelErrorCode.ModelTaskCantModifyError8]: {
        description: '任务不可执行，无法新建、修改、删除任务内数据',
    },
    [ModelErrorCode.ModelResourceCantModifyError]: {
        description: '业务治理模块，无法新建、删除、修改未发布资源',
    },
    [ModelErrorCode.ModelConfigurationCenterUrlError]: {
        description: '配置中心服务异常，或url地址有误',
    },
    [ModelErrorCode.ModelMainBusinessNotFound]: {
        description: '该主干业务不存在，请刷新页面',
    },
    [ModelErrorCode.ModelJsonMarshalError]: {
        description: 'json.Marshal转化失败',
    },
    [ModelErrorCode.ModelJsonUnMarshalError]: {
        description: 'json.UnMarshal转化失败',
    },
    [ModelErrorCode.ModelTaskCantModifyBusinessDomainError]: {
        description: '该建模任务，无法修改主干业务所属主题',
    },
    [ModelErrorCode.ModelBusinessSystemError]: {
        description: '信息系统最多添加99个',
    },
    [ModelErrorCode.ModelBusinessMattersError]: {
        description: '来源业务事项最多添加6个',
    },
    [ModelErrorCode.ModelModifyDepartmentError]: {
        description: '主干业务不支持修改所属部门',
    },
    [ModelErrorCode.ModelCreateMessageSendError]: {
        description: '新建主干业务消息发送失败',
    },
    [ModelErrorCode.ModelModifyMessageSendError]: {
        description: '修改主干业务消息发送失败',
    },
    [ModelErrorCode.ModelDeleteMessageSendError]: {
        description: '删除主干业务消息发送失败',
    },
    [ModelErrorCode.ModelDepartmentNotFound]: {
        description: '部门或组织不存在',
    },
    [ModelErrorCode.ModelDepartmentError]: {
        description: '所属部门只能为部门或者组织',
    },
    [ModelErrorCode.ModelQueryError]: {
        description: '所属部门或所属主题不能都为空',
    },
    [ModelErrorCode.ModelMainBusinessOnlyOneError]: {
        description: '独立任务和项目中只能建一个主干业务',
    },
    [ModelErrorCode.ModelTaskTypeForbiddenModifyError]: {
        description: '非${taskType}，无法新建、修改、删除${module}',
    },
    [ModelErrorCode.ModelTaskTypeForbiddenModifyError2]: {
        description: '任务类型不匹配，无法新建、修改、删除',
    },
}

export const BusinessGroomingCodeMessage = combineToKV(
    AuthorityErrorMap,
    DomainErrorMap,
    DataProcessErrorMap,
    DrivenErrorMap,
    ExcelErrorMap,
    FlowchartErrorMap,
    FormErrorMap,
    GlossaryErrorMap,
    IndicatorErrorMap,
    IndicatorModelErrorMap,
    ReportErrorMap,
    SceneErrorMap,
    StandardErrorMap,
    UserErrorMap,
    ModelErrorMap,
)
