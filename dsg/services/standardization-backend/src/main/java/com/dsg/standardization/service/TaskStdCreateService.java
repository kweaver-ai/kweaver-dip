package com.dsg.standardization.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.dsg.standardization.dto.CustomTaskCreateDto;
import com.dsg.standardization.dto.TaskDto;
import com.dsg.standardization.entity.TaskStdCreateEntity;
import com.dsg.standardization.vo.Result;
import com.dsg.standardization.vo.TaskVo;

import java.util.List;


/**
 * 标准创建任务表
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-12-19 17:06:34
 */
public interface TaskStdCreateService extends IService<TaskStdCreateEntity> {

    Result<List<TaskVo>> queryList(Integer status, String keyword, Integer offset, Integer limit, String sort, String direction);

    TaskVo queryById(Long id);

    Result<List<TaskVo>> queryUncompletedList(String keyword, Integer offset, Integer limit, String sort, String direction);

    Result<List<TaskVo>> querycompletedList(String keyword, Integer offset, Integer limit, String sort, String direction);

    Result stagingRelation(TaskDto taskStdCreateDto);

    Result submitRelation(TaskDto taskStdCreateDto);


    Result createTask(CustomTaskCreateDto taskDto);
}

