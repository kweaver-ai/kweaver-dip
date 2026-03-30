package com.dsg.standardization.common.util;

import cn.afterturn.easypoi.excel.ExcelImportUtil;
import cn.afterturn.easypoi.excel.annotation.Excel;
import cn.afterturn.easypoi.excel.entity.ExportParams;
import cn.afterturn.easypoi.excel.entity.ImportParams;
import cn.afterturn.easypoi.excel.entity.enmus.ExcelType;
import cn.afterturn.easypoi.excel.entity.result.ExcelImportResult;
import cn.afterturn.easypoi.excel.entity.result.ExcelVerifyHandlerResult;
import cn.afterturn.easypoi.handler.inter.IExcelVerifyHandler;
import cn.afterturn.easypoi.util.PoiPublicUtil;
import cn.hutool.core.util.ObjectUtil;
import com.dsg.standardization.common.constant.Constants;
import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.enums.ErrorCodeEnum;
import com.dsg.standardization.common.excel.CustomExcelExportStylerImpl;
import com.dsg.standardization.common.exception.CustomException;
import com.google.common.collect.Sets;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.time.DateFormatUtils;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.tomcat.util.http.fileupload.IOUtils;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import com.dsg.standardization.vo.BaseExcelVo;

import javax.servlet.http.HttpServletResponse;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.reflect.Field;
import java.net.URLEncoder;
import java.util.*;

@Slf4j
public class ExcelUtil {


    /**
     * excel导出
     *
     * @param response
     * @param exportList 需要导出的数据列表
     * @param cls        需要导出数据格式的POJO
     */
    public static <T> void downLoadExcel(HttpServletResponse response, List<T> exportList, Class<T> cls) {
        downLoadExcel(response, exportList, cls, null, false);

    }

    /**
     * excel导出
     *
     * @param response
     * @param exportList 需要导出的数据列表
     * @param cls        需要导出数据格式的POJO
     * @param title      表格标题
     * @param <T>
     */
    public static <T> void downLoadExcel(HttpServletResponse response, List<T> exportList, Class<T> cls, String title) {
        downLoadExcel(response, exportList, cls, title, false);

    }


    /**
     * @param response
     * @param exportList        需要导出的数据列表
     * @param cls               需要导出数据格式的POJO
     * @param exportErrorColmun 是否导出错误信息列
     * @param <T>
     */
    public static <T> void downLoadExcel(HttpServletResponse response, List<T> exportList, Class<T> cls, String title, Boolean exportErrorColmun) {
        downLoadExcel(response, exportList, cls, title, exportErrorColmun, cls.getSimpleName());

    }


    /**
     * @param response
     * @param exportList        需要导出的数据列表
     * @param cls               需要导出数据格式的POJO
     * @param exportErrorColmun 是否导出错误信息列
     * @param <T>
     */

    public static <T> void downLoadExcel(HttpServletResponse response, List<T> exportList, Class<T> cls, String title, Boolean exportErrorColmun, String excelName) {

        ExportParams exportParams = new ExportParams();
        exportParams.setType(ExcelType.XSSF);
        exportParams.setSheetName(excelName);
        exportParams.setStyle(CustomExcelExportStylerImpl.class);
        if (null != title) {
            exportParams.setTitle(title);
            exportParams.setSecondTitle("");
        }
        Workbook workbook = exportExcel(exportParams, cls, exportList, exportErrorColmun);
        if (null != title) {
            Sheet sheet = workbook.getSheetAt(0);
            if (!StringUtils.isBlank(excelName)) {
                workbook.setSheetName(0, excelName);
            }
            sheet.getRow(0).setHeightInPoints(200);
        }
        String fileName = String.format("%s_%s.xlsx", excelName, DateFormatUtils.format(new Date(), "yyyyMMddHHmmss"));
        if (exportErrorColmun) {
            fileName = String.format("导入失败_%s_%s.xlsx", excelName, DateFormatUtils.format(new Date(), "yyyyMMddHHmmss"));
        }
        ExcelUtil.downLoadExcel(response, fileName, workbook);
    }

    public static Workbook exportExcel(ExportParams entity, Class<?> pojoClass,
                                       Collection<?> dataSet, Boolean exportErrorColmun) {
        Workbook workbook = getWorkbook(entity.getType(), dataSet.size());
        new CustomExcelExportService().createSheet(workbook, entity, pojoClass, dataSet, exportErrorColmun);
        return workbook;
    }

    private static Workbook getWorkbook(ExcelType type, int size) {
        if (ExcelType.HSSF.equals(type)) {
            return new HSSFWorkbook();
        } else if (size < 100000) {
            return new XSSFWorkbook();
        } else {
            return new SXSSFWorkbook();
        }
    }

    public static <T> ExcelImportResult<T> importExcel(MultipartFile file, Class<T> cls, ImportParams params) {
        ExcelImportResult<T> result = null;
        long start = System.currentTimeMillis();
        try {
            result = ExcelImportUtil.importExcelMore(file.getInputStream(), cls, params);
        } catch (Exception e) {
            log.error("excel 导入失败：", e);
            throw new CustomException(ErrorCodeEnum.PARTAIL_FAILURE, "文件内容与模板不符", null, "请检查excel格式是否正确");
        }

        log.info("读取文件[{}]耗时{}毫秒", file.getOriginalFilename(), System.currentTimeMillis() - start);

        checkExcelTitle(cls, result);

        List<T> errorList = new ArrayList<>();
        errorList.addAll(result.getFailList());

        List<T> successList = new ArrayList<>();
        for (T row : result.getList()) {
            BaseExcelVo vo = (BaseExcelVo) row;
            if (StringUtils.isEmpty(vo.getErrorMsg())) {
                successList.add(row);
            } else {
                errorList.add(row);
            }
        }
        result.getList().clear();
        result.getList().addAll(successList);
        result.getFailList().clear();
        result.getFailList().addAll(errorList);
        return result;
    }

    /**
     * 检查表头内容，是否匹配配置的模板必填项
     *
     * @param <T>
     * @param cls
     * @param result
     */
    private static <T> void checkExcelTitle(Class<T> cls, ExcelImportResult<T> result) {
        Row tableTitle = result.getWorkbook().getSheetAt(0).getRow(Constants.EXCEL_TITLE_ROW_COUNT);
        Field[] fileds = PoiPublicUtil.getClassFields(cls);
        Set<String> titles = Sets.newHashSet();
        for (Cell cell : tableTitle) {


            titles.add(new DataFormatter().formatCellValue(cell));
        }
        for (Field field : fileds) {
            String name = "";
            if (PoiPublicUtil.isJavaClass(field)) {
                Excel excel = field.getAnnotation(Excel.class);
                if(excel == null){
                    continue;
                }
                name = PoiPublicUtil.getValueByTargetId(excel.name(), null, null);
                if (StringUtils.isNoneEmpty(excel.groupName())) {
                    name = excel.groupName() + "_" + name;
                }
            }
            if (name.startsWith("*")) {
                if (!titles.contains(name)) {
                    throw new CustomException(ErrorCodeEnum.PARTAIL_FAILURE, "文件内容与模板不符", null, "请检查excel格式是否正确");
                }
            }
        }
    }

    public static <T> ExcelImportResult<T> importExcel(MultipartFile file, Class<T> cls) {
//        ImportParams params = new ImportParams();
//        params.setTitleRows(Constants.EXCEL_TITLE_ROW_COUNT); // 标题占用行数，不是标题开始的行数（从第1开始）。
//        params.setHeadRows(1); // 表头行数，不是表头占开始的行数（从标题行数结束开始）
//        params.setNeedVerify(true);
//        params.setVerifyFileSplit(false);
        return importExcel(file, cls,buildImportPramas());
    }

    /**
     *
     * 构建验证的handler,过滤空行,防止产生空对象,也就是对象所有的属性都为null
     *
     */
    private static ImportParams buildImportPramas() {
        ImportParams params = new ImportParams();
        params.setTitleRows(Constants.EXCEL_TITLE_ROW_COUNT); // 标题占用行数，不是标题开始的行数（从第1开始）。
        params.setHeadRows(1); // 表头行数，不是表头占开始的行数（从标题行数结束开始）
        params.setNeedVerify(true);
        params.setVerifyFileSplit(false);
        params.setVerifyHandler(new IExcelVerifyHandler() {
            @Override
            public ExcelVerifyHandlerResult verifyHandler(Object obj) {
                ExcelVerifyHandlerResult result = new ExcelVerifyHandlerResult(true);
                if (ObjectUtil.isNotNull(obj)) {
                    // 判断对象属性是否全部为空
                    boolean b = checkFieldAllNull(obj);
                    result.setSuccess(!b);
                }
                return result;
            }

            private boolean checkFieldAllNull(Object obj) {
                // 得到类对象
                Class clazz = obj.getClass();
                Field[] fs = clazz.getDeclaredFields();
                boolean flag = true;
                for (Field f : fs) {
                    f.setAccessible(true);
                    if (!f.isAnnotationPresent(Excel.class)) {
                        continue;
                    }
                    // 得到此属性的值
                    Object val = null;
                    try {
                        val = f.get(obj);
                    } catch (IllegalAccessException e) {
                        throw new RuntimeException(e);
                    }
                    if (Objects.nonNull(val)) {
                        flag = false;
                        break;
                    }
                }
                return flag;
            }
        });
        return params;
    }

    public static void downLoadExcel(HttpServletResponse response, String fileName, Workbook workbook) {
        try {
            response.setCharacterEncoding("UTF-8");
//            response.setHeader("content-Type", "application/vnd.ms-excel");
            response.setHeader("content-Type", "application/octet-stream");
            response.setHeader("Content-Disposition",
                    "attachment;filename=" + URLEncoder.encode(fileName, "UTF-8"));
            workbook.write(response.getOutputStream());
            response.getOutputStream().close();
        } catch (IOException e) {
            log.error("excel导出失败：", e);
            throw new CustomException(ErrorCodeEnum.ExcelExportError, "导出excel失败", null, Message.MESSAGE_EXPORT_SOLUTION);
        }
    }

    public static void downLoadTemplateFile(HttpServletResponse response, String templateFilePath, String exportFileName) {
        try {
            response.setCharacterEncoding("UTF-8");
//            response.setHeader("content-Type", "application/vnd.ms-excel");
            response.setHeader("content-Type", "application/octet-stream");
            response.setHeader("Content-Disposition",
                    "attachment;filename=" + URLEncoder.encode(exportFileName, "UTF-8"));
            Resource resource = new ClassPathResource(templateFilePath);
            InputStream is = resource.getInputStream();
            OutputStream os = response.getOutputStream();
            IOUtils.copy(is, os);
            is.close();
            os.close();
        } catch (IOException e) {
            log.error("excel导出失败：", e);
            throw new CustomException(ErrorCodeEnum.ExcelExportError, "导出excel失败", null, Message.MESSAGE_EXPORT_SOLUTION);

        }
    }

    public static String getFillingGuideFromTemplate(String templateFile) {
        Workbook workbook;
        try {
            Resource resource = new ClassPathResource(templateFile);
            InputStream is = resource.getInputStream();
            if (templateFile.equals("xls")) {
                workbook = new HSSFWorkbook(new FileInputStream(templateFile));
            } else {
                // 1. 输入流中获取工作簿
                workbook = new XSSFWorkbook(is);
            }
            // 2. 在工作簿中获取目标工作表
            Sheet sheet = workbook.getSheetAt(0);
            // 3. 获取工作表中的行数（先获取第一行数据，因为模板中第一行数据包含对应的字段）
            Row row = sheet.getRow(0);
            return row.getCell(0).getStringCellValue();
        } catch (IOException e) {
            log.warn("读取文件{}失败,详情:", templateFile, e);
        }
        return "";
    }
}
