package com.dsg.standardization.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.dsg.standardization.common.enums.CatalogTypeEnum;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * <p>
 * 数据元目录基本信息表
 * </p>
 *
 * @author WZY
 * @since 2022-11-12
 */
@Data
@TableName(value = "t_de_catalog_info")
@ApiModel(description = "数据标准目录信息")
public class DeCatalogInfo implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 目录唯一标识
     */
    @TableId(value = "f_id", type = IdType.ASSIGN_ID)
    @ApiModelProperty(value = "唯一标识", dataType = "java.lang.String")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Long id;

    /**
     * 目录名称
     */
    @ApiModelProperty(value = "目录名称", dataType = "java.lang.String", required = true)
    @TableField(value = "f_catalog_name")
    private String catalogName;

    /**
     * 目录说明
     */
    @ApiModelProperty(value = "目录说明", dataType = "java.lang.String")
    @TableField(value = "f_description")
    @JsonView(NoShow.class)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private String description;

    /**
     * 目录级别
     */
    @JsonView(Details.class)
    @ApiModelProperty(value = "目录级别", dataType = "java.lang.Integer", required = true)
    @TableField(value = "f_level")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Integer level;

    /**
     * 父级标识
     */
    @JsonView(Details.class)
    @ApiModelProperty(value = "父级标识", dataType = "java.lang.String", required = true)
    @TableField(value = "f_parent_id")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Long parentId;

    /**
     * 目录类型
     */
    @ApiModelProperty(value = "目录类型", notes = "1-数据元，2-码表，3-编码规则，4-文件", dataType = "java.lang.Integer", required = true)
    @TableField(value = "f_type")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private CatalogTypeEnum type;

    /**
     * 权限域（目前为预留字段）
     */
    @ApiModelProperty(value = "权限域（目前为预留字段）")
    @TableField(value = "f_authority_id")
    @JsonView(NoShow.class)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private String authorityId;

    /**
     * 递归子级目录
     */
    @ApiModelProperty(value = "递归子级目录")
    @TableField(exist = false, select = false)
    @JsonView(SonTree.class)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private List<DeCatalogInfo> children;

    /**
     * 判断是否是根目录
     *
     * @return
     */
    public boolean isRootPath() {
        // 根目录的level为1，level不是1不是根目录
        if (level != null && level == 1) {
            return true;
        }
        return false;
    }

    public interface Details {
    }

    public interface NoShow {
    }

    public interface SonTree extends Details {
    }

}
