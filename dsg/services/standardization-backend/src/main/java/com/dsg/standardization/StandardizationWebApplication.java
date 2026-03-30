package com.dsg.standardization;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import springfox.documentation.oas.annotations.EnableOpenApi;

@EnableOpenApi
@SpringBootApplication
@MapperScan("com.dsg.standardization.mapper*")
public class StandardizationWebApplication {

    public static void main(String[] args) {
        SpringApplication.run(StandardizationWebApplication.class, args);
    }

}
