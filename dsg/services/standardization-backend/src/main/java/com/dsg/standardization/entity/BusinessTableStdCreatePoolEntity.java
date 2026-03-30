package com.dsg.standardization.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.util.Date;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.db.entity
 * @Date: 2024/1/16 16:32
 */

@Data
@TableName("t_business_table_std_create_pool")
public class BusinessTableStdCreatePoolEntity {
    private static final long serialVersionUID = 1L;

    /**
     * 唯一标识
     */
    @TableId(value = "f_id", type = IdType.ASSIGN_ID)
    private Long id;


    /**
     * 业务表模型ID
     */
    @TableField(value = "f_business_table_model_id")
    private String businessTableModelId;

    /**
     * 业务表名称
     */
    @TableField(value = "f_business_table_name")
    private String businessTableName;


    /**
     * 业务表ID
     */
    @TableField(value = "f_business_table_id")
    private String businessTableId;

    /**
     * 业务表类型
     */
    @TableField(value = "f_business_table_type")
    private String businessTableType;

    /**
     * 业务表字段ID
     */
    @TableField(value = "f_business_table_field_id")
    private String businessTableFieldId;


    /**
     * 业务表字段当前名称
     */
    @TableField(value = "f_business_table_field_current_name")
    private String businessTableFieldCurrentName;

    /**
     * 业务表字段原始名称
     */
    @TableField(value = "f_business_table_field_origin_name")
    private String businessTableFieldOriginName;

    /**
     * 业务表字段当前英文名称
     */
    @TableField(value = "f_business_table_field_current_name_en")
    private String businessTableFieldCurrentNameEn;


    /**
     * 业务表字段原始英文名称
     */
    @TableField(value = "f_business_table_field_origin_name_en")
    private String businessTableFieldOriginNameEn;

    /**
     * 业务表字段当前标准分类
     */
    @TableField(value = "f_business_table_field_current_std_type")
    private String businessTableFieldCurrentStdType;

    /**
     * 业务表字段原始标准分类
     */
    @TableField(value = "f_business_table_field_origin_std_type")
    private String businessTableFieldOriginStdType;


    /**
     * 数据类型
     */
    @TableField(value = "f_business_table_field_data_type")
    private String businessTableFieldDataType;


    /**
     * 数据长度
     */
    @TableField(value = "f_business_table_field_data_length",updateStrategy = FieldStrategy.IGNORED)
    private Integer businessTableFieldDataLength;


    /**
     * 数据精度
     */
    @TableField(value = "f_business_table_field_data_precision", updateStrategy = FieldStrategy.IGNORED)
    private Integer businessTableFieldDataPrecision;


    /**
     * 码表名称
     */
    @TableField(value = "f_business_table_field_dict_name")
    private String businessTableFieldDictName;

    /**
     * 编码规则名称
     */
    @TableField(value = "f_business_table_field_rule_name")
    private String businessTableFieldRuleName;

    /**
     * 业务表字段描述
     */
    @TableField(value = "f_business_table_field_description")
    private String businessTableFieldDescription;

    /**
     * 状态：0-待发起，1-进行中，2-已完成
     */
    @TableField(value = "f_state")
    private Integer state;

    /**
     * 任务ID
     */
    @TableField(value = "f_task_id")
    private String taskId;

    /**
     * 数据元ID
     */
    @TableField(value = "f_data_element_id")
    private Long dataElementId;

    /**
     * 创建时间
     */
    @TableField(value = "f_create_time")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
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
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private Date updateTime;

    /**
     * 修改用户（ID）
     */
    @TableField(value = "f_update_user")
    private String updateUser;


}
