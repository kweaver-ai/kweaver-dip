package com.dsg.standardization.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 作者: Jie.xu
 * 创建时间：2023/11/3 17:07
 * 功能描述：
 */
@Getter
@AllArgsConstructor
public enum RuleTypeEnum {
    REGEX(0, "REGEX"), //正则
    CUSTOM(1, "CUSTOM"); //自定义


    @EnumValue
    private Integer code;
    @JsonValue
    private String message;

    public static RuleTypeEnum getByMessage(String message) {
        RuleTypeEnum[] enums = RuleTypeEnum.values();
        for (RuleTypeEnum en : enums) {
            if (en.getMessage().equalsIgnoreCase(message)) {
                return en;
            }
        }
        return null;
    }

    public static RuleTypeEnum getByCode(Integer code) {
        RuleTypeEnum[] enums = RuleTypeEnum.values();
        for (RuleTypeEnum en : enums) {
            if (en.getCode().equals(code)) {
                return en;
            }
        }
        return null;
    }
}
