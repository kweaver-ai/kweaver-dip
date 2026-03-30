package com.dsg.standardization.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum RuleSourcesEnum {
    SYSTEM_DEFINE(0, "系统内置"),
    USER_DEFINE(1, "用户自定义");

    @EnumValue
    @JsonValue
    private Integer code;
    private String message;


    public static RuleSourcesEnum getByMessage(String message) {
        RuleSourcesEnum[] enums = RuleSourcesEnum.values();
        for (RuleSourcesEnum en : enums) {
            if (en.getMessage().equals(message)) {
                return en;
            }
        }
        return null;
    }

    public static RuleSourcesEnum getByCode(Integer code) {
        RuleSourcesEnum[] enums = RuleSourcesEnum.values();
        for (RuleSourcesEnum en : enums) {
            if (en.getCode().equals(code)) {
                return en;
            }
        }
        return null;
    }
}
