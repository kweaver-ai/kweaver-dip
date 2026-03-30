package com.dsg.standardization.vo;


import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
@Data
@ApiModel(description = "标准文件统计")
public class FileCountVo {
    @ApiModelProperty(value = "文件ID", dataType = "java.lang.Long")
    private Long fileId;
    @ApiModelProperty(value = "文件名称", dataType = "java.lang.String")
    private String fileName;
    @ApiModelProperty(value = "文件统计", dataType = "java.lang.Integer")
    private Integer fileCount;
    @ApiModelProperty(value = "标准目录ID", dataType = "java.lang.Long")
    private Long catalogId;
}
