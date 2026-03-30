package com.dsg.standardization.dto;

import lombok.Data;
import com.dsg.standardization.vo.Department;

import java.util.List;


@Data
public class AuditLogDto {
    private String timestamp;//时间
    private String level;//日志级别
    private String description; //描述用户的操作行为
    private Operator operator; //操作者
    private String operation;  //操作类型标示
    private Detail detail;  //操作详情


    @Data
    public class Operator {
        private String type; //操作者类型
        private String id; //操作者id
        private String name; //操作者名称
        private List<Department> department;
        private Agent agent; //请求代理
    }

    @Data
    public class Agent {
        private String type; //客户端类型
        private String ip;   //客户端IP
    }

    @Data
    public class Detail{
        private String requestUri;//请求路径
        private String params;//请求参数
        private Long time;
        private String name;
        private String id;
    }
}


