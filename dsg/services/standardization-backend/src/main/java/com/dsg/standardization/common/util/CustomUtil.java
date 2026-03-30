package com.dsg.standardization.common.util;


import com.dsg.standardization.common.constant.Constants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;
import org.springframework.web.multipart.MultipartFile;
import com.dsg.standardization.vo.UserInfo;

import javax.servlet.ServletRequest;
import java.beans.Introspector;
import java.beans.PropertyDescriptor;
import java.lang.reflect.Array;
import java.lang.reflect.Method;
import java.sql.Timestamp;
import java.util.*;
import java.util.function.Supplier;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 工具类
 *
 * @author Jie.xu
 */
public class CustomUtil {

    private final static Logger logger = LoggerFactory.getLogger(CustomUtil.class);

    /**
     * List 拷贝，浅拷贝，主要实现依赖BeanUtils.copyProperties(source, t);
     * 使用示例：List<DeptTest> target = BeanProUtils.copyList(sources, DeptTest::new);
     *
     * @param source 需要cpoy的源数组
     * @param target 目标对象,参数样例：DeptTest::new
     * @return 拷贝的目标数组
     */
    public static <S, T> List<T> copyListProperties(List<S> source, Supplier<T> target) {
        List<T> list = new ArrayList<>(source.size());
        for (S s : source) {
            T t = target.get();
            BeanUtils.copyProperties(s, t);
            list.add(t);
        }
        return list;
    }

    /**
     * List 拷贝，浅拷贝，主要实现依赖BeanUtils.copyProperties(source, t);
     *
     * @param targetCls 需要cpoy的源数组
     * @param dest      目标数组
     * @param targetCls 目标实体对象
     * @return 空
     */
    public static <S, T> void copyListProperties(List<S> source, List<T> dest, Class<T> targetCls) {
        try {
            for (S s : source) {
                T t = null;
                t = targetCls.newInstance();
                BeanUtils.copyProperties(s, t);
                dest.add(t);
            }
        } catch (Exception e) {
            logger.error("类型转换异常，异常信息:", e);
        }
    }

    /**
     * 对象拷贝
     *
     * @param source 源
     * @param target 目标
     * @return
     */
    public static void copyProperties(Object source, Object target) {
        BeanUtils.copyProperties(source, target);
    }

    /**
     * 对象转json
     *
     * @param o
     * @return
     */
    public static String obj2json(Object o) {
        return JsonUtils.obj2json(o);
    }

    /**
     * json 转对象
     *
     * @param json
     * @param cls
     * @param <T>
     * @return
     */
    public static <T> T json2Obj(String json, Class<T> cls) {
        return JsonUtils.json2Obj(json, cls);
    }

    /**
     * json 转数组
     *
     * @param jsonString
     * @param cls
     * @param <T>
     * @return
     */
    public static <T> List<T> json2List(String jsonString, Class<T> cls) {
        return JsonUtils.json2List(jsonString, cls);
    }

    /**
     * 文件类型校验
     *
     * @param file
     * @param type
     * @return
     */
    public static boolean checkFileType(MultipartFile file, String type) {
        if (file.isEmpty()) {
            return false;
        } else {
            int begin = file.getOriginalFilename().lastIndexOf(".");
            if (begin == -1) {
                return false;
            } else {
                int last = file.getOriginalFilename().length();
                //获得文件后缀名
                String end = file.getOriginalFilename().substring(begin, last);
                //文件后缀校验
                if (end.endsWith(type)) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    }

    /**
     * @param len  文件长度
     * @param size 限制大小
     * @param unit 限制单位（B,K,M,G）
     * @描述 判断文件大小
     */
    public static boolean checkFileSize(Long len, int size, String unit) {
        double fileSize = 0;
        if ("B".equalsIgnoreCase(unit)) {
            fileSize = (double) len;
        } else if ("K".equalsIgnoreCase(unit)) {
            fileSize = (double) len / 1024;
        } else if ("M".equalsIgnoreCase(unit)) {
            fileSize = (double) len / 1048576;
        } else if ("G".equalsIgnoreCase(unit)) {
            fileSize = (double) len / 1073741824;
        }
        return !(fileSize > size);
    }

    /**
     * 版本号生成规则, 从V1开始递增
     *
     * @param currentVersion
     * @return
     */
    public static String createVesion(String currentVersion) {
        if (currentVersion != null) {
            if (currentVersion.matches(Constants.REGEX_VERSION_NAME_RULE)) {
                currentVersion = currentVersion.substring(1);
                int maxVersionInt = ConvertUtil.toInt(currentVersion);
                maxVersionInt++;
                return String.format("%s%s", Constants.REGEX_VERSION_NAME_RULE_PREFIX, maxVersionInt);
            }
        }
        return String.format("%s%s", Constants.REGEX_VERSION_NAME_RULE_PREFIX, 1);
    }


    /**
     * 判断对象是否为NULL
     *
     * @param obj
     * @return
     */
    public static boolean isNull(Object obj) {
        return obj == null;

    }

    /**
     * 判断对象不为null
     *
     * @param obj
     * @return
     */
    public static boolean isNotNull(Object obj) {
        return !isNull(obj);

    }

    /**
     * 判断对象为空
     *
     * @param obj
     * @return
     */
    public static boolean isEmpty(Object obj) {
        if (obj == null) return true;
        else if (obj instanceof CharSequence) return ((CharSequence) obj).length() == 0;
        else if (obj instanceof Collection) return ((Collection) obj).isEmpty();
        else if (obj instanceof Map) return ((Map) obj).isEmpty();
        else if (obj.getClass().isArray()) return Array.getLength(obj) == 0;

        return false;

    }

    /**
     * 判断对象不为空
     *
     * @param obj
     * @return
     */
    public static boolean isNotEmpty(Object obj) {
        return !isEmpty(obj);

    }


    /**
     * target中属性值为空的字段值使用source中相同的字段值填充
     *
     * @param source
     * @param target
     * @throws Exception
     */
    public static void fillEmptyProperties(Object source, Object target) {
        ReflectUtil.fillEmptyProperties(source, target);
    }


    /**
     * 比较两个实体属性值，返回一个boolean,
     *
     * @param oldObject 进行属性比较的对象1
     * @param newObject 进行属性比较的对象2
     * @return true:两个对象中的属性值无差异,false:两个对象中的属性值有差异
     */
    public static boolean compareObject(Object oldObject, Object newObject) {
        Map<String, List<Object>> resultMap = compareFields(oldObject, newObject, null);

        if (isEmpty(resultMap)) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * 比较两个实体属性值，返回一个map以有差异的属性名为key，value为一个Map分别存oldObject,newObject此属性名的值
     *
     * @param obj1      进行属性比较的对象1
     * @param obj2      进行属性比较的对象2
     * @param ignoreArr 忽略比较的字段
     * @return 属性差异比较结果map
     */
    @SuppressWarnings("rawtypes")
    public static Map<String, List<Object>> compareFields(Object obj1, Object obj2, String[] ignoreArr) {
        try {
            Map<String, List<Object>> map = new HashMap<>();
            List<String> ignoreList = null;
            if (ignoreArr != null && ignoreArr.length > 0) {
                // array转化为list
                ignoreList = Arrays.asList(ignoreArr);
            }
            if (obj1.getClass() == obj2.getClass()) {// 只有两个对象都是同一类型的才有可比性
                Class clazz = obj1.getClass();
                // 获取object的属性描述
                PropertyDescriptor[] pds = Introspector.getBeanInfo(clazz,
                        Object.class).getPropertyDescriptors();
                for (PropertyDescriptor pd : pds) {// 这里就是所有的属性了
                    String name = pd.getName();// 属性名
                    if (ignoreList != null && ignoreList.contains(name)) {// 如果当前属性选择忽略比较，跳到下一次循环
                        continue;
                    }
                    Method readMethod = pd.getReadMethod();// get方法
                    // 在obj1上调用get方法等同于获得obj1的属性值
                    Object o1 = readMethod.invoke(obj1);
                    // 在obj2上调用get方法等同于获得obj2的属性值
                    Object o2 = readMethod.invoke(obj2);
                    if (o1 instanceof Timestamp) {
                        o1 = new Date(((Timestamp) o1).getTime());
                    }
                    if (o2 instanceof Timestamp) {
                        o2 = new Date(((Timestamp) o2).getTime());
                    }
                    if (o1 == null && o2 == null) {
                        continue;
                    } else if (o1 == null && o2 != null) {
                        List<Object> list = new ArrayList<>();
                        list.add(o1);
                        list.add(o2);
                        map.put(camelToUnderline(name), list);
                        continue;
                    }
                    if (!o1.equals(o2)) {// 比较这两个值是否相等,不等就可以放入map了
                        List<Object> list = new ArrayList<>();
                        list.add(o1);
                        list.add(o2);
                        map.put(camelToUnderline(name), list);
                    }
                }
            }
            return map;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * 错误码构建规则
     *
     * @param mainErrorDes 主要错误描述
     * @param exErrorDes   拓展错误描述
     * @return 服务名.主要错误描述.拓展错误描述
     */
    public static String buildErrorCode(String mainErrorDes, String exErrorDes) {
        if (CustomUtil.isNotEmpty(exErrorDes)) {
            return String.format("%s.%s", mainErrorDes, exErrorDes);
        } else {
            return mainErrorDes;
        }
    }


    /**
     * 驼峰法转下划线
     *
     * @param line 源字符串
     * @return 转换后的字符串
     */
    public static String camelToUnderline(String line) {
        if (isEmpty(line)) {
            return "";
        }
        Pattern compile = Pattern.compile("[A-Z]");
        Matcher matcher = compile.matcher(line);
        StringBuffer result = new StringBuffer();
        while (matcher.find()) {
            matcher.appendReplacement(result, "_" + matcher.group(0).toLowerCase());
        }
        matcher.appendTail(result);
        return result.toString();

    }

    /**
     * 获取 http请求中的token
     */
    public static String getToken() {
        return TokenUtil.getToken();
    }

    /**
     * @return
     */
    public static UserInfo getUser() {
        return TokenUtil.getUserInfo();
    }

    public static String getToken(ServletRequest servletRequest) {
        return TokenUtil.getToken(servletRequest);
    }

    /**
     * 校验token有效性
     *
     * @param tokenCheckUrl token校验url
     * @param token
     * @return
     */
    public static boolean checkTokenValid(String tokenCheckUrl, String token) {
        return TokenUtil.checkTokenValid(tokenCheckUrl, token, null);
    }
}
