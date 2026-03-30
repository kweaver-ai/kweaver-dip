package com.dsg.standardization.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.dsg.standardization.entity.TaskStdCreateEntity;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;


/**
 * 标准创建任务表
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-12-20 13:39:40
 */
@Mapper
public interface TaskStdCreateMapper extends BaseMapper<TaskStdCreateEntity> {
    IPage<TaskStdCreateEntity> queryList(IPage page, Integer status, String keyword);

    TaskStdCreateEntity queryById(Long id);

    List<TaskStdCreateEntity> queryByTaskNo(String taskNo);
}
