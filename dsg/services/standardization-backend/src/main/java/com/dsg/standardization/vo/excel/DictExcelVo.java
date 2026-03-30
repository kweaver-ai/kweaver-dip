package com.dsg.standardization.vo.excel;

import cn.afterturn.easypoi.excel.annotation.Excel;
import com.dsg.standardization.common.enums.OrgTypeEnum;
import lombok.Data;
import com.dsg.standardization.vo.BaseExcelVo;

@Data
public class DictExcelVo extends BaseExcelVo {

    @Excel(name = "*中文名称", orderNum = "1", width = 20)
    private String chName;

    @Excel(name = "*英文名称", orderNum = "2", width = 20)
    private String enName;

    @Excel(name = "*标准分类", orderNum = "3", width = 20)
    private String orgTypeMsg;

    @Excel(name = "说明", orderNum = "4", width = 30)
    private String description;

    private OrgTypeEnum orgType;


    @Excel(name = "*码值", width = 20, orderNum = "5")
    private String code;

    @Excel(name = "*码值描述", width = 20, orderNum = "6")
    private String value;

    @Excel(name = "码值说明", width = 20, orderNum = "7")
    private String enumDescription;

}
