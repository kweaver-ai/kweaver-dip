package com.dsg.standardization.common.util;


import com.dsg.standardization.common.enums.ErrorCodeEnum;
import com.dsg.standardization.common.exception.CustomException;
import lombok.extern.slf4j.Slf4j;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * java反射工具类
 */
@Slf4j
public class ReflectUtil {


//    private final static Logger logger = LoggerFactory.getLogger(ReflectUtil.class);

    /**
     * target中属性值为空的字段值使用source中相同的字段值填充
     *
     * @param source
     * @param target
     * @throws Exception
     */
    public static void fillEmptyProperties(Object source, Object target) {
        if (source == null) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, String.format("source对象不能为null"));
        }

        if (target == null) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, String.format("target对象不能为null"));
        }

        if (!source.getClass().equals(target.getClass())) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, String.format("source[%s]和target[%s]必须为同一对象！", source.getClass(), target.getClass()));
        }
        List<Field> fields = getAllFields(target.getClass());
        for (Field field : fields) { // 遍历所有属性
            field.setAccessible(true);
            String fieldName = field.getName();
            try {
                Object fieldValue = field.get(target);
                if (CustomUtil.isEmpty(fieldValue)) {
                    field.set(target, getValue(source, fieldName));
                }
            } catch (Exception e) {
                log.error("字段值填充错误：对象：{}，字段：{}，详细异常信息:", target.getClass().getName(), fieldName, e);
            }
        }
    }

    /**
     * 调用set方法给对象填充值
     *
     * @param obj       对象
     * @param clazz     class
     * @param filedName 字段名称
     * @param typeClass 字段类型
     * @param value     值
     */
    public static void setValue(Object obj, Class<?> clazz, String filedName, Class<?> typeClass, Object value) {
        String methodName = "set" + filedName.substring(0, 1).toUpperCase() + filedName.substring(1);
        try {
            Method method = clazz.getDeclaredMethod(methodName, new Class[]{typeClass});
            method.invoke(obj, value);
        } catch (Exception ex) {
            log.error("", ex);
        }

    }

    /**
     * 获取对象的某个字段值
     *
     * @param obj       对象
     * @param filedName 字段名字
     * @return
     * @throws Exception
     */
    public static Object getValue(Object obj, String filedName) throws Exception {
        Method[] m = obj.getClass().getMethods();
        for (int i = 0; i < m.length; i++) {
            if (("get" + filedName).equalsIgnoreCase(m[i].getName().toLowerCase())) {
                return m[i].invoke(obj);
            }
        }
        return null;
    }

    /**
     * 获取Bean对象所有的字段，包含父类
     *
     * @param clazz 对象
     * @return
     */
    public static List<Field> getAllFields(Class<?> clazz) {
        Field[] fields = clazz.getDeclaredFields();
        List<Field> fieldList = new ArrayList<Field>();
        fieldList.addAll(Arrays.asList(fields));
        Class<?> superClazz = clazz.getSuperclass();
        while (superClazz != null) {
            fieldList.addAll(new ArrayList<>(Arrays.asList(superClazz.getDeclaredFields())));
            superClazz = superClazz.getSuperclass();
        }
        return fieldList;
    }
}
