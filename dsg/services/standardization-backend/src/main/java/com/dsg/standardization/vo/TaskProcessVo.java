package com.dsg.standardization.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.vo
 * @Date: 2024/1/23 11:01
 */
@Data
@ApiModel(description = "标准任务进度")
public class TaskProcessVo {
    @ApiModelProperty(value = "字段总数", dataType = "java.lang.Integer")
    Integer totalNumber;
    @ApiModelProperty(value = "完成标准化字段数", dataType = "java.lang.Integer")
    Integer finishNumber;
}
