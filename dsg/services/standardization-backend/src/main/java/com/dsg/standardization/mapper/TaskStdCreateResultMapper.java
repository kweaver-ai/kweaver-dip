package com.dsg.standardization.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dsg.standardization.entity.TaskStdCreateResultEntity;
import org.apache.ibatis.annotations.Mapper;
import com.dsg.standardization.vo.TaskResultVo;
import com.dsg.standardization.vo.TaskVo;

import java.util.List;


/**
 * 标准创建任务结果表
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-12-20 13:39:40
 */
@Mapper
public interface TaskStdCreateResultMapper extends BaseMapper<TaskStdCreateResultEntity> {

    List<TaskVo> queryRelationStdNumber(List<Long> taskIds);

    List<TaskResultVo> queryByTaskId(Long taskId);

    void cleanStdCode(List<Long> ids);
}
