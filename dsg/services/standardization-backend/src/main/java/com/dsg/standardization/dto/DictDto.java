package com.dsg.standardization.dto;


import com.dsg.standardization.common.constant.Constants;
import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.enums.EnableDisableStatusEnum;
import com.dsg.standardization.common.enums.OrgTypeEnum;
import com.dsg.standardization.common.webfilter.XssFilterDeserializer;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import org.hibernate.validator.constraints.Length;
import com.dsg.standardization.vo.DictEnumVo;

import javax.validation.Valid;
import javax.validation.constraints.*;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel(description="码表实体")
public class DictDto {

    /**
     * 唯一标识
     */
    @ApiModelProperty(value = "唯一标识", dataType = "java.lang.String")
    private Long id;

    @ApiModelProperty(value = "码值", dataType = "java.lang.String")
    private Long code;

    /**
     * 码表中文名称
     */
    @ApiModelProperty(value = "中文名称", example = "性别", dataType = "java.lang.String", required = true)
    @Pattern(regexp = Constants.REGEX_LENGTH_128, message = "中文名称" + Message.MESSAGE_128)
//    @Pattern(regexp = Constants.REGEX_NO_SPACE)
    @NotBlank(message = "中文名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @JsonDeserialize(using = XssFilterDeserializer.class)
    private String chName;

    /**
     * 码表英文名称
     */
    @ApiModelProperty(value = "英文名称", example = "sex", dataType = "java.lang.String", required = true)
    @Pattern(regexp = Constants.REGEX_ENGLISH_UNDERLINE_BAR_128, message = "英文名称" + Message.MESSAGE_ENGLISH_NUMBER_UNDERLINE_BAR_128)
    @NotBlank(message = "英文名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private String enName;

    /**
     * 业务含义
     */
    @ApiModelProperty(value = "说明", example = "字典说明", dataType = "java.lang.String")
    @Length(max = 300)
//    @Pattern(regexp = Constants.REGEX_NO_SPACE)
    @JsonDeserialize(using = XssFilterDeserializer.class)
    private String description;

    /**
     * 所属目录id
     */
    @ApiModelProperty(value = "目录ID，默认全部目录ID为22", example = "22", dataType = "java.lang.String")
//    @NotNull(message = "目录" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @JsonProperty(defaultValue = "22")
    @JsonSetter(nulls = Nulls.SKIP)
    private Long catalogId=22L;

    /**
     * 所属组织类型
     */
    @ApiModelProperty(value = "标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准",
            example = "0", allowableValues = "0,1,2,3,4,5,6,99", dataType = "java.lang.Integer", required = true)
    @NotNull(message = "标准分类" + Message.MESSAGE_INPUT_NOT_EMPTY + "或者参数值不正确")
    private OrgTypeEnum orgType;

    /**
     * 标准文件关联标识
     */
    @ApiModelProperty(value = "标准文件id数组，最多10个")
    @Size(max = 10, message = "最多10个标准文件ID")  // 校验集合长度
    private List<Long> stdFiles;


    @ApiModelProperty(value = "码值和描述列表", required = true)
    @NotEmpty(message = "码值和描述列表" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @Valid
    private List<DictEnumVo> enums;

    @ApiModelProperty(value = "启用停用：enable-启用，disable-停用", allowableValues = "enable,disable", example = "enable")
    private EnableDisableStatusEnum state;
    @ApiModelProperty(value="部门ID",example = "a/ab",dataType = "java.lang.String")
    private String departmentIds;
}
