package com.dsg.standardization.dto;

import com.dsg.standardization.common.constant.Message;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import org.hibernate.validator.constraints.Length;

import javax.validation.constraints.NotBlank;


@Data
public class CustomTbFieldDto<T> {
    @ApiModelProperty(value = "表字段名称", example = "")
    @NotBlank(message = "表字段名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
//    @Pattern(regexp = Constants.REGEX_ENGLISH_CHINESE_UNDERLINE_BAR_128, message = "表字段名称" + Message.MESSAGE_CHINESE_NUMBER_UNDERLINE_BAR_128)
    @Length(message = "表字段名称", max = 255)
    @JsonProperty("table_field")
    private String tableField;

    @ApiModelProperty(value = "表字段名称描述", example = "")
    @Length(message = "表字段名称描述长度不能超过1024", max = 1024)
    @JsonProperty("table_field_description")
    private String tableFieldDescription;

    @ApiModelProperty(value = "参考文件", example = "")
    @Length(message = "参考文件长度不能超过1024", max = 1024)
    @JsonProperty("std_ref_file")
    private String stdRefFile;

    @ApiModelProperty(value = "推荐的标准列表", example = "")
    @JsonProperty("rec_stds")
    private T recStds;
}
