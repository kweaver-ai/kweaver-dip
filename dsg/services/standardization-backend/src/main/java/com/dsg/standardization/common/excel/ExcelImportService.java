package com.dsg.standardization.common.excel;

import cn.afterturn.easypoi.excel.entity.result.ExcelImportResult;
import com.dsg.standardization.common.exception.CustomException;
import com.dsg.standardization.common.util.ExcelUtil;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import java.util.List;

;

/**
 * 导入基础类，子类继承并实现抽象方法save(T excelVo)，即可。
 *
 * @param <T>
 */
public abstract class ExcelImportService<T> {

    public <T> void importExcel(HttpServletResponse response, MultipartFile file, Class<T> cls, Long catalogId, String title) {
        ExcelImportResult<T> result = ExcelUtil.importExcel(file, cls);
        saveData(result.getList(), result.getFailList(), catalogId);
        if (!result.getFailList().isEmpty()) {
            ExcelUtil.downLoadExcel(response, result.getFailList(), cls, title, true);
        }
    }

    public abstract <T> void save(T excelVo, Long catalogId);


    public <T> void saveData(List<T> successList, List<T> errorList, Long catalogId) {
        for (T excelVo : successList) {
            try {
                save(excelVo, catalogId);
            } catch (CustomException e) {
                errorList.add(excelVo);
            }
        }
    }

}
