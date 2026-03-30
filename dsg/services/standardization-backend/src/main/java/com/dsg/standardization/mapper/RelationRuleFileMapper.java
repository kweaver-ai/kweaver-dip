package com.dsg.standardization.mapper;


import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dsg.standardization.entity.RelationRuleFileEntity;
import org.apache.ibatis.annotations.Param;

import java.util.List;


public interface RelationRuleFileMapper extends BaseMapper<RelationRuleFileEntity> {


    void save(@Param("relations") List<RelationRuleFileEntity> relations);

    void deleteByRuleId(@Param("ruleId") Long ruleId);

    List<RelationRuleFileEntity> queryByRuleId(@Param("ruleId") Long ruleId);

    void deleteByFileId(@Param("fileId") Long stdFileId);

    List<RelationRuleFileEntity> queryByFileId(@Param("fileId") Long stdFileId);
}
