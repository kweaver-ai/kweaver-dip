package com.dsg.standardization.controller;

import com.dsg.standardization.common.annotation.AuditLog;
import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.enums.AuditLogEnum;
import com.dsg.standardization.common.enums.BusinessTableStdCreatePoolStateEnum;
import com.dsg.standardization.common.enums.ErrorCodeEnum;
import com.dsg.standardization.common.exception.CustomException;
import com.dsg.standardization.common.util.*;
import com.dsg.standardization.dto.*;
import com.dsg.standardization.vo.*;
import com.dsg.standardization.service.BusinessTableStdCreatePoolService;
import com.dsg.standardization.service.TaskStdCreateService;
import com.github.xiaoymin.knife4j.annotations.ApiOperationSupport;
import com.github.xiaoymin.knife4j.annotations.ApiSort;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.commons.lang3.StringUtils;
import org.hibernate.validator.constraints.Length;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;


/**
 * 创建标准任务
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-12-19 17:06:34
 */
@Api(tags = "创建标准任务")
@ApiSort(5)
@RestController
@RequestMapping("/v1/dataelement/task")
@Validated
public class StdCreateTaskController {
    @Autowired
    private TaskStdCreateService stdCreateTaskService;

    @Autowired
    private BusinessTableStdCreatePoolService businessTableStdCreatePoolService;

    @ApiOperation(value = "创建标准任务-未处理列表查询")
    @ApiOperationSupport(order = 1)
    @GetMapping(value = "/std-create/uncompleted")
    public Result<List<TaskVo>> getUncompletedList(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
            @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit,
            @RequestParam(value = "sort", required = false, defaultValue = "update_time") String sort,
            @RequestParam(value = "direction", required = false, defaultValue = "desc") String direction) {
        PageVo page = PageUtil.getPage(offset, limit);
        keyword= StringUtil.XssEscape(keyword);
        return stdCreateTaskService.queryUncompletedList(keyword, page.getOffset(), page.getLimit(), sort, direction);
    }

    @ApiOperation(value = "创建标准任务-已完成列表查询")
    @ApiOperationSupport(order = 2)
    @GetMapping(value = "/std-create/completed")
    public Result<List<TaskVo>> getcompletedList(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
            @RequestParam(value = "limit", required = false, defaultValue = "10000") Integer limit,
            @RequestParam(value = "sort", required = false, defaultValue = "update_time") String sort,
            @RequestParam(value = "direction", required = false, defaultValue = "desc") String direction) {
        PageVo page = PageUtil.getPage(offset, limit);
        keyword=StringUtil.XssEscape(keyword);
        return stdCreateTaskService.querycompletedList(keyword, page.getOffset(), page.getLimit(), sort, direction);
    }

    @ApiOperation(value = "创建标准任务-详情查询")
    @ApiOperationSupport(order = 3)
    @GetMapping(value = "/std-create/completed/{id}")
    public Result<TaskVo> info(@PathVariable(value = "id", required = false) Long id) {
        TaskVo vo = stdCreateTaskService.queryById(id);
        return Result.success(vo);
    }


    @ApiOperation(value = "创建标准任务-标准关联-暂存")
    @ApiOperationSupport(order = 4)
    @AuditLog(AuditLogEnum.STD_CREATE_STAGING_API)
    @PostMapping("/std-create/relation/staging")
    public Result<?> stagingRelation(@Validated @RequestBody TaskDto taskStdCreateDto) {
        return stdCreateTaskService.stagingRelation(taskStdCreateDto);

    }

    @ApiOperation(value = "创建标准任务-标准关联-提交")
    @ApiOperationSupport(order = 5)
    @AuditLog(AuditLogEnum.STD_CREATE_SUBMIT_API)
    @PostMapping("/std-create/publish/submit")
    public Result<?> submitRelation(@Validated @RequestBody TaskDto taskStdCreateDto) {
        return stdCreateTaskService.submitRelation(taskStdCreateDto);
    }

    @ApiOperation(value = "创建标准任务-添加至待新建标准接口")
    @ApiOperationSupport(order = 6)
    @AuditLog(AuditLogEnum.STD_CREATE_PINGING_API)
    @PostMapping("/addToPending")
    public Result<BusinessTableModelDto> addToPending(@Validated @RequestBody BusinessTableModelDto businessTableModelDto) {
        return businessTableStdCreatePoolService.add(businessTableModelDto);
    }

    @ApiOperation(value = "待新建标准-业务表列表查询")
    @ApiOperationSupport(order = 7)
    @GetMapping("/getBusinessTable")
    public  Result<Collection<BusinessTableTaskVo>> getBusinessTable(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "state", required = false) List<String> states,
            @RequestParam(value = "business_table_model_id") @Length(message = Message.MESSAGE_BUSINESS_TABLE_MODEL_ID, min = 36, max = 36) String businessTableModelId) {
        List<Integer> stateValues = new ArrayList<>();
        if (CustomUtil.isNotEmpty(states)) {
            stateValues = states.stream().map(i -> {
                Integer stateValue = ConvertUtil.toInt(i);
                return BusinessTableStdCreatePoolStateEnum.of(stateValue).getValue();
            }).collect(Collectors.toList());
        }
        keyword=StringUtil.XssEscape(keyword);
        return businessTableStdCreatePoolService.queryBusinessTableList(keyword, stateValues, null, businessTableModelId);
    }

    @ApiOperation(value = "待新建标准-业务表字段列表查询")
    @ApiOperationSupport(order = 8)
    @GetMapping("/getBusinessTableField")
    public Result<List<BusinessTableFieldVo>> getBusinessTableField(
            @RequestParam(value = "business_table_model_id") @Length(message = Message.MESSAGE_BUSINESS_TABLE_MODEL_ID, min = 36, max = 36) String businessTableModelId,
            @RequestParam(value = "business_table_id") @Length(message = Message.MESSAGE_BUSINESS_TABLE_ID, min = 36, max = 36) String businessTableId,
            @RequestParam(value = "state", required = false) List<String> state,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
            @RequestParam(value = "limit", required = false, defaultValue = "10000") Integer limit,
            @RequestParam(value = "sort", required = false, defaultValue = "create_time") String sort,
            @RequestParam(value = "direction", required = false, defaultValue = "desc") String direction) {
        if (!sort.equals("create_time") && !sort.equals("update_time")) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, "参数值校验不通过，sort格式错误", CheckErrorUtil.createError("sort", "参数值校验不通过，sort格式错误"), null);
        }
        if (!direction.equals("desc") && !direction.equals("asc")) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, "参数值校验不通过，direction格式错误", CheckErrorUtil.createError("direction", "参数值校验不通过，direction格式错误"), null);
        }
        BusinessTableFieldSearchDto searchDto = new BusinessTableFieldSearchDto();
        searchDto.setBusinessTableModelId(businessTableModelId);
        searchDto.setBusinessTableId(businessTableId);
        List<Integer> states = new ArrayList<>();
        if (CustomUtil.isNotEmpty(state)) {
            states = state.stream().map(i -> {
                Integer stateValue = ConvertUtil.toInt(i);
                return BusinessTableStdCreatePoolStateEnum.of(stateValue).getValue();
            }).collect(Collectors.toList());
        }
        searchDto.setState(states);
        searchDto.setKeyword(keyword);
        searchDto.setOffset(offset);
        searchDto.setLimit(limit);
        searchDto.setSort(sort);
        searchDto.setDirection(direction);
        return businessTableStdCreatePoolService.queryBusinessTableFieldList(searchDto);
    }

    @ApiOperation(value = "待新建标准-移除")
    @AuditLog(AuditLogEnum.STD_DELETE_TASK_API)
    @ApiOperationSupport(order = 9)
    @DeleteMapping("/deleteBusinessTableField/{id}")
    public Result<?> deleteBusinessTableField(@PathVariable(value = "id") Long id) {
        return businessTableStdCreatePoolService.deleteById(id);
    }

    @ApiOperation(value = "待新建标准-新建标准任务")
    @ApiOperationSupport(order = 10)
    @AuditLog(AuditLogEnum.STD_CREATE_TASK_API)
    @PostMapping("/createTask")
    public Result<?> createTask(@Validated @RequestBody StdCreateTaskDto stdCreateTaskDto) {
        return businessTableStdCreatePoolService.createTask(stdCreateTaskDto);
    }

    @ApiOperation(value = "待新建标准-撤销")
    @ApiOperationSupport(order = 11)
    @AuditLog(AuditLogEnum.STD_CANCEL_TASK_API)
    @PutMapping("/cancelBusinessTableField")
    @Transactional
    public Result<?> cancelBusinessTableField(@Validated @RequestBody List<String> ids) {
        List<Long> idsLong = new ArrayList<>();
        ids.forEach(i -> {
            CheckErrorUtil.checkPositiveLong(i, "id");
            idsLong.add(ConvertUtil.toLong(i));
        });
        return businessTableStdCreatePoolService.cancel(idsLong);
    }


    @ApiOperation(value = "标准任务-业务表列表查询")
    @ApiOperationSupport(order = 12)
    @GetMapping("/getBusinessTableFromTask")
    public Result<Collection<BusinessTableTaskVo>> getBusinessTableFromTask(
            @RequestParam(value = "task_id") @Length(message = Message.MESSAGE_BUSINESS_TASK_ID, min = 36, max = 36) String taskId,
            @RequestParam(value = "keyword", required = false) String keyword) {
        List<Integer> states = new ArrayList<>();
        states.add(BusinessTableStdCreatePoolStateEnum.CREATING.getValue());
        states.add(BusinessTableStdCreatePoolStateEnum.CREATED.getValue());
        states.add(BusinessTableStdCreatePoolStateEnum.ADOPTED.getValue());

        return businessTableStdCreatePoolService.queryBusinessTableList(keyword, states, taskId, null);
    }

    @ApiOperation(value = "标准任务-业务表字段列表查询")
    @ApiOperationSupport(order = 13)
    @GetMapping("/getBusinessTableFieldFromTask")
    public Result<List<BusinessTableFieldVo>> getBusinessTableFieldFromTask(
            @RequestParam(value = "task_id") @Length(message = Message.MESSAGE_BUSINESS_TASK_ID, min = 36, max = 36) String taskId,
            @RequestParam(value = "business_table_id") @Length(message = Message.MESSAGE_BUSINESS_TABLE_ID, min = 36, max = 36) String businessTableId,
            @RequestParam(value = "state", required = false) int state,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
            @RequestParam(value = "limit", required = false, defaultValue = "10000") Integer limit,
            @RequestParam(value = "sort", required = false, defaultValue = "update_time") String sort,
            @RequestParam(value = "direction", required = false, defaultValue = "desc") String direction) {
        if (offset < 1) {
            offset = 1;
        }
        if (limit < 1) {
            limit = 10000;
        }
        if (!sort.equals("create_time") && !sort.equals("update_time")) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, "参数值校验不通过，sort格式错误", CheckErrorUtil.createError("sort", "参数值校验不通过，sort格式错误"), null);
        }
        if (!direction.equals("desc") && !direction.equals("asc")) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, "参数值校验不通过，direction格式错误", CheckErrorUtil.createError("direction", "参数值校验不通过，direction格式错误"), null);
        }
        BusinessTableFieldSearchDto searchDto = new BusinessTableFieldSearchDto();
        searchDto.setTaskId(taskId);
        searchDto.setBusinessTableId(businessTableId);
        if (state == 1) {
            searchDto.setHaveDe(true);
        }
        if (state == 2) {
            searchDto.setHaveDe(false);
        }
        List<Integer> states = new ArrayList<>();
        states.add(BusinessTableStdCreatePoolStateEnum.CREATING.getValue());
        states.add(BusinessTableStdCreatePoolStateEnum.CREATED.getValue());
        states.add(BusinessTableStdCreatePoolStateEnum.ADOPTED.getValue());
        searchDto.setState(states);
        searchDto.setKeyword(keyword);
        searchDto.setOffset(offset);
        searchDto.setLimit(limit);
        searchDto.setSort(sort);
        searchDto.setDirection(direction);
        return businessTableStdCreatePoolService.queryBusinessTableFieldList(searchDto);
    }

    @ApiOperation(value = "标准任务-提交选定的数据元")
    @ApiOperationSupport(order = 14)
    @AuditLog(AuditLogEnum.STD_SUBMIT_TASK_API)
    @PostMapping("/submitDataElement")
    public Result<?> submitDataElement(@Validated @RequestBody SubmitDeDto submitDeDto) {
        CheckErrorUtil.checkPositiveLong(submitDeDto.getId(), "id");
        if (submitDeDto.getId().length() != 19) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, "参数值校验不通过", CheckErrorUtil.createError("ID", Message.MESSAGE_BUSINESS_ID), null);
        }
        if (StringUtils.isNotBlank(submitDeDto.getDataElementId()) && submitDeDto.getDataElementId().length() != 19) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, "参数值校验不通过", CheckErrorUtil.createError("DataElementId", Message.MESSAGE_BUSINESS_ID), null);
        }
        return businessTableStdCreatePoolService.submitDataElement(submitDeDto);
    }

    @ApiOperation(value = "标准任务-完成任务")
    @AuditLog(AuditLogEnum.STD_FINISH_TASK_API)
    @ApiOperationSupport(order = 15)
    @PostMapping("/finishTask/{task_id}")
    public Result<?> submitDataElement(@PathVariable(value = "task_id") @Length(message = Message.MESSAGE_BUSINESS_TASK_ID, min = 36, max = 36) String taskId) {
        //Todo
        return businessTableStdCreatePoolService.finishTask(taskId);
    }

    @ApiOperation(value = "标准任务-进度查询")
    @ApiOperationSupport(order = 16)
    @PostMapping("/queryTaskProcess")
    public Result<TaskProcessVo> queryTaskProcess(
            @RequestParam(value = "task_id") @Length(message = Message.MESSAGE_BUSINESS_TASK_ID, min = 36, max = 36) String taskId) {
        return businessTableStdCreatePoolService.queryTaskProcess(taskId);
    }

    @ApiOperation(value = "查询标准任务-是否处于标准化创建中")
    @ApiOperationSupport(order = 17)
    @PostMapping("/queryTaskState")
    public Result<List<BusinessTableStateVo>> queryTaskState(@Validated @RequestBody BusinessTableFieldStateDto dto) {
        List<String> states = dto.getState();
        try {
            if (CustomUtil.isNotEmpty(states)) {
                states.forEach(state -> {
                    BusinessTableStdCreatePoolStateEnum.valueOf(StringUtils.upperCase(state));
                });
            }
        } catch (Exception e) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, "参数值校验不通过", CheckErrorUtil.createError("state", "枚举转换失败"), null);
        }
        if (CustomUtil.isEmpty(dto.getBusinessTableId())) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, "参数值校验不通过", CheckErrorUtil.createError("businessTableId", "输入不能为空"), null);
        }
        if (CustomUtil.isEmpty(dto.getBusinessTableId())) {
            dto.getBusinessTableId().forEach(i -> {
                if (CustomUtil.isEmpty(i) || i.length() != 36) {
                    throw new CustomException(ErrorCodeEnum.InvalidParameter, "参数值校验不通过", CheckErrorUtil.createError("businessTableId", Message.MESSAGE_BUSINESS_TABLE_ID), null);
                }
            });
        }
        return businessTableStdCreatePoolService.queryTaskState(dto);
    }

    @ApiOperation(value = "查询标准任务-是否处于标准化创建中（内部）")
    @PostMapping("/internal/queryTaskState")
    public Result<List<BusinessTableStateVo>> queryInternalTaskState(@Validated @RequestBody BusinessTableFieldStateDto dto) {
        List<String> states = dto.getState();
        try {
            if (CustomUtil.isNotEmpty(states)) {
                states.forEach(state -> {
                    BusinessTableStdCreatePoolStateEnum.valueOf(StringUtils.upperCase(state));
                });
            }
        } catch (Exception e) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, "参数值校验不通过", CheckErrorUtil.createError("state", "枚举转换失败"), null);
        }
        if (CustomUtil.isEmpty(dto.getBusinessTableId())) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, "参数值校验不通过", CheckErrorUtil.createError("businessTableId", "输入不能为空"), null);
        }
        if (CustomUtil.isEmpty(dto.getBusinessTableId())) {
            dto.getBusinessTableId().forEach(i -> {
                if (CustomUtil.isEmpty(i) || i.length() != 36) {
                    throw new CustomException(ErrorCodeEnum.InvalidParameter, "参数值校验不通过", CheckErrorUtil.createError("businessTableId", Message.MESSAGE_BUSINESS_TABLE_ID), null);
                }
            });
        }
        return businessTableStdCreatePoolService.queryTaskState(dto);
    }

    @ApiOperation(value = "待新建标准-修改待新建标准字段说明")
    @ApiOperationSupport(order = 17)
    @AuditLog(AuditLogEnum.STD_UPDATE_DESCRIPTION_API)
    @PutMapping("/updateDescription")
    public Result<?> updateDescription(@Validated @RequestBody BusinessTableFieldDescriptionDto dto) {
        CheckErrorUtil.checkPositiveLong(dto.getId(), "id");
        if (dto.getId().length() != 19) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, "参数值校验不通过", CheckErrorUtil.createError("ID", Message.MESSAGE_BUSINESS_ID), null);
        }
        return businessTableStdCreatePoolService.updateDescription(dto);
    }

    @ApiOperation(value = "待新建标准-采纳")
    @AuditLog(AuditLogEnum.STD_ACCEPT_API)
    @ApiOperationSupport(order = 19)
    @PutMapping("/accept")
    public Result<?> accept(@Validated @RequestBody List<String> ids) {
        List<Long> idsLong = new ArrayList<>();
        ids.forEach(i -> {
            CheckErrorUtil.checkPositiveLong(i, "id");
            if (i.length() != 19) {
                throw new CustomException(ErrorCodeEnum.InvalidParameter, "参数值校验不通过", CheckErrorUtil.createError("ID", Message.MESSAGE_BUSINESS_ID), null);
            }
            idsLong.add(ConvertUtil.toLong(i));
        });
        return businessTableStdCreatePoolService.accept(idsLong);
    }

    @ApiOperation(value = "待新建标准-修改表名称")
    @ApiOperationSupport(order = 20)
    @AuditLog(AuditLogEnum.STD_UPDATE_TABLE_NAME_API)
    @PutMapping("/updateTableName")
    public Result<?> updateTableName(@Validated @RequestBody BusinessTableUpdateDto businessTableUpdateDto) {
        return businessTableStdCreatePoolService.businessTableUpdateDto(businessTableUpdateDto);
    }

}
