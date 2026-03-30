package com.dsg.standardization.vo.DataElementVo;


import com.dsg.standardization.common.enums.DataTypeEnum;
import com.dsg.standardization.common.enums.OrgTypeEnum;
import lombok.Data;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.web.vo.DataElementVo 判断版本变更的关键属性
 * @Date: 2022/12/18 14:10
 */
@Data
public class DataElementCompareVo {
    private String nameCn;

    private String nameEn;

    private String synonym;

    private DataTypeEnum dataType;

    private OrgTypeEnum stdType;

    private Integer dataLength;

    private Integer dataPrecision;

    private String description;
}
