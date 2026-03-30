package com.dsg.standardization.dto;

import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.enums.EnableDisableStatusEnum;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * 作者: Jie.xu
 * 创建时间：2023/11/7 17:00
 * 功能描述：
 */
@Data
public class StateUpdateDto {

    @ApiModelProperty(value = "启用停用：enable-启用，disable-停用", allowableValues = "enable,disable", example = "enable", required = true)
    @NotBlank(message = "state" + Message.MESSAGE_INPUT_NOT_EMPTY)
    EnableDisableStatusEnum state;

    @ApiModelProperty(value = "停用原因，最大长度800",required = true)
    String reason;
}
