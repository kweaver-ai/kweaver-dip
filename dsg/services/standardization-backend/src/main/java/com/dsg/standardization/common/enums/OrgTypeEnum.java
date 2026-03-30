package com.dsg.standardization.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.web.enums
 * @Date: 2022-11-22
 */
@Getter
@AllArgsConstructor
public enum OrgTypeEnum {
    Group(0, "团体标准"),
    Enterprise(1, "企业标准"),
    Industry(2, "行业标准"),
    Provincial(3, "地方标准"),
    National(4, "国家标准"),
    International(5, "国际标准"),
    Foreign(6, "国外标准"),
    Other(99, "其他标准"),
    Unknown(-1, "未知");

    @EnumValue
    @JsonValue
    private Integer code;
    private String message;

    public static OrgTypeEnum getByMessage(String message) {
        OrgTypeEnum[] enums = OrgTypeEnum.values();
        for (OrgTypeEnum en : enums) {
            if (en.getMessage().equals(message)) {
                return en;
            }
        }
        return Unknown;
    }

    public static OrgTypeEnum getByCode(Integer code) {
        OrgTypeEnum[] enums = OrgTypeEnum.values();
        for (OrgTypeEnum en : enums) {
            if (en.getCode().equals(code)) {
                return en;
            }
        }
        return Unknown;
    }
}
