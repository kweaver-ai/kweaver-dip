package com.dsg.standardization.configuration;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "excel.import.template")
public class ExcelImportConfigruation {

    /**
     * 字典模板路径
     */
    private String dict;
    /**
     * 数据元模板路径
     */
    private String de;
}
