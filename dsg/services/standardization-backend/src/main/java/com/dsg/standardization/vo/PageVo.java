package com.dsg.standardization.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@ApiModel(description = "分页信息")
public class PageVo {
    @ApiModelProperty(value = "分页页码，默认1", example = "1",dataType = "java.lang.Integer")
    private Integer offset;
    @ApiModelProperty(value = "条数，默认20", example = "20",dataType = "java.lang.Integer")
    private Integer limit;


}
