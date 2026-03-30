package com.dsg.standardization.mapper;

import com.github.yulichang.base.MPJBaseMapper;
import com.dsg.standardization.entity.RelationDeFileEntity;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * @description:com.dsg.standardization.db.mapper 数据元-文件关系mapper
 */
public interface RelationDeFileMapper extends MPJBaseMapper<RelationDeFileEntity> {
    void deleteByFileId(@Param("fileId") Long stdFileId);

    void save(@Param("dataList") List<RelationDeFileEntity> dataList);

    List<RelationDeFileEntity> queryByFileId(@Param("fileId") Long stdFileId);
}
