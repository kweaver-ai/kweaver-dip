package com.dsg.standardization.filter;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;


/**
 * 去除请求里面路径参数或者请求参数中参数值的前后空格。
 */
public class ParameterRequestWrapper extends HttpServletRequestWrapper {

    /**
     * 保存处理后的参数
     */
    private Map<String, String[]> params = new HashMap<String, String[]>();

    public ParameterRequestWrapper(HttpServletRequest request) {
        //将request交给父类，以便于调用对应方法的时候，将其输出
        super(request);
        //对于非json请求的参数进行处理
        if (super.getHeader(HttpHeaders.CONTENT_TYPE) == null ||
                (!super.getHeader(HttpHeaders.CONTENT_TYPE).equalsIgnoreCase(MediaType.APPLICATION_JSON_VALUE) &&
                        !super.getHeader(HttpHeaders.CONTENT_TYPE).equalsIgnoreCase(MediaType.APPLICATION_JSON_UTF8_VALUE))) {
            setParams(request);
        }
    }

    private void setParams(HttpServletRequest request) {
        //将请求的的参数转换为map集合
        Map<String, String[]> requestMap = request.getParameterMap();
        this.params.putAll(requestMap);
        //去空操作
        this.modifyParameterValues();
    }

    /**
     * 将parameter的值去除空格后重写回去
     */
    public void modifyParameterValues() {
        Set<String> set = params.keySet();
        Iterator<String> it = set.iterator();
        while (it.hasNext()) {
            String key = it.next();
            String[] values = params.get(key);
            values[0] = values[0].trim();
            params.put(key, values);
        }
    }

    /**
     * 重写getParameter 参数从当前类中的map获取
     */
    @Override
    public String getParameter(String name) {
        String[] values = params.get(name);
        if (values == null || values.length == 0) {
            return null;
        }
        return values[0];
    }

    /**
     * 重写getParameterValues
     */
    @Override
    public String[] getParameterValues(String name) {
        return params.get(name);
    }
}


