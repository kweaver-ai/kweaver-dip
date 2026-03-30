package com.dsg.standardization.common.mybatis.interceptor;

import com.baomidou.mybatisplus.core.toolkit.CollectionUtils;
//import io.opentelemetry.api.common.AttributeKey;
//import io.opentelemetry.api.trace.Span;
//import io.opentelemetry.api.trace.SpanKind;
//import io.opentelemetry.context.Context;
import org.apache.ibatis.cache.CacheKey;
import org.apache.ibatis.executor.Executor;
import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.mapping.ParameterMapping;
import org.apache.ibatis.plugin.*;
import org.apache.ibatis.reflection.MetaObject;
import org.apache.ibatis.session.Configuration;
import org.apache.ibatis.session.ResultHandler;
import org.apache.ibatis.session.RowBounds;
import org.apache.ibatis.type.TypeHandlerRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.InvocationTargetException;
import java.text.DateFormat;
import java.util.*;
import java.util.regex.Matcher;

@Intercepts(value = {
        @Signature(type = Executor.class, method = "update", args = {MappedStatement.class, Object.class}),
        @Signature(type = Executor.class, method = "query", args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class, CacheKey.class, BoundSql.class}),
        @Signature(type = Executor.class, method = "query", args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class})})
public class CustomTraceSqlStatementInterceptor implements Interceptor {

    String dbType;

    public CustomTraceSqlStatementInterceptor(String endpointUrl, String serviceName, String serviceVersion, String dbType) {
        this.dbType = dbType == null ? "" : dbType;
//        ARTraceHelper.init(endpointUrl, serviceName, serviceVersion);
    }


    private static final Logger LOGGER = LoggerFactory.getLogger(CustomTraceSqlStatementInterceptor.class);

    @Override
    public Object intercept(Invocation invocation) throws InvocationTargetException, IllegalAccessException {

//        Context parentContext = ARTraceHelper.getParentSpanInfo();
//        Span span = ARTraceHelper.spanStart(getSpanBuilderName(invocation), SpanKind.INTERNAL, parentContext);
        try {
            Object result = invocation.proceed();
//            setSpanAttribute(invocation, span, result);
//            ARTraceHelper.spanSuccessEnd(span);
            return result;
        } catch (Throwable throwable) {
            LOGGER.warn("", throwable);
//            setSpanAttribute(invocation, span, null);
//            ARTraceHelper.spanErrorEnd(span);
            throw throwable;
        }
    }

//    private void setSpanAttribute(Invocation invocation, Span span, Object result) {
//        try {
//            Map<String, Object> spanAttribute = getSpanAttribute(invocation, result);
//            for (Map.Entry<String, Object> row : spanAttribute.entrySet()) {
//                span.setAttribute((AttributeKey) AttributeKey.stringKey(row.getKey()), row.getValue());
//            }
//        } catch (Exception e) {
//            LOGGER.warn("", e);
//        }
//    }

    private Map<String, Object> getSpanAttribute(Invocation invocation, Object result) {

        Map<String, Object> map = new HashMap<>();
        map.put("db.rows_affected", getRowsAffected(invocation, result));
        map.put("db.system", dbType);
        map.put("db.statement", getMybatisSql(invocation));
        map.put("db.sql.table", "");
        return map;
    }

    private String getRowsAffected(Invocation invocation, Object result) {
        if (invocation.getMethod().getName().equalsIgnoreCase("update")) {
            if (result instanceof Number) {
                return String.valueOf(result);
            }
        }
        return "-1";

    }


    public String getSpanBuilderName(Invocation invocation) {
        final Object[] args = invocation.getArgs();
        MappedStatement ms = (MappedStatement) args[0];
        return ms.getId();
    }


    private static String getParameterValue(Object obj) {
        String value;
        if (obj instanceof String) {
            value = "'" + obj.toString() + "'";
        } else if (obj instanceof Date) {
            DateFormat formatter = DateFormat.getDateTimeInstance(DateFormat.DEFAULT, DateFormat.DEFAULT, Locale.CHINA);
            value = "'" + formatter.format(new Date()) + "'";
        } else {
            if (obj != null) {
                value = obj.toString();
            } else {
                value = "";
            }
        }
        return value;
    }

    private static String getMybatisSql(Invocation invocation) {

        final Object[] args = invocation.getArgs();
        MappedStatement ms = (MappedStatement) args[0];
        Object parameter = null;
        // BoundSql就是封装 MyBatis最终产生的 sql类
        BoundSql boundSql = null;
        //获取参数，if语句成立，表示 sql语句有参数，参数格式是 map形式
        if (args.length > 1) {
            parameter = invocation.getArgs()[1];
            boundSql = ms.getBoundSql(parameter);
            if (args.length == 6) {
                boundSql = (BoundSql) args[5];
            }
        }
        Configuration configuration = ms.getConfiguration();
        // 获取参数
        Object parameterObject = boundSql.getParameterObject();
        List<ParameterMapping> parameterMappings = boundSql.getParameterMappings();
        // sql语句中多个空格都用一个空格代替
        String sql = boundSql.getSql().replaceAll("[\\s]+", " ");
        if (!CollectionUtils.isEmpty(parameterMappings) && parameterObject != null) {
            // 获取类型处理器注册器，类型处理器的功能是进行 java类型和数据库类型的转换　　　　　　
            // 如果根据 parameterObject.getClass(）可以找到对应的类型，则替换
            TypeHandlerRegistry typeHandlerRegistry = configuration.getTypeHandlerRegistry();
            if (typeHandlerRegistry.hasTypeHandler(parameterObject.getClass())) {
                sql = sql.replaceFirst("\\?", Matcher.quoteReplacement(getParameterValue(parameterObject)));
            } else {
                // MetaObject主要是封装了 originalObject对象，提供了 get和 set的方法用于获取和设置 originalObject的属性值
                // 主要支持对 JavaBean、Collection、Map三种类型对象的操作
                MetaObject metaObject = configuration.newMetaObject(parameterObject);
                for (ParameterMapping parameterMapping : parameterMappings) {
                    String propertyName = parameterMapping.getProperty();
                    if (metaObject.hasGetter(propertyName)) {
                        Object obj = metaObject.getValue(propertyName);
                        sql = sql.replaceFirst("\\?", Matcher.quoteReplacement(getParameterValue(obj)));
                    } else if (boundSql.hasAdditionalParameter(propertyName)) {
                        Object obj = boundSql.getAdditionalParameter(propertyName);
                        // 该分支是动态 sql
                        sql = sql.replaceFirst("\\?", Matcher.quoteReplacement(getParameterValue(obj)));
                    } else {
                        sql = sql.replaceFirst("\\?", "缺失");
                    }
                }
            }
        }
        return sql;
    }

    @Override
    public Object plugin(Object arg0) {
        return Plugin.wrap(arg0, this);
    }

    @Override
    public void setProperties(Properties properties) {
        // do nothing
    }

}