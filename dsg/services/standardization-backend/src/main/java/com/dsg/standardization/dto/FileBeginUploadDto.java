package com.dsg.standardization.dto;


import com.dsg.standardization.common.constant.Constants;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
public class FileBeginUploadDto {


    @ApiModelProperty(value = "file_size", example = "1")
    private Long fileSize;

    /**
     * 码表英文名称
     */
    @ApiModelProperty(value = "file_name", example = "aaa.doc")
    @NotBlank(message = "字段[file_name]值不能为空")
    @Pattern(regexp = Constants.REGEX_STD_FILE_MATCH, message = "字段[file_name]格式错误，只能以.doc、.docx、.pdf、.xlsx、.xls、.txt、.ppt、.pptx结尾")
    private String fileName;


}
