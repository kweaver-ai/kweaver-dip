package com.dsg.standardization.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;

import java.io.Serializable;
import java.util.Date;

import lombok.Data;

/**
 * 标准创建任务表
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-12-20 13:39:40
 */
@Data
@TableName("t_de_task_std_create")
public class TaskStdCreateEntity implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 主键
     */
    @TableId(value = "f_id", type = IdType.ASSIGN_ID)
    private Long id;

    /**
     * 任务编号
     */
    @TableField(value = "f_task_no")
    private String taskNo;

    /**
     * 业务表名称
     */
    @TableField(value = "f_table")
    private String table;

    /**
     * 业务表描述
     */
    @TableField(value = "f_table_description")
    private String tableDescription;

    /**
     * 表字段名称，多个逗号分隔
     */
    @TableField(value = "f_table_field")
    private String tableField;

    /**
     * 任务状态（0-未处理、 1-处理中、2-处理完成）
     */
    @TableField(value = "f_status")
    private Integer status;

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
     * 创建用户联系方式
     */
    @TableField(value = "f_create_user_phone")
    private String createUserPhone;

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

    /**
     * AF回调地址
     */
    @TableField(value = "f_webhook")
    private String webhook;

}
