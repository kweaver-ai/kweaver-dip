package com.dsg.standardization.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * 作者: Jie.xu
 * 创建时间：2023/11/7 10:21
 * 功能描述：
 */
@Data
public class Department {
    String id; // 部门ID
    String name; // 部门名称
    @JsonProperty("third_dept_id")  // 指定JSON字段名
    String thirdDeptId; // 第三方部门名称
    @JsonProperty("path_id")  // 指定JSON字段名
    String pathId; // 路径ID
    @JsonProperty("path")  // 指定JSON字段名
    String pathName; // 路径Name
}
