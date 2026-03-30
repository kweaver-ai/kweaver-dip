package com.dsg.standardization.dto;

import com.dsg.standardization.common.constant.Message;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import org.hibernate.validator.constraints.Length;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import java.util.List;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.dto
 * @Date: 2024/1/18 16:46
 */
@Data
@ApiModel
public class StdCreateTaskDto {
    @ApiModelProperty(value = "任务ID", example = "")
    @NotBlank(message = "任务ID" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @Length(message = "格式为36位UUID", min = 36, max = 36)
    String taskId;

    @ApiModelProperty(value = "待建标准业务表字段主键ID数组", example = "")
    @NotEmpty(message = "ID数组" + Message.MESSAGE_INPUT_NOT_EMPTY)
    List<String> ids;
}
