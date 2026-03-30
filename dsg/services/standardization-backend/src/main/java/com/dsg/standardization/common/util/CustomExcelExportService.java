package com.dsg.standardization.common.util;

import cn.afterturn.easypoi.excel.annotation.Excel;
import cn.afterturn.easypoi.excel.annotation.ExcelCollection;
import cn.afterturn.easypoi.excel.annotation.ExcelEntity;
import cn.afterturn.easypoi.excel.annotation.ExcelTarget;
import cn.afterturn.easypoi.excel.entity.ExportParams;
import cn.afterturn.easypoi.excel.entity.enmus.ExcelType;
import cn.afterturn.easypoi.excel.entity.params.ExcelExportEntity;
import cn.afterturn.easypoi.excel.export.ExcelExportService;
import cn.afterturn.easypoi.exception.excel.ExcelExportException;
import cn.afterturn.easypoi.exception.excel.enums.ExcelExportEnum;
import cn.afterturn.easypoi.util.PoiPublicUtil;
import cn.afterturn.easypoi.util.PoiReflectorUtil;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.poi.ss.usermodel.Workbook;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.util.*;

public class CustomExcelExportService extends ExcelExportService {

    public void createSheet(Workbook workbook, ExportParams entity, Class<?> pojoClass,
                            Collection<?> dataSet, Boolean exportErrorColmun) {
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("Excel export start ,class is {}", pojoClass);
            LOGGER.debug("Excel version is {}",
                    entity.getType().equals(ExcelType.HSSF) ? "03" : "07");
        }
        if (workbook == null || entity == null || pojoClass == null || dataSet == null) {
            throw new ExcelExportException(ExcelExportEnum.PARAMETER_ERROR);
        }
        try {
            List<ExcelExportEntity> excelParams = new LinkedList<ExcelExportEntity>();
            // 得到所有字段
            Field[] fileds = PoiPublicUtil.getClassFields(pojoClass);
            ExcelTarget etarget = pojoClass.getAnnotation(ExcelTarget.class);
            String targetId = etarget == null ? null : etarget.value();
            getAllExcelField(entity.getExclusions(), targetId, fileds, excelParams, pojoClass,
                    null, null, exportErrorColmun);
            //获取所有参数后,后面的逻辑判断就一致了
            createSheetForMap(workbook, entity, excelParams, dataSet);
        } catch (Exception e) {
            LOGGER.error(e.getMessage(), e);
            throw new ExcelExportException(ExcelExportEnum.EXPORT_ERROR, e.getCause());
        }
    }

    /**
     * 获取需要导出的全部字段
     *
     * @param targetId 目标ID
     */
    public void getAllExcelField(String[] exclusions, String targetId, Field[] fields,
                                 List<ExcelExportEntity> excelParams, Class<?> pojoClass,
                                 List<Method> getMethods, ExcelEntity excelGroup, Boolean exportErrorColmun) throws Exception {
        List<String> exclusionsList = exclusions != null ? Arrays.asList(exclusions) : null;
        ExcelExportEntity excelEntity;
        // 遍历整个filed
        for (int i = 0; i < fields.length; i++) {
            Field field = fields[i];
            if (!exportErrorColmun) {
                if (field.getName().equals("rowNum") || field.getName().equals("errorMsg")) {
                    continue;
                }
            }

            // 先判断是不是collection,在判断是不是java自带对象,之后就是我们自己的对象了
            if (PoiPublicUtil.isNotUserExcelUserThis(exclusionsList, field, targetId)) {
                continue;
            }
            // 首先判断Excel 可能一下特殊数据用户回自定义处理
            if (field.getAnnotation(Excel.class) != null) {
                Excel excel = field.getAnnotation(Excel.class);
                String name = PoiPublicUtil.getValueByTargetId(excel.name(), targetId, null);
                if (StringUtils.isNotBlank(name)) {
                    excelParams.add(createExcelExportEntity(field, targetId, pojoClass, getMethods, excelGroup));
                }
            } else if (PoiPublicUtil.isCollection(field.getType())) {
                ExcelCollection excel = field.getAnnotation(ExcelCollection.class);
                ParameterizedType pt = (ParameterizedType) field.getGenericType();
                Class<?> clz = (Class<?>) pt.getActualTypeArguments()[0];
                List<ExcelExportEntity> list = new ArrayList<ExcelExportEntity>();
                getAllExcelField(exclusions,
                        StringUtils.isNotEmpty(excel.id()) ? excel.id() : targetId,
                        PoiPublicUtil.getClassFields(clz), list, clz, null, null);
                excelEntity = new ExcelExportEntity();
                excelEntity.setName(PoiPublicUtil.getValueByTargetId(excel.name(), targetId, null));
                excelEntity.setOrderNum(Integer
                        .valueOf(PoiPublicUtil.getValueByTargetId(excel.orderNum(), targetId, "0")));
                excelEntity
                        .setMethod(PoiReflectorUtil.fromCache(pojoClass).getGetMethod(field.getName()));
                excelEntity.setList(list);
                excelParams.add(excelEntity);
            } else {
                List<Method> newMethods = new ArrayList<Method>();
                if (getMethods != null) {
                    newMethods.addAll(getMethods);
                }
                newMethods.add(PoiReflectorUtil.fromCache(pojoClass).getGetMethod(field.getName()));
                ExcelEntity excel = field.getAnnotation(ExcelEntity.class);
                if (excel.show() && StringUtils.isEmpty(excel.name())) {
                    throw new ExcelExportException("if use ExcelEntity ,name mus has value ,data: " + ReflectionToStringBuilder.toString(excel), ExcelExportEnum.PARAMETER_ERROR);
                }
                getAllExcelField(exclusions,
                        StringUtils.isNotEmpty(excel.id()) ? excel.id() : targetId,
                        PoiPublicUtil.getClassFields(field.getType()), excelParams, field.getType(),
                        newMethods, excel.show() ? excel : null);
            }
        }
    }

    private ExcelExportEntity createExcelExportEntity(Field field, String targetId,
                                                      Class<?> pojoClass,
                                                      List<Method> getMethods, ExcelEntity excelGroup) throws Exception {
        Excel excel = field.getAnnotation(Excel.class);
        ExcelExportEntity excelEntity = new ExcelExportEntity();
        excelEntity.setType(excel.type());
        getExcelField(targetId, field, excelEntity, excel, pojoClass, excelGroup);
        if (getMethods != null) {
            List<Method> newMethods = new ArrayList<Method>();
            newMethods.addAll(getMethods);
            newMethods.add(excelEntity.getMethod());
            excelEntity.setMethods(newMethods);
        }
        return excelEntity;
    }

    private void getExcelField(String targetId, Field field, ExcelExportEntity excelEntity,
                               Excel excel, Class<?> pojoClass, ExcelEntity excelGroup) throws Exception {
        excelEntity.setName(PoiPublicUtil.getValueByTargetId(excel.name(), targetId, null));
        excelEntity.setWidth(excel.width());
        excelEntity.setHeight(excel.height());
        excelEntity.setNeedMerge(excel.needMerge());
        excelEntity.setMergeVertical(excel.mergeVertical());
        excelEntity.setMergeRely(excel.mergeRely());
        excelEntity.setReplace(excel.replace());
        excelEntity.setOrderNum(
                Integer.valueOf(PoiPublicUtil.getValueByTargetId(excel.orderNum(), targetId, "0")));
        excelEntity.setWrap(excel.isWrap());
        excelEntity.setExportImageType(excel.imageType());
        excelEntity.setSuffix(excel.suffix());
        excelEntity.setDatabaseFormat(excel.databaseFormat());
        excelEntity.setFormat(
                StringUtils.isNotEmpty(excel.exportFormat()) ? excel.exportFormat() : excel.format());
        excelEntity.setStatistics(excel.isStatistics());
        excelEntity.setHyperlink(excel.isHyperlink());
        excelEntity.setMethod(PoiReflectorUtil.fromCache(pojoClass).getGetMethod(field.getName()));
        excelEntity.setNumFormat(excel.numFormat());
        excelEntity.setColumnHidden(excel.isColumnHidden());
        excelEntity.setDict(excel.dict());
        excelEntity.setEnumExportField(excel.enumExportField());
        if (excelGroup != null) {
            excelEntity.setGroupName(PoiPublicUtil.getValueByTargetId(excelGroup.name(), targetId, null));
        } else {
            excelEntity.setGroupName(excel.groupName());
        }
    }
}
