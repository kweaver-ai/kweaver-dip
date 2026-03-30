package com.dsg.standardization.common.constant;

public class Constants {

    /**
     * LONG 序列化和反序列化界限值，超过该值转为字符串，否则保留数组类型
     */
    public static final long FRONT_MAX_LONG_VALUE = 9999999999999999L;

    /**
     * 128位中文、字母、数字、下划线、中划线
     */
    public final static String REGEX_ENGLISH_CHINESE_UNDERLINE_BAR_128 = "^(?!_)(?!-)[a-zA-Z0-9\\u4e00-\\u9fa5,_,-]{0,128}$";

    public final static String REGEX_LENGTH_128 = "^.{0,128}$";
    public final static String REGEX_LENGTH_255 = "^.{0,255}$";
    /**
     * 128位字母、数字、-,_字符校验表达式
     */
    public final static String REGEX_ENGLISH_UNDERLINE_BAR_128 = "^(?!_)(?!-)[a-zA-Z0-9,_,\\-]{0,128}$";

    /**
     * 去除前后空格
     */
    public final static String REGEX_NO_SPACE = "^\\s+|\\s+$";

    /**
     * 64位字符匹配字母、数字、逗号、下划线、连字符、加号、点和星号校验表达式
     */
//    public final static String REGEX_ENGLISH_UNDERLINE_BAR_64 = "^(?!_)(?!-)[a-zA-Z0-9,_,\\-]{0,64}$";
//    public final static String REGEX_ENGLISH_UNDERLINE_BAR_64 = "^(?!_)(?!-)[a-zA-Z0-9, _\\-+.*]{0,64}$";
    public final static String REGEX_ENGLISH_UNDERLINE_BAR_64 = "^.{0,64}$";
    /**
     * 64位整数
     */
    public final static String REGEX_INTTEGER_64 = "^(-?[0-9]{1,64})$";


    /**
     * 版本号规则校验正则
     */
    public final static String REGEX_VERSION_NAME_RULE = "^[V][0-9]{1,4}$";

    /**
     * 版本号规则开头首字母
     */
    public final static String REGEX_VERSION_NAME_RULE_PREFIX = "V";


    /**
     * 标准文件名字校验正则表达式
     */
    public final static String REGEX_STD_FILE_NAME_255 = "^[!-~a-zA-Z0-9_\\u4e00-\\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\\\s]{0,255}$";

    /**
     * 标准文件编号校验正则表达式
     */
    public final static String REGEX_STD_FILE_CODE_255 = "^[!-~a-zA-Z0-9_\\u4e00-\\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\\\s]{0,255}$";

    public final static String REGEX_STD_FILE_CODE_200 = "^[!-~a-zA-Z0-9_\\u4e00-\\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\\\s]{0,200}$";

    public final static String REGEX_LENLIMIT_200 = "^.{0,200}$";
    /**
     * 标准文件名称校验正则表达式，仅支持docx，doc，pdf结尾的文件名称
     */
    public final static String REGEX_STD_FILE_MATCH = "^($|\\s|.*(\\.docx|\\.doc|\\.pdf|\\.txt|\\.xlsx|\\.xls|\\.ppt|\\.pptx))$";

    public final static String REGEX_STD_FILE_PATH_MATCH = "^($|\\s|(http://|https://).*)$";

    /**
     * 截取匹配.docx，.doc，.pdf
     */
    public final static String REGEX_STD_FILE_SUFFIX = "(\\.docx|\\.doc|\\.pdf|\\.txt|\\.xlsx|\\.xls|\\.ppt|\\.pptx)$";

    public final static String REGEX_STD_FILE_QUOTE_SUFFIX = "\\([0-9]*\\)$";

    public final static int STD_FILE_RENAME_TRY = 20;

    /**
     * 服务名称
     */
    public final static String SERVICE_NAME = "Standardization";

    public final static int FILE_UPLOAD_LIMIT_SIZE = 30;


    public final static int EXCEL_TITLE_ROW_COUNT = 2;


    /**
     * http header里面携带token的key
     */
    public final static String HTTP_HEADER_TOKEN_KEY = "Authorization";


    public static final String PARAMETER_OFFSET = "offset";
    public static final String PARAMETER_LIMIT = "limit";
    public static final String PARAMETER_SORT = "sort";
    public static final String PARAMETER_SORT_CREATE_TIME = "create_time";
    public static final String PARAMETER_SORT_UPDATE_TIME = "update_time";
    public static final String PARAMETER_DIRECTION = "direction";
    public static final String PARAMETER_DIRECTION_ASC = "asc";
    public static final String PARAMETER_DIRECTION_DESC = "desc";

    /**
     * 可变长度中文字符、-,_字符校验表达式,-_不能作为开头字符
     *
     * @param min
     * @param max
     * @return
     */
    public static String getRegexCNOrNumVarL(Integer min, Integer max) {
        StringBuilder regexBuilder = new StringBuilder();
        regexBuilder.append("^(?!_)(?!-)[0-9\\u4E00-\\u9FA5\\uF900-\\uFA2D_-]{");
        regexBuilder.append(min);
        regexBuilder.append(',');
        regexBuilder.append(max);
        regexBuilder.append("}$");
        return regexBuilder.toString();
    }


    /**
     * 可变长度字母、数字、符号-_字符校验表达式,-_不能作为开头字符
     *
     * @param min
     * @param max
     * @return
     */

    public static String getRegexENOrNumVarL(Integer min, Integer max) {
        StringBuilder regexBuilder = new StringBuilder();
        regexBuilder.append("^(?!_)(?!-)[a-zA-Z0-9,_-]{");
        regexBuilder.append(min);
        regexBuilder.append(',');
        regexBuilder.append(max);
        regexBuilder.append("}$");
        return regexBuilder.toString();
    }

    /**
     * 可变长度汉字、字母、数字、-_字符校验表达式
     *
     * @param min
     * @param max
     * @return
     */
    public static String getRegexNumVarL(Integer min, Integer max) {
        StringBuilder regexBuilder = new StringBuilder();
        regexBuilder.append("^[0-9,]{");
        regexBuilder.append(min);
        regexBuilder.append(',');
        regexBuilder.append(max);
        regexBuilder.append("}$");
        return regexBuilder.toString();
    }


    /**
     * 可变长度数字,字符、汉字、英文校验表达式
     *
     * @param min
     * @param max
     * @return
     */
    public static String getRegexENOrCNVarL(Integer min, Integer max) {
        StringBuilder regexBuilder = new StringBuilder();
        regexBuilder.append("^(?!_)(?!-)[\\u4E00-\\u9FA5\\uF900-\\uFA2D\\w-]{");
        regexBuilder.append(min);
        regexBuilder.append(',');
        regexBuilder.append(max);
        regexBuilder.append("}$");
        return regexBuilder.toString();
    }

    /**
     * ,可变长度数字英文、中文、字符{_-,}校验表达式,字符不能开头
     *
     * @param min
     * @param max
     * @return
     */
    public static String getRegexENOrCNWithComma(Integer min, Integer max) {
        StringBuilder regexBuilder = new StringBuilder();
        regexBuilder.append("^(?!_)(?!-)(?!,)[\\u4E00-\\u9FA5\\uF900-\\uFA2D\\w,-]{");
        regexBuilder.append(min);
        regexBuilder.append(',');
        regexBuilder.append(max);
        regexBuilder.append("}$");
        return regexBuilder.toString();
    }

}
