package com.dsg.standardization.vo.CatalogVo;


import com.dsg.standardization.common.enums.CatalogTypeEnum;
import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;


/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.web.vo.CatalogVo
 * @Date: 2023/11/16 11:33
 */
@Data
@ApiModel(description = "数据元标准目录信息")
public class CatalogInfoVo {
    /**
     * 目录下的数据量
     */
    @ApiModelProperty(value = "目录下的数据量",dataType = "java.lang.Integer")
    private Integer count;

    private static final long serialVersionUID = 1L;

    /**
     * 目录唯一标识
     */
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @ApiModelProperty(value = "目录唯一标识",dataType = "java.lang.Long")
    private Long id;

    /**
     * 目录名称
     */
    @ApiModelProperty(value = "目录名称",dataType = "java.lang.String")
    private String catalogName;

    /**
     * 目录说明
     */
    @ApiModelProperty(value = "目录说明",dataType = "java.lang.String")
    private String description;

    /**
     * 目录级别
     */
    @ApiModelProperty(value = "目录级别",dataType = "java.lang.Integer")
    private Integer level;

    /**
     * 父级标识
     */
    @ApiModelProperty(value = "父级标识",dataType = "java.lang.Long")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Long parentId;

    /**
     *目录类型
     */
    @ApiModelProperty(value = "目录类型",dataType = "java.lang.Integer")
    private CatalogTypeEnum type;

    /**
     * 权限域（目前为预留字段）
     */
    @ApiModelProperty(value = "权限域（目前为预留字段）",dataType = "java.lang.Long")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private String authorityId;
}
