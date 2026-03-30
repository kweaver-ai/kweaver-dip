package com.dsg.standardization.config;

import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.web.config 因与com.dsg.standardization.web.config.WebMvcConfig冲突，此处序列化逻辑不启用
 * @Date: 2022/11/25 17:52
 */
//@Configuration
//@ConditionalOnClass(JavaTimeModule.class)
public class LocalDateTimeSerializerConfig {
    @Bean
    @ConditionalOnProperty("spring.jackson.date-format")
    Jackson2ObjectMapperBuilderCustomizer customizeLocalDateTimeFormat(@Value("${spring.jackson.date-format}") String dateFormat){
        return jacksonObjectMapperBuilder -> {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern(dateFormat);

            jacksonObjectMapperBuilder.serializerByType(LocalDateTime.class, new LocalDateTimeSerializer(formatter));
            jacksonObjectMapperBuilder.deserializerByType(LocalDateTime.class, new LocalDateTimeDeserializer(formatter));
        };
    }
}
