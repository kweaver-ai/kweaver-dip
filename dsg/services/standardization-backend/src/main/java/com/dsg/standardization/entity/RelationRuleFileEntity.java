package com.dsg.standardization.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

/**
 * 码表
 *
 * @author 徐杰
 * @date 2022-11-21 14:53:31
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@TableName("t_relation_rule_file")
public class RelationRuleFileEntity {
    private static final long serialVersionUID = 1L;


    /**
     * 唯一标识
     */
    @TableId(value = "f_id", type = IdType.ASSIGN_ID)
    private Long id;

    @TableField(value = "f_rule_id")
    private Long ruleId;

    @TableField(value = "f_file_id")
    private Long fileId;
}
