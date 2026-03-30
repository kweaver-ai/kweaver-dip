package com.dsg.standardization.service;


import com.dsg.standardization.vo.DictVo;
import com.dsg.standardization.vo.Result;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import java.util.List;

/**
 * 作者: Jie.xu
 * 创建时间：2023/11/14 10:12
 * 功能描述：
 */
public interface DictExcelImportService {
    Result<List<DictVo>> importExcel(HttpServletResponse response, Long catalogId, MultipartFile file);
}
