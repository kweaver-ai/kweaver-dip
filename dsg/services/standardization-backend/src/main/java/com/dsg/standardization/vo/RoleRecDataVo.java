package com.dsg.standardization.vo;


import com.dsg.standardization.common.enums.OrgTypeEnum;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;

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
public class RoleRecDataVo implements Serializable {
    private static final long serialVersionUID = 1L;
    @ApiModelProperty(value = "编码规则ID", example = "")
    @JsonProperty("rule_id")
    private String rule_id;
    @ApiModelProperty(value = "编码规则名称", example = "")
    @JsonProperty("rule_name")
    private String rule_name;
    @ApiModelProperty(value = "标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准",
            example = "0", allowableValues = "0,1,2,3,4,5,6,99", dataType = "java.lang.Integer", required = true)
    private OrgTypeEnum orgType;
}


