package com.dsg.standardization.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.web.enums
 * @Date: 2022/11/22 17:26
 */

/**
 * draft  草稿
 * approval 审批
 * return 退回
 * effect 现行
 * abolition 废止
 * Be replaced 被替换
 */
@Getter
@AllArgsConstructor
public enum EventStatusEnum {
    DRAFT(0, "草稿"),
    APPROVAL(1, "审核中"),
    EFFECT(2, "现行"),
    RETURN(3, "退回"),
    BE_REPLACED(4, "被替代"),
    ABOLITION(5, "废止"),
    UNKNOWN(-1, "未知");

    @EnumValue
    @JsonValue
    private Integer code;
    private String message;

    public static EventStatusEnum getByMessage(String message) {
        EventStatusEnum[] enums = EventStatusEnum.values();
        for (EventStatusEnum en : enums) {
            if (en.getMessage().equals(message)) {
                return en;
            }
        }
        return UNKNOWN;
    }

    public static EventStatusEnum getByCode(Integer code) {
        EventStatusEnum[] enums = EventStatusEnum.values();
        for (EventStatusEnum en : enums) {
            if (en.getCode().equals(code)) {
                return en;
            }
        }
        return UNKNOWN;
    }
}
