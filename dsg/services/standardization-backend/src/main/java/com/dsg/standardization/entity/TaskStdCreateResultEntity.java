package com.dsg.standardization.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;

/**
 * 标准创建任务结果表
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-12-20 13:39:40
 */
@Data
@TableName("t_de_task_std_create_result")
public class TaskStdCreateResultEntity implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 主键
     */
    @TableId(value = "f_id", type = IdType.ASSIGN_ID)
    private Long id;

    /**
     * 标准推荐任务id
     */
    @TableField(value = "f_task_id")
    private Long taskId;

    /**
     * 表字段名称
     */
    @TableField(value = "f_table_field")
    private String tableField;

    /**
     * 表字段描述
     */
    @TableField(value = "f_table_field_description")
    private String tableFieldDescription;

    /**
     * 参考标准文件
     */
    @TableField(value = "f_std_ref_file")
    private String stdRefFile;

    /**
     * 标准编码
     */
    @TableField(value = "f_std_code")
    private String stdCode;


    /**
     * 推荐算法结果标准编码，多个逗号分割
     */
    @TableField(value = "f_rec_std_code")
    private String recStdCodes;


    /**
     * 标准中文名称
     */
    @TableField(value = "f_std_ch_name")
    private String stdChName;

    /**
     * stdCode
     */
    @TableField(value = "f_std_en_name")
    private String stdEnName;

}
