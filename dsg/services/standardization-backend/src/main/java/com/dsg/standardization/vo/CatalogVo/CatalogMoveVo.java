package com.dsg.standardization.vo.CatalogVo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.web.vo
 * @Date: 2022/12/5 23:35
 */
@Data
@ApiModel(description = "标准目录转移")
public class CatalogMoveVo {
    @ApiModelProperty(value = "标准目录ID", dataType = "java.lang.Long")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Long catalog_id;
}
