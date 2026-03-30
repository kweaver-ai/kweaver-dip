package com.dsg.standardization.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.HashMap;
import java.util.Map;


@Getter
@AllArgsConstructor
public enum BusinessTableStdCreatePoolStateEnum {

    WAITING(0, "待发起"),
    CREATING(1, "进行中"),
    CREATED(2, "已完成未采纳"),
    ADOPTED(3, "已采纳");


    @EnumValue
    private Integer value;
    @JsonValue
    private String message;

    public Integer getValue() {
        return value;
    }

    public String getMessage() {
        return message;
    }


    private static final Map<Integer, BusinessTableStdCreatePoolStateEnum> VALUE_MAP = new HashMap<>();

    static {
        for (BusinessTableStdCreatePoolStateEnum type : BusinessTableStdCreatePoolStateEnum.values()) {
            VALUE_MAP.put(type.value, type);
        }
    }

    public static BusinessTableStdCreatePoolStateEnum of(Integer value) {
        if (VALUE_MAP.containsKey(value)) {
            return VALUE_MAP.get(value);
        }
        throw new IllegalArgumentException("invalid value : " + value);
    }


}
