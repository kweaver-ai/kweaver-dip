package com.dsg.standardization.common.excel;

import cn.afterturn.easypoi.excel.export.styler.ExcelExportStylerDefaultImpl;
import org.apache.poi.ss.usermodel.*;

public class CustomExcelExportStylerImpl extends ExcelExportStylerDefaultImpl {
    public CustomExcelExportStylerImpl(Workbook workbook) {
        super(workbook);
    }

    /**
     * 设置表头格式
     *
     * @param color
     * @return
     */
    @Override
    public CellStyle getHeaderStyle(short color) {
        CellStyle titleStyle = workbook.createCellStyle();
        createBorder(titleStyle);
        titleStyle.setFont(getFont(workbook));
        titleStyle.setAlignment(HorizontalAlignment.LEFT); //水平
        titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        titleStyle.setWrapText(true);
        return titleStyle;
    }

    /**
     * 设置行头
     *
     * @param color
     * @return
     */
    @Override
    public CellStyle getTitleStyle(short color) {
        CellStyle titleStyle = workbook.createCellStyle();
        createBorder(titleStyle);
        titleStyle.setFont(getFont(workbook));
        titleStyle.setAlignment(HorizontalAlignment.CENTER);
        titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        titleStyle.setWrapText(true);
        return titleStyle;
    }


    @Override
    public CellStyle stringSeptailStyle(Workbook workbook, boolean isWarp) {
        CellStyle style = workbook.createCellStyle();
        createBorder(style);
        style.setFont(getFont(workbook));
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setDataFormat(STRING_FORMAT);
        if (isWarp) {
            style.setWrapText(true);
        }
        return style;
    }


    @Override
    public CellStyle stringNoneStyle(Workbook workbook, boolean isWarp) {
        CellStyle style = workbook.createCellStyle();
        createBorder(style);
        style.setFont(getFont(workbook));
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setDataFormat(STRING_FORMAT);
        if (isWarp) {
            style.setWrapText(true);
        }
        return style;
    }


    /**
     * 设置边框
     *
     * @param cellStyle
     */
    private void createBorder(CellStyle cellStyle) {
        cellStyle.setBorderBottom(BorderStyle.THIN);
        cellStyle.setBorderLeft(BorderStyle.THIN);
        cellStyle.setBorderTop(BorderStyle.THIN);
        cellStyle.setBorderRight(BorderStyle.THIN);
    }

    /**
     * 设置字体和大小
     *
     * @param workbook
     */
    private Font getFont(Workbook workbook) {
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 12);
        font.setFontName("微软雅黑");
        return font;
    }
}
