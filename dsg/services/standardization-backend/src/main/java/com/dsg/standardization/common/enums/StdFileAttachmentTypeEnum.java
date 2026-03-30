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
public enum StdFileAttachmentTypeEnum {
    FILE(0, "FILE"),
    URL(1, "URL");


    @EnumValue
    private Integer code;
    @JsonValue
    private String message;

    public static StdFileAttachmentTypeEnum getByMessage(String message) {
        StdFileAttachmentTypeEnum[] enums = StdFileAttachmentTypeEnum.values();
        for (StdFileAttachmentTypeEnum en : enums) {
            if (en.getMessage().equalsIgnoreCase(message)) {
                return en;
            }
        }
        return null;
    }

    public static StdFileAttachmentTypeEnum getByCode(Integer code) {
        StdFileAttachmentTypeEnum[] enums = StdFileAttachmentTypeEnum.values();
        for (StdFileAttachmentTypeEnum en : enums) {
            if (en.getCode().equals(code)) {
                return en;
            }
        }
        return null;
    }
}
