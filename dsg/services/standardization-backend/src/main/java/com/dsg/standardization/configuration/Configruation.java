package com.dsg.standardization.configuration;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
public class Configruation {
    @Value("${rec.service.url}")
    private String recServiceUrl;

    @Value("${token.check.url}")
    private String tokenCheckUrl;

    @Value("${rec.service.rule_url:http://af-sailor:9797/api/af-sailor/v1/internal/recommend/field/rule}")
    private String recRuleServiceUrl;

}
