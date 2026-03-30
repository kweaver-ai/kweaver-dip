package com.dsg.standardization.config;


import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import com.dsg.standardization.common.mybatis.interceptor.CustomTraceSqlStatementInterceptor;
import com.dsg.standardization.configuration.CustomTraceConfigruation;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * mybatis plus 分页插件配置
 */
@Configuration
@EnableTransactionManagement
//@MapperScan("scan.your.mapper.package")
public class MybatisPlusConfig {
    @Value("${spring.datasource.data-type:mariadb}")
    private String dataType;//数据类型
    /**
     * 新的分页插件,一缓和二缓遵循mybatis的规则,需要设置 MybatisConfiguration#useDeprecatedExecutor = false 避免缓存出现问题(该属性会在旧插件移除后一同移除)
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        //	自定义 的 like 转义特殊字符%_\
        interceptor.addInnerInterceptor(new EscapeInterceptor());
        if(StringUtils.isNotEmpty(dataType) && "DM8".equalsIgnoreCase(dataType)){
            dataType="dm";
        }
        //	mybatis-plus 的 分页查询
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.getDbType(dataType)));

        return interceptor;
    }

    /**
     * mybatis 自定义拦截器(特殊字符处理)
     *
     * @return
     */
    @Bean
    public EscapeInterceptor getEscapeInterceptor() {
        EscapeInterceptor interceptor = new EscapeInterceptor();
        return interceptor;
    }


    @Autowired
    CustomTraceConfigruation customTraceConfigruation;

    /**
     * Mybatis 链路追踪，打印SQL 逻辑
     */
    @Bean
    CustomTraceSqlStatementInterceptor sqlStatementInterceptor() {
        String traceEndpointUrl = customTraceConfigruation.getTraceEnabled() == false ? null : customTraceConfigruation.getTraceEndpointUrl();
        return new CustomTraceSqlStatementInterceptor(
                traceEndpointUrl,
                customTraceConfigruation.getServiceName(),
                customTraceConfigruation.getServiceVersion(),
                dataType);
    }

}
