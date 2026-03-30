package com.dsg.standardization.common.util;

import org.apache.commons.lang3.StringUtils;

import java.util.List;
import java.util.TreeSet;
import java.util.stream.Collectors;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.common.util
 * @Date: 2022/11/25 14:16
 */
public class StringUtil {
    /**
     * 根据传入字符切割字符串，去除首字符
     */
    public static TreeSet<String> splitTrimByRegex(String origin, String regex){
        if(StringUtils.isBlank(origin)){
            return  null;
        } else{
            String[] splits = origin.split(regex);
            TreeSet<String> result = new TreeSet<>();
            for(String split : splits){
                result.add(StringUtils.trim(split));
            }
            return result;
        }
    }

    /**
     * 根据传入字符切割字符串，去除首字符，转换为Long型数字列表
     * @param nums
     * @param regex
     * @return
     */
    public static List<Long> splitNumByRegex(String nums, String regex){
        if(StringUtils.isBlank(nums)){
            return null;
        }
        if(StringUtils.isBlank(regex)){
            return null;
        }
        TreeSet<String> idSet=StringUtil.splitTrimByRegex(nums,regex);
        if(CustomUtil.isNotEmpty(idSet)){
            return idSet.stream().map(id->ConvertUtil.toLong(id)).collect(Collectors.toList());
        }
        return null;
    }

    public static boolean isOverLength(String value, Integer lenth){
        if(!StringUtils.isEmpty(value) && value.length() > lenth){
            return true;
        }
        return false;
    }

    public static String escapeSqlSpecialChars(String str){
        if(StringUtils.isNotBlank(str)){
            str= str.replaceAll("\\\\", "\\\\\\\\");
            str= str.replaceAll("_", "\\\\_");
            str= str.replaceAll("%", "\\\\%");
        }
        return str;
    }
    public static String XssEscape(String value){
        if (StringUtils.isBlank(value)){
            return value;
        }
        return value.trim().replaceAll("<","&lt;").replaceAll(">","&gt;")
                .replaceAll("select","查询").replaceAll("SELECT","查询")
                .replaceAll("DROP","删除表").replaceAll("drop","删除表")
                .replaceAll("DELETE","删除数据").replaceAll("delete","删除数据")
                .replaceAll("UPDATE","更新").replaceAll("update","更新")
                .replaceAll("INSERT","插入").replaceAll("insert","插入")
                .replaceAll("ALTER","修改结构").replaceAll("alter","修改结构")
                .replaceAll("CREATE","创建").replaceAll("create","创建");
    }

    /**
     * 截取路径中最后一层值
     * @param value
     * @return
     */
    public static String PathSplitAfter(String value){
        if (StringUtils.isBlank(value)){
            return value;
        }
        String[] splitArr =  value.split("/");
        return splitArr[splitArr.length - 1];
    }
}
