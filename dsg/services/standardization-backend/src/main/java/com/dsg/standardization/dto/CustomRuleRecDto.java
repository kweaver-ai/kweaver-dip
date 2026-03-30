package com.dsg.standardization.dto;

import com.dsg.standardization.common.constant.Message;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.Size;
import java.io.Serializable;
import java.util.List;

/**
 * AF 规则推荐
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-12-20 13:39:40
 */
@Data
@ApiModel(description = "规则推荐信息")
public class CustomRuleRecDto implements Serializable {
    private static final long serialVersionUID = 1L;
    @ApiModelProperty(value = "推荐表数据列表", example = "",required = true)
    @Size(min = 1,message =  "推荐表"+ Message.MESSAGE_INPUT_NOT_EMPTY)
    @Valid
    @JsonProperty("query")
    private List<CustomRuleRecTableDto> query;
}
