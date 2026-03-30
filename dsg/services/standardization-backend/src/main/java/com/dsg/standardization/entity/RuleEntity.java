package com.dsg.standardization.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.dsg.standardization.common.enums.OrgTypeEnum;
import com.dsg.standardization.common.enums.RuleTypeEnum;
import lombok.Data;

import java.io.Serializable;

/**
 * 编码规则表
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-11-30 14:15:23
 */
@Data
@TableName("t_rule")
public class RuleEntity extends BaseEntity implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 主键
     */
    @TableId(value = "f_id", type = IdType.ASSIGN_ID)
    private Long id;
    /**
     * 规则名称
     */
    @TableField(value = "f_name")
    private String name;

    @TableField(value = "f_catalog_id")
    private Long catalogId;

    @TableField(value = "f_org_type")
    private OrgTypeEnum orgType;

    @TableField(value = "f_description")
    private String description;

    @TableField(value = "f_rule_type")
    private RuleTypeEnum ruleType;

    @TableField(value = "f_expression")
    private String expression;
    @TableField(value = "f_department_ids")
    private String departmentIds;

    @TableField(value = "f_third_dept_id")
    private String thirdDeptId;


}
