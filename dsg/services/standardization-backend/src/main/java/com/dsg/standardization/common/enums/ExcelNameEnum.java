package com.dsg.standardization.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.common.enums
 * @Date: 2023/1/11 14:18
 */
@Getter
@AllArgsConstructor
public enum ExcelNameEnum {
    DataElement("DataElementExcelVo", "数据元"),
    Unknown("Unknown", "未知类型");
    private String code;
    private String message;
}
