package com.dsg.standardization.dto;


import com.dsg.standardization.common.enums.RuleCustomTypeEnum;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * 作者: Jie.xu
 * 创建时间：2023/11/8 17:41
 * 功能描述：
 */
@Data
@ApiModel(description="自定义编码规则实体")
public class RuleCustom {

    @ApiModelProperty(value = "分段长度", example = "4",required = true)
    int segment_length;

    @ApiModelProperty(value = "名称", example = "a")
    String name;

    @ApiModelProperty(value = "自定义规则类型：1-码表 2-数字 3-英文字母 4-汉字 5-任意字符 6-日期 7-分割字符串",
            example = "1", allowableValues = "1,2,3,4,5,6,7", dataType = "java.lang.Integer",required = true)
    RuleCustomTypeEnum type;

    @ApiModelProperty(value = "值", example = "1",required = true)
    String value;
}
