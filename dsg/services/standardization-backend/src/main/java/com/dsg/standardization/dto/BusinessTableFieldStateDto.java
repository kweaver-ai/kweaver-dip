package com.dsg.standardization.dto;

import com.dsg.standardization.common.constant.Message;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotNull;
import java.util.List;

@Data
public class BusinessTableFieldStateDto {

    @ApiModelProperty(value = "业务表ID")
    @NotNull(message = "业务表ID" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private List<String> businessTableId;

    @ApiModelProperty(value = "待新建标准状态")
    private List<String> state;
}
