package com.dsg.standardization.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;


@Data
@ApiModel(description = "业务表标准状态")
public class BusinessTableStateVo {

    @ApiModelProperty(value = "业务表字段ID", example = "xxx")
    String businessTableFieldId;

    @ApiModelProperty(value = "待新建标准状态", example = "xxx")
    String state;


}
