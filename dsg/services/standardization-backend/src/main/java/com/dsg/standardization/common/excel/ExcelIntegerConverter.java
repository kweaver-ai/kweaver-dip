package com.dsg.standardization.common.excel;

import com.alibaba.excel.converters.Converter;
import com.alibaba.excel.enums.CellDataTypeEnum;
import com.alibaba.excel.metadata.GlobalConfiguration;
import com.alibaba.excel.metadata.data.ReadCellData;
import com.alibaba.excel.metadata.data.WriteCellData;
import com.alibaba.excel.metadata.property.ExcelContentProperty;
import com.dsg.standardization.common.util.ConvertUtil;


/**
 * @Author: WangZiYu
 * @description: Excel读写整数转化器
 * @Date: 2022/11/23 17:22
 */
public class ExcelIntegerConverter implements Converter<Integer> {
    @Override
    public Class<?> supportJavaTypeKey() {
        return Integer.class;
    }

    @Override
    public CellDataTypeEnum supportExcelTypeKey() {
        return CellDataTypeEnum.NUMBER;
    }

    /**
     * 这里读的时候会调用
     *
     * @param readCellData
     * @return 自定义的值
     */
    @Override
    public Integer convertToJavaData(ReadCellData readCellData, ExcelContentProperty excelContentProperty, GlobalConfiguration globalConfiguration) throws Exception {

        if(readCellData.getType().name().equals(CellDataTypeEnum.NUMBER.name())){
            return ConvertUtil.toInt(readCellData.getNumberValue());
        }

        if(readCellData.getType().name().equals(CellDataTypeEnum.STRING.name())){
            return ConvertUtil.toInt(readCellData.getStringValue());
        }
        return 0;
    }

    /**
     * 这里是写的时候会调用
     *
     * @return
     */
    @Override
    public WriteCellData convertToExcelData(Integer s, ExcelContentProperty excelContentProperty, GlobalConfiguration globalConfiguration) throws Exception {

        return new WriteCellData(ConvertUtil.toBigDecimal(s));
    }
}
