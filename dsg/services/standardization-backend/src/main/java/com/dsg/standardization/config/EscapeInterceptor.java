package com.dsg.standardization.config;

import com.baomidou.mybatisplus.extension.plugins.inner.InnerInterceptor;
import com.dsg.standardization.common.util.StringUtil;
import org.apache.ibatis.executor.Executor;
import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.reflection.MetaObject;
import org.apache.ibatis.session.ResultHandler;
import org.apache.ibatis.session.RowBounds;

import java.sql.SQLException;
import java.util.HashSet;
import java.util.Set;

/**
 * 特殊字符转换 like 查询
 * <p>
 * 参数中的特殊查询字符  _  %  \
 * <p>
 * 注意事项 ：
 * 1. 必须是在 分页拦截器之前执行 [注意拦截器的顺序]
 */

public class EscapeInterceptor implements InnerInterceptor {
    @Override
    public void beforeQuery(Executor executor, MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) throws SQLException {
        String sql = boundSql.getSql().toLowerCase();
        //  判断是否包含 参数 及 like 查询
        if (!sql.contains(" like ") || !sql.contains("?")) {
            return;
        }

        // 获取关键字的个数（去重）,获取 到 like 查询 的 key
        String[] strList = sql.split("\\?");
        Set<String> keyNames = new HashSet<>();
        for (int i = 0; i < strList.length; i++) {
            String sqlSub = strList[i].toLowerCase();
            if (sqlSub.contains(" like ") && sqlSub.contains("concat")) {
                String keyName = boundSql.getParameterMappings().get(i).getProperty();
                keyNames.add(keyName);
            }
        }

        MetaObject metaObject = ms.getConfiguration().newMetaObject(parameter);
        for (String keyName : keyNames) {
            Object value = metaObject.getValue(keyName);
            if (value instanceof String) {
                if (isconvert((String) value)) {
                    metaObject.setValue(keyName, convert((String) value));
                }
            }
        }
    }

    private String convert(String before) {
//        if (StringUtils.isNotBlank(before)) {
//            before = StringUtil.escapeSqlSpecialChars(before);
//            before = before.replaceAll("\\\\", "\\\\\\\\");
//            before = before.replaceAll("_", "\\\\_");
//            before = before.replaceAll("%", "\\\\%");
//        }
        return StringUtil.escapeSqlSpecialChars(before);
    }

    private boolean isconvert(String str) {
        return str.contains("\\") || str.contains("_") || str.contains("%");
    }
}
