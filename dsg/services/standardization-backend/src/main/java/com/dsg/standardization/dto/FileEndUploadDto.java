package com.dsg.standardization.dto;


import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
public class FileEndUploadDto {


    @ApiModelProperty(value = "docid", example = "abcd222aaa")
    @NotBlank(message = "字段[docid]值不能为空")
    private String docid;


    @ApiModelProperty(value = "rev", example = "")
    @NotBlank(message = "字段[rev]值不能为空")
    private String rev;
    
}
