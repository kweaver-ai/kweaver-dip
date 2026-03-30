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
 * AF 推荐--表
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-12-20 13:39:40
 */
@Data
@ApiModel(description = "推荐--表信息")
public class CustomRuleRecTableDto implements Serializable {
    private static final long serialVersionUID = 1L;
    @ApiModelProperty(value = "业务表ID", example = "")
    @JsonProperty("table_id")
    private String table_id;
    @ApiModelProperty(value = "业务表名称", example = "")
    @JsonProperty("table_name")
    private String table_name;
    @ApiModelProperty(value = "业务表描述", example = "")
    @JsonProperty("table_desc")
    private String table_desc;
    @ApiModelProperty(value = "推荐字段列表", example = "",required = true)
    @Size(min = 1,message =  "推荐字段列表"+ Message.MESSAGE_INPUT_NOT_EMPTY)
    @Valid
    @JsonProperty("fields")
    private List<CustomRuleRecFieldsDto> fields;
    @ApiModelProperty(value = "本部门id", example = "部门B")
    @JsonProperty("department_id")
    private String departmentId;
}
