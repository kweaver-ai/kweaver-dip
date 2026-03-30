package com.dsg.standardization.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.common.enums
 * @Date: 2023/1/12 14:36
 */
@Getter
@AllArgsConstructor
public enum DefaultCatalogEnum {
    DataElement(11, "数据元根节点id"),
    Dict(22, "码表根节点id"),
    Rule(33, "编码规则根节点id"),
    File(44, "文件根节点id")
    ;
    private Integer code;
    private String message;
}
