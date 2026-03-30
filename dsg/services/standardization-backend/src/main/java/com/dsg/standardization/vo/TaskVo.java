package com.dsg.standardization.vo;


import com.dsg.standardization.dto.TaskDto;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;


/**
 * 标准创建任务表
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-12-20 13:39:40
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
public class TaskVo extends TaskDto implements Serializable {
    private static final long serialVersionUID = 1L;


    @ApiModelProperty(value = "已关联数据元字段数", example = "")
    private Integer relationField;

    @ApiModelProperty(value = "字段总数", example = "")
    private Integer totalField;

    /**
     * 创建时间
     */
    @ApiModelProperty(value = "创建时间", example = "")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private Date createTime;
    /**
     * 创建用户（ID）
     */
    @ApiModelProperty(value = "创建用户（ID）", example = "")
    private String createUser;
    /**
     * 创建用户联系方式
     */
    @ApiModelProperty(value = "创建用户联系方式", example = "")
    private String createUserPhone;
    /**
     * 修改时间
     */
    @ApiModelProperty(value = "修改时间", example = "")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private Date updateTime;
    /**
     * 修改用户（ID）
     */
    @ApiModelProperty(value = "修改用户（ID）", example = "")
    private String updateUser;


}
