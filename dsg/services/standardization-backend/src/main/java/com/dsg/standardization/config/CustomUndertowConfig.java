package com.dsg.standardization.config;

import io.undertow.UndertowOptions;
import org.springframework.boot.web.embedded.undertow.UndertowServletWebServerFactory;
import org.springframework.boot.web.servlet.server.ConfigurableServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


@Configuration
public class CustomUndertowConfig {
    @Bean
    public ConfigurableServletWebServerFactory webServerFactory() {
        UndertowServletWebServerFactory factory =new UndertowServletWebServerFactory();

        factory.addBuilderCustomizers(builder -> builder.setServerOption(UndertowOptions.ALLOW_UNESCAPED_CHARACTERS_IN_URL, Boolean.TRUE)); //url配置
//        factory.addBuilderCustomizers(builder -> builder.setServerOption(UndertowOptions.ALLOW_EQUALS_IN_COOKIE_VALUE, Boolean.TRUE));
//        factory.addBuilderCustomizers(builder -> builder.setServerOption(UndertowOptions.ALLOW_ENCODED_SLASH,Boolean.TRUE));
        return factory;
    }
}
