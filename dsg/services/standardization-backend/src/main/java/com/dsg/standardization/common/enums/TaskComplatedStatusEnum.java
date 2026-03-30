package com.dsg.standardization.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum TaskComplatedStatusEnum {

    INIT(0, "未完成"),

    DOING(1, "未完成"),

    DONE(2, "已完成"),
    UNKNOWN(-1, "未知");;

    @EnumValue
    @JsonValue
    private Integer code;
    private String message;

    public static TaskComplatedStatusEnum getByMessage(String message) {
        TaskComplatedStatusEnum[] enums = TaskComplatedStatusEnum.values();
        for (TaskComplatedStatusEnum en : enums) {
            if (en.getMessage().equals(message)) {
                return en;
            }
        }
        return UNKNOWN;
    }

}
