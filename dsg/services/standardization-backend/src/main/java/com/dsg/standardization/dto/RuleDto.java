package com.dsg.standardization.dto;


import com.dsg.standardization.common.constant.Constants;
import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.enums.EnableDisableStatusEnum;
import com.dsg.standardization.common.enums.OrgTypeEnum;
import com.dsg.standardization.common.enums.RuleTypeEnum;
import com.dsg.standardization.common.webfilter.XssFilterDeserializer;
import com.fasterxml.jackson.annotation.*;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import org.hibernate.validator.constraints.Length;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;
import java.io.Serializable;
import java.util.List;

/**
 * 编码规则表
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-11-30 15:46:02
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel(description="编码规则实体")
public class RuleDto implements Serializable {
    private static final long serialVersionUID = 1L;


    @ApiModelProperty(value = "所属目录ID,默认全部目录ID为33", example = "33")
//    @NotNull(message = "所属目录" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @JsonProperty(defaultValue = "33")
    @JsonSetter(nulls = Nulls.SKIP)
    private Long catalogId=33L;
    /**
     * 规则名称
     */
    @ApiModelProperty(value = "规则名称", example = "", required = true)
    @Pattern(regexp = Constants.REGEX_LENGTH_128, message = "规则名称" + Message.MESSAGE_128)
    @NotBlank(message = "规则名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
//    @Pattern(regexp = Constants.REGEX_NO_SPACE)
    @JsonDeserialize(using = XssFilterDeserializer.class)
    private String name;
    /**
     * 规则来源
     */
    @ApiModelProperty(value = "标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准",
            example = "0", allowableValues = "0,1,2,3,4,5,6,99", dataType = "java.lang.Integer", required = true)
    @NotNull(message = "标准分类" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @JsonAlias({"org_type", "orgType"})
    private OrgTypeEnum orgType;

    @ApiModelProperty(value = "规则类型:REGEX-正则表达式 CUSTOM-自定义配置", example = "", required = true)
    @NotNull(message = "规则类型" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @JsonAlias({"rule_type", "ruleType"})
    private RuleTypeEnum ruleType;
    /**
     * 规则详情
     */
    @ApiModelProperty(value = "规则说明,rule_type为REGEX时该字段必填", example = "12222")
    @Length(max = 1024,message = "规则说明最多允许1024个字符")
    private String regex;
    @ApiModelProperty(value = "自定义配置,rule_type为CUSTOM时该字段必填", example = "12222")
    @Size(max = 1024, message = "自定义配置最多允许1024条规则")  // 校验集合长度
    List<RuleCustom> custom;

    /**
     * 备注
     */
    @ApiModelProperty(value = "描述", example = "描述")
    @Length(max = 300,message = "描述最多允许300个字符")
//    @Pattern(regexp = Constants.REGEX_NO_SPACE)
    @JsonDeserialize(using = XssFilterDeserializer.class)
    private String description;

    @ApiModelProperty(value = "标准文件ID数组，最多10个", example = "")
    @Size(max = 10, message = "最多10个标准文件ID")  // 校验集合长度
    List<Long> stdFiles;

    @ApiModelProperty(value = "启用停用：enable-启用，disable-停用", allowableValues = "enable,disable", example = "enable")
    private EnableDisableStatusEnum state;
    @ApiModelProperty(value="部门ID",example = "a/ab",dataType = "java.lang.String")
    private String departmentIds;
}
