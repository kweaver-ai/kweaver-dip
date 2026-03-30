package com.dsg.standardization.dto;

import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.webfilter.XssFilterDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import org.hibernate.validator.constraints.Length;

import javax.validation.constraints.NotBlank;

@Data
@ApiModel
public class BusinessTableFieldDescriptionDto {

    @ApiModelProperty(value = "待新建标准id", example = "11")
    @NotBlank(message = "待新建标准id" + Message.MESSAGE_INPUT_NOT_EMPTY)
    String id;

    @ApiModelProperty(value = "待新建标准描述", example = "11")
    @Length(message = "待新建标准描述长度不能超过255位", max = 255)
    @JsonDeserialize(using = XssFilterDeserializer.class)
    String description;

}
