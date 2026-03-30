package com.dsg.standardization.service.impl;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.metadata.OrderItem;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.enums.*;
import com.dsg.standardization.common.util.*;
import com.dsg.standardization.entity.*;
import com.dsg.standardization.vo.*;
import com.dsg.standardization.common.exception.CustomException;
import com.dsg.standardization.configuration.ExcelImportConfigruation;
import com.dsg.standardization.dto.CountGroupByCatalogDto;
import com.dsg.standardization.dto.CountGroupByFileDto;
import com.dsg.standardization.dto.DictDto;
import com.dsg.standardization.dto.DictSearchDto;
import com.dsg.standardization.mapper.DictEnumMapper;
import com.dsg.standardization.mapper.DictMapper;
import com.dsg.standardization.mapper.RelationDictFileMapper;
import com.dsg.standardization.mapper.StdFileMgrMapper;
import com.dsg.standardization.vo.excel.DictExcelVo;
import com.google.common.collect.Lists;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.dsg.standardization.service.IDataElementInfoService;
import com.dsg.standardization.service.IDeCatalogInfoService;
import com.dsg.standardization.service.IDictService;

import javax.servlet.http.HttpServletResponse;
import java.util.*;

@Slf4j
@Service
public class DictServiceImpl extends ServiceImpl<DictMapper, DictEntity> implements IDictService {

    @Autowired(required = false)
    DictMapper dictMapper;

    @Autowired(required = false)
    DictEnumMapper dictEnumMapper;

    @Autowired
    StdFileMgrMapper stdFileMgrMapper;

    @Autowired
    RelationDictFileMapper relationDictFileMapper;

    @Autowired
    IDeCatalogInfoService iDeCatalogInfoService;

    @Autowired
    IDataElementInfoService iDataElementInfoService;

    @Autowired
    ExcelImportConfigruation excelImportConfigruation;

    private static final String[] ORDER_TABLE_FIELDS = new String[]{"f_create_time", "f_update_time", "f_state", "f_org_type", "f_id"};


    @Override
    public Result<List<DictVo>> queryList(Long catalogId,
                                          String keyword,
                                          Integer orgType,
                                          EnableDisableStatusEnum state,
                                          Integer offset,
                                          Integer limit,
                                          String sort,
                                          String direction, String departmentId) {
        if (StringUtils.isNotBlank(departmentId) && String.valueOf(DefaultCatalogEnum.Dict.getCode()).equals(departmentId)) {
            catalogId = Long.valueOf(DefaultCatalogEnum.Dict.getCode());
            departmentId = null;
        }
        List<Long> catalogIds = new ArrayList<>();
        if(catalogId!=null && catalogId>0){
            catalogIds = iDeCatalogInfoService.getIDList(catalogId);
        }
        Page<DictEntity> page = new Page<DictEntity>(offset, limit);
        List<OrderItem> orderItems = PageUtil.getOrderItems(sort, direction, ORDER_TABLE_FIELDS);
        page.setOrders(orderItems);
        IPage<DictEntity> pageResult = dictMapper.queryList(page, catalogIds, keyword, orgType, state,departmentId);
        return dbDataToVo(pageResult);
    }

    @Override
    public Result checkExist(Long id, String enName, String chName, OrgTypeEnum orgType) {
        if (id != null) {
            DictEntity entity = dictMapper.selectById(id);
            if (entity == null || entity.isDelete()) {
                throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, new CheckErrorVo("id", String.format("id为[%s]的数据不存在；", id)),
                        Message.MESSAGE_DATANOTEXIST_ERROR_SOLUTION);
            }
        }
        List<DictEntity> resultList = dictMapper.checkIsExist(enName, chName, id, orgType);
        if (CustomUtil.isEmpty(resultList)) {
            return Result.success(false);
        } else {
            return Result.success(true);
        }
    }

    @Override
    public Result queryDictEnums(Long dictId, String keyword, Integer offset, Integer limit) {
        Page<DictEnumEntity> page = new Page<DictEnumEntity>(offset, limit);
//        if (!StringUtils.isBlank(keyword)) {
//            keyword = keyword.trim();
//            keyword = keyword.replaceAll("%", "/%").replaceAll("_", "/_");
//        }
        IPage<DictEnumEntity> pageResult = dictEnumMapper.queryList(page, dictId, keyword);
        Result result = Result.success(pageResult.getRecords());
        result.setTotalCount(page.getTotal());
        return result;
    }

    @Override
    public Result queryUsedDataElementByDictId(Long id,
                                               Integer offset,
                                               Integer limit) {
        DictEntity dictEntity = dictMapper.selectById(id);
        if (dictEntity == null) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, CheckErrorUtil.createError("id", "记录不存在"));
        }
        IPage<DataElementInfo> resultPageData = iDataElementInfoService.queryByDictCode(dictEntity.getCode(), offset, limit);
        Result result = Result.success(resultPageData.getRecords());
        result.setTotalCount(resultPageData.getTotal());
        return result;
    }

    @Override
    public List<DictVo> queryByCodes(Set<Long> dictCodeSet, boolean returnEnums) {
        List<DictVo> resultList = new ArrayList<>();
        if (CustomUtil.isEmpty(dictCodeSet)) {
            return resultList;
        }

        List<DictEntity> dictEntityList = dictMapper.queryByCodes(dictCodeSet);
        CustomUtil.copyListProperties(dictEntityList, resultList, DictVo.class);
        if (!returnEnums || CustomUtil.isEmpty(dictEntityList)) {
            return resultList;
        }
        List<Long> dictIds = new ArrayList<>();
        for (DictEntity row : dictEntityList) {
            dictIds.add(row.getId());
        }
        List<DictEnumEntity> dictEnumEntityList = dictEnumMapper.queryByDictIds(dictIds);
        if (CustomUtil.isEmpty(dictEnumEntityList)) {
            return resultList;
        }
        Map<Long, List<DictEnumEntity>> dictIdEnumsMap = new HashMap<>();
        for (DictEnumEntity row : dictEnumEntityList) {
            Long dictId = row.getDictId();
            if (!dictIdEnumsMap.containsKey(dictId)) {
                List<DictEnumEntity> tempList = new ArrayList<>();
                dictIdEnumsMap.put(dictId, tempList);
            }
            dictIdEnumsMap.get(dictId).add(row);
        }

        for (DictVo row : resultList) {
            Long dictId = row.getId();
            if (CustomUtil.isNotEmpty(dictIdEnumsMap.get(dictId))) {
                List<DictEnumVo> enumVos = new ArrayList<>();
                CustomUtil.copyListProperties(dictIdEnumsMap.get(dictId), enumVos, DictEnumVo.class);
                row.setEnums(enumVos);
            }
        }
        return resultList;
    }

    @Override
    public Result updateState(Long id, EnableDisableStatusEnum state, String reason) {
        DictEntity entity = dictMapper.selectById(id);
        if (null == entity || entity.isDelete()) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, "数据不存在");
        }
        entity.setState(state);
        if (EnableDisableStatusEnum.ENABLE.equals(state)) {
            entity.setDisableReason("");
        } else {
            entity.setDisableReason(reason);
        }
        dictMapper.updateById(entity);
        return Result.success();
    }

    @Override
    public Result queryByStdFileCatalog(Long stdFileCatalogId,
                                        String keyword,
                                        Integer orgType,
                                        EnableDisableStatusEnum state,
                                        Integer offset,
                                        Integer limit,
                                        String sort,
                                        String direction,String departmentId) {

        // 没有传递目录ID，返回空
        if (CustomUtil.isEmpty(stdFileCatalogId)) {
            return Result.success(new ArrayList<>());
        }

        Page page = new Page<>(offset, limit);
        // 可以用来参与排序的字段，数据库字段名称
        List<OrderItem> orderItems = PageUtil.getOrderItems(sort, direction, ORDER_TABLE_FIELDS);
        page.setOrders(orderItems);

        // 查询没有关联标准文件的记录
        if (-1 == stdFileCatalogId) {
            IPage<DictEntity> pageResult = dictMapper.queryDataNotUesdStdFile(page, keyword, orgType, state);
            return dbDataToVo(pageResult);
        }

        // 查询关联了标准文件的记录
        DeCatalogInfo catalog = iDeCatalogInfoService.getById(stdFileCatalogId);
        // 目录不是标准文件目录，直接返回
        if (catalog == null || !catalog.getType().equals(CatalogTypeEnum.File)) {
            return Result.success(new ArrayList<>());
        }

        IPage<DictEntity> pageResult;
        // 标准文件的顶级目录，需要返回所有的编码规则
        if (catalog.isRootPath()) {
            pageResult = dictMapper.queryList(page, null, keyword, orgType, state,departmentId);
        } else {
            List<Long> catalogIds = iDeCatalogInfoService.getIDList(stdFileCatalogId);
            pageResult = dictMapper.queryByStdFileCatalog(page, catalogIds, keyword, orgType, state);
        }
        return dbDataToVo(pageResult);
    }

    private Result<List<DictVo>> dbDataToVo(IPage<DictEntity> pageResult) {

        List<DictVo> targetList = new ArrayList<>(pageResult.getRecords().size());
        CustomUtil.copyListProperties(pageResult.getRecords(), targetList, DictVo.class);
        // 查询使用的码表，设置被使用标识
        List<Long> dictCodes = new ArrayList<>();
        Set<String> deptIds = new HashSet<>();
        for (DictVo row : targetList) {
            dictCodes.add(row.getCode());
            if(CustomUtil.isNotEmpty(row.getDepartmentIds())){
                deptIds.add(StringUtil.PathSplitAfter(row.getDepartmentIds()));
            }
        }
        Set<Long> usedCodes = iDataElementInfoService.dictUsed(dictCodes);
        // 查询部门名称
        Map<String, Department> deptEntityMap = TokenUtil.getMapDeptInfo(deptIds);
        for (DictVo row : targetList) {
            if (usedCodes.contains(row.getCode())) {
                row.setUsedFlag(true);
            } else {
                row.setUsedFlag(false);
            }
            row.setDepartmentId(StringUtil.PathSplitAfter(row.getDepartmentIds()));
            row.setDepartmentName(deptEntityMap.get(row.getDepartmentId())==null?null:deptEntityMap.get(row.getDepartmentId()).getName());
            row.setDepartmentPathNames(deptEntityMap.get(row.getDepartmentId())==null?null:deptEntityMap.get(row.getDepartmentId()).getPathName());
        }

        Result result = Result.success(targetList);
        result.setTotalCount(pageResult.getTotal());
        return result;
    }

    @Override
    public void addRelation(Long stdFileId, List<Long> relationDictList) {

        List<RelationDictFileEntity> oldRelations = relationDictFileMapper.queryByFileId(stdFileId);

        Set<Long> oldDeIdSet = new HashSet<>(oldRelations.size());
        for (RelationDictFileEntity row : oldRelations) {
            oldDeIdSet.add(row.getDictId());
        }

        List<Long> updataList = new ArrayList<>();
        List<RelationDictFileEntity> inserList = new ArrayList<>();
        if (CustomUtil.isNotEmpty(relationDictList)) {
            List<DictEntity> exists = dictMapper.selectBatchIds(relationDictList);
            for (DictEntity row : exists) {
                RelationDictFileEntity r = new RelationDictFileEntity();
                r.setId(IdWorker.getId());
                r.setDictId(row.getId());
                r.setFileId(stdFileId);
                inserList.add(r);
                if (!oldDeIdSet.contains(row.getId())) {
                    updataList.add(row.getId());
                }
                oldDeIdSet.remove(row.getId());
            }
        }

        relationDictFileMapper.deleteByFileId(stdFileId);
        if (CustomUtil.isNotEmpty(inserList)) {
            relationDictFileMapper.save(inserList);
        }

        updataList.addAll(oldDeIdSet);
        if (CustomUtil.isNotEmpty(updataList)) {
            UserInfo userInfo = CustomUtil.getUser();
            dictMapper.updateVersionByIds(updataList, userInfo.getUserName());
        }
    }

    @Override
    public List<DictVo> queryByFileId(Long id) {
        List<DictEntity> source = dictMapper.queryByFileId(id);
        List<DictVo> targetList = new ArrayList<>();
        CustomUtil.copyListProperties(source, targetList, DictVo.class);
        return targetList;
    }

    private List<Long> getCatalogIds(Long catalogId) {
        List<Long> catalogIds = Lists.newArrayList();
        if (catalogId != null) {
            List<Long> subIds = iDeCatalogInfoService.getIDList(catalogId);
            if (subIds != null) {
                catalogIds.addAll(subIds);
            }
        }
        return catalogIds;
    }

    @Override
    public DictVo queryById(Long id) {
        DictEntity source = dictMapper.selectById(id);
        if (source == null) {
            return null;
        }
        DictVo target = new DictVo();
        CustomUtil.copyProperties(source, target);
        if(source.getDeleted()){
            target.setState(EnableDisableStatusEnum.DISABLE);
        }
        List<DictEnumEntity> sourceEnums = dictEnumMapper.queryByDictId(target.getId());
        List<DictEnumVo> targetEnums = new ArrayList<>();
        CustomUtil.copyListProperties(sourceEnums, targetEnums, DictEnumVo.class);
        target.setEnums(targetEnums);
        DeCatalogInfo catalog = iDeCatalogInfoService.getById(target.getCatalogId());
        if (CustomUtil.isNotEmpty(catalog)) {
            target.setCatalogName(catalog.getCatalogName());
        }
        String deptId = StringUtil.PathSplitAfter(source.getDepartmentIds());
        Map<String, Department> deptEntityMap = TokenUtil.getMapDeptInfo(Arrays.asList(deptId));
        target.setDepartmentId(deptId);
        target.setDepartmentName(deptEntityMap.get(deptId)==null?null:deptEntityMap.get(deptId).getName());
        target.setDepartmentPathNames(deptEntityMap.get(deptId)==null?null:deptEntityMap.get(deptId).getPathName());
        return target;
    }

    @Override
    public DictVo queryDetailByCode(Long code) {
        DictEntity source = dictMapper.queryEffectDictByCode(code);
        if (source == null) {
            return null;
        }
        DictVo target = new DictVo();
        CustomUtil.copyProperties(source, target);
        List<DictEnumEntity> sourceEnums = dictEnumMapper.queryByDictId(target.getId());
        List<DictEnumVo> targetEnums = new ArrayList<>();
        CustomUtil.copyListProperties(sourceEnums, targetEnums, DictEnumVo.class);
        target.setEnums(targetEnums);
        DeCatalogInfo catalog = iDeCatalogInfoService.getById(target.getCatalogId());
        if (CustomUtil.isNotEmpty(catalog)) {
            target.setCatalogName(catalog.getCatalogName());
        }
        String deptId = StringUtil.PathSplitAfter(source.getDepartmentIds());
        Map<String, Department> deptEntityMap = TokenUtil.getMapDeptInfo(Arrays.asList(deptId));
        target.setDepartmentId(deptId);
        target.setDepartmentName(deptEntityMap.get(deptId)==null?null:deptEntityMap.get(deptId).getName());
        target.setDepartmentPathNames(deptEntityMap.get(deptId)==null?null:deptEntityMap.get(deptId).getPathName());
        return target;
    }

    @Override
    @Transactional
    public Result create(DictDto dict) {
        checkParameter(dict);
        checkExist(dict);
        DictEntity insert = new DictEntity();
        CustomUtil.copyProperties(dict, insert);

        insert.setCode(IdWorker.getId());
        Date now = new Date();
        UserInfo userInfo = CustomUtil.getUser();
        insert.setAuthorityId(userInfo.getUserId());
        insert.setCreateUser(userInfo.getUserName());
        insert.setCreateTime(now);
        insert.setUpdateUser(userInfo.getUserName());
        insert.setUpdateTime(now);
        insert.setVersion(1);
        Department department = TokenUtil.getDeptPathIds(dict.getDepartmentIds());
        insert.setDepartmentIds(department.getPathId());
        insert.setThirdDeptId(department.getThirdDeptId());
        int rlt = dictMapper.insert(insert);
        Long id = insert.getId();

        saveDictEnums(dict.getEnums(), id);
        saveRelationDictFile(id, dict.getStdFiles());

        DictVo target = new DictVo();
        CustomUtil.copyProperties(insert, target);
        return Result.success(target);
    }

    private void saveRelationDictFile(Long id, List<Long> stdFlles) {
        if (!CustomUtil.isEmpty(stdFlles)) {
            List<RelationDictFileEntity> relations = new ArrayList<>(stdFlles.size());
            for (Long fileId : stdFlles) {
                RelationDictFileEntity entity = new RelationDictFileEntity();
                entity.setId(IdWorker.getId());
                entity.setDictId(id);
                entity.setFileId(fileId);
                relations.add(entity);
            }
            relationDictFileMapper.save(relations);
        }
    }


    @Override
    @Transactional
    public Result update(DictDto dict) {
        DictEntity exist = dictMapper.selectById(dict.getId());
        if (exist == null) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST.getErrorCode(), "记录不存在");
        }

        checkParameter(dict);
        checkExist(dict);
        boolean versionUpdateudpate = checkVersionUpdate(dict, exist);
        if (!versionUpdateudpate) {
            return Result.success(exist);
        }
        DictEntity update = new DictEntity();
        CustomUtil.copyProperties(dict, update);
        UserInfo user = CustomUtil.getUser();
        update.setUpdateUser(user.getUserName());
        update.setUpdateTime(new Date());
        update.setVersion(exist.getVersion() + 1);
        Department department = TokenUtil.getDeptPathIds(dict.getDepartmentIds());
        update.setDepartmentIds(department.getPathId());
        update.setThirdDeptId(department.getThirdDeptId());

        int rlt = dictMapper.updateById(update);
        dictEnumMapper.deleteByDictId(exist.getId());
        saveDictEnums(dict.getEnums(), exist.getId());

        relationDictFileMapper.deleteByDictId(exist.getId());
        saveRelationDictFile(exist.getId(), dict.getStdFiles());

        DictVo target = new DictVo();
        CustomUtil.copyProperties(update, target);
        return Result.success(target);
    }

    private boolean checkVersionUpdate(DictDto newData, DictEntity exist) {
        if (!newData.getEnName().equals(exist.getEnName())) {
            return true;
        }
        if (!newData.getDepartmentIds().equals(exist.getDepartmentIds())) {
            return true;
        }
        if (!newData.getChName().equals(exist.getChName())) {
            return true;
        }

        if (!newData.getOrgType().equals(exist.getOrgType())) {
            return true;
        }

        if (!newData.getCatalogId().equals(exist.getCatalogId())) {
            return true;
        }

        String newDescription = newData.getDescription() == null ? "" : newData.getDescription();
        String oldDescription = exist.getDescription() == null ? "" : exist.getDescription();
        if (!newDescription.equals(oldDescription)) {
            return true;
        }

        List<RelationDictFileEntity> relationFileList = relationDictFileMapper.queryByDictId(exist.getId());
        if (CustomUtil.isEmpty(newData.getStdFiles()) && CustomUtil.isNotEmpty(relationFileList)) {
            return true;
        }

        if (CustomUtil.isNotEmpty(newData.getStdFiles()) && CustomUtil.isEmpty(relationFileList)) {
            return true;
        }

        if (CustomUtil.isNotEmpty(newData.getStdFiles()) && CustomUtil.isNotEmpty(relationFileList)) {
            if (relationFileList.size() != newData.getStdFiles().size()) {
                return true;
            }

            for (Long newId : newData.getStdFiles()) {
                for (RelationDictFileEntity oldRow : relationFileList) {
                    if (newId.equals(oldRow.getId())) {
                        relationFileList.remove(oldRow);
                    }
                }
            }
            if (relationFileList.size() > 0) {
                return true;
            }
        }

        Map<String, DictEnumVo> newMap = new HashMap<>();
        for (DictEnumVo row : newData.getEnums()) {
            newMap.put(row.getCode(), row);
        }

        List<DictEnumEntity> oldList = dictEnumMapper.queryByDictId(exist.getId());
        Map<String, DictEnumEntity> oldMap = new HashMap<>();
        for (DictEnumEntity row : oldList) {
            oldMap.put(row.getCode(), row);
        }

        for (Map.Entry<String, DictEnumVo> row : newMap.entrySet()) {
            String code = row.getKey();
            DictEnumVo newEnum = row.getValue();
            if (oldMap.containsKey(code)) {
                DictEnumEntity oldData = oldMap.get(code);
                if (!newEnum.getValue().equals(oldData.getValue())) {
                    return true;
                }
                oldMap.remove(code);
            } else {
                return true;
            }
        }
        if (CustomUtil.isNotEmpty(oldMap)) {
            return true;
        }

        return false;
    }

    @Override
    @Transactional
    public Result delete(Long id) {
        DictEntity dict = dictMapper.selectById(id);
        if (dict == null || dict.isDelete()) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, CheckErrorUtil.createError("id", String.format("记录[%s]记录不存在；", id)));
        }
        List<Long> ids = new ArrayList<>();
        ids.add(id);
        dictMapper.deleteByIds(ids);
        dictEnumMapper.deleteByDictId(id);
        return Result.success(dict.getChName());
    }

    @Override
    @Transactional
    public Result deleteBatch(String ids) {
        String[] idArray = ids.split(",");
        List<Long> idList = new ArrayList<>();

        for (String dictIdStr : idArray) {
            Long dictId = ConvertUtil.toLong(dictIdStr, null);
            if (CustomUtil.isNotEmpty(dictId)) {
                idList.add(dictId);
            }
        }
        if (CustomUtil.isNotEmpty(idList)) {
            dictMapper.deleteByIds(idList);
        }
        return Result.success();
    }

    @Override
    public void export(HttpServletResponse response, DictSearchDto searchDto) {
        List<Long> catalogIds = getCatalogIds(searchDto.getCatalogId());
        if (searchDto.getCatalogId() != null && catalogIds.size() == 0) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, new CheckErrorVo("catalog_id", String.format("catalog_id为[%s]目录不存在；", searchDto.getCatalogId())), Message.MESSAGE_DATANOTEXIST_ERROR_SOLUTION);
        }
        List<DictExcelVo> dictList = dictMapper.queryExportData(searchDto, catalogIds);
        if (dictList == null || dictList.size() == 0) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, new CheckErrorVo(ErrorCodeEnum.Empty.getErrorCode(), "查询条件对应的码表数据不存在"), Message.MESSAGE_DATANOTEXIST_ERROR_SOLUTION);
        }
        for (DictExcelVo row : dictList) {
            row.setOrgTypeMsg(row.getOrgType().getMessage());
        }
        try {
            ExcelUtil.downLoadExcel(response, dictList, DictExcelVo.class, getExcelExportTitle(), false, "码表");
        } catch (Exception e) {
            throw new CustomException(ErrorCodeEnum.ExcelExportError);
        }
    }

    private String getExcelExportTitle() {
        return ExcelUtil.getFillingGuideFromTemplate(excelImportConfigruation.getDict());
    }

    @Override
    public void exportTemplate(HttpServletResponse response) {
        ExcelUtil.downLoadTemplateFile(response, excelImportConfigruation.getDict(), "码表导入模板.xlsx");

    }

    @Override
    @Transactional
    public void removeCatalog(List<Long> ids, Long catalogId) {
        checkCatalogIdExist(catalogId);
        for (Long id : ids) {
            DictEntity dict = dictMapper.selectById(id);
            if (dict == null) {
                throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, CheckErrorUtil.createError("ids", String.format("id为[%s]记录不存在", id)));
            }
        }
        dictMapper.removeCatalog(ids, catalogId, CustomUtil.getUser().getUserName());
    }

    private void checkExist(DictDto dict) {
        List<DictEntity> resultList = dictMapper.checkIsExist(dict.getEnName(), dict.getChName(), dict.getId(), dict.getOrgType());
        if (null == resultList || resultList.isEmpty()) {
            return;
        }
        for (DictEntity row : resultList) {
            // ID相等说明是update的当前记录。新增dict中的ID为null
            if (row.getId().equals(dict.getId())) {
                continue;
            }
            List<CheckErrorVo> errorList = Lists.newArrayList();
            if (row.getChName().equals(dict.getChName())) {
                errorList.add(new CheckErrorVo("ch_name,org_type", "码表中文名称、标准分类不能全部重复"));
            }
            if (row.getEnName().equals(dict.getEnName())) {
                errorList.add(new CheckErrorVo("en_name,org_type", "码表英文名称、标准分类不能全部重复"));
            }
            if (CustomUtil.isNotEmpty(errorList)) {
                throw new CustomException(ErrorCodeEnum.DataDuplicated, errorList,
                        Message.MESSAGE_PARAM_ERROR_SOLUTION);
            }
        }
    }

    private void checkParameter(DictDto dict) {

        checkCatalogIdExist(dict.getCatalogId());

        // 检查码值和码值描述是否重复
        Set<String> codeSet = new HashSet<>();
        // 重复的码值放处
        Set<String> repeatCodeSet = new HashSet<>();
        for (DictEnumVo row : dict.getEnums()) {
            String code = row.getCode();
            // codeSet中存在，说明重复
            if (!codeSet.contains(code)) {
                codeSet.add(code);
            } else {
                repeatCodeSet.add(code);
            }
        }

        if (!CustomUtil.isEmpty(repeatCodeSet)) {
            List<CheckErrorVo> errorList = Lists.newArrayList();
            if (!CustomUtil.isEmpty(repeatCodeSet)) {
                errorList.add(
                        new CheckErrorVo("code", String.format("码值[%s]出现重复记录", StringUtils.join(repeatCodeSet, ","))));
            }
            throw new CustomException(ErrorCodeEnum.InvalidParameter, errorList, Message.MESSAGE_PARAM_ERROR_SOLUTION);
        }

    }

    @Override
    public void checkCatalogIdExist(Long catalogId) {
        boolean exist = iDeCatalogInfoService.checkCatalogIsExist(catalogId, CatalogTypeEnum.DeDict);
        if (!exist) {
            List<CheckErrorVo> errorList = Lists.newArrayList();
            errorList.add(new CheckErrorVo("catalog_id", "目录不存在或已删除"));
            throw new CustomException(ErrorCodeEnum.InvalidParameter, errorList, Message.MESSAGE_PARAM_ERROR_SOLUTION);
        }
    }

    @Override
    public Result<List<DictVo>> queryPageByFileId(Long fileId, Integer offset, Integer limit) {
        Page<DictVo> page = new Page<DictVo>(offset, limit);
        IPage<DictEntity> pageResult = dictMapper.queryPageByFileId(page, fileId);
        List<DictVo> targetList = new ArrayList<>();
        CustomUtil.copyListProperties(pageResult.getRecords(), targetList, DictVo.class);
        Result result = Result.success(pageResult.getRecords());
        result.setTotalCount(page.getTotal());
        return result;
    }

    @Override
    public Result<List<DictVo>> queryByStdFile(Long fileId, String keyword, Integer orgType, EnableDisableStatusEnum state, Integer offset, Integer limit, String sort, String direction,String departmentId) {
        // 没有传递目录ID，返回空
        if (CustomUtil.isEmpty(fileId)) {
            return Result.success(new ArrayList<>());
        }

        Page page = new Page(offset, limit);
        // 可以用来参与排序的字段，数据库字段名称
        List<OrderItem> orderItems = PageUtil.getOrderItems(sort, direction, ORDER_TABLE_FIELDS);
        page.setOrders(orderItems);
        IPage<DictEntity> pageResult = dictMapper.queryByStdFile(page, fileId, keyword, orgType, state,departmentId);

        List<DictVo> targetList = new ArrayList<>();
        CustomUtil.copyListProperties(pageResult.getRecords(), targetList, DictVo.class);

        Result<List<DictVo>> result = Result.success(targetList);
        result.setTotalCount(page.getTotal());
        return result;
    }


    @Transactional
    public void saveDictEnums(List<DictEnumVo> enums, Long dictId) {
        int i = 0;
        List<DictEnumEntity> saveList = new ArrayList<>();
        for (DictEnumVo dictEnum : enums) {
            DictEnumEntity insertEnum = new DictEnumEntity();
            if (dictEnum.getCode() != null) {
                dictEnum.setCode(dictEnum.getCode().trim());
            }
            if (StringUtils.isBlank(dictEnum.getCode())) {
                throw new CustomException(ErrorCodeEnum.InvalidParameter, new CheckErrorVo(String.format("enum[%d].code", i), "码值输入不能为空"), Message.MESSAGE_PARAM_ERROR_SOLUTION);
            }
            if (dictEnum.getValue() != null) {
                dictEnum.setValue(dictEnum.getValue().trim());
            }
            if (StringUtils.isBlank(dictEnum.getValue())) {
                throw new CustomException(ErrorCodeEnum.InvalidParameter, new CheckErrorVo(String.format("enum[%d].value", i), "码值描述输入不能为空"), Message.MESSAGE_PARAM_ERROR_SOLUTION);
            }
            CustomUtil.copyProperties(dictEnum, insertEnum);
            insertEnum.setDictId(dictId);
            insertEnum.setId(IdWorker.getId());
            saveList.add(insertEnum);
            i++;
        }
        dictEnumMapper.save(saveList);
    }

    @Override
    public Map<Long, Integer> getCountMapGroupByCatalog() {
        List<CountGroupByCatalogDto> countList = dictMapper.selectCatalogCountList();
        Map<Long, Integer> countMap = new HashMap<>();
        if (CustomUtil.isNotEmpty(countList)) {
            countList.forEach(item -> {
                countMap.put(item.getCatalogId(), item.getCount());
            });
        }
        return countMap;
    }

    @Override
    public Map<Long, Integer> getCountMapGroupByFile() {
        List<CountGroupByFileDto> countList = dictMapper.selectFileCountList();
        Map<Long, Integer> countMap = new HashMap<>();
        if (CustomUtil.isNotEmpty(countList)) {
            countList.forEach(item -> {
                countMap.put(item.getFileId(), item.getCount());
            });
        }
        return countMap;
    }

    @Override
    public Result<Boolean> queryDataExists(Long filterId, Integer orgType, String chName, String enName,String departmentIds) {
        String deptIds =  TokenUtil.getDeptPathIds(departmentIds).getPathId();
        List<DictEntity> dataList = dictMapper.queryData(filterId, orgType, chName, enName,deptIds);
        if (CustomUtil.isEmpty(dataList)) {
            return Result.success(false);
        }
        return Result.success(true);
    }

    @Override
    public Result<List<DictVo>> queryByIds(List<Long> ids) {
        List<DictEntity> dataList = dictMapper.selectBatchIds(ids);
        List<DictVo> targetList = new ArrayList<>(dataList.size());
        CustomUtil.copyListProperties(dataList, targetList, DictVo.class);
        return Result.success(targetList);
    }

    @Override
    public Result<List<StdFileMgrVo>> queryStdFilesById(Long dictId, Integer offset, Integer limit) {
        Page<StdFileMgrEntity> page = new Page<StdFileMgrEntity>(offset, limit);
        IPage<StdFileMgrEntity> pageResult = stdFileMgrMapper.queryStdFilesByDictId(page, dictId);
        List<StdFileMgrVo> targetList = new ArrayList<>();
        CustomUtil.copyListProperties(pageResult.getRecords(), targetList, StdFileMgrVo.class);
        Result result = Result.success(targetList);
        result.setTotalCount(pageResult.getTotal());
        return result;

    }

    @Override
    public Result getDictEnumList(Long dictId) {
        DictEntity dictEntity = dictMapper.selectById(dictId);
        if (dictEntity == null || dictEntity.isDelete()) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, CheckErrorUtil.createError("dict_id", String.format("记录[%s]记录不存在；", dictId)));
        }

        List<DictEnumEntity> list =  dictEnumMapper.queryByDictId(dictId);
        return Result.success(list);
    }

}
