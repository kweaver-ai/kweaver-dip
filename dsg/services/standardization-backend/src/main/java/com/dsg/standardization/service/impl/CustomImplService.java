package com.dsg.standardization.service.impl;

import cn.afterturn.easypoi.excel.entity.result.ExcelImportResult;
import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.enums.ErrorCodeEnum;
import com.dsg.standardization.common.enums.ExcelNameEnum;
import com.dsg.standardization.common.exception.CustomException;
import com.dsg.standardization.common.util.CustomUtil;
import com.dsg.standardization.common.util.EnumUtil;
import com.dsg.standardization.common.util.ExcelUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.github.yulichang.base.MPJBaseMapper;
import com.github.yulichang.base.MPJBaseServiceImpl;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import java.util.ArrayList;
import java.util.List;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.web.service.impl
 * @Date: 2022/11/30 15:06
 */
public abstract class CustomImplService<M extends MPJBaseMapper<T>, T, V> extends MPJBaseServiceImpl<M, T> {

    public void exportExcel(HttpServletResponse response, Class<V> cls, List<V> result) {
        ExcelUtil.downLoadExcel(response, result, cls, getExcelExportTitle(), false, EnumUtil.getEnumObject(ExcelNameEnum.class, s -> s.getCode().equals(cls.getSimpleName())).orElse(ExcelNameEnum.Unknown).getMessage());
    }

    public void importExcel(HttpServletResponse response, MultipartFile file, Class<V> cls, Long catalogId) {
        ExcelImportResult<V> result = ExcelUtil.importExcel(file, cls);
        if (CustomUtil.isEmpty(result) || CustomUtil.isEmpty(result.getList())) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST,file.getName(), Message.MESSAGE_INPUT_NOT_EMPTY);
        }

        try {
            saveData(result.getList(), result.getFailList(), catalogId);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
        if (!result.getFailList().isEmpty()) {
            ExcelUtil.downLoadExcel(response, result.getFailList(), cls, getExcelExportTitle(), true, EnumUtil.getEnumObject(ExcelNameEnum.class, s -> s.getCode().equals(cls.getSimpleName())).orElse(ExcelNameEnum.Unknown).getMessage());
        }
    }

    public abstract void saveRow(V excelVo, Long catalogId) throws JsonProcessingException;


    public List<T> saveData(List<V> successVoList, List<V> errorList, Long catalogId) throws JsonProcessingException {
        List<T> successList = new ArrayList<>();
        checkVoList(successVoList, successList, errorList, catalogId);
        if (CustomUtil.isEmpty(errorList)) {
            saveBatch(successList);
        } else {
            errorHandle(errorList);
        }

        return successList;
    }

    public abstract void checkVoList(List<V> successVoList, List<T> successList, List<V> errorList, Long catalogId);
    public abstract V getErrorObject(V excelVo, String errorCode) throws JsonProcessingException;
    public abstract void errorHandle(List<V> errorList);
    public abstract String getExcelExportTitle();

}
