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
public enum RuleCustomTypeEnum {
    DICT(1, "dict"),
    NUMBER(2, "number"),
    ENGLISH_LETTERS(3, "english_letters"),
    CHINESE_CHARACTERS(4, "chinese_characters"),
    ANY_CHARACTERS(5, "any_characters"),
    DATE(6, "date"),
    SPLIT_STR(7, "split_str");


    @EnumValue
    @JsonValue
    private Integer code;
    private String message;

    public static RuleCustomTypeEnum getByMessage(String message) {
        RuleCustomTypeEnum[] enums = RuleCustomTypeEnum.values();
        for (RuleCustomTypeEnum en : enums) {
            if (en.getMessage().equalsIgnoreCase(message)) {
                return en;
            }
        }
        return null;
    }

    public static RuleCustomTypeEnum getByCode(Integer code) {
        RuleCustomTypeEnum[] enums = RuleCustomTypeEnum.values();
        for (RuleCustomTypeEnum en : enums) {
            if (en.getCode().equals(code)) {
                return en;
            }
        }
        return null;
    }
}
