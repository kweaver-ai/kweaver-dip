package com.dsg.standardization.common.enums;


import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.common.enums
 * @Date: 2023/1/11 13:58
 */
@Getter
@AllArgsConstructor
public enum DefaultRuleEnum {
    Num(0, "数字"),
    Char(1, "字符"),
    Time(2, "时间"),
    Date(3, "日期"),
    DateTime(4, "时间日期"),
    Enum(5, "枚举"),
    Encode(6, "编码");
    private Integer code;
    private String message;
}
