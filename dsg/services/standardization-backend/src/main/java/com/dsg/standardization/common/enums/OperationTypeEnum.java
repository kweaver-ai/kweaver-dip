package com.dsg.standardization.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.common.enums
 * @Date: 2023/1/12 14:36
 */
@Getter
@AllArgsConstructor
public enum OperationTypeEnum {
    Delete(0, "删除"),
    Update(1, "修改")
    ;
    private Integer code;
    @EnumValue
    @JsonValue
    private String message;
}
