package com.dsg.standardization.configuration;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * 作者: Jie.xu
 * 创建时间：2023/10/18 11:45
 * 功能描述：
 */
@Data
@Configuration
public class CustomTraceConfigruation {

    @Value("${spring.application.name:standardization}")
    String serviceName;

    @Value("${spring.application.version:1.0.0}")
    String serviceVersion;

    @Value("${anyrobot.trace.enabled:false}")
    Boolean traceEnabled;

    @Value("${anyrobot.trace.endpoint:}")
    String traceEndpointUrl;
}
