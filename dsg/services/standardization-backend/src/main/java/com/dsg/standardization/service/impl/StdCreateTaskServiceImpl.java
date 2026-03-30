package com.dsg.standardization.service.impl;

import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.metadata.OrderItem;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.dsg.standardization.common.enums.EnableDisableStatusEnum;
import com.dsg.standardization.common.enums.ErrorCodeEnum;
import com.dsg.standardization.common.enums.TaskComplatedStatusEnum;
import com.dsg.standardization.common.exception.CustomException;
import com.dsg.standardization.common.util.CustomUtil;
import com.dsg.standardization.common.util.CheckErrorUtil;
import com.dsg.standardization.common.util.ConvertUtil;
import com.dsg.standardization.common.util.PageUtil;
import com.dsg.standardization.dto.CustomTaskCreateDto;
import com.dsg.standardization.dto.CustomTbFieldDto;
import com.dsg.standardization.dto.TaskDto;
import com.dsg.standardization.entity.DataElementInfo;
import com.dsg.standardization.entity.TaskStdCreateEntity;
import com.dsg.standardization.entity.TaskStdCreateResultEntity;
import com.dsg.standardization.mapper.TaskStdCreateMapper;
import com.dsg.standardization.mapper.TaskStdCreateResultMapper;
import com.dsg.standardization.service.AfStdTaskService;
import com.dsg.standardization.service.IDataElementInfoService;
import com.dsg.standardization.service.TaskStdCreateService;
import com.dsg.standardization.vo.*;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service("stdCreateTaskService")
public class StdCreateTaskServiceImpl extends ServiceImpl<TaskStdCreateMapper, TaskStdCreateEntity> implements TaskStdCreateService {

    @Autowired
    TaskStdCreateMapper taskStdCreateMapper;

    @Autowired
    TaskStdCreateResultMapper taskStdCreateResultMapper;

    @Autowired
    IDataElementInfoService iDataElementInfoService;

    @Lazy
    @Autowired
    AfStdTaskService afStdTaskService;


    @Override
    public Result<List<TaskVo>> queryList(Integer status, String keyword, Integer offset, Integer limit, String sort, String direction) {
        Page<TaskStdCreateEntity> page = new Page<TaskStdCreateEntity>(offset, limit);
        String[] orderField = new String[]{"f_create_time", "f_update_time"};
        List<OrderItem> orderItems = PageUtil.getOrderItems(sort, direction, orderField);
        page.setOrders(orderItems);
        IPage<TaskStdCreateEntity> pageResult = taskStdCreateMapper.queryList(page, status, keyword);
        List<TaskVo> targetList = new ArrayList<>();
        CustomUtil.copyListProperties(pageResult.getRecords(), targetList, TaskVo.class);

        Result<List<TaskVo>> result = Result.success(targetList);
        result.setTotalCount(page.getTotal());
        return result;
    }

    @Override
    public TaskVo queryById(Long id) {
        TaskStdCreateEntity source = taskStdCreateMapper.queryById(id);
        if (source == null) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, "记录不存在");
        }
        TaskVo target = new TaskVo();
        CustomUtil.copyProperties(source, target);
        List<TaskResultVo> resultVoList = taskStdCreateResultMapper.queryByTaskId(id);
        target.setTableFields(resultVoList);

        Set<Long> stdCodes = new HashSet<>();
        int relationNum = 0;
        for (TaskResultVo row : resultVoList) {
            if (CustomUtil.isNotEmpty(row.getStdCode())) {
                Long code = ConvertUtil.toLong(row.getStdCode());
                stdCodes.add(code);
                relationNum++;
            }
        }
        target.setRelationField(relationNum);
        target.setTotalField(resultVoList.size());

        setRecData(target);

        // 填充数据元名称
        List<DataElementInfo> dataElements = iDataElementInfoService.queryByCodes(stdCodes);
        Map<String, DataElementInfo> dataElementInfoMap = new HashMap<>();
        for (DataElementInfo row : dataElements) {
            if (EnableDisableStatusEnum.ENABLE.equals(row.getState())) {
                dataElementInfoMap.put(String.valueOf(row.getCode()), row);
            }
        }
        for (TaskResultVo row : resultVoList) {
            if (CustomUtil.isNotEmpty(row.getStdCode())) {
                row.setStdDel(true);
                String code = row.getStdCode();
                if (dataElementInfoMap.containsKey(code)) {
                    row.setStdDel(false);
                    row.setStdId(dataElementInfoMap.get(code).getId());
                    row.setStdChName(dataElementInfoMap.get(code).getNameCn());
                    row.setStdEnName(dataElementInfoMap.get(code).getNameEn());
                }
            }
        }
        return target;
    }

    private void setRecData(TaskVo task) {

        // 1. 将体结果的数据源code提出来，
        // 2. 整理出字段名称和数据源code的对应关系
        Set<Long> stdCodes = new HashSet<>();
        Map<String, ArrayList<Long>> fieldNameStdCodesMap = new HashMap<>();
        for (TaskResultVo row : task.getTableFields()) {
            fieldNameStdCodesMap.put(row.getTableField(), new ArrayList<>());
            String codeStr = row.getRecStdCode();
            if (CustomUtil.isNotEmpty(codeStr)) {
                String[] codeArray = codeStr.split(",");
                for (String code : codeArray) {
                    Long codeLong = ConvertUtil.toLong(code);
                    stdCodes.add(codeLong);
                    fieldNameStdCodesMap.get(row.getTableField()).add(codeLong);
                }
            }
        }

        // 根据推荐结果中的数据元CODE去查询数据元，主要用于补充中文名和英文名信息，放入stdMap。
        List<DataElementInfo> stdDataList = iDataElementInfoService.queryByCodes(stdCodes);
        Map<Long, DataElementInfo> stdMap = new HashMap<>();
        for (DataElementInfo row : stdDataList) {
            if (EnableDisableStatusEnum.ENABLE.equals(row.getState())) {
                stdMap.put(row.getCode(), row);
            }
        }

        // 填充推荐结果
        for (TaskResultVo row : task.getTableFields()) {
            String key = row.getTableField();
            if (fieldNameStdCodesMap.containsKey(key)) {
                List<Long> deCodes = fieldNameStdCodesMap.get(key);
                List<RecStdVo> recStdVoList = new ArrayList<>(deCodes.size());
                for (Long deCode : deCodes) {
                    RecStdVo rec = new RecStdVo();
                    if (stdMap.containsKey(deCode)) {
                        rec.setStdChName(stdMap.get(deCode).getNameCn());
                        rec.setStdEnName(stdMap.get(deCode).getNameEn());
                        rec.setStdCode(String.valueOf(deCode));
                        recStdVoList.add(rec);
                    }
                }
                row.setRecStds(recStdVoList);
            }
        }

    }

    @Override
    public Result<List<TaskVo>> queryUncompletedList(String keyword, Integer offset, Integer limit, String sort, String direction) {
        Result<List<TaskVo>> result = queryList(TaskComplatedStatusEnum.INIT.getCode(), keyword, offset, limit, sort, direction);
        if (CustomUtil.isNotEmpty(result.getData())) {
            List<Long> taskIds = new ArrayList<>();
            for (TaskVo row : result.getData()) {
                taskIds.add(row.getId());
            }

            List<TaskVo> relationList = taskStdCreateResultMapper.queryRelationStdNumber(taskIds);
            Map<Long, TaskVo> taskIdMap = new HashMap<>();
            for (TaskVo relatin : relationList) {
                taskIdMap.put(relatin.getId(), relatin);
            }

            for (TaskVo row : result.getData()) {
                Long taskId = row.getId();
                if (taskIdMap.containsKey(taskId)) {
                    TaskVo relation = taskIdMap.get(taskId);
                    row.setRelationField(relation.getRelationField());
                    row.setTotalField(relation.getTotalField());
                } else {
                    row.setRelationField(0);
                    row.setTotalField(0);
                }
            }
        }

        return result;
    }

    @Override
    public Result<List<TaskVo>> querycompletedList(String keyword, Integer offset, Integer limit, String sort, String direction) {
        return queryList(TaskComplatedStatusEnum.DONE.getCode(), keyword, offset, limit, sort, direction);
    }

    @Transactional
    @Override
    public Result stagingRelation(TaskDto taskStdCreateDto) {
        checkStagingTask(taskStdCreateDto);
        return saveStagingData(taskStdCreateDto);
    }

    private Result<Object> saveStagingData(TaskDto taskStdCreateDto) {
        Map<String, TaskResultVo> stagingMap = new HashMap<>();
        for (TaskResultVo row : taskStdCreateDto.getTableFields()) {
            stagingMap.put(row.getTableField(), row);
        }

        List<TaskResultVo> exists = taskStdCreateResultMapper.queryByTaskId(taskStdCreateDto.getId());
        List<Long> unrelations = new ArrayList<>();
        for (TaskResultVo row : exists) {
            Long id = row.getId();
            TaskResultVo stagingTask = stagingMap.get(row.getTableField());
            if (CustomUtil.isNotEmpty(stagingTask)) {
                if (CustomUtil.isNotEmpty(stagingTask.getStdCode())) {
                    TaskStdCreateResultEntity update = new TaskStdCreateResultEntity();
                    update.setId(id);
                    update.setStdCode(stagingTask.getStdCode());
                    update.setStdChName(stagingTask.getStdChName());
                    update.setStdEnName(stagingTask.getStdEnName());
                    taskStdCreateResultMapper.updateById(update);
                } else {
                    if (CustomUtil.isNotEmpty(row.getStdCode())) {
                        unrelations.add(id);
                    }
                }
            }
        }
        if (CustomUtil.isNotEmpty(unrelations)) {
            taskStdCreateResultMapper.cleanStdCode(unrelations);
        }
        return Result.success();
    }

    /**
     * 暂存和提交校验
     *
     * @param taskStdCreateDto
     */
    private void checkStagingTask(TaskDto taskStdCreateDto) {
        TaskStdCreateEntity exist = taskStdCreateMapper.queryById(taskStdCreateDto.getId());
        if (exist == null) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, "记录不存在，请确认", CheckErrorUtil.createError("id", "记录不存在"), null);
        }

        if (TaskComplatedStatusEnum.DONE.getCode().equals(exist.getStatus())) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, "任务已提交，无法保存", CheckErrorUtil.createError("id", "任务状态已提交，无法保存"), null);
        }

        if (CustomUtil.isEmpty(taskStdCreateDto.getTableFields())) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, "业务字段为空，无法保存", CheckErrorUtil.createError("tableFields", "业务字段为空，无法保存"), null);
        }

        checkStdExists(taskStdCreateDto);
        List<TaskResultVo> errorList = new ArrayList<>();
        for (TaskResultVo row : taskStdCreateDto.getTableFields()) {
            TaskResultVo temp = new TaskResultVo();
            temp.setTableField(row.getTableField());
            temp.setErrMsg(row.getErrMsg());
            if (CustomUtil.isNotEmpty(row.getErrMsg())) {
                errorList.add(temp);
            }
        }
        if (CustomUtil.isNotEmpty(errorList)) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, "数据元不存在或已被删除", errorList, null);
        }
    }

    @NotNull
    private void checkStdExists(TaskDto taskStdCreateDto) {
        Set<Long> stdCodes = new HashSet<>();
        for (TaskResultVo row : taskStdCreateDto.getTableFields()) {
            if (CustomUtil.isNotEmpty(row.getStdCode())) {
                Long code = ConvertUtil.toLong(row.getStdCode(), null);
                if (null == code) {
                    row.setErrMsg("输入格式不正确");
                } else {
                    stdCodes.add(code);
                }
            }
        }

        List<DataElementInfo> dataElements = iDataElementInfoService.queryByCodes(stdCodes);
        Map<String, DataElementInfo> dataElementInfoMap = new HashMap<>();
        for (DataElementInfo row : dataElements) {
            if (EnableDisableStatusEnum.ENABLE.equals(row.getState())) {
                dataElementInfoMap.put(String.valueOf(row.getCode()), row);
            }
        }
        for (TaskResultVo row : taskStdCreateDto.getTableFields()) {
            String code = row.getStdCode();
            if (CustomUtil.isEmpty(code) || CustomUtil.isNotEmpty(row.getErrMsg())) {
                continue;
            }
            if (dataElementInfoMap.containsKey(code)) {
                DataElementInfo dataElementInfo = dataElementInfoMap.get(code);
                row.setStdChName(dataElementInfo.getNameCn());
                row.setStdEnName(dataElementInfo.getNameEn());
            } else {
                if (CustomUtil.isEmpty(row.getErrMsg())) {
                    row.setErrMsg("数据元已被删除，请重新选择");
                }
            }
        }
    }

    private void checkSubmitTask(TaskDto taskStdCreateDto) {
        TaskStdCreateEntity exist = taskStdCreateMapper.queryById(taskStdCreateDto.getId());
        if (exist == null) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, "记录不存在，请确认", CheckErrorUtil.createError("id", "记录不存在"), null);
        }
        if (TaskComplatedStatusEnum.DONE.getCode().equals(exist.getStatus())) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, "任务状态已提交，请勿再次提交", CheckErrorUtil.createError("id", "任务状态已提交，请勿再次提交"), null);
        }

        Map<String, String> tempMap = new HashMap<>();
        for (TaskResultVo row : taskStdCreateDto.getTableFields()) {
            tempMap.put(row.getTableField(), row.getStdCode());
        }

        List<TaskResultVo> exists = taskStdCreateResultMapper.queryByTaskId(taskStdCreateDto.getId());
        for (TaskResultVo row : exists) {
            if (tempMap.containsKey(row.getTableField())) {
                row.setStdCode(tempMap.get(row.getTableField()));
            }
        }
        taskStdCreateDto.setTableFields(exists);
        checkStdExists(taskStdCreateDto);
        List<TaskResultVo> errorList = new ArrayList<>();
        for (TaskResultVo row : taskStdCreateDto.getTableFields()) {
            TaskResultVo temp = new TaskResultVo();
            temp.setTableField(row.getTableField());
            temp.setErrMsg(row.getErrMsg());
            if (CustomUtil.isNotEmpty(row.getErrMsg())) {
                errorList.add(temp);
                continue;
            }
            if (CustomUtil.isEmpty(row.getStdCode())) {
                temp.setErrMsg("请选择数据元");
                errorList.add(temp);
            }
        }
        if (CustomUtil.isNotEmpty(errorList)) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, "请选择数据元", errorList, null);
        }
    }


    @Transactional
    @Override
    public Result submitRelation(TaskDto taskStdCreateDto) {
        checkSubmitTask(taskStdCreateDto);
        saveStagingData(taskStdCreateDto);
        TaskStdCreateEntity existSource = taskStdCreateMapper.queryById(taskStdCreateDto.getId());
        TaskDto exitTask = new TaskDto();
        CustomUtil.copyProperties(existSource, exitTask);
        List<TaskResultVo> taskResultVos = taskStdCreateResultMapper.queryByTaskId(exitTask.getId());
        exitTask.setTableFields(taskResultVos);
        for (TaskResultVo row : taskResultVos) {
            List<RecStdVo> reclist = new ArrayList<>();
            RecStdVo recStdVo = new RecStdVo();
            recStdVo.setStdCode(row.getStdCode());
            recStdVo.setStdChName(row.getStdChName());
            recStdVo.setStdEnName(row.getStdEnName());
            reclist.add(recStdVo);
            row.setRecStds(reclist);
        }

        UserInfo userInfo = CustomUtil.getUser();
        TaskStdCreateEntity update = new TaskStdCreateEntity();
        update.setId(exitTask.getId());
        update.setStatus(TaskComplatedStatusEnum.DONE.getCode());
        update.setUpdateUser(userInfo.getUserName());
        update.setUpdateTime(new Date());
        UpdateWrapper<TaskStdCreateEntity> wrapper = Wrappers.update();
        wrapper.lambda()
                .eq(TaskStdCreateEntity::getId, exitTask.getId())
                .ne(TaskStdCreateEntity::getStatus, TaskComplatedStatusEnum.DONE.getCode());
        // 返回修改条数，默认20数，大于1表示修改成功，否则表示修改失败
        int rltCouont = taskStdCreateMapper.update(update, wrapper);
        if (rltCouont <= 0) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, "任务状态已提交，请勿再次提交", CheckErrorUtil.createError("id", "任务状态已提交，请勿再次提交"), null);
        }
        afStdTaskService.sendReulst2AF(exitTask.getId());
        return Result.success();
    }

    @Override
    @Transactional
    public Result createTask(CustomTaskCreateDto taskDto) {

        List<TaskStdCreateEntity> existData = taskStdCreateMapper.queryByTaskNo(taskDto.getTaskNo());
        if (CustomUtil.isNotEmpty(existData)) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, "任务id已存在", CheckErrorUtil.createError("task_no", "任务id已存在"), null);
        }

        TaskStdCreateEntity insert = new TaskStdCreateEntity();
        CustomUtil.copyProperties(taskDto, insert);

        List<CustomTbFieldDto> fieldList = taskDto.getTableFields();
        Set<String> fieldNameList = new HashSet<>(fieldList.size());
        for (CustomTbFieldDto vo : fieldList) {
            fieldNameList.add(vo.getTableField());
        }
        insert.setTableField(StringUtils.join(fieldNameList, ";"));
        UserInfo userInfo = CustomUtil.getUser();
        insert.setCreateTime(new Date());
        insert.setCreateUser(userInfo.getUserName());
        insert.setUpdateTime(new Date());
        insert.setUpdateUser(userInfo.getUserName());
        if (CustomUtil.isEmpty(insert.getStatus())) {
            insert.setStatus(TaskComplatedStatusEnum.INIT.getCode());
        }
        taskStdCreateMapper.insert(insert);
        Long id = insert.getId();
        for (CustomTbFieldDto vo : fieldList) {
            TaskStdCreateResultEntity resultEntity = new TaskStdCreateResultEntity();
            CustomUtil.copyProperties(vo, resultEntity);
            resultEntity.setTaskId(id);
            taskStdCreateResultMapper.insert(resultEntity);
        }
        return Result.success(id);
    }

}