package com.dsg.standardization.common.constant;

/**
 * redis通用常量信息
 * 
 */
public class RedisConstants {

    private  RedisConstants() {}
    /**
     * 数据源缓存 前缀
     */
    public static final String STANDARDIZATION_DATAELEMENT_PREFIX = "standardization:dataelement:";


    /**
     * 码表缓存 前缀
     */
    public static final String STANDARDIZATION_DICT_PREFIX = "standardization:dict:";


    /**
     * 编码规则缓存 前缀
     */
    public static final String STANDARDIZATION_RULE_PREFIX = "standardization:rule:";

    public static final String DEPT_USERID_LIST_PREFIX = "dept:userId:list:";
}
