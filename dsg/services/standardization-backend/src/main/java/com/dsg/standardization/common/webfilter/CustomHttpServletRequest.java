package com.dsg.standardization.common.webfilter;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;
import java.util.*;

/**
 * 作者: Jie.xu
 * 创建时间：2023/11/7 13:19
 * 功能描述：
 */
public class CustomHttpServletRequest extends HttpServletRequestWrapper {
    private final Map<String, String> headerMap;

    /**
     * 初始化
     *
     * @param request
     */
    public CustomHttpServletRequest(HttpServletRequest request) {
        super(request);
        headerMap = new HashMap<>();
    }

    /**
     * 添加key、value
     *
     * @param key
     * @param value
     */
    public void addHeader(String key, String value) {
        headerMap.put(key, value);
    }

    /**
     * 获得value
     *
     * @param key
     * @return
     */
    @Override
    public String getHeader(String key) {
        String value = super.getHeader(key);
        if (value == null) {
            value = headerMap.get(key);
        }
        return value;
    }

    /**
     * 获得value集合
     *
     * @param key
     * @return
     */
    @Override
    public Enumeration<String> getHeaders(String key) {
        Enumeration<String> enumeration = super.getHeaders(key);
        List<String> valueList = Collections.list(enumeration);
        if (headerMap.containsKey(key)) {
            valueList.add(headerMap.get(key));
        }
        return Collections.enumeration(valueList);
    }

    /**
     * 获得key集合
     *
     * @return
     */
    @Override
    public Enumeration<String> getHeaderNames(){
        List<String> keyList = Collections.list(super.getHeaderNames());
        keyList.addAll(headerMap.keySet());
        return Collections.enumeration(keyList);
    }
}
