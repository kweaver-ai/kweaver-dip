package com.dsg.standardization.vo;


import com.dsg.standardization.common.enums.EnableDisableStatusEnum;
import com.dsg.standardization.common.enums.OrgTypeEnum;
import com.dsg.standardization.common.enums.StdFileAttachmentTypeEnum;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;


/**
 * 标准文件管理表
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-12-06 16:53:03
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel(description = "数据元、编码规则和码表与文件关联信息")
public class StdFileMgrVo implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 主键
     */
    @ApiModelProperty(value = "主键", example = "")
    private Long id;
    /**
     * 标准编号 例如DB3502/T 035-2022
     */
    @ApiModelProperty(value = "标准编号 例如DB3502/T 035-2022", example = "")
    private String number;
    /**
     * 标准名称
     */
    @ApiModelProperty(value = "标准文件名称", example = "")
    private String name;

    /**
     * 所属目录id
     */
    @ApiModelProperty(value = "所属目录id", example = "")
    private Long catalogId;

    @ApiModelProperty(value = "所属目录", example = "")
    private String catalogName;


    @ApiModelProperty(value = "版本号")
    private Integer version;

    @ApiModelProperty(value = "实施时间", example = "2022-11-21")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd")
    private Date actDate;

    @ApiModelProperty(value = "发布时间", example = "2022-11-21")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd")
    private Date publishDate;

    @ApiModelProperty(value = "停用时间", example = "2022-11-21")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd")
    private Date disableDate;

    @ApiModelProperty(value = "启用停用：enable-启用，disable-停用", allowableValues = "enable,disable", example = "enable")
    private EnableDisableStatusEnum state;

    @ApiModelProperty(value = "停用原因", example = "")
    private String disableReason;

    @ApiModelProperty(value = "标准文件附件类型：URL-外置连接，FILE-文件附件", example = "FILE")
    private StdFileAttachmentTypeEnum attachmentType;

    @ApiModelProperty(value = "标准文件URL", example = "")
    private String attachmentUrl;

    @ApiModelProperty(value = "标准文件附件名称", example = "")
    private String fileName;

    @ApiModelProperty(value = "标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准",
            example = "0", allowableValues = "0,1,2,3,4,5,6,99", dataType = "java.lang.Integer")
    private OrgTypeEnum orgType;

    @ApiModelProperty(value = "说明", example = "")
    private String description;

    @ApiModelProperty(value = "是否删除：true-已删除，false-未删除", example = "false")
    private Boolean deleted;

    @ApiModelProperty(value = "创建时间", example = "2022-11-21 12:00:00")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private Date createTime;

    /**
     * 创建用户（ID）
     */
    @ApiModelProperty(value = "创建用户", example = "2022-11-21 12:00:00")
    private String createUser;

    /**
     * 更新时间
     */
    @ApiModelProperty(value = "更新时间", example = "2022-11-21 12:00:00")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private Date updateTime;

    /**
     * 修改用户（ID）
     */
    @ApiModelProperty(value = "修改用户", example = "")
    private String updateUser;
    @ApiModelProperty(value="部门ID",example = "111",dataType = "java.lang.String")
    private String departmentId;

    @ApiModelProperty(value="部门名称",example = "部门A",dataType = "java.lang.String")
    private String departmentName;

    @ApiModelProperty(value="部门IDs",example = "a/bb",dataType = "java.lang.String")
    private String departmentIds;
    @ApiModelProperty(value="部门路径名称",example = "部门A/部门B",dataType = "java.lang.String")
    private String departmentPathNames;
}
