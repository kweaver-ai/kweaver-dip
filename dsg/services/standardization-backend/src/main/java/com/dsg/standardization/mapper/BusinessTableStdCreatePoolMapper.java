package com.dsg.standardization.mapper;


import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dsg.standardization.entity.BusinessTableStdCreatePoolEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Update;


@Mapper
public interface BusinessTableStdCreatePoolMapper extends BaseMapper<BusinessTableStdCreatePoolEntity> {
    @Update("UPDATE t_business_table_std_create_pool SET f_data_element_id = null where f_id = #{id}")
    int deleteDeId(Long id);

    @Update("UPDATE t_business_table_std_create_pool SET f_task_id = null, f_state = 0 where f_id = #{id}")
    int deleteTaskId(Long id);

}
