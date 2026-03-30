package com.dsg.standardization.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.List;

@Data
@ApiModel
public class DictSearchDto extends BaseSearchDto {

    /**
     * 主键ID
     */
    @ApiModelProperty(value = "唯一标识数组", example = "[1,2,3]")
    private List<Long> ids;

    /**
     * 目录id
     */
    @ApiModelProperty(value = "目录ID", example = "1")
    private Long catalogId;

    /**
     * 目录id
     */
    @ApiModelProperty(value = "标准分类ID", example = "1")
    private Integer orgType;


}
