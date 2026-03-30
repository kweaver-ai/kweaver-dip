package com.dsg.standardization.common.webfilter;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@ConfigurationProperties(prefix = "token.access-control")
@Data
public class TokenCheckConfig {
    List<String> httpGetGroupUris;

}
