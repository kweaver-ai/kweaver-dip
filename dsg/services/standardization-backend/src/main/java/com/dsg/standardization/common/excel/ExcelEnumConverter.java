package com.dsg.standardization.common.excel;

import com.alibaba.excel.converters.Converter;
import com.alibaba.excel.enums.CellDataTypeEnum;
import com.alibaba.excel.metadata.GlobalConfiguration;
import com.alibaba.excel.metadata.data.ReadCellData;
import com.alibaba.excel.metadata.data.WriteCellData;
import com.alibaba.excel.metadata.property.ExcelContentProperty;
import com.dsg.standardization.common.enums.DataTypeEnum;
import com.dsg.standardization.common.enums.OrgTypeEnum;
import com.dsg.standardization.common.util.EnumUtil;


/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.common.convert
 * @Date: 2022/11/24 10:26
 */
public class ExcelEnumConverter implements Converter<Integer> {
    @Override
    public Class<?> supportJavaTypeKey() {
        return Integer.class;
    }

    @Override
    public CellDataTypeEnum supportExcelTypeKey() {
        return CellDataTypeEnum.STRING;
    }

    /**
     * 这里读的时候会调用
     *
     * @param readCellData
     * @return 自定义的值
     */
    @Override
    public Integer convertToJavaData(ReadCellData readCellData, ExcelContentProperty excelContentProperty, GlobalConfiguration globalConfiguration) {
        if(excelContentProperty.getField().getName().equals("dataType")){
            return EnumUtil.getEnumObject(DataTypeEnum.class, s -> s.getMessage().equals(readCellData.getStringValue())).get().getCode();
        }
        if(excelContentProperty.getField().getName().equals("stdType")){
            return EnumUtil.getEnumObject(OrgTypeEnum.class, s -> s.getMessage().equals(readCellData.getStringValue())).get().getCode();
        }
        return 0;
    }

    /**
     * 这里是写的时候会调用
     *
     * @return
     */
    @Override
    public WriteCellData convertToExcelData(Integer cellValue, ExcelContentProperty excelContentProperty, GlobalConfiguration globalConfiguration) {
        String message = "";
        if(excelContentProperty.getField().getName().equals("dataType")){
            message =EnumUtil.getEnumObject(DataTypeEnum.class, dataTypeEnumItem -> dataTypeEnumItem.getCode().equals(cellValue)).get().getMessage();
        }
        if(excelContentProperty.getField().getName().equals("stdType")){
            message = EnumUtil.getEnumObject(OrgTypeEnum.class, enumItem -> enumItem.getCode().equals(cellValue)).get().getMessage();
        }
        return new WriteCellData(message);
    }
}
