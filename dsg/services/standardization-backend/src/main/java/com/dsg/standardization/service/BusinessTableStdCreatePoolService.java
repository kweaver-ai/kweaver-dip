package com.dsg.standardization.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.dsg.standardization.dto.*;
import com.dsg.standardization.vo.*;
import com.dsg.standardization.dto.*;
import com.dsg.standardization.entity.BusinessTableStdCreatePoolEntity;
import com.dsg.standardization.vo.*;


import java.util.Collection;
import java.util.List;


public interface BusinessTableStdCreatePoolService extends IService<BusinessTableStdCreatePoolEntity> {
    /**
     * 添加待新建标准
     * @param businessTableModelDto
     * @return
     */
    Result<BusinessTableModelDto> add(BusinessTableModelDto businessTableModelDto);


    /**
     * 业务表列表查询
     * @param keyword
     * @param states
     * @param taskId
     * @param businessTableModelId
     * @return
     */
    Result<Collection<BusinessTableTaskVo>> queryBusinessTableList(String keyword, List<Integer> states, String taskId, String businessTableModelId);

    /**
     * 业务表字段列表查询
     * @param searchDto
     * @return
     */
    Result<List<BusinessTableFieldVo>> queryBusinessTableFieldList(BusinessTableFieldSearchDto searchDto);

    /**
     * 移除标准创建任务
     * @param id
     * @return
     */
    Result deleteById(Long id);

    /**
     * 新建标准任务
     * @param stdCreateTaskDto
     * @return
     */
    Result createTask(StdCreateTaskDto stdCreateTaskDto);

    /**
     * 撤销标准创建任务
     * @param ids
     * @return
     */
    Result cancel(List<Long> ids);


//    /**
//     * 业务表列表查询
//     * @param taskId
//     * @param keyword
//     * @return
//     */
//    Result getBusinessTableFromTask(String taskId, String keyword);

//    /**
//     * 业务表字段列表查询
//     * @param searchDto
//     * @return
//     */
//    Result getBusinessTableFieldFromTask(BusinessTableFieldSearchDto searchDto);

    /**
     * 提交选定的数据元
     * @param submitDeDto
     * @return
     */
    Result submitDataElement(SubmitDeDto submitDeDto);

    /**
     * 查询任务进度
     * @param taskId
     * @return
     */
    Result<TaskProcessVo> queryTaskProcess(String taskId);

    /**
     * 查询字段是否处于标准化创建中
     * @param dto
     * @return
     */
    Result<List<BusinessTableStateVo>> queryTaskState(BusinessTableFieldStateDto dto);

    /**
     * 修改待新建标准字段说明
     * @param dto
     * @return
     */
    Result updateDescription(BusinessTableFieldDescriptionDto dto);


    /**
     * 完成任务
     * @param taskId
     * @return
     */
    Result finishTask(String taskId);

    /**
     * 待新建标准-采纳
     * @param ids
     * @return
     */
    Result accept(List<Long> ids);

    /**
     * 待新建标准-采纳
     * @param businessTableUpdateDto
     * @return
     */
    Result businessTableUpdateDto(BusinessTableUpdateDto businessTableUpdateDto);
}

