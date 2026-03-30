package com.dsg.standardization.common.enums;


import com.dsg.standardization.common.util.CustomUtil;
import lombok.Getter;

/**
 * 自定义错误码
 */
@Getter
public enum ErrorCodeEnum implements BaseErrorInfoInterface {
    //非标准
    SUCCESS("0", "成功", false),

    PARTAIL_IMPORT_SUCCESS("PartailImportSuccess", "部分导入成功"),
    PARTAIL_FAILURE("ImportError", "PartailFailure", "导入失败"),
    PARAMETER_EMPTY("RequestError", "Empty", "参数不能为空"),
    PARAMETER_FORMAT_INCORRECT("RequestError", "FormatIncorrect", "参数格式不正确"),
    DATA_NOT_EXIST("ResourceError", "DataNotExist", "数据不存在"),

    DATA_EXIST("ResourceError", "DataExist", "数据已存在"),
    //标准
    AbnormalStatus("AbnormalStatus", "", false),
    AuthenticationError("AuthenticationError", "您的帐户尚未通过实名认证，请先实名认证后再进行操作"),
    NotAuthenticationError("Public.NotAuthentication", "无用户登录信息"),
    CountExceeded("CountExceeded", ""),
    DataSource("DataSource", ""),
    DependencyViolation("DependencyViolation", "主信息:资源依赖而导致操作失败"),
    DoesNotMatch("DoesNotMatch", ""),
    Duplicated("Duplicated", "唯一索引引发异常"),
    Empty("Empty", "不能为空"),
    Exceeded("Exceeded", ""),
    Forbidden("Forbidden", ""),
    Incorrect("Incorrect", "主信息:无法执行该操作"),
    IncompleteSignature("IncompleteSignature", ""),
    InternalError("InternalError", "系统内部错误"),
    Insufficient("Insufficient", "主信息:资源不足"),
    Invalid("Invalid", "主信息:无效访问"),
    InvalidAccountStatus("InvalidAccountStatus", "主信息:账户鉴权错误"),
    InvalidParameter("InvalidParameter", "参数值校验不通过"),
    MissingParameter("MissingParameter", "主信息:必填参数丢失"),
    NoAccessKey("NoAccessKey", ""),
    NoPermission("NoPermission", "主信息:没有权限访问"),
    NotExist("NotExist", ""),
    NotFound("NotFound", "主信息:访问的资源不存在"),
    NotReady("NotReady", "主信息:访问的服务不存在"),
    OperationConflict("OperationConflict", "主信息:冲突的操作"),
    OperationDenied("OperationDenied", "主信息:被拒绝的操"),
    OutOfRange("OutOfRange", "主信息:超出范围"),
    Quota("Quota", "", false),
    OperationFailed("OperationFailed", ""),
    QuotaExceed("QuotaExceed", "主信息:租户资源配额不足"),
    SignatureDoesNotMatch("SignatureDoesNotMatch", ""),
    Success("Success", "成功", false),
    TaskUnfinished("TaskUnfinished", ""),
    Unavailable("Unavailable", ""),
    Unsupported("Unsupported", ""),
    Upgrade("UpgradeError", "升级相关错误"),
    UnKnowException("InternalError", "UnKnowException", "系统内部错误"),
    RemoteServiceAcccessFailed("InternalError", "RemoteServiceAcccessFailed", "远程服务访问失败"),
    FileUploadFailed("InternalError", "FileUploadFailed", "文件上传失败"),
    FileDownloadFailed("InternalError", "FileDownloadFailed", "文件下载失败"),
    RuntimeException("InternalError", "RuntimeException", "系统内部错误"),
    NoHandlerFoundException("RequestError", "NoHandlerFoundException", "接口未找到"),
    HttpRequestMethodNotSupportedException("RequestError", "HttpRequestMethodNotSupportedException", "接口请求方式不支持"),
    MethodArgumentTypeMismatchException("RequestError", "MethodArgumentTypeMismatchException", "参数值校验不通过"),
    CatalogServiceError("CatalogServiceError", "目录模块服务异常"),
    DataElementServiceError("DataElementServiceError", "数据元模块服务异常"),
    RuleServiceError("RuleServiceError", "编码规则模块服务异常"),
    DictServiceError("DictServiceError", "码表模块服务异常"),
    ExcelExportError("ExcelExportError", "excel导出失败"),
    ExcelImportError("ExcelImportError", "excel导入失败"),
    AnyShareException("AnyShareError", "anyshare文件服务异常"),
    DeadlockException("DeadlockError", "数据表死锁异常"),
    DataDuplicated("DataDuplicated", "数据重复"),

    SystemBusy("SystemBusy", "系统繁忙,请稍后重试"),

    ResourceNameDuplicated("DataDuplicated", "ResourceNameConflicted", "资源名称冲突"),
    ResourceNotExisted("ResourceNotExisted", "资源不存在"),
    ParentResourceNotExisted("ResourceNotExisted", "ParentResourceNotExisted", "父级资源不存在"),
    TargetParentResourceNotExisted("ResourceNotExisted", "TargetParentResourceNotExisted", "目标父级资源不存在"),
    PartialFailure("PartialFailure", "成功%d条失败%d条"),
    DeleteNotAllowed("DeleteNotAllowed", "资源不可删除"),
    DeleteFailed("DeleteFailed", "资源删除失败"),
    DateFormatFailed("DateFormatFailed", "时间格式化失败"),
    DataElementCheckError("DataElementCheckError", "数据元检查异常");

    /**
     * 错误码
     */
    private String errorCode;

    /**
     * 错误码
     */
    private String subErrorCode;

    /**
     * 错误描述
     */
    private String errorMsg;

    private boolean buildErrorCode;

    private ErrorCodeEnum(String errorCode, String errorMsg) {
        this.errorCode = errorCode;
        this.errorMsg = errorMsg;
        this.subErrorCode = "";
        this.buildErrorCode = true;
    }

    private ErrorCodeEnum(String errorCode, String errorMsg, boolean buildErrorCode) {
        this.errorCode = errorCode;
        this.errorMsg = errorMsg;
        this.subErrorCode = "";
        this.buildErrorCode = buildErrorCode;
    }

    private ErrorCodeEnum(String errorCode, String subErrorCode, String errorMsg) {
        this.errorCode = errorCode;
        this.errorMsg = errorMsg;
        this.subErrorCode = subErrorCode;
        this.buildErrorCode = true;
    }

    private ErrorCodeEnum(String errorCode, String subErrorCode, String errorMsg, boolean buildErrorCode) {
        this.errorCode = errorCode;
        this.errorMsg = errorMsg;
        this.subErrorCode = subErrorCode;
        this.buildErrorCode = buildErrorCode;
    }

    //重写父接口的抽象方法，返回错误码
    @Override
    public String getErrorCode() {
        if (buildErrorCode) {
            return CustomUtil.buildErrorCode(errorCode, subErrorCode);
        } else {
            return errorCode;
        }
    }

    //重写父接口的抽象方法，返回错误信息
    @Override
    public String getErrorMsg() {
        return errorMsg;
    }

    public static <T> String getFullErrorCode(Class<T> clazz, String methodName, String errorCode) {
        StringBuilder errCodeBuilder = new StringBuilder();
        errCodeBuilder.append(clazz.getName()).append(";").append(methodName).append(";").append("错误码集合:{").append(errorCode).append("}");
        return errCodeBuilder.toString();
    }


}
