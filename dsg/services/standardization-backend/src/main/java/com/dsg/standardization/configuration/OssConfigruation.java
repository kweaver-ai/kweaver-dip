package com.dsg.standardization.configuration;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * 作者: Jie.xu
 * 创建时间：2023/11/6 10:13
 * 功能描述：
 */
@Data
@Configuration
public class OssConfigruation {

    @Value("${oss.ossApp}")
    private String ossApp;

    @Value("${oss.ossHost}")
    private String ossHost;

    @Value("${oss.ossProtocol}")
    private String ossProtocol;

    @Value("${oss.ossIsDefault}")
    private Boolean ossIsDefault;

    @Value("${oss.ossBucket}")
    private String ossBucket;

    @Value("${oss.debug:false}")
    private Boolean debug;


}
