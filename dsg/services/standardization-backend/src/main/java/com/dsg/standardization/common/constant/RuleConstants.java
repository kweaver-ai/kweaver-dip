package com.dsg.standardization.common.constant;


import java.util.HashSet;
import java.util.Set;

/**
 * 作者: Jie.xu
 * 创建时间：2023/11/16 16:14
 * 功能描述：
 */
public class RuleConstants {

    public static final Set<String> CUSTOM_DATE_FORMAT = new HashSet<>();

    static {
        CUSTOM_DATE_FORMAT.add("yyyyMMdd");
        CUSTOM_DATE_FORMAT.add("yyyy/MM/dd");
        CUSTOM_DATE_FORMAT.add("yyyy-MM-dd");
        CUSTOM_DATE_FORMAT.add("yyyyMMddHHmmss");
        CUSTOM_DATE_FORMAT.add("yyyy-MM-dd HH:mm:ss");
        CUSTOM_DATE_FORMAT.add("yyyy/MM/dd HH:mm:ss");
    }

}
