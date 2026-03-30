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

@Getter
@AllArgsConstructor
public enum FileStatusEnum {
	EFFECT(0, "现行"),
    READYEXECUTE(1, "即将实施"),
    BE_REPLACED(2, "被替代"),
    ABOLITION(3, "废止");

    @EnumValue
    @JsonValue
    private Integer code;
    private String message;

    public static FileStatusEnum getByMessage(String message) {
        FileStatusEnum[] enums = FileStatusEnum.values();
        for (FileStatusEnum en : enums) {
            if (en.getMessage().equals(message)) {
                return en;
            }
        }
        return null;
    }

    public static FileStatusEnum getByCode(Integer code) {
        FileStatusEnum[] enums = FileStatusEnum.values();
        for (FileStatusEnum en : enums) {
            if (en.getCode().equals(code)) {
                return en;
            }
        }
        return null;
    }
}
