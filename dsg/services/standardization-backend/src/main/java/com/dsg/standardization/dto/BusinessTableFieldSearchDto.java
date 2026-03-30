package com.dsg.standardization.dto;

import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.List;

@Data
public class BusinessTableFieldSearchDto extends BaseSearchDto {
    @ApiModelProperty(value = "业务表模型id", example = "")
    private String businessTableModelId;

    @ApiModelProperty(value = "任务id", example = "")
    private String taskId;

    @ApiModelProperty(value = "业务表ID", example = "")
    private String businessTableId;

    @ApiModelProperty(value = "标准新建状态", example = "1")
    private List<Integer> state;

    @ApiModelProperty(value = "是否已配置数据元", example = "1")
    private Boolean haveDe;
}
