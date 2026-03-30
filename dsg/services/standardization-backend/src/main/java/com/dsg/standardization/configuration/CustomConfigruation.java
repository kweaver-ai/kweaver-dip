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
public class CustomConfigruation {

    @Value("${afService.taskCenter.detailUrl:http://task-center:8143/api/task-center/v1/internal/tasks/%s}")
    String taskCenterDetailUrl;
}
