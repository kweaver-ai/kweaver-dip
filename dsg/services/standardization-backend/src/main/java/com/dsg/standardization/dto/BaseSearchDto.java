package com.dsg.standardization.dto;

import com.dsg.standardization.common.webfilter.XssFilterDeserializer;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BaseSearchDto {

    /**
     * 搜索关键字
     */
    @ApiModelProperty(value = "搜索关键字", example = "性别")
    @JsonDeserialize(using = XssFilterDeserializer.class)
    private String keyword;

    /**
     * 开始响应的项目的偏移量
     */
    @ApiModelProperty(value = "开始响应的项目的偏移量", example = "1")
    private Integer offset = 1;

    /**
     * 每页最多可返回的项目数，默认20
     */
    @ApiModelProperty(value = "每页返回的项目数", example = "性别")
    private Integer limit = 20;

    /**
     * 排序结果方向
     */
    @ApiModelProperty(value = "排序结果方向", example = "asc/desc")
    private String direction;

    /**
     * 排序字段
     */
    @ApiModelProperty(value = "排序字段", example = "f_id")
    private String sort;
}
