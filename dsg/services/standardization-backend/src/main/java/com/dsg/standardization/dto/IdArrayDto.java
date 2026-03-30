package com.dsg.standardization.dto;

import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.Size;
import java.util.List;

/**
 * 作者: Jie.xu
 * 创建时间：2023/11/7 16:53
 * 功能描述：
 */
@Data
public class IdArrayDto {

    @ApiModelProperty(value = "主键id数组，最大10个",required = true)
    @Size(max = 10, message = "最多10个ID")  // 校验集合长度
    private List<Long> ids;
}
