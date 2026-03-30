package com.dsg.standardization.handler;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.ExcelWriter;
import com.alibaba.excel.write.metadata.WriteSheet;
import org.apache.commons.codec.CharEncoding;
import org.springframework.http.HttpHeaders;

import javax.servlet.http.HttpServletResponse;
import java.net.URLEncoder;
import java.util.List;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.web.handler
 * @Date: 2022/11/24 13:54
 */
public class ExcelExportHandler {
    public static final String CONTENT_TYPE_STREAM = "application/octet-stream";

    public static final String CONTENT_DISPOSITION_ATTACHMENT = "attachment;filename=";

    public static <T> void writeKolWithSheet(String fileName, String sheet, List<T> data, Class<T> obj, HttpServletResponse response){
        try{
            //设置响应头类型
            response.setContentType(CONTENT_TYPE_STREAM);
            //设置编码
            response.setCharacterEncoding(CharEncoding.UTF_8);

            fileName = URLEncoder.encode(fileName + ".xlsx","UTF-8");

            //设置响应头
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION, CONTENT_DISPOSITION_ATTACHMENT + fileName);
            ExcelWriter excelWriter = EasyExcel.write(response.getOutputStream()).build();
            WriteSheet writeSheet = writeKolSelectedSheet(obj,0,sheet);
            excelWriter.write(data,writeSheet);
            excelWriter.finish();
        }catch (Exception e){
            e.printStackTrace();
        }
    }

    /**
     * 创建即将导出的sheet页（注册自定义的处理器）
     * @param head 导出的表头信息和配置
     * @param sheetNo sheet索引
     * @param sheetName sheet名称
     * @param <T> 泛型
     * @return sheet页
     */
    public static <T> WriteSheet writeKolSelectedSheet(Class<T> head, Integer sheetNo, String sheetName) {
        return EasyExcel.writerSheet(sheetNo, sheetName)
                .head(head)
//                .registerWriteHandler(new SelectedCellWriteHandler())
                .build();
    }
}
