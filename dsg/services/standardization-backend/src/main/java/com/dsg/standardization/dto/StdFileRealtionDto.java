package com.dsg.standardization.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.List;

/**
 * 作者: Jie.xu
 * 创建时间：2023/11/8 13:57
 * 功能描述：
 */
@ApiModel(description = "标准文件ID与数据元&码表&编码规则的关联")
@Data
public class StdFileRealtionDto {
    @ApiModelProperty(value = "关联数据标准集合ID"  ,dataType = "java.util.List")
    private List<Long> relationDeList;
    @ApiModelProperty(value = "关联码表集合ID", dataType = "java.util.List")
    private List<Long> relationDictList;
    @ApiModelProperty(value = "关联编码规则集合ID",  dataType = "java.util.List")
    private List<Long> relationRuleList;

}
