package com.dsg.standardization.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 编码规表推荐
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-11-30 15:11:22
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
public class RoleRecTableDataVo implements Serializable {
    private static final long serialVersionUID = 1L;
    @ApiModelProperty(value = "业务表名称", example = "")
    @JsonProperty("table_name")
    private String table_name;
    @ApiModelProperty(value = "字段列表", example = "")
    @JsonProperty("fields")
    private List<RoleRecFieldsDataVo> fields;


}


