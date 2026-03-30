package com.dsg.standardization.dto;


import com.dsg.standardization.common.constant.Message;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
@ApiModel
public class SubmitDeDto {
    @ApiModelProperty(value = "id", dataType = "java.lang.String")
    @NotBlank(message = "id" + Message.MESSAGE_INPUT_NOT_EMPTY)
    String id;
    @ApiModelProperty(value = "数据元id", dataType = "java.lang.String")
    String dataElementId;
}
