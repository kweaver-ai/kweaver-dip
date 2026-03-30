package com.dsg.standardization.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.dsg.standardization.common.enums.OrgTypeEnum;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.io.Serializable;

/**
 * 码表
 *
 * @author 徐杰
 * @date 2022-11-21 14:53:31
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@TableName("t_de_dict")
public class DictEntity extends BaseEntity implements Serializable {
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
     * 所属组织类型
     */
    @TableField(value = "f_org_type")
    private OrgTypeEnum orgType;

    @TableField(value = "f_department_ids")
    private String departmentIds;

    @TableField(value = "f_third_dept_id")
    private String thirdDeptId;
}
