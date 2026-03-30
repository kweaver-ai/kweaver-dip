package com.dsg.standardization.vo;


import com.dsg.standardization.common.enums.EnableDisableStatusEnum;
import com.dsg.standardization.dto.DictDto;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.Date;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel(description = "码表信息")
public class DictVo extends DictDto {

    /**
     * 版本号，规则：1、2逐渐递增。
     */
    @ApiModelProperty(value = "版本号", example = "1")
    private Integer version;

    /**
     * 所属目录id
     */
    @ApiModelProperty(value = "目录名称", example = "/目录一/目录二")
    private String catalogName;


    @ApiModelProperty(value = "启用停用：enable-启用，disable-停用", allowableValues = "enable,disable", example = "enable")
    private EnableDisableStatusEnum state;

    @ApiModelProperty(value = "停用原因", example = "")
    private String disableReason;

    @ApiModelProperty(value = "是否删除：true-已删除 false-未删除", example = "false", allowableValues = "true,false")
    private Boolean deleted;

    @ApiModelProperty(value = "是否被引用,true-已被数据元引用 false-未被引用", example = "false", allowableValues = "true,false")
    private Boolean usedFlag;

    @ApiModelProperty(value = "创建时间", example = "2022-11-21 12:00:00")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private Date createTime;


    @ApiModelProperty(value = "创建用户", example = "XXX")
    private String createUser;

    @ApiModelProperty(value = "更新时间", example = "2022-11-21 12:00:00")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private Date updateTime;


    @ApiModelProperty(value = "修改用户", example = "")
    private String updateUser;

    @ApiModelProperty(value="部门ID",example = "111",dataType = "java.lang.String")
    private String departmentId;

    @ApiModelProperty(value="部门名称",example = "部门A",dataType = "java.lang.String")
    private String departmentName;
    @ApiModelProperty(value="部门路径名称",example = "部门A/部门B",dataType = "java.lang.String")
    private String departmentPathNames;

}
