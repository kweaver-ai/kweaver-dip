package com.dsg.standardization.common.util;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * json 该工具开启了驼峰转下划线功能，后期会弃用，
 */
@Deprecated
public class JsonUtil {

    private static final Logger logger = LoggerFactory.getLogger(JsonUtil.class);
    private static ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    static {
        // 对象的所有字段全部列入，还是其他的选项，可以忽略null等
        OBJECT_MAPPER.setSerializationInclusion(JsonInclude.Include.NON_NULL);

        // 驼峰下滑线互转 ,不开启
        OBJECT_MAPPER.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);

        // 忽略空Bean转json的错误
        OBJECT_MAPPER.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        // 忽略未知属性，防止json字符串中存在，java对象中不存在对应属性的情况出现错误
        OBJECT_MAPPER.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        // 注册一个时间序列化及反序列化的处理模块，用于解决jdk8中localDateTime等的序列化问题
        OBJECT_MAPPER.registerModule(new JavaTimeModule());

    }

    /**
     * json 该工具开启了驼峰转下划线功能，后期会弃用，
     */
    @Deprecated
    public static Map<String, String> jsonToMap(String json) {
        return json2Obj(json, Map.class);
    }

    /**
     * json 该工具开启了驼峰转下划线功能，后期会弃用，
     */
    @Deprecated
    public static <T> String map2json(Map<String, T> map) {
        return obj2json(map);
    }

    /**
     * json 该工具开启了驼峰转下划线功能，后期会弃用，
     */
    @Deprecated
    public static String obj2json(Object o) {
        try {
            return OBJECT_MAPPER.writeValueAsString(o);
        } catch (IOException e) {
            logger.error("序列化错误：", e);
        }
        return null;
    }

    /**
     * json 该工具开启了驼峰转下划线功能，后期会弃用，
     */
    @Deprecated
    public static <T> T json2Obj(String json, Class<T> valueType) {
        try {
            return OBJECT_MAPPER.readValue(json, valueType);
        } catch (IOException e) {
            logger.error("反序列化错误：{}", json);
            logger.error(e.getMessage(), e);
        }
        return null;
    }

    /**
     * json 该工具开启了驼峰转下划线功能，后期会弃用，
     */
    @Deprecated
    public static <T> List<T> json2List(String jsonString, Class<T> valueType) {
        try {
            JavaType javaType = getCollectionType(ArrayList.class, valueType);
            return OBJECT_MAPPER.readValue(jsonString, javaType);
        } catch (IOException e) {
            logger.error("反序列化错误：{}", jsonString);
            logger.error(e.getMessage(), e);
        }
        return null;
    }

    /**
     * 获取泛型的 Collection Type
     */
    public static JavaType getCollectionType(Class<?> collectionClass, Class<?>... elementClasses) {
        return OBJECT_MAPPER.getTypeFactory().constructParametricType(collectionClass, elementClasses);
    }

}
