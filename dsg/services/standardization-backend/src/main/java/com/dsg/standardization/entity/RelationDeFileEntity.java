package com.dsg.standardization.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@Data
@TableName(value = "t_relation_de_file")
public class RelationDeFileEntity {
    private static final long serialVersionUID = 1L;
    /**
     * 唯一标识、雪花算法
     */
    @TableId(value = "f_id", type = IdType.ASSIGN_ID)
    private Long id;


    /**
     * 数据元唯一标识
     */
    @TableField(value = "f_de_id")
    private Long deId;

    /**
     * 文件唯一标识
     */
    @TableField(value = "f_file_id")
    private Long fileId;
}
