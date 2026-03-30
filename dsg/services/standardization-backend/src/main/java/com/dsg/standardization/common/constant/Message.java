package com.dsg.standardization.common.constant;

public class Message {

    public final static String MESSAGE_INPUT_NOT_EMPTY = "输入不能为空";

    public final static String MESSAGE_CHINESE_NUMBER_UNDERLINE_BAR_128 = "长度不能超过128，仅支持中英文、数字、下划线、中划线，且不能以下划线和中划线开头";
    public final static String MESSAGE_128 = "长度不能超过128";
    public final static String MESSAGE_255 = "长度不能超过255";
    public final static String MESSAGE_ENGLISH_NUMBER_UNDERLINE_BAR_128 = "长度不能超过128，仅支持英文、数字、下划线、中划线，且不能以下划线和中划线开头";

//    public final static String MESSAGE_ENGLISH_NUMBER_UNDERLINE_BAR_64 = "长度不能超过64，仅支持英文、数字、下划线、中划线、加号、点和星号，且不能以下划线和中划线开头";
public final static String MESSAGE_ENGLISH_NUMBER_UNDERLINE_BAR_64 = "长度不能超过64";

    public final static String MESSAGE_LENGTH_MAX_CAHR_200 = "长度不能超过200";

    public final static String MESSAGE_PARAM_ERROR_SOLUTION = "请使用请求参数构造规范化的请求字符串。详细信息参见产品 API 文档。";

    public final static String MESSAGE_DATANOTEXIST_ERROR_SOLUTION = "请检查参数是否正确或对应数据是否存在。详细信息参见产品 API 文档。";

    public final static String MESSAGE_PATHVARIABLE_ERROR_SOLUTION = "请使用正确的占位符参数构造URL。详细信息参见产品 API 文档。";

    public final static String MESSAGE_MaxUploadSizeExceededException = "上传的文件大小超出了有效值。详细信息参见产品 API 文档。";

    public final static String MESSAGE_MultipartException = "未上传文件或上传文件异常。详细信息参见产品 API 文档。";

    public final static String MESSAGE_EXPORT_SOLUTION = "请重新尝试导出。详细信息参见产品 API 文档。";

    public final static String MESSAGE_DATABASE_ERROR_SOLUTION = "请检查数据库数据。详细信息参见产品 API 文档。";

    public final static String MESSAGE_ANYSHARE_ERROR_SOLUTION = "请检查提交参数或检查Anyshare文件系统。详细信息参见产品 API 文档。";

    public final static String MESSAGE_Duplicated_SOLUTION = "数据重复，请检查数据或重试";

    public final static String MESSAGE_DataOperation_ERROR_SOLUTION = "数据操作异常，请检查数据或重试";

    public final static String MESSAGE_ORGTYPE_ERROR_SOLUTION = "标准分类不是有效枚举值";

    public final static String MESSAGE_ORGTYPE_EMPTY_ERROR_SOLUTION = "标准分类不能为空";

    public final static String MESSAGE_FILESTATUES_ERROR_SOLUTION = "标准文件状态不是有效枚举值";

    public final static String MESSAGE_ACTDATE_ERROR_SOLUTION = "发布时间不是有效枚举值";

    public final static String MESSAGE_FILEBEGINUPLOAD_ERROR = "标准文件管理-开始上传文件失败";

    public final static String MESSAGE_FILEEMPTY_ERROR = "文件大小不能为空";

    public final static String MESSAGE_FILESIZEOVERMIN_ERROR = "文件大小不能小于等于0";

    public final static String MESSAGE_FILESIZEOVERMAX_ERROR = "文件大小不能超过10M";

    public final static String MESSAGE_LENG255_ERROR = "格式错误，长度不能大于255";

    public final static String MESSAGE_SUFFIXFILE_ERROR = "格式错误，只能以.doc，.docx或.pdf结尾";

    public final static String SYSTEM_BUSY_ERROR = "系统繁忙,请稍后重试";

    public static final String MESSAGE_LENGTH_MAX_CHAR_100 = "长度不能超过100";

    public static final String MESSAGE_LENGTH_MAX_CHAR_128 = "长度不能超过128";

    public static final String MESSAGE_NOT_BASE64_ENCODE = "不符合BASE64编码规范";

    public static final String MESSAGE_LENGTH_MAX_CHAR_255 = "长度不能超过255";

    public static final String MESSAGE_VALUE_BETWEEN_1_AND_2 = "只能为1或2";

    public static final String MESSAGE_POSITIVE_INTEGER = "只能为正整数";

    public static final String MESSAGE_POSITIVE_INTEGER_1000 = "只能为不超过1000的正整数";

    public static final String MESSAGE_VALUE_NO_VALID = "不是有效值";

    public final static String MESSAGE_BUSINESS_TABLE_MODEL_ID = "businessTableModelId,格式为36位UUID";

    public final static String MESSAGE_BUSINESS_TABLE_ID = "businessTableId,格式为36位UUID";

    public final static String MESSAGE_BUSINESS_TABLE_FIELD_ID = "businessTableFieldId,格式为36位UUID";

    public final static String MESSAGE_BUSINESS_TASK_ID = "TASK_ID ,格式为36位UUID";

    public final static String MESSAGE_BUSINESS_ID = "格式为19位正整数";

}
