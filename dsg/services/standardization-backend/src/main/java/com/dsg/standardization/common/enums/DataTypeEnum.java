package com.dsg.standardization.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.web.enums
 * @Date: 2022/11/22 17:24
 */
@Getter
@AllArgsConstructor
public enum DataTypeEnum {
    Number(0,"数字型"),
    Char(1 , "字符型"),
    Date(2 , "日期型"),
    DateTime(3 , "日期时间型"),
//    TImeStamp(4 , "时间戳型"), //合并到日期型
    Bool(5,"布尔型"),
//    Binary(6,"二进制"),
    Decimal(7,"高精度型"),
    Float(8,"小数型"),
    Time(9,"时间型"),
    INT(10,"整数型"),
    Other(99,"其他类型"),
    Unknown(-1,"未知类型");
    @EnumValue
    @JsonValue
    private Integer code;
    private String message;
}
