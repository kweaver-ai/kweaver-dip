package com.dsg.standardization.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum TaskCreateSourceEnum {

    AF(0, "AF"),

    SYSTEM(1, "system"),

    UNKNOWN(-1, "未知");;

    @EnumValue
    @JsonValue
    private Integer code;
    private String message;

    public static TaskCreateSourceEnum getByMessage(String message) {
        TaskCreateSourceEnum[] enums = TaskCreateSourceEnum.values();
        for (TaskCreateSourceEnum en : enums) {
            if (en.getMessage().equals(message)) {
                return en;
            }
        }
        return UNKNOWN;
    }
}
