package com.dsg.standardization.service.impl;


import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.metadata.OrderItem;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.baomidou.mybatisplus.extension.toolkit.SimpleQuery;
import com.dsg.standardization.common.util.*;
import com.dsg.standardization.dto.*;
import com.dsg.standardization.service.extra.AfService;
import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.enums.BusinessTableStdCreatePoolStateEnum;
import com.dsg.standardization.common.enums.DataTypeEnum;
import com.dsg.standardization.common.enums.ErrorCodeEnum;
import com.dsg.standardization.common.enums.OrgTypeEnum;
import com.dsg.standardization.common.exception.CustomException;
import com.dsg.standardization.vo.*;
import com.dsg.standardization.entity.BusinessTableStdCreatePoolEntity;
import com.dsg.standardization.entity.DataElementInfo;
import com.dsg.standardization.mapper.BusinessTableStdCreatePoolMapper;
import com.dsg.standardization.vo.DataElementVo.DataElementDetailVo;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.dsg.standardization.service.BusinessTableStdCreatePoolService;
import com.dsg.standardization.service.IDataElementInfoService;


import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class BusinessTableStdCreatePoolServiceImpl extends ServiceImpl<BusinessTableStdCreatePoolMapper, BusinessTableStdCreatePoolEntity> implements BusinessTableStdCreatePoolService {
    private static final String[] ORDER_TABLE_FIELDS = new String[]{"f_create_time", "f_update_time", "f_id"};

    @Autowired
    AfService afService;

    @Autowired(required = false)
    IDataElementInfoService dataElementInfoService;

    @Autowired(required = false)
    BusinessTableStdCreatePoolMapper businessTableStdCreatePoolMapper;

    @Override
    public Result<BusinessTableModelDto> add(BusinessTableModelDto businessTableModelDto) {

        Map<String, BusinessTableStdCreatePoolEntity> map = SimpleQuery.keyMap(Wrappers.lambdaQuery(BusinessTableStdCreatePoolEntity.class)
                .eq(BusinessTableStdCreatePoolEntity::getBusinessTableModelId, businessTableModelDto.getBusinessTableModelId()), BusinessTableStdCreatePoolEntity::getBusinessTableFieldId);
        List<BusinessTableStdCreatePoolEntity> businessTableStdCreatePoolEntities = new ArrayList<>();

        businessTableModelDto.getBusinessTableFields().forEach(field -> {
            BusinessTableStdCreatePoolEntity entity = new BusinessTableStdCreatePoolEntity();
            entity.setBusinessTableModelId(businessTableModelDto.getBusinessTableModelId());
            entity.setBusinessTableName(field.getBusinessTableName());
            entity.setBusinessTableId(field.getBusinessTableId());
            entity.setBusinessTableType(field.getBusinessTableType());
            entity.setBusinessTableFieldId(field.getBusinessTableFieldId());
            entity.setBusinessTableFieldCurrentName(field.getBusinessTableFieldCurrentName());
            entity.setBusinessTableFieldOriginName(field.getBusinessTableFieldOriginName());
            entity.setBusinessTableFieldCurrentNameEn(field.getBusinessTableFieldCurrentNameEn());
            entity.setBusinessTableFieldOriginNameEn(field.getBusinessTableFieldOriginNameEn());
            entity.setBusinessTableFieldCurrentStdType(field.getBusinessTableFieldCurrentStdType());
            entity.setBusinessTableFieldOriginStdType(field.getBusinessTableFieldOriginStdType());
            entity.setBusinessTableFieldDataType(field.getBusinessTableFieldDataType());
            entity.setBusinessTableFieldDataLength(field.getBusinessTableFieldDataLength());
            entity.setBusinessTableFieldDataPrecision(field.getBusinessTableFieldDataPrecision());
            entity.setBusinessTableFieldDictName(field.getBusinessTableFieldDictName());
            entity.setBusinessTableFieldRuleName(field.getBusinessTableFieldRuleName());
            entity.setBusinessTableFieldDescription(field.getBusinessTableFieldDescription());
            BusinessTableStdCreatePoolEntity old = map.get(field.getBusinessTableFieldId());
//            field.setId(String.valueOf(IdWorker.getId()));
            entity.setId(CustomUtil.isEmpty(old) ? IdWorker.getId() : old.getId());
            if (CustomUtil.isNotEmpty(old) && CustomUtil.isNotEmpty(old.getDataElementId())) {
                businessTableStdCreatePoolMapper.deleteDeId(old.getId());
            }
            entity.setCreateUser(field.getCreateUser());
//            entity.setUpdateUser(userInfo.getUserName());
            entity.setState(BusinessTableStdCreatePoolStateEnum.WAITING.getValue());
            businessTableStdCreatePoolEntities.add(entity);
        });
        saveOrUpdateBatch(businessTableStdCreatePoolEntities);
        return Result.success(businessTableModelDto);
    }

    @Override
    public Result<Collection<BusinessTableTaskVo>> queryBusinessTableList(String keyword, List<Integer> states, String taskId, String businessTableModelId) {
        keyword = StringUtil.escapeSqlSpecialChars(keyword);
        keyword = StringUtils.substring(keyword, 0, 64);
        keyword = StringUtils.trim(keyword);
        LambdaQueryWrapper<BusinessTableStdCreatePoolEntity> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.like(StringUtils.isNotBlank(keyword), BusinessTableStdCreatePoolEntity::getBusinessTableName, keyword);
        queryWrapper.in(CustomUtil.isNotEmpty(states), BusinessTableStdCreatePoolEntity::getState, states);
        queryWrapper.eq(StringUtils.isNotBlank(businessTableModelId), BusinessTableStdCreatePoolEntity::getBusinessTableModelId, businessTableModelId);
        queryWrapper.eq(StringUtils.isNotBlank(taskId), BusinessTableStdCreatePoolEntity::getTaskId, taskId);
        queryWrapper.orderByDesc(BusinessTableStdCreatePoolEntity::getId);
        List<BusinessTableStdCreatePoolEntity> list = list(queryWrapper);


        Map<String, BusinessTableTaskVo> tableMap = new LinkedHashMap<>();
        if (CustomUtil.isNotEmpty(list)) {
            for (BusinessTableStdCreatePoolEntity entity : list) {
                if (CustomUtil.isEmpty(tableMap.get(entity.getBusinessTableName()))) {
                    BusinessTableTaskVo vo = new BusinessTableTaskVo();
                    vo.setBusinessTableName(entity.getBusinessTableName());
                    vo.setBusinessTableId(entity.getBusinessTableId());
                    vo.setTotalNumber(1);
                    vo.setBusinessTableType(entity.getBusinessTableType());
                    if (CustomUtil.isNotEmpty(entity.getDataElementId())) {
                        vo.setFinishNumber(1);
                    } else {
                        vo.setFinishNumber(0);
                    }
                    if (CustomUtil.isNotEmpty(entity.getState()) && entity.getState().equals(2)) {
                        vo.setCreateNumber(1);
                    } else {
                        vo.setCreateNumber(0);
                    }
                    tableMap.put(entity.getBusinessTableName(), vo);
                } else {
                    Integer totalNumber = tableMap.get(entity.getBusinessTableName()).getTotalNumber();
                    totalNumber += 1;
                    tableMap.get(entity.getBusinessTableName()).setTotalNumber(totalNumber);

                    if (CustomUtil.isNotEmpty(entity.getDataElementId())) {
                        Integer finishNumber = tableMap.get(entity.getBusinessTableName()).getFinishNumber();
                        finishNumber += 1;
                        tableMap.get(entity.getBusinessTableName()).setFinishNumber(finishNumber);
                    }

                    if (CustomUtil.isNotEmpty(entity.getState()) && entity.getState().equals(2)) {
                        Integer createNumber = tableMap.get(entity.getBusinessTableName()).getCreateNumber();
                        createNumber += 1;
                        tableMap.get(entity.getBusinessTableName()).setCreateNumber(createNumber);
                    }
                }
            }
        }

        return Result.success(tableMap.values(), ConvertUtil.toLong(tableMap.keySet().size()));
    }

    @Override
    public Result<List<BusinessTableFieldVo>> queryBusinessTableFieldList(BusinessTableFieldSearchDto searchDto) {
        String keyword = StringUtil.escapeSqlSpecialChars(searchDto.getKeyword());
        //Todo check

        LambdaQueryWrapper<BusinessTableStdCreatePoolEntity> queryWrapper = new LambdaQueryWrapper<>();
        if (CustomUtil.isNotEmpty(searchDto.getHaveDe())) {
            if (searchDto.getHaveDe()) {
                queryWrapper.isNotNull(BusinessTableStdCreatePoolEntity::getDataElementId);
            } else {
                queryWrapper.isNull(BusinessTableStdCreatePoolEntity::getDataElementId);
            }
        }
        queryWrapper.eq(CustomUtil.isNotEmpty(searchDto.getBusinessTableModelId()), BusinessTableStdCreatePoolEntity::getBusinessTableModelId, searchDto.getBusinessTableModelId());
        queryWrapper.eq(CustomUtil.isNotEmpty(searchDto.getBusinessTableId()), BusinessTableStdCreatePoolEntity::getBusinessTableId, searchDto.getBusinessTableId());
        queryWrapper.eq(CustomUtil.isNotEmpty(searchDto.getTaskId()), BusinessTableStdCreatePoolEntity::getTaskId, searchDto.getTaskId());
        queryWrapper.in(CustomUtil.isNotEmpty(searchDto.getState()), BusinessTableStdCreatePoolEntity::getState, searchDto.getState());
        keyword = StringUtils.substring(keyword, 0, 64);
        keyword = StringUtils.trim(keyword);
        if (StringUtils.isNotBlank(keyword)) {
            keyword = "%" + keyword.toLowerCase() + "%";
            queryWrapper.apply("(lower(f_business_table_field_current_name) like {0} or lower(f_business_table_field_origin_name) like {1} " +
                    " or lower(f_business_table_field_origin_name_en) like {2}  or lower(f_business_table_field_current_name_en) like {3})", keyword, keyword, keyword, keyword);
        }

        //创建分页实体
        Page<BusinessTableStdCreatePoolEntity> page = new Page<>(searchDto.getOffset(), searchDto.getLimit());
        List<OrderItem> orderItems = PageUtil.getOrderItems(searchDto.getSort(), searchDto.getDirection(), ORDER_TABLE_FIELDS);
        page.setOrders(orderItems);
        IPage<BusinessTableStdCreatePoolEntity> data = page(page, queryWrapper);

        List<Long> deIdList = new ArrayList<>();
        List<BusinessTableFieldVo> resultList = new ArrayList<>();
        Set<String> taskIdSet = new HashSet<>();
        if (CustomUtil.isNotEmpty(data.getRecords())) {
            for (BusinessTableStdCreatePoolEntity entity : data.getRecords()) {
                if (CustomUtil.isNotEmpty(entity.getDataElementId())) {
                    deIdList.add(entity.getDataElementId());
                }
                BusinessTableFieldVo vo = new BusinessTableFieldVo();
                CustomUtil.copyProperties(entity, vo);
                vo.setCreateStartTime(CustomUtil.isEmpty(entity.getCreateTime()) ? null : entity.getCreateTime().getTime());
                vo.setCreateEndTime(CustomUtil.isEmpty(entity.getUpdateTime()) ? null : entity.getUpdateTime().getTime());
                vo.setState(StringUtils.lowerCase(BusinessTableStdCreatePoolStateEnum.of(entity.getState()).name()));

                if (CustomUtil.isNotEmpty(vo.getTaskId()) && vo.getState().equals(BusinessTableStdCreatePoolStateEnum.CREATING.name())) {
                    taskIdSet.add(vo.getTaskId());
                }
                resultList.add(vo);

            }

            Map<Long, DataElementInfo> dataElementInfoMap = new HashMap<>();
            if (CustomUtil.isNotEmpty(deIdList)) {
                dataElementInfoMap = SimpleQuery.keyMap(Wrappers.lambdaQuery(DataElementInfo.class).in(DataElementInfo::getId, deIdList), DataElementInfo::getId);
            }

            Map<String, TaskDetailDto> taskDetailDtoMap = new HashMap<>();
            if (CustomUtil.isNotEmpty(taskIdSet)) {
                taskIdSet.stream().forEach(i -> {
                    TaskDetailDto taskDetailDto = afService.getTaskDetailDto(i);
                    if (CustomUtil.isNotEmpty(taskDetailDto)) {
                        taskDetailDtoMap.put(i, taskDetailDto);
                    }
                });
            }

            if (CustomUtil.isNotEmpty(dataElementInfoMap)) {
                Map<Long, DataElementInfo> finalDataElementInfoMap = dataElementInfoMap;
                resultList.forEach(i -> {
                    DataElementInfo current = finalDataElementInfoMap.get(i.getDataElementId());
                    if (CustomUtil.isNotEmpty(current)) {
                        BusinessTableFieldVo.DataElement dataElement = new BusinessTableFieldVo.DataElement();
                        dataElement.setNameEn(current.getNameEn());
                        dataElement.setNameCn(current.getNameCn());
                        dataElement.setStdType(current.getStdType().getCode());
                        i.setDataElement(dataElement);
                        TaskDetailDto taskDetailDto = taskDetailDtoMap.get(i.getTaskId());
                        if (CustomUtil.isNotEmpty(taskDetailDto)) {
                            i.setTaskName(taskDetailDto.getName());
                            i.setTaskStatus(taskDetailDto.getStatus());
                        }
                    }
                });
            }
        }

        return Result.success(resultList, data.getTotal());
    }

    @Override
    public Result deleteById(Long id) {
        checkID(id);
        removeById(id);
        return Result.success();
    }

    void checkID(Long id) {
        if (CustomUtil.isEmpty(id) || id.toString().length() != 19 || id <= 0) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, "参数值校验不通过", CheckErrorUtil.createError("ID", Message.MESSAGE_BUSINESS_ID), null);
        }
        BusinessTableStdCreatePoolEntity entity = getById(id);
        if (CustomUtil.isEmpty(entity)) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, "资源不存在", CheckErrorUtil.createError("ID", "对应的资源不存在"), null);
        }
    }

    @Override
    public Result createTask(StdCreateTaskDto stdCreateTaskDto) {
        stdCreateTaskDto.getIds().forEach(id -> {
            if (id.length() != 36) {
                throw new CustomException(ErrorCodeEnum.InvalidParameter, "参数值校验不通过，ID格式为36位UUID", CheckErrorUtil.createError("ids", "输入的字段ID格式为36位UUID"), null);
            }
        });
        List<BusinessTableStdCreatePoolEntity> list = new ArrayList<>();
        Date now = new Date();
        LambdaQueryWrapper<BusinessTableStdCreatePoolEntity> poolEntityLambdaQueryWrapper = new LambdaQueryWrapper<>();
        poolEntityLambdaQueryWrapper.in(BusinessTableStdCreatePoolEntity::getBusinessTableFieldId, stdCreateTaskDto.getIds());
        Map<String, BusinessTableStdCreatePoolEntity> poolEntityMap = SimpleQuery.keyMap(poolEntityLambdaQueryWrapper, BusinessTableStdCreatePoolEntity::getBusinessTableFieldId);
        if (CustomUtil.isEmpty(poolEntityMap) || poolEntityMap.size() != stdCreateTaskDto.getIds().size()) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, "参数值校验不通过，输入的字段ID不在待新建标准池中", CheckErrorUtil.createError("ids", "输入的字段ID不在待新建标准池中"), null);
        }
        stdCreateTaskDto.getIds().forEach(id -> {
            BusinessTableStdCreatePoolEntity entity = poolEntityMap.get(id);
            entity.setTaskId(stdCreateTaskDto.getTaskId());
            entity.setState(BusinessTableStdCreatePoolStateEnum.CREATING.getValue());
            entity.setCreateTime(now);
            list.add(entity);
        });
        updateBatchById(list);
        return Result.success();
    }

    @Override
    public Result cancel(List<Long> ids) {
        ids.forEach(id -> {
            if (CustomUtil.isEmpty(id) || id.toString().length() != 19 || id <= 0) {
                throw new CustomException(ErrorCodeEnum.InvalidParameter, "参数值校验不通过", CheckErrorUtil.createError("ID", Message.MESSAGE_BUSINESS_ID), null);
            }
        });

        if (CustomUtil.isNotEmpty(ids)) {
            LambdaQueryWrapper<BusinessTableStdCreatePoolEntity> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.in(BusinessTableStdCreatePoolEntity::getId, ids);
            List<BusinessTableStdCreatePoolEntity> list = list(queryWrapper);
            if (CustomUtil.isEmpty(list) || list.size() != ids.size()) {
                throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, "资源不存在", CheckErrorUtil.createError("ids", "ids对应的资源不存在"), null);
            }
            if (CustomUtil.isNotEmpty(list)) {
                list.forEach(i -> {
                            businessTableStdCreatePoolMapper.deleteTaskId(i.getId());
                        }
                );
            }
        }
        return Result.success();
    }


    @Override
    public Result submitDataElement(SubmitDeDto submitDeDto) {
        BusinessTableStdCreatePoolEntity entity = getById(submitDeDto.getId());
        if (CustomUtil.isEmpty(entity)) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, ErrorCodeEnum.DATA_NOT_EXIST.getErrorMsg(), CheckErrorUtil.createError("id", "数据已删除或不存在"), null);
        }
        if (StringUtils.isNotBlank(submitDeDto.getDataElementId())) {
            DataElementInfo dataElementInfo = dataElementInfoService.getById(ConvertUtil.toLong(submitDeDto.getDataElementId()));
            if (CustomUtil.isEmpty(dataElementInfo) || dataElementInfo.getDeleted()) {
                throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, ErrorCodeEnum.DATA_NOT_EXIST.getErrorMsg(), CheckErrorUtil.createError("dataElementId", "数据已删除或不存在"), null);
            }
            DataElementDetailVo dataElementDetailVo = dataElementInfoService.getDetailVo(ConvertUtil.toLong(submitDeDto.getDataElementId()));
            entity.setBusinessTableFieldCurrentName(dataElementDetailVo.getNameCn());
            entity.setBusinessTableFieldCurrentNameEn(dataElementDetailVo.getNameEn());
            OrgTypeEnum orgTypeEnum = EnumUtil.getEnumObject(OrgTypeEnum.class, s -> s.getMessage().equals(dataElementDetailVo.getStdTypeName())).orElse(null);
            if (CustomUtil.isNotEmpty(orgTypeEnum)) {
                entity.setBusinessTableFieldCurrentStdType(StringUtils.lowerCase(orgTypeEnum.name()));
            }
            DataTypeEnum dataTypeEnum = EnumUtil.getEnumObject(DataTypeEnum.class, s -> s.getMessage().equals(dataElementDetailVo.getDataTypeName())).orElse(null);
            if (CustomUtil.isNotEmpty(dataTypeEnum)) {
                entity.setBusinessTableFieldDataType(StringUtils.lowerCase(dataTypeEnum.name()));
            }
            entity.setBusinessTableFieldDataLength(dataElementDetailVo.getDataLength());
            entity.setBusinessTableFieldDataPrecision(dataElementDetailVo.getDataPrecision());
            if (CustomUtil.isNotEmpty(dataElementDetailVo.getDataType()) && !dataElementInfo.getDataType().equals(DataTypeEnum.Char) && !dataElementDetailVo.getDataType().equals(DataTypeEnum.Number)
                    && !dataElementDetailVo.getDataType().equals(DataTypeEnum.Decimal)
            ) {
                entity.setBusinessTableFieldDataLength(null);
            }
            //判断是否是高精度型，不是则置空精度
            if (CustomUtil.isNotEmpty(dataElementDetailVo.getDataType()) && !dataElementDetailVo.getDataType().equals(DataTypeEnum.Decimal) && !dataElementDetailVo.getDataType().equals(DataTypeEnum.Number)) {
                entity.setBusinessTableFieldDataPrecision(null);
            }


            entity.setBusinessTableFieldDictName(dataElementDetailVo.getChName());
            entity.setBusinessTableFieldRuleName(dataElementDetailVo.getRuleName());
            entity.setDataElementId(ConvertUtil.toLong(submitDeDto.getDataElementId()));
            updateById(entity);
        } else {
            businessTableStdCreatePoolMapper.deleteDeId(ConvertUtil.toLong(submitDeDto.getId()));
        }
        return Result.success();
    }

    @Override
    public Result<TaskProcessVo> queryTaskProcess(String taskId) {
        LambdaQueryWrapper<BusinessTableStdCreatePoolEntity> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(BusinessTableStdCreatePoolEntity::getTaskId, taskId);
        Long total = count(queryWrapper);
        queryWrapper.isNotNull(BusinessTableStdCreatePoolEntity::getDataElementId);
        Long finish = count(queryWrapper);
        TaskProcessVo vo = new TaskProcessVo();
        vo.setFinishNumber(finish.intValue());
        vo.setTotalNumber(total.intValue());
        return Result.success(vo);
    }

    @Override
    public Result<List<BusinessTableStateVo>> queryTaskState(BusinessTableFieldStateDto dto) {
        LambdaQueryWrapper<BusinessTableStdCreatePoolEntity> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.in(CustomUtil.isNotEmpty(dto.getBusinessTableId()), BusinessTableStdCreatePoolEntity::getBusinessTableId, dto.getBusinessTableId());
        List<Integer> states = new ArrayList<>();
        if (CustomUtil.isNotEmpty(dto.getState())) {
            states = dto.getState().stream().map(i -> BusinessTableStdCreatePoolStateEnum.valueOf(StringUtils.upperCase(i)).getValue()).collect(Collectors.toList());
        }
        queryWrapper.in(CustomUtil.isNotEmpty(states), BusinessTableStdCreatePoolEntity::getState, states);
        List<BusinessTableStdCreatePoolEntity> list = list(queryWrapper);

        List<BusinessTableStateVo> resultList = new ArrayList<>();
        if (CustomUtil.isNotEmpty(list)) {
            list.forEach(i -> {
                BusinessTableStateVo vo = new BusinessTableStateVo();
                vo.setBusinessTableFieldId(i.getBusinessTableFieldId());
                vo.setState(StringUtils.lowerCase(BusinessTableStdCreatePoolStateEnum.of(i.getState()).name()));
                resultList.add(vo);
            });
        }


        return Result.success(resultList, ConvertUtil.toLong(resultList.size()));
    }

    @Override
    public Result updateDescription(BusinessTableFieldDescriptionDto dto) {
        BusinessTableStdCreatePoolEntity entity = getById(ConvertUtil.toLong(dto.getId()));
        entity.setBusinessTableFieldDescription(dto.getDescription());
        updateById(entity);
        return Result.success();
    }

    @Override
    public Result finishTask(String taskId) {
        LambdaQueryWrapper<BusinessTableStdCreatePoolEntity> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(BusinessTableStdCreatePoolEntity::getTaskId, taskId);
        List<BusinessTableStdCreatePoolEntity> list = list(queryWrapper);

        if (CustomUtil.isNotEmpty(list)) {
            Date now = new Date();
            list.forEach(i -> {
                if (CustomUtil.isEmpty(i.getDataElementId())) {
                    throw new CustomException(ErrorCodeEnum.PARTAIL_FAILURE, "不能存在没有关联数据元的标准字段");
                }
                i.setState(BusinessTableStdCreatePoolStateEnum.CREATED.getValue());
                i.setUpdateTime(now);
                if (CustomUtil.isNotEmpty(CustomUtil.getUser()) && CustomUtil.isNotEmpty(CustomUtil.getUser().getUserId())) {
                    i.setUpdateUser(CustomUtil.getUser().getUserId());
                }

                Long dataElementId = i.getDataElementId();
                DataElementInfo dataInfo = dataElementInfoService.getById(dataElementId);
                if(dataInfo != null){
                    TaskDetailDto taskDetailDto = afService.getTaskDetailDto(taskId);
                    String orgType = taskDetailDto.getOrg_type();
                    if(!dataInfo.getStdType().equals(OrgTypeEnum.getByCode(Integer.valueOf(orgType)))){
                        throw new CustomException(ErrorCodeEnum.DataElementCheckError, "数据元标准分类不一致，请检查数据元");
                    }
                }
            });
            updateBatchById(list);
        }
        return Result.success();
    }

    @Override
    public Result accept(List<Long> ids) {
        if (CustomUtil.isNotEmpty(ids)) {
            LambdaQueryWrapper<BusinessTableStdCreatePoolEntity> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.in(BusinessTableStdCreatePoolEntity::getId, ids);
            List<BusinessTableStdCreatePoolEntity> list = list(queryWrapper);
            if (CustomUtil.isEmpty(list) || list.size() != ids.size()) {
                throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, "资源不存在", CheckErrorUtil.createError("ids", "ids对应的资源不存在"), null);
            }
            if (CustomUtil.isNotEmpty(list)) {
                list.forEach(i -> i.setState(BusinessTableStdCreatePoolStateEnum.ADOPTED.getValue()));
                updateBatchById(list);
            }
        }
        return Result.success();
    }

    @Override
    public Result businessTableUpdateDto(BusinessTableUpdateDto businessTableUpdateDto) {
        LambdaQueryWrapper<BusinessTableStdCreatePoolEntity> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(BusinessTableStdCreatePoolEntity::getBusinessTableId, businessTableUpdateDto.getBusinessTableId());
        List<BusinessTableStdCreatePoolEntity> list = list(queryWrapper);
        if (CustomUtil.isNotEmpty(list)) {
            list.forEach(i -> i.setBusinessTableName(businessTableUpdateDto.getBusinessTableName()));
            updateBatchById(list);
        }
        return Result.success();
    }


}