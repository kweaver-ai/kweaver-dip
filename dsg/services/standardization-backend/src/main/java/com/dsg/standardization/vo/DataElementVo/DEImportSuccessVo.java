package com.dsg.standardization.vo.DataElementVo;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * 导入成功返回
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel(description = "导入成功返回")
public class DEImportSuccessVo {
    @ApiModelProperty(value = "id",dataType = "java.lang.Long")
    private Long id;
    @ApiModelProperty(value = "名称",dataType = "java.lang.Long")
    private String name;

}

