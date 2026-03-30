package com.dsg.standardization.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;


@Getter
@AllArgsConstructor
public enum RepeatTypeEnum {
    DE_NAME_CN(1, "数据元中文名称"),
    DE_NAME_EN(2, "数据元英文名称");


    @EnumValue
    private Integer code;
    @JsonValue
    private String message;

    public static RepeatTypeEnum getByMessage(String message) {
        RepeatTypeEnum[] enums = RepeatTypeEnum.values();
        for (RepeatTypeEnum en : enums) {
            if (en.getMessage().equalsIgnoreCase(message)) {
                return en;
            }
        }
        return null;
    }

    public static RepeatTypeEnum getByCode(Integer code) {
        RepeatTypeEnum[] enums = RepeatTypeEnum.values();
        for (RepeatTypeEnum en : enums) {
            if (en.getCode().equals(code)) {
                return en;
            }
        }
        return null;
    }
}
