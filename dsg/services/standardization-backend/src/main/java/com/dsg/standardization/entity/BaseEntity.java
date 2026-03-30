package com.dsg.standardization.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.dsg.standardization.common.enums.EnableDisableStatusEnum;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.Date;

/**
 * 作者: Jie.xu
 * 创建时间：2023/11/9 14:05
 * 功能描述：
 */

@Data
public class BaseEntity {

    @ApiModelProperty(value = "启用停用：enable-启用，disable-停用", allowableValues = "enable,disable", example = "enable")
    @TableField(value = "f_state")
    private EnableDisableStatusEnum state;

    @ApiModelProperty(value = "停用理由", dataType = "java.lang.String")
    @TableField(value = "f_disable_reason")
    private String disableReason;


    @ApiModelProperty(value = "版本号", dataType = "java.lang.Integer")
    @TableField(value = "f_version")
    private Integer version;

    /**
     * 是否删除标记  0-未删除，其他值-已删除
     */
    @ApiModelProperty(value = "删除标志id，0-未删除，其他值-已删除", dataType = "java.lang.Boolean",hidden = true)
    @TableField(value = "f_deleted")
    private Boolean deleted;

    @ApiModelProperty(hidden = true)
    @TableField(value = "f_authority_id")
    @JsonIgnore
    private String authorityId;

    /**
     * 创建时间
     */
    @TableField(value = "f_create_time")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private Date createTime;

    /**
     * 创建用户（ID）
     */
    @ApiModelProperty(hidden = true)
    @TableField(value = "f_create_user")
    private String createUser;

    /**
     * 修改时间
     */
    @TableField(value = "f_update_time")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private Date updateTime;

    /**
     * 修改用户（ID）
     */
    @ApiModelProperty(hidden = true)
    @TableField(value = "f_update_user")
    private String updateUser;


    /**
     * @return 删除标志id，0-未删除，其他值-已删除)
     */
    @JsonIgnore
    public Boolean isDelete() {
        if (null != deleted && deleted == true) {
            return true;
        }
        return false;
    }
}
