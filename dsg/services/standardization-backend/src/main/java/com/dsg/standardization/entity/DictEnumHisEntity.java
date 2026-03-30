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
@TableName("t_de_dict_enum_his")
public class DictEnumHisEntity {
    private static final long serialVersionUID = 1L;

    /**
     * 唯一标识
     */
    @TableId(value = "f_id", type = IdType.ASSIGN_ID)
    private Long id;

    /**
     * 码表编码，同一码表不同状态或版本编码相同。
     */

    @TableField("f_code")
    private String code;
    /**
     * 码表中文名称
     */

    @TableField(value = "f_value")
    private String value;

    /**
     * 码表英文名称
     */
    @TableField(value = "f_description")
    private String description;

    /**
     * 业务含义
     */
    @TableField(value = "f_dict_id")
    private Long dictId;


}
