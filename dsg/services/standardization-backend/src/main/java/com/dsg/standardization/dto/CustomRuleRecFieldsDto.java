package com.dsg.standardization.dto;

import com.dsg.standardization.common.constant.Message;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.io.Serializable;

/**
 * AF 推荐--字段
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-12-20 13:39:40
 */
@Data
@ApiModel(description = "推荐--字段信息")
public class CustomRuleRecFieldsDto implements Serializable {
    private static final long serialVersionUID = 1L;
    @ApiModelProperty(value = "字段ID", example = "")
    @JsonProperty("field_id")
    private String field_id;
    @ApiModelProperty(value = "字段名称", example = "",required = true)
    @NotBlank(message = "字段名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @JsonProperty("field_name")
    private String field_name;
    @ApiModelProperty(value = "字段描述", example = "")
    @JsonProperty("field_desc")
    private String field_desc;
    @ApiModelProperty(value = "标准ID", example = "")
    @JsonProperty("standard_id")
    private String standard_id;
}
