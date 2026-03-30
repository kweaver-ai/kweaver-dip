package com.dsg.standardization.common.util;

import org.apache.commons.lang3.EnumUtils;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Predicate;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.common.util
 * @Date: 2022/11/23 14:37
 */

public class EnumUtil {
    private static Map<Class, Object> map = new ConcurrentHashMap<>();
    /**
     * 根据条件获取枚举对象
     *
     * @param className 枚举类
     * @param predicate 筛选条件
     * @param <T>
     * @return
     */
    public static <T> Optional<T> getEnumObject(Class<T> className, Predicate<T> predicate) {
        if (!className.isEnum()) {
            return null;
        }
        Object obj = map.get(className);
        T[] ts;
        if (obj == null) {
            ts = className.getEnumConstants();
            map.put(className, ts);
        } else {
            ts = (T[]) obj;
        }
        return Arrays.stream(ts).filter(predicate).findFirst();
    }

    /**
     * 判断某个枚举是否包某个message值
     * @param enumClass 需要判断是否存在那个枚举类中
     * @param message 需要判断的值
     * @return 包含返回true，否则返回false
     */
    public static boolean isIncludeMessage(Class enumClass, String message){
        List enumList = EnumUtils.getEnumList(enumClass);
        for (int i = 0;i<enumList.size(); i++){
            Object en = enumList.get(i);
            Class<?> enClass = en.getClass();
            try {
                Method method = enClass.getMethod("getMessage"); // 需要与枚举类方法对应
                Object invoke = method.invoke(en, null);
                if(invoke.toString().equals(message)) {
                    return true;
                }
            }catch (Exception e){
                e.printStackTrace();
            }
        }
        return false;
    }

    /**
     * 判断某个枚举是否包某个code值
     * @param enumClass 需要判断是否存在那个枚举类中
     * @param code 需要判断的值
     * @return 包含返回true，否则返回false
     */
    public static boolean isIncludeCode(Class enumClass, String code){
        List enumList = EnumUtils.getEnumList(enumClass);
        for (int i = 0;i<enumList.size(); i++){
            Object en = enumList.get(i);
            Class<?> enClass = en.getClass();
            try {
                Method method = enClass.getMethod("getCode"); // 需要与枚举类方法对应
                Object invoke = method.invoke(en, null);
                if(invoke.toString().equals(code)) {
                    return true;
                }
            }catch (Exception e){
                e.printStackTrace();
            }
        }
        return false;
    }

    /**
     * 判断某个枚举是否包某个Integer的code值
     * @param enumClass 需要判断是否存在那个枚举类中
     * @param code 需要判断的值
     * @return 包含返回true，否则返回false
     */
    public static boolean isIncludeCode(Class enumClass, Integer code){
        List enumList = EnumUtils.getEnumList(enumClass);
        for (int i = 0;i<enumList.size(); i++){
            Object en = enumList.get(i);
            Class<?> enClass = en.getClass();
            try {
                Method method = enClass.getMethod("getCode"); // 需要与枚举类方法对应
                Object invoke = method.invoke(en, null);
                if(ConvertUtil.toInt(invoke.toString()).equals(code)) {
                    return true;
                }
            }catch (Exception e){
                e.printStackTrace();
            }
        }
        return false;
    }
}