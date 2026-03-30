package com.dsg.standardization.service.impl;

import cn.afterturn.easypoi.excel.entity.result.ExcelImportResult;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.dsg.standardization.common.constant.Constants;
import com.dsg.standardization.common.constant.FileConstants;
import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.enums.ErrorCodeEnum;
import com.dsg.standardization.common.enums.OrgTypeEnum;
import com.dsg.standardization.common.exception.CustomException;
import com.dsg.standardization.common.util.CustomUtil;
import com.dsg.standardization.common.util.ExcelUtil;
import com.dsg.standardization.common.util.StringUtil;
import com.dsg.standardization.dto.DictDto;
import com.dsg.standardization.entity.DictEntity;
import com.dsg.standardization.entity.DictEnumEntity;
import com.dsg.standardization.mapper.DictEnumMapper;
import com.dsg.standardization.mapper.DictMapper;
import com.dsg.standardization.vo.DictEnumVo;
import com.dsg.standardization.vo.DictVo;
import com.dsg.standardization.vo.Result;
import com.dsg.standardization.vo.UserInfo;
import com.dsg.standardization.vo.excel.DictExcelVo;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;
import com.dsg.standardization.service.DictExcelImportService;
import com.dsg.standardization.service.IDictService;

import javax.servlet.http.HttpServletResponse;
import java.util.*;
import java.util.regex.Pattern;

/**
 * 作者: Jie.xu
 * 创建时间：2023/11/14 10:11
 * 功能描述：
 */
@Slf4j
@Service
public class DictExcelImportServiceImpl implements DictExcelImportService {


    @Autowired
    IDictService dictService;

    @Autowired
    DictMapper dictMapper;

    @Autowired
    DictEnumMapper dictEnumMapper;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @Override
    public Result<List<DictVo>> importExcel(HttpServletResponse response, Long catalogId, MultipartFile file) {
        dictService.checkCatalogIdExist(catalogId);
        ExcelImportResult<DictExcelVo> importResult = ExcelUtil.importExcel(file, DictExcelVo.class);

        if (CustomUtil.isEmpty(importResult.getList())) {
            throw new CustomException(ErrorCodeEnum.PARTAIL_FAILURE, "导入的数据为空或者格式不正确");
        }


        if (importResult.getList().size() > 5000) {
            throw new CustomException(ErrorCodeEnum.ExcelImportError, String.format("[码表]导入失败：%s", FileConstants.Import_Excel_OverNum));
        }


        Map<String, List<DictExcelVo>> chNameEnNameOrgTypeExcelVoMap = getChNameEnNameOrgTypeExcelVoMap(importResult);

        List<DictDto> insertList = createInsertDtoList(catalogId, chNameEnNameOrgTypeExcelVoMap);
        Map<OrgTypeEnum, List<DictDto>> orgTypeDtoMap = getOrgTypeDtoMap(insertList);

        checkNameConflict(chNameEnNameOrgTypeExcelVoMap, insertList);


        UserInfo userInfo = CustomUtil.getUser();
        String deptIds = userInfo.getDeptList().get(0).getPathId();
        String thirdDeptId = userInfo.getDeptList().get(0).getThirdDeptId();
        Date now = new Date();

        // 校验名字是否存在，组装保存对象列表
        List<DictEntity> dictInsertList = new ArrayList<>();
        List<DictEnumEntity> enumInsertList = new ArrayList<>();
        for (Map.Entry<OrgTypeEnum, List<DictDto>> row : orgTypeDtoMap.entrySet()) {
            Set<String> existsChNameSet = new HashSet<>();
            Set<String> existsEnNameSet = new HashSet<>();
            queryByOrgTypeAndNames(row.getKey(), row.getValue(), existsChNameSet, existsEnNameSet);

            for (DictDto insertDto : row.getValue()) {
                StringBuilder errorMsg = new StringBuilder();
                if (existsChNameSet.contains(insertDto.getChName())) {
                    errorMsg.append("中文名称已存在；");
                }

                if (existsEnNameSet.contains(insertDto.getEnName())) {
                    errorMsg.append("英文名称已存在；");
                }

                if (CustomUtil.isEmpty(errorMsg)) {
                    DictEntity insert = new DictEntity();
                    CustomUtil.copyProperties(insertDto, insert);

                    Date currentDate = new Date();
                    insert.setChName(StringUtil.XssEscape(insert.getChName()));
                    insert.setEnName(insert.getEnName().trim());
                    insert.setDescription(StringUtil.XssEscape(insert.getDescription()));
                    insert.setId(IdWorker.getId());
                    insert.setCreateTime(currentDate);
                    insert.setUpdateTime(currentDate);
                    insert.setCode(IdWorker.getId());
                    insert.setVersion(1);
                    insert.setDepartmentIds(deptIds);
                    insert.setThirdDeptId(thirdDeptId);
                    insert.setAuthorityId(userInfo.getUserId());
                    insert.setCreateUser(userInfo.getUserName());
                    insert.setCreateTime(now);
                    insert.setUpdateUser(userInfo.getUserName());
                    insert.setUpdateTime(now);
                    dictInsertList.add(insert);

                    for (DictEnumVo dictEnum : insertDto.getEnums()) {
                        DictEnumEntity insertEnum = new DictEnumEntity();
                        dictEnum.setCode(dictEnum.getCode().trim());
                        dictEnum.setValue(dictEnum.getValue().trim());
                        CustomUtil.copyProperties(dictEnum, insertEnum);
                        insertEnum.setDictId(insert.getId());
                        insertEnum.setId(IdWorker.getId());
                        enumInsertList.add(insertEnum);
                    }
                } else {
                    String messageTempValueError = String.format(
                            "导入[码表]第[%s]条数，默认20据，[中文名称]或[英文名称]:已存在",
                            getRowNumber(chNameEnNameOrgTypeExcelVoMap, insertDto));
                    throw new CustomException(ErrorCodeEnum.PARTAIL_FAILURE, messageTempValueError);
                }
            }
        }

        // 开启事务
        Boolean rlt = transactionTemplate.execute(status -> {
            try {
                batchSave(dictInsertList, enumInsertList);
                return true;
            } catch (Exception e) {
                // 事务回滚
                status.setRollbackOnly();
                log.error("", e);
                return false;
            }
        });
        if (!rlt) {
            throw new CustomException(ErrorCodeEnum.PARTAIL_FAILURE, "excel 导入失败");
        }
        List<DictVo> targetList = new ArrayList<>(dictInsertList.size());
        CustomUtil.copyListProperties(dictInsertList, targetList, DictVo.class);
        return Result.success(targetList);

    }

    // 检查名字冲突
    private void checkNameConflict(Map<String, List<DictExcelVo>> chNameEnNameOrgTypeExcelVoMap, List<DictDto> insertList) {
        Map<String, DictDto> chNameOrgTypeMap = new HashMap<>();
        Map<String, DictDto> enNameOrgTypeMap = new HashMap<>();
        for (DictDto row : insertList) {
            checkChNameConflict(chNameEnNameOrgTypeExcelVoMap, chNameOrgTypeMap, row);
            checkEnNameConflict(chNameEnNameOrgTypeExcelVoMap, enNameOrgTypeMap, row);
        }
    }

    // 检查中文名冲突
    private void checkChNameConflict(Map<String, List<DictExcelVo>> chNameEnNameOrgTypeExcelVoMap, Map<String, DictDto> chNameOrgTypeMap, DictDto row) {
        String key_chNameOrgType = String.format("%s:%s", row.getChName(), row.getOrgType().getCode());
        if (chNameOrgTypeMap.containsKey(key_chNameOrgType)) {
            String messageTempValueError = String.format("导入[码表]第[%s]条数，默认20据和第[%s]条数，默认20据，[中文名称]:冲突",
                    getRowNumber(chNameEnNameOrgTypeExcelVoMap, row),
                    getRowNumber(chNameEnNameOrgTypeExcelVoMap, chNameOrgTypeMap.get(key_chNameOrgType)));
            throw new CustomException(ErrorCodeEnum.PARTAIL_FAILURE, messageTempValueError);
        }
        chNameOrgTypeMap.put(key_chNameOrgType, row);
    }

    // 检查英文名冲突
    private void checkEnNameConflict(Map<String, List<DictExcelVo>> chNameEnNameOrgTypeExcelVoMap, Map<String, DictDto> enNameOrgTypeMap, DictDto row) {
        String key_enNameOrgType = String.format("%s:%s", row.getEnName(), row.getOrgType().getCode());
        if (enNameOrgTypeMap.containsKey(key_enNameOrgType)) {
            String messageTempValueError = String.format("导入[码表]第[%s]条数，默认20据和第[%s]条数，默认20据，[英文名称]:冲突",
                    getRowNumber(chNameEnNameOrgTypeExcelVoMap, row),
                    getRowNumber(chNameEnNameOrgTypeExcelVoMap, enNameOrgTypeMap.get(key_enNameOrgType)));
            throw new CustomException(ErrorCodeEnum.PARTAIL_FAILURE, messageTempValueError);
        }
        enNameOrgTypeMap.put(key_enNameOrgType, row);
    }

    private String getRowNumber(Map<String, List<DictExcelVo>> chNameEnNameOrgTypeExcelVoMap, DictDto indertDto) {
        String key_chNameEnameOrgType = String.format("%s:%s:%s", indertDto.getChName(), indertDto.getEnName(), indertDto.getOrgType().getCode());
        List<Integer> list = new ArrayList<>();
        for (DictExcelVo excelVo : chNameEnNameOrgTypeExcelVoMap.get(key_chNameEnameOrgType)) {
            list.add(excelVo.getRowNum());
        }
        String numberStr = StringUtils.join(list, "/");
        if (list.size() > 5) {
            numberStr = StringUtils.join(list.subList(0, 4), "/") + "/...";
        }
        return numberStr;
    }

    @NotNull
    private static Map<OrgTypeEnum, List<DictDto>> getOrgTypeDtoMap(List<DictDto> insertList) {
        // 根据orgType分组，主要用于组装dict对象和重复校验
        Map<OrgTypeEnum, List<DictDto>> orgTypeMap = new HashMap<>();
        for (DictDto insert : insertList) {
            if (!orgTypeMap.containsKey(insert.getOrgType())) {
                orgTypeMap.put(insert.getOrgType(), new ArrayList<>());
            }
            orgTypeMap.get(insert.getOrgType()).add(insert);
        }
        return orgTypeMap;
    }

    @NotNull
    private static Map<String, List<DictExcelVo>> getChNameEnNameOrgTypeExcelVoMap(ExcelImportResult<DictExcelVo> importResult) {
        // 根据名字和类型分组，将一个字段分组出来
        Map<String, List<DictExcelVo>> excelMap = new HashMap<>();
        for (DictExcelVo row : importResult.getList()) {
            checkParam(row);
            String key = String.format("%s:%s:%s", row.getChName(), row.getEnName(), row.getOrgType().getCode());
            if (!excelMap.containsKey(key)) {
                List<DictExcelVo> excelDictList = new ArrayList<DictExcelVo>();
                excelMap.put(key, excelDictList);
            }
            excelMap.get(key).add(row);
        }
        return excelMap;
    }

    private static void checkParam(DictExcelVo row) {
        checkRuired(row.getChName(), "中文名称", row.getRowNum(), Constants.REGEX_LENGTH_128, "字符不符合输入要求或长度超过128");
        checkRuired(row.getEnName(), "英文名称", row.getRowNum(), Constants.REGEX_ENGLISH_UNDERLINE_BAR_128, "字符不符合输入要求或长度超过128");
        checkRuired(row.getOrgTypeMsg(), "标准分类", row.getRowNum(), null, "输入错误");
        if (CustomUtil.isNotEmpty(row.getDescription()) && row.getDescription().length() > 300) {
            String messageTempValueError = String.format("导入[码表]第[%s]条数，默认20据，[%s]:字符串长度超过300", row.getRowNum(), "说明");
            throw new CustomException(ErrorCodeEnum.PARTAIL_FAILURE, messageTempValueError);
        }

        row.setOrgType(OrgTypeEnum.getByMessage(row.getOrgTypeMsg()));
        if (OrgTypeEnum.Unknown.equals(row.getOrgType())) {
            String messageTempValueError = String.format("导入[码表]第[%s]条数，默认20据，[%s]:填写错误", row.getRowNum(), "标准分类");
            throw new CustomException(ErrorCodeEnum.PARTAIL_FAILURE, messageTempValueError);
        }
        checkRuired(row.getCode(), "码值", row.getRowNum(), Constants.REGEX_ENGLISH_UNDERLINE_BAR_64, Message.MESSAGE_ENGLISH_NUMBER_UNDERLINE_BAR_64);
        checkRuired(row.getValue(), "码值描述", row.getRowNum(), null, null);
        if (CustomUtil.isNotEmpty(row.getEnumDescription()) && row.getEnumDescription().length() > 300) {
            String messageTempValueError = String.format("导入[码表]第[%s]条数，默认20据，[%s]:字符串长度超过300", row.getRowNum(), "码值说明");
            throw new CustomException(ErrorCodeEnum.PARTAIL_FAILURE, messageTempValueError);
        }
    }

    private static void checkRuired(String field, String columnName, int rowNumber, String regex, String msg) {
        String messageTempRequired = "导入[码表]第[%s]条数，默认20据，[%s]:必填";
        if (CustomUtil.isEmpty(field)) {
            String message = String.format(messageTempRequired, rowNumber, columnName);
            throw new CustomException(ErrorCodeEnum.PARTAIL_FAILURE, message);
        }

        if (CustomUtil.isNotEmpty(regex)) {
            String messageTempValueError = "导入[码表]第[%s]条数，默认20据，[%s]:%s";
            if (!Pattern.matches(regex, field)) {
                String message = String.format(messageTempValueError, rowNumber, columnName, msg);
                throw new CustomException(ErrorCodeEnum.PARTAIL_FAILURE, message);
            }
        }
    }

    private void queryByOrgTypeAndNames(OrgTypeEnum orgTypeEnum, List<DictDto> list, Set<String> existsChNameSet, Set<String> existsEnNameSet) {
        String deptIds = CustomUtil.getUser().getDeptList().get(0).getPathId();
        List<DictEntity> existList = new ArrayList<>();
        List<DictDto> queryList = new ArrayList<>();
        for (DictDto row : list) {
            queryList.add(row);
            if (queryList.size() > 1000) {
                existList.addAll(dictMapper.selectByNames(orgTypeEnum.getCode(), queryList,deptIds));
                queryList.clear();
            }
        }
        existList.addAll(dictMapper.selectByNames(orgTypeEnum.getCode(), queryList,deptIds));

        for (DictEntity exist : existList) {
            existsChNameSet.add(exist.getChName());
            existsEnNameSet.add(exist.getEnName());
        }

    }

    private static List<DictDto> createInsertDtoList(Long catalogId, Map<String, List<DictExcelVo>> excelMap) {
        // 组装 insertDto
        List<DictDto> insertList = new ArrayList<>();
        for (Map.Entry<String, List<DictExcelVo>> row : excelMap.entrySet()) {
            DictExcelVo firstVo = row.getValue().get(0);
            DictDto insert = new DictDto();
            insert.setChName(firstVo.getChName());
            insert.setEnName(firstVo.getEnName());
            OrgTypeEnum orgType = OrgTypeEnum.getByMessage(firstVo.getOrgTypeMsg());
            if (!OrgTypeEnum.Unknown.equals(orgType)) {
                insert.setOrgType(orgType);
            }
            insert.setDescription(firstVo.getDescription());

            insert.setEnums(new ArrayList<DictEnumVo>());
            insert.setCatalogId(catalogId);

            insertList.add(insert);

            Set<String> dictEnumCodeSet = new HashSet<>();
            for (DictExcelVo dictEnum : row.getValue()) {
                String dictEnumCode = dictEnum.getCode();
                if (dictEnumCodeSet.contains(dictEnumCode)) {
                    continue;
                }
                dictEnumCodeSet.add(dictEnum.getCode());

                DictEnumVo enumVo = new DictEnumVo();
                enumVo.setCode(dictEnum.getCode());
                enumVo.setValue(dictEnum.getValue());
                enumVo.setDescription(dictEnum.getEnumDescription());
                insert.getEnums().add(enumVo);
            }
        }
        return insertList;
    }

    private void batchSave(List<DictEntity> dictInsertList, List<DictEnumEntity> enumInsertList) {
        List<DictEntity> insertTempList = new ArrayList<>();
        for (DictEntity row : dictInsertList) {
            insertTempList.add(row);
            if (insertTempList.size() > 1000) {
                dictMapper.save(insertTempList);
                insertTempList.clear();
            }
        }
        if (!insertTempList.isEmpty()) {
            dictMapper.save(insertTempList);
        }

        List<DictEnumEntity> insertEnumTempList = new ArrayList<>();
        for (DictEnumEntity row : enumInsertList) {
            insertEnumTempList.add(row);
            if (insertEnumTempList.size() > 1000) {
                dictEnumMapper.save(insertEnumTempList);
                insertEnumTempList.clear();
            }
        }
        if (!insertEnumTempList.isEmpty()) {
            dictEnumMapper.save(insertEnumTempList);
        }

    }

}
