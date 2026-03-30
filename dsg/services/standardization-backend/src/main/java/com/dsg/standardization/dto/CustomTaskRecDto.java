package com.dsg.standardization.dto;


import com.dsg.standardization.common.constant.Constants;
import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.webfilter.XssFilterDeserializer;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import org.hibernate.validator.constraints.Length;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.Pattern;
import java.io.Serializable;
import java.util.List;

/**
 * AF 标准创建接口请求参数
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-12-20 13:39:40
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel(description = "标准任务信息")
public class CustomTaskRecDto implements Serializable {
    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "业务表名称", example = "")
    @NotBlank(message = "业务表名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
//    @Pattern(regexp = Constants.REGEX_ENGLISH_CHINESE_UNDERLINE_BAR_128, message = "英文名称" + Message.MESSAGE_CHINESE_NUMBER_UNDERLINE_BAR_128)
    @Pattern(regexp = Constants.REGEX_LENGTH_128, message = "表名称" + Message.MESSAGE_128)
//    @Pattern(regexp = Constants.REGEX_NO_SPACE)
//    @JsonDeserialize(using = XssFilterDeserializer.class)
    private String table;

    @ApiModelProperty(value = "业务表描述", example = "")
    @Length(message = "业务表描述长度不能超过1024", max = 1024)
    @JsonProperty("table_description")
    @JsonDeserialize(using = XssFilterDeserializer.class)
    private String tableDescription;

    @ApiModelProperty(value = "部门id", example = "11111")
    @JsonProperty("department_id")
    private String departmentId;

    @ApiModelProperty(value = "表字段列表", example = "")
    @NotEmpty(message = "表字段列表" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @Valid
    @JsonProperty("table_fields")
    List<CustomTbFieldDto> tableFields;
}
