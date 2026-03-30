package com.dsg.standardization.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum EnableDisableStatusEnum {
    DISABLE(0, "disable"),
    ENABLE(1, "enable"),
    Unknown(-1, "未知");

    @EnumValue
    private Integer code;
    @JsonValue
    private String message;

    public static EnableDisableStatusEnum getByMessage(String message) {
        EnableDisableStatusEnum[] enums = EnableDisableStatusEnum.values();
        for (EnableDisableStatusEnum en : enums) {
            if (en.getMessage().equalsIgnoreCase(message)) {
                return en;
            }
        }
        return Unknown;
    }

    public static EnableDisableStatusEnum getByCode(Integer code) {
        EnableDisableStatusEnum[] enums = EnableDisableStatusEnum.values();
        for (EnableDisableStatusEnum en : enums) {
            if (en.getCode().equals(code)) {
                return en;
            }
        }
        return Unknown;
    }
}
