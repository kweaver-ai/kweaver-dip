package com.dsg.standardization.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.common.enums
 * @Date: 2022/11/29 15:23
 */
@Getter
@AllArgsConstructor
public enum CatalogTypeEnum {
    Root(0,"根目录"),
    DataElement(1,"数据元"),
    DeDict(2 , "码表"),
    ValueRule(3 , "编码规则"),
    File(4 , "文件"),
    Other(99,"其他类型");
    @EnumValue
    @JsonValue
    private Integer code;
    private String message;
}
