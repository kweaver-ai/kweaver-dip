package com.dsg.standardization.dto;

import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.enums.EnableDisableStatusEnum;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.dto
 * @Date: 2023/11/8 14:14
 */
@Data
public class DeStateDto {
    @ApiModelProperty(value = "启用停用：enable-启用，disable-停用", allowableValues = "enable,disable", example = "enable", required = true)
    @NotBlank(message = "state" + Message.MESSAGE_INPUT_NOT_EMPTY)
    EnableDisableStatusEnum state;
    @ApiModelProperty(value = "停用原因，最大长度800",required = true)
    String reason;
}
