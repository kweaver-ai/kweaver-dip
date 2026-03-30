package com.dsg.standardization.dto;


import com.dsg.standardization.common.constant.Message;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import org.hibernate.validator.constraints.Length;

import javax.validation.constraints.NotBlank;

/**
 * AF 标准创建接口请求参数
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-12-20 13:39:40
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
public class CustomTaskCreateDto extends CustomTaskRecDto {
    private static final long serialVersionUID = 1L;


    @ApiModelProperty(value = "任务编号", example = "")
    @NotBlank(message = "任务编号" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @Length(message = "任务编号长度不能超过1024", max = 1024)
    @JsonProperty("task_no")
    private String taskNo;

    @ApiModelProperty(value = "回调地址", example = "")
    @NotBlank(message = "回调地址" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @Length(message = "回调地址长度不能超过1024", max = 1024)
    private String webhook;

}
