package com.dsg.standardization.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.dsg.standardization.common.enums.EventStatusEnum;
import com.dsg.standardization.common.enums.OrgTypeEnum;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.util.Date;

/**
 * 码表
 *
 * @author 徐杰
 * @date 2022-11-21 14:53:31
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@TableName("t_de_dict_his")
public class DictHisEntity {
    private static final long serialVersionUID = 1L;


    /**
     * 唯一标识
     */
    @TableId(value = "f_id", type = IdType.ASSIGN_ID)
    private Long id;


    /**
     * 码表编码，同一码表不同状态或版本编码相同。
     */
    @TableField(value = "f_code")
    private Long code;
    /**
     * 码表中文名称
     */

    @TableField(value = "f_ch_name")
    private String chName;

    /**
     * 码表英文名称
     */
    @TableField(value = "f_en_name")
    private String enName;

    /**
     * 业务含义
     */
    @TableField(value = "f_description")
    private String description;

    /**
     * 所属目录id
     */
    @TableField(value = "f_catalog_id")
    private Long catalogId;

    /**
     * 版本号，规则：V1、V2逐渐递增。
     */
    @TableField(value = "f_version")
    private String version;

    /**
     * 码表状态（0：草稿，1：审核中，2：现行，3：退回，4：被替代、）
     */
    @TableField(value = "f_status")
    private EventStatusEnum status;


    /**
     * 所属组织类型
     */
    @TableField(value = "f_org_type")
    private OrgTypeEnum orgType;

    /**
     * 权限域（目前为预留字段）
     */
    @TableField(value = "f_authority_id")
    private Long authorityId;

    /**
     * 标准文件关联标识
     */
    @TableField(value = "f_std_file_code")
    private Long stdFileCode;

    /**
     * 创建时间
     */
    @TableField(value = "f_create_time")
    private Date createTime;

    /**
     * 创建用户（ID）
     */
    @TableField(value = "f_create_user")
    private String createUser;

    /**
     * 修改时间
     */
    @TableField(value = "f_update_time")
    private Date updateTime;

    /**
     * 修改用户（ID）
     */
    @TableField(value = "f_update_user")
    private String updateUser;


}
