package com.dsg.standardization.service.impl;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.metadata.OrderItem;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.constant.MqTopic;
import com.dsg.standardization.common.constant.RuleConstants;
import com.dsg.standardization.common.enums.*;
import com.dsg.standardization.common.util.*;
import com.dsg.standardization.dto.*;
import com.dsg.standardization.entity.*;
import com.dsg.standardization.vo.*;
import com.dsg.standardization.common.exception.CustomException;
import com.dsg.standardization.common.producer.KafkaProducerService;
import com.dsg.standardization.mapper.RelationRuleFileMapper;
import com.dsg.standardization.mapper.RuleMapper;
import com.dsg.standardization.mapper.StdFileMgrMapper;
import com.dsg.standardization.service.IDataElementInfoService;
import com.dsg.standardization.service.IDeCatalogInfoService;
import com.dsg.standardization.service.IDictService;
import com.dsg.standardization.service.RuleService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.collect.Lists;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

@Slf4j
@Service
public class RuleServiceImpl extends ServiceImpl<RuleMapper, RuleEntity> implements RuleService {

    @Autowired(required = false)
    RuleMapper ruleMapper;

    @Autowired
    IDeCatalogInfoService iDeCatalogInfoService;

    @Autowired
    IDataElementInfoService iDataElementInfoService;

    @Autowired
    RelationRuleFileMapper relationRuleFileMapper;

    @Autowired
    IDictService dictService;

    @Autowired
    StdFileMgrMapper stdFileMgrMapper;
    @Autowired
    KafkaProducerService kafkaProducerService;


    private static final String[] ORDER_TABLE_FIELDS = new String[]{"f_create_time", "f_update_time", "f_state", "f_org_type", "f_id"};

    @Override
    public Result queryList(Long catalogId,
                            String keyword,
                            Integer orgType,
                            EnableDisableStatusEnum state,
                            Integer offset,
                            Integer limit,
                            String sort,
                            String direction , String departmentId, RuleTypeEnum ruleType) {
        if (StringUtils.isNotBlank(departmentId) && String.valueOf(DefaultCatalogEnum.Rule.getCode()).equals(departmentId)) {
            catalogId = Long.valueOf(DefaultCatalogEnum.Rule.getCode());
            departmentId = null;
        }
        Page<RuleEntity> page = new Page<RuleEntity>(offset, limit);
        // 可以用来参与排序的字段，数据库字段名称
        List<OrderItem> orderItems = PageUtil.getOrderItems(sort, direction, ORDER_TABLE_FIELDS);
        page.setOrders(orderItems);
        List<Long> catalogIds = iDeCatalogInfoService.getIDList(catalogId);
        if (CustomUtil.isEmpty(catalogIds) && StringUtils.isBlank(departmentId)) {
            return Result.success(new ArrayList<>());
        }
        IPage<RuleEntity> pageResult = ruleMapper.queryList(page, catalogIds, keyword, orgType, state,departmentId,ruleType);
        return dbDataToVo(pageResult);
    }

    private Result dbDataToVo(IPage<RuleEntity> pageResult) {
        List<RuleVo> targetList = new ArrayList<>(pageResult.getRecords().size());
        // 查询使用的码表，设置被使用标识
        List<Long> ruleIds = new ArrayList<>();
        Set<String> deptIds = new HashSet<>();
        Set<Long> catalogIds = new HashSet<>();
        for (RuleEntity source : pageResult.getRecords()) {
            RuleVo target = new RuleVo();
            CustomUtil.copyProperties(source, target);
            if (RuleTypeEnum.CUSTOM.equals(target.getRuleType())) {
                target.setCustom(JsonUtils.json2List(source.getExpression(), RuleCustom.class));
            } else {
                target.setRegex(source.getExpression());
            }
            if(CustomUtil.isNotEmpty(source.getDepartmentIds())){
                deptIds.add(StringUtil.PathSplitAfter(source.getDepartmentIds()));
            }
            targetList.add(target);
            catalogIds.add(source.getCatalogId());
            ruleIds.add(source.getId());
        }

        if (CustomUtil.isNotEmpty(targetList)) {
            List<DeCatalogInfo> catalogEntryList = iDeCatalogInfoService.listByIds(catalogIds);
            Set<Long> usedIds = iDataElementInfoService.ruleUsed(ruleIds);

            Map<Long, String> catalogIdNameMap = new HashMap<>();
            for (DeCatalogInfo row : catalogEntryList) {
                catalogIdNameMap.put(row.getId(), row.getCatalogName());
            }
            // 查询部门名称
            Map<String, Department> deptEntityMap = TokenUtil.getMapDeptInfo(deptIds);
            for (RuleVo row : targetList) {
                row.setCatalogName(catalogIdNameMap.get(row.getCatalogId()));
                row.setFullCatalogName(catalogIdNameMap.get(row.getCatalogId()));

                if (usedIds.contains(row.getId())) {
                    row.setUsedFlag(true);
                } else {
                    row.setUsedFlag(false);
                }
                row.setDepartmentId(StringUtil.PathSplitAfter(row.getDepartmentIds()));
                row.setDepartmentName(deptEntityMap.get(row.getDepartmentId())==null?null:deptEntityMap.get(row.getDepartmentId()).getName());
                row.setDepartmentPathNames(deptEntityMap.get(row.getDepartmentId())==null?null:deptEntityMap.get(row.getDepartmentId()).getPathName());
            }
        }

        Result result = Result.success(targetList);
        result.setTotalCount(pageResult.getTotal());
        return result;
    }

    @Override
    public Result updateState(Long id, EnableDisableStatusEnum state, String reason) {
        RuleEntity entity = ruleMapper.selectById(id);
        if (null == entity || entity.isDelete()) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, "数据不存在");
        }
        entity.setState(state);
        if (EnableDisableStatusEnum.ENABLE.equals(state)) {
            entity.setDisableReason("");
        } else {
            entity.setDisableReason(reason);
        }
        ruleMapper.updateById(entity);
        String mqInfo = packageMqInfo(Arrays.asList(entity), "update");
        log.info("启用或停用编码规则：mqInfo:{}",mqInfo);
        kafkaProducerService.sendMessage(MqTopic.MQ_MESSAGE_SAILOR,mqInfo);
        return Result.success();
    }

    @Override
    public Result queryByIds(List<Long> ids) {
        List<RuleEntity> sourceList = ruleMapper.queryByIds(ids);
        List<RuleVo> targetList = new ArrayList<>();
        for (RuleEntity source : sourceList) {
            RuleVo target = new RuleVo();
            CustomUtil.copyProperties(source, target);
            if (RuleTypeEnum.CUSTOM.equals(target.getRuleType())) {
                target.setCustom(JsonUtils.json2List(source.getExpression(), RuleCustom.class));
            } else {
                target.setRegex(source.getExpression());
            }
            targetList.add(target);
        }
        return Result.success(targetList);
    }

    @Override
    public Result queryByStdFileCatalog(Long stdFileCatalogId,
                                        String keyword,
                                        Integer orgType,
                                        EnableDisableStatusEnum state,
                                        Integer offset,
                                        Integer limit,
                                        String sort,
                                        String direction,RuleTypeEnum ruleType) {

        // 没有传递目录ID，返回空
        if (CustomUtil.isEmpty(stdFileCatalogId)) {
            return Result.success(new ArrayList<>());
        }

        Page<RuleEntity> page = new Page<RuleEntity>(offset, limit);
        // 可以用来参与排序的字段，数据库字段名称
        List<OrderItem> orderItems = PageUtil.getOrderItems(sort, direction, ORDER_TABLE_FIELDS);
        page.setOrders(orderItems);

        // 查询没有关联标准文件的记录
        if (-1 == stdFileCatalogId) {
            IPage<RuleEntity> pageResult = ruleMapper.queryDataNotUesdStdFile(page, keyword, orgType, state,ruleType);
            return dbDataToVo(pageResult);
        }

        // 查询关联了标准文件的记录
        List<RuleVo> targetList = new ArrayList<>();
        DeCatalogInfo catalog = iDeCatalogInfoService.getById(stdFileCatalogId);
        // 目录不是标准文件目录，直接返回
        if (catalog == null || !catalog.getType().equals(CatalogTypeEnum.File)) {
            return Result.success(targetList);
        }

        IPage<RuleEntity> pageResult;
        // 标准文件的顶级目录，需要返回所有的编码规则
        if (catalog.isRootPath()) {
            pageResult = ruleMapper.queryList(page, null, keyword, orgType, state,null,ruleType);
        } else {
            List<Long> catalogIds = iDeCatalogInfoService.getIDList(stdFileCatalogId);
            pageResult = ruleMapper.queryByStdFileCatalog(page, catalogIds, keyword, orgType, state,ruleType);
        }
        return dbDataToVo(pageResult);
    }

    @Override
    public void addRelation(Long stdFileId, List<Long> relationRuleList) {

        List<RelationRuleFileEntity> oldRelations = relationRuleFileMapper.queryByFileId(stdFileId);
        Set<Long> oldDeIdSet = new HashSet<>(oldRelations.size());
        for (RelationRuleFileEntity row : oldRelations) {
            oldDeIdSet.add(row.getRuleId());
        }

        List<Long> updataList = new ArrayList<>();
        List<RelationRuleFileEntity> insertList = new ArrayList<>();
        if (CustomUtil.isNotEmpty(relationRuleList)) {
            List<RuleEntity> exists = ruleMapper.selectBatchIds(relationRuleList);

            for (RuleEntity row : exists) {
                RelationRuleFileEntity r = new RelationRuleFileEntity();
                r.setId(IdWorker.getId());
                r.setRuleId(row.getId());
                r.setFileId(stdFileId);
                insertList.add(r);
                if (!oldDeIdSet.contains(row.getId())) {
                    updataList.add(row.getId());
                }
                oldDeIdSet.remove(row.getId());
            }
        }

        relationRuleFileMapper.deleteByFileId(stdFileId);
        if (CustomUtil.isNotEmpty(insertList)) {
            relationRuleFileMapper.save(insertList);
        }

        updataList.addAll(oldDeIdSet);
        if (CustomUtil.isNotEmpty(updataList)) {
            UserInfo userInfo = CustomUtil.getUser();
            ruleMapper.updateVersionByIds(updataList, userInfo.getUserName());
        }

    }

    @Override
    public List<RuleVo> queryByFileId(Long id) {
        List<RuleEntity> source = ruleMapper.queryByFileId(id);
        List<RuleVo> targetList = new ArrayList<>();
        CustomUtil.copyListProperties(source, targetList, RuleVo.class);
        return targetList;
    }

    @Override
    public Result<List<RuleVo>> queryPageByFileId(Long fileId, Integer offset, Integer limit) {
        Page<RuleVo> page = new Page<RuleVo>(offset, limit);
        IPage<RuleEntity> pageResult = ruleMapper.queryPageByFileId(page, fileId);
        List<RuleVo> targetList = new ArrayList<>();
        CustomUtil.copyListProperties(pageResult.getRecords(), targetList, RuleVo.class);
        Result result = Result.success(pageResult.getRecords());
        result.setTotalCount(page.getTotal());
        return result;
    }


    @Override
    public RuleVo queryById(Long id) {
        RuleEntity source = ruleMapper.selectById(id);
        if (source == null) {
            return null;
        }
        RuleVo target = new RuleVo();
        CustomUtil.copyProperties(source, target);
        if(source.getDeleted()){
            target.setState(EnableDisableStatusEnum.DISABLE);
        }
        DeCatalogInfo catalog = iDeCatalogInfoService.getById(target.getCatalogId());
        if (CustomUtil.isNotEmpty(catalog)) {
            target.setCatalogName(catalog.getCatalogName());
        }
        if (RuleTypeEnum.CUSTOM.equals(target.getRuleType())) {
            target.setCustom(JsonUtils.json2List(source.getExpression(), RuleCustom.class));
        } else {
            target.setRegex(source.getExpression());
        }

        List<RelationRuleFileEntity> relation = relationRuleFileMapper.queryByRuleId(id);
        List<Long> fileIds = new ArrayList<>(relation.size());
        for (RelationRuleFileEntity row : relation) {
            fileIds.add(row.getFileId());
        }
        target.setStdFiles(fileIds);
        String deptId = StringUtil.PathSplitAfter(source.getDepartmentIds());
        Map<String, Department> deptEntityMap = TokenUtil.getMapDeptInfo(Arrays.asList(deptId));
        target.setDepartmentId(deptId);
        target.setDepartmentName(deptEntityMap.get(deptId)==null?null:deptEntityMap.get(deptId).getName());
        target.setDepartmentPathNames(deptEntityMap.get(deptId)==null?null:deptEntityMap.get(deptId).getPathName());
        return target;
    }

    @Override
    @Transactional
    public Result create(RuleDto insertDto) {
        checkAddDataExist(insertDto);
        checkCatalogIdExist(insertDto.getCatalogId());
        checkRuleExpression(insertDto);

        RuleEntity insert = new RuleEntity();
        CustomUtil.copyProperties(insertDto, insert);
        Date now = new Date();
        UserInfo userInfo = CustomUtil.getUser();
        insert.setAuthorityId(userInfo.getUserId());
        insert.setCreateUser(userInfo.getUserName());
        insert.setUpdateUser(userInfo.getUserName());
        insert.setCreateTime(now);
        insert.setUpdateTime(now);
        Department department = TokenUtil.getDeptPathIds(insertDto.getDepartmentIds());
        insert.setDepartmentIds(department.getPathId());
        insert.setThirdDeptId(department.getThirdDeptId());
        insert.setExpression(getExpression(insertDto));
        int rlt = ruleMapper.insert(insert);

        saveRelationRuleFile(insert.getId(), insertDto.getStdFiles());

        RuleVo target = new RuleVo();
        CustomUtil.copyProperties(insert, target);
        String mqInfo = packageMqInfo(Arrays.asList(insert), "insert");
        log.info("编码规则：mqInfo:{}",mqInfo);
        kafkaProducerService.sendMessage(MqTopic.MQ_MESSAGE_SAILOR,mqInfo);
        return Result.success(target);
    }

    /**
     * @param lists
     * @param type   insert update delete 插入 更新
     * @return
     */
    private String packageMqInfo(List<RuleEntity> lists,String type){

        DataMqDto mqDto = new DataMqDto();
        mqDto.setHeader(new HashMap());

        DataMqDto.Payload payload =  mqDto.new Payload();
        payload.setType("smart-recommendation-graph");

        DataMqDto.Content<RuleEntity> content =  mqDto.new Content<>();
        content.setType(type);
        content.setTable_name("t_rule");
        content.setEntities(lists);

        payload.setContent(content);

        mqDto.setPayload(payload);

        ObjectMapper objectMapper = new ObjectMapper();
        try {
            String jsonString = objectMapper.writeValueAsString(mqDto);
            return jsonString;
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    private void checkRuleExpression(RuleDto ruleDto) {
        if (RuleTypeEnum.REGEX.equals(ruleDto.getRuleType())) {
            if (CustomUtil.isEmpty(ruleDto.getRegex())) {
                List<CheckErrorVo> errorList = Lists.newArrayList();
                errorList.add(new CheckErrorVo("regex", "正则表达式为空"));
                throw new CustomException(ErrorCodeEnum.InvalidParameter, errorList, Message.MESSAGE_PARAM_ERROR_SOLUTION);
            }

            if (!isRegexValid(ruleDto.getRegex())) {
                List<CheckErrorVo> errorList = Lists.newArrayList();
                errorList.add(new CheckErrorVo("regex", "正则表达式非法"));
                throw new CustomException(ErrorCodeEnum.InvalidParameter, errorList, Message.MESSAGE_PARAM_ERROR_SOLUTION);
            }
        } else {
            if (CustomUtil.isEmpty(ruleDto.getCustom())) {
                List<CheckErrorVo> errorList = Lists.newArrayList();
                errorList.add(new CheckErrorVo("custom", "不能为空"));
                throw new CustomException(ErrorCodeEnum.InvalidParameter, errorList, Message.MESSAGE_PARAM_ERROR_SOLUTION);
            }
            int idx = 0;
            for (RuleCustom row : ruleDto.getCustom()) {
                idx++;
                String filedNamePrefix = String.format("custom[%s].", idx);
                if (row.getSegment_length() <= 0) {
                    List<CheckErrorVo> errorList = CheckErrorUtil.createError(filedNamePrefix + "segment_length", "值必须为正整数");
                    throw new CustomException(ErrorCodeEnum.InvalidParameter, errorList, Message.MESSAGE_PARAM_ERROR_SOLUTION);
                }
                RuleCustomTypeEnum customType = row.getType();
                if (RuleCustomTypeEnum.DICT.equals(customType)) {
                    Long dictId = ConvertUtil.toLong(row.getValue());
                    if (CustomUtil.isEmpty(dictId)) {
                        List<CheckErrorVo> errorList = CheckErrorUtil.createError(filedNamePrefix + "value", "码表的唯一标识格式不正确");
                        throw new CustomException(ErrorCodeEnum.InvalidParameter, errorList, Message.MESSAGE_PARAM_ERROR_SOLUTION);
                    }
                    DictVo data = dictService.queryById(dictId);
                    if (data == null) {
                        List<CheckErrorVo> errorList = CheckErrorUtil.createError(filedNamePrefix + "value", "码表不存在");
                        throw new CustomException(ErrorCodeEnum.InvalidParameter, errorList, Message.MESSAGE_PARAM_ERROR_SOLUTION);
                    }
                } else if (RuleCustomTypeEnum.DATE.equals(customType)) {
                    if (CustomUtil.isEmpty(row.getValue())) {
                        List<CheckErrorVo> errorList = CheckErrorUtil.createError(filedNamePrefix + "value", "不能为空");
                        throw new CustomException(ErrorCodeEnum.InvalidParameter, errorList, Message.MESSAGE_PARAM_ERROR_SOLUTION);
                    }
                    if (!RuleConstants.CUSTOM_DATE_FORMAT.contains(row.getValue())) {
                        List<CheckErrorVo> errorList = CheckErrorUtil.createError(filedNamePrefix + "value", "不支持的日期格式");
                        throw new CustomException(ErrorCodeEnum.InvalidParameter, errorList, Message.MESSAGE_PARAM_ERROR_SOLUTION);
                    }

                } else if (RuleCustomTypeEnum.SPLIT_STR.equals(customType)) {
                    if (CustomUtil.isEmpty(row.getValue())) {
                        List<CheckErrorVo> errorList = CheckErrorUtil.createError(filedNamePrefix + "value", "不能为空");
                        throw new CustomException(ErrorCodeEnum.InvalidParameter, errorList, Message.MESSAGE_PARAM_ERROR_SOLUTION);
                    }
                }
            }
        }
    }

    public static boolean isRegexValid(String regex) {
        try {
            Pattern.compile(regex);
            return true;
        } catch (PatternSyntaxException e) {
            return false;
        }
    }

    private String getExpression(RuleDto insertDto) {
        if (RuleTypeEnum.REGEX.equals(insertDto.getRuleType())) {
            return insertDto.getRegex();
        } else {
            return JsonUtils.obj2json(insertDto.getCustom());
        }
    }

    private void saveRelationRuleFile(Long id, List<Long> stdFlles) {
        if (!CustomUtil.isEmpty(stdFlles)) {
            List<RelationRuleFileEntity> relations = new ArrayList<>(stdFlles.size());
            for (Long fileId : stdFlles) {
                RelationRuleFileEntity entity = new RelationRuleFileEntity();
                entity.setId(IdWorker.getId());
                entity.setRuleId(id);
                entity.setFileId(fileId);
                relations.add(entity);
            }
            relationRuleFileMapper.save(relations);
        }
    }


    @Override
    @Transactional
    public Result update(Long id, RuleDto updateDto) {
        RuleEntity exist = ruleMapper.selectById(id);
        if (exist == null) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, CheckErrorUtil.createError("id", "记录不存在"));
        }
        checkUpdateDataExist(id, updateDto);
        checkCatalogIdExist(updateDto.getCatalogId());

        boolean change = checkVersionChange(exist, updateDto);
        if (!change) {
            return Result.success(exist);
        }
        UserInfo userInfo = CustomUtil.getUser();
        log.info("==编码规则修改=请求部门id==={}==",updateDto.getDepartmentIds());
        Department department = TokenUtil.getDeptPathIds(updateDto.getDepartmentIds());
        exist.setDepartmentIds(department.getPathId());
        exist.setThirdDeptId(department.getThirdDeptId());

        exist.setName(updateDto.getName());
        exist.setDescription(updateDto.getDescription());
        exist.setCatalogId(updateDto.getCatalogId());
        exist.setOrgType(updateDto.getOrgType());
        exist.setRuleType(updateDto.getRuleType());
        exist.setExpression(getExpression(updateDto));
        if(updateDto.getState()!=null){
            exist.setState(updateDto.getState());
        }
        exist.setUpdateUser(userInfo.getUserName());
        exist.setUpdateTime(new Date());
        exist.setVersion(exist.getVersion() + 1);
        int rlt = ruleMapper.updateById(exist);

        relationRuleFileMapper.deleteByRuleId(exist.getId());
        saveRelationRuleFile(exist.getId(), updateDto.getStdFiles());

        RuleVo target = new RuleVo();
        CustomUtil.copyProperties(exist, target);
        String mqInfo = packageMqInfo(Arrays.asList(exist), "update");
        log.info("更新编码规则：mqInfo:{}",mqInfo);
        kafkaProducerService.sendMessage(MqTopic.MQ_MESSAGE_SAILOR,mqInfo);
        return Result.success(target);
    }

    private boolean checkVersionChange(RuleEntity old, RuleDto newData) {
        if (!old.getName().equals(newData.getName())) {
            return true;
        }

        if (!old.getCatalogId().equals(newData.getCatalogId())) {
            return true;
        }

        if (!old.getDepartmentIds().equals(newData.getDepartmentIds())) {
            return true;
        }

        if (!old.getOrgType().equals(newData.getOrgType())) {
            return true;
        }

        String newDescription = newData.getDescription() == null ? "" : newData.getDescription();
        String oldDescription = old.getDescription() == null ? "" : old.getDescription();
        if (!newDescription.equals(oldDescription)) {
            return true;
        }

        if (!old.getRuleType().equals(newData.getRuleType())) {
            return true;
        }

        if (RuleTypeEnum.REGEX.equals(newData.getRuleType()) && !old.getExpression().equals(newData.getRegex())) {
            return true;
        }

        if (RuleTypeEnum.CUSTOM.equals(newData.getRuleType())) {
            List<RuleCustom> oldConstom = JsonUtils.json2List(old.getExpression(), RuleCustom.class);
            if (oldConstom == null) {
                return true;
            }

            if (oldConstom.size() != newData.getCustom().size()) {
                return true;
            }

            for (RuleCustom newRow : newData.getCustom()) {
                Iterator<RuleCustom> iterator = oldConstom.iterator();
                while (iterator.hasNext()) {
                    RuleCustom oldRow = iterator.next();
                    if (newRow.equals(oldRow)) {
                        iterator.remove();
                        break;
                    }
                }
            }
            if (oldConstom.size() > 0) {
                return true;
            }
        }

        List<RelationRuleFileEntity> relationRuleFileEntityList = relationRuleFileMapper.queryByRuleId(old.getId());
        if (CustomUtil.isEmpty(newData.getStdFiles()) && CustomUtil.isNotEmpty(relationRuleFileEntityList)) {
            return true;
        }

        if (CustomUtil.isNotEmpty(newData.getStdFiles()) && CustomUtil.isEmpty(relationRuleFileEntityList)) {
            return true;
        }

        if (CustomUtil.isNotEmpty(newData.getStdFiles()) && CustomUtil.isNotEmpty(relationRuleFileEntityList)) {
            if (relationRuleFileEntityList.size() != newData.getStdFiles().size()) {
                return true;
            }

            for (Long newId : newData.getStdFiles()) {
                Iterator<RelationRuleFileEntity> iterator = relationRuleFileEntityList.iterator();
                while (iterator.hasNext()) {
                    RelationRuleFileEntity oldRow = iterator.next();
                    if (newId.equals(oldRow.getId())) {
                        iterator.remove();
                        break;
                    }
                }
            }
            if (relationRuleFileEntityList.size() > 0) {
                return true;
            }
        }


        return false;
    }


    @Override
    @Transactional
    public Result deleteBatch(String ids) {
        String[] idArray = ids.split(",");
        List<Long> idList = new ArrayList<>();
        for (String dictIdStr : idArray) {
            Long dictId = ConvertUtil.toLong(dictIdStr);
            if (!CustomUtil.isEmpty(dictId)) {
                idList.add(dictId);
            }
        }
        ruleMapper.deleteByIds(idList);
        List<RuleEntity> list = new ArrayList<>();
        String[] split = ids.split(",");
        for(String id : split){
            RuleEntity temp = new RuleEntity();
            temp.setId(Long.valueOf(id));
            list.add(temp);
        }
        String mqInfo = packageMqInfo(list, "delete");
        log.info("删除编码规则：mqInfo:{}",mqInfo);
        kafkaProducerService.sendMessage(MqTopic.MQ_MESSAGE_SAILOR,mqInfo);
        return Result.success();
    }

    @Override
    @Transactional
    public Result removeCatalog(List<Long> ids, Long catalogId) {
        checkCatalogIdExist(catalogId);
        UserInfo userInfo = CustomUtil.getUser();
        ruleMapper.removeCatalog(ids, catalogId, userInfo.getUserName());
        return Result.success();
    }

    @Override
    public Result queryUsedDataElementByRuleId(Long id, Integer offset, Integer limit) {
        RuleEntity ruleEntity = ruleMapper.selectById(id);
        if (ruleEntity == null) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, CheckErrorUtil.createError("id", "记录不存在"));
        }
        IPage<DataElementInfo> resultPageData = iDataElementInfoService.queryByRuleId(ruleEntity.getId(), offset, limit);
        Result result = Result.success(resultPageData.getRecords());
        result.setTotalCount(resultPageData.getTotal());
        return result;
    }


    @Override
    public Result<List<RuleVo>> queryByStdFile(Long stdFileId,
                                               String keyword,
                                               Integer orgType,
                                               EnableDisableStatusEnum state,
                                               Integer offset,
                                               Integer limit,
                                               String sort,
                                               String direction,String departmentId, RuleTypeEnum ruleType) {
        // 没有传递目录ID，返回空
        if (CustomUtil.isEmpty(stdFileId)) {
            return Result.success(new ArrayList<>());
        }

        Page<RuleEntity> page = new Page<RuleEntity>(offset, limit);
        // 可以用来参与排序的字段，数据库字段名称
        List<OrderItem> orderItems = PageUtil.getOrderItems(sort, direction, ORDER_TABLE_FIELDS);
        page.setOrders(orderItems);
        IPage<RuleEntity> pageResult = ruleMapper.queryByStdFile(page, stdFileId, keyword, orgType, state,departmentId,ruleType);
        return dbDataToVo(pageResult);
    }

    private void checkAddDataExist(RuleDto dto) {
        List<RuleEntity> resultList = ruleMapper.queryByNameAndOrgType(dto.getName(), dto.getOrgType());
        if (!CustomUtil.isEmpty(resultList)) {
            List<CheckErrorVo> errorList = Lists.newArrayList();
            errorList.add(new CheckErrorVo("name", "规则名称已存在"));
            throw new CustomException(ErrorCodeEnum.InvalidParameter, errorList, Message.MESSAGE_PARAM_ERROR_SOLUTION);
        }
    }

    private void checkUpdateDataExist(Long id, RuleDto dto) {
        List<RuleEntity> resultList = ruleMapper.queryByNameAndOrgType(dto.getName(), dto.getOrgType());
        if (!CustomUtil.isEmpty(resultList)) {
            for (RuleEntity row : resultList) {
                if (!row.getId().equals(id)) {
                    List<CheckErrorVo> errorList = Lists.newArrayList();
                    errorList.add(new CheckErrorVo("name", "规则名称已存在"));
                    throw new CustomException(ErrorCodeEnum.InvalidParameter, errorList, Message.MESSAGE_PARAM_ERROR_SOLUTION);
                }
            }
        }
    }


    private void checkCatalogIdExist(Long catalogId) {
        boolean exist = iDeCatalogInfoService.checkCatalogIsExist(catalogId, CatalogTypeEnum.ValueRule);
        if (!exist) {
            List<CheckErrorVo> errorList = Lists.newArrayList();
            errorList.add(new CheckErrorVo("catalog_id", String.format("目录id[%s]对应的目录不存在", String.valueOf(catalogId))));
            throw new CustomException(ErrorCodeEnum.InvalidParameter, errorList, Message.MESSAGE_PARAM_ERROR_SOLUTION);
        }
    }

    @Override
    public Map<Long, Integer> getCountMapGroupByCatalog() {
        List<CountGroupByCatalogDto> countList = ruleMapper.selectCountList();
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
        List<CountGroupByFileDto> countList = ruleMapper.selectFileCountList();
        Map<Long, Integer> countMap = new HashMap<>();
        if (CustomUtil.isNotEmpty(countList)) {
            countList.forEach(item -> {
                countMap.put(item.getFileId(), item.getCount());
            });
        }
        return countMap;
    }

    @Override
    public Result<Boolean> queryDataExists(Long filterId, String name,String departmentIds) {
        String deptIds =  TokenUtil.getDeptPathIds(departmentIds).getPathId();
        List<RuleEntity> dataList = ruleMapper.queryData(filterId, name,deptIds);
        if (CustomUtil.isEmpty(dataList)) {
            return Result.success(false);
        }
        return Result.success(true);
    }

    @Override
    public Result<List<StdFileMgrVo>> queryStdFilesById(Long id, Integer offset, Integer limit) {
        Page<StdFileMgrEntity> page = new Page<StdFileMgrEntity>(offset, limit);
        IPage<StdFileMgrEntity> pageResult = stdFileMgrMapper.queryStdFilesByRuleId(page, id);
        List<StdFileMgrVo> targetList = new ArrayList<>();
        CustomUtil.copyListProperties(pageResult.getRecords(), targetList, StdFileMgrVo.class);
        Result result = Result.success(targetList);
        result.setTotalCount(pageResult.getTotal());
        return result;
    }

    @Override
    public RuleVo getDetailByDataId(Long dataId) {
        DataElementInfo dataElementInfo = iDataElementInfoService.getById(dataId);
        if (dataElementInfo == null || null==dataElementInfo.getRuleId()) {
            return null;
        }
        return this.queryById(dataElementInfo.getRuleId());
    }

    @Override
    public RuleVo getDetailByDataCode(Long dataCode) {
        DataElementInfo dataElementInfo = iDataElementInfoService.getOneByIdOrCode(2,dataCode);
        if (dataElementInfo == null || null==dataElementInfo.getRuleId()) {
            return null;
        }
        return this.queryById(dataElementInfo.getRuleId());
    }
}