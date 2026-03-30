package com.dsg.standardization.dto;

import com.dsg.standardization.common.constant.Message;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel(description = "目录移除对象")
public class CatalogMoveDto {

    // 主键
    @ApiModelProperty(value = "主键标识列表", required = true)
    @NotEmpty(message = "主键id" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private List<Long> ids;

    // 目录id
    @ApiModelProperty(value = "目录id", example = "", dataType = "java.lang.String", required = true)
    @NotNull(message = "移动至的目录" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private Long catalogId;
}
