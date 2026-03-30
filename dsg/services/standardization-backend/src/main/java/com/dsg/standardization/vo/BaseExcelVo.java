package com.dsg.standardization.vo;

import cn.afterturn.easypoi.excel.annotation.Excel;
import cn.afterturn.easypoi.handler.inter.IExcelDataModel;
import cn.afterturn.easypoi.handler.inter.IExcelModel;
import com.dsg.standardization.common.constant.Constants;


public class BaseExcelVo implements IExcelDataModel, IExcelModel {


    @Excel(name = "编号", orderNum = "0")
    private Integer rowNum;

    @Excel(name = "错误描述", orderNum = "99")
    private String errorMsg;

    @Override
    public String getErrorMsg() {
        return errorMsg;
    }

    @Override
    public void setErrorMsg(String errorMsg) {
        this.errorMsg = errorMsg;
    }

    @Override
    public Integer getRowNum() {
        return rowNum;
    }

    @Override
    public void setRowNum(Integer rowNum) {
        // 因为表头占用了3行，需要需要减去表头占据的2行。
        this.rowNum = rowNum - Constants.EXCEL_TITLE_ROW_COUNT;

    }


}
