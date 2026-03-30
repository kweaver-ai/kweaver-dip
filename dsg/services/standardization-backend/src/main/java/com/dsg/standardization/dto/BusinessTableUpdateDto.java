package com.dsg.standardization.dto;

import com.dsg.standardization.common.constant.Message;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import org.hibernate.validator.constraints.Length;

import javax.validation.constraints.NotBlank;

@Data
@ApiModel
public class BusinessTableUpdateDto {
    @ApiModelProperty(value = "业务表名称", example = "")
    @NotBlank(message = "业务表名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @Length(message = "长度不能超过128位", max = 128)
    String businessTableName;

    @ApiModelProperty(value = "业务表ID", example = "")
    @NotBlank(message = "业务表ID" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @Length(message = "格式为36位UUID", min = 36, max = 36)
    String businessTableId;
}
