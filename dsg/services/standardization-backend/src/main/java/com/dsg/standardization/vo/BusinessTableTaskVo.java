package com.dsg.standardization.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;


@Data
@ApiModel
public class BusinessTableTaskVo {
    private static final long serialVersionUID = 1L;

    /**
     * 业务表名称
     */
    @ApiModelProperty(value = "业务表名称", example = "xxx")
    private String businessTableName;

    /**
     * 业务表ID
     */
    @ApiModelProperty(value = "业务表ID", example = "xxx")
    private String businessTableId;

    /**
     * 业务表名称
     */
    @ApiModelProperty(value = "业务表类型", example = "xxx")
    private String businessTableType;

    /**
     * 字段总数
     */
    @ApiModelProperty(value = "字段总数", example = "1")
    private Integer totalNumber;

    /**
     * 已选择数据元数量
     */
    @ApiModelProperty(value = "已选择数据元数量", example = "1")
    private Integer finishNumber;

    /**
     * 已完成未采纳标准字段数
     */
    @ApiModelProperty(value = "已选择数据元数量", example = "1")
    private Integer createNumber;

}
